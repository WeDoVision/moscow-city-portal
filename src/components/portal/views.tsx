/**
 * Виды отображения данных для блока `data` (KRE-79).
 *
 * Нормализуем DTO whitewill (лоты/комплексы) в единый `Item` и рисуем его одним
 * из видов: карточки / список / таблица / карусель / один объект. Так один и тот
 * же источник можно показать как угодно — маппинг полей в слоты задаётся сверху.
 *
 * Все виды — серверные (статика), интерактив не нужен. Логика нормализации
 * остаётся «на нас», наверх (ИИ/админ) уходит только выбор вида и маппинг.
 */

import type { ComplexCard, LotCard } from "@/lib/whitewill/types";
import { imageUrl, lotHeadline } from "@/lib/whitewill/client";
import { SOURCES, type SlotId, type SourceId, type ViewId } from "@/lib/portal/sources";
import type { PortalData } from "@/components/portal/blocks";
import { RingCarousel } from "@/components/portal/RingCarousel";

/** Нормализованный объект: значения по ключам полей + картинка/ссылка/сорт-ключи. */
export type Item = {
  id: string | number;
  href: string;
  image: string;
  values: Record<string, string>;
  sortPrice: number;
  sortArea: number;
};

function lotItems(lots: LotCard[]): Item[] {
  return lots.map((lot) => {
    const price = lot.lotCardPriceListDTO.lotCardPriceItemDTOs.find((p) => p.currency === "RUB");
    const transit = lot.lotCardTransitListDTO.lotCardTransitItemDTOs[0];
    const image = lot.images[0] ? imageUrl(lot.images[0], 727) : "";
    return {
      id: lot.id,
      href: `/lots/${lot.id}`,
      image,
      values: {
        image,
        title: lotHeadline(lot),
        subtitle: lot.title,
        price: price?.priceFormatted ?? "Цена по запросу",
        pricePerArea: price?.pricePerAreaFormatted ?? "",
        area: lot.area ? `${lot.area} м²` : "",
        district: lot.district ?? "",
        badge: lot.complexTitle ?? lot.address ?? lot.district ?? "",
        metro: transit?.title ?? "",
        floor: lot.floor ? `${lot.floor} этаж` : "",
      },
      sortPrice: price?.price ?? 0,
      sortArea: parseFloat(lot.area) || 0,
    };
  });
}

function complexItems(complexes: ComplexCard[]): Item[] {
  return complexes.map((c) => {
    const image = c.images?.[0] ? imageUrl(c.images[0], 727) : "";
    return {
      id: c.id,
      href: c.complexLink || "#",
      image,
      values: {
        image,
        title: c.title,
        subtitle: c.description ?? "",
        price: c.complexCardPriceDTO?.priceFormatted ?? "",
        district: c.district ?? "",
        kind: c.kind ?? "",
        badge: c.district ?? "",
      },
      sortPrice: c.complexCardPriceDTO?.price ?? 0,
      sortArea: 0,
    };
  });
}

export function toItems(source: SourceId, data: PortalData): Item[] {
  return source === "complexes" ? complexItems(data.complexes) : lotItems(data.lots);
}

export function sortItems(items: Item[], sort: string): Item[] {
  const by: Record<string, (a: Item, b: Item) => number> = {
    price_asc: (a, b) => a.sortPrice - b.sortPrice,
    price_desc: (a, b) => b.sortPrice - a.sortPrice,
    area_asc: (a, b) => a.sortArea - b.sortArea,
    area_desc: (a, b) => b.sortArea - a.sortArea,
  };
  return by[sort] ? [...items].sort(by[sort]) : items;
}

const FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#1a1c24"/><text x="50%" y="50%" fill="#5a5d6b" font-family="sans-serif" font-size="16" text-anchor="middle">Фото</text></svg>`,
  );

/** Значение слота для объекта (по маппингу слот→поле). */
function slot(item: Item, fields: Record<SlotId, string>, id: SlotId): string {
  const key = fields[id];
  return key ? item.values[key] ?? "" : "";
}

/* ─────────────────────────── Виды ─────────────────────────── */

function Card({ item, fields }: { item: Item; fields: Record<SlotId, string> }) {
  const title = slot(item, fields, "title");
  const subtitle = slot(item, fields, "subtitle");
  const price = slot(item, fields, "price");
  const badge = slot(item, fields, "badge");
  const img = slot(item, fields, "image") || item.image;
  return (
    <a
      href={item.href}
      className="group block overflow-hidden rounded-[var(--portal-radius)] border border-ink-line/40 bg-ink-soft transition-all duration-300 hover:-translate-y-1 hover:border-gold/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img || FALLBACK}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs tracking-wide text-paper/90 backdrop-blur">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">
        {title && <h3 className="font-display text-lg leading-snug text-paper">{title}</h3>}
        {subtitle && <p className="mt-1 line-clamp-1 text-xs text-muted">{subtitle}</p>}
        {price && <p className="mt-3 font-display text-xl text-gold">{price}</p>}
      </div>
    </a>
  );
}

