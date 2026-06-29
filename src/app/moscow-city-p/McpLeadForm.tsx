"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

type Status = "idle" | "sending" | "ok" | "error";

/**
 * Форма заявки в mcp-теме (тёмная панель, синий акцент, прямоугольная
 * геометрия). Логика идентична общей LeadForm — отдельный компонент, чтобы
 * не тащить золотую тему эталона в портал /moscow-city-p.
 */
export function McpLeadForm({ lotId, source }: { lotId?: number; source: string }) {
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
      <div className="border border-[#1aa3ff]/40 bg-[#1aa3ff]/10 p-6 text-center">
        <p className="text-xl font-semibold text-[#4da2ff]">Заявка отправлена</p>
        <p className="mt-2 text-sm text-[var(--on-dark-mut)]">
          Эксперт портала перезвонит в течение 7 минут в рабочее время.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full border border-[var(--line-dark)] bg-[#111214] px-4 py-3 text-sm text-white placeholder:text-[#5a626c] focus:border-[#1aa3ff] focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ваше имя"
        autoComplete="name"
        className={inputCls}
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+7 (___) ___-__-__"
        type="tel"
        required
        autoComplete="tel"
        className={inputCls}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="mcp-btn-blue w-full py-3.5 text-sm tracking-wide disabled:opacity-60"
      >
        {status === "sending" ? "Отправляем…" : "Получить консультацию"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-400">Не получилось отправить — проверьте номер телефона.</p>
      )}
      <p className="mcp-mono text-[11px] leading-relaxed text-[#6b727b]">
        Нажимая кнопку, вы соглашаетесь с обработкой персональных данных. Обычно перезваниваем в
        течение 7 минут.
      </p>
    </form>
  );
}
