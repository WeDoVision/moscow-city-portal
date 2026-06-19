"use client";

import Link from "next/link";
import { useState } from "react";
import type { HomeOverrides } from "@/lib/portal/home-overrides";

/**
 * ИИ-редактор главной (зеркала). Бриф → /api/generate-home → оверрайды.
 * Показывает применённые правки и умеет сбрасывать всё.
 */
export function HomeEditor({ initial }: { initial: HomeOverrides }) {
  const [overrides, setOverrides] = useState<HomeOverrides>(initial);
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "generator_not_configured"
            ? "Не задан OPENAI_API_KEY — генерация недоступна."
            : `Ошибка: ${data.error ?? res.status}`,
        );
        return;
      }
      setOverrides(data.overrides as HomeOverrides);
      setBrief("");
    } catch {
      setError("Сеть недоступна.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/generate-home", { method: "DELETE" });
      setOverrides({ edits: [] });
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-ink-line/50 bg-ink p-3 text-paper placeholder:text-paper/30 focus:border-gold focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 font-sans text-paper">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-sm text-paper/60 hover:text-paper">
          ← Все порталы
        </Link>
        <a href="/" target="_blank" className="text-sm text-paper/60 hover:text-paper">
          Открыть главную ↗
        </a>
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Главная страница</h1>
      <p className="mt-2 text-sm text-paper/55">
        Меняйте главную (клон whitewill.ru) текстом: тексты, цвета, скрытие секций, новые блоки.
        Изменения применяются поверх страницы.
      </p>

      <section className="mt-8 rounded-xl border border-gold/30 bg-ink-soft p-5">
        <h2 className="text-base font-semibold">Изменить главную текстом</h2>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={3}
          placeholder='Напр.: «поменяй заголовок на „Элитная недвижимость Москвы“, скрой блок новостей, сделай кнопки тёмно-зелёными и добавь баннер сверху с акцией»'
          className={`mt-3 ${inputCls}`}
        />
        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={apply}
            disabled={busy || !brief.trim()}
            className="rounded-md bg-gold px-5 py-2 font-medium text-ink transition hover:bg-gold-deep disabled:opacity-40"
          >
            {busy ? "Применяю…" : "Применить"}
          </button>
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Применённые правки ({overrides.edits.length})
          </h2>
          {overrides.edits.length > 0 && (
            <button
              onClick={reset}
              disabled={busy}
              className="text-sm text-paper/60 hover:text-red-400 disabled:opacity-40"
            >
              Сбросить всё
            </button>
          )}
        </div>
        <div className="mt-4 space-y-2">
          {overrides.edits.length === 0 && (
            <p className="text-sm text-paper/50">Пока правок нет — главная отдаётся как оригинал.</p>
          )}
          {overrides.edits.map((e, i) => (
            <div
              key={i}
              className="rounded-lg border border-ink-line/40 bg-ink-soft px-4 py-2.5 text-sm"
            >
              <span className="mr-2 rounded bg-ink px-2 py-0.5 text-[11px] uppercase tracking-wide text-gold">
                {e.op}
              </span>
              {e.op === "text" && (
                <span className="text-paper/70">
                  «{e.from}» → «{e.to}»
                </span>
              )}
              {e.op === "hide" && <span className="text-paper/70">секция: {e.section}</span>}
              {e.op === "css" && (
                <span className="font-mono text-xs text-paper/60">{e.css.slice(0, 80)}</span>
              )}
              {e.op === "inject" && (
                <span className="text-paper/70">
                  {e.position} {e.section}: {e.html.slice(0, 60)}…
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
