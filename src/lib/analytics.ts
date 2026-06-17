"use client";

/**
 * Событийная аналитика воронки портала.
 *
 * Воронка: portal_view → filter_change → lot_card_click → lot_view →
 *          gallery_interaction → cta_click → lead_submit
 *
 * Каждое событие уходит:
 *  1. в наш /api/track (видно в Vercel runtime logs, далее — пишется в любое
 *     хранилище: ClickHouse/BigQuery/Amplitude — слой подключаемый);
 *  2. в window.dataLayer (готово для GTM/GA4 — достаточно подключить контейнер);
 *  3. в GA4 напрямую, если задан NEXT_PUBLIC_GA_ID.
 *
 * У каждого визита есть session id + UTM-метки входа, так что воронку можно
 * восстановить по сессии от первого захода до заявки.
 */

export type FunnelEvent =
  | "portal_view"
  | "filter_change"
  | "lot_card_click"
  | "lot_view"
  | "gallery_interaction"
  | "tower_view"
  | "cta_click"
  | "ai_chat_open"
  | "ai_chat_message"
  | "ai_search"
  | "lead_submit";

type EventProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

const SID_KEY = "mcp_sid";
const UTM_KEY = "mcp_utm";

function sessionId(): string {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return "no-storage";
  }
}

/** UTM и реферер первого захода — сохраняем на всю сессию */
function entryContext(): Record<string, string> {
  try {
    const cached = sessionStorage.getItem(UTM_KEY);
    if (cached) return JSON.parse(cached);
    const sp = new URLSearchParams(location.search);
    const ctx: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const v = sp.get(k);
      if (v) ctx[k] = v;
    }
    ctx.referrer = document.referrer || "direct";
    ctx.landing = location.pathname;
    sessionStorage.setItem(UTM_KEY, JSON.stringify(ctx));
    return ctx;
  } catch {
    return {};
  }
}

export function track(event: FunnelEvent, props: EventProps = {}): void {
  if (typeof window === "undefined") return;
  const payload = {
    event,
    ts: Date.now(),
    sid: sessionId(),
    path: location.pathname + location.search,
    ...entryContext(),
    ...props,
  };

  // 1. наш бекенд-сборщик
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", { method: "POST", body, keepalive: true });
    }
  } catch {
    /* не роняем UI из-за аналитики */
  }

  // 2. dataLayer для GTM
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  // 3. GA4 напрямую
  if (window.gtag) window.gtag("event", event, payload);
}
