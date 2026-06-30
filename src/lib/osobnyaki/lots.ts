/**
 * Каталог особняков (osobnyaki.com) — реальные данные.
 *
 * Источник тот же, что у оригинального портала: сегмент `mansions` API
 * whitewill.ru (osobnyaki.com — витрина особняков Whitewill).
 *
 *   GET https://whitewill.ru/api/v1/filter/mansions/{sale|rent}/lots?page=N
 *
 * Ответ: { moscowMansionLotFilterResultDTO: { total, lastPage, perPage,
 *          moscowMansionLotCardDTOs[] } }. Авторизация не нужна, требуется
 * браузерный User-Agent. CORS нет — поэтому ходим с сервера (route /api/osobnyaki/lots).
 *
 * Датасет небольшой (≈315 продажа + ≈114 аренда), поэтому забираем все
 * страницы разом, нормализуем в плоский Mansion и кешируем — дальше фильтры
 * и умный поиск работают на клиенте мгновенно.
 */

const BASE = "https://whitewill.ru";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
const CDN_PREFIX = "https://cdn.ww.estate/p/s/whitelist-api/file/";

export type Deal = "sale" | "rent";

/** Плоская карточка особняка для каталога */
export interface Mansion {
  id: number;
  deal: Deal;
  title: string;
  address: string;
  district: string;
  purpose: string; // «Назначение»: офис / банк / клиника / резиденция …
  area: number | null; // м², число для фильтрации
  areaLabel: string; // «3040 м²»
  floors: number | null; // этажность, число
  floorsLabel: string; // «6 этажей»
  metro: string | null; // «Кропоткинская, 5 минут»
  metroColor: string | null; // цвет ветки
  price: number | null; // ₽, число (null = «Цена по запросу»)
  priceLabel: string; // «2 300 000 000 ₽» или «Цена по запросу»
  perMLabel: string | null; // «756 579 ₽ / м²»
  image: string; // абсолютный CDN-URL первой фотографии
  images: string[]; // все фотографии (галерея на странице лота)
  lotLink: string; // страница лота на whitewill.ru
  stickers: string[]; // «Выбор Whitewill» …
  featured: boolean; // есть «выбор whitewill» — в показ по умолчанию
  description: string;
}

export interface CatalogData {
  lots: Mansion[];
  facets: { districts: string[]; purposes: string[] };
  counts: { sale: number; rent: number; total: number };
}

/* ── сырые типы ответа (только нужные поля) ── */
interface RawPriceItem {
  price: number;
  priceFormatted: string;
  pricePerAreaFormatted: string;
  currency: string;
}
interface RawCard {
  id: number;
  title: string;
  description?: string;
  area?: string;
  district?: string;
  address?: string;
  lotLink: string;
  images?: string[];
  lotCardPriceListDTO?: { lotCardPriceItemDTOs: RawPriceItem[] };
  lotCardTransitListDTO?: { lotCardTransitItemDTOs: { title: string; color: string }[] };
  lotCardInfoListDTO?: { lotCardInfoItemDTOs: { title: string; value: string }[] };
  lotCardFlagStickerListDTO?: { lotCardFlagStickerItemDTOs: { title: string }[] };
}

