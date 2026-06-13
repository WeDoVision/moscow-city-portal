"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { CatalogQuery } from "@/lib/whitewill/types";
import { track } from "@/lib/analytics";

type CompactLot = {
  id: number;
  headline: string;
  title: string;
  price: string;
  pricePerArea: string;
  badge: string;
  image: string | null;
};

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  lots?: CompactLot[];
  total?: number;
  appliedFilters?: Partial<CatalogQuery> | null;
};

const SUGGESTIONS = [
  "Однушка до 60 млн",
  "Апартаменты с 2 спальнями в ОКО",
  "Пентхаус повыше, бюджет до 500 млн",
  "Офис в аренду до 200 м²",
];

const GREETING: ChatMsg = {
  role: "assistant",
  content:
    "Здравствуйте! Я Алиса, AI-консультант по Москва-Сити. Опишите, что ищете — башню, бюджет, количество спален — и я подберу варианты из живой базы. Например: «двушка с видом до 150 млн».",
};

/**
 * AI-агент подбора: альтернатива ручным фильтрам.
 * Модель сама применяет фильтры каталога (tool calling) и возвращает
 * карточки реальных лотов прямо в чат.
 */
export function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    setBusy(true);
    track("ai_chat_message", { length: clean.length });
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next
            .filter((m) => m !== GREETING)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setMessages((cur) => [
        ...cur,
        {
          role: "assistant",
          content: data.message || "Готово!",
          lots: data.lots ?? [],
          total: data.total ?? 0,
          appliedFilters: data.appliedFilters,
        },
      ]);
    } catch {
      setMessages((cur) => [
        ...cur,
        {
          role: "assistant",
          content:
            "Что-то пошло не так — попробуйте ещё раз или воспользуйтесь фильтрами каталога.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const applyInCatalog = (filters: Partial<CatalogQuery>) => {
    track("cta_click", { cta: "ai_apply_filters" });
    const patch = { ...filters };
    delete (patch as Record<string, unknown>).page;
    if (pathname !== "/") {
      const params = new URLSearchParams();
      if (patch.deal === "rent") params.set("deal", "rent");
      if (patch.category) params.set("category", String(patch.category));
      if (patch.towers?.length) params.set("towers", patch.towers.join(","));
      if (patch.rooms?.length) params.set("rooms", patch.rooms.join(","));
      if (patch.priceMin != null) params.set("priceMin", String(patch.priceMin));
      if (patch.priceMax != null) params.set("priceMax", String(patch.priceMax));
      if (patch.areaMin != null) params.set("areaMin", String(patch.areaMin));
      if (patch.areaMax != null) params.set("areaMax", String(patch.areaMax));
      window.location.href = `/?${params}#catalog`;
      return;
    }
    window.dispatchEvent(new CustomEvent("portal:applyFilters", { detail: patch }));
    setOpen(false);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* плавающая кнопка */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) track("ai_chat_open", {});
        }}
        aria-label={open ? "Закрыть AI-подбор" : "Открыть AI-подбор"}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gold px-5 py-3.5 text-sm font-semibold text-ink shadow-lg shadow-black/50 transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
          <path d="M12 2l1.9 5.7L19.6 9l-5.7 1.9L12 16.6l-1.9-5.7L4.4 9l5.7-1.3L12 2zm7 12l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
        </svg>
        {open ? "Закрыть" : "AI-подбор"}
      </button>

      {/* панель чата */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[min(640px,calc(100svh-7rem))] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-md border border-ink-line/60 bg-ink shadow-2xl shadow-black/60">
          <header className="flex items-center gap-3 border-b border-ink-line/50 bg-ink-soft px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 font-display text-gold">
              А
            </span>
            <div>
              <p className="text-sm font-semibold text-paper">Алиса · AI-подбор</p>
              <p className="text-xs text-muted">подключена к живой базе лотов</p>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-md px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "ml-auto bg-gold text-ink"
                      : "bg-ink-soft text-paper/90"
                  }`}
                >
                  {m.content}
                </div>

                {/* карточки лотов в ответе агента */}
                {m.lots && m.lots.length > 0 && (
                  <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
                    {m.lots.map((l) => (
                      <Link
                        key={l.id}
                        href={`/lots/${l.id}`}
                        onClick={() => track("lot_card_click", { lotId: l.id, source: "ai_chat" })}
                        className="w-44 shrink-0 overflow-hidden rounded-sm border border-ink-line/50 bg-ink-soft transition-colors hover:border-gold/60"
                      >
                        {l.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={l.image} alt={l.headline} className="h-24 w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-24 w-full bg-ink" />
                        )}
                        <div className="p-3">
                          <p className="font-display text-sm text-gold">{l.price}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-snug text-paper/85">{l.headline}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">{l.badge}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {m.appliedFilters && (m.total ?? 0) > 0 && (
                  <button
                    onClick={() => applyInCatalog(m.appliedFilters!)}
                    className="mt-2 text-xs text-gold underline-offset-4 hover:underline"
                  >
                    Показать все {m.total} в каталоге →
                  </button>
                )}
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 px-2 text-xs text-muted">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:300ms]" />
                </span>
                подбираю варианты…
              </div>
            )}
          </div>

          {/* подсказки до первого запроса */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-ink-line/60 px-3 py-1.5 text-xs text-paper/75 transition-colors hover:border-gold hover:text-gold"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-ink-line/50 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Опишите, что ищете…"
              className="flex-1 rounded-full border border-ink-line/60 bg-ink-soft px-4 py-2.5 text-sm text-paper placeholder:text-muted/70 focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Отправить"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-ink transition-colors hover:bg-gold-deep disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M3 11.5 21 3l-8.5 18-2.3-7.2L3 11.5z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
