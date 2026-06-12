import { NextRequest, NextResponse } from "next/server";

/**
 * Сборщик событий воронки.
 * Сейчас пишет структурированный лог (виден в Vercel runtime logs и
 * выгружается через Log Drains в любое хранилище). Слой подключаемый:
 * сюда же можно добавить запись в ClickHouse/BigQuery/Amplitude.
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    console.log("[funnel]", JSON.stringify(event));
  } catch {
    // битый payload игнорируем
  }
  return new NextResponse(null, { status: 204 });
}
