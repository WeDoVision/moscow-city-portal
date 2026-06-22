import { NextRequest, NextResponse } from "next/server";
import { fetchLots } from "@/lib/whitewill/client";
import { parseCatalogQuery } from "@/lib/whitewill/query";
import { fail } from "@/lib/portal/ai-errors";

/** Прокси каталога для клиентской фильтрации (whitewill API не отдаёт CORS) */
export async function GET(req: NextRequest) {
  try {
    const q = parseCatalogQuery(req.nextUrl.searchParams);
    const result = await fetchLots(q, 300);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    console.error("[api/lots]", e);
    return fail(
      "upstream_error",
      "Не удалось загрузить объекты из API Whitewill. Попробуйте обновить позже.",
      502,
      e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    );
  }
}
