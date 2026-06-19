/**
 * Валидация/санитайз схемы портала (KRE-123/124).
 *
 * Любой внешний ввод (ответ AI, форма админки) проходит через `sanitizeSchema`:
 * неизвестные типы блоков выкидываются, тема добивается дефолтами, scope
 * приводится к числам. Так наверх (AI/админ) отдаётся только UI/UX, а попытка
 * протащить произвольную «логику» просто отсекается.
 */

import {
  DEFAULT_THEME,
  type Block,
  type Card,
  type PortalSchema,
  type Theme,
} from "./schema";
import { isBlockType } from "./blocks-meta";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "portal-" + Math.random().toString(36).slice(2, 7)
  );
}

const asString = (v: unknown, fb = ""): string => (typeof v === "string" ? v : fb);

function sanitizeTheme(input: unknown): Theme {
  const t = (input ?? {}) as Partial<Theme>;
  return {
    ink: asString(t.ink, DEFAULT_THEME.ink),
    inkSoft: asString(t.inkSoft, DEFAULT_THEME.inkSoft),
    inkLine: asString(t.inkLine, DEFAULT_THEME.inkLine),
    paper: asString(t.paper, DEFAULT_THEME.paper),
    paperSoft: asString(t.paperSoft, DEFAULT_THEME.paperSoft),
    gold: asString(t.gold, DEFAULT_THEME.gold),
    goldDeep: asString(t.goldDeep, DEFAULT_THEME.goldDeep),
    muted: asString(t.muted, DEFAULT_THEME.muted),
    radius: asString(t.radius, DEFAULT_THEME.radius),
  };
}

/** Карточка на главной: только непустые поля; иначе undefined (берётся тема). */
function sanitizeCard(input: unknown): Card | undefined {
  if (!input || typeof input !== "object") return undefined;
  const c = input as Partial<Card>;
  const card: Card = {};
  if (asString(c.image).trim()) card.image = asString(c.image).trim();
  if (asString(c.logo).trim()) card.logo = asString(c.logo).trim();
  if (c.logoSize === "s" || c.logoSize === "m" || c.logoSize === "l") card.logoSize = c.logoSize;
  if (asString(c.subtitle).trim()) card.subtitle = asString(c.subtitle).trim();
  return Object.keys(card).length ? card : undefined;
}

function sanitizeBlocks(input: unknown): Block[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((b) => b && typeof b === "object" && isBlockType((b as Block).type))
    .map((b, i) => {
      const block = b as Block;
      return {
        id: asString(block.id, `${block.type}-${i}`),
        type: block.type,
        enabled: block.enabled !== false,
        // пропсы оставляем как есть — блок сам берёт только знакомые поля
        props: (block.props && typeof block.props === "object" ? block.props : {}) as Record<
          string,
          unknown
        >,
      };
    });
}

export function sanitizeSchema(input: unknown, fallbackSlug?: string): PortalSchema {
  const o = (input ?? {}) as Partial<PortalSchema>;
  const name = asString(o.name, "Новый портал");
  const brand = (o.brand ?? {}) as Partial<PortalSchema["brand"]>;
  const scope = (o.scope ?? {}) as Partial<PortalSchema["scope"]>;
  const logo = Array.isArray(brand.logo) ? brand.logo : [];

  return {
    slug: slugify(asString(o.slug, fallbackSlug || name)),
    name,
    brand: {
      name: asString(brand.name, name),
      logo: [asString(logo[0], name), asString(logo[1], "")] as [string, string],
      phone: asString(brand.phone, "+7 (495) 255-01-61"),
      phoneHref: asString(brand.phoneHref, "tel:+74952550161"),
      email: asString(brand.email, "info@whitewill.ru"),
      whatsapp: asString(brand.whatsapp, "https://wa.me/74952550161"),
      telegram: asString(brand.telegram, "https://t.me/whitewill_moscow"),
    },
    theme: sanitizeTheme(o.theme),
    scope: {
      deal: scope.deal === "rent" ? "rent" : "sale",
      towers: Array.isArray(scope.towers)
        ? scope.towers.map(Number).filter((n) => Number.isFinite(n))
        : [],
    },
    blocks: sanitizeBlocks(o.blocks),
    card: sanitizeCard(o.card),
  };
}
