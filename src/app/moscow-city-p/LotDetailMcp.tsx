import Link from "next/link";
import { portal } from "@/portal.config";
import { lotHeadline, lotPrice } from "@/lib/whitewill/client";
import type { LotDetails } from "@/lib/whitewill/types";
import { JsonLd } from "@/components/JsonLd";
import { LotViewTracker } from "@/components/LotViewTracker";
import { LotMessengerButtons } from "@/components/MessengerButtons";
import { McpLotGallery } from "./McpLotGallery";
import { McpLeadForm } from "./McpLeadForm";

const HOME = "/moscow-city-p";

/**
 * Тело страницы лота в теме портала /moscow-city-p (.mcp): тёмный фон, синий
 * акцент, моноширинные метки, прямоугольная геометрия. Структура повторяет
 * общую LotDetail, но визуальный язык — sui-клона, а не золотого эталона.
 */
export function LotDetailMcp({ details }: { details: LotDetails }) {
  const { card, gallery, fullDescription } = details;
  const prices = card.lotCardPriceListDTO.lotCardPriceItemDTOs;
  const rub = lotPrice(card, "RUB");
  const transit = card.lotCardTransitListDTO.lotCardTransitItemDTOs;
  const description = fullDescription ?? card.description;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Главная", item: `${portal.siteUrl}/moscow-city-p` },
          { "@type": "ListItem", position: 2, name: "Каталог", item: `${portal.siteUrl}/moscow-city-p#search` },
          { "@type": "ListItem", position: 3, name: card.title },
        ],
      },
      {
        "@type": "Apartment",
        name: card.title,
        description,
        url: `${portal.siteUrl}/moscow-city-p/lots/${card.id}`,
        image: gallery.slice(0, 5).map((g) => g.url),
        address: {
          "@type": "PostalAddress",
          addressLocality: "Москва",
          addressRegion: card.district,
          addressCountry: "RU",
        },
      },
      rub && {
        "@type": "Offer",
        itemOffered: { "@type": "Apartment", name: card.title },
        price: rub.price,
        priceCurrency: "RUB",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: portal.brand.name },
      },
    ].filter(Boolean),
  };

  return (
    <main className="mcp-dark pb-24 pt-24">
      <JsonLd data={jsonLd} />
      <LotViewTracker lotId={card.id} complex={card.complexTitle ?? card.address ?? ""} />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <nav className="mcp-mono mb-6 text-xs text-[var(--on-dark-mut)]" aria-label="Хлебные крошки">
          <Link href={HOME} className="hover:text-[#4da2ff]">
            Главная
          </Link>
          <span className="mx-2 text-[#4a5159]">/</span>
          <Link href={`${HOME}#search`} className="hover:text-[#4da2ff]">
            Каталог
          </Link>
          <span className="mx-2 text-[#4a5159]">/</span>
          <span className="text-white/80">{card.complexTitle}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0">
            <McpLotGallery images={gallery} title={card.title} />

            <h1 className="mt-8 text-2xl font-bold leading-snug tracking-tight text-white md:text-4xl">
              {lotHeadline(card)}
            </h1>
            <p className="mt-2 text-base text-white/70">{card.title}</p>
            <p className="mcp-mono mt-1 text-sm text-[var(--on-dark-mut)]">
              {[card.complexTitle ?? card.address, card.district, card.lotNumberTitle]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {transit.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4">
                {transit.map((t) => (
                  <span key={t.title} className="flex items-center gap-1.5 text-sm text-white/70">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: t.color }}
                    />
                    {t.title}
                  </span>
                ))}
              </div>
            )}

            <dl className="mcp-dotted-y mt-8 grid grid-cols-2 gap-4 py-6 sm:grid-cols-4">
              {card.lotCardInfoListDTO.lotCardInfoItemDTOs.map((i) => (
                <div key={i.title}>
                  <dt className="mcp-mono text-xs uppercase tracking-wider text-[var(--on-dark-mut)]">
                    {i.title}
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-white">{i.value}</dd>
                </div>
              ))}
              <div>
                <dt className="mcp-mono text-xs uppercase tracking-wider text-[var(--on-dark-mut)]">
                  Район
                </dt>
                <dd className="mt-1 text-xl font-semibold text-white">{card.district}</dd>
              </div>
            </dl>

            <section className="mt-8" aria-labelledby="lot-desc">
              <h2 id="lot-desc" className="text-xl font-semibold text-white">
                Описание
              </h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-white/70">
                {description}
              </p>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-[var(--line-dark)] bg-[#0d0e10] p-6">
              <p className="text-3xl font-bold text-[#4da2ff]">
                {rub?.priceFormatted ?? "Цена по запросу"}
              </p>
              {rub?.pricePerAreaFormatted && (
                <p className="mcp-mono mt-1 text-sm text-[var(--on-dark-mut)]">
                  {rub.pricePerAreaFormatted}
                </p>
              )}
              <div className="mt-3 flex gap-3 text-sm text-white/50">
                {prices
                  .filter((p) => p.currency !== "RUB")
                  .map((p) => (
                    <span key={p.currency} className="mcp-mono">
                      {p.priceFormatted}
                    </span>
                  ))}
              </div>
              <div className="mcp-dotted-b my-6 h-1" />
              <p className="mb-4 text-sm text-white/80">
                Покажем лот лично или по видеосвязи, проверим юридическую чистоту и поможем со
                сделкой — бесплатно.
              </p>
              <McpLeadForm lotId={card.id} source="lot_page_mcp" />
              <div className="mcp-mono my-4 flex items-center gap-3 text-xs text-[var(--on-dark-mut)]">
                <span className="h-px flex-1 bg-[var(--line-dark)]" />
                или напишите нам
                <span className="h-px flex-1 bg-[var(--line-dark)]" />
              </div>
              <LotMessengerButtons lotId={card.id} title={card.title} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
