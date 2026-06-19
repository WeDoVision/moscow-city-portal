/**
 * PortalRenderer (KRE-120/121/122) — превращает схему портала в страницу.
 *
 *  1. фетчит данные по scope портала (лоты + комплексы whitewill);
 *  2. накладывает тему как CSS-переменные на обёртку (KRE-122);
 *  3. рендерит блоки в порядке схемы через реестр (KRE-120).
 *
 * Весь код универсален: любой портал из store рисуется этим компонентом.
 */

import type { CSSProperties } from "react";
import type { PortalSchema } from "@/lib/portal/schema";
import { themeToCssVars } from "@/lib/portal/schema";
import { BLOCKS } from "@/lib/portal/registry";
import { fetchComplexes, fetchLots } from "@/lib/whitewill/client";
import type { PortalData } from "@/components/portal/blocks";

async function loadData(schema: PortalSchema): Promise<PortalData> {
  const scopeTowers = schema.scope.towers ?? [];
  const [lotsRes, complexesAll] = await Promise.all([
    fetchLots({ deal: schema.scope.deal, towers: scopeTowers, page: 1 }, 600).catch(() => null),
    fetchComplexes().catch(() => [] as Awaited<ReturnType<typeof fetchComplexes>>),
  ]);
  const complexes = scopeTowers.length
    ? complexesAll.filter((c) => scopeTowers.includes(c.id))
    : complexesAll;
  return { lots: lotsRes?.moscowLotCardDTOs ?? [], complexes };
}

export async function PortalRenderer({ schema }: { schema: PortalSchema }) {
  const data = await loadData(schema);
  const style = themeToCssVars(schema.theme) as CSSProperties;

  return (
    <div style={style} className="min-h-screen bg-ink text-paper">
      {/* Хедер портала */}
      <header className="sticky top-0 z-40 border-b border-ink-line/40 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href={`/p/${schema.slug}`} className="font-display text-lg tracking-wide text-paper">
            <span className="text-gold">{schema.brand.logo[0]}</span> {schema.brand.logo[1]}
          </a>
          <a href={schema.brand.phoneHref} className="text-sm text-muted hover:text-paper">
            {schema.brand.phone}
          </a>
        </div>
      </header>

      <main>
        {schema.blocks
          .filter((b) => b.enabled !== false && b.type in BLOCKS)
          .map((block) => {
            const Spec = BLOCKS[block.type];
            const Component = Spec.component;
            return <Component key={block.id} props={block.props} schema={schema} data={data} />;
          })}
      </main>

      <footer className="border-t border-ink-line/40 py-10">
        <div className="mx-auto max-w-6xl px-6 text-sm text-muted">
          © {new Date().getFullYear()} {schema.brand.name} · Whitewill
        </div>
      </footer>
    </div>
  );
}
