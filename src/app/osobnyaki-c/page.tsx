import type { Metadata } from "next";
import "./osb.css";
import { OsobnyakiLanding } from "./OsobnyakiLanding";
import { brand, posts, collections } from "./data";

export const metadata: Metadata = {
  title: "osobnyaki.com — все особняки и отдельно стоящие здания Москвы",
  description:
    "Каталог особняков и отдельно стоящих зданий Москвы: продажа от собственника без комиссии, аренда, памятники архитектуры (ОКН), городские усадьбы. Бесплатный подбор экспертом за 25 минут. Проект Whitewill.",
  keywords: [
    "купить особняк в москве",
    "особняки москвы",
    "отдельно стоящее здание",
    "городская усадьба",
    "памятник архитектуры окн",
    "аренда особняка",
    "продать особняк",
  ],
  alternates: { canonical: "/osobnyaki-c" },
  openGraph: {
    title: "osobnyaki.com — все особняки Москвы",
    description:
      "Особняки Москвы в каталоге: продажа от собственника без комиссии, аренда, ОКН и городские усадьбы. Подбор экспертом за 25 минут.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function OsobnyakiClonePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateAgent",
        name: brand.name,
        telephone: brand.phone,
        email: brand.email,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Москва",
          streetAddress: "Пресненская набережная, 6с2, башня «Империя», офис 4315",
          addressCountry: "RU",
        },
      },
      {
        "@type": "ItemList",
        name: "Подборки особняков Москвы",
        itemListElement: collections.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.title,
        })),
      },
      {
        "@type": "Blog",
        name: "Блог про особняки Москвы",
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
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
      <OsobnyakiLanding />
    </>
  );
}
