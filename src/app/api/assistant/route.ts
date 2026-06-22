import { NextRequest, NextResponse } from "next/server";
import { portal } from "@/portal.config";
import { fetchLots, imageUrl, lotHeadline, lotPrice } from "@/lib/whitewill/client";
import { COMPLEX_OPTIONS, DEVELOPERS, type CatalogQuery, type Category } from "@/lib/whitewill/types";
import { aiException, fail, openaiHttpError } from "@/lib/portal/ai-errors";

/**
 * AI-агент подбора: LLM с tool calling поверх того же каталога.
 * Модель мапит запрос пользователя ("однушка до 60 млн в ОКО") на фильтры
 * whitewill API, получает реальные лоты и комментирует подбор.
 * Ответ роута: { message, lots[], appliedFilters } — UI рисует карточки.
 */

export const maxDuration = 60;

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
// Чат-ассистент — быстрая мини-модель (можно переопределить OPENAI_MODEL_CHAT)
const MODEL = process.env.OPENAI_MODEL_CHAT ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

const TOWER_LIST = portal.towers
  .map((t) => `- ${t.name} (id=${t.id}): ${t.tagline}`)
  .join("\n");

const SYSTEM_PROMPT = `Ты — Алиса, эксперт-консультант портала «${portal.brand.name}» по недвижимости в небоскрёбах Москва-Сити.

Башни портала:
${TOWER_LIST}

Правила:
1. Когда пользователь описывает, что ищет, ВСЕГДА вызывай инструмент search_lots, мапя запрос на фильтры. «Однушка» = 1 спальня, «двушка» = 2 спальни, «студия» = 0. Цены пользователь называет в млн ₽ — переводи в рубли.
2. Жильё — категории flat (квартиры) или apartment (апартаменты); офисы — office, торговые — retail. Если не уточнили — не передавай category.
3. Понимай НЕЧЁТКИЕ пожелания и мапь их на фильтры floor (этаж) и decoration (отделка):
   • «нижние/низкие этажи» → floorMax ~5-7; «высокие/верхние/видовые/панорамные/над городом» → floorMin ~25-30; «средние этажи» → floorMin ~8, floorMax ~20.
   • «красивый вид / видовая квартира» → ставь высокий этаж (floorMin ~25) как лучшее приближение и в комментарии скажи, что точный вид подберём с экспертом.
   • «с отделкой / под заезд / готовая / можно жить сразу» → decoration:["with_decoration"]; «без отделки / под свой ремонт / голые стены» → ["without_decoration"]; «предчистовая / white box» → ["whitebox"].
   • «новостройка / от застройщика» → isSecondary:false; «вторичка / перепродажа» → isSecondary:true.
   • «готовый дом / уже сдан / можно заехать / построен» → isBuilt:true; «строящийся / на котловане» → isBuilt:false. «сдача в 2026 / к 2027» → readinessYear:[2026].
   • застройщик по имени («от Capital Group / Донстрой / Stone») → developer (по списку id в инструменте).
   • инфраструктура/«особенности» («с паркингом / фитнесом / консьержем / коворкингом / панорамными окнами / детским садом / рестораном») → complexOption (по списку id в инструменте).
4. Чего в фильтрах НЕТ (сторона света, конкретный вид из окна, меблировка, ремонт по дизайн-проекту) — не выдумывай фильтры: учти пожелание текстом, подбери ближайшее (этаж/отделка) и предложи уточнить у эксперта.
5. После поиска коротко прокомментируй результат: сколько нашлось, что показал, какие варианты интереснее под запрос и почему. Не перечисляй лоты списком — карточки покажет интерфейс. 2-4 предложения.
6. Если ничего не нашлось — предложи ослабить бюджет/параметры и сразу сделай повторный поиск с ослабленными фильтрами.
7. Отвечай по-русски, дружелюбно и по делу. Не выдумывай цены и факты — только данные из поиска.
8. На вопросы про башни отвечай из их описаний выше; для показов и сделок предлагай оставить заявку или написать в WhatsApp/Telegram.`;

