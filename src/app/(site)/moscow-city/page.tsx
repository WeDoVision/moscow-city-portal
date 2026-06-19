import { Suspense } from "react";
import { portal } from "@/portal.config";
import { fetchComplexes, fetchLots } from "@/lib/whitewill/client";
import { Hero } from "@/components/Hero";
import { Catalog } from "@/components/Catalog";
import { CityMap3D } from "@/components/city3d/CityMap3D";
import { TowersStrip } from "@/components/TowersStrip";
import { AboutSection } from "@/components/AboutSection";
import { FaqSection } from "@/components/FaqSection";
import { CtaSection } from "@/components/CtaSection";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";

// Статическая генерация с фоновым обновлением каждые 10 минут:
// страница отдаётся как статика (SEO), данные не протухают.
export const revalidate = 600;

export default async function HomePage() {
  const [lots, complexes] = await Promise.all([
    fetchLots({ deal: "sale", page: 1 }),
    fetchComplexes().catch(() => []),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: portal.brand.name,
        url: portal.siteUrl,
        telephone: portal.brand.phone,
        email: portal.brand.email,
        description: portal.seo.description,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Москва",
          streetAddress: "Пресненская набережная, 8с1",
          addressCountry: "RU",
        },
      },
      {
        "@type": "WebSite",
        name: portal.brand.name,
        url: portal.siteUrl,
        inLanguage: "ru",
      },
      {
        "@type": "FAQPage",
        mainEntity: portal.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "ItemList",
        name: "Башни Москва-Сити",
        itemListElement: portal.towers.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          url: `${portal.siteUrl}/towers/${t.slug}`,
        })),
      },
    ],
  };

  return (
    <main>
      <JsonLd data={jsonLd} />
      <Hero />

      <CityMap3D complexes={complexes} />

      <section id="catalog" className="scroll-mt-20 py-20 md:py-24" aria-labelledby="catalog-title">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-gold">Каталог</p>
            <h2 id="catalog-title" className="mt-3 font-display text-3xl text-paper md:text-5xl">
              Лоты в продаже и аренде
            </h2>
            <p className="mt-4 max-w-2xl text-base text-muted">
              Живая база предложений семи башен. Фильтруйте по башне, бюджету и количеству
              спален — данные обновляются ежедневно по API Whitewill.
            </p>
          </Reveal>
          <div className="mt-10">
            <Suspense>
              <Catalog initial={lots} />
            </Suspense>
          </div>
        </div>
      </section>

      <div className="hairline mx-auto max-w-7xl" />
      <TowersStrip complexes={complexes} />
      <AboutSection />
      <FaqSection />
      <div className="hairline mx-auto max-w-7xl" />
      <CtaSection />
    </main>
  );
}
