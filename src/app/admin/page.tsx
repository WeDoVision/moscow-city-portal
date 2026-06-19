/**
 * Админка Whitewill (KRE-124) — список порталов + создание через AI-бриф.
 * Сюда заходят менеджеры whitewill: создают порталы, правят UI/UX, смотрят
 * превью. Логика (данные, 3D, интеграции) остаётся в коде — её тут не редактируют.
 */

import Link from "next/link";
import { listPortals } from "@/lib/portal/store";
import { CreatePortal } from "./CreatePortal";
import { DeletePortalButton } from "./DeletePortalButton";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const portals = await listPortals();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 font-sans text-paper">
      <h1 className="text-3xl font-semibold tracking-tight">Порталы Whitewill</h1>
      <p className="mt-2 text-sm text-paper/60">
        Генератор и управление порталами. Создайте новый по описанию или отредактируйте существующий.
      </p>

      <div className="mt-10 rounded-xl border border-ink-line/40 bg-ink-soft p-6">
        <h2 className="text-base font-semibold">Новый портал по описанию</h2>
        <CreatePortal />
      </div>

      <Link
        href="/admin/home"
        className="mt-4 flex items-center justify-between rounded-xl border border-gold/30 bg-ink-soft px-6 py-4 transition hover:border-gold"
      >
        <div>
          <div className="font-medium">Главная страница</div>
          <div className="mt-0.5 text-sm text-paper/50">
            Менять клон whitewill.ru через ИИ: тексты, цвета, секции, блоки
          </div>
        </div>
        <span className="text-gold">→</span>
      </Link>

      <h2 className="mt-12 text-base font-semibold">Существующие порталы</h2>
      <div className="mt-4 space-y-3">
        {portals.length === 0 && <p className="text-sm text-paper/50">Пока нет порталов.</p>}
        {portals.map((p) => (
          <div
            key={p.slug}
            className="flex items-center justify-between rounded-xl border border-ink-line/40 bg-ink-soft px-5 py-4"
          >
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="mt-0.5 text-sm text-paper/50">
                /{p.slug} · {p.blocks.length} блоков · {p.scope.deal}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link className="font-medium text-gold hover:underline" href={`/admin/${p.slug}`}>
                Редактор
              </Link>
              <Link className="text-paper/60 hover:text-paper" href={`/p/${p.slug}`} target="_blank">
                Превью ↗
              </Link>
              <DeletePortalButton slug={p.slug} name={p.name} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
