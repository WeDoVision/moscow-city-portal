import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../osb.css";
import { getMansion, fetchMansions } from "@/lib/osobnyaki/lots";
import { OsbHeader, OsbFooter } from "../../Chrome";
import { LotDetail } from "../../LotDetail";

/**
 * Страница особняка в теме портала /osobnyaki-c. Данные — из того же каталога
 * (сегмент mansions API whitewill), что и лендинг. Карточки каталога ведут сюда.
 */
export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  try {
    const { lots } = await fetchMansions();
    return lots.slice(0, 24).map((l) => ({ id: String(l.id) }));
  } catch {
    return [];
  }
}

async function getLot(idStr: string) {
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return null;
  return getMansion(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lot = await getLot(id);
  if (!lot) return { title: "Особняк не найден" };
  const title = `${lot.title} — ${lot.priceLabel} | osobnyaki.com`;
  const description = (lot.description || `${lot.areaLabel} · ${lot.purpose}`).slice(0, 300);
  return {
    // absolute — чтобы не липнул суффикс корневого шаблона (Moscow City Sale)
    title: { absolute: title },
    description,
    alternates: { canonical: `/osobnyaki-c/lots/${id}` },
    openGraph: { title, description, images: lot.image ? [{ url: lot.image }] : undefined },
  };
}

export default async function OsobnyakiLotPage({ params }: Props) {
  const { id } = await params;
  const lot = await getLot(id);
  if (!lot) notFound();
  return (
    <div className="osb">
      <OsbHeader />
      <LotDetail lot={lot} />
      <OsbFooter />
    </div>
  );
}
