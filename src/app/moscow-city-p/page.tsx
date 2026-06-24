import type { Metadata } from "next";
import "./mcp.css";
import { SuiClone } from "./SuiClone";
import { brand, toolkit, faq } from "./data";
import { portal } from "@/portal.config";
import { fetchComplexes, imageUrl } from "@/lib/whitewill/client";

// Статика с фоновым обновлением — фото башен из API не протухают.
export const revalidate = 600;

export type TowerCard = {
  num: string;
  name: string;
  tagline: string;
  label: string;
  logo: string;
  img: string | null;
  href: string;
};

export const metadata: Metadata = {
  title: "Moscow City — недвижимость делового центра: апартаменты, офисы, пентхаусы",
  description:
    "Премиальный портал недвижимости Москва-Сити: апартаменты, офисы, пентхаусы и ритейл в семи небоскрёбах. Актуальная база лотов, цены в ₽/$/€, подбор экспертом за 7 минут.",
  keywords: [
    "москва-сити",
    "купить апартаменты в москва-сити",
    "офисы в москва-сити",
    "пентхаусы москва-сити",
    "небоскрёбы москвы",
  ],
  alternates: { canonical: "/moscow-city-p" },
  openGraph: {
    title: "Moscow City — недвижимость делового центра",
    description:
      "Апартаменты, офисы и пентхаусы в семи небоскрёбах Москва-Сити. Подбор экспертом за 7 минут.",
    type: "website",
    locale: "ru_RU",
  },
};

export default async function MoscowCityClonePage() {
  const complexes = await fetchComplexes().catch(() => []);
  const byId = new Map(complexes.map((c) => [c.id, c]));

  const towers: TowerCard[] = portal.towers.map((t, i) => {
    const cx = byId.get(t.id);
    const img = cx?.images?.[0];
    return {
      num: String(i + 1).padStart(2, "0"),
      name: t.name,
      tagline: t.tagline,
      label: t.tagline.toUpperCase(),
      logo: t.name.slice(0, 1),
      img: img ? imageUrl(img, 900) : null,
      href: `/towers/${t.slug}`,
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateAgent",
        name: `${brand.name} Sale`,
        telephone: brand.phone,
        email: brand.email,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Москва",
          streetAddress: "Пресненская набережная, 6с2",
          addressCountry: "RU",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "ItemList",
        name: "Башни Москва-Сити",
        itemListElement: towers.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SuiClone towers={towers} />
    </>
  );
}
