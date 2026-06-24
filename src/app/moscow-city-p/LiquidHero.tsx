"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

/**
 * Фирменный «текучий» 3D-герой в духе sui.io: морфящаяся стеклянно-неоновая
 * сфера со свечением (bloom) и параллаксом за курсором. Рендер на чистом
 * three.js (уже в зависимостях). Уважает prefers-reduced-motion: рисует один
 * статичный кадр без rAF.
 */
export function LiquidHero() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let width = mount.clientWidth || 1;
    let height = mount.clientHeight || 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    // Морфящаяся сфера: фреснель-материал, синий→аква, без зависимости от света.
    const uniforms = {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x04122e) },
      uBlue: { value: new THREE.Color(0x4da2ff) },
      uAqua: { value: new THREE.Color(0x8be0ff) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vDisp;

        // компактный «текучий» псевдошум на синусах
        float flow(vec3 p, float t){
          float v = 0.0;
          v += 0.55 * sin(p.x * 2.2 + t * 1.05);
          v += 0.45 * sin(p.y * 2.7 - t * 0.92);
          v += 0.40 * sin(p.z * 2.4 + t * 1.18);
          v += 0.28 * sin((p.x + p.y) * 3.1 + t * 0.7);
          v += 0.22 * sin((p.y + p.z) * 3.6 - t * 0.83);
          return v;
        }

        void main(){
          float t = uTime;
          float d = flow(position, t);
          vDisp = d;
          vec3 displaced = position + normal * d * 0.28;
          vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uDeep;
        uniform vec3 uBlue;
        uniform vec3 uAqua;
        varying vec3 vNormal;
        varying vec3 vView;
        varying float vDisp;

        void main(){
          float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.3);
          vec3 col = mix(uDeep, uBlue, fres);
          col = mix(col, uAqua, pow(fres, 2.6));
          // лёгкие «прожилки» от деформации + дыхание яркости
          col += uAqua * 0.10 * smoothstep(0.4, 1.2, vDisp);
          col += uBlue * 0.06 * (0.5 + 0.5 * sin(uTime * 0.8));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const geometry = new THREE.IcosahedronGeometry(1.5, 80);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Тонкая «оболочка»-каркас вокруг — добавляет глубины
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.72, 6),
      new THREE.MeshBasicMaterial({
        color: 0x4da2ff,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      }),
    );
    scene.add(wire);

    // Постобработка: bloom для неонового свечения
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.9, // strength
      0.85, // radius
      0.2, // threshold
    );
    composer.addPass(bloom);
    composer.setSize(width, height);

    // Параллакс за курсором
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointer);

    const clock = new THREE.Clock();
    let raf = 0;

    const renderFrame = () => {
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      cur.x += (target.x - cur.x) * 0.05;
      cur.y += (target.y - cur.y) * 0.05;
      mesh.rotation.y = t * 0.12 + cur.x * 0.4;
      mesh.rotation.x = cur.y * 0.3;
      wire.rotation.y = -t * 0.08;
      wire.rotation.z = t * 0.04;
      camera.position.x = cur.x * 0.3;
      camera.position.y = -cur.y * 0.3;
      camera.lookAt(0, 0, 0);
      composer.render();
    };

    const loop = () => {
      renderFrame();
      raf = requestAnimationFrame(loop);
    };

    if (reduce) {
      uniforms.uTime.value = 1.2;
      renderFrame();
    } else {
      loop();
    }

    const onResize = () => {
      width = mount.clientWidth || 1;
      height = mount.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
      bloom.setSize(width, height);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      geometry.dispose();
      material.dispose();
      wire.geometry.dispose();
      (wire.material as THREE.Material).dispose();
      composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="mcp-canvas" aria-hidden />;
}
