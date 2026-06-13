/**
 * Клиент API whitewill.ru.
 *
 * Эндпоинты (реверс-инжиниринг, детали в docs/API.md):
 *  - GET /api/v1/filter/{sale|rent}/lots?page=N&filters=...            — жилые
 *  - GET /api/v1/filter/commercials/{sale|rent}/lots?page=N&filters=...— офисы/ритейл
 *  - GET /api/v1/filter/complexes?page=N&filters=...
 *  - страница лота /lots/show/{id} — серверный HTML, из него скрейпим
 *    галерею (встроенный JSON в :complex-gallery) и полное описание.
 */

import { portal } from "@/portal.config";
import {
  CATEGORIES,
  categoryByValue,
  type CatalogCounts,
  type CatalogQuery,
  type Category,
  type ComplexCard,
  type DealType,
  type GalleryImage,
  type LotCard,
  type LotDetails,
  type LotFilterResult,
} from "./types";

const BASE = "https://whitewill.ru";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

const CDN_PREFIX = "https://cdn.ww.estate/p/s/whitelist-api/file/";

/** Абсолютный URL картинки CDN с ресайзом на стороне CDN */
export function imageUrl(path: string, width?: number): string {
  const abs = path.startsWith("http") ? path : CDN_PREFIX + path;
  if (!width) return abs;
  return abs + (abs.includes("?") ? "&" : "?") + "width=" + width;
}

/**
 * Планировки (schemas) — в конец списка, первой остаётся фотография
 * интерьера/вида, как на старом портале.
 */
export function sortLotImages(images: string[]): string[] {
  const isSchema = (p: string) => p.includes("/schemas/");
  return [...images.filter((p) => !isSchema(p)), ...images.filter(isSchema)];
}

async function getJson<T>(url: string, revalidate = 600): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate },
  });
  if (!res.ok) {
    throw new Error(`whitewill api ${res.status} for ${url}`);
  }
  return res.json() as Promise<T>;
}

const ROOM_VALUE: Record<string, string> = {
  "0": "0:0",
  "1": "1:1",
  "2": "2:2",
  "3": "3:3",
  "4+": "4:",
};

/** колонка цены различается по типу сделки: sale=price_rub, rent=price_rub_rent */
function priceColumn(deal: DealType): string {
  return deal === "rent" ? "price_rub_rent" : "price_rub";
}

function sortValue(sort: string | undefined, deal: DealType): string {
  const map: Record<string, string> = {
    price_asc: `${priceColumn(deal)}:asc`,
    price_desc: `${priceColumn(deal)}:desc`,
    area_asc: "area:asc",
    area_desc: "area:desc",
  };
  return map[sort ?? ""] ?? `${priceColumn(deal)}:asc`;
}

function segmentOf(category?: Category): "residential" | "commercials" {
  return category ? categoryByValue.get(category)!.segment : "residential";
}

function lotsEndpoint(deal: DealType, category?: Category): string {
  const seg = segmentOf(category);
  return seg === "commercials"
    ? `${BASE}/api/v1/filter/commercials/${deal}/lots`
    : `${BASE}/api/v1/filter/${deal}/lots`;
}

/** Собирает строку filters= из наших чистых параметров */
export function buildFilters(q: CatalogQuery): string {
  const rules: string[] = [];
  const towerIds = q.towers?.length
    ? q.towers
    : portal.towers.map((t) => t.id);
  rules.push(`complex_id/int_multiple_filter|${towerIds.join(":")}`);

  if (q.category) {
    rules.push(`kind/str_multiple_filter|${categoryByValue.get(q.category)!.kind}`);
  }

  // спальни — только у жилого сегмента (commercials их не принимает)
  if (segmentOf(q.category) === "residential") {
    const rooms = (q.rooms ?? []).map((r) => ROOM_VALUE[r]).filter(Boolean);
    if (rooms.length) {
      rules.push(`rooms/int_multiple_band_strict_filter|${rooms.join(",")}`);
    }
  }
  const deal: DealType = q.deal === "rent" ? "rent" : "sale";
  if (q.priceMin != null || q.priceMax != null) {
    rules.push(
      `${priceColumn(deal)}/int_multiple_band_strict_filter|${q.priceMin ?? ""}:${q.priceMax ?? ""}`,
    );
  }
  if (q.areaMin != null || q.areaMax != null) {
    rules.push(`area_m2/int_band_filter|${q.areaMin ?? ""}:${q.areaMax ?? ""}`);
  }
  rules.push(`sorting/custom|${sortValue(q.sort, deal)}`);
  return rules.join(";");
}

