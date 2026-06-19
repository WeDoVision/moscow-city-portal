import { NextResponse } from "next/server";
import { deletePortal, getPortal } from "@/lib/portal/store";

/** Один портал (KRE-124): GET — схема, DELETE — удалить. */

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const portal = await getPortal(slug);
  if (!portal) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ portal });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await deletePortal(slug);
  return NextResponse.json({ ok: true });
}
