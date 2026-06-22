/**
 * Единая обработка ошибок ИИ-генераторов (KRE-123).
 *
 * Все роуты возвращают `{ error, message }`: `error` — машинный код, `message` —
 * человекочитаемый текст на русском для показа в UI. UI печатает `message`,
 * откатываясь на свой fallback только если его нет.
 */

import { NextResponse } from "next/server";

/**
 * Тело ошибки: `error` — машинный код, `message` — что это и что делать (для UI),
 * `detail` — техническая причина для отладки (видна в Network/логах). `detail`
 * добавляется только когда есть что показать.
 */
export function fail(error: string, message: string, status: number, detail?: string) {
  return NextResponse.json(detail ? { error, message, detail } : { error, message }, { status });
}

/** Терпимый парсинг JSON: снимаем ```-ограждение и берём «{ … }», если модель добавила лишнее. */
export function parseJsonLoose(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    /* пробуем вытащить JSON из обёртки */
  }
  let s = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) s = s.slice(first, last + 1);
  return JSON.parse(s); // бросит — поймает вызывающий
}

/** Понятный ответ по HTTP-ошибке OpenAI (401/429/404/5xx/прочее). */
export function openaiHttpError(status: number, errText: string, model: string) {
  let detail = "";
  try {
    detail = JSON.parse(errText)?.error?.message ?? "";
  } catch {
    /* не JSON — оставляем пусто */
  }
  const d = detail || undefined;
  if (status === 401) {
    return fail("llm_auth", "ИИ отклонил ключ OPENAI_API_KEY (недействителен или истёк). Проверьте ключ.", 502, d);
  }
  if (status === 429) {
    return fail("llm_rate_limit", "ИИ перегружен или исчерпан лимит запросов. Подождите немного и повторите.", 503, d);
  }
  if (status === 404 || /model/i.test(detail)) {
    return fail("llm_model", `Модель «${model}» недоступна для этого ключа. Проверьте переменную OPENAI_MODEL.`, 502, d);
  }
  if (status >= 500) {
    return fail("llm_unavailable", "Сервис ИИ временно недоступен. Попробуйте через минуту.", 502, d);
  }
  return fail("llm_error", "ИИ вернул ошибку. Попробуйте переформулировать запрос.", 502, d || `HTTP ${status}`);
}

/** Понятный ответ по исключению (таймаут/сеть). */
export function aiException(e: unknown) {
  if (e instanceof Error && e.name === "AbortError") {
    return fail("timeout", "ИИ не успел ответить за отведённое время. Попробуйте упростить запрос.", 504);
  }
  const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  return fail(
    "generator_error",
    "Не удалось связаться с сервисом ИИ. Проверьте интернет-соединение и попробуйте снова.",
    502,
    detail,
  );
}
