import { NextRequest, NextResponse } from "next/server";
import { fetchLots } from "@/lib/whitewill/client";
import { parseCatalogQuery } from "@/lib/whitewill/query";

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
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
