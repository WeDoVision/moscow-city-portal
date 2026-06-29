"use client";

import { useMemo, useState } from "react";
import type { GalleryImage } from "@/lib/whitewill/types";
import { imageUrl } from "@/lib/whitewill/client";
import { track } from "@/lib/analytics";

const CATEGORY_LABELS: Record<string, string> = {
  living_room: "Гостиная",
  bedroom: "Спальня",
  kitchen: "Кухня",
  bathroom: "Ванная",
  hallway: "Холл",
  wardrobe: "Гардеробная",
  window_views: "Виды из окон",
  schemas: "Планировка",
  architecture: "Архитектура",
  infrastructure: "Инфраструктура",
  photo: "Фото",
};

/** Галерея лота в mcp-теме: категории-чипы, крупный кадр, лента превью. */
export function McpLotGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const img of images) {
      if (!seen.includes(img.category)) seen.push(img.category);
    }
    return seen;
  }, [images]);

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const filtered = activeCat ? images.filter((i) => i.category === activeCat) : images;
  const [idx, setIdx] = useState(0);
  const current = filtered[Math.min(idx, filtered.length - 1)];

  const go = (next: number) => {
    setIdx((next + filtered.length) % filtered.length);
    track("gallery_interaction", { action: "navigate" });
  };

  if (!images.length) return null;

  const chip = (active: boolean) =>
    `mcp-mono shrink-0 border px-4 py-1.5 text-xs tracking-tight transition-colors ${
      active
        ? "border-[#1aa3ff] bg-[#1aa3ff] text-white"
        : "border-[var(--line-dark)] text-[var(--on-dark-mut)] hover:border-white hover:text-white"
    }`;

  return (
    <div>
      {categories.length > 1 && (
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveCat(null);
              setIdx(0);
            }}
            aria-pressed={activeCat === null}
            className={chip(activeCat === null)}
          >
            Все ({images.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                setActiveCat(c);
                setIdx(0);
                track("gallery_interaction", { action: "category", category: c });
              }}
              aria-pressed={activeCat === c}
              className={chip(activeCat === c)}
            >
              {CATEGORY_LABELS[c] ?? c}
            </button>
          ))}
        </div>
      )}

      <div className="group relative overflow-hidden border border-[var(--line-dark)] bg-[#0d0e10]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(current.url, 1600)}
          alt={`${title} — ${CATEGORY_LABELS[current.category] ?? current.category}`}
          className="aspect-[16/10] w-full object-cover"
        />
        {filtered.length > 1 && (
          <>
            <button
              onClick={() => go(idx - 1)}
              aria-label="Предыдущее фото"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#0a0a0b]/70 px-4 py-3 text-white opacity-0 backdrop-blur transition-opacity hover:bg-[#1aa3ff] group-hover:opacity-100"
            >
              ←
            </button>
            <button
              onClick={() => go(idx + 1)}
              aria-label="Следующее фото"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#0a0a0b]/70 px-4 py-3 text-white opacity-0 backdrop-blur transition-opacity hover:bg-[#1aa3ff] group-hover:opacity-100"
            >
              →
            </button>
            <span className="mcp-mono absolute bottom-4 right-4 bg-[#0a0a0b]/75 px-3 py-1 text-xs text-white/90 backdrop-blur">
              {Math.min(idx + 1, filtered.length)} / {filtered.length}
            </span>
          </>
        )}
      </div>

      {filtered.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {filtered.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.url + i}
              src={imageUrl(img.url, 310)}
              alt=""
              onClick={() => go(i)}
              className={`h-20 w-28 shrink-0 cursor-pointer object-cover transition-opacity ${
                i === Math.min(idx, filtered.length - 1)
                  ? "ring-2 ring-[#1aa3ff]"
                  : "opacity-50 hover:opacity-100"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
