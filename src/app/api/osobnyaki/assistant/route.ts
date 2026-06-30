import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/portal/ai-errors";
import { filtersFromAi, type ParsedSearch } from "@/lib/osobnyaki/search";

/**
 * AI-разбор «умного поиска» особняков: LLM с tool-calling маппит свободную
 * фразу пользователя ("здание под клинику до 500 млн в Хамовниках", с опечатками
 * и синонимами) на структурные фильтры каталога. Возвращает тот же формат, что
 * локальный regex-парсер (`ParsedSearch`), поэтому лендинг работает с обоими
 * одинаково и может откатиться на regex, если LLM недоступен.
 *
 * Каталог не трогаем — фильтры применяет клиент к уже загруженным лотам.
 */

export const maxDuration = 30;

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL_CHAT ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

type Facets = { districts: string[]; purposes: string[] };

function systemPrompt(facets: Facets): string {
  return `Ты — эксперт портала «Особняки» по особнякам и отдельно стоящим зданиям Москвы. Твоя задача — разобрать свободный запрос пользователя и вызвать инструмент set_search, разложив запрос на фильтры каталога. ВСЕГДА вызывай set_search ровно один раз.

Особняк — это здание целиком (не квартира), поэтому размер измеряется этажностью (floors), а не комнатами.

Доступные НАЗНАЧЕНИЯ (purpose) — выбирай ТОЛЬКО из этого списка, дословно:
${facets.purposes.map((p) => `- ${p}`).join("\n")}

Доступные РАЙОНЫ (district) — выбирай ТОЛЬКО из этого списка, дословно (учитывай падежи: «в Хамовниках» → «Хамовники»):
${facets.districts.map((d) => `- ${d}`).join("\n")}

Правила маппинга:
1. Сделка (deal): «купить/продажа/приобрести» → "sale"; «аренда/снять/в аренду» → "rent". Если не указано — не задавай.
2. Назначение (purpose): понимай синонимы и опечатки. «под ресторан/кафе/бар» → ресторан-назначение; «клиника/лечебница/стоматология/бьюти/медцентр» → медицинский; «под офис/штаб-квартиру/представительство» → офис или представительство; «под отель/гостиницу/хостел» → соответствующее; «для жизни/резиденция/усадьба/для себя» → жилой особняк. Бери максимально близкое значение ИЗ СПИСКА выше. Если ничего не подходит — оставь purpose пустым.
3. Район (district): только из списка выше; если пользователь назвал район не из списка — не выдумывай.
4. Цена: пользователь называет в млн/млрд ₽. «до 500 млн» → priceMaxMln=500; «от 300 млн» → priceMinMln=300; «1 млрд» или «около миллиарда» → priceMaxMln=1000 (или диапазон); «миллиард» = 1000 млн.
5. Этажность: «одноэтажный/двухэтажный» → floorMax; «многоэтажный/высокий» → floorMin~5. Обычно не указывается.
6. text: верни сюда только осмысленные ключевые слова, которые НЕ удалось разложить по фильтрам (например «с террасой», «с участком», «ОКН», «памятник архитектуры»). Если всё разложилось по фильтрам — оставь text пустым. Не дублируй в text то, что уже попало в purpose/district/цену.
7. Не выдумывай факты. Возвращай только структуру через set_search.`;
}

const SEARCH_TOOL = (facets: Facets) => ({
  type: "function" as const,
  function: {
    name: "set_search",
    description: "Разложить запрос пользователя на фильтры каталога особняков.",
    parameters: {
      type: "object",
      properties: {
        deal: { type: "string", enum: ["sale", "rent"], description: "Купить (sale) или снять (rent)." },
        purpose: {
          type: "array",
          items: { type: "string", enum: facets.purposes },
          description: "Назначение(я) строго из списка доступных.",
        },
        district: {
          type: "array",
          items: { type: "string", enum: facets.districts },
          description: "Район(ы) строго из списка доступных.",
        },
        priceMinMln: { type: "number", description: "Мин. цена в МИЛЛИОНАХ ₽ (1 млрд = 1000)." },
        priceMaxMln: { type: "number", description: "Макс. цена в МИЛЛИОНАХ ₽ (1 млрд = 1000)." },
        floorMin: { type: "integer", description: "Мин. этажность здания." },
        floorMax: { type: "integer", description: "Макс. этажность здания." },
        text: { type: "string", description: "Неразложимые ключевые слова для полнотекстового поиска (или пусто)." },
      },
    },
  },
});

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // ключа нет — клиент откатится на локальный regex-парсер
    return fail("assistant_not_configured", "AI-поиск не настроен (нет OPENAI_API_KEY).", 503);
  }

  let body: { query?: string; facets?: Facets };
  try {
    body = await req.json();
  } catch {
    return fail("bad_request", "Не удалось прочитать запрос.", 400);
  }
  const query = (body.query ?? "").trim();
  const facets: Facets = {
    districts: body.facets?.districts ?? [],
    purposes: body.facets?.purposes ?? [],
  };
  if (!query) return fail("empty_query", "Пустой запрос.", 422);
  if (!facets.purposes.length && !facets.districts.length) {
    return fail("no_facets", "Каталог ещё не загружен.", 422);
  }

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt(facets) },
          { role: "user", content: query },
        ],
        tools: [SEARCH_TOOL(facets)],
        tool_choice: { type: "function", function: { name: "set_search" } },
        max_completion_tokens: 2000,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[osobnyaki-assistant] openai error", res.status, errText.slice(0, 400));
      return fail("llm_http", "AI-поиск временно недоступен.", 502);
    }
    const data = await res.json();
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(tc?.function?.arguments ?? "{}");
    } catch {
      /* кривые аргументы — отдадим полнотекст по исходному запросу */
    }
    const parsed: ParsedSearch = filtersFromAi(
      {
        deal: typeof args.deal === "string" ? args.deal : null,
        purpose: Array.isArray(args.purpose) ? (args.purpose as string[]) : [],
        district: Array.isArray(args.district) ? (args.district as string[]) : [],
        priceMinMln: typeof args.priceMinMln === "number" ? args.priceMinMln : null,
        priceMaxMln: typeof args.priceMaxMln === "number" ? args.priceMaxMln : null,
        floorMin: typeof args.floorMin === "number" ? args.floorMin : null,
        floorMax: typeof args.floorMax === "number" ? args.floorMax : null,
        text: typeof args.text === "string" ? args.text : null,
      },
      facets,
      query,
    );
    return NextResponse.json(parsed);
  } catch (e) {
    console.error("[osobnyaki-assistant] exception", e);
    return fail("llm_exception", "AI-поиск временно недоступен.", 502);
  }
}
