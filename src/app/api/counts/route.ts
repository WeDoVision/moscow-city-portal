import { NextRequest, NextResponse } from "next/server";
import { fetchCounts } from "@/lib/whitewill/client";
import { categoryByValue, type Category } from "@/lib/whitewill/types";
import { fail } from "@/lib/portal/ai-errors";

/** Счётчики категорий и башен для панели фильтров */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const deal = sp.get("deal") === "rent" ? "rent" : "sale";
    const cat = sp.get("category") ?? undefined;
    const category =
      cat && categoryByValue.has(cat as Category) ? (cat as Category) : undefined;
    const counts = await fetchCounts(deal, category);
    return NextResponse.json(counts, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (e) {
    console.error("[api/counts]", e);
    return fail(
      "upstream_error",
      "Не удалось загрузить счётчики из API Whitewill. Попробуйте обновить позже.",
      502,
      e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    );
  }
}
