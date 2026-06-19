import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getHomeOverrides, saveHomeOverrides } from "@/lib/portal/home-store";
import { sanitizeOverrides, SECTION_KEYS, SECTION_ANCHORS } from "@/lib/portal/home-overrides";

/**
 * ИИ-правка главной (зеркала whitewill.ru). Бриф на естественном языке →
 * декларативные оверрайды (text/hide/css/inject), которые route.ts применяет
 * поверх снимка. Сам HTML зеркала не редактируется.
 */

export const maxDuration = 60;

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
// ИИ-правка главной — та же модель генерации, что и порталы (override: OPENAI_MODEL_GENERATE)
const MODEL = process.env.OPENAI_MODEL_GENERATE ?? process.env.OPENAI_MODEL ?? "gpt-5.2";
const MIRROR = path.join(process.cwd(), "src", "mirror", "whitewill-index.html");

/** Достаём заметные тексты главной — чтобы ИИ знал точные строки для замены. */
async function textDigest(): Promise<string[]> {
  let html = "";
  try {
    html = await readFile(MIRROR, "utf8");
  } catch {
    return [];
  }
  const body = html.slice(html.indexOf("<body"));
  const out = new Set<string>();
  const grab = (re: RegExp) => {
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const t = m[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
      if (t && t.length >= 3 && t.length <= 120) out.add(t);
    }
  };
  grab(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi);
  grab(/class="[^"]*(?:title|subtitle)[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/gi);
  return [...out].slice(0, 60);
}

const SYSTEM_PROMPT = `Ты редактируешь главную страницу сайта Whitewill (зеркало whitewill.ru). Ты НЕ переписываешь HTML, а возвращаешь список декларативных правок (оверрайдов), которые применяются поверх страницы.

Верни СТРОГО JSON: { "edits": [ ... ] }. Каждый edit — один из:
- { "op":"text", "from":"<точная текущая строка на странице>", "to":"<новый текст>" } — заменить видимый текст. from должен ТОЧНО совпадать со строкой на странице (бери из списка ниже или из запроса пользователя).
- { "op":"hide", "section":"<ключ секции>" } — скрыть секцию.
- { "op":"css", "css":"<любой CSS>" } — добавить стили (цвета, шрифты, отступы и т.п.). Можно менять оформление через селекторы классов.
- { "op":"inject", "section":"<ключ секции>", "position":"before|after|top|bottom", "html":"<HTML фрагмент>" } — вставить блок. top/bottom = в начало/конец страницы; before/after = до/после секции. HTML без <script> (вырежется).

Ключи секций: ${SECTION_KEYS.join(", ")}.

Карта селекторов (для ТОЧНОГО op:"css", чтобы менять именно нужный элемент):
- Карточки проектов в секции «Проекты»: .ww-pcard — сама карточка; .ww-pcard__cover — ФОНОВОЕ фото; .ww-pcard__logo — логотип по центру; .ww-pcard__title — название (если без логотипа); .ww-pcard__sub — подпись.
  → «увеличить логотип, не трогая фон» = .ww-pcard__logo { max-width:90% !important; max-height:60% !important; } (НЕ трогай .ww-pcard__cover и не используй общий селектор img).
- Секции имеют классы-якоря: ${Object.entries(SECTION_ANCHORS).map(([k, c]) => `${k}=.${c}`).join(", ")}.

Правила:
- Меняй РОВНО то, что просят. Не используй широкие селекторы (img, a, *, section), если просят изменить один элемент — бери самый узкий класс из карты выше. Если просят «не трогать фон» — селектор НЕ должен задевать .ww-pcard__cover.
- В CSS используй !important, т.к. у элементов бывают inline-стили.
- Для смены текста ВСЕГДА используй op:"text" с точной строкой from.
- Возвращай ПОЛНЫЙ итоговый список edits (уже применённые + новые) — его сохраняют целиком; не удаляй прежние правки, если об этом не просят.
- Без markdown, без комментариев — только JSON.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "generator_not_configured" }, { status: 503 });
  }

  let brief = "";
  try {
    const body = await req.json();
    brief = body.brief ?? "";
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (!brief.trim()) {
    return NextResponse.json({ error: "empty_brief" }, { status: 422 });
  }

  const [current, digest] = await Promise.all([getHomeOverrides(), textDigest()]);
  const userContent = `Уже применённые правки (JSON):\n${JSON.stringify(current)}\n\nЗаметные тексты на странице (для точных op:"text".from):\n${digest.map((t) => `• ${t}`).join("\n")}\n\nЗапрос пользователя: ${brief}\n\nВерни полный итоговый список edits.`;

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
      console.error("[generate-home] openai error", res.status, errText.slice(0, 500));
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

    const overrides = sanitizeOverrides(parsed);
    await saveHomeOverrides(overrides);
    return NextResponse.json({ ok: true, overrides });
  } catch (e) {
    console.error("[generate-home]", e);
    return NextResponse.json({ error: "generator_error" }, { status: 500 });
  }
}

/** Сброс всех правок главной. */
export async function DELETE() {
  await saveHomeOverrides({ edits: [] });
  return NextResponse.json({ ok: true });
}
