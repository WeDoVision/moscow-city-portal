import { NextRequest, NextResponse } from "next/server";
import { listPortals, savePortal } from "@/lib/portal/store";
import { sanitizeSchema } from "@/lib/portal/validate";

/** Админ-CRUD порталов (KRE-124). GET — список, POST — сохранить схему. */

export async function GET() {
  const portals = await listPortals();
  return NextResponse.json({ portals });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  // санитайз — наверх отдаём только UI/UX, неизвестные блоки выкидываются
  const schema = sanitizeSchema(body);
  await savePortal(schema);
  return NextResponse.json({ ok: true, slug: schema.slug, schema });
}