/**
 * Ответы жилого и коммерческого сегментов отличаются только именами ключей
 * (moscowLotFilterResultDTO / moscowCommercialLotFilterResultDTO и
 * *CardDTOs) — нормализуем в один LotFilterResult.
 */
function normalizeResult(data: Record<string, unknown>): LotFilterResult {
  const resultKey = Object.keys(data).find((k) => k.endsWith("FilterResultDTO"));
  if (!resultKey) throw new Error("unexpected lots response shape");
  const r = data[resultKey] as Record<string, unknown>;
  const cardsKey = Object.keys(r).find((k) => k.endsWith("CardDTOs"));
  return {
    currentPage: r.currentPage as number,
    lastPage: r.lastPage as number,
    perPage: r.perPage as number,
    total: r.total as number,
    hasMorePages: r.hasMorePages as boolean,
    isResultEmpty: r.isResultEmpty as boolean,
    moscowLotCardDTOs: (cardsKey ? (r[cardsKey] as LotCard[]) : []).map((c) => ({
      ...c,
      images: sortLotImages(c.images ?? []),
    })),
  };
}

export async function fetchLots(
  q: CatalogQuery,
  revalidate = 600,
): Promise<LotFilterResult> {
  const params = new URLSearchParams({
    page: String(q.page ?? 1),
    filters: buildFilters(q),
  });
  const deal: DealType = q.deal === "rent" ? "rent" : "sale";
  const data = await getJson<Record<string, unknown>>(
    `${lotsEndpoint(deal, q.category)}?${params}`,
    revalidate,
  );
  return normalizeResult(data);
}

/**
 * Счётчики для панели фильтров: по категориям (в текущем deal-скоупе)
 * и по башням (в текущем deal+category-скоупе) — как на старом портале.
 */
export async function fetchCounts(
  deal: DealType,
  category?: Category,
): Promise<CatalogCounts> {
  const towerIds = portal.towers.map((t) => t.id);
  const catTotals = await Promise.all(
    CATEGORIES.map((c) =>
      fetchLots({ deal, category: c.value, page: 1 }, 600)
        .then((r) => r.total)
        .catch(() => 0),
    ),
  );
  const towerTotals = await Promise.all(
    towerIds.map((id) =>
      fetchLots({ deal, category, towers: [id], page: 1 }, 600)
        .then((r) => r.total)
        .catch(() => 0),
    ),
  );
  const categories = Object.fromEntries(
    CATEGORIES.map((c, i) => [c.value, catTotals[i]]),
  ) as CatalogCounts["categories"];
  categories.all = catTotals.reduce((a, b) => a + b, 0);
  return {
    categories,
    towers: Object.fromEntries(towerIds.map((id, i) => [id, towerTotals[i]])),
  };
}

const LOT_SCOPES: { deal: DealType; category?: Category }[] = [
  { deal: "sale" },
  { deal: "rent" },
  { deal: "sale", category: "office" },
  { deal: "rent", category: "office" },
];

export async function fetchLotCard(id: number): Promise<LotCard | null> {
  for (const scope of LOT_SCOPES) {
    try {
      const params = new URLSearchParams({
        page: "1",
        filters: `lot_id/int_multiple_filter|${id}`,
      });
      const data = await getJson<Record<string, unknown>>(
        `${lotsEndpoint(scope.deal, scope.category)}?${params}`,
        3600,
      );
      const result = normalizeResult(data);
      if (result.moscowLotCardDTOs[0]) return result.moscowLotCardDTOs[0];
    } catch {
      // пробуем следующий скоуп
    }
  }
  return null;
}

