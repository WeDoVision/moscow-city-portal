import { NextRequest, NextResponse } from "next/server";
import { listPortals, savePortal } from "@/lib/portal/store";
import { sanitizeSchema } from "@/lib/portal/validate";
import { fail } from "@/lib/portal/ai-errors";

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
    return fail("bad_request", "Не удалось сохранить: тело запроса не читается. Обновите страницу и попробуйте снова.", 400);
  }
  // санитайз — наверх отдаём только UI/UX, неизвестные блоки выкидываются
  const schema = sanitizeSchema(body);
  await savePortal(schema);
  return NextResponse.json({ ok: true, slug: schema.slug, schema });
}
