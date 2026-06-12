# Whitewill API — реверс-инжиниринг

Портал тянет данные с того же API, что и whitewill.ru. Авторизация не требуется,
но нужен браузерный `User-Agent`. Все ответы — JSON.

## Каталог лотов

```
GET https://whitewill.ru/api/v1/filter/{sale|rent}/lots?page=N&filters=<filters>
```

`page` обязателен. Ответ — `{ moscowLotFilterResultDTO }`:

| Поле | Что это |
|---|---|
| `total`, `perPage` (42), `currentPage`, `lastPage`, `hasMorePages` | пагинация |
| `moscowLotCardDTOs[]` | карточки лотов |

Карточка лота (`moscowLotCardDTO`): `id`, `title`, `description` (обрезано),
`area`, `district`, `complexTitle`, `lotLink` (страница лота на whitewill.ru),
`images[]` (пути относительно CDN), `lotCardPriceListDTO` (цены в RUB/USD/EUR,
+ за м²), `lotCardTransitListDTO` (метро с временем и цветом ветки),
`lotCardInfoListDTO` (Площадь / Спальни / Этаж), стикеры.

Другие сегменты: `/api/v1/filter/{commercials|mansions}/{sale|rent}/lots`.

## Формат filters

Правила склеиваются через `;`, значение отделяется `|`:

```
filters=complex_id/int_multiple_filter|1:104;rooms/int_multiple_band_strict_filter|2:2,3:3;sorting/custom|price_rub:asc
```

| Правило | Значения | Пример |
|---|---|---|
| `complex_id/int_multiple_filter` | id через `:` | `1:104:107` |
| `rooms/int_multiple_band_strict_filter` | диапазоны `мин:макс` через `,`; студия `0:0`, «4+» `4:` | `2:2,3:3` |
| `price_rub/int_multiple_band_strict_filter` | `мин:макс` (₽), любой край пустой | `100000000:200000000` |
| `price_rub_m2/int_multiple_band_strict_filter` | то же за м² | |
| `area_m2/int_band_filter` | `мин:макс` (м²) | `100:150` |
| `floor/int_band_filter` | `мин:макс` | |
| `county_id/district_id/metro_id/lot_id` + `/int_multiple_filter` | id через `:` | |
| `kind/str_multiple_filter` | типы через `:` | |
| `decoration/str_multiple_filter` | отделка | |
| `is_secondary/bool_filter`, `is_built/bool_filter` | `0`/`1` | |
| `readiness_year/int_multiple_filter` | годы | |
| `sorting/custom` | `колонка:asc\|desc`, колонки `price_rub`, `area` | `price_rub:asc` |

`lot_id/int_multiple_filter|<id>` — способ получить карточку конкретного лота.

## Подсказки поиска

```
GET /api/v1/filter/{sale|rent}/lots/search?search=<строка>
GET /api/v1/filter/complexes/search?search=<строка>
```

Возвращают группы тегов (Округа / Районы / Метро / Лоты / Комплексы) с готовыми
`filterRule` + `value`. Через комплексный поиск находятся `complex_id` башен.

## Комплексы

```
GET /api/v1/filter/complexes?page=1&filters=complex_id/int_multiple_filter|1:104
```

Ответ `{ moscowComplexFilterResultDTO: { moscowComplexCardDTOs[] } }`: `id`,
`title`, `description` (полное), `district`, `kind`, `images[]`,
`complexCardPriceDTO` («от N ₽»), `complexLink`.

## Картинки

CDN с ресайзом на лету:

```
https://cdn.ww.estate/p/s/whitelist-api/file/<путь из images[]>?width=310
```

Стандартные ширины whitewill: 310 / 374 / 727 / 1100 / 1600+. Часть картинок
комплексов приходит уже абсолютными URL (`cdn.ww.estate/tp/s/...`) — их не префиксуем.

## Страница лота (скрейп)

JSON-API детальной страницы нет. Страница `https://whitewill.ru/lots/show/{id}` —
серверный HTML, из него достаём:

- галерею по категориям: атрибут `:complex-gallery="[...]"` (HTML-escaped JSON,
  `{category, url, title, desc}`); категории: living_room, bedroom, kitchen,
  bathroom, hallway, wardrobe, window_views, schemas;
- полное описание: `og:description` / блок описания.

## ID башен Москва-Сити (скоуп этого портала)

| Башня | complex_id |
|---|---|
| Capital Towers | 1 |
| Neva Towers | 104 |
| ОКО | 107 |
| Федерация | 115 |
| Город Столиц | 558 |
| Империя | 503 |
| Дом Дау | 69 |

## Прочие эндпоинты (не используются, но есть)

`/api/v1/send-callback`, `/api/v1/send-report`, `/api/v1/download-presentation`
(требуют reCAPTCHA-токен), `/api/v1/identify-region`, `/api/v1/format/price`.
Регионы: spb.whitewill.ru, whitewill.london, whitewill.ae и др. — тот же движок,
то есть темплейт масштабируется на любой регион Whitewill.
