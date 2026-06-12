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
  complexTitle: string;
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

export type ComplexFilterResult = {
  total: number;
  moscowComplexCardDTOs: ComplexCard[];
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

/** Наши чистые параметры фильтра (URL портала) */
export type CatalogQuery = {
  deal: DealType;
  towers?: number[];
  rooms?: string[]; // "0","1","2","3","4+"
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  sort?: string; // "price_asc" | "price_desc" | "area_asc" | "area_desc"
  page?: number;
};
