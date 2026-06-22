import { categoryByValue, type CatalogQuery, type Category } from "./types";

/**
 * Парсинг чистых URL-параметров портала в CatalogQuery.
 * ?deal=sale&category=flat&towers=1,107&rooms=2,3&priceMin=...&priceMax=...&areaMin=...&areaMax=...&sort=price_asc&page=2
 */
export function parseCatalogQuery(
  sp: Record<string, string | string[] | undefined> | URLSearchParams,
): CatalogQuery {
  const get = (k: string): string | undefined => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? undefined;
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const nums = (s?: string) =>
    s
      ?.split(",")
      .map((x) => parseInt(x, 10))
      .filter((x) => !Number.isNaN(x));
  const num = (s?: string) => {
    const n = s ? parseInt(s, 10) : NaN;
    return Number.isNaN(n) ? undefined : n;
  };
  const bool = (s?: string) => (s === "1" ? true : s === "0" ? false : undefined);
  const cat = get("category");
  return {
    deal: get("deal") === "rent" ? "rent" : "sale",
    category: cat && categoryByValue.has(cat as Category) ? (cat as Category) : undefined,
    towers: nums(get("towers")),
    rooms: get("rooms")?.split(",").filter(Boolean),
    priceMin: num(get("priceMin")),
    priceMax: num(get("priceMax")),
    areaMin: num(get("areaMin")),
    areaMax: num(get("areaMax")),
    decoration: get("decoration")?.split(",").filter(Boolean),
    floorMin: num(get("floorMin")),
    floorMax: num(get("floorMax")),
    isSecondary: bool(get("secondary")),
    isBuilt: bool(get("built")),
    readinessYear: nums(get("year")),
    developer: nums(get("dev")),
    complexOption: nums(get("opt")),
    sort: get("sort") ?? undefined,
    page: num(get("page")) ?? 1,
  };
}

export function catalogQueryToParams(q: CatalogQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.deal === "rent") p.set("deal", "rent");
  if (q.category) p.set("category", q.category);
  if (q.towers?.length) p.set("towers", q.towers.join(","));
  if (q.rooms?.length) p.set("rooms", q.rooms.join(","));
  if (q.priceMin != null) p.set("priceMin", String(q.priceMin));
  if (q.priceMax != null) p.set("priceMax", String(q.priceMax));
  if (q.areaMin != null) p.set("areaMin", String(q.areaMin));
  if (q.areaMax != null) p.set("areaMax", String(q.areaMax));
  if (q.decoration?.length) p.set("decoration", q.decoration.join(","));
  if (q.floorMin != null) p.set("floorMin", String(q.floorMin));
  if (q.floorMax != null) p.set("floorMax", String(q.floorMax));
  if (q.isSecondary != null) p.set("secondary", q.isSecondary ? "1" : "0");
  if (q.isBuilt != null) p.set("built", q.isBuilt ? "1" : "0");
  if (q.readinessYear?.length) p.set("year", q.readinessYear.join(","));
  if (q.developer?.length) p.set("dev", q.developer.join(","));
  if (q.complexOption?.length) p.set("opt", q.complexOption.join(","));
  if (q.sort) p.set("sort", q.sort);
  if (q.page && q.page > 1) p.set("page", String(q.page));
  return p;
}
