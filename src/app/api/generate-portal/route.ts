import { NextRequest, NextResponse } from "next/server";
import { sanitizeSchema } from "@/lib/portal/validate";
import { savePortal } from "@/lib/portal/store";
import { BLOCK_TYPES } from "@/lib/portal/registry";
import { DEFAULT_THEME } from "@/lib/portal/schema";

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
- hero: { kicker, title, subtitle, image, overlay } — первый экран. overlay (0–100) — сила затемнения/«тумана» поверх фото: 0 = фото чистое, 100 = полностью затемнено (умолч. 70). Уменьшай overlay, если просят сделать картинку светлее/виднее.
- city3d: { title } — 3D-карта района (тяжёлый блок, только для Москва-Сити)
- towers: { title } — полоса башен/ЖК
- lotsGrid: { title, subtitle, limit } — сетка объектов (ядро, почти всегда нужен)
- about: { title, paragraphs:[string], stats:[{value,label}] }
- faq: { title, items:[{q,a}] }
- cta: { title, subtitle, buttonLabel }
- custom: УНИВЕРСАЛЬНЫЙ блок-конструктор. Используй его для ЧЕГО УГОДНО, чего нет в списке выше (любые секции: преимущества, этапы, цифры, цитаты, баннеры, текст с картинками, колонки и т.п.). Пропсы: { title?, subtitle?, background? (CSS-фон секции), padding? ("none"|undefined), elements:[Element] }. Element — это примитив, собери из них любую вёрстку:
  • { kind:"heading", text, level:1..4, align:"left|center|right" }
  • { kind:"text", text, align? }
  • { kind:"image", src, alt?, height? (px) }
  • { kind:"button", label, href?, style:"primary|outline", align? }
  • { kind:"divider" }
  • { kind:"spacer", size? (px) }
  • { kind:"columns", columns:[[Element],[Element],...] } — несколько колонок, в каждой массив элементов
  • { kind:"html", html } — произвольный HTML (можно inline-стили; <script> и обработчики событий вырезаются)
  Элементы наследуют тему портала (заголовки — акцентным шрифтом, кнопки — цвет gold). Можно много custom-блоков в любом порядке.

Тема (theme) — это CSS-цвета в формате oklch(...) и radius. Подбирай палитру под бриф: тёмная/светлая/яркая. Ключи: ink (фон), inkSoft, inkLine, paper (текст), paperSoft, gold (акцент), goldDeep, muted, radius.

scope: { deal: "sale"|"rent", towers:[id] } — id башен из списка: ${KNOWN_TOWERS}.

card (необязательно) — оформление карточки портала в секции «Проекты Whitewill» на главной. Это только фотокарточка, поля (все необязательны):
- image: URL фоновой фотографии карточки
- logo: URL логотипа, который показывается по центру (вместо названия)
- logoSize: размер логотипа на карточке — "s" (маленький), "m" (средний, по умолчанию) или "l" (большой)
- subtitle: подпись-дескриптор под названием, напр. «Портал элитных новостроек Москвы»
Меняй card, когда пользователь просит изменить карточку/превью/обложку/подпись/логотип на главной. Цвета и шрифт карточки не настраиваются. Если поле не меняется — сохраняй прежнее значение из текущего портала.

Структуру (какие блоки и в каком порядке) выбирай по смыслу брифа: минималистичный портал = hero + lotsGrid + cta; премиальный с 3D = hero + city3d + towers + lotsGrid + about + cta.

Верни СТРОГО JSON-объект PortalSchema: { name, slug, brand:{name,logo:[a,b],phone,phoneHref,email,whatsapp,telegram}, theme:{...}, scope:{...}, blocks:[{id,type,props}], card:{...} }. Без markdown, без комментариев.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "generator_not_configured" }, { status: 503 });
  }

  let brief = "";
  let base: unknown = null;
  try {
    const body = await req.json();
    brief = body.brief ?? "";
    base = body.base ?? null; // текущая схема портала → режим редактирования
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (!brief.trim()) {
    return NextResponse.json({ error: "empty_brief" }, { status: 422 });
  }

  // В режиме редактирования даём модели текущий портал и просим изменить его
  // по инструкции, сохраняя slug и осмысленные блоки; иначе — создаём с нуля.
  const userContent = base
    ? `Текущий портал (JSON):\n${JSON.stringify(base)}\n\nИнструкция по изменению: ${brief}\n\nВерни ПОЛНУЮ обновлённую схему того же портала (тот же slug), применив изменения и сохранив остальное.`
    : brief;

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
        max_completion_tokens: 2000,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[generate-portal] openai error", res.status, errText.slice(0, 500));
      return NextResponse.json({ error: "llm_error" }, { status: 502 });
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return NextResponse.json({ error: "llm_empty" }, { status: 502 });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "llm_bad_json" }, { status: 502 });
    }

    const schema = sanitizeSchema(parsed);
    // гарантируем тему, если модель прислала пустую
    if (!schema.theme.ink) schema.theme = DEFAULT_THEME;

    if (base && typeof base === "object") {
      // режим правки: фиксируем slug исходного портала, не сохраняем —
      // изменения вернутся в редактор, пользователь решит, сохранять ли
      const baseObj = base as { slug?: string; card?: unknown };
      if (baseObj.slug) schema.slug = baseObj.slug;
      // если модель не вернула card, но он был — не теряем оформление карточки
      if (!schema.card && baseObj.card) {
        const merged = sanitizeSchema({ ...schema, card: baseObj.card });
        schema.card = merged.card;
      }
      return NextResponse.json({ slug: schema.slug, schema, mode: "edit" });
    }

    // режим создания: сохраняем сразу и ведём в редактор
    await savePortal(schema);
    return NextResponse.json({ slug: schema.slug, schema, mode: "create" });
  } catch (e) {
    console.error("[generate-portal]", e);
    return NextResponse.json({ error: "generator_error" }, { status: 500 });
  }
}
