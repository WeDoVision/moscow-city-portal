/**
 * Three.js сцена 3D-карты Москва-Сити (KRE-189) — реалистично-стилизованная
 * под тёмную тему sui.io версия.
 *
 *  • Геометрия района (контуры/высоты OSM, public/data/moscow-city.json) идёт
 *    в приглушённую «контекстную» застройку — город вокруг башен.
 *  • Семь башен портала — не выдавленные коробки, а узнаваемые силуэты:
 *    тонкая призма + шпиль (Федерация), «стопка» (Город Столиц), парные
 *    сужающиеся башни (ОКО/Neva), круглые (Capital/Империя), слим (Дом Дау).
 *    Материал — тёмное стекло с эмиссивной сеткой окон (ночной небоскрёб).
 *  • Камера ведётся СКРОЛЛОМ (setProgress 0..1) по маршруту через башни с
 *    паузами — без ручного вращения.
 *  • Реальные glTF-модели подключаются позже тем же пайплайном: положите
 *    /public/models/<slug>.glb и пропишите в TOWER_MODELS — крафт-модель
 *    заменится загруженной без правок остального кода.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export type CityBuilding = {
  p: [number, number][];
  h: number;
  mh: number;
  n: string | null;
  t: number | null;
};

export type MapColors = {
  background?: string;
  building?: string;
  tower?: string;
  accent?: string;
  accentDeep?: string;
};

/** Профиль одного корпуса башни (метры; смещения от центроида футпринта). */
type Body = {
  shape: "box" | "tri" | "round";
  /** «радиус» до углов сечения у основания, м */
  r: number;
  /** высота, м */
  h: number;
  /** сужение верха (radiusTop = r*taper) */
  taper?: number;
  /** смещение корпуса от центроида башни, м */
  ox?: number;
  oz?: number;
  /** тонкий шпиль сверху (Федерация) */
  spire?: number;
  /** скруглённый купол сверху (Империя) */
  dome?: boolean;
  /** «стопка» сдвинутых блоков (Город Столиц): число уровней */
  stack?: number;
  /** число ступеней-сетбэков по высоте (силуэт супертолла, а не гладкая призма) */
  tiers?: number;
  /** тонкая мачта-антенна сверху, м */
  antenna?: number;
  /** скошенная корона сверху (наклон верхней грани, как у ОКО) */
  slant?: boolean;
};

/**
 * Силуэты семи башен (узнаваемые пропорции реальных зданий Сити).
 * Высоты — реальные (м), не из устаревшего OSM.
 */
const TOWER_BODIES: Record<number, Body[]> = {
  // Capital Towers — три круглые башни у воды, лёгкие сетбэки
  1: [
    { shape: "round", r: 21, h: 295, taper: 0.86, tiers: 6, ox: -46, oz: -4 },
    { shape: "round", r: 21, h: 295, taper: 0.86, tiers: 6, ox: 4, oz: 22 },
    { shape: "round", r: 19, h: 158, taper: 0.9, tiers: 4, ox: 48, oz: -12 },
  ],
  // Neva Towers — две сужающиеся башни с мачтой
  104: [
    { shape: "box", r: 27, h: 345, taper: 0.62, tiers: 6, antenna: 30, ox: -40, oz: -6 },
    { shape: "box", r: 25, h: 302, taper: 0.66, tiers: 5, ox: 42, oz: 16 },
  ],
  // ОКО — высокая жилая (скошенная корона) + офисная пониже
  107: [
    { shape: "box", r: 29, h: 354, taper: 0.72, tiers: 6, slant: true, ox: -46, oz: -2 },
    { shape: "box", r: 27, h: 245, taper: 0.78, tiers: 5, ox: 50, oz: 22 },
  ],
  // Федерация — две треугольные призмы + шпиль (Восток самый высокий)
  115: [
    { shape: "tri", r: 33, h: 374, taper: 0.44, tiers: 7, spire: 90, ox: -34, oz: 0 },
    { shape: "tri", r: 30, h: 243, taper: 0.48, tiers: 5, ox: 40, oz: 12 },
  ],
  // Город Столиц — две «стопки» сдвинутых блоков (Москва выше, Петербург)
  558: [
    { shape: "box", r: 26, h: 302, ox: -32, oz: -2, stack: 5 },
    { shape: "box", r: 24, h: 257, ox: 34, oz: 14, stack: 4 },
  ],
  // Империя — башня со скруглённой вершиной
  503: [{ shape: "round", r: 27, h: 239, taper: 0.82, tiers: 5, dome: true }],
  // Дом Дау — одиночный слим-небоскрёб с мачтой
  69: [{ shape: "box", r: 23, h: 340, taper: 0.56, tiers: 7, antenna: 28 }],
};

