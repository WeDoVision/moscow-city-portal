/**
 * Пресеты шрифтов для оформления (карточка портала на главной, заголовки).
 * Ключи стабильны и хранятся в схеме; CSS-переменные подключаются в layout
 * через next/font. Модуль без серверных зависимостей — можно импортировать
 * и в клиентском редакторе, и в серверных компонентах.
 */

export type FontOption = {
  key: string;
  label: string;
  /** значение для CSS font-family */
  css: string;
};

/**
 * css — для рендера через next/font (CSS-переменная). Реальное имя семейства
 * добавлено фолбэком, чтобы шрифт работал и вне layout (зеркало главной, где
 * next/font-переменные не подключены, но грузится Google Fonts).
 */
export const FONT_OPTIONS: FontOption[] = [
  // с засечками (заголовки / премиум-стиль)
  { key: "prata", label: "Prata (с засечками)", css: "var(--font-prata), 'Prata', serif" },
  { key: "playfair", label: "Playfair Display (с засечками)", css: "var(--font-playfair), 'Playfair Display', serif" },
  { key: "cormorant", label: "Cormorant (с засечками)", css: "var(--font-cormorant), 'Cormorant', serif" },
  { key: "lora", label: "Lora (с засечками)", css: "var(--font-lora), 'Lora', serif" },
  // без засечек (текст / современный стиль)
  { key: "manrope", label: "Manrope (без засечек)", css: "var(--font-manrope), 'Manrope', sans-serif" },
  { key: "inter", label: "Inter (без засечек)", css: "var(--font-inter), 'Inter', sans-serif" },
  { key: "montserrat", label: "Montserrat (без засечек)", css: "var(--font-montserrat), 'Montserrat', sans-serif" },
  { key: "golos", label: "Golos Text (без засечек)", css: "var(--font-golos), 'Golos Text', sans-serif" },
];

/** <link> на Google Fonts для всех пресетов — для страниц вне next/font (зеркало). */
export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Prata&family=Playfair+Display:wght@400;500;600;700&family=Cormorant:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700&display=swap";

const FONT_BY_KEY = Object.fromEntries(FONT_OPTIONS.map((o) => [o.key, o]));

export const isFontKey = (v: unknown): v is string =>
  typeof v === "string" && v in FONT_BY_KEY;

/** Имя семейства без опасных для CSS символов. */
export function safeFamily(name: string): string {
  return name.replace(/["'`;{}<>]/g, "").trim();
}

/**
 * Достаёт имена семейств из ссылки на Google Fonts (css2?family=Roboto+Slab:...).
 * Несколько family= поддерживаются. Так название шрифта не нужно вписывать вручную.
 */
export function familiesFromFontUrl(url: string | undefined): string[] {
  if (!url) return [];
  const q = url.split("?")[1] ?? "";
  const out: string[] = [];
  for (const part of q.split("&")) {
    const eq = part.indexOf("=");
    if (eq < 0 || part.slice(0, eq) !== "family") continue;
    const raw = part.slice(eq + 1).split(":")[0];
    let name = "";
    try {
      name = decodeURIComponent(raw).replace(/\+/g, " ").trim();
    } catch {
      name = raw.replace(/\+/g, " ").trim();
    }
    if (name) out.push(safeFamily(name));
  }
  return [...new Set(out)].filter(Boolean);
}

/**
 * Значение шрифта → CSS font-family.
 * - известный ключ из FONT_OPTIONS → его стек;
 * - иначе непустая строка → произвольное имя семейства (должно быть загружено
 *   через theme.fontUrl), оборачиваем в кавычки;
 * - пусто/мусор → дефолтный сериф (Prata).
 */
export function fontCss(value: string | undefined): string {
  if (!value) return FONT_OPTIONS[0].css;
  if (FONT_BY_KEY[value]) return FONT_BY_KEY[value].css;
  const fam = safeFamily(value);
  return fam ? `'${fam}', system-ui, sans-serif` : FONT_OPTIONS[0].css;
}
