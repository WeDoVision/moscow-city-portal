import Link from "next/link";
import { portal } from "@/portal.config";
import { fetchComplexes, fetchLots, imageUrl } from "@/lib/whitewill/client";
import { JsonLd } from "@/components/JsonLd";
import { LotCardMcp } from "./LotCardMcp";
import { McpLeadForm } from "./McpLeadForm";

type Tower = { id: number; name: string; slug: string; tagline: string };

const HOME = "/moscow-city-p";

/**
 * Тело страницы башни в теме портала /moscow-city-p (.mcp). Структура та же,
 * что у общей TowerDetail (герой-фото, описание, списки лотов в продаже/аренде),
 * но визуальный язык — sui-клона: монохром + синий, моно-метки, прямоугольники.
 */
export async function TowerDetailMcp({ tower }: { tower: Tower }) {
  const [saleLots, rentLots, complexes] = await Promise.all([
    fetchLots({ deal: "sale", towers: [tower.id], page: 1 }, 1800),
    fetchLots({ deal: "rent", towers: [tower.id], page: 1 }, 1800).catch(() => null),
    fetchComplexes().catch(() => []),
  ]);
  const cx = complexes.find((c) => c.id === tower.id);
  const heroImg = cx?.images?.[0];
  const catalogHref = `${HOME}#search`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Главная", item: `${portal.siteUrl}/moscow-city-p` },
          { "@type": "ListItem", position: 2, name: "Башни", item: `${portal.siteUrl}/moscow-city-p#toolkit` },
          { "@type": "ListItem", position: 3, name: tower.name },
        ],
      },
      {
        "@type": "ApartmentComplex",
        name: tower.name,
        description: cx?.description ?? tower.tagline,
        url: `${portal.siteUrl}/moscow-city-p/towers/${tower.slug}`,
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
    <main className="mcp-dark pb-24">
      <JsonLd data={jsonLd} />

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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-[#0a0a0b]/20" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 pt-40 md:px-8">
          <nav className="mcp-mono mb-4 text-xs text-white/60" aria-label="Хлебные крошки">
            <Link href={HOME} className="hover:text-[#4da2ff]">
              Главная
            </Link>
            <span className="mx-2 text-white/30">/</span>
            <Link href={`${HOME}#toolkit`} className="hover:text-[#4da2ff]">
              Башни
            </Link>
            <span className="mx-2 text-white/30">/</span>
            <span className="text-white/85">{tower.name}</span>
          </nav>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">{tower.name}</h1>
          <p className="mt-3 text-base text-white/70 md:text-lg">{tower.tagline}</p>
          {cx?.complexCardPriceDTO?.priceFormatted && (
            <p className="mt-4 text-2xl font-bold text-[#4da2ff]">
              {cx.complexCardPriceDTO.priceFormatted}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {cx?.description && (
          <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_380px]" aria-label="О башне">
            <p className="max-w-3xl text-base leading-relaxed text-white/80 md:text-lg">
              {cx.description}
            </p>
            <div className="border border-[var(--line-dark)] bg-[#0d0e10] p-6">
              <p className="mb-4 text-lg font-semibold text-white">Консультация по башне</p>
              <McpLeadForm source={`tower_${tower.slug}_mcp`} />
            </div>
          </section>
        )}

        <section className="mt-16" aria-labelledby="tower-sale">
          <div className="flex items-baseline justify-between">
            <h2 id="tower-sale" className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              В продаже · {saleLots.total}
            </h2>
            <Link
              href={catalogHref}
              className="mcp-mono text-sm text-[#4da2ff] underline-offset-4 hover:underline"
            >
              Все лоты в каталоге →
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saleLots.moscowLotCardDTOs.slice(0, 9).map((lot) => (
              <LotCardMcp key={lot.id} lot={lot} />
            ))}
          </div>
          {saleLots.total === 0 && (
            <p className="py-10 text-[var(--on-dark-mut)]">
              Сейчас в продаже нет открытых лотов — оставьте заявку, подберём закрытые предложения.
            </p>
          )}
        </section>

        {rentLots && rentLots.total > 0 && (
          <section className="mt-16" aria-labelledby="tower-rent">
            <h2 id="tower-rent" className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              В аренду · {rentLots.total}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rentLots.moscowLotCardDTOs.slice(0, 6).map((lot) => (
                <LotCardMcp key={lot.id} lot={lot} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