export async function fetchComplexes(): Promise<ComplexCard[]> {
  const ids = portal.towers.map((t) => t.id).join(":");
  const params = new URLSearchParams({
    page: "1",
    filters: `complex_id/int_multiple_filter|${ids}`,
  });
  const data = await getJson<{
    moscowComplexFilterResultDTO: { moscowComplexCardDTOs: ComplexCard[] };
  }>(`${BASE}/api/v1/filter/complexes?${params}`, 3600);
  return data.moscowComplexFilterResultDTO.moscowComplexCardDTOs;
}

/**
 * Скрейп страницы лота: галерея лежит в HTML атрибутом
 * :complex-gallery="[{category,url,title,desc},...]" (HTML-escaped JSON),
 * полное описание — в блоке описания/og:description.
 */
export async function fetchLotDetails(id: number): Promise<LotDetails | null> {
  const card = await fetchLotCard(id);
  if (!card) return null;

  let gallery: GalleryImage[] = [];
  let fullDescription: string | null = null;
  try {
    const res = await fetch(card.lotLink, {
      headers: { "User-Agent": UA },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const html = await res.text();
      const m = html.match(/:complex-gallery="([^"]+)"/);
      if (m) {
        gallery = JSON.parse(decodeHtmlEntities(m[1])) as GalleryImage[];
        // планировки в конец, как и в карточках
        gallery = [
          ...gallery.filter((g) => g.category !== "schemas"),
          ...gallery.filter((g) => g.category === "schemas"),
        ];
      }
      const d = html.match(
        /<meta\s+(?:property="og:description"|name="description")\s+content="([^"]*)"/,
      );
      if (d) fullDescription = decodeHtmlEntities(d[1]);
    }
  } catch {
    // страница лота недоступна — отдаём данные карточки, этого достаточно
  }
  if (!gallery.length) {
    gallery = card.images.map((p) => ({
      category: "photo",
      url: imageUrl(p),
      title: card.title,
      desc: "",
    }));
  }
  return { card, gallery, fullDescription };
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** Достаёт число из PriceItem карточки в нужной валюте */
export function lotPrice(card: LotCard, currency = "RUB") {
  return (
    card.lotCardPriceListDTO.lotCardPriceItemDTOs.find(
      (p) => p.currency === currency,
    ) ?? card.lotCardPriceListDTO.lotCardPriceItemDTOs[0]
  );
}

/** Инфо-поля карточки как словарь: Площадь / Спальни / Этаж / Отделка */
export function lotInfo(card: LotCard): Record<string, string> {
  return Object.fromEntries(
    card.lotCardInfoListDTO.lotCardInfoItemDTOs.map((i) => [i.title, i.value]),
  );
}

/**
 * Информативный заголовок карточки в духе старого портала:
 * "Апартаменты с 2 спальнями, 155 м², 73 этаж".
 */
export function lotHeadline(card: LotCard): string {
  const info = lotInfo(card);
  const parts: string[] = [];
  const bedrooms = info["Спальни"];
  const isCommercial = card.domainEntity.includes("commercial");
  let kind = isCommercial ? "Помещение" : "Квартира";
  if (/апартамент/i.test(card.title)) kind = "Апартаменты";
  else if (/пентхаус/i.test(card.title)) kind = "Пентхаус";
  else if (/офис/i.test(card.title)) kind = "Офис";
  else if (/ритейл|торгов/i.test(card.title)) kind = "Ритейл";
  else if (/студия/i.test(card.title) || bedrooms === "0") kind = "Студия";
  if (bedrooms && bedrooms !== "0") {
    const n = parseInt(bedrooms, 10);
    const word = n === 1 ? "спальней" : "спальнями";
    parts.push(`${kind} с ${n} ${word}`);
  } else {
    parts.push(kind);
  }
  if (card.area) parts.push(`${card.area} м²`);
  const floor = info["Этаж"] ?? card.floor;
  if (floor) parts.push(`${floor} этаж`);
  return parts.join(" · ");
}
