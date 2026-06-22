import { NextRequest, NextResponse } from "next/server";
import { sanitizeSchema } from "@/lib/portal/validate";
import { savePortal } from "@/lib/portal/store";
import { BLOCK_TYPES } from "@/lib/portal/registry";
import { DEFAULT_THEME } from "@/lib/portal/schema";
import { aiException, fail, openaiHttpError, parseJsonLoose } from "@/lib/portal/ai-errors";

/**
 * AI-генератор портала (KRE-123): бриф на естественном языке → PortalSchema.
 * Модель ограничена реестром блоков и темой; результат прогоняется через
 * sanitizeSchema (неизвестные блоки выкидываются) и сохраняется в store.
 * Тот же провайдер/ключ, что в api/assistant (OpenAI).
 */

export const maxDuration = 60;

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
// ИИ-генерация/правка порталов — более сильная модель (override: OPENAI_MODEL_GENERATE)
const MODEL = process.env.OPENAI_MODEL_GENERATE ?? process.env.OPENAI_MODEL ?? "gpt-5.2";

// известные complex_id (docs/API.md) — даём модели, чтобы scope был осмысленным
const KNOWN_TOWERS = `1=Capital Towers, 104=Neva Towers, 107=ОКО, 115=Федерация, 558=Город Столиц, 503=Империя, 69=Дом Дау`;

