import Link from "next/link";
import { portal } from "@/portal.config";
import type { ComplexCard } from "@/lib/whitewill/types";
import { imageUrl } from "@/lib/whitewill/client";
import { Reveal } from "./Reveal";

/** Горизонтальная лента башен с фото из API комплексов */
export function TowersStrip({ complexes }: { complexes: ComplexCard[] }) {
  const byId = new Map(complexes.map((c) => [c.id, c]));

  return (
    <section className="py-20 md:py-28" aria-labelledby="towers-title">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Семь вертикалей</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 id="towers-title" className="font-display text-3xl text-paper md:text-5xl">
              Башни Москва-Сити
            </h2>
            <Link href="/towers" className="text-sm text-gold underline-offset-4 hover:underline">
              Все башни →
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="no-scrollbar mt-10 flex gap-5 overflow-x-auto px-5 md:px-8">
        {portal.towers.map((t, i) => {
          const cx = byId.get(t.id);
          const img = cx?.images?.[0];
          return (
            <Reveal key={t.id} delay={i * 60} className="shrink-0">
              <Link
                href={`/towers/${t.slug}`}
                className="group relative block h-[420px] w-[300px] overflow-hidden rounded-sm border border-ink-line/40"
              >
                {img ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl(img, 727)}
                    alt={t.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-ink-soft" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-display text-2xl text-paper">{t.name}</h3>
                  <p className="mt-1 text-sm text-paper/65">{t.tagline}</p>
                  {cx?.complexCardPriceDTO?.priceFormatted && (
                    <p className="mt-3 text-sm text-gold">{cx.complexCardPriceDTO.priceFormatted}</p>
                  )}
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
