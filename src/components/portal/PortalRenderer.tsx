/**
 * PortalRenderer (KRE-120/121/122) — превращает схему портала в страницу.
 *
 *  1. фетчит данные по scope портала (лоты + комплексы whitewill);
 *  2. накладывает тему как CSS-переменные на обёртку (KRE-122);
 *  3. рендерит блоки в порядке схемы через реестр (KRE-120).
 *
 * Весь код универсален: любой портал из store рисуется этим компонентом.
 */

import type { PortalSchema } from "@/lib/portal/schema";
import { BLOCKS } from "@/lib/portal/registry";
import { fetchComplexes, fetchLots } from "@/lib/whitewill/client";
import type { PortalData } from "@/components/portal/blocks";
import { PortalChrome } from "@/components/portal/PortalChrome";
import { fetchTowerStats } from "@/lib/portal/tower-stats";

async function loadData(schema: PortalSchema): Promise<PortalData> {
  const scopeTowers = schema.scope.towers ?? [];
  const [lotsRes, complexesAll, towerStats] = await Promise.all([
    fetchLots({ deal: schema.scope.deal, towers: scopeTowers, page: 1 }, 600).catch(() => null),
    fetchComplexes().catch(() => [] as Awaited<ReturnType<typeof fetchComplexes>>),
    fetchTowerStats(schema.scope.deal, scopeTowers).catch(() => ({})),
  ]);
  const complexes = scopeTowers.length
    ? complexesAll.filter((c) => scopeTowers.includes(c.id))
    : complexesAll;
  const empty = {
    currentPage: 1,
    lastPage: 1,
    perPage: 0,
    total: 0,
    hasMorePages: false,
    isResultEmpty: true,
    moscowLotCardDTOs: [],
  };
  const lots = lotsRes?.moscowLotCardDTOs ?? [];
  return {
    lots,
    complexes,
    lotsResult: lotsRes ?? empty,
    towerStats,
  };
}

export async function PortalRenderer({ schema }: { schema: PortalSchema }) {
  const data = await loadData(schema);

  return (
    <PortalChrome schema={schema}>
      {schema.blocks
        .filter((b) => b.enabled !== false && b.type in BLOCKS)
        .map((block) => {
          const Spec = BLOCKS[block.type];
          const Component = Spec.component;
          // аварийный CSS секции: оборачиваем в #b-<id> через CSS-вложенность —
          // так стили ограничены этой секцией и не текут на весь портал
          const css = typeof block.css === "string" ? block.css.replace(/<\/style/gi, "") : "";
          return (
            <div key={block.id} id={`b-${block.id}`}>
              {css && (
                <style dangerouslySetInnerHTML={{ __html: `#b-${block.id}{${css}}` }} />
              )}
              <Component props={block.props} schema={schema} data={data} />
            </div>
          );
        })}
    </PortalChrome>
  );
}
