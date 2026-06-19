/**
 * Мульти-тенант роут (KRE-121): /p/<slug> рендерит любой портал из store
 * одним универсальным движком. Разные slug = разная структура и дизайн.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPortal, listPortals } from "@/lib/portal/store";
import { PortalRenderer } from "@/components/portal/PortalRenderer";

// порталы редактируются в админке — не кэшируем агрессивно на дев-стадии
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const portal = await getPortal(slug);
  if (!portal) return { title: "Портал не найден" };
  // absolute — чтобы не липнул суффикс корневого шаблона (Moscow City Sale)
  return { title: { absolute: portal.name } };
}

export async function generateStaticParams() {
  const portals = await listPortals();
  return portals.map((p) => ({ slug: p.slug }));
}

export default async function PortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const portal = await getPortal(slug);
  if (!portal) notFound();
  return <PortalRenderer schema={portal} />;
}
