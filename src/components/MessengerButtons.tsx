"use client";

import { portal } from "@/portal.config";
import { track } from "@/lib/analytics";

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.4-3c-.3-.4 0-.5.1-.7l.5-.6c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.2 2.1-.5 3.6a12 12 0 0 0 4.6 4.7c1.8 1 2.6 1 3.5.9.6-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.2-.2-.2-.4-.4Z" />
    </svg>
  );
}

export function TelegramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.9 4.4 18.9 19c-.2 1-.8 1.2-1.6.8l-4.6-3.4-2.2 2.1c-.2.3-.5.5-.9.5l.3-4.7L18.4 6.6c.4-.3-.1-.5-.6-.2l-10.5 6.6-4.5-1.4c-1-.3-1-.9.2-1.4L20.6 3c.8-.3 1.5.2 1.3 1.4Z" />
    </svg>
  );
}

/**
 * Плавающие продажные кнопки: WhatsApp, Telegram, телефон.
 * Видны всегда — главный канал конверсии порталов недвижимости.
 */
export function FloatingMessengers() {
  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col gap-2.5">
      <a
        href={portal.brand.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Написать в WhatsApp"
        onClick={() => track("cta_click", { cta: "floating_whatsapp" })}
        className="group flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition-transform hover:scale-110"
      >
        <WhatsAppIcon className="h-6 w-6" />
      </a>
      <a
        href={portal.brand.telegram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Написать в Telegram"
        onClick={() => track("cta_click", { cta: "floating_telegram" })}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#229ED9] text-white shadow-lg shadow-black/40 transition-transform hover:scale-110"
      >
        <TelegramIcon className="h-6 w-6" />
      </a>
      <a
        href={portal.brand.phoneHref}
        aria-label="Позвонить"
        onClick={() => track("cta_click", { cta: "floating_phone" })}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-ink shadow-lg shadow-black/40 transition-transform hover:scale-110"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
          <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.7.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2Z" />
        </svg>
      </a>
    </div>
  );
}

/** Кнопки «спросить про лот» для страницы лота */
export function LotMessengerButtons({ lotId, title }: { lotId: number; title: string }) {
  const text = encodeURIComponent(
    `Здравствуйте! Интересует лот №${lotId} (${title}) на ${portal.brand.name}.`,
  );
  const wa = portal.brand.whatsapp.split("?")[0] + `?text=${text}`;
  return (
    <div className="flex gap-3">
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("cta_click", { cta: "lot_whatsapp", lotId })}
        className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-[#25D366]/50 py-2.5 text-sm text-[#4ce081] transition-colors hover:bg-[#25D366]/15"
      >
        <WhatsAppIcon className="h-4 w-4" /> WhatsApp
      </a>
      <a
        href={portal.brand.telegram}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("cta_click", { cta: "lot_telegram", lotId })}
        className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-[#229ED9]/50 py-2.5 text-sm text-[#5bc1ec] transition-colors hover:bg-[#229ED9]/15"
      >
        <TelegramIcon className="h-4 w-4" /> Telegram
      </a>
    </div>
  );
}
