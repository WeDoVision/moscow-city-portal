import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { portal, towerBySlug } from "@/portal.config";
import { fetchComplexes, fetchLots, imageUrl } from "@/lib/whitewill/client";
import { JsonLd } from "@/components/JsonLd";
import { LotCard } from "@/components/LotCard";
import { LeadForm } from "@/components/LeadForm";

export const revalidate = 1800;
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return portal.towers.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tower = towerBySlug.get(slug);
  if (!tower) return { title: "Башня не найдена" };
  return {
    title: `${tower.name} — лоты, цены, описание башни`,
    description: `${tower.name} (${tower.tagline}) в Москва-Сити: актуальные квартиры и апартаменты в продаже и аренде, цены в ₽/$/€, консультация эксперта.`,
    alternates: { canonical: `/towers/${slug}` },
  };
}

export default async function TowerPage({ params }: Props) {
  const { slug } = await params;
  const tower = towerBySlug.get(slug);
  if (!tower) notFound();

  const [saleLots, rentLots, complexes] = await Promise.all([
    fetchLots({ deal: "sale", towers: [tower.id], page: 1 }, 1800),
    fetchLots({ deal: "rent", towers: [tower.id], page: 1 }, 1800).catch(() => null),
    fetchComplexes().catch(() => []),
  ]);
  const cx = complexes.find((c) => c.id === tower.id);
  const heroImg = cx?.images?.[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Главная", item: portal.siteUrl },
          { "@type": "ListItem", position: 2, name: "Башни", item: `${portal.siteUrl}/towers` },
          { "@type": "ListItem", position: 3, name: tower.name },
        ],
      },
      {
        "@type": "ApartmentComplex",
        name: tower.name,
        description: cx?.description ?? tower.tagline,
        url: `${portal.siteUrl}/towers/${tower.slug}`,
        image: heroImg ? imageUrl(heroImg, 1600) : undefined,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Москва",
          addressRegion: "Пресненский район",
          addressCountry: "RU",
        },
      },
    ],
  };

  return (
    <main className="pb-24">
      <JsonLd data={jsonLd} />

      {/* шапка башни */}
      <section className="relative flex min-h-[60svh] items-end overflow-hidden">
        {heroImg && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl(heroImg, 2200)}
            alt={tower.name}
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 pt-40 md:px-8">
          <nav className="mb-4 text-xs text-paper/60" aria-label="Хлебные крошки">
            <Link href="/" className="hover:text-gold">Главная</Link>
            <span className="mx-2">/</span>
            <Link href="/towers" className="hover:text-gold">Башни</Link>
            <span className="mx-2">/</span>
            <span className="text-paper/85">{tower.name}</span>
          </nav>
          <h1 className="font-display text-4xl text-paper md:text-6xl">{tower.name}</h1>
          <p className="mt-3 text-base text-paper/70 md:text-lg">{tower.tagline}</p>
          {cx?.complexCardPriceDTO?.priceFormatted && (
            <p className="mt-4 font-display text-2xl text-gold">{cx.complexCardPriceDTO.priceFormatted}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {cx?.description && (
          <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_380px]" aria-label="О башне">
            <p className="max-w-3xl text-base leading-relaxed text-paper/80 md:text-lg">
              {cx.description}
            </p>
            <div className="rounded-sm border border-ink-line/40 bg-ink-soft/80 p-6">
              <p className="mb-4 font-display text-lg text-paper">Консультация по башне</p>
              <LeadForm source={`tower_${tower.slug}`} />
            </div>
          </section>
        )}

        <section className="mt-16" aria-labelledby="tower-sale">
          <div className="flex items-baseline justify-between">
            <h2 id="tower-sale" className="font-display text-2xl text-paper md:text-3xl">
              В продаже · {saleLots.total}
            </h2>
            <Link
              href={`/?towers=${tower.id}#catalog`}
              className="text-sm text-gold underline-offset-4 hover:underline"
            >
              Все с фильтрами →
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saleLots.moscowLotCardDTOs.slice(0, 9).map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>
          {saleLots.total === 0 && (
            <p className="py-10 text-muted">Сейчас в продаже нет открытых лотов — оставьте заявку, подберём закрытые предложения.</p>
          )}
        </section>

        {rentLots && rentLots.total > 0 && (
          <section className="mt-16" aria-labelledby="tower-rent">
            <h2 id="tower-rent" className="font-display text-2xl text-paper md:text-3xl">
              В аренду · {rentLots.total}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rentLots.moscowLotCardDTOs.slice(0, 6).map((lot) => (
                <LotCard key={lot.id} lot={lot} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
