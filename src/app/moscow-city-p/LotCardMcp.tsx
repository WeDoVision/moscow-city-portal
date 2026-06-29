"use client";

import { useState } from "react";
import Link from "next/link";
import type { LotCard as LotCardType } from "@/lib/whitewill/types";
import { imageUrl, lotHeadline } from "@/lib/whitewill/client";
import { track } from "@/lib/analytics";

/* ──────────────────────────────────────────────────────────────────────
 * Карточка лота в светлой mcp-теме. Общая для каталога на лендинге
 * (Search) и списков лотов на странице башни (TowerDetailMcp). Ведёт на
 * mcp-страницу лота /moscow-city-p/lots/[id], чтобы тема не рвалась.
 * ─────────────────────────────────────────────────────────────────── */

const FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#eef0f3"/><text x="50%" y="50%" fill="#9aa1ab" font-family="sans-serif" font-size="16" text-anchor="middle">Фото скоро появится</text></svg>`,
  );

export function LotCardMcp({ lot }: { lot: LotCardType }) {
  const [imgIdx, setImgIdx] = useState(0);
  const price = lot.lotCardPriceListDTO.lotCardPriceItemDTOs.find((p) => p.currency === "RUB");
  const transit = lot.lotCardTransitListDTO.lotCardTransitItemDTOs[0];
  const images = lot.images.length ? lot.images : [""];
  const badge = lot.complexTitle ?? lot.address ?? lot.district;

  return (
    <Link
      href={`/moscow-city-p/lots/${lot.id}`}
      onClick={() => track("lot_card_click", { lotId: lot.id, complex: badge })}
      className="group block overflow-hidden border border-[var(--line-light)] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#1aa3ff]"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden bg-[var(--paper-2)]"
        onMouseMove={(e) => {
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
                className={`h-0.5 flex-1 ${i === imgIdx ? "bg-[#1aa3ff]" : "bg-white/60"}`}
              />
            ))}
          </div>
        )}
        <span className="mcp-mono absolute left-3 top-3 bg-[#0a0a0b]/85 px-3 py-1 text-[11px] tracking-wide text-white backdrop-blur">
          {badge}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold leading-snug text-[var(--on-light)]">
          {lotHeadline(lot)}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-[var(--on-light-mut)]">{lot.title}</p>

        <p className="mt-3 text-xl font-bold text-[#1aa3ff]">
          {price?.priceFormatted ?? "Цена по запросу"}
        </p>
        {price && price.pricePerAreaFormatted && (
          <p className="mcp-mono mt-0.5 text-xs text-[var(--on-light-mut)]">
            {price.pricePerAreaFormatted}
          </p>
        )}

        {transit && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--on-light-mut)]">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: transit.color }}
            />
            {transit.title}
          </p>
        )}
      </div>
    </Link>
  );
}
