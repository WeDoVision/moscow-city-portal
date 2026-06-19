/**
 * Корень «/» — точное зеркало главной whitewill.ru.
 *
 * Отдаём реальный server-rendered HTML их главной (снимок в
 * src/mirror/whitewill-index.html) как есть: вся разметка, фото, карусели,
 * шрифты подтягиваются с их же CDN через внедрённый <base href>. Это даёт
 * 1:1 дубликат, потому что это буквально их файлы.
 *
 * Поверх — единственная наша правка: в секцию «Проекты Whitewill» вместо
 * внешних проектов подставляем порталы, созданные на платформе (listPortals),
 * с учётом оформления карточки из админки (обложка/цвета/шрифт).
 *
 * Это Route Handler, а не страница, поэтому корневой layout не оборачивает
 * ответ — отдаётся цельный HTML-документ.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { listPortals } from "@/lib/portal/store";
import type { PortalSchema } from "@/lib/portal/schema";
import { fontCss, GOOGLE_FONTS_HREF } from "@/lib/portal/fonts";
import { getHomeOverrides } from "@/lib/portal/home-store";
import { applyHomeOverrides } from "@/lib/portal/home-overrides";

export const dynamic = "force-dynamic";

const MIRROR = path.join(process.cwd(), "src", "mirror", "whitewill-index.html");

/**
 * Их слайдеры (office/catalog) инициализируются их бандлом по DOMContentLoaded,
 * который в зеркале успевает сработать раньше — поэтому flickity не стартует.
 * Добиваем сами теми же опциями, что и в их index-бандле (idempotent: проверяем
 * flickity-enabled, плюс задержка, чтобы дать их init отработать первым).
 */
const CAROUSEL_INIT = `<script>(function(){
  function whenReady(cb){ if(window.jQuery&&window.Flickity){cb(window.jQuery);} else {setTimeout(function(){whenReady(cb);},80);} }
  function init($){
    var off=$(".office__slider");
    if(off.length){
      // их бандл мог уже включить flickity — тогда наш on:{} не привяжется; делаем idempotent
      if(!off.hasClass("flickity-enabled")){
        off.flickity({cellAlign:"center",friction:0.3,prevNextButtons:false,pageDots:false});
      }
      var sync=function(){
        var i=$(".office__item.is-selected");var s=i.data("office");
        $(".office__item").removeClass("siblings-next siblings-prev");
        i.next().addClass("siblings-next");i.prev().addClass("siblings-prev");
        $(".location-nav button.office-tag").removeClass("active");
        var o=$('.location-nav button[data-office="'+s+'"]'),a=o.data("desc");
        o.addClass("active");$(".office__subtitle").html(a);
      };
      if(!off.data("wwOfficeBound")){
        off.data("wwOfficeBound",true);
        var fk=off.data("flickity");
        if(fk){fk.on("select",function(){sync();});fk.on("change",function(){sync();});}
        $(".office__button").on("click",function(){
          var s=$(".office__item.is-selected").index();
          if($(this).hasClass("office__button_next")){off.flickity("select",s+1);}
          else if($(this).hasClass("office__button_prev")){off.flickity("select",s-1);}
        });
        $("button.office-tag").on("click",function(){
          if($(this).data("office")!==$("button.office-tag.active").data("office")){
            off.flickity("select",$('.office__item[data-office="'+$(this).data("office")+'"]').first().index());
          }
        });
        if($(window).width()>767){setTimeout(function(){try{off.flickity("select",2);}catch(e){}},60);}
      }
      setTimeout(function(){try{off.flickity("resize");}catch(e){}sync();},400);
    }
    var t=$(".catalog-carousel__slider");
    if(t.length&&!t.hasClass("flickity-enabled")){
      t.flickity({cellAlign:"center",prevNextButtons:false,pageDots:false,wrapAround:true,freeScroll:true});
      var fk=t.data("flickity");
      if(fk){fk.x=0;var raf=null,run=false;
        function step(){if(run){fk.x=fk.x-0.25;fk.settle(fk.x);raf=requestAnimationFrame(step);}}
        var io=new IntersectionObserver(function(es){es.forEach(function(c){
          if(c.isIntersecting){if(!run){run=true;step();}}else{run=false;if(raf){cancelAnimationFrame(raf);raf=null;}}
        });},{root:null,rootMargin:"50px",threshold:0.1});
        io.observe(t[0]);
      }
    }
  }
  whenReady(function($){setTimeout(function(){init($);},600);});
})();</script>`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Карточка портала — композиция как у .projects__item на whitewill:
 * фоновое фото + центрированный логотип (или название) + подпись-дескриптор.
 * Только фото: индивидуальные цвета/шрифт не настраиваются.
 */
