/**
 * Схема портала — единица генерации платформы Whitewill.
 *
 * Идея KRE-79: под капотом одна core-логика (данные whitewill, 3D, лиды,
 * аналитика), а ПОВЕРХ натягивается разная структура и дизайн. Структуру
 * задаёт массив `blocks` (какие секции и в каком порядке), дизайн — `theme`
 * (токены), данные — `scope` (какие комплексы/сделка). Весь рендеринг идёт
 * через универсальный код: новый портал = новая схема, без правок кода.
 *
 * AI-генератор (KRE-123) эмитит ровно такой объект; админка (KRE-124) его
 * редактирует. Неизвестные типы блоков/пропсы отбрасываются на валидации —
 * так логика остаётся «на нас», а наверх отдаётся только UI/UX.
 */

/** Дизайн-токены. Накладываются как CSS-переменные на обёртку портала. */
export type Theme = {
  /** базовый фон */
  ink: string;
  inkSoft: string;
  inkLine: string;
  /** текст на фоне */
  paper: string;
  paperSoft: string;
  /** акцент (кнопки, цены, акценты) */
  gold: string;
  goldDeep: string;
  muted: string;
  /** общий радиус скруглений, напр. "0.125rem" или "1rem" */
  radius: string;
};

/** Данные, которые показывает портал. Это «логика» — правит только команда. */
export type PortalScope = {
  deal: "sale" | "rent";
  /** complex_id башен/ЖК из API whitewill (см. docs/API.md). Пусто = все. */
  towers: number[];
};

export type BlockType =
  | "hero"
  | "city3d"
  | "towers"
  | "lotsGrid"
  | "data"
  | "catalog"
  | "about"
  | "faq"
  | "cta"
  | "custom";

/** Один блок страницы: тип + произвольные (но валидируемые) пропсы. */
export type Block = {
  /** стабильный id для реордера/ключей в админке */
  id: string;
  type: BlockType;
  /** выключенный блок остаётся в схеме, но не рендерится */
  enabled?: boolean;
  props: Record<string, unknown>;
};

export type Brand = {
  name: string;
  /** логотип в две части для типографики */
  logo: [string, string];
  phone: string;
  phoneHref: string;
  email: string;
  whatsapp: string;
  telegram: string;
};

/**
 * Оформление карточки портала в секции «Проекты Whitewill» на главной.
 * Всё опционально: пусто → карточка берёт тему самого портала (theme).
 */
export type Card = {
  /** обложка-фото карточки (URL); фон карточки */
  image?: string;
  /** логотип по центру карточки (URL, как projects__item-logo на whitewill) */
  logo?: string;
  /** размер логотипа на карточке: s | m (по умолчанию) | l */
  logoSize?: "s" | "m" | "l";
  /** подпись-дескриптор под названием/логотипом, напр. «Загородная недвижимость» */
  subtitle?: string;
};

export type PortalSchema = {
  slug: string;
  /** имя портала в админке */
  name: string;
  brand: Brand;
  theme: Theme;
  scope: PortalScope;
  blocks: Block[];
  /** оформление карточки на главной (опционально) */
  card?: Card;
};

/** Тема по умолчанию — «ночное Сити» из исходного портала. */
export const DEFAULT_THEME: Theme = {
  ink: "oklch(0.16 0.015 260)",
  inkSoft: "oklch(0.21 0.018 260)",
  inkLine: "oklch(0.32 0.02 260)",
  paper: "oklch(0.96 0.008 85)",
  paperSoft: "oklch(0.93 0.01 85)",
  gold: "oklch(0.78 0.09 85)",
  goldDeep: "oklch(0.68 0.1 80)",
  muted: "oklch(0.62 0.015 260)",
  radius: "0.125rem",
};

/** Тема → набор CSS-переменных для inline-style обёртки портала. */
export function themeToCssVars(theme: Theme): Record<string, string> {
  return {
    "--ink": theme.ink,
    "--ink-soft": theme.inkSoft,
    "--ink-line": theme.inkLine,
    "--paper": theme.paper,
    "--paper-soft": theme.paperSoft,
    "--gold": theme.gold,
    "--gold-deep": theme.goldDeep,
    "--muted": theme.muted,
    "--portal-radius": theme.radius,
  };
}
