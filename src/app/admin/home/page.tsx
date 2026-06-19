/**
 * Админка → ИИ-правка главной страницы (зеркала whitewill.ru).
 */

import { getHomeOverrides } from "@/lib/portal/home-store";
import { HomeEditor } from "./HomeEditor";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const overrides = await getHomeOverrides();
  return <HomeEditor initial={overrides} />;
}
