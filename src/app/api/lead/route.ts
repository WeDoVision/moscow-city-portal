import { NextRequest, NextResponse } from "next/server";

/**
 * Приём заявок (обратный звонок / консультация по лоту).
 * Демо-режим: структурированный лог в Vercel runtime logs.
 * Продовая интеграция — POST в CRM/whitewill api/v1/send-callback
 * (требует recaptcha-токен) — подключается здесь же.
 */
export async function POST(req: NextRequest) {
  let data: { name?: string; phone?: string; lotId?: number; source?: string };
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const phone = (data.phone ?? "").replace(/[^\d+]/g, "");
  if (phone.length < 10) {
    return NextResponse.json({ error: "bad_phone" }, { status: 422 });
  }
  console.log("[lead]", JSON.stringify({ ...data, phone, ts: Date.now() }));
  return NextResponse.json({ ok: true });
}
