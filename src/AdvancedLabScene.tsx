import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import "./advanced-lab-scene.css";

export type AdvancedLabSceneProps = {
  tools: string[];
  selectedTool: string | null;
  onSelectTool: (id: string) => void;
  running: boolean;
  progress: number;
  color: string;
  reducedMotion: boolean;
  onFail: () => void;
  filled?: boolean;
  vesselId?: string | null;
};
const toolNames: Record<string, string> = {
  beaker: "كأس",
  flask: "دورق",
  tube: "أنبوب اختبار",
  pipette: "ماصة",
  balance: "ميزان تعليمي",
  heater: "سخان تعليمي",
  cylinder: "مخبار مدرّج",
};
const positions: Record<string, [number, number]> = {
  beaker: [-0.8, 0.8],
  flask: [0.5, 0.5],
  tube: [1.7, 0.8],
  pipette: [2.7, 0.7],
  balance: [-2.5, 0.5],
  heater: [-0.2, -0.7],
  cylinder: [2, -0.7],
};
type ViewControl = {
  reset: () => void;
  zoom: (factor: number) => void;
  focus: (area: "bench" | "shelf") => void;
};
/** Geometry is illustrative laboratory equipment, not a source of experimental measurements. */
export default function AdvancedLabScene(props: AdvancedLabSceneProps) {
  const host = useRef<HTMLDivElement>(null),
    current = useRef(props),
    view = useRef<ViewControl | null>(null);
  current.current = props;
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const container = el;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: window.innerWidth > 650,
        alpha: false,
        powerPreference: "low-power",
      });
    } catch {
      current.current.onFail();
      return;
    }
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        window.innerWidth < 700 ? 1.25 : 1.7,
      ),
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.domElement.setAttribute(
      "aria-label",
      "مشهد المختبر ثلاثي الأبعاد. استخدم أدوات التحكم والأزرار خارج المشهد لاختيار الأجهزة بلوحة المفاتيح.",
    );
    renderer.domElement.style.touchAction = "none";
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#081525");
    scene.fog = new THREE.Fog("#081525", 13, 30);
    // A small procedural reflection map is generated once on larger displays only.
    // Phones retain the cheaper direct lighting; no HDR file or network asset is needed.
    let environment: THREE.WebGLRenderTarget | undefined;
    if (window.innerWidth >= 850) {
      let pmrem: THREE.PMREMGenerator | undefined,
        room: RoomEnvironment | undefined;
      try {
        pmrem = new THREE.PMREMGenerator(renderer);
        room = new RoomEnvironment();
        environment = pmrem.fromScene(room, 0.06, 0.1, 30, { size: 128 });
        scene.environment = environment.texture;
        scene.environmentIntensity = 0.45;
      } catch {
        environment?.dispose();
        environment = undefined;
        renderer.setRenderTarget(null);
      } finally {
        room?.dispose();
        pmrem?.dispose();
      }
    }
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 60);
    const initial = new THREE.Vector3(7.6, 6.4, 9.5);
    camera.position.copy(initial);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 0);
    controls.minDistance = 4;
    controls.maxDistance = 17;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minPolarAngle = 0.2;
    controls.enablePan = true;
    controls.panSpeed = 0.55;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.65;
    let dirty = true;
    const markDirty = () => {
      dirty = true;
    };
    controls.addEventListener("change", markDirty);
    view.current = {
      reset: () => {
        camera.position.copy(initial);
        controls.target.set(0, 2, 0);
        controls.update();
        dirty = true;
      },
      zoom: (factor) => {
        camera.position
          .sub(controls.target)
          .multiplyScalar(factor)
          .clampLength(4, 17)
          .add(controls.target);
        controls.update();
        dirty = true;
      },
      focus: (area) => {
        if (area === "bench") {
          camera.position.set(3.6, 5.5, 6);
          controls.target.set(0, 2.25, 0.25);
        } else {
          camera.position.set(3.5, 4.6, 3);
          controls.target.set(0, 3.1, -3.1);
        }
        controls.update();
        dirty = true;
      },
    };
    const materials: THREE.Material[] = [],
      textures: THREE.Texture[] = [];
    const material = (
      color: string,
      options: THREE.MeshStandardMaterialParameters = {},
    ) => {
      const m = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.45,
        ...options,
      });
      materials.push(m);
      return m;
    };
    const charcoal = material("#142c3b", { metalness: 0.35 }),
      steel = material("#a3bbca", { metalness: 0.75, roughness: 0.25 }),
      wood = material("#32485b"),
      white = material("#dbe5ed"),
      black = material("#07101c"),
      cyan = material("#52d6e8", {
        emissive: "#1ba9c0",
        emissiveIntensity: 0.65,
      });
    const glass = material("#d5f5ff", {
      transparent: true,
      opacity: 0.21,
      metalness: 0.1,
      roughness: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const liquid = material(current.current.color, {
      transparent: true,
      opacity: 0.58,
      roughness: 0.2,
      metalness: 0.08,
      depthWrite: false,
    });
    const make = (
      geometry: THREE.BufferGeometry,
      mat: THREE.Material,
      parent: THREE.Object3D,
      x = 0,
      y = 0,
      z = 0,
    ) => {
      const m = new THREE.Mesh(geometry, mat);
      m.position.set(x, y, z);
      m.castShadow = mat !== glass;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const box = (
      parent: THREE.Object3D,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      mat = charcoal,
    ) => make(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);
    const cylinder = (
      parent: THREE.Object3D,
      top: number,
      bottom: number,
      height: number,
      x: number,
      y: number,
      z: number,
      mat = steel,
      open = false,
    ) =>
      make(
        new THREE.CylinderGeometry(top, bottom, height, 20, 1, open),
        mat,
        parent,
        x,
        y,
        z,
      );
    function label(text: string, width = 1.4, height = 0.4) {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#092338";
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = "#5ce2ed";
      ctx.lineWidth = 5;
      ctx.strokeRect(4, 4, 504, 120);
      ctx.fillStyle = "#d9f9ff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "38px Tahoma, sans-serif";
      ctx.direction = "rtl";
      ctx.fillText(text, 256, 68);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      materials.push(mat);
      return new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    }
    scene.add(new THREE.HemisphereLight("#d5efff", "#0c1c32", 2.1));
    const key = new THREE.DirectionalLight("#dceeff", 3);
    key.position.set(3, 9, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -7;
    key.shadow.camera.right = 7;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -7;
    key.shadow.bias = -0.001;
    scene.add(key);
    const fill = new THREE.PointLight("#70b5ff", 17, 18);
    fill.position.set(-4, 4, -2);
    scene.add(fill);
    const accent = new THREE.PointLight("#b995ff", 10, 12);
    accent.position.set(4, 4, -3);
    scene.add(accent);
    box(
      scene,
      18,
      0.15,
      14,
      0,
      -0.1,
      0,
      material("#132537", { metalness: 0.2, roughness: 0.6 }),
    );
    box(scene, 16, 7, 0.15, 0, 3.4, -4.3, wood);
    // Back wall cabinets, shelves and strip lights give depth without textures or external assets.
    for (const x of [-5, -2, 1, 4]) {
      box(
        scene,
        2.6,
        2,
        0.5,
        x,
        4.6,
        -4,
        material("#1b354c", { metalness: 0.2 }),
      );
      box(scene, 1.12, 1.76, 0.04, x - 0.59, 4.6, -3.72, glass);
      box(scene, 1.12, 1.76, 0.04, x + 0.59, 4.6, -3.72, glass);
      box(scene, 0.04, 0.34, 0.04, x - 0.12, 4.6, -3.67, steel);
      box(scene, 2.7, 0.05, 0.15, x, 3.52, -3.5, cyan);
    }
    box(scene, 9.3, 0.12, 0.85, 0, 2.8, -3.15, wood);
    box(scene, 9.3, 0.12, 0.85, 0, 1.8, -3.15, wood);
    for (let i = 0; i < 10; i++) {
      const x = -4.1 + i * 0.91;
      const bottleMat = material(["#638f92", "#868aaf", "#448aac"][i % 3], {
        transparent: true,
        opacity: 0.8,
        roughness: 0.25,
      });
      cylinder(scene, 0.13, 0.16, 0.39, x, 1.99, -3.13, bottleMat);
      cylinder(scene, 0.11, 0.11, 0.1, x, 2.23, -3.13, white);
      const b = label(i % 2 ? "عينة افتراضية" : "كاشف", 0.24, 0.1);
      if (b) {
        b.position.set(x, 2.01, -2.95);
        scene.add(b);
      }
    }
    const wallLabel = label("ORGANIC CHEMISTRY UNIVERSE", 4.8, 0.65);
    if (wallLabel) {
      wallLabel.position.set(0, 6.12, -4.19);
      scene.add(wallLabel);
    }
    box(
      scene,
      8.8,
      0.19,
      3.8,
      0,
      1.85,
      0.1,
      material("#7b94a1", { metalness: 0.45, roughness: 0.24 }),
    );
    box(
      scene,
      8.55,
      0.12,
      3.6,
      0,
      1.99,
      0.1,
      material("#1b3441", { metalness: 0.2, roughness: 0.2 }),
    );
    for (const x of [-3.6, 3.6])
      for (const z of [-1.2, 1.3])
        box(scene, 0.18, 1.8, 0.18, x, 0.9, z, steel);
    box(scene, 6.5, 1.5, 0.25, 0, 0.95, -1.4, wood);
    // A fixed rack with clear tubes, with all movable equipment represented separately.
    const rack = new THREE.Group();
    rack.position.set(-2.8, 2.04, -0.85);
    scene.add(rack);
    box(rack, 1.2, 0.1, 0.48, 0, 0.05, 0, wood);
    for (const x of [-0.5, 0.5]) box(rack, 0.05, 0.65, 0.4, x, 0.35, 0, steel);
    box(rack, 1.2, 0.08, 0.42, 0, 0.55, 0, wood);
    for (let i = 0; i < 4; i++) {
      cylinder(
        rack,
        0.075,
        0.075,
        0.68,
        -0.38 + i * 0.25,
        0.42,
        0,
        glass,
        true,
      );
      make(
        new THREE.SphereGeometry(0.075, 12, 8),
        glass,
        rack,
        -0.38 + i * 0.25,
        0.08,
        0,
      );
    }
    const toolGroups = new Map<string, THREE.Group>(),
      selectionRings: THREE.Mesh[] = [],
      liquids: { mesh: THREE.Mesh; base: number; maxHeight: number }[] = [];
    function ring(parent: THREE.Group) {
      const r = make(
        new THREE.TorusGeometry(0.43, 0.025, 8, 30),
        cyan,
        parent,
        0,
        0.02,
        0,
      );
      r.rotation.x = -Math.PI / 2;
      r.visible = false;
      selectionRings.push(r);
    }
    function vessel(
      group: THREE.Group,
      radius: number,
      height: number,
      conical = false,
    ) {
      cylinder(
        group,
        conical ? 0.15 : radius,
        radius,
        height,
        0,
        height / 2,
        0,
        glass,
        true,
      );
      cylinder(group, radius, radius, 0.025, 0, 0.015, 0, glass);
      const rim = make(
        new THREE.TorusGeometry(conical ? 0.15 : radius, 0.017, 6, 24),
        glass,
        group,
        0,
        height,
        0,
      );
      rim.rotation.x = Math.PI / 2;
      const l = cylinder(
        group,
        conical ? radius * 0.7 : radius * 0.92,
        radius * 0.92,
        height * 0.45,
        0,
        height * 0.225 + 0.03,
        0,
        liquid,
      );
      liquids.push({ mesh: l, base: 0.03, maxHeight: height * 0.45 });
      for (let i = 1; i < 4 && !conical; i++)
        box(
          group,
          0.07,
          0.009,
          0.014,
          radius - 0.008,
          (height * i) / 4,
          radius * 0.15,
          white,
        );
    }
    for (const id of Object.keys(toolNames)) {
      const g = new THREE.Group();
      g.userData.toolId = id;
      scene.add(g);
      toolGroups.set(id, g);
      ring(g);
      if (id === "beaker") vessel(g, 0.3, 0.65);
      if (id === "flask") {
        vessel(g, 0.36, 0.58, true);
        cylinder(g, 0.14, 0.14, 0.24, 0, 0.7, 0, glass, true);
      }
      if (id === "tube") {
        vessel(g, 0.095, 0.77);
        make(new THREE.SphereGeometry(0.095, 12, 8), glass, g, 0, 0.03, 0);
      }
      if (id === "pipette") {
        const p = cylinder(g, 0.035, 0.022, 0.8, 0, 0.44, 0, glass);
        p.rotation.z = 0.25;
        make(
          new THREE.SphereGeometry(0.095, 12, 8),
          material("#987bd5"),
          g,
          -0.1,
          0.84,
          0,
        );
      }
      if (id === "cylinder") {
        vessel(g, 0.13, 0.95);
        cylinder(g, 0.24, 0.24, 0.05, 0, 0.025, 0, steel);
      }
      if (id === "heater") {
        box(g, 0.75, 0.16, 0.65, 0, 0.1, 0, white);
        cylinder(g, 0.27, 0.27, 0.035, 0, 0.2, 0, black);
        const m = material("#ff8e64", {
          emissive: "#d84b28",
          emissiveIntensity: 0.2,
        });
        const coil = make(
          new THREE.TorusGeometry(0.2, 0.018, 8, 24),
          m,
          g,
          0,
          0.224,
          0,
        );
        coil.rotation.x = Math.PI / 2;
        g.userData.coil = m;
        box(g, 0.07, 0.045, 0.03, 0.2, 0.12, 0.34, cyan);
      }
      if (id === "balance") {
        box(g, 0.8, 0.17, 0.65, 0, 0.12, 0, white);
        cylinder(g, 0.28, 0.28, 0.035, 0, 0.225, -0.08, steel);
        const display = label("تعليمي", 0.42, 0.13);
        if (display) {
          display.position.set(0, 0.14, 0.334);
          g.add(display);
        }
      }
      const tag = label(toolNames[id], 0.68, 0.19);
      if (tag) {
        tag.position.set(0, 1.12, 0);
        g.add(tag);
        tag.userData.billboard = true;
      }
    }
    const particles: THREE.Mesh[] = [];
    const particleMat = material("#b9e8ff", {
      transparent: true,
      opacity: 0.32,
      roughness: 0.1,
    });
    for (let i = 0; i < 12; i++) {
      const p = make(
        new THREE.SphereGeometry(0.018 + (i % 3) * 0.008, 8, 6),
        particleMat,
        scene,
      );
      p.visible = false;
      particles.push(p);
    }
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let downX = 0,
      downY = 0,
      downTime = 0,
      multiTouch = false;
    const activePointers = new Set<number>();
    const down = (e: PointerEvent) => {
      activePointers.add(e.pointerId);
      if (activePointers.size > 1) multiTouch = true;
      else multiTouch = false;
      downX = e.clientX;
      downY = e.clientY;
      downTime = performance.now();
    };
    const cancel = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
    };
    const up = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (
        multiTouch ||
        Math.hypot(e.clientX - downX, e.clientY - downY) > 6 ||
        performance.now() - downTime > 650
      )
        return;
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...toolGroups.values()], true);
      if (!hits.length) return;
      let item: THREE.Object3D | null = hits[0].object;
      while (item && !item.userData.toolId) item = item.parent;
      if (item?.userData.toolId)
        current.current.onSelectTool(item.userData.toolId);
    };
    const lost = (e: Event) => {
      e.preventDefault();
      current.current.onFail();
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", cancel);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    function resize() {
      const w = container.clientWidth || 700,
        h = container.clientHeight || 440;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty = true;
    }
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    let frame = 0,
      lastProps = "",
      lastRunning = false;
    function animate(now: number) {
      frame = requestAnimationFrame(animate);
      const p = current.current;
      const signature = JSON.stringify([
        p.tools,
        p.selectedTool,
        p.progress,
        p.color,
        p.reducedMotion,
        p.filled,
        p.vesselId,
      ]);
      if (signature !== lastProps) {
        lastProps = signature;
        dirty = true;
        liquid.color.set(p.color);
        liquids.forEach(({ mesh, base, maxHeight }) => {
          const toolId = mesh.parent?.userData.toolId as string | undefined;
          mesh.visible = Boolean(
            p.filled &&
              toolId &&
              p.vesselId === toolId &&
              p.tools.includes(toolId),
          );
          mesh.scale.y = 0.72;
          mesh.position.y = base + maxHeight * 0.5 * mesh.scale.y;
        });
        let shelfIndex = 0;
        for (const [id, g] of toolGroups) {
          const atBench = p.tools.includes(id);
          const position = positions[id];
          g.position.set(
            atBench ? position[0] : -3.6 + shelfIndex++ * 1.2,
            atBench ? 2.06 : 2.88,
            atBench ? position[1] : -3.1,
          );
          g.scale.setScalar(atBench ? 1 : 0.8);
          g.children[0].visible = p.selectedTool === id;
          g.traverse((o) => {
            if (o.userData.billboard) o.quaternion.copy(camera.quaternion);
          });
        }
        controls.enableDamping = !p.reducedMotion;
      }
      if (lastRunning !== p.running) {
        lastRunning = p.running;
        dirty = true;
      }
      controls.update();
      if (p.running && !p.reducedMotion) {
        dirty = true;
        const vessel = p.vesselId || "beaker",
          g = toolGroups.get(vessel) || toolGroups.get("beaker")!;
        const radius =
          vessel === "tube" ? 0.045 : vessel === "cylinder" ? 0.065 : 0.17;
        const height =
          (vessel === "tube"
            ? 0.77
            : vessel === "cylinder"
              ? 0.95
              : vessel === "flask"
                ? 0.58
                : 0.65) *
          0.45 *
          0.72;
        particles.forEach((particle, i) => {
          particle.visible = Boolean(
            p.filled && p.vesselId && p.tools.includes(p.vesselId),
          );
          particle.scale.setScalar(vessel === "tube" ? 0.45 : 0.7);
          particle.position.set(
            g.position.x + Math.sin(i * 2.4) * radius,
            g.position.y +
              0.04 +
              ((now * 0.00025 + i * 0.077) % 1) * (height - 0.05),
            g.position.z + Math.cos(i * 2.4) * radius,
          );
        });
      } else
        particles.forEach((particle) => {
          particle.visible = false;
        });
      const heater = toolGroups.get("heater")!;
      const coil = heater.userData.coil as THREE.MeshStandardMaterial;
      coil.emissiveIntensity =
        p.running && p.tools.includes("heater") ? 0.85 : 0.15;
      for (const g of toolGroups.values())
        g.traverse((o) => {
          if (o.userData.billboard) o.quaternion.copy(camera.quaternion);
        });
      if (dirty && !document.hidden) {
        renderer.render(scene, camera);
        dirty = false;
      }
    }
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.removeEventListener("change", markDirty);
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", cancel);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      const geometries = new Set<THREE.BufferGeometry>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) geometries.add(o.geometry);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      scene.environment = null;
      environment?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      view.current = null;
    };
  }, []);
  return (
    <div className="advanced-lab-viewport">
      <div ref={host} className="advanced-lab-canvas" />
      <div className="lab-scene-caption">
        <strong>ORGANIC LAB / 03</strong>
        <span>
          اسحب لتدوير الكاميرا · قرّب بإصبعين أو بعجلة الفأرة · اضغط أداة
          لاختيارها
        </span>
      </div>
      <div className="lab-camera-buttons" aria-label="أدوات الكاميرا">
        <button
          type="button"
          aria-label="تقريب كاميرا المختبر"
          onClick={() => view.current?.zoom(0.85)}
        >
          ＋
        </button>
        <button
          type="button"
          aria-label="إبعاد كاميرا المختبر"
          onClick={() => view.current?.zoom(1.15)}
        >
          −
        </button>
        <button type="button" onClick={() => view.current?.focus("bench")}>
          طاولة العمل
        </button>
        <button type="button" onClick={() => view.current?.focus("shelf")}>
          خزانة الأدوات
        </button>
        <button type="button" onClick={() => view.current?.reset()}>
          إعادة الكاميرا
        </button>
      </div>
      <small className="lab-scene-footnote">
        أدوات افتراضية؛ تدريجات وميزان توضيحيان. حركة الجسيمات تمثل المزج ولا
        تثبت انطلاق غاز.
      </small>
    </div>
  );
}
