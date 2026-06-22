/**
 * Страница башни в контексте портала: /p/<slug>/towers/<tower>.
 * Тема и chrome — из портала по маршруту. Тело общее с эталоном (TowerDetail).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPortal } from "@/lib/portal/store";
import { towerBySlug } from "@/portal.config";
import { PortalChrome } from "@/components/portal/PortalChrome";
import { TowerDetail } from "@/components/TowerDetail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; tower: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, tower: towerSlug } = await params;
  const [portal, tower] = await Promise.all([getPortal(slug), towerBySlug.get(towerSlug)]);
  if (!portal || !tower) return { title: "Башня не найдена" };
  return {
    title: { absolute: `${tower.name} · ${portal.name}` },
    alternates: { canonical: `/p/${slug}/towers/${towerSlug}` },
  };
}

export default async function PortalTowerPage({ params }: Props) {
  const { slug, tower: towerSlug } = await params;
  const portal = await getPortal(slug);
  const tower = towerBySlug.get(towerSlug);
  if (!portal || !tower) notFound();
  return (
    <PortalChrome schema={portal}>
      <TowerDetail tower={tower} base={`/p/${slug}`} portalSlug={slug} />
    </PortalChrome>
  );
}
