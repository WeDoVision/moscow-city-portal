/**
 * Источники данных и виды отображения для блока `data` (KRE-79).
 *
 * Идея: данные («интеграция» — лоты/комплексы из API whitewill) отвязаны от
 * того, КАК они показаны. ИИ/админ выбирают источник, вид (карточки/список/
 * таблица/карусель/один объект) и маппят поля источника в слоты вида. Логика
 * фетча и нормализации — на нас (server), презентация — наверх.
 *
 * Этот модуль client-safe: только константы/типы, без серверных импортов, чтобы
 * админка (client) и ИИ-промпт могли знать о палитре источников и полей.
 */

export type SourceId = "lots" | "complexes";
export type ViewId = "cards" | "list" | "table" | "carousel" | "single";

export type FieldDef = { key: string; label: string };

/** Поля каждого источника — то, что можно положить в слот вида или колонку таблицы. */
export const SOURCES: Record<SourceId, { label: string; fields: FieldDef[] }> = {
  lots: {
    label: "Объекты (лоты)",
    fields: [
      { key: "image", label: "Фото" },
      { key: "title", label: "Заголовок" },
      { key: "subtitle", label: "Подзаголовок" },
      { key: "price", label: "Цена" },
      { key: "pricePerArea", label: "Цена за м²" },
      { key: "area", label: "Площадь" },
      { key: "district", label: "Район" },
      { key: "badge", label: "Бейдж (ЖК/адрес)" },
      { key: "metro", label: "Метро" },
      { key: "floor", label: "Этаж" },
    ],
  },
  complexes: {
    label: "Комплексы / ЖК",
    fields: [
      { key: "image", label: "Фото" },
      { key: "title", label: "Название" },
      { key: "subtitle", label: "Описание" },
      { key: "price", label: "Цена от" },
      { key: "district", label: "Район" },
      { key: "kind", label: "Тип" },
      { key: "badge", label: "Бейдж" },
    ],
  },
};

export const VIEWS: { id: ViewId; label: string; hint: string }[] = [
  { id: "cards", label: "Карточки", hint: "сетка карточек с фото" },
  { id: "list", label: "Список", hint: "строки: фото слева, текст справа" },
  { id: "table", label: "Таблица", hint: "колонки из выбранных полей" },
  { id: "carousel", label: "Карусель", hint: "горизонтальная прокрутка карточек" },
  { id: "single", label: "Один объект", hint: "крупный акцентный блок (первый объект)" },
];

export const SORTS: { id: string; label: string }[] = [
  { id: "default", label: "По умолчанию" },
  { id: "price_asc", label: "Цена ↑" },
  { id: "price_desc", label: "Цена ↓" },
  { id: "area_asc", label: "Площадь ↑" },
  { id: "area_desc", label: "Площадь ↓" },
];

/** Слоты карточки/списка/одиночного вида — куда маппятся поля источника. */
export type SlotId = "image" | "title" | "subtitle" | "price" | "badge";
export const SLOTS: { id: SlotId; label: string }[] = [
  { id: "image", label: "Картинка" },
  { id: "title", label: "Заголовок" },
  { id: "subtitle", label: "Подзаголовок" },
  { id: "price", label: "Цена / метрика" },
  { id: "badge", label: "Бейдж" },
];

/** Дефолтный маппинг слот → ключ поля (если ИИ/админ не переопределили). */
export const DEFAULT_FIELDS: Record<SourceId, Record<SlotId, string>> = {
  lots: { image: "image", title: "title", subtitle: "subtitle", price: "price", badge: "badge" },
  complexes: {
    image: "image",
    title: "title",
    subtitle: "subtitle",
    price: "price",
    badge: "district",
  },
};

export function isSourceId(v: unknown): v is SourceId {
  return v === "lots" || v === "complexes";
}
export function isViewId(v: unknown): v is ViewId {
  return VIEWS.some((x) => x.id === v);
}

/** Маппинг слотов с заполнением дефолтами; чужие/пустые ключи игнорируются. */
export function resolveFields(
  source: SourceId,
  override: unknown,
): Record<SlotId, string> {
  const def = DEFAULT_FIELDS[source];
  const valid = new Set(SOURCES[source].fields.map((f) => f.key));
  const o = (override && typeof override === "object" ? override : {}) as Record<string, unknown>;
  const out = { ...def };
  for (const slot of SLOTS) {
    const v = o[slot.id];
    if (typeof v === "string" && (valid.has(v) || v === "")) out[slot.id] = v;
  }
  return out;
}