/** Реальные glTF-модели (по slug). Пусто → используется крафт-силуэт. */
const TOWER_MODELS: Record<number, { url: string; scale?: number; yaw?: number }> = {
  // пример: 115: { url: "/models/federation.glb", scale: 1, yaw: 0 },
};

/** Порядок облёта камеры (как в каталоге портала). */
const TOWER_ORDER = [1, 104, 107, 115, 558, 503, 69];

/** Любой CSS-цвет (oklch/hex/rgb) → "#rrggbb" через растеризацию 1px. */
function cssToHex(input: string | undefined, fallback: string): string {
  if (!input) return fallback;
  try {
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = input;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  } catch {
    return fallback;
  }
}

/** Эмиссивная текстура «сетка светящихся окон» — общий ночной look башен. */
function makeWindowTexture(): THREE.Texture {
  const cols = 24,
    rows = 64,
    cell = 8;
  const cv = document.createElement("canvas");
  cv.width = cols * cell;
  cv.height = rows * cell;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#05070d";
  ctx.fillRect(0, 0, cv.width, cv.height);
  // детерминированный псевдослучай (без Math.random — стабильный кадр)
  let s = 1337;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const lit = rnd();
      if (lit < 0.66) continue; // большинство окон тёмные → сетка, а не сплошное свечение
      // холодный sui.io-свет с редкими тёплыми вкраплениями, приглушённый
      const warm = rnd() < 0.18;
      const a = 0.22 + rnd() * 0.33;
      ctx.fillStyle = warm
        ? `rgba(225,${175 + (rnd() * 35) | 0},120,${a})`
        : `rgba(${130 + (rnd() * 45) | 0},${165 + (rnd() * 45) | 0},220,${a})`;
      ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Ночной градиент-HDRI (equirect) для отражений стекла: синь зенита →
 *  свечение горизонта (акцент) → тёмная земля + редкие огни города. */
function makeNightEnv(accent: THREE.Color): THREE.Texture {
  const w = 512,
    h = 256;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#2c4068"); // зенит (светлее)
  g.addColorStop(0.5, "#16223c");
  g.addColorStop(0.6, `#${accent.clone().multiplyScalar(0.7).getHexString()}`); // свечение горизонта
  g.addColorStop(0.66, "#121a2a");
  g.addColorStop(1, "#0a0e16"); // земля
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // редкие огни города у линии горизонта — оживляют отражения
  let s = 7;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff), s / 0x7fffffff);
  for (let i = 0; i < 240; i++) {
    const y = h * (0.58 + rnd() * 0.1);
    ctx.fillStyle = `rgba(${150 + (rnd() * 80) | 0},${180 + (rnd() * 60) | 0},255,${0.25 + rnd() * 0.4})`;
    ctx.fillRect(rnd() * w, y, 1.4, 1.4);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type ViewKF = { pos: THREE.Vector3; tgt: THREE.Vector3 };

export class CityScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  /** id башен в порядке облёта (для маппинга прогресса в React) */
  order: number[] = [];

  private towers = new Map<number, THREE.Object3D>();
  private towerMats = new Map<number, THREE.MeshStandardMaterial[]>();
  private anchors = new Map<number, { x: number; z: number; h: number }>();
  private views: ViewKF[] = []; // [overview, ...пербашенно]
  private overview!: ViewKF;

  private highlighted = new Set<number>();
  private activeTower: number | null = null;

  private progress = 0; // 0..1, ведётся скроллом
  private camPos = new THREE.Vector3();
  private camTgt = new THREE.Vector3();
  private frame = 0;
  private disposed = false;

  private cityColor: THREE.Color;
  private towerColor: THREE.Color;
  private accentColor: THREE.Color;
  private windowTex: THREE.Texture;
  private composer!: EffectComposer;
  private bloom!: UnrealBloomPass;

  constructor(
    canvas: HTMLCanvasElement,
    buildings: CityBuilding[],
    colors: MapColors = {},
    private onReady: () => void = () => {},
  ) {
    const bg = new THREE.Color(cssToHex(colors.background, "#0c1018"));
    this.cityColor = new THREE.Color(cssToHex(colors.building, "#11151f"));
    this.towerColor = new THREE.Color(cssToHex(colors.tower, "#0b0f1a"));
    this.accentColor = new THREE.Color(cssToHex(colors.accent, "#4da2ff"));
    this.windowTex = makeWindowTexture();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // фон чуть светлее «чернил», чтобы силуэты не тонули в черноте
    const sceneBg = bg.clone().lerp(new THREE.Color("#1b2740"), 0.35);
    this.scene.background = sceneBg.clone();
    this.scene.fog = new THREE.FogExp2(sceneBg.clone(), 0.00022);

    // отражения окружения: ночной градиент (зенит-синь → свечение горизонта →
    // тёмная земля) через PMREM. Тёмное стекло начинает отражать «ночь», а не
    // студийную комнату — глянец читается как ночной фасад.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = makeNightEnv(this.accentColor);
    this.scene.environment = pmrem.fromEquirectangular(envTex).texture;
    envTex.dispose();

    this.camera = new THREE.PerspectiveCamera(50, 1, 5, 12000);

    // постобработка: bloom заставляет окна светиться (ночной небоскрёб, sui.io)
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // мягкое свечение только у самых ярких окон (не пересвечивать силуэт)
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.5, 0.62);
    this.composer.addPass(this.bloom);

    // ── свет: холодная ночь + акцентный подсвет центра (поярче, чтобы фасады читались) ──
    this.scene.add(new THREE.HemisphereLight(0xaecbf2, 0x0a1018, 1.0));
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.42));
    const moon = new THREE.DirectionalLight(0xd2e2ff, 1.15);
    moon.position.set(-700, 1100, -500);
    this.scene.add(moon);
    const fill = new THREE.DirectionalLight(0xbcd0f0, 0.5);
    fill.position.set(600, 500, 700);
    this.scene.add(fill);
    const glow = new THREE.PointLight(this.accentColor.clone(), 1.2, 2800, 1.3);
    glow.position.set(-120, 280, -160);
    this.scene.add(glow);

    // ── тёмная городская подложка + sui.io-сетка (без воды) ──
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(5000, 72),
      new THREE.MeshStandardMaterial({
        color: bg.clone().lerp(new THREE.Color("#243150"), 0.5),
        metalness: 0.5,
        roughness: 0.62,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    this.scene.add(ground);
    const grid = new THREE.GridHelper(6000, 80, this.accentColor.clone(), this.accentColor.clone());
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.12;
    grid.position.y = 0;
    this.scene.add(grid);

    this.computeAnchors(buildings);
    this.buildContext(buildings);
    this.buildTowers();
    this.buildPath();
    this.loadModels();

    this.progress = 0;
    this.applyProgress(0);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTgt);
    this.animate();
    this.onReady();
  }

  // ── приглушённая контекстная застройка района (один меш) ──
  private buildContext(buildings: CityBuilding[]) {
    const geos: THREE.BufferGeometry[] = [];
    for (const b of buildings) {
      if (b.t != null || b.p.length < 3) continue; // башни строим отдельно
      const shape = new THREE.Shape(b.p.map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: b.h - b.mh, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, b.mh, 0);
      geos.push(geo);
    }
    if (!geos.length) return;
    const mat = new THREE.MeshStandardMaterial({
      // контекст-застройка чуть светлее, чтобы город не сливался в черноту
      color: this.cityColor.clone().lerp(new THREE.Color("#2a3a58"), 0.45),
      metalness: 0.8,
      roughness: 0.4,
      envMapIntensity: 1.1,
      emissive: this.accentColor.clone().multiplyScalar(0.12),
    });
    const mesh = new THREE.Mesh(mergeGeometries(geos, false), mat);
    this.scene.add(mesh);
  }

  /** Один корпус башни из призмы CylinderGeometry (tri/box/round + тапер). */
  private makeBody(b: Body): THREE.Object3D {
    const seg = b.shape === "tri" ? 3 : b.shape === "round" ? 30 : 4;
    const group = new THREE.Group();
    const winTex = this.windowTex.clone();
    winTex.needsUpdate = true;
    // окна тайлятся по корпусу; для ступенчатых башен V считаем по высоте ступени,
    // иначе на каждой ступени (она маппит V 0..1) окна были бы слишком частыми
    const piece = b.shape === "round" ? b.h : b.h / Math.max(1, b.tiers ?? 1);
    winTex.repeat.set(b.shape === "round" ? 4 : 1, Math.max(3, Math.round(piece / 16)));
    const mat = new THREE.MeshStandardMaterial({
      // стекло чуть светлее и менее «зеркально-чёрное» — фасад читается ночью
      color: this.towerColor.clone().lerp(new THREE.Color("#33486e"), 0.5),
      metalness: 0.82,
      roughness: 0.2,
      envMapIntensity: 1.6,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: winTex,
      emissiveIntensity: 0.55,
    });
    this.bodyMats.push(mat);

    if (b.stack) {
      // «стопка» сдвинутых блоков (Город Столиц)
      const levels = b.stack;
      const lh = b.h / levels;
      for (let i = 0; i < levels; i++) {
        const r = b.r * (1 - i * 0.04);
        const geo = new THREE.CylinderGeometry(r, r, lh * 1.02, 4);
        geo.rotateY(Math.PI / 4);
        const m = new THREE.Mesh(geo, mat);
        m.position.y = lh * (i + 0.5);
        m.position.x = (i % 2 === 0 ? 1 : -1) * b.r * 0.28;
        m.position.z = (i % 2 === 0 ? -1 : 1) * b.r * 0.2;
        group.add(m);
      }
    } else {
      const taper = b.taper ?? 0.8;
      const rTop = b.r * taper;
      const rot = b.shape === "tri" ? Math.PI / 6 : Math.PI / 4;

      if (b.shape === "round") {
        // гладкая сужающаяся башня (Capital/Империя)
        const geo = new THREE.CylinderGeometry(rTop, b.r, b.h, 30, 1, false);
        const m = new THREE.Mesh(geo, mat);
        m.position.y = b.h / 2;
        group.add(m);
      } else {
        // ступенчатый силуэт супертолла (box/tri): сетбэки по высоте,
        // каждая ступень уже предыдущей → читаются «этажи/уступы», не коробка
        const tiers = Math.max(2, b.tiers ?? 4);
        const tierH = b.h / tiers;
        for (let i = 0; i < tiers; i++) {
          const r = b.r * (1 - (1 - taper) * (i / (tiers - 1)));
          const geo = new THREE.CylinderGeometry(r, r, tierH * 1.012, seg, 1, false);
          geo.rotateY(rot);
          const m = new THREE.Mesh(geo, mat);
          m.position.y = tierH * (i + 0.5);
          group.add(m);
        }
      }

      if (b.dome) {
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(rTop, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          mat,
        );
        dome.position.y = b.h;
        group.add(dome);
      }
      if (b.slant) {
        // скошенная корона (как срез у ОКО): призма с наклонённой верхней гранью
        const cap = new THREE.CylinderGeometry(rTop * 0.7, rTop, rTop * 1.5, seg, 1, false);
        cap.rotateY(rot);
        const cm = new THREE.Mesh(cap, mat);
        cm.position.y = b.h + rTop * 0.55;
        cm.rotation.z = 0.22;
        group.add(cm);
      }
      if (b.antenna) {
        const ant = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 1.6, b.antenna, 6),
          new THREE.MeshStandardMaterial({
            color: this.towerColor.clone(),
            metalness: 0.95,
            roughness: 0.35,
            emissive: this.accentColor.clone(),
            emissiveIntensity: 0.4,
          }),
        );
        ant.position.y = b.h + b.antenna / 2;
        group.add(ant);
      }
      if (b.spire) {
        const spireMat = new THREE.MeshStandardMaterial({
          color: this.towerColor.clone(),
          metalness: 0.9,
          roughness: 0.3,
          emissive: this.accentColor.clone(),
          emissiveIntensity: 0.5,
        });
        const sp = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 5, b.spire, 8), spireMat);
        sp.position.y = b.h + b.spire / 2;
        group.add(sp);
      }
    }

    // тонкая акцентная окантовка силуэта
    group.position.set(b.ox ?? 0, 0, b.oz ?? 0);
    return group;
  }

  private bodyMats: THREE.MeshStandardMaterial[] = [];

  /** Центроид + высота каждой башни из футпринтов OSM (b.t != null). */
  private computeAnchors(buildings: CityBuilding[]) {
    const acc = new Map<number, { xs: number[]; zs: number[]; h: number }>();
    for (const b of buildings) {
      if (b.t == null) continue;
      const cur = acc.get(b.t) ?? { xs: [], zs: [], h: 0 };
      for (const [x, z] of b.p) {
        cur.xs.push(x);
        cur.zs.push(z);
      }
      cur.h = Math.max(cur.h, b.h);
      acc.set(b.t, cur);
    }
    for (const [id, v] of acc) {
      const x = (Math.min(...v.xs) + Math.max(...v.xs)) / 2;
      const z = (Math.min(...v.zs) + Math.max(...v.zs)) / 2;
      this.anchors.set(id, { x, z, h: v.h });
    }
  }

  private buildTowers() {
    for (const id of TOWER_ORDER) {
      const a = this.anchors.get(id);
      const bodies = TOWER_BODIES[id];
      if (!a || !bodies) continue;
      const group = new THREE.Group();
      this.bodyMats = [];
      for (const b of bodies) group.add(this.makeBody(b));
      group.position.set(a.x, 0, a.z);
      this.scene.add(group);
      this.towers.set(id, group);
      this.towerMats.set(id, this.bodyMats);
    }
  }

  /** Отображаемая высота башни (по крафт-силуэту) — для кадрирования камеры. */
  private displayHeight(id: number): number {
    const bodies = TOWER_BODIES[id];
    if (!bodies) return this.anchors.get(id)?.h ?? 250;
    return Math.max(...bodies.map((b) => b.h + (b.spire ?? 0)));
  }

  // ── маршрут камеры: обзор + видовая точка на каждую башню ──
  private buildPath() {
    const ids = TOWER_ORDER.filter((id) => this.anchors.has(id));
    this.order = ids;
    const all = ids.map((id) => this.anchors.get(id)!);
    const cx = all.reduce((s, a) => s + a.x, 0) / Math.max(1, all.length);
    const cz = all.reduce((s, a) => s + a.z, 0) / Math.max(1, all.length);

    // обзорная точка: высоко и позади центра
    this.overview = {
      pos: new THREE.Vector3(cx + 200, 1150, cz + 1250),
      tgt: new THREE.Vector3(cx, 140, cz),
    };

    for (const id of ids) {
      const a = this.anchors.get(id)!;
      const H = this.displayHeight(id);
      // камера ставится со стороны, ПРОТИВОПОЛОЖНОЙ «толпе» соседних башен:
      // тогда между камерой и целью соседей нет, а они уходят на задний план.
      const others = ids.filter((o) => o !== id).map((o) => this.anchors.get(o)!);
      const ox = others.reduce((s, p) => s + p.x, 0) / Math.max(1, others.length);
      const oz = others.reduce((s, p) => s + p.z, 0) / Math.max(1, others.length);
      let dx = a.x - ox,
        dz = a.z - oz;
      let len = Math.hypot(dx, dz);
      if (len < 1) {
        // вырожденный случай — отходим от общего центра
        dx = a.x - cx;
        dz = a.z - cz;
        len = Math.hypot(dx, dz) || 1;
      }
      dx /= len;
      dz /= len;
      // ближе и выше: цель доминирует в кадре, соседи уходят вниз/за край
      const dist = H * 0.8 + 150;
      const pos = new THREE.Vector3(a.x + dx * dist, H * 0.95 + 60, a.z + dz * dist);
      const tgt = new THREE.Vector3(a.x, H * 0.52, a.z);
      this.views.push({ pos, tgt });
    }
  }

  private loadModels() {
    const entries = Object.entries(TOWER_MODELS);
    if (!entries.length) return;
    const loader = new GLTFLoader();
    for (const [idStr, cfg] of entries) {
      const id = Number(idStr);
      const a = this.anchors.get(id);
      if (!a) continue;
      loader.load(
        cfg.url,
        (gltf) => {
          const crafted = this.towers.get(id);
          if (crafted) this.scene.remove(crafted);
          const obj = gltf.scene;
          obj.position.set(a.x, 0, a.z);
          if (cfg.scale) obj.scale.setScalar(cfg.scale);
          if (cfg.yaw) obj.rotation.y = cfg.yaw;
          obj.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m) {
                m.metalness = 0.9;
                m.roughness = 0.2;
              }
            }
          });
          this.scene.add(obj);
          this.towers.set(id, obj);
        },
        undefined,
        () => {
          /* модель не загрузилась — остаётся крафт-силуэт */
        },
      );
    }
  }

  // ── прогресс скролла → позиция камеры ──
  private ease(x: number) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  setProgress(p: number) {
    this.progress = Math.max(0, Math.min(1, p));
  }

  /** Активная башня (в паузе) — подсветка силуэта. */
  setActiveTower(id: number | null) {
    this.activeTower = id;
  }

  setHighlighted(ids: Iterable<number>) {
    this.highlighted = new Set(ids);
  }

  private applyProgress(p: number) {
    const N = this.views.length;
    if (!N) {
      this.camPos.copy(this.overview.pos);
      this.camTgt.copy(this.overview.tgt);
      return;
    }
    const slot = 1 / N;
    let i = Math.floor(p / slot);
    if (i >= N) i = N - 1;
    const local = (p - i * slot) / slot; // 0..1 в слоте
    const from = i === 0 ? this.overview : this.views[i - 1];
    const to = this.views[i];
    const travel = 0.55;
    if (local < travel) {
      const e = this.ease(local / travel);
      this.camPos.lerpVectors(from.pos, to.pos, e);
      this.camTgt.lerpVectors(from.tgt, to.tgt, e);
    } else {
      this.camPos.copy(to.pos);
      this.camTgt.copy(to.tgt);
    }
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private animate = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);

    this.applyProgress(this.progress);
    const t = performance.now() / 1000;
    // мягкое плавание камеры (демонстрирует «живость» без ручного управления)
    this.camera.position.lerp(this.camPos, 0.12);
    this.camera.position.y += Math.sin(t * 0.5) * 1.5;
    this.camera.lookAt(this.camTgt);

    // подсветка башен: активная (пауза) / подсвеченные поиском / обычные
    const pulse = 1 + Math.sin(t * 2.2) * 0.08;
    for (const [id, mats] of this.towerMats) {
      const active = id === this.activeTower;
      const lit = this.highlighted.has(id);
      const target = active ? 0.85 * pulse : lit ? 0.7 : 0.52;
      for (const m of mats) {
        m.emissiveIntensity += (target - m.emissiveIntensity) * 0.12;
      }
    }

    this.composer.render();
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.windowTex.dispose();
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const m = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (m) (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
    });
    this.renderer.dispose();
  }
}
