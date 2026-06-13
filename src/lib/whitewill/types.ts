/** Типы DTO API whitewill.ru (api/v1/filter/*) — см. docs/API.md */

export type PriceItem = {
  price: number;
  priceFormatted: string;
  pricePerArea: number;
  pricePerAreaFormatted: string;
  currency: "RUB" | "USD" | "EUR";
};

export type LotCard = {
  id: number;
  domainEntity: string;
  lotNumberTitle: string;
  title: string;
  description: string;
  area: string;
  district: string;
  /** только у жилых лотов */
  complexTitle?: string;
  /** только у коммерческих лотов */
  address?: string;
  floor?: string;
  lotLink: string;
  isVisitable: boolean;
  images: string[];
  lotCardPriceListDTO: { lotCardPriceItemDTOs: PriceItem[] };
  lotCardFlagStickerListDTO: {
    lotCardFlagStickerItemDTOs: { title: string; icon: string; value: string }[];
  };
  lotCardTransitListDTO: {
    lotCardTransitItemDTOs: { title: string; type: string; color: string }[];
  };
  lotCardInfoListDTO: {
    lotCardInfoItemDTOs: { title: string; value: string }[];
  };
};

export type LotFilterResult = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  hasMorePages: boolean;
  isResultEmpty: boolean;
  moscowLotCardDTOs: LotCard[];
};

export type ComplexCard = {
  id: number;
  domainEntity: string;
  title: string;
  description: string;
  district: string;
  kind: string;
  complexLink: string;
  images: string[];
  complexCardPriceDTO: { price: number; priceFormatted: string; currency: string };
};

export type GalleryImage = {
  category: string;
  url: string;
  title: string;
  desc: string;
};

/** Детальная инфа лота: карточка из API + скрейп страницы лота */
export type LotDetails = {
  card: LotCard;
  gallery: GalleryImage[];
  fullDescription: string | null;
};

export type DealType = "sale" | "rent";

/**
 * Категории недвижимости портала — как на старом портале (moscowcitysale.ru):
 * Квартиры / Апартаменты — жилой сегмент API, Офисы / Ритейл — коммерческий.
 * Маппинг на whitewill: kind/str_multiple_filter + выбор сегмента эндпоинта.
 */
export type Category = "flat" | "apartment" | "office" | "retail";

export const CATEGORIES: {
  value: Category;
  label: string;
  segment: "residential" | "commercials";
  kind: string;
}[] = [
  { value: "apartment", label: "Апартаменты", segment: "residential", kind: "apartment" },
  { value: "flat", label: "Квартиры", segment: "residential", kind: "flat" },
  { value: "office", label: "Офисы", segment: "commercials", kind: "office" },
  { value: "retail", label: "Ритейл", segment: "commercials", kind: "retail" },
];

export const categoryByValue = new Map(CATEGORIES.map((c) => [c.value, c]));

/** Наши чистые параметры фильтра (URL портала) */
export type CatalogQuery = {
  deal: DealType;
  category?: Category;
  towers?: number[];
  rooms?: string[]; // "0","1","2","3","4+" — только жилой сегмент
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  sort?: string; // "price_asc" | "price_desc" | "area_asc" | "area_desc"
  page?: number;
};

/** Счётчики для панели фильтров (как на старом портале) */
export type CatalogCounts = {
  categories: Record<Category | "all", number>;
  towers: Record<number, number>;
};
