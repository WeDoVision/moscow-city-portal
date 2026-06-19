import { notFound } from "next/navigation";
import { getPortal } from "@/lib/portal/store";
import { PortalEditor } from "./PortalEditor";

/** Редактор портала (KRE-124). Серверная обёртка грузит схему из store. */

export const dynamic = "force-dynamic";

export default async function EditPortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const portal = await getPortal(slug);
  if (!portal) notFound();
  return <PortalEditor initial={portal} />;
}
