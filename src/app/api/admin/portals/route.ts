import { NextRequest, NextResponse } from "next/server";
import { deletePortal, getPortal, listPortals, savePortal } from "@/lib/portal/store";
import { sanitizeSchema } from "@/lib/portal/validate";
import { fail } from "@/lib/portal/ai-errors";

/** Админ-CRUD порталов (KRE-124). GET — список, POST — сохранить схему (с переименованием). */

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

  // поддерживаем { schema, prevSlug } и «голую» схему (обратная совместимость)
  const obj = (body && typeof body === "object" ? body : {}) as { schema?: unknown; prevSlug?: unknown };
  const input = "schema" in obj ? obj.schema : body;
  const prevSlug = typeof obj.prevSlug === "string" ? obj.prevSlug : null;

  // санитайз — наверх отдаём только UI/UX, неизвестные блоки выкидываются
  const schema = sanitizeSchema(input);

  // смена адреса: новый slug не должен затирать ДРУГОЙ существующий портал
  const renaming = !!prevSlug && prevSlug !== schema.slug;
  if (renaming && (await getPortal(schema.slug))) {
    return fail("slug_taken", `Адрес «${schema.slug}» уже занят другим порталом — выберите другой.`, 409);
  }

  await savePortal(schema);
  if (renaming) await deletePortal(prevSlug); // переименование: убираем старый файл

  return NextResponse.json({ ok: true, slug: schema.slug, schema });
}
