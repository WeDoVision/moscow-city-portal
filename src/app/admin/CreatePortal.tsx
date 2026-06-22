"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Форма создания портала по AI-брифу (KRE-123/124).
 * Дёргает /api/generate-portal → получает slug → ведёт в редактор.
 */
export function CreatePortal() {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.message === "string" && data.message
            ? data.message
            : "Не удалось сгенерировать портал. Попробуйте ещё раз.",
        );
        return;
      }
      router.push(`/admin/${data.slug}`);
    } catch {
      setError("Сеть недоступна. Проверьте соединение и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        rows={3}
        placeholder="Напр.: минималистичный портал аренды в ОКО и Федерации, светлая тема, только карточки объектов и форма заявки"
        className="w-full rounded-md border border-ink-line/50 bg-ink p-3 text-paper placeholder:text-muted/60 focus:border-gold focus:outline-none"
      />
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={generate}
          disabled={loading || !brief.trim()}
          className="rounded-md bg-gold px-5 py-2 font-medium text-ink transition hover:bg-gold-deep disabled:opacity-40"
        >
          {loading ? "Генерирую…" : "Сгенерировать портал"}
        </button>
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
