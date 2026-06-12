import { portal } from "@/portal.config";

export const revalidate = 86400;

/**
 * llms.txt — AEO: краткая машиночитаемая выжимка о сайте для LLM-краулеров
 * (по аналогии с robots.txt; формат — https://llmstxt.org).
 */
export function GET() {
  const lines = [
    `# ${portal.brand.name}`,
    "",
    `> ${portal.seo.description}`,
    "",
    "Портал недвижимости делового центра Москва-Сити: живая база квартир,",
    "апартаментов и пентхаусов в семи башнях, цены в ₽/$/€, фильтры по башне,",
    "бюджету и спальням. Данные синхронизированы с API Whitewill и обновляются ежедневно.",
    "",
    "## Основные страницы",
    "",
    `- [Каталог лотов](${portal.siteUrl}/#catalog): все предложения с фильтрами`,
    `- [Башни](${portal.siteUrl}/towers): список башен Сити с ценами от`,
    ...portal.towers.map(
      (t) => `- [${t.name}](${portal.siteUrl}/towers/${t.slug}): ${t.tagline}`,
    ),
    "",
    "## Частые вопросы",
    "",
    ...portal.faq.map((f) => `- ${f.q} ${f.a}`),
    "",
    "## Контакты",
    "",
    `- Телефон: ${portal.brand.phone}`,
    `- Email: ${portal.brand.email}`,
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
