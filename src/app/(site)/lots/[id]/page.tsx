import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchLotDetails, fetchLots, lotHeadline, lotPrice } from "@/lib/whitewill/client";
import { LotDetail } from "@/components/LotDetail";

// SSG: предсобираем страницы лотов на билде, остальные — ISR по запросу
export const revalidate = 3600;
export const dynamicParams = true;

type Props = {
  params: Promise<{ id: string }>;
};

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
  // скоупы (продажа/аренда/коммерция) перебираются внутри клиента
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
    alternates: { canonical: `/lots/${id}` },
    openGraph: {
      title,
      description,
      images: details.gallery[0] ? [{ url: details.gallery[0].url }] : undefined,
    },
  };
}

export default async function LotPage({ params }: Props) {
  const { id } = await params;
  const details = await getDetails(id);
  if (!details) notFound();
  return <LotDetail details={details} />;
}
