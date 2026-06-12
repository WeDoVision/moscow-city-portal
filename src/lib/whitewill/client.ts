/**
 * Клиент API whitewill.ru.
 *
 * Эндпоинты (реверс-инжиниринг, детали в docs/API.md):
 *  - GET /api/v1/filter/{sale|rent}/lots?page=N&filters=<rule|value;rule|value>
 *  - GET /api/v1/filter/{sale|rent}/lots/search?search=<q>
 *  - GET /api/v1/filter/complexes?page=N&filters=...
 *  - страница лота /lots/show/{id} — серверный HTML, из него скрейпим
 *    галерею (встроенный JSON в :complex-gallery) и полное описание.
 */

import { portal } from "@/portal.config";
import type {
  CatalogQuery,
  ComplexCard,
  DealType,
  GalleryImage,
  LotCard,
  LotDetails,
  LotFilterResult,
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

const SORT_VALUE: Record<string, string> = {
  price_asc: "price_rub:asc",
  price_desc: "price_rub:desc",
  area_asc: "area:asc",
  area_desc: "area:desc",
};

/** Собирает строку filters= из наших чистых параметров */
export function buildFilters(q: CatalogQuery): string {
  const rules: string[] = [];
  const towerIds = q.towers?.length
    ? q.towers
    : portal.towers.map((t) => t.id);
  rules.push(`complex_id/int_multiple_filter|${towerIds.join(":")}`);

  const rooms = (q.rooms ?? [])
    .map((r) => ROOM_VALUE[r])
    .filter(Boolean);
  if (rooms.length) {
    rules.push(`rooms/int_multiple_band_strict_filter|${rooms.join(",")}`);
  }
  if (q.priceMin != null || q.priceMax != null) {
    rules.push(
      `price_rub/int_multiple_band_strict_filter|${q.priceMin ?? ""}:${q.priceMax ?? ""}`,
    );
  }
  if (q.areaMin != null || q.areaMax != null) {
    rules.push(`area_m2/int_band_filter|${q.areaMin ?? ""}:${q.areaMax ?? ""}`);
  }
  const sort = SORT_VALUE[q.sort ?? ""] ?? portal.defaultSort;
  rules.push(`sorting/custom|${sort}`);
  return rules.join(";");
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
  const data = await getJson<{ moscowLotFilterResultDTO: LotFilterResult }>(
    `${BASE}/api/v1/filter/${deal}/lots?${params}`,
    revalidate,
  );
  return data.moscowLotFilterResultDTO;
}

export async function fetchLotCard(
  id: number,
  deal: DealType = "sale",
): Promise<LotCard | null> {
  const params = new URLSearchParams({
    page: "1",
    filters: `lot_id/int_multiple_filter|${id}`,
  });
  const data = await getJson<{ moscowLotFilterResultDTO: LotFilterResult }>(
    `${BASE}/api/v1/filter/${deal}/lots?${params}`,
    3600,
  );
  return data.moscowLotFilterResultDTO.moscowLotCardDTOs[0] ?? null;
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
export async function fetchLotDetails(
  id: number,
  deal: DealType = "sale",
): Promise<LotDetails | null> {
  const card = await fetchLotCard(id, deal);
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

/** Инфо-поля карточки как словарь: Площадь / Спальни / Этаж */
export function lotInfo(card: LotCard): Record<string, string> {
  return Object.fromEntries(
    card.lotCardInfoListDTO.lotCardInfoItemDTOs.map((i) => [i.title, i.value]),
  );
}
