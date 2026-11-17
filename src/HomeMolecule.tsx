import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { presets } from "./chemistry";
export default function HomeMolecule() {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0.2, 8.5);
    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xc4d4ff, 2));
    const light = new THREE.DirectionalLight(0xbda4ff, 4);
    light.position.set(3, 4, 5);
    scene.add(light);
    const model = presets.ethene.model;
    model.atoms.forEach((a) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(a.element === "C" ? 0.37 : 0.22, 20, 16),
        new THREE.MeshStandardMaterial({
          color: a.element === "C" ? "#8d6de2" : "#cadfeb",
          roughness: 0.22,
          metalness: 0.3,
        }),
      );
      mesh.position.set(a.x, a.y, a.z);
      group.add(mesh);
    });
    model.bonds.forEach((b) => {
      const a = model.atoms[b.a],
        c = model.atoms[b.b],
        start = new THREE.Vector3(a.x, a.y, a.z),
        end = new THREE.Vector3(c.x, c.y, c.z),
        dir = end.clone().sub(start);
      for (let j = 0; j < b.order; j++) {
        const m = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, dir.length(), 10),
          new THREE.MeshStandardMaterial({
            color: "#9d9cc3",
            metalness: 0.6,
            roughness: 0.3,
          }),
        );
        m.position.copy(start.clone().add(end).multiplyScalar(0.5));
        m.position.z += (j - (b.order - 1) / 2) * 0.25;
        m.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize(),
        );
        group.add(m);
      }
    });
    group.rotation.set(0.25, 0.4, -0.25);
    const resize = () => {
      const w = el.clientWidth || 400,
        h = el.clientHeight || 360;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const obs = new ResizeObserver(resize);
    obs.observe(el);
    resize();
    let frame = 0;
    const loop = (t: number) => {
      frame = requestAnimationFrame(loop);
      if (document.hidden) return;
      group.rotation.y = 0.4 + Math.sin(t * 0.00015) * 0.4;
      group.position.y = Math.sin(t * 0.0005) * 0.12;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return failed ? (
    <svg viewBox="0 0 500 350" role="img" aria-label="نموذج مبسط للإيثين">
      <g stroke="#9aa8cf" strokeWidth="9">
        <path d="M180 165h140m-140 20h140M180 175l-65 -70m65 70l-65 70m205 -70l65 -70m-65 70l65 70" />
      </g>
      {[
        [180, 175, 36],
        [320, 175, 36],
        [115, 105, 23],
        [115, 245, 23],
        [385, 105, 23],
        [385, 245, 23],
      ].map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill={i < 2 ? "#9377de" : "#c1d3e4"}
        />
      ))}
    </svg>
  ) : (
    <div
      className="home-molecule-canvas"
      ref={host}
      role="img"
      aria-label="نموذج ثلاثي الأبعاد متحرك ببطء للإيثين، تمثيل تعليمي"
    />
  );
}
