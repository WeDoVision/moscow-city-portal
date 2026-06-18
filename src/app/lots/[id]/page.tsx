import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { portal } from "@/portal.config";
import { fetchLotDetails, fetchLots, lotHeadline, lotInfo, lotPrice } from "@/lib/whitewill/client";
import { LotGallery } from "@/components/LotGallery";
import { LeadForm } from "@/components/LeadForm";
import { LotMessengerButtons } from "@/components/MessengerButtons";
import { JsonLd } from "@/components/JsonLd";
import { LotViewTracker } from "@/components/LotViewTracker";

// SSG: предсобираем страницы лотов на билде, остальные — ISR по запросу
export const revalidate = 3600;
export const dynamicParams = true;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  try {
    const lots = await fetchLots({ deal: "sale", page: 1 });
    return lots.moscowLotCardDTOs.slice(0, 24).map((l) => ({ id: String(l.id) }));
  } catch {
    return [];
  }
}

async function getDetails(idStr: string) {
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return null;
  // скоупы (продажа/аренда/коммерция) перебираются внутри клиента
  return fetchLotDetails(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const details = await getDetails(id);
  if (!details) return { title: "Лот не найден" };
  const { card } = details;
  const price = lotPrice(card);
  const title = `${lotHeadline(card)} — ${card.complexTitle ?? card.address ?? "Москва-Сити"}, ${price?.priceFormatted ?? ""}`;
  const description = (details.fullDescription ?? card.description).slice(0, 300);
  return {
    title,
    description,
    alternates: { canonical: `/lots/${id}` },
    openGraph: {
      title,
      description,
      images: details.gallery[0] ? [{ url: details.gallery[0].url }] : undefined,
    },
  };
}

export default async function LotPage({ params }: Props) {
  const { id } = await params;
  const details = await getDetails(id);
  if (!details) notFound();

  const { card, gallery, fullDescription } = details;
  const info = lotInfo(card);
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
          { "@type": "ListItem", position: 1, name: "Главная", item: portal.siteUrl },
          { "@type": "ListItem", position: 2, name: "Каталог", item: `${portal.siteUrl}/#catalog` },
          { "@type": "ListItem", position: 3, name: card.title },
        ],
      },
      {
        "@type": "Apartment",
        name: card.title,
        description,
        url: `${portal.siteUrl}/lots/${card.id}`,
        image: gallery.slice(0, 5).map((g) => g.url),
        floorSize: info["Площадь"]
          ? { "@type": "QuantitativeValue", value: parseFloat(card.area), unitCode: "MTK" }
          : undefined,
        numberOfBedrooms: info["Спальни"] ? parseInt(info["Спальни"], 10) : undefined,
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
    <main className="pb-24 pt-28">
      <JsonLd data={jsonLd} />
      <LotViewTracker lotId={card.id} complex={card.complexTitle ?? card.address ?? ""} />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* хлебные крошки */}
        <nav className="mb-6 text-xs text-muted" aria-label="Хлебные крошки">
          <Link href="/" className="hover:text-gold">Главная</Link>
          <span className="mx-2">/</span>
          <Link href="/#catalog" className="hover:text-gold">Каталог</Link>
          <span className="mx-2">/</span>
          <span className="text-paper/70">{card.complexTitle}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0">
            <LotGallery images={gallery} title={card.title} />

            <h1 className="mt-8 font-display text-2xl leading-snug text-paper md:text-4xl">
              {lotHeadline(card)}
            </h1>
            <p className="mt-2 text-base text-paper/75">{card.title}</p>
            <p className="mt-1 text-sm text-muted">
              {[card.complexTitle ?? card.address, card.district, card.lotNumberTitle]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {transit.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4">
                {transit.map((t) => (
                  <span key={t.title} className="flex items-center gap-1.5 text-sm text-paper/75">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                    {t.title}
                  </span>
                ))}
              </div>
            )}

            {/* ключевые факты — полезно и людям, и LLM (AEO) */}
            <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-ink-line/40 py-6 sm:grid-cols-4">
              {card.lotCardInfoListDTO.lotCardInfoItemDTOs.map((i) => (
                <div key={i.title}>
                  <dt className="text-xs uppercase tracking-wider text-muted">{i.title}</dt>
                  <dd className="mt-1 font-display text-xl text-paper">{i.value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">Район</dt>
                <dd className="mt-1 font-display text-xl text-paper">{card.district}</dd>
              </div>
            </dl>

            <section className="mt-8" aria-labelledby="lot-desc">
              <h2 id="lot-desc" className="font-display text-xl text-paper">Описание</h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-paper/75">
                {description}
              </p>
            </section>
          </div>

          {/* сайдбар с ценой и заявкой */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-sm border border-ink-line/40 bg-ink-soft/80 p-6">
              <p className="font-display text-3xl text-gold">{rub?.priceFormatted ?? "Цена по запросу"}</p>
              {rub?.pricePerAreaFormatted && (
                <p className="mt-1 text-sm text-muted">{rub.pricePerAreaFormatted}</p>
              )}
              <div className="mt-3 flex gap-3 text-sm text-paper/60">
                {prices
                  .filter((p) => p.currency !== "RUB")
                  .map((p) => (
                    <span key={p.currency}>{p.priceFormatted}</span>
                  ))}
              </div>
              <div className="hairline my-6" />
              <p className="mb-4 text-sm text-paper/80">
                Покажем лот лично или по видеосвязи, проверим юридическую чистоту и поможем со
                сделкой — бесплатно.
              </p>
              <LeadForm lotId={card.id} source="lot_page" />
              <div className="my-4 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-ink-line/60" />
                или напишите нам
                <span className="h-px flex-1 bg-ink-line/60" />
              </div>
              <LotMessengerButtons lotId={card.id} title={card.title} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
