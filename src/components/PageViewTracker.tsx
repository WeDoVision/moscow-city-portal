"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Шлёт portal_view на каждый переход — основа воронки */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track("portal_view", { page: pathname });
  }, [pathname]);
  return null;
}
