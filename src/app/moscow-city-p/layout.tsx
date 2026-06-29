import "./mcp.css";

/**
 * Layout сегмента /moscow-city-p. Подключает scoped-тему .mcp (mcp.css) для
 * лендинга И его подстраниц (/moscow-city-p/lots/[id], /moscow-city-p/towers/[slug]).
 * Chrome (хедер/футер) живёт в самих страницах: лендинг — в SuiClone, детальные
 * страницы — в McpHeader/McpFooter, чтобы не дублировать обвес.
 */
export default function MoscowCityPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
