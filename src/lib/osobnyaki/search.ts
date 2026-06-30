/**
 * Логика поиска по каталогу особняков — общая для клиента (лендинг) и
 * серверного AI-эндпоинта (/api/osobnyaki/assistant).
 *
 * Здесь же лежит regex-парсер `parseSearch` — он работает как мгновенный
 * локальный фолбэк, если LLM недоступен (нет ключа / таймаут / ошибка).
 * И LLM, и фолбэк возвращают ОДИН формат `ParsedSearch`, поэтому UI с ними
 * работает одинаково.
 */

import type { Deal, Mansion } from "./lots";

export type Filters = {
  deal: Deal | null;
  purpose: string[];
  district: string[];
  price: string[]; // ключи PRICE_BANDS
  floors: string[]; // ключи FLOOR_BANDS
};

export type ParsedSearch = { filters: Filters; text: string; chips: string[] };

export const EMPTY_FILTERS: Filters = { deal: null, purpose: [], district: [], price: [], floors: [] };

export const PRICE_BANDS = [
  { key: "до 200 млн ₽", min: 0, max: 200_000_000 },
  { key: "200–500 млн ₽", min: 200_000_000, max: 500_000_000 },
  { key: "500 млн – 1 млрд ₽", min: 500_000_000, max: 1_000_000_000 },
  { key: "от 1 млрд ₽", min: 1_000_000_000, max: Infinity },
] as const;

export const FLOOR_BANDS = [
  { key: "1–2 этажа", min: 1, max: 2 },
  { key: "3–4 этажа", min: 3, max: 4 },
  { key: "от 5 этажей", min: 5, max: Infinity },
] as const;

export const SEARCH_SUGGEST = [
  "Особняк под ресторан",
  "Здание под клинику до 500 млн",
  "Аренда особняка под офис",
  "Резиденция в Хамовниках",
];

export const dealLabel = (d: Deal) => (d === "rent" ? "Аренда" : "Продажа");

export const filtersActive = (f: Filters, text: string) =>
  f.deal != null ||
  f.purpose.length > 0 ||
  f.district.length > 0 ||
  f.price.length > 0 ||
  f.floors.length > 0 ||
  text.trim().length > 0;

export function priceInBand(price: number, key: string): boolean {
  const b = PRICE_BANDS.find((x) => x.key === key);
  if (!b) return false;
  return price >= b.min && (b.max === Infinity || price < b.max);
}
export function floorInBand(floors: number, key: string): boolean {
  const b = FLOOR_BANDS.find((x) => x.key === key);
  if (!b) return false;
  return floors >= b.min && (b.max === Infinity || floors <= b.max);
}

/** Единое правило отбора: structured-фильтры (AND между группами, OR внутри) + полнотекст */
export function lotMatches(l: Mansion, f: Filters, text: string): boolean {
  if (f.deal && l.deal !== f.deal) return false;
  if (f.purpose.length && !f.purpose.includes(l.purpose)) return false;
  if (f.district.length && !f.district.includes(l.district)) return false;
  if (f.price.length) {
    if (l.price == null) return false;
    if (!f.price.some((k) => priceInBand(l.price!, k))) return false;
  }
  if (f.floors.length) {
    if (l.floors == null) return false;
    if (!f.floors.some((k) => floorInBand(l.floors!, k))) return false;
  }
  const t = text.trim().toLowerCase();
  if (t) {
    const hay = `${l.title} ${l.address} ${l.district} ${l.purpose} ${l.description}`.toLowerCase();
    for (const tok of t.split(/\s+/).filter(Boolean)) if (!hay.includes(tok)) return false;
  }
  return true;
}

export function sortLots(lots: Mansion[], sort: string): Mansion[] {
  const arr = [...lots];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    case "price_desc":
      return arr.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    case "area_desc":
      return arr.sort((a, b) => (b.area ?? 0) - (a.area ?? 0));
    case "area_asc":
      return arr.sort((a, b) => (a.area ?? Infinity) - (b.area ?? Infinity));
    default:
      return arr.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}

/** Числовой диапазон цены (₽) → ключи ценовых корзин (любая пересекающаяся). */
export function priceRangeToKeys(min: number | null, max: number | null): string[] {
  if (min == null && max == null) return [];
  return PRICE_BANDS.filter(
    (b) => (max == null || b.min < max) && (min == null || b.max === Infinity || b.max > min),
  ).map((b) => b.key);
}
/** Диапазон этажности → ключи корзин этажности. */
export function floorRangeToKeys(min: number | null, max: number | null): string[] {
  if (min == null && max == null) return [];
  return FLOOR_BANDS.filter(
    (b) => (max == null || b.min <= max) && (min == null || b.max === Infinity || b.max >= min),
  ).map((b) => b.key);
}

/** Чипы «Эксперт понял …» — одинаковые для LLM и regex-фолбэка. */
export function buildChips(f: Filters, leftover: string, structured: boolean): string[] {
  const chips: string[] = [];
  if (f.deal) chips.push(`Сделка · ${dealLabel(f.deal)}`);
  f.purpose.forEach((p) => chips.push(`Назначение · ${p}`));
  f.district.forEach((d) => chips.push(`Район · ${d}`));
  f.price.forEach((p) => chips.push(`Цена · ${p}`));
  f.floors.forEach((fl) => chips.push(`Этажность · ${fl}`));
  if (!structured && leftover.trim()) chips.push(`Поиск · «${leftover.trim()}»`);
  return chips;
}

