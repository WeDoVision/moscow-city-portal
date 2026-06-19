/**
 * Хранилище оверрайдов главной (ИИ-правки зеркала). Сейчас — один JSON-файл
 * data/home-overrides.json за этим интерфейсом (как store.ts для порталов).
 * server-only: node:fs — импортировать только в серверном коде.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { EMPTY_OVERRIDES, type HomeOverrides } from "./home-overrides";

const FILE = path.join(process.cwd(), "data", "home-overrides.json");

export async function getHomeOverrides(): Promise<HomeOverrides> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as HomeOverrides;
  } catch {
    return EMPTY_OVERRIDES;
  }
}

export async function saveHomeOverrides(ov: HomeOverrides): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(ov, null, 2), "utf8");
}