const SEARCH_TOOL = {
  type: "function",
  function: {
    name: "search_lots",
    description:
      "Поиск лотов в каталоге Москва-Сити по фильтрам. Возвращает реальные актуальные предложения.",
    parameters: {
      type: "object",
      properties: {
        deal: { type: "string", enum: ["sale", "rent"], description: "Купить или снять. По умолчанию sale." },
        category: {
          type: "string",
          enum: ["flat", "apartment", "office", "retail"],
          description: "Категория: flat=квартиры, apartment=апартаменты, office=офисы, retail=ритейл",
        },
        towers: {
          type: "array",
          items: { type: "integer" },
          description: `id башен из списка (${portal.towers.map((t) => `${t.id}=${t.name}`).join(", ")})`,
        },
        rooms: {
          type: "array",
          items: { type: "string", enum: ["0", "1", "2", "3", "4+"] },
          description: "Спальни: 0=студия",
        },
        priceMin: { type: "integer", description: "Мин. цена в РУБЛЯХ (не млн!)" },
        priceMax: { type: "integer", description: "Макс. цена в РУБЛЯХ (не млн!)" },
        areaMin: { type: "integer", description: "Мин. площадь м²" },
        areaMax: { type: "integer", description: "Макс. площадь м²" },
        decoration: {
          type: "array",
          items: { type: "string", enum: ["with_decoration", "without_decoration", "whitebox"] },
          description:
            "Отделка: with_decoration=с отделкой (под заезд/ремонт готов), without_decoration=без отделки (под свой ремонт), whitebox=White box (предчистовая)",
        },
        floorMin: { type: "integer", description: "Мин. этаж" },
        floorMax: { type: "integer", description: "Макс. этаж" },
        isSecondary: {
          type: "boolean",
          description: "true = вторичка (перепродажа), false = новостройка (от застройщика)",
        },
        isBuilt: {
          type: "boolean",
          description: "true = дом уже сдан/построен, false = ещё строится",
        },
        readinessYear: {
          type: "array",
          items: { type: "integer" },
          description: "Год сдачи комплекса (для строящихся), напр. [2026, 2027]",
        },
        developer: {
          type: "array",
          items: { type: "integer" },
          description: `id застройщиков: ${DEVELOPERS.map((d) => `${d.value}=${d.label}`).join(", ")}`,
        },
        complexOption: {
          type: "array",
          items: { type: "integer" },
          description: `id особенностей комплекса (инфраструктура): ${COMPLEX_OPTIONS.map((o) => `${o.value}=${o.label}`).join(", ")}`,
        },
        sort: {
          type: "string",
          enum: ["price_asc", "price_desc", "area_asc", "area_desc"],
        },
      },
    },
  },
};

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: string; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

type CompactLot = {
  id: number;
  headline: string;
  title: string;
  price: string;
  pricePerArea: string;
  badge: string;
  image: string | null;
};