function CardsView({ items, fields }: { items: Item[]; fields: Record<SlotId, string> }) {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <Card key={it.id} item={it} fields={fields} />
      ))}
    </div>
  );
}

function CarouselView({ items, fields }: { items: Item[]; fields: Record<SlotId, string> }) {
  return (
    <div className="no-scrollbar mt-10 flex gap-6 overflow-x-auto pb-2">
      {items.map((it) => (
        <div key={it.id} className="w-[300px] shrink-0">
          <Card item={it} fields={fields} />
        </div>
      ))}
    </div>
  );
}

function ListView({ items, fields }: { items: Item[]; fields: Record<SlotId, string> }) {
  return (
    <div className="mt-10 space-y-4">
      {items.map((it) => {
        const title = slot(it, fields, "title");
        const subtitle = slot(it, fields, "subtitle");
        const price = slot(it, fields, "price");
        const badge = slot(it, fields, "badge");
        const img = slot(it, fields, "image") || it.image;
        return (
          <a
            key={it.id}
            href={it.href}
            className="group flex gap-5 overflow-hidden rounded-[var(--portal-radius)] border border-ink-line/40 bg-ink-soft transition hover:border-gold/50"
          >
            <div className="relative aspect-[4/3] w-48 shrink-0 overflow-hidden sm:w-60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img || FALLBACK}
                alt={title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <div className="flex flex-1 flex-col justify-center py-4 pr-5">
              {badge && <span className="text-xs uppercase tracking-wide text-muted">{badge}</span>}
              {title && <h3 className="mt-1 font-display text-lg text-paper">{title}</h3>}
              {subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted">{subtitle}</p>}
              {price && <p className="mt-3 font-display text-lg text-gold">{price}</p>}
            </div>
          </a>
        );
      })}
    </div>
  );
}

function TableView({
  items,
  columns,
  source,
}: {
  items: Item[];
  columns: string[];
  source: SourceId;
}) {
  const allFields = SOURCES[source].fields.filter((f) => f.key !== "image");
  const cols = columns.length
    ? allFields.filter((f) => columns.includes(f.key))
    : allFields.slice(0, 5);
  return (
    <div className="mt-10 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink-line/60 text-muted">
            {cols.map((c) => (
              <th key={c.key} className="px-4 py-3 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-ink-line/30 hover:bg-ink-soft">
              {cols.map((c, i) => (
                <td key={c.key} className="px-4 py-3 text-paper/90">
                  {i === 0 ? (
                    <a href={it.href} className="text-gold hover:underline">
                      {it.values[c.key] || "—"}
                    </a>
                  ) : (
                    it.values[c.key] || "—"
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SingleView({ item, fields }: { item: Item; fields: Record<SlotId, string> }) {
  const title = slot(item, fields, "title");
  const subtitle = slot(item, fields, "subtitle");
  const price = slot(item, fields, "price");
  const badge = slot(item, fields, "badge");
  const img = slot(item, fields, "image") || item.image;
  return (
    <a
      href={item.href}
      className="group mt-10 grid gap-8 overflow-hidden rounded-[var(--portal-radius)] border border-ink-line/40 bg-ink-soft md:grid-cols-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img || FALLBACK}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col justify-center p-8">
        {badge && <span className="text-xs uppercase tracking-[0.2em] text-gold">{badge}</span>}
        {title && <h3 className="mt-2 font-display text-3xl text-paper">{title}</h3>}
        {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
        {price && <p className="mt-6 font-display text-2xl text-gold">{price}</p>}
      </div>
    </a>
  );
}

export function DataView({
  view,
  items,
  source,
  fields,
  columns,
}: {
  view: ViewId;
  items: Item[];
  source: SourceId;
  fields: Record<SlotId, string>;
  columns: string[];
}) {
  if (!items.length) return <p className="mt-10 text-muted">Объекты загружаются…</p>;
  switch (view) {
    case "list":
      return <ListView items={items} fields={fields} />;
    case "table":
      return <TableView items={items} columns={columns} source={source} />;
    case "carousel":
      return <CarouselView items={items} fields={fields} />;
    case "ring":
      return (
        <RingCarousel
          cards={items.map((it) => ({
            href: it.href,
            image: slot(it, fields, "image") || it.image,
            title: slot(it, fields, "title"),
            subtitle: slot(it, fields, "subtitle"),
            price: slot(it, fields, "price"),
            badge: slot(it, fields, "badge"),
          }))}
        />
      );
    case "single":
      return <SingleView item={items[0]} fields={fields} />;
    case "cards":
    default:
      return <CardsView items={items} fields={fields} />;
  }
}