/* Назначение по ключевым словам — значения совпадают с реальной таксономией API */
export const PURPOSE_KEYWORDS: [RegExp, string][] = [
  [/ресторан|кафе|общепит|\bбар\b/i, "ресторан"],
  [/клиник|медиц|стоматолог|бьюти|космет/i, "медицинский центр / клиника"],
  [/банк/i, "банк"],
  [/представит|посольств|штаб|консульств/i, "представительство / штаб-квартира"],
  [/офис|бизнес[\s-]?центр|\bбц\b/i, "офис / бизнес-центр"],
  [/отел|гостиниц/i, "отель / гостиница"],
  [/хостел/i, "хостел"],
  [/резиден|жил|для жизни|усадьб|особняк для себя/i, "жилой особняк / резиденция"],
  [/реконструкц/i, "под реконструкцию"],
  [/редевелоп/i, "редевелопмент"],
  [/образоват|школ|универ|колледж|детский сад|садик|гимназ/i, "образовательное учреждение"],
  [/арендн|готовый бизнес/i, "арендный бизнес"],
];

/** Локальный regex-разбор свободного запроса (фолбэк, если LLM недоступен). */
export function parseSearch(
  raw: string,
  facets: { districts: string[]; purposes: string[] },
): ParsedSearch | null {
  const text = raw.trim();
  if (!text) return null;
  const low = text.toLowerCase();

  let deal: Deal | null = null;
  if (/аренд|снять|сним|в аренду/.test(low)) deal = "rent";
  else if (/куп|продаж|покупк|приобрес|приобрет/.test(low)) deal = "sale";

  const purpose: string[] = [];
  for (const [re, value] of PURPOSE_KEYWORDS) {
    if (re.test(low) && facets.purposes.includes(value) && !purpose.includes(value)) purpose.push(value);
  }

  // Район: точное вхождение + сопоставление по основе, чтобы ловить падежи
  const tokens = low.split(/[^a-zа-яё0-9]+/i).filter(Boolean);
  const district = facets.districts.filter((d) => {
    const dl = d.toLowerCase();
    if (low.includes(dl)) return true;
    if (dl.includes(" ") || dl.includes("-")) return false;
    const stem = dl.slice(0, Math.max(4, dl.length - 2));
    return tokens.some((t) => t.startsWith(stem) && Math.abs(t.length - dl.length) <= 3);
  });

  const num = (re: RegExp): number | undefined => {
    const m = low.match(re);
    if (!m) return undefined;
    const n = parseFloat(m[1].replace(/\s/g, "").replace(",", "."));
    if (Number.isNaN(n)) return undefined;
    return n * (m[2].startsWith("млрд") ? 1e9 : 1e6);
  };
  let pmax = num(/до\s*([\d\s.,]+)\s*(млрд|млн)/);
  const pmin = num(/от\s*([\d\s.,]+)\s*(млрд|млн)/);
  if (pmax == null && pmin == null) {
    const any = num(/([\d\s.,]+)\s*(млрд|млн)/);
    if (any != null) pmax = any;
  }
  const price = priceRangeToKeys(pmin ?? null, pmax ?? null);

  const structured = !!deal || purpose.length > 0 || district.length > 0 || price.length > 0;
  const filters: Filters = { deal, purpose, district, price, floors: [] };
  const chips = buildChips(filters, text, structured);

  return { filters, text: structured ? "" : text, chips };
}

/**
 * Сборка результата из «сырых» параметров, которые вернул LLM. Категориальные
 * значения жёстко сверяем с фасетами (LLM не должен выдумывать районы/назначения
 * вне каталога), числовые диапазоны переводим в ключи корзин.
 */
export function filtersFromAi(
  ai: {
    deal?: string | null;
    purpose?: string[];
    district?: string[];
    priceMinMln?: number | null;
    priceMaxMln?: number | null;
    floorMin?: number | null;
    floorMax?: number | null;
    text?: string | null;
  },
  facets: { districts: string[]; purposes: string[] },
  rawQuery: string,
): ParsedSearch {
  const deal: Deal | null = ai.deal === "sale" || ai.deal === "rent" ? ai.deal : null;
  const purpose = (ai.purpose ?? []).filter((p) => facets.purposes.includes(p));
  const district = (ai.district ?? []).filter((d) => facets.districts.includes(d));
  const toRub = (mln: number | null | undefined) => (mln == null ? null : Math.round(mln * 1e6));
  const price = priceRangeToKeys(toRub(ai.priceMinMln), toRub(ai.priceMaxMln));
  const floors = floorRangeToKeys(ai.floorMin ?? null, ai.floorMax ?? null);

  const structured =
    !!deal || purpose.length > 0 || district.length > 0 || price.length > 0 || floors.length > 0;
  const filters: Filters = { deal, purpose, district, price, floors };
  // оставшийся свободный текст применяем только если структурного ничего нет —
  // иначе полнотекст-AND может схлопнуть выдачу в ноль
  const leftover = (ai.text ?? "").trim() || rawQuery.trim();
  const text = structured ? "" : leftover;
  const chips = buildChips(filters, leftover, structured);
  return { filters, text, chips };
}