function compactLot(card: Parameters<typeof lotHeadline>[0]): CompactLot {
  const price = lotPrice(card);
  return {
    id: card.id,
    headline: lotHeadline(card),
    title: card.title,
    price: price?.priceFormatted ?? "Цена по запросу",
    pricePerArea: price?.pricePerAreaFormatted ?? "",
    badge: card.complexTitle ?? card.address ?? card.district,
    image: card.images[0] ? imageUrl(card.images[0], 310) : null,
  };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fail(
      "assistant_not_configured",
      "Чат-ассистент не настроен: не задан ключ OPENAI_API_KEY. Добавьте его в .env.local и перезапустите сервер.",
      503,
    );
  }

  let body: { messages?: { role: "user" | "assistant"; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return fail("bad_request", "Не удалось прочитать сообщение. Обновите страницу и попробуйте снова.", 400);
  }
  const history = (body.messages ?? []).slice(-12);
  if (!history.length || history[history.length - 1].role !== "user") {
    return fail("no_user_message", "Нет сообщения от пользователя — напишите запрос.", 422);
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
  ];

  // показываем пользователю последний НЕпустой поиск (модель может сделать
  // несколько попыток: пустой результат → ослабленные фильтры)
  let lots: CompactLot[] = [];
  let total = 0;
  let appliedFilters: Partial<CatalogQuery> | null = null;
  let lastEmptyFilters: Partial<CatalogQuery> | null = null;

  try {
    // до 5 раундов tool calling (модель может несколько раз уточнить фильтры,
    // плюс нужен раунд на финальный комментарий)
    for (let round = 0; round < 5; round++) {
      const res = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          tools: [SEARCH_TOOL],
          tool_choice: "auto",
          // запас на рассуждения модели + ответ/tool-calls (700 мог обрезаться)
          max_completion_tokens: 4000,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("[assistant] openai error", res.status, errText.slice(0, 500));
        return openaiHttpError(res.status, errText, MODEL);
      }
      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) {
        return fail("llm_empty", "ИИ не дал ответа. Попробуйте ещё раз или упростите запрос.", 502);
      }

      if (msg.tool_calls?.length) {
        messages.push(msg);
        for (const tc of msg.tool_calls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments || "{}");
          } catch {
            // некорректные аргументы — ищем без фильтров
          }
          const q: CatalogQuery = {
            deal: args.deal === "rent" ? "rent" : "sale",
            category: ["flat", "apartment", "office", "retail"].includes(
              args.category as string,
            )
              ? (args.category as Category)
              : undefined,
            towers: Array.isArray(args.towers)
              ? (args.towers as number[]).filter((n) =>
                  portal.towers.some((t) => t.id === n),
                )
              : undefined,
            rooms: Array.isArray(args.rooms) ? (args.rooms as string[]) : undefined,
            priceMin: typeof args.priceMin === "number" ? args.priceMin : undefined,
            priceMax: typeof args.priceMax === "number" ? args.priceMax : undefined,
            areaMin: typeof args.areaMin === "number" ? args.areaMin : undefined,
            areaMax: typeof args.areaMax === "number" ? args.areaMax : undefined,
            decoration: Array.isArray(args.decoration)
              ? (args.decoration as string[]).filter((d) =>
                  ["with_decoration", "without_decoration", "whitebox"].includes(d),
                )
              : undefined,
            floorMin: typeof args.floorMin === "number" ? args.floorMin : undefined,
            floorMax: typeof args.floorMax === "number" ? args.floorMax : undefined,
            isSecondary: typeof args.isSecondary === "boolean" ? args.isSecondary : undefined,
            isBuilt: typeof args.isBuilt === "boolean" ? args.isBuilt : undefined,
            readinessYear: Array.isArray(args.readinessYear)
              ? (args.readinessYear as number[]).filter((n) => typeof n === "number")
              : undefined,
            developer: Array.isArray(args.developer)
              ? (args.developer as number[]).filter((n) => DEVELOPERS.some((d) => d.value === n))
              : undefined,
            complexOption: Array.isArray(args.complexOption)
              ? (args.complexOption as number[]).filter((n) =>
                  COMPLEX_OPTIONS.some((o) => o.value === n),
                )
              : undefined,
            sort: typeof args.sort === "string" ? args.sort : undefined,
            page: 1,
          };
          let toolResult: string;
          try {
            const result = await fetchLots(q, 300);
            const found = result.moscowLotCardDTOs.slice(0, 6).map(compactLot);
            if (result.total > 0 || !lots.length) {
              lots = found;
              total = result.total;
              appliedFilters = result.total > 0 ? q : appliedFilters;
            }
            if (result.total === 0) lastEmptyFilters = q;
            toolResult = JSON.stringify({
              total: result.total,
              shown: found.length,
              lots: found.map((l) => ({
                id: l.id,
                headline: l.headline,
                price: l.price,
                tower: l.badge,
              })),
            });
          } catch (e) {
            console.error("[assistant] search error", e);
            toolResult = JSON.stringify({ error: "search_failed" });
          }
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: toolResult,
          });
        }
        continue;
      }

      // финальный текстовый ответ
      return NextResponse.json({
        message: msg.content ?? "",
        lots,
        total,
        appliedFilters: appliedFilters ?? lastEmptyFilters,
      });
    }
    // исчерпали раунды — отдаём, что есть
    return NextResponse.json({
      message: total
        ? `Нашла ${total} вариантов, показала первые ${lots.length}. Уточните бюджет или башню — сузим подбор.`
        : "Не получилось завершить подбор, попробуйте переформулировать запрос.",
      lots,
      total,
      appliedFilters,
    });
  } catch (e) {
    console.error("[assistant]", e);
    return aiException(e);
  }
}
