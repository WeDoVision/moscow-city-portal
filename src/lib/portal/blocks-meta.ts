/**
 * Client-safe метаданные блоков (KRE-120/124).
 *
 * Отделены от registry.tsx (который тянет серверные компоненты), чтобы админка
 * (client) могла знать о блоках и их редактируемых полях, не импортируя сами
 * компоненты. registry.tsx добавляет к этим мета-данным `component`.
 */

import type { BlockType } from "./schema";

export type FieldSpec = {
  key: string;
  label: string;
  kind:
    | "text"
    | "textarea"
    | "number"
    | "json"
    | "stringList" // список строк (напр. абзацы)
    | "objectList" // список объектов с под-полями (item)
    | "elements"; // визуальный конструктор секции (custom)
  /** подсказка под полем */
  hint?: string;
  /** под-поля для objectList */
  item?: { key: string; label: string; kind: "text" | "textarea" }[];
};

export type BlockMeta = {
  label: string;
  /** тяжёлый блок (3D и т.п.) — логика на нас, помечаем в админке */
  heavy?: boolean;
  fields: FieldSpec[];
};

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  hero: {
    label: "Hero (первый экран)",
    fields: [
      { key: "kicker", label: "Надзаголовок", kind: "text" },
      { key: "title", label: "Заголовок", kind: "text" },
      { key: "subtitle", label: "Подзаголовок", kind: "textarea" },
      { key: "image", label: "Фон (URL)", kind: "text" },
      {
        key: "overlay",
        label: "Затемнение фото, %",
        kind: "number",
        hint: "0 — фото видно полностью, 100 — полностью затемнено. По умолчанию 70.",
      },
      { key: "ctaLabel", label: "Текст главной кнопки", kind: "text" },
      { key: "ctaHref", label: "Ссылка главной кнопки (URL)", kind: "text" },
    ],
  },
  city3d: {
    label: "3D-карта района",
    heavy: true,
    // заголовок зашит в самом компоненте-оверлее, отдельное поле не нужно
    fields: [],
  },
  towers: {
    label: "Полоса башен/ЖК",
    fields: [{ key: "title", label: "Заголовок", kind: "text" }],
  },
  lotsGrid: {
    label: "Сетка объектов",
    fields: [
      { key: "title", label: "Заголовок", kind: "text" },
      { key: "subtitle", label: "Подзаголовок", kind: "text" },
      { key: "limit", label: "Сколько карточек", kind: "number" },
    ],
  },
  about: {
    label: "О портале + статистика",
    fields: [
      { key: "title", label: "Заголовок", kind: "text" },
      { key: "paragraphs", label: "Абзацы текста", kind: "stringList" },
      {
        key: "stats",
        label: "Статистика",
        kind: "objectList",
        item: [
          { key: "value", label: "Значение (напр. «15 лет»)", kind: "text" },
          { key: "label", label: "Подпись", kind: "text" },
        ],
      },
    ],
  },
  faq: {
    label: "FAQ",
    fields: [
      { key: "title", label: "Заголовок", kind: "text" },
      {
        key: "items",
        label: "Вопросы-ответы",
        kind: "objectList",
        item: [
          { key: "q", label: "Вопрос", kind: "text" },
          { key: "a", label: "Ответ", kind: "textarea" },
        ],
      },
    ],
  },
  cta: {
    label: "Призыв к действию",
    fields: [
      { key: "title", label: "Заголовок", kind: "text" },
      { key: "subtitle", label: "Подзаголовок", kind: "text" },
      { key: "buttonLabel", label: "Текст кнопки", kind: "text" },
      { key: "buttonHref", label: "Ссылка кнопки (URL)", kind: "text" },
    ],
  },
  custom: {
    label: "Произвольная секция",
    fields: [
      { key: "title", label: "Заголовок секции", kind: "text" },
      { key: "subtitle", label: "Подзаголовок", kind: "textarea" },
      { key: "background", label: "Фон секции (CSS, необязательно)", kind: "text" },
      { key: "elements", label: "Содержимое секции", kind: "elements" },
    ],
  },
};

export const BLOCK_TYPES = Object.keys(BLOCK_META) as BlockType[];

export function isBlockType(v: unknown): v is BlockType {
  return typeof v === "string" && v in BLOCK_META;
}
