/**
 * Реестр блоков (KRE-120) — связывает тип блока с React-компонентом.
 *
 * Метаданные (label, поля для админки) лежат в client-safe `blocks-meta.ts`;
 * здесь добавляется только серверный/клиентский компонент. Серверный код
 * (рендерер, генератор) импортирует отсюда; client-админка — из blocks-meta.
 *
 * Добавить новый блок = компонент в blocks.tsx + запись в blocks-meta + сюда.
 */

import type { ComponentType } from "react";
import type { BlockType } from "./schema";
import { BLOCK_META, type BlockMeta } from "./blocks-meta";
import {
  AboutBlock,
  City3DBlock,
  CtaBlock,
  CustomBlock,
  FaqBlock,
  HeroBlock,
  LotsGridBlock,
  TowersBlock,
  type BlockProps,
} from "@/components/portal/blocks";

export { BLOCK_TYPES, isBlockType } from "./blocks-meta";

const COMPONENTS: Record<BlockType, ComponentType<BlockProps>> = {
  hero: HeroBlock,
  city3d: City3DBlock,
  towers: TowersBlock,
  lotsGrid: LotsGridBlock,
  about: AboutBlock,
  faq: FaqBlock,
  cta: CtaBlock,
  custom: CustomBlock,
};

export type BlockSpec = BlockMeta & { component: ComponentType<BlockProps> };

export const BLOCKS = Object.fromEntries(
  (Object.keys(BLOCK_META) as BlockType[]).map((type) => [
    type,
    { ...BLOCK_META[type], component: COMPONENTS[type] },
  ]),
) as Record<BlockType, BlockSpec>;