const SYSTEM_PROMPT = `Ты — генератор порталов недвижимости Whitewill. По брифу пользователя ты возвращаешь JSON-схему портала.

Доступные типы блоков (используй только их, в любом порядке и количестве):
${BLOCK_TYPES.join(", ")}
- hero: { kicker, title, subtitle, image, overlay, ctaLabel, ctaHref } — первый экран. ctaLabel — текст главной кнопки, ctaHref — её ссылка (URL). overlay (0–100) — сила затемнения/«тумана» поверх фото: 0 = фото чистое, 100 = полностью затемнено (умолч. 70). Уменьшай overlay, если просят сделать картинку светлее/виднее.
- city3d: { title, camera?, colors? } — 3D-карта района (тяжёлый блок, только для Москва-Сити). camera (необязательно): { azimuth (горизонтальный угол в радианах, ~ -3.14..3.14), elevation (0..1 — удаление/высота камеры), autoRotate (true/false — медленный автоповорот) }. colors (необязательно, иначе наследуются из темы): { background (фон/земля), building (застройка), tower (башни), accent (грани/свет), accentDeep (свечение) } — CSS-цвета (oklch/hex).
- towers: { title } — полоса башен/ЖК (устар., предпочитай data c source:"complexes")
- lotsGrid: { title, subtitle, limit } — сетка объектов (устар., предпочитай data c source:"lots")
- catalog: { title?, subtitle? } — интерактивный каталог объектов с УМНЫМ ПОИСКОМ и фильтрами (сделка, категория, башня, цена, площадь, спальни, сортировка) + пагинация. Бери его, когда нужен полноценный поиск/подбор лотов на портале (а не просто витрина). Башни фильтра берутся из scope портала.
- data: УНИВЕРСАЛЬНЫЙ блок «источник данных × вид». Бери его, когда нужно показать объекты/комплексы в любом виде. Пропсы: { title?, subtitle?, source:"lots"|"complexes", view:"cards"|"list"|"table"|"carousel"|"single", sort?:"default|price_asc|price_desc|area_asc|area_desc", limit? (0=все; для single берётся первый), fields?:{image,title,subtitle,price,badge}, columns?:[ключи полей — для view:"table"] }.
  • source "lots" поля: image,title,subtitle,price,pricePerArea,area,district,badge,metro,floor
  • source "complexes" поля: image,title,subtitle,price,district,kind,badge
  • fields маппит «слот карточки» → «ключ поля источника» (можно опустить — есть разумные дефолты). Пример: каталог квартир таблицей = { source:"lots", view:"table", columns:["title","area","price","metro"] }; лента ЖК каруселью = { source:"complexes", view:"carousel" }.
- about: { title, paragraphs:[string], stats:[{value,label}] }
- faq: { title, items:[{q,a}] }
- cta: { title, subtitle, buttonLabel, buttonHref } — buttonHref: ссылка кнопки (URL; по умолч. whatsapp бренда)
- custom: УНИВЕРСАЛЬНЫЙ блок-конструктор. Используй его для ЧЕГО УГОДНО, чего нет в списке выше (преимущества, этапы, цифры, цитаты, баннеры, текст с картинками, колонки и т.п.). Пропсы: { title?, subtitle?, background?, padding? ("none"|undefined), elements:[Element] }.
  background — ТОКЕН фона (НЕ произвольный CSS): "" (прозрачный) | "soft" (мягкий) | "ink" (тёмный) | "accent" (акцент). Только эти значения.
  Element — структурный примитив. ПРЕДПОЧИТАЙ структурные примитивы; стиль задавай ТОКЕНАМИ (color/align/level), а не CSS:
  • { kind:"heading", text, level:1..4, align:"left|center|right", color?:"accent|muted|paper", weight?:"light|medium|semibold|bold", italic?:true, uppercase?:true }
  • { kind:"text", text, align?, color?:"accent|muted|paper", weight?:"light|medium|semibold|bold", italic?:true, uppercase?:true }
  • { kind:"stat", value, label } — крупная цифра с подписью (для блоков статистики)
  • { kind:"quote", text, author? } — цитата
  • { kind:"image", src, alt?, height? (px) }
  • { kind:"button", label, href?, style:"primary|outline", align? }
  • { kind:"divider" }
  • { kind:"spacer", size? (px) }
  • { kind:"columns", columns:[[Element],[Element],...] } — несколько колонок, в каждой массив элементов
  • { kind:"html", html } — ТОЛЬКО на крайний случай, когда структурными примитивами не выразить. По умолчанию НЕ используй: такой блок не редактируется человеком в админке.
  Элементы наследуют тему портала. Можно много custom-блоков в любом порядке.

У ЛЮБОГО блока может быть необязательное поле "css" (строка) — произвольный CSS, который движок САМ ограничивает этой секцией (оборачивает в #b-<id>). Это аварийный люк ТОЛЬКО для того, чего не выразить настройками/токенами блока (например, очень специфичная микро-вёрстка под конкретный запрос). По умолчанию НЕ добавляй "css" — предпочитай токены и структурные пропсы; человек редактирует css вручную в «Расширенных настройках».

Тема (theme) — это CSS-цвета в формате oklch(...) и radius. Подбирай палитру под бриф: тёмная/светлая/яркая. Ключи: ink (фон), inkSoft, inkLine, paper (текст), paperSoft, gold (акцент), goldDeep, muted, radius. Плюс шрифты: fontDisplay (заголовки) и fontBody (основной текст) — ключи из набора: с засечками — "prata" (по умолч. заголовки), "playfair", "cormorant", "lora"; без засечек — "manrope" (по умолч. текст), "inter", "montserrat", "golos". Подбирай под стиль (премиум/классика → с засечками, современный → без засечек). МОЖНО подключить свой шрифт: theme.fontUrl = https-ссылка на CSS со шрифтами (напр. Google Fonts "https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600&display=swap"), а в fontDisplay/fontBody укажи имя семейства как в CSS ("Roboto Slab"). Используй это только если из брифа явно нужен конкретный шрифт, которого нет в наборе.

scope: { deal: "sale"|"rent", towers:[id] } — id башен из списка: ${KNOWN_TOWERS}.

brand — то, что видно в шапке/подвале портала и в кнопках связи: { name (название в подвале «© …»), logo:[a,b] (логотип в шапке: a — акцентным цветом, b — обычным), phone и phoneHref (телефон в шапке; phoneHref вида "tel:+74952550161"), email, whatsapp (ссылка вида "https://wa.me/..."), telegram }. Меняй brand, когда просят сменить логотип/название/телефон/контакты портала.

card (необязательно) — оформление карточки портала в секции «Проекты Whitewill» на главной. Это только фотокарточка, поля (все необязательны):
- image: URL фоновой фотографии карточки
- logo: URL логотипа, который показывается по центру (вместо названия)
- logoSize: размер логотипа на карточке — "s" (маленький), "m" (средний, по умолчанию) или "l" (большой)
- subtitle: подпись-дескриптор под названием, напр. «Портал элитных новостроек Москвы»
Меняй card, когда пользователь просит изменить карточку/превью/обложку/подпись/логотип на главной. Цвета и шрифт карточки не настраиваются. Если поле не меняется — сохраняй прежнее значение из текущего портала.

Структуру (какие блоки и в каком порядке) выбирай по смыслу брифа: минималистичный портал = hero + lotsGrid + cta; премиальный с 3D = hero + city3d + towers + lotsGrid + about + cta.

Верни СТРОГО JSON-объект вида { "message": string, "schema": PortalSchema }. Без markdown, без комментариев.
- "message" — короткий дружелюбный ответ на русском (1–3 предложения) о том, ЧТО ты изменил и почему: перечисли конкретные правки («сделал тему тёмно-зелёной, добавил блок FAQ, заменил сетку на таблицу»). Если бриф непонятен или невыполним — вежливо скажи об этом в message и верни schema без изменений.
- "schema" — полная PortalSchema: { name, slug, brand:{name,logo:[a,b],phone,phoneHref,email,whatsapp,telegram}, theme:{...}, scope:{...}, blocks:[{id,type,props,css?}], card:{...} }.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fail(
      "generator_not_configured",
      "ИИ-генератор не настроен: не задан ключ OPENAI_API_KEY. Добавьте его в .env.local и перезапустите сервер.",
      503,
    );
  }

  let brief = "";
  let base: unknown = null;
  try {
    const body = await req.json();
    brief = body.brief ?? "";
    base = body.base ?? null; // текущая схема портала → режим редактирования
  } catch {
    return fail("bad_request", "Не удалось прочитать запрос. Обновите страницу и попробуйте снова.", 400);
  }
  if (!brief.trim()) {
    return fail("empty_brief", "Опишите, что нужно сделать — текст запроса пустой.", 422);
  }

  // В режиме редактирования даём модели текущий портал и просим изменить его
  // по инструкции, сохраняя slug и осмысленные блоки; иначе — создаём с нуля.
  const userContent = base
    ? `Текущий портал (JSON):\n${JSON.stringify(base)}\n\nИнструкция по изменению: ${brief}\n\nОтветь в формате { "message": ..., "schema": ... } (как описано в системном промпте). В "schema" положи ПОЛНУЮ обновлённую схему портала: примени изменения и сохрани остальное без потерь. slug (адрес портала) оставь ПРЕЖНИМ — меняй его, только если пользователь явно просит сменить адрес/ссылку портала.`
    : `${brief}\n\nОтветь строго в формате { "message": ..., "schema": ... } из системного промпта.`;

  // ограничиваем ожидание модели, чтобы не висеть до самого maxDuration
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55_000);
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        // ответ = message + ПОЛНАЯ схема портала; на больших порталах 2000 не
        // хватало и JSON обрывался (llm_bad_json), поэтому даём щедрый запас
        max_completion_tokens: 16000,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[generate-portal] openai error", res.status, errText.slice(0, 500));
      return openaiHttpError(res.status, errText, MODEL);
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      return fail("llm_empty", "ИИ не дал ответа. Попробуйте ещё раз или упростите запрос.", 502);
    }

    let parsed: unknown;
    try {
      parsed = parseJsonLoose(raw);
    } catch {
      return fail(
        "llm_bad_json",
        "ИИ вернул ответ в неожиданном формате. Попробуйте переформулировать запрос короче и конкретнее.",
        502,
        `Ответ модели не распарсился как JSON. Начало ответа: ${String(raw).slice(0, 200)}`,
      );
    }

    // модель возвращает { message, schema }; на всякий случай поддержим и «голую» схему
    const wrapper = (parsed && typeof parsed === "object" ? parsed : {}) as {
      message?: unknown;
      schema?: unknown;
    };
    const message = typeof wrapper.message === "string" ? wrapper.message : null;
    const schemaInput = wrapper.schema && typeof wrapper.schema === "object" ? wrapper.schema : parsed;

    const schema = sanitizeSchema(schemaInput);
    // гарантируем тему, если модель прислала пустую
    if (!schema.theme.ink) schema.theme = DEFAULT_THEME;

    if (base && typeof base === "object") {
      // режим правки: фиксируем slug исходного портала, не сохраняем —
      // изменения вернутся в редактор, пользователь решит, сохранять ли
      const baseObj = base as { slug?: string; card?: unknown };
      // slug меняем только если модель ЯВНО вернула непустой slug (значит пользователь
      // просил сменить адрес); иначе сохраняем исходный — без случайного переименования
      const rawSlug = (schemaInput as { slug?: unknown } | null)?.slug;
      if (baseObj.slug && !(typeof rawSlug === "string" && rawSlug.trim())) {
        schema.slug = baseObj.slug;
      }
      // если модель не вернула card, но он был — не теряем оформление карточки
      if (!schema.card && baseObj.card) {
        const merged = sanitizeSchema({ ...schema, card: baseObj.card });
        schema.card = merged.card;
      }
      return NextResponse.json({ slug: schema.slug, schema, message, mode: "edit" });
    }

    // режим создания: сохраняем сразу и ведём в редактор
    await savePortal(schema);
    return NextResponse.json({ slug: schema.slug, schema, message, mode: "create" });
  } catch (e) {
    console.error("[generate-portal]", e);
    return aiException(e);
  } finally {
    clearTimeout(timer);
  }
}
