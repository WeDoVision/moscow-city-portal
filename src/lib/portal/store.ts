/**
 * Хранилище порталов (KRE-121).
 *
 * Сейчас — JSON-файлы в `data/portals/*.json`, спрятанные за этим интерфейсом.
 * Когда порталов станет много и появится прод-админка — меняем только тело
 * этих функций на БД, вызовы (рендерер, админка, генератор) не трогаем.
 *
 * server-only: использует node:fs. Импортировать только в серверном коде
 * (рендерер, route handlers, серверные страницы) — не в client-компонентах.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { PortalSchema } from "./schema";

const DIR = path.join(process.cwd(), "data", "portals");

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

function fileFor(slug: string) {
  // slug приходит из роута/админки — нормализуем, чтобы не вылезти из папки
  const safe = slug.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  return path.join(DIR, `${safe}.json`);
}

export async function listPortals(): Promise<PortalSchema[]> {
  await ensureDir();
  const files = await fs.readdir(DIR);
  const portals = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) => {
        try {
          return JSON.parse(await fs.readFile(path.join(DIR, f), "utf8")) as PortalSchema;
        } catch {
          return null;
        }
      }),
  );
  return portals.filter((p): p is PortalSchema => p !== null);
}

export async function getPortal(slug: string): Promise<PortalSchema | null> {
  try {
    return JSON.parse(await fs.readFile(fileFor(slug), "utf8")) as PortalSchema;
  } catch {
    return null;
  }
}

export async function savePortal(schema: PortalSchema): Promise<void> {
  await ensureDir();
  await fs.writeFile(fileFor(schema.slug), JSON.stringify(schema, null, 2), "utf8");
}

export async function deletePortal(slug: string): Promise<void> {
  try {
    await fs.unlink(fileFor(slug));
  } catch {
    /* уже нет — ок */
  }
}
