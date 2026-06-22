import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/portal/ai-errors";

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
    return fail("bad_request", "Не удалось прочитать заявку. Обновите страницу и попробуйте снова.", 400);
  }
  const phone = (data.phone ?? "").replace(/[^\d+]/g, "");
  if (phone.length < 10) {
    return fail("bad_phone", "Похоже, номер телефона указан не полностью. Проверьте и попробуйте снова.", 422);
  }
  console.log("[lead]", JSON.stringify({ ...data, phone, ts: Date.now() }));
  return NextResponse.json({ ok: true });
}
