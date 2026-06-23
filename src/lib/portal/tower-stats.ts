/**
 * Агрегаты по башне для 3D-карты: сколько свободных лотов, в каком диапазоне
 * цен, плюс сэмпл лотов для боковой панели.
 *
 * Точные цифры берём прямо из API whitewill по каждой башне (фильтр complex_id),
 * а не из первой страницы общей выдачи — иначе башни с дальних страниц выглядят
 * «пустыми». На башню два дешёвых запроса (цена ↑ и ↓) дают count, min/max и
 * сэмпл; все кэшируются на час, так что SSR это почти один round-trip.
 */

import { fetchLots, lotPrice } from "@/lib/whitewill/client";
import type { DealType, LotCard } from "@/lib/whitewill/types";
import { towerById } from "@/portal.config";

export type TowerStat = {
  towerId: number;
  count: number;
  priceMin: number;
  priceMax: number;
  /** компактная подпись диапазона, напр. «32–480 млн ₽» */
  priceLabel: string;
  /** сэмпл лотов этой башни для панели (самые доступные) */
  lots: LotCard[];
};

/** Цена лота в рублях (с защитой от пустой карточки). */
function rub(card: LotCard | undefined): number {
  if (!card) return 0;
  try {
    return lotPrice(card, "RUB")?.price ?? 0;
  } catch {
    return 0;
  }
}

/** Компактный формат диапазона в млн ₽ (как на старом портале). */
function formatRange(min: number, max: number): string {
  const mln = (n: number) => {
    const m = n / 1_000_000;
    return m >= 100 ? String(Math.round(m)) : (Math.round(m * 10) / 10).toString();
  };
  if (!min && !max) return "";
  if (!max || min === max) return `от ${mln(min)} млн ₽`;
  return `${mln(min)}–${mln(max)} млн ₽`;
}

/**
 * Считает агрегаты по каждой башне scope. Башни без лотов получают count:0
 * (карта их приглушит). Запросы по башням идут параллельно и кэшируются.
 */
export async function fetchTowerStats(
  deal: DealType,
  towerIds: number[],
): Promise<Record<number, TowerStat>> {
  const ids = towerIds.length ? towerIds : [...towerById.keys()];

  const entries = await Promise.all(
    ids.map(async (id): Promise<[number, TowerStat]> => {
      const [asc, desc] = await Promise.all([
        fetchLots({ deal, towers: [id], page: 1, sort: "price_asc" }, 3600).catch(() => null),
        fetchLots({ deal, towers: [id], page: 1, sort: "price_desc" }, 3600).catch(() => null),
      ]);
      const lots = asc?.moscowLotCardDTOs ?? [];
      const count = asc?.total ?? 0;
      const priceMin = rub(lots[0]);
      const priceMax = rub(desc?.moscowLotCardDTOs?.[0]) || priceMin;
      return [
        id,
        {
          towerId: id,
          count,
          priceMin,
          priceMax,
          priceLabel: formatRange(priceMin, priceMax),
          lots: lots.slice(0, 6),
        },
      ];
    }),
  );

  return Object.fromEntries(entries);
}
