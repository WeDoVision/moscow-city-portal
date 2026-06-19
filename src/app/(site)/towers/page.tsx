import type { Metadata } from "next";
import Link from "next/link";
import { portal } from "@/portal.config";
import { fetchComplexes, imageUrl } from "@/lib/whitewill/client";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Башни Москва-Сити: квартиры и апартаменты в небоскрёбах",
  description:
    "Семь башен делового центра Москва-Сити: Capital Towers, Neva Towers, ОКО, Федерация, Город Столиц, Империя, Дом Дау. Цены, описания и актуальные лоты каждой башни.",
  alternates: { canonical: "/towers" },
};

export default async function TowersPage() {
  const complexes = await fetchComplexes().catch(() => []);
  const byId = new Map(complexes.map((c) => [c.id, c]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Башни Москва-Сити",
    itemListElement: portal.towers.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: `${portal.siteUrl}/towers/${t.slug}`,
    })),
  };

  return (
    <main className="pb-24 pt-32">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Каталог башен</p>
        <h1 className="mt-3 font-display text-4xl text-paper md:text-6xl">Башни Москва-Сити</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
          Каждая башня Сити — отдельный характер: высота, статус помещений, инфраструктура и
          виды. Выберите башню, чтобы посмотреть её лоты.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {portal.towers.map((t, i) => {
            const cx = byId.get(t.id);
            const img = cx?.images?.[0];
            return (
              <Reveal key={t.id} delay={(i % 2) * 80}>
                <Link
                  href={`/towers/${t.slug}`}
                  className="group relative block h-[360px] overflow-hidden rounded-sm border border-ink-line/40"
                >
                  {img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imageUrl(img, 1100)}
                      alt={t.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-ink-soft" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-7">
                    <div>
                      <h2 className="font-display text-3xl text-paper">{t.name}</h2>
                      <p className="mt-1 text-sm text-paper/65">{t.tagline}</p>
                      {cx?.complexCardPriceDTO?.priceFormatted && (
                        <p className="mt-2 text-sm text-gold">{cx.complexCardPriceDTO.priceFormatted}</p>
                      )}
                    </div>
                    <span className="font-display text-2xl text-gold opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
                      →
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </main>
  );
}
