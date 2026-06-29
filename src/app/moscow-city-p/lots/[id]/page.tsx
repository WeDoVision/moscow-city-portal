import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchLotDetails, fetchLots, lotHeadline, lotPrice } from "@/lib/whitewill/client";
import { McpHeader, McpFooter } from "../../Chrome";
import { LotDetailMcp } from "../../LotDetailMcp";

/**
 * Страница лота в теме портала /moscow-city-p. Та же выдача API, что у
 * эталонного /lots/[id], но визуальный язык .mcp (sui-клон). Карточки лотов
 * на лендинге и странице башни ведут именно сюда.
 */
export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  try {
    const lots = await fetchLots({ deal: "sale", page: 1 });
    return lots.moscowLotCardDTOs.slice(0, 24).map((l) => ({ id: String(l.id) }));
  } catch {
    return [];
  }
}

async function getDetails(idStr: string) {
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return null;
  return fetchLotDetails(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const details = await getDetails(id);
  if (!details) return { title: "Лот не найден" };
  const { card } = details;
  const price = lotPrice(card);
  const title = `${lotHeadline(card)} — ${card.complexTitle ?? card.address ?? "Москва-Сити"}, ${price?.priceFormatted ?? ""}`;
  const description = (details.fullDescription ?? card.description).slice(0, 300);
  return {
    title,
    description,
    alternates: { canonical: `/moscow-city-p/lots/${id}` },
    openGraph: {
      title,
      description,
      images: details.gallery[0] ? [{ url: details.gallery[0].url }] : undefined,
    },
  };
}

export default async function McpLotPage({ params }: Props) {
  const { id } = await params;
  const details = await getDetails(id);
  if (!details) notFound();
  return (
    <div className="mcp">
      <McpHeader />
      <LotDetailMcp details={details} />
      <McpFooter />
    </div>
  );
}
