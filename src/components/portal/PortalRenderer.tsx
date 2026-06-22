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

async function loadData(schema: PortalSchema): Promise<PortalData> {
  const scopeTowers = schema.scope.towers ?? [];
  const [lotsRes, complexesAll] = await Promise.all([
    fetchLots({ deal: schema.scope.deal, towers: scopeTowers, page: 1 }, 600).catch(() => null),
    fetchComplexes().catch(() => [] as Awaited<ReturnType<typeof fetchComplexes>>),
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
  return { lots: lotsRes?.moscowLotCardDTOs ?? [], complexes, lotsResult: lotsRes ?? empty };
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
          return <Component key={block.id} props={block.props} schema={schema} data={data} />;
        })}
    </PortalChrome>
  );
}
