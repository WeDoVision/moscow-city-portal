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

const INK = new THREE.Color("#14161d");
const INK_DARK = new THREE.Color("#0e1015");
const GOLD = new THREE.Color("#c9a96e");
const GOLD_DIM = new THREE.Color("#6e5c39");

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

  constructor(
    canvas: HTMLCanvasElement,
    buildings: CityBuilding[],
    private onPick: (towerId: number | null) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera = new THREE.PerspectiveCamera(58, 1, 10, 6000);
    this.scene.fog = new THREE.Fog(0x0b0d12, 900, 3200);

    // свет: лунный холодный + тёплый контровой «закат за башнями»
    this.scene.add(new THREE.AmbientLight(0x404a5c, 1.1));
    const moon = new THREE.DirectionalLight(0xbfd0e8, 1.4);
    moon.position.set(-600, 900, -400);
    this.scene.add(moon);
    const warm = new THREE.DirectionalLight(0xc9a96e, 0.8);
    warm.position.set(500, 300, 700);
    this.scene.add(warm);

    // земля
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2600, 64),
      new THREE.MeshLambertMaterial({ color: INK_DARK }),
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
      color: INK,
      transparent: true,
      opacity: 0.92,
    });
    const city = new THREE.Mesh(mergeGeometries(cityGeos, false), cityMat);
    this.scene.add(city);

    for (const [tid, geos] of towerGeos) {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#232838"),
        metalness: 0.85,
        roughness: 0.35,
        emissive: GOLD_DIM,
        emissiveIntensity: 0.12,
      });
      const mesh = new THREE.Mesh(mergeGeometries(geos, false), mat);
      mesh.userData.towerId = tid;
      this.scene.add(mesh);
      this.towers.set(tid, mesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry, 30),
        new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.35 }),
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
    }
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setPointer(xNdc: number, yNdc: number) {
    this.pointer.set(xNdc, yNdc);
  }

  /** обновить угол камеры от драга (dAz в радианах, dEl в долях) */
  rotate(dAz: number, dEl: number) {
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

    // hover-подсветка
    const hoverId = this.pick();
    if (hoverId !== this.hovered) {
      this.hovered = hoverId;
      document.body.style.cursor = hoverId ? "pointer" : "";
    }
    for (const [tid, mesh] of this.towers) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const active = tid === this.selected || tid === this.hovered;
      const target = active ? 0.55 : 0.12;
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