const stripHtml = (s: string | null | undefined) =>
  (s ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const toInt = (s: string | null | undefined): number | null => {
  const m = (s ?? "").replace(/\s/g, "").match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
};

const floorsLabel = (n: number | null): string => {
  if (n == null) return "";
  const last = n % 10;
  const tens = n % 100;
  const word =
    tens >= 11 && tens <= 14 ? "этажей" : last === 1 ? "этаж" : last >= 2 && last <= 4 ? "этажа" : "этажей";
  return `${n} ${word}`;
};

function imageUrl(path: string | undefined, width = 800): string {
  if (!path) return "";
  const abs = path.startsWith("http") ? path : CDN_PREFIX + path.replace(/^\/+/, "");
  return abs + (abs.includes("?") ? "&" : "?") + "width=" + width;
}

function normalizeCard(c: RawCard, deal: Deal): Mansion {
  const info = Object.fromEntries(
    (c.lotCardInfoListDTO?.lotCardInfoItemDTOs ?? []).map((i) => [i.title, i.value]),
  );
  const rub =
    (c.lotCardPriceListDTO?.lotCardPriceItemDTOs ?? []).find((p) => p.currency === "RUB") ??
    c.lotCardPriceListDTO?.lotCardPriceItemDTOs?.[0];
  const transit = c.lotCardTransitListDTO?.lotCardTransitItemDTOs?.[0];
  const stickers = (c.lotCardFlagStickerListDTO?.lotCardFlagStickerItemDTOs ?? []).map((s) => s.title);
  const area = toInt(c.area ?? info["Площадь"]);
  const floors = toInt(info["Этажность"]);
  const priceLabel = stripHtml(rub?.priceFormatted) || "Цена по запросу";
  const hasPrice = !!rub?.price;

  return {
    id: c.id,
    deal,
    title: c.title,
    address: c.address ?? "",
    district: c.district ?? "",
    purpose: info["Назначение"] ?? "",
    area,
    areaLabel: c.area ?? (area ? `${area} м²` : ""),
    floors,
    floorsLabel: floorsLabel(floors),
    metro: transit ? stripHtml(transit.title) : null,
    metroColor: transit?.color ?? null,
    price: hasPrice ? rub!.price : null,
    priceLabel,
    perMLabel: hasPrice ? stripHtml(rub?.pricePerAreaFormatted) || null : null,
    image: imageUrl(c.images?.[0]),
    images: (c.images ?? []).filter(Boolean).map((p) => imageUrl(p, 1600)),
    lotLink: c.lotLink,
    stickers,
    featured: stickers.some((s) => /whitewill/i.test(s)),
    description: stripHtml(c.description),
  };
}

async function fetchPage(deal: Deal, page: number): Promise<{ cards: RawCard[]; lastPage: number }> {
  const res = await fetch(`${BASE}/api/v1/filter/mansions/${deal}/lots?page=${page}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`mansions ${deal} api ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  const resultKey = Object.keys(data).find((k) => k.endsWith("FilterResultDTO"));
  if (!resultKey) throw new Error("unexpected mansions response shape");
  const r = data[resultKey] as Record<string, unknown>;
  const cardsKey = Object.keys(r).find((k) => k.endsWith("CardDTOs"));
  return {
    cards: (cardsKey ? (r[cardsKey] as RawCard[]) : []) ?? [],
    lastPage: (r.lastPage as number) ?? 1,
  };
}

/** Все лоты одного типа сделки (все страницы) */
async function fetchDeal(deal: Deal): Promise<Mansion[]> {
  const first = await fetchPage(deal, 1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.lastPage - 1) }, (_, i) => fetchPage(deal, i + 2)),
  );
  const cards = [first.cards, ...rest.map((r) => r.cards)].flat();
  return cards.map((c) => normalizeCard(c, deal));
}

/** Весь каталог особняков (продажа + аренда) + фасеты */
export async function fetchMansions(): Promise<CatalogData> {
  const [sale, rent] = await Promise.all([fetchDeal("sale"), fetchDeal("rent")]);
  const lots = [...sale, ...rent];
  const districts = [...new Set(lots.map((l) => l.district).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ru"),
  );
  const purposes = [...new Set(lots.map((l) => l.purpose).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ru"),
  );
  return {
    lots,
    facets: { districts, purposes },
    counts: { sale: sale.length, rent: rent.length, total: lots.length },
  };
}

/** Один особняк по id (для страницы лота). Берёт из общего кеша каталога. */
export async function getMansion(id: number): Promise<Mansion | null> {
  const { lots } = await fetchMansions();
  return lots.find((l) => l.id === id) ?? null;
}
