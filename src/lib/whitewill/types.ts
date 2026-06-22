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
  /** отделка: коды из DECORATION_OPTIONS */
  decoration?: string[];
  /** этаж — диапазон */
  floorMin?: number;
  floorMax?: number;
  /** true = вторичка, false = новостройка (is_secondary/bool_filter) */
  isSecondary?: boolean;
  /** true = дом сдан, false = строится (is_built/bool_filter) */
  isBuilt?: boolean;
  /** год сдачи комплекса (readiness_year/int_multiple_filter) */
  readinessYear?: number[];
  /** застройщики — id из DEVELOPERS (developer/custom) */
  developer?: number[];
  /** особенности комплекса — id из COMPLEX_OPTIONS (complex_option/custom) */
  complexOption?: number[];
  sort?: string; // "price_asc" | "price_desc" | "area_asc" | "area_desc"
  page?: number;
};

/** Варианты отделки (decoration/str_multiple_filter в API whitewill) */
export const DECORATION_OPTIONS: { value: string; label: string }[] = [
  { value: "with_decoration", label: "С отделкой" },
  { value: "without_decoration", label: "Без отделки" },
  { value: "whitebox", label: "White box" },
];

/** Особенности комплекса (complex_option/custom) — id из фильтр-схемы whitewill */
export const COMPLEX_OPTIONS: { value: number; label: string }[] = [
  { value: 81, label: "приватная территория" },
  { value: 98, label: "паркинг" },
  { value: 82, label: "детские площадки" },
  { value: 91, label: "лаунж-пространство" },
  { value: 84, label: "панорамное остекление" },
  { value: 93, label: "кафе" },
  { value: 85, label: "консьерж-сервис" },
  { value: 99, label: "фитнес-клуб" },
  { value: 90, label: "спортивная площадка" },
  { value: 87, label: "маркет" },
  { value: 83, label: "кладовые" },
  { value: 88, label: "ресторан" },
  { value: 86, label: "детский сад" },
  { value: 89, label: "салон красоты" },
  { value: 94, label: "коворкинг" },
];

/** Застройщики (developer/custom) — id из фильтр-схемы whitewill */
export const DEVELOPERS: { value: number; label: string }[] = [
  { value: 12, label: "Capital Group" },
  { value: 100, label: "Донстрой" },
  { value: 177, label: "Pioneer" },
  { value: 38, label: "Stone" },
  { value: 15, label: "Sminex" },
  { value: 78, label: "Группа ЛСР" },
  { value: 127, label: "Level Group" },
  { value: 24, label: "ФСК Лидер" },
  { value: 522, label: "MR Private" },
  { value: 427, label: "Forma" },
  { value: 295, label: "Upside Development" },
  { value: 462, label: "Regions Development" },
  { value: 31, label: "Колди" },
  { value: 456, label: "РКС Девелопмент" },
  { value: 340, label: "Tekta Group" },
];

/** Счётчики для панели фильтров (как на старом портале) */
export type CatalogCounts = {
  categories: Record<Category | "all", number>;
  towers: Record<number, number>;
};
