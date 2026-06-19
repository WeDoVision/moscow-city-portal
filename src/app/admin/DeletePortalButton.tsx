"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Кнопка удаления портала — дёргает DELETE /api/admin/portals/[slug]
 * с подтверждением и обновляет список.
 */
export function DeletePortalButton({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Удалить портал «${name}» (/${slug})? Действие необратимо.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/portals/${slug}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Не удалось удалить портал.");
    } catch {
      alert("Сеть недоступна.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={busy}
      className="text-paper/40 transition hover:text-red-400 disabled:opacity-40"
      title="Удалить портал"
    >
      {busy ? "Удаляю…" : "Удалить"}
    </button>
  );
}
