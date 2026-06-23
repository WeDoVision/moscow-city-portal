/**
 * Three.js сцена 3D-карты Москва-Сити.
 *
 * Геометрия — реальные контуры и высоты зданий района из OpenStreetMap
 * (public/data/moscow-city.json, собирается scripts/build_city_data.py).
 * Обычная застройка мержится в один меш; башни портала — отдельные
 * интерактивные меши с подсветкой (hover/selected) и raycast-кликом.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type CityBuilding = {
  p: [number, number][];
  h: number;
  mh: number;
  n: string | null;
  t: number | null;
};

export type TowerAnchor = { id: number; x: number; y: number; z: number };

/** Цвета сцены, приходят из темы портала (любой CSS-формат). */
/** Параметры камеры карты (настраиваются из админки/ИИ). */
export type MapView = {
  /** горизонтальный угол (поворот) в радианах */
  azimuth?: number;
  /** вертикальный угол/удаление 0..1 (0 — низко/близко, 1 — высоко/далеко) */
  elevation?: number;
  /** медленный автоповорот камеры */
  autoRotate?: boolean;
};

export type MapColors = {
  /** фон/туман/земля — фон портала */
  background?: string;
  /** обычная застройка */
  building?: string;
  /** база башен */
  tower?: string;
  /** акцент: грани башен, тёплый свет */
  accent?: string;
  /** тёмный акцент: свечение башен */
  accentDeep?: string;
};

/**
 * Любой CSS-цвет (oklch/hex/rgb) → "#rrggbb". Растеризуем 1 пиксель и читаем
 * getImageData — это даёт реальный RGB, минуя сериализацию (Three не понимает
 * oklch, поэтому конвертируем заранее, сохраняя sRGB-трактовку как у hex).
 */
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

