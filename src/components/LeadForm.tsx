"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

type Status = "idle" | "sending" | "ok" | "error";

/** Форма заявки — финальный шаг воронки (lead_submit) */
export function LeadForm({ lotId, source }: { lotId?: number; source: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, lotId, source }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("ok");
      track("lead_submit", { source, lotId });
    } catch {
      setStatus("error");
    }
  };

  if (status === "ok") {
    return (
      <div className="rounded-sm border border-gold/40 bg-gold/10 p-6 text-center">
        <p className="font-display text-xl text-gold">Заявка отправлена</p>
        <p className="mt-2 text-sm text-paper/70">
          Эксперт портала перезвонит в течение 7 минут в рабочее время.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ваше имя"
        autoComplete="name"
        className="w-full rounded-sm border border-ink-line/60 bg-ink px-4 py-3 text-sm text-paper placeholder:text-muted/70 focus:border-gold focus:outline-none"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+7 (___) ___-__-__"
        type="tel"
        required
        autoComplete="tel"
        className="w-full rounded-sm border border-ink-line/60 bg-ink px-4 py-3 text-sm text-paper placeholder:text-muted/70 focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-sm bg-gold py-3.5 text-sm font-semibold tracking-wide text-ink transition-colors hover:bg-gold-deep disabled:opacity-60"
      >
        {status === "sending" ? "Отправляем…" : "Получить консультацию"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-400">Не получилось отправить — проверьте номер телефона.</p>
      )}
      <p className="text-[11px] leading-relaxed text-muted">
        Нажимая кнопку, вы соглашаетесь с обработкой персональных данных. Обычно перезваниваем в
        течение 7 минут.
      </p>
    </form>
  );
}
