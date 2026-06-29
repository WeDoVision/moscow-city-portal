import { NextResponse } from "next/server";
import { fetchMansions } from "@/lib/osobnyaki/lots";

/**
 * Каталог особняков для клиентской фильтрации и умного поиска.
 * Отдаёт весь нормализованный список + фасеты (whitewill API без CORS,
 * поэтому ходим с сервера). Кешируем на стороне CDN/edge.
 */
export async function GET() {
  try {
    const data = await fetchMansions();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
    });
  } catch (e) {
    console.error("[api/osobnyaki/lots]", e);
    return NextResponse.json(
      { error: "upstream_error", message: "Не удалось загрузить особняки из API." },
      { status: 502 },
    );
  }
}
