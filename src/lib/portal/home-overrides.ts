/**
 * Оверрайды главной (зеркала whitewill.ru) — слой ИИ-правок поверх статичного
 * снимка. Сам HTML не трогаем; вместо этого храним декларативные правки и
 * применяем их при отдаче в route.ts. Так главную можно менять промптом, не
 * редактируя 985 КБ разметки.
 *
 * Pure-функции (без fs) — можно импортировать и на сервере, и в типах админки.
 */

export type HomeOverride =
  | { op: "text"; from: string; to: string }
  | { op: "hide"; section: string }
  | { op: "css"; css: string }
  | { op: "inject"; section: string; position: "before" | "after" | "top" | "bottom"; html: string };

export type HomeOverrides = {
  /** список правок, применяются по порядку */
  edits: HomeOverride[];
};

export const EMPTY_OVERRIDES: HomeOverrides = { edits: [] };

/** Ключ секции → класс-якорь в разметке зеркала. */
export const SECTION_ANCHORS: Record<string, string> = {
  cookie: "cookie-block",
  header: "header",
  hero: "first-screen",
  tiles: "tile-categories",
  leadCards: "lead-cards",
  offers: "best-offers",
  catalog: "catalog-carousel",
  awards: "awards-main",
  testimonials: "testimonials",
  quality: "form-block",
  projects: "projects",
  office: "office",
  partner: "partner-banner",
  blog: "news-main",
  news: "news-main",
  contacts: "main-contacts",
  footer: "footer",
};

export const SECTION_KEYS = Object.keys(SECTION_ANCHORS);

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Санитайз произвольного HTML-фрагмента: без скриптов/обработчиков/js-ссылок. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}

/** Санитайз CSS: режем закрытие <style>, expression(), @import, js-url. */
function sanitizeCss(css: string): string {
  return css
    .replace(/<\s*\/?\s*style/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/@import[^;]+;?/gi, "")
    .replace(/url\s*\(\s*["']?\s*javascript:[^)]*\)/gi, "url(#)");
}

/** Найти открывающий тег секции по классу-якорю → [start, end-of-section]. */
function findSection(html: string, cls: string): { open: number; afterClose: number } | null {
  const anchor = html.indexOf(`class="${cls}`);
  if (anchor < 0) return null;
  const tagStart = html.lastIndexOf("<", anchor);
  if (tagStart < 0) return null;
  // имя тега (div/section/...)
  const tagName = (html.slice(tagStart + 1).match(/^[a-zA-Z0-9]+/) || [""])[0];
  if (!tagName) return null;
  const openRe = new RegExp(`<\\/?${tagName}\\b`, "g");
  openRe.lastIndex = tagStart;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(html))) {
    depth += m[0][1] === "/" ? -1 : 1;
    if (depth === 0) {
      const close = html.indexOf(">", openRe.lastIndex) + 1;
      return { open: tagStart, afterClose: close };
    }
  }
  return null;
}

/**
 * Применить оверрайды к HTML зеркала. Возвращает изменённый HTML.
 * Все вставки/CSS проходят санитайз; текстовые замены экранируются.
 */
export function applyHomeOverrides(html: string, ov: HomeOverrides | null | undefined): string {
  if (!ov?.edits?.length) return html;

  const bodyStart = html.indexOf("<body");
  const head = bodyStart > 0 ? html.slice(0, bodyStart) : "";
  let body = bodyStart > 0 ? html.slice(bodyStart) : html;

  const styleParts: string[] = [];

  for (const e of ov.edits) {
    if (e.op === "text" && e.from) {
      body = body.split(e.from).join(escHtml(e.to ?? ""));
    } else if (e.op === "hide") {
      const cls = SECTION_ANCHORS[e.section] || e.section;
      styleParts.push(`.${cls}{display:none!important}`);
    } else if (e.op === "css" && e.css) {
      styleParts.push(sanitizeCss(e.css));
    } else if (e.op === "inject" && e.html) {
      const frag = sanitizeHtml(e.html);
      if (e.position === "top") {
        body = body.replace(/<main[^>]*>/i, (m) => `${m}${frag}`);
      } else if (e.position === "bottom") {
        body = body.replace(/<\/main>/i, `${frag}</main>`);
      } else {
        const cls = SECTION_ANCHORS[e.section] || e.section;
        const pos = findSection(body, cls);
        if (pos) {
          body =
            e.position === "before"
              ? body.slice(0, pos.open) + frag + body.slice(pos.open)
              : body.slice(0, pos.afterClose) + frag + body.slice(pos.afterClose);
        }
      }
    }
  }

  if (styleParts.length) {
    body = body.replace(/<\/body>/i, `<style>${styleParts.join("\n")}</style></body>`);
  }
  return head + body;
}

/** Санитайз входа (ответ ИИ/форма) → валидный HomeOverrides. */
export function sanitizeOverrides(input: unknown): HomeOverrides {
  const edits: HomeOverride[] = [];
  const list = (input as { edits?: unknown })?.edits;
  if (Array.isArray(list)) {
    for (const raw of list) {
      const e = raw as Record<string, unknown>;
      const op = typeof e.op === "string" ? e.op : "";
      if (op === "text" && typeof e.from === "string") {
        edits.push({ op, from: e.from, to: typeof e.to === "string" ? e.to : "" });
      } else if (op === "hide" && typeof e.section === "string") {
        edits.push({ op, section: e.section });
      } else if (op === "css" && typeof e.css === "string") {
        edits.push({ op, css: e.css });
      } else if (
        op === "inject" &&
        typeof e.html === "string" &&
        ["before", "after", "top", "bottom"].includes(String(e.position))
      ) {
        edits.push({
          op,
          section: typeof e.section === "string" ? e.section : "main",
          position: e.position as "before" | "after" | "top" | "bottom",
          html: e.html,
        });
      }
    }
  }
  return { edits };
}
