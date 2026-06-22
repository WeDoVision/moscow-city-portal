"use client";

import Link from "next/link";
import { useState } from "react";
import type { LotCard as LotCardType } from "@/lib/whitewill/types";
import { imageUrl, lotHeadline } from "@/lib/whitewill/client";
import { track } from "@/lib/analytics";

const FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#1a1c24"/><text x="50%" y="50%" fill="#5a5d6b" font-family="sans-serif" font-size="16" text-anchor="middle">Фото скоро появится</text></svg>`,
  );

export function LotCard({ lot, portalSlug }: { lot: LotCardType; portalSlug?: string }) {
  const [imgIdx, setImgIdx] = useState(0);
  const price = lot.lotCardPriceListDTO.lotCardPriceItemDTOs.find((p) => p.currency === "RUB");
  const transit = lot.lotCardTransitListDTO.lotCardTransitItemDTOs[0];
  const images = lot.images.length ? lot.images : [""];
  const badge = lot.complexTitle ?? lot.address ?? lot.district;
  // в портале ведём на портальный маршрут — страница лота берёт тему из самого маршрута
  const href = portalSlug ? `/p/${portalSlug}/lots/${lot.id}` : `/lots/${lot.id}`;

  return (
    <Link
      href={href}
      onClick={() => track("lot_card_click", { lotId: lot.id, complex: badge })}
      className="group block overflow-hidden rounded-sm border border-ink-line/40 bg-ink-soft transition-all duration-300 hover:-translate-y-1 hover:border-gold/50"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden"
        onMouseMove={(e) => {
          // листание фото по горизонтали курсора — как на лучших порталах
          if (images.length < 2) return;
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.min(
            images.length - 1,
            Math.floor(((e.clientX - r.left) / r.width) * images.length),
          );
          if (i !== imgIdx) setImgIdx(i);
        }}
        onMouseLeave={() => setImgIdx(0)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[imgIdx] ? imageUrl(images[imgIdx], 727) : FALLBACK}
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK;
          }}
          alt={lotHeadline(lot)}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {images.length > 1 && (
          <div className="absolute inset-x-3 bottom-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-0.5 flex-1 rounded ${i === imgIdx ? "bg-gold" : "bg-paper/30"}`}
              />
            ))}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs tracking-wide text-paper/90 backdrop-blur">
          {badge}
        </span>
      </div>

      <div className="p-5">
        {/* информативный заголовок — как на старом портале */}
        <h3 className="font-display text-lg leading-snug text-paper">{lotHeadline(lot)}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-muted">{lot.title}</p>

        <p className="mt-3 font-display text-xl text-gold">
          {price?.priceFormatted ?? "Цена по запросу"}
        </p>
        {price && price.pricePerAreaFormatted && (
          <p className="mt-0.5 text-xs text-muted">{price.pricePerAreaFormatted}</p>
        )}

        {transit && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: transit.color }} />
            {transit.title}
          </p>
        )}
      </div>
    </Link>
  );
}
