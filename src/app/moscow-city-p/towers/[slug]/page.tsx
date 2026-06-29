import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { portal, towerBySlug } from "@/portal.config";
import { McpHeader, McpFooter } from "../../Chrome";
import { TowerDetailMcp } from "../../TowerDetailMcp";

/**
 * Страница башни в теме портала /moscow-city-p. Карточки башен на лендинге
 * (таймлайн toolkit) ведут сюда. Визуальный язык .mcp (sui-клон).
 */
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
    alternates: { canonical: `/moscow-city-p/towers/${slug}` },
  };
}

export default async function McpTowerPage({ params }: Props) {
  const { slug } = await params;
  const tower = towerBySlug.get(slug);
  if (!tower) notFound();
  return (
    <div className="mcp">
      <McpHeader />
      <TowerDetailMcp tower={tower} />
      <McpFooter />
    </div>
  );
}
