/**
 * Корень «/» — точное зеркало главной whitewill.ru.
 *
 * Отдаём реальный server-rendered HTML их главной (снимок в
 * src/mirror/whitewill-index.html) как есть: вся разметка, фото, карусели,
 * шрифты подтягиваются с их же CDN через внедрённый <base href>. Это даёт
 * 1:1 дубликат, потому что это буквально их файлы.
 *
 * Поверх — единственная наша правка: в секцию «Проекты Whitewill» вместо
 * внешних проектов подставляем флагманские порталы Whitewill (PROJECTS),
 * ведущие на бутиковые лендинги внутри приложения.
 *
 * Это Route Handler, а не страница, поэтому корневой layout не оборачивает
 * ответ — отдаётся цельный HTML-документ.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { GOOGLE_FONTS_HREF } from "@/lib/portal/fonts";
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
 * Карточки секции «Проекты Whitewill» — флагманские порталы Whitewill.
 * Оформление 1:1 повторяет оригинальные .projects__item с whitewill.ru
 * (их же CSS подтягивается через <base href>), но ссылки ведут на наши
 * бутиковые лендинги (см. project-update в Linear: Москоу-Сити →
 * /moscow-city-p, Особняки → /osobnyaki-c).
 */
type ProjectCard = {
  href: string; // внутренний путь (без origin) — добавляется в projectCard()
  bg: string; // фоновое фото проекта (базовый URL без ?width)
  bgAlt: string;
  logo: string; // логотип проекта (svg)
  logoWidth: string; // ширина логотипа как на оригинале (em)
};

const PROJECTS: ProjectCard[] = [
  {
    href: "/moscow-city-p",
    bg: "https://cdn.ww.estate/tp/s/whitewill.ru/uploads/projects/6/background/moskva-siti-fon.png",
    bgAlt: "Moscow City",
    logo: "https://cdn.ww.estate/tp/s/whitewill.ru/uploads/projects/6/logo/logo-moskva-siti.svg",
    logoWidth: "22em",
  },
  {
    href: "/osobnyaki-c",
    bg: "https://cdn.ww.estate/tp/s/whitewill.ru/uploads/projects/4/background/osobnyaki-fon.png",
    bgAlt: "Особняки",
    logo: "https://cdn.ww.estate/tp/s/whitewill.ru/uploads/projects/4/logo/logo-osobnyaki.svg",
    logoWidth: "11em",
  },
];

/**
 * Карточка проекта — точная копия разметки .projects__item с оригинала:
 * фоновое фото (с их srcset) + центрированный логотип. Стили берутся из их же
 * бандла. href обязан быть абсолютным (origin+path): в зеркале <base href>
 * указывает на whitewill.ru, и относительный путь уехал бы на боевой сайт.
 */
function projectCard(c: ProjectCard, origin: string): string {
  const w = (n: number) => `${esc(c.bg)}?width=${n}`;
  const srcset = [610, 510, 322, 360, 185].map((n) => `${w(n)} ${n}w`).join(",\n");
  const sizes =
    "(max-width: 767px) 360px, (max-width: 1024px) 322px, (max-width: 1620px) 510px, 610px";
  return `<a href="${origin}${esc(c.href)}" class="projects__item">
    <div class="projects__item-image">
      <img loading="lazy" src="${w(300)}" srcset="${srcset}" sizes="${sizes}" alt="${esc(c.bgAlt)}">
    </div>
    <img src="${esc(c.logo)}" style="width: ${esc(c.logoWidth)};" alt="${esc(c.bgAlt)}" class="projects__item-logo" loading="lazy">
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

  // 2) Подменяем содержимое секции «Проекты» на флагманские порталы Whitewill
  try {
    const grid = findGrid(html);
    if (grid) {
      const cards = PROJECTS.map((c) => projectCard(c, origin)).join("\n");
      // переиспользуем оригинальный открывающий тег сетки (его классы и стили),
      // меняем только содержимое — две наши карточки
      const newGrid = grid.open + cards + `</div>`;
      html = html.slice(0, grid.start) + newGrid + html.slice(grid.end);
    }
  } catch {
    /* секция не найдена — отдаём зеркало как есть */
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
