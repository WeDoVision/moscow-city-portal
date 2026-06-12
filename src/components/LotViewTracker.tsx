"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Шаг воронки lot_view — просмотр страницы лота */
export function LotViewTracker({ lotId, complex }: { lotId: number; complex: string }) {
  useEffect(() => {
    track("lot_view", { lotId, complex });
  }, [lotId, complex]);
  return null;
}
