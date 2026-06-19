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
  { key: "prata", label: "Prata", css: "var(--font-prata), 'Prata', serif" },
  { key: "playfair", label: "Playfair Display", css: "var(--font-playfair), 'Playfair Display', serif" },
  { key: "cormorant", label: "Cormorant", css: "var(--font-cormorant), 'Cormorant', serif" },
  { key: "manrope", label: "Manrope", css: "var(--font-manrope), 'Manrope', sans-serif" },
];

/** <link> на Google Fonts для всех пресетов — для страниц вне next/font (зеркало). */
export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Prata&family=Playfair+Display:wght@400;500;600;700&family=Cormorant:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap";

const FONT_BY_KEY = Object.fromEntries(FONT_OPTIONS.map((o) => [o.key, o]));

export const isFontKey = (v: unknown): v is string =>
  typeof v === "string" && v in FONT_BY_KEY;

/** ключ → CSS font-family; неизвестный/пустой → дефолтный сериф (Prata) */
export function fontCss(key: string | undefined): string {
  return (key && FONT_BY_KEY[key]?.css) || FONT_OPTIONS[0].css;
}