export class CityScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  towers = new Map<number, THREE.Mesh>();
  anchors: TowerAnchor[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private hovered: number | null = null;
  selected: number | null = null;
  /** горизонтальный угол камеры (драг по X) */
  azimuth = -0.65;
  /** вертикальный угол 0..1 (0 = близко/низко, 1 = далеко/высоко) */
  elevation = 0.55;
  private frame = 0;
  private disposed = false;
  private center = new THREE.Vector3(0, 220, 0);
  /** дефолтный центр обзора (середина bbox всех башен) — точка возврата */
  private defaultCenter = new THREE.Vector3(0, 220, 0);
  /** куда плавно ведём камеру при fly-to (центр + удаление); null = свободный режим */
  private focusCenter: THREE.Vector3 | null = null;
  private focusElevation = 0.55;
  /** башни без свободных лотов — приглушаем */
  private emptyTowers = new Set<number>();
  /** башни, подсвеченные результатами поиска (двусторонняя связка) */
  private highlighted = new Set<number>();

  // цвета сцены (резолвятся из темы портала)
  private cityColor: THREE.Color;
  private towerColor: THREE.Color;
  private accentColor: THREE.Color;
  private accentDeepColor: THREE.Color;

  /** скорость автоповорота (рад/кадр); 0 — выключен */
  private autoRotate = 0;

  constructor(
    canvas: HTMLCanvasElement,
    buildings: CityBuilding[],
    private onPick: (towerId: number | null) => void,
    colors: MapColors = {},
    view: MapView = {},
    /** вызывается при смене наведённой башни (для HTML-тултипа) */
    private onHover: (towerId: number | null) => void = () => {},
  ) {
    if (typeof view.azimuth === "number") this.azimuth = view.azimuth;
    if (typeof view.elevation === "number") {
      this.elevation = Math.max(0, Math.min(view.elevation, 1));
    }
    if (view.autoRotate) this.autoRotate = 0.0012;

    const bg = new THREE.Color(cssToHex(colors.background, "#0e1015"));
    this.cityColor = new THREE.Color(cssToHex(colors.building, "#14161d"));
    this.towerColor = new THREE.Color(cssToHex(colors.tower, "#232838"));
    this.accentColor = new THREE.Color(cssToHex(colors.accent, "#c9a96e"));
    this.accentDeepColor = new THREE.Color(cssToHex(colors.accentDeep, "#6e5c39"));

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera = new THREE.PerspectiveCamera(58, 1, 10, 6000);
    // туман уводит дальние здания в цвет фона портала
    this.scene.fog = new THREE.Fog(bg.clone(), 900, 3200);

    // нейтральный заполняющий свет, чтобы цвета поверхностей читались как в теме;
    // лунный холодный + тёплый акцентный «контровой» для объёма
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const moon = new THREE.DirectionalLight(0xbfd0e8, 1.1);
    moon.position.set(-600, 900, -400);
    this.scene.add(moon);
    const warm = new THREE.DirectionalLight(this.accentColor.clone(), 0.7);
    warm.position.set(500, 300, 700);
    this.scene.add(warm);

    // земля — цвет фона портала
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2600, 64),
      new THREE.MeshLambertMaterial({ color: bg }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    this.scene.add(ground);

    this.buildCity(buildings);
    this.animate();
  }

  private extrude(b: CityBuilding): THREE.BufferGeometry | null {
    if (b.p.length < 3) return null;
    const shape = new THREE.Shape(b.p.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: b.h - b.mh,
      bevelEnabled: false,
    });
    // ExtrudeGeometry растёт по z — поворачиваем в y-up
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, b.mh, 0);
    return geo;
  }

  private buildCity(buildings: CityBuilding[]) {
    const cityGeos: THREE.BufferGeometry[] = [];
    const towerGeos = new Map<number, THREE.BufferGeometry[]>();
    const towerTops = new Map<number, { x: number; z: number; h: number }>();

    for (const b of buildings) {
      const geo = this.extrude(b);
      if (!geo) continue;
      if (b.t != null) {
        if (!towerGeos.has(b.t)) towerGeos.set(b.t, []);
        towerGeos.get(b.t)!.push(geo);
        const cx = b.p.reduce((s, p) => s + p[0], 0) / b.p.length;
        const cz = b.p.reduce((s, p) => s + p[1], 0) / b.p.length;
        const prev = towerTops.get(b.t);
        if (!prev || b.h > prev.h) towerTops.set(b.t, { x: cx, z: cz, h: b.h });
      } else {
        cityGeos.push(geo);
      }
    }

    const cityMat = new THREE.MeshLambertMaterial({
      color: this.cityColor,
      transparent: true,
      opacity: 0.92,
    });
    const city = new THREE.Mesh(mergeGeometries(cityGeos, false), cityMat);
    this.scene.add(city);

    for (const [tid, geos] of towerGeos) {
      const mat = new THREE.MeshStandardMaterial({
        color: this.towerColor.clone(),
        metalness: 0.85,
        roughness: 0.35,
        emissive: this.accentDeepColor.clone(),
        emissiveIntensity: 0.12,
      });
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), mat);
      mesh.userData.towerId = tid;
      this.scene.add(mesh);
      this.towers.set(tid, mesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry, 30),
        new THREE.LineBasicMaterial({ color: this.accentColor.clone(), transparent: true, opacity: 0.35 }),
      );
      mesh.add(edges);

      const top = towerTops.get(tid)!;
      this.anchors.push({ id: tid, x: top.x, y: top.h + 14, z: top.z });
    }

    // центрируем lookAt по середине bbox всех башен
    if (this.anchors.length) {
      const xs = this.anchors.map((a) => a.x);
      const zs = this.anchors.map((a) => a.z);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
      this.center.set(cx, 220, cz);
      this.defaultCenter.set(cx, 220, cz);
    }
  }

  /** Башни без свободных лотов — приглушаются на сцене. */
  setEmptyTowers(ids: Iterable<number>) {
    this.emptyTowers = new Set(ids);
  }

  /** Подсветка башен результатами поиска/фильтров (двусторонняя связка). */
  setHighlighted(ids: Iterable<number>) {
    this.highlighted = new Set(ids);
  }

  /**
   * Плавный заход камеры к башне (fly-to). null — возврат к общему обзору.
   * Меняем только точку прицела и удаление; горизонтальный угол не трогаем,
   * чтобы движение читалось как «подъезд», а не рывок.
   */
  focusTower(towerId: number | null) {
    if (towerId == null) {
      this.focusCenter = this.defaultCenter.clone();
      this.focusElevation = 0.55;
      return;
    }
    const a = this.anchors.find((an) => an.id === towerId);
    if (!a) return;
    this.focusCenter = new THREE.Vector3(a.x, Math.max(120, a.y * 0.55), a.z);
    this.focusElevation = 0.32;
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** курсор ушёл с карты — уводим точку прицела за кадр, чтобы hover/курсор не «залипали» */
  clearHover() {
    this.pointer.set(2, 2); // вне NDC [-1,1] → raycaster ничего не находит
  }

  setPointer(xNdc: number, yNdc: number) {
    this.pointer.set(xNdc, yNdc);
  }

  /** обновить угол камеры от драга (dAz в радианах, dEl в долях) */
  rotate(dAz: number, dEl: number) {
    // пользователь взялся вращать — прекращаем авто-заход камеры
    this.focusCenter = null;
    this.azimuth += dAz;
    this.elevation = Math.max(0.1, Math.min(0.9, this.elevation + dEl));
  }

  pick(): number | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.towers.values()], false);
    const tid = hits.length ? (hits[0].object.userData.towerId as number) : null;
    return tid;
  }

  click() {
    const tid = this.pick();
    this.selected = tid;
    this.onPick(tid);
  }

  setSelected(tid: number | null) {
    this.selected = tid;
  }

  /** экранная позиция якоря башни для HTML-лейблов */
  anchorScreen(a: TowerAnchor, w: number, h: number) {
    const v = new THREE.Vector3(a.x, a.y, a.z).project(this.camera);
    return {
      x: ((v.x + 1) / 2) * w,
      y: ((1 - v.y) / 2) * h,
      visible: v.z < 1,
    };
  }

  private animate = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);

    if (this.autoRotate) this.azimuth += this.autoRotate;

    // плавный заход/возврат камеры (fly-to): тянем центр и удаление к цели
    if (this.focusCenter) {
      this.center.lerp(this.focusCenter, 0.07);
      this.elevation += (this.focusElevation - this.elevation) * 0.07;
      if (
        this.center.distanceToSquared(this.focusCenter) < 4 &&
        Math.abs(this.elevation - this.focusElevation) < 0.005
      ) {
        // доехали — для возврата к общему обзору отпускаем цель
        if (this.focusCenter.equals(this.defaultCenter)) this.focusCenter = null;
      }
    }

    const radius = 350 + this.elevation * 900; // 350..1250
    const height = 120 + this.elevation * 700; // 120..820
    const time = performance.now() / 1000;
    const breathe = Math.sin(time * 0.4) * 8;
    this.camera.position.set(
      this.center.x + Math.sin(this.azimuth) * radius,
      height + breathe,
      this.center.z + Math.cos(this.azimuth) * radius,
    );
    this.camera.lookAt(this.center);

    // hover-подсветка; курсор меняем ТОЛЬКО на канвасе (не на всём body),
    // иначе pointer «залипает» на всей странице
    const hoverId = this.pick();
    if (hoverId !== this.hovered) {
      this.hovered = hoverId;
      this.renderer.domElement.style.cursor = hoverId ? "pointer" : "";
      this.onHover(hoverId);
    }
    const pulse = 0.42 + Math.sin(time * 2.4) * 0.13; // мягкое «дыхание» подсветки
    for (const [tid, mesh] of this.towers) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const active = tid === this.selected || tid === this.hovered;
      const lit = this.highlighted.has(tid);
      const empty = this.emptyTowers.has(tid) && !active && !lit;
      const target = active ? 0.6 : lit ? pulse : empty ? 0.03 : 0.13;
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * 0.15;
    }

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    document.body.style.cursor = "";
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
        o.geometry.dispose();
        const m = o.material as THREE.Material | THREE.Material[];
        (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
      }
    });
    this.renderer.dispose();
  }
}