function portalCard(p: PortalSchema, origin: string): string {
  const titleFont = fontCss(undefined); // дефолтный сериф (Prata)
  const cover = p.card?.image;
  const logo = p.card?.logo;
  // подпись показываем только если задана явно (без авто-«продажа · N блоков»)
  const subtitle = p.card?.subtitle?.trim() || "";

  const coverHtml = cover
    ? `<img class="ww-pcard__cover" loading="lazy" src="${esc(cover)}${cover.includes("?") ? "&" : "?"}width=760" alt="${esc(p.name)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .4s;">`
    : "";
  // затемнение для читаемости текста поверх фото
  const overlay = `<span style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.55),rgba(0,0,0,0.15),rgba(0,0,0,0.35));"></span>`;

  // размер логотипа на карточке (s | m по умолчанию | l)
  // ширина логотипа в долях ширины карточки (max-height не даёт перерасти по высоте).
  // Важно задавать именно width, а не max-width: SVG с маленьким «родным» размером
  // по max-width не увеличивается — width его масштабирует до нужной доли.
  const LOGO_SIZE: Record<string, string> = {
    s: "width:45%;max-height:50%;",
    m: "width:60%;max-height:65%;",
    l: "width:75%;max-height:80%;",
  };
  const logoStyle = LOGO_SIZE[p.card?.logoSize ?? "m"] || LOGO_SIZE.m;

  // центральный блок: логотип ИЛИ название, плюс подпись
  const center = logo
    ? `<img class="ww-pcard__logo" loading="lazy" src="${esc(logo)}" alt="${esc(p.name)}" style="${logoStyle}height:auto;object-fit:contain;">`
    : `<span class="ww-pcard__title" style="font-family:${titleFont};font-size:2rem;line-height:1.05;color:#ffffff;">${esc(p.name)}</span>`;

  return `<a class="ww-pcard" href="${origin}/p/${esc(p.slug)}" style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;aspect-ratio:2/1;overflow:hidden;border-radius:2px;background:#0c1b20;padding:1.5rem;text-decoration:none;color:#ffffff;">
    ${coverHtml}${overlay}
    <span style="position:relative;z-index:2;width:100%;display:flex;flex-direction:column;align-items:center;gap:0.5rem;">
      ${center}
      ${subtitle ? `<span class="ww-pcard__sub" style="font-size:0.85rem;color:rgba(255,255,255,0.72);">${esc(subtitle)}</span>` : ""}
    </span>
  </a>`;
}

/** Внутри HTML находит сбалансированный <div class="projects__grid …">…</div>. */
function findGrid(html: string): { start: number; end: number; open: string } | null {
  const anchor = html.indexOf('class="projects__grid');
  if (anchor < 0) return null;
  const start = html.lastIndexOf("<div", anchor);
  if (start < 0) return null;
  const openEnd = html.indexOf(">", anchor) + 1;
  const open = html.slice(start, openEnd);
  const re = /<(\/?)div\b/g;
  re.lastIndex = start;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return { start, end: re.lastIndex + html.slice(re.lastIndex).indexOf(">") + 1, open };
  }
  return null;
}

export async function GET(req: Request): Promise<Response> {
  const origin = new URL(req.url).origin;
  let html = await readFile(MIRROR, "utf8");

  // 1) <base href> — относительные пути (/build, /js, /images) грузятся с боевого сайта
  //    + Google Fonts для шрифтов карточек (зеркало вне next/font)
  html = html.replace(
    /<head(\s[^>]*)?>/i,
    (m) =>
      `${m}<base href="https://whitewill.ru/"><link rel="stylesheet" href="${GOOGLE_FONTS_HREF}">`,
  );

  // 2) Подменяем содержимое секции «Проекты» на наши порталы
  try {
    const portals = await listPortals();
    const grid = findGrid(html);
    if (grid && portals.length) {
      const cards = portals.map((p) => portalCard(p, origin)).join("\n");
      const newGrid =
        `<div class="projects__grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:1rem;">` +
        cards +
        `</div>`;
      html = html.slice(0, grid.start) + newGrid + html.slice(grid.end);
    }
  } catch {
    /* нет порталов / fs — отдаём зеркало как есть */
  }

  // 3) ИИ-оверрайды главной (замены текста, скрытие секций, CSS, вставки)
  try {
    html = applyHomeOverrides(html, await getHomeOverrides());
  } catch {
    /* нет оверрайдов — отдаём как есть */
  }

  // 4) Доинициализация каруселей (office/catalog) — их init не стартует в зеркале
  html = html.replace(/<\/body>/i, `${CAROUSEL_INIT}</body>`);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
