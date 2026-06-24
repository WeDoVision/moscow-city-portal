import type { Metadata } from "next";
import "./mcs.css";
import { MoscowCityLanding } from "./MoscowCityLanding";
import { brand, ecosystem, faq } from "./data";

export const metadata: Metadata = {
  title: "Moscow City — недвижимость делового центра: апартаменты, офисы, пентхаусы",
  description:
    "Премиальный портал недвижимости Москва-Сити: апартаменты, офисы, пентхаусы и ритейл в семи небоскрёбах — Федерация, ОКО, Neva Towers, Capital Towers, Город Столиц, Империя, Дом Дау. Актуальная база лотов, цены в ₽/$/€, подбор экспертом за 7 минут.",
  keywords: [
    "москва-сити",
    "купить апартаменты в москва-сити",
    "офисы в москва-сити",
    "пентхаусы москва-сити",
    "небоскрёбы москвы",
    "федерация",
    "neva towers",
  ],
  alternates: { canonical: "/moscow-city-s" },
  openGraph: {
    title: "Moscow City — недвижимость делового центра",
    description:
      "Апартаменты, офисы и пентхаусы в семи небоскрёбах Москва-Сити. Актуальная база лотов и подбор экспертом за 7 минут.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function MoscowCityShowcasePage() {
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
        itemListElement: ecosystem.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MoscowCityLanding />
    </>
  );
}
