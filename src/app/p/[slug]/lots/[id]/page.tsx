/**
 * Страница лота в контексте портала: /p/<slug>/lots/<id>.
 * Тема и chrome берутся из самого портала (по slug из маршрута) — никаких
 * query-параметров. Тело лота общее с эталонным сайтом (LotDetail).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPortal } from "@/lib/portal/store";
import { fetchLotDetails, lotHeadline, lotPrice } from "@/lib/whitewill/client";
import { PortalChrome } from "@/components/portal/PortalChrome";
import { LotDetail } from "@/components/LotDetail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; id: string }> };

async function load(slug: string, idStr: string) {
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return null;
  const [portal, details] = await Promise.all([getPortal(slug), fetchLotDetails(id)]);
  if (!portal || !details) return null;
  return { portal, details };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const data = await load(slug, id);
  if (!data) return { title: "Лот не найден" };
  const { card } = data.details;
  const price = lotPrice(card);
  const title = `${lotHeadline(card)}${price?.priceFormatted ? ` — ${price.priceFormatted}` : ""} · ${data.portal.name}`;
  return { title: { absolute: title }, alternates: { canonical: `/p/${slug}/lots/${id}` } };
}

export default async function PortalLotPage({ params }: Props) {
  const { slug, id } = await params;
  const data = await load(slug, id);
  if (!data) notFound();
  return (
    <PortalChrome schema={data.portal}>
      <LotDetail details={data.details} base={`/p/${slug}`} />
    </PortalChrome>
  );
}
