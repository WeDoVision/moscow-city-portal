# Moscow City Portal

Редизайн портала недвижимости Москва-Сити (moscowcitysale.ru) и одновременно —
**темплейт** для всей линейки порталов Whitewill: один кодовый шаблон, разные
конфиги. Данные тянутся с того же API, что использует whitewill.ru.

## Архитектура

```
src/
  portal.config.ts       ← сердце темплейта: бренд, тема, башни (скоуп), SEO, FAQ
  lib/whitewill/         ← клиент API whitewill.ru (реверс: docs/API.md)
    client.ts            ← fetchLots / fetchComplexes / fetchLotDetails (+скрейп галереи)
    query.ts             ← чистые URL-параметры портала ↔ filters API
    types.ts             ← DTO
  lib/analytics.ts       ← событийная воронка (sid + UTM входа)
  app/
    page.tsx             ← лендинг: hero, динамические фильтры, каталог, башни, FAQ
    lots/[id]/           ← страница лота (SSG+ISR): галерея по категориям, цены ₽/$/€
    towers/[slug]/       ← страницы башен (SSG)
    api/lots             ← прокси каталога (CORS + кеш)
    api/track            ← сборщик событий воронки
    api/lead             ← приём заявок
    sitemap.ts, robots.ts, llms.txt/
```

### Новый портал из темплейта

Меняется только `src/portal.config.ts` (бренд, палитра в `globals.css`, скоуп
`towers` → любые `complex_id` из API, копирайт, FAQ) — остальной код общий.
Этот конфиг — целевой формат для будущего AI-генератора порталов.

### SEO

- Статическая генерация: главная и башни — SSG с ревалидацией, лоты — SSG
  топа выдачи + ISR остальных (`revalidate`, `generateStaticParams`).
- `sitemap.xml` со всеми лотами (sale+rent), `robots.txt`, canonical,
  OpenGraph, breadcrumbs.
- JSON-LD: Organization, WebSite, FAQPage, ItemList, Apartment+Offer на лотах,
  ApartmentComplex на башнях.

### AEO (Answer Engine Optimization)

- `llms.txt` — машиночитаемая выжимка для LLM-краулеров (llmstxt.org);
- FAQ-блок с прямыми ответами + FAQPage schema;
- «ключевые факты» лота семантическим `<dl>` — удобно цитировать движкам ответов.

### Аналитика воронки

`portal_view → filter_change → lot_card_click → lot_view → gallery_interaction
→ cta_click → lead_submit`, у каждого события session id, UTM и реферер входа.
Уходит в `/api/track` (Vercel logs / Log Drains), `window.dataLayer` (GTM-ready)
и GA4 при заданном `NEXT_PUBLIC_GA_ID`.

### Расширение (заложено)

- 3D: hero и страницы башен — серверные компоненты со слотами, canvas-слой
  добавляется без перестройки;
- AI-генератор порталов: эмитит `portal.config.ts` + токены `globals.css`;
- другие регионы Whitewill (СПб, Дубай, Лондон) — тот же API-движок.

## Запуск

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # прод-сборка со статической генерацией
```

Переменные окружения (опционально): `NEXT_PUBLIC_GA_ID` — GA4.
