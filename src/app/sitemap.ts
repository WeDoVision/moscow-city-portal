import type { MetadataRoute } from "next";
import { portal } from "@/portal.config";
import { fetchLots } from "@/lib/whitewill/client";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = portal.siteUrl;
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/towers`, changeFrequency: "weekly", priority: 0.9 },
    ...portal.towers.map((t) => ({
      url: `${base}/towers/${t.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  // лоты в продаже и аренде — каждый получает страницу в индексе
  const lotPages: MetadataRoute.Sitemap = [];
  for (const deal of ["sale", "rent"] as const) {
    try {
      let page = 1;
      // sitemap ограничиваем разумным числом страниц каталога
      for (; page <= 5; page++) {
        const res = await fetchLots({ deal, page }, 3600);
        lotPages.push(
          ...res.moscowLotCardDTOs.map((l) => ({
            url: `${base}/lots/${l.id}`,
            changeFrequency: "daily" as const,
            priority: 0.7,
          })),
        );
        if (!res.hasMorePages) break;
      }
    } catch {
      // апстрим недоступен — отдаём хотя бы статические страницы
    }
  }
  return [...staticPages, ...lotPages];
}
