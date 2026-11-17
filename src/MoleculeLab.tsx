import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  bondSum,
  copyModel,
  formula,
  identify,
  issues,
  presets,
  valence,
  functionalGroups,
  structuralFormula,
  geometryInfo,
  compareIsomers,
  isomorphic,
  type Element,
  type Molecule,
} from "./chemistry";
export const elementColors: Record<Element, string> = {
  C: "#38bdf8",
  H: "#e2e8f0",
  O: "#fb7185",
  N: "#9b86ff",
  F: "#a7f3d0",
  Cl: "#4ade80",
  Br: "#b86f41",
  I: "#c084fc",
};
const colors = elementColors;
function Scene({
  model,
  select,
  onSelect,
  rotate,
  distance,
  onFail,
}: {
  model: Molecule;
  select: number[];
  onSelect: (id: number) => void;
  rotate: boolean;
  distance: number;
  onFail: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    selection = useRef(onSelect);
  selection.current = onSelect;
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      onFail();
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
    camera.position.z = distance;
    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 1.7));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(4, 6, 7);
    scene.add(light);
    const center = new THREE.Vector3();
    model.atoms.forEach((a) => center.add(new THREE.Vector3(a.x, a.y, a.z)));
    if (model.atoms.length) center.divideScalar(model.atoms.length);
    const atomMeshes: THREE.Mesh[] = [];
    model.atoms.forEach((a) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(a.element === "H" ? 0.2 : 0.32, 24, 16),
        new THREE.MeshStandardMaterial({
          color: select.includes(a.id) ? "#fbbf24" : colors[a.element],
          metalness: 0.25,
          roughness: 0.2,
        }),
      );
      mesh.position.set(a.x - center.x, a.y - center.y, a.z - center.z);
      mesh.userData.id = a.id;
      group.add(mesh);
      atomMeshes.push(mesh);
    });
    model.bonds.forEach((b) => {
      const a = model.atoms.find((a) => a.id === b.a),
        c = model.atoms.find((a) => a.id === b.b);
      if (!a || !c) return;
      const start = new THREE.Vector3(
          a.x - center.x,
          a.y - center.y,
          a.z - center.z,
        ),
        end = new THREE.Vector3(c.x - center.x, c.y - center.y, c.z - center.z),
        dir = end.clone().sub(start);
      let side = new THREE.Vector3().crossVectors(
        dir,
        new THREE.Vector3(0, 0, 1),
      );
      if (side.length() < 0.01) side = new THREE.Vector3(1, 0, 0);
      side.normalize();
      for (let i = 0; i < b.order; i++) {
        const mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, dir.length(), 12),
          new THREE.MeshStandardMaterial({ color: "#94a3b8" }),
        );
        mesh.position.copy(
          start
            .clone()
            .add(end)
            .multiplyScalar(0.5)
            .addScaledVector(side, (i - (b.order - 1) / 2) * 0.15),
        );
        mesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize(),
        );
        group.add(mesh);
      }
    });
    const ray = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let dragging = false,
      moved = false,
      lastX = 0,
      lastY = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      moved = false;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX,
        dy = e.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      group.rotation.y += dx * 0.01;
      group.rotation.x += dy * 0.01;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.render(scene, camera);
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      if (moved) return;
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(atomMeshes)[0];
      if (hit) selection.current(hit.object.userData.id);
    };
    let fitDistance = distance;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(
        camera.position.z + (e.deltaY * 0.008 * fitDistance) / 9,
        fitDistance / 3,
        fitDistance * 2.5,
      );
      renderer.render(scene, camera);
    };
    const cancel = () => {
      dragging = false;
      moved = true;
    };
    const contextLost = (e: Event) => {
      e.preventDefault();
      onFail();
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    renderer.domElement.addEventListener("pointercancel", cancel);
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("wheel", wheel, { passive: false });
    const resize = () => {
      const w = el.clientWidth || 500,
        h = 380;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      const size = new THREE.Box3()
        .setFromObject(group)
        .getSize(new THREE.Vector3());
      fitDistance = Math.max(
        5,
        (Math.max(size.y, size.x / camera.aspect) /
          (2 * Math.tan(THREE.MathUtils.degToRad(42) / 2))) *
          1.3 +
          size.z / 2,
      );
      camera.position.z = (distance / 9) * fitDistance;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const obs = new ResizeObserver(resize);
    obs.observe(el);
    resize();
    let frame = 0;
    const loop = () => {
      if (rotate) {
        frame = requestAnimationFrame(loop);
        group.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    loop();
    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener("pointercancel", cancel);
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("wheel", wheel);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [model, select, rotate, distance, onFail]);
  return (
    <div
      ref={host}
      aria-label="نموذج جزيئي ثلاثي الأبعاد؛ اسحب للتدوير واستخدم العجلة للتكبير"
      style={{ height: 380, touchAction: "none" }}
    />
  );
}
function FlatMolecule({
  model,
  highlightIds = [],
  onSelect,
}: {
  model: Molecule;
  highlightIds?: number[];
  onSelect?: (id: number) => void;
}) {
  const xs = model.atoms.map((a) => a.x),
    ys = model.atoms.map((a) => a.y);
  const minX = Math.min(-2, ...xs) - 0.7,
    minY = Math.min(-2, ...ys) - 0.7,
    w = Math.max(2, ...xs) - minX + 0.7,
    h = Math.max(2, ...ys) - minY + 0.7;
  return (
    <svg
      viewBox={`${minX} ${minY} ${w} ${h}`}
      style={{ width: "100%", height: 380 }}
      role="img"
      aria-label="بديل ثنائي الأبعاد للجزيء"
    >
      {model.bonds.map((b, i) => {
        const a = model.atoms.find((x) => x.id === b.a),
          c = model.atoms.find((x) => x.id === b.b);
        if (!a || !c) return null;
        return Array.from({ length: b.order }, (_, j) => (
          <line
            key={`${i}-${j}`}
            x1={a.x}
            y1={a.y + (j - (b.order - 1) / 2) * 0.13}
            x2={c.x}
            y2={c.y + (j - (b.order - 1) / 2) * 0.13}
            stroke="#94a3b8"
            strokeWidth=".06"
          />
        ));
      })}
      {model.atoms.map((a) => (
        <g
          key={a.id}
          onClick={() => onSelect?.(a.id)}
          style={{ cursor: onSelect ? "pointer" : "default" }}
        >
          <circle
            cx={a.x}
            cy={a.y}
            r={a.element === "H" ? 0.17 : 0.26}
            fill={highlightIds.includes(a.id) ? "#fbbf24" : colors[a.element]}
          />
          <text
            x={a.x}
            y={a.y + 0.06}
            textAnchor="middle"
            fontSize=".16"
            fill="#00111f"
          >
            {a.element}
          </text>
        </g>
      ))}
    </svg>
  );
}
const noSelect = () => {};
const emptyIds: number[] = [];
export function MolecularView({
  model,
  allowMotion = true,
  highlightIds = emptyIds,
}: {
  model: Molecule;
  allowMotion?: boolean;
  highlightIds?: number[];
}) {
  const [fallback, setFallback] = useState(false),
    [distance, setDistance] = useState(9),
    [rotate, setRotate] = useState(false);
  const fail = useRef(() => setFallback(true)).current;
  return (
    <div>
      <div
        style={{
          background: "radial-gradient(ellipse,#102b4a,#080e22)",
          border: "1px solid #29405f",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {fallback ? (
          <FlatMolecule model={model} highlightIds={highlightIds} />
        ) : (
          <Scene
            model={model}
            select={highlightIds}
            onSelect={noSelect}
            rotate={rotate && allowMotion}
            distance={distance}
            onFail={fail}
          />
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <button onClick={() => setFallback((v) => !v)}>
          {fallback ? "تجربة العرض ثلاثي الأبعاد" : "البديل ثنائي الأبعاد"}
        </button>
        <button disabled={!allowMotion} onClick={() => setRotate((v) => !v)}>
          {rotate ? "إيقاف الدوران" : "دوران تلقائي"}
        </button>
        <label>
          تكبير النموذج
          <input
            aria-label="تكبير النموذج"
            type="range"
            min="3"
            max="22"
            step=".5"
            value={distance}
            onChange={(e) => setDistance(+e.target.value)}
          />
        </label>
      </div>
      <small>
        الكرات والعصي تمثيل تعليمي تقريبي، وليست قياساً لحجم الذرات أو طاقة
        الجزيء.
      </small>
    </div>
  );
}
export default function MoleculeLab({
  allowMotion = true,
  onChallengeComplete,
}: {
  allowMotion?: boolean;
  onChallengeComplete?: () => void;
}) {
  const [model, setModel] = useState<Molecule>(() =>
      copyModel(presets.methane.model),
    ),
    [selected, setSelected] = useState<number[]>([]),
    [order, setOrder] = useState<1 | 2 | 3>(1),
    [fallback, setFallback] = useState(false),
    [rotate, setRotate] = useState(false),
    [distance, setDistance] = useState(9),
    [message, setMessage] = useState(""),
    [note, setNote] = useState(presets.methane.note),
    [highlight, setHighlight] = useState<number[]>([]),
    [compare, setCompare] = useState("dimethylEther"),
    [challenge, setChallenge] = useState(false),
    [manual, setManual] = useState(false),
    [challengeDone, setChallengeDone] = useState(false);
  const fail = useRef(() => setFallback(true)).current;
  const choose = (id: number) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s.slice(-1), id],
    );
  function connect() {
    if (selected.length !== 2) {
      setMessage("اختر ذرتين أولاً من الرسم أو قائمة الذرات.");
      return;
    }
    const [a, b] = selected;
    const existing = model.bonds.find(
      (x) => (x.a === a && x.b === b) || (x.a === b && x.b === a),
    );
    if (
      selected.some(
        (id) =>
          bondSum(model, id) - (existing?.order || 0) + order >
          valence[model.atoms.find((x) => x.id === id)!.element],
      )
    ) {
      setMessage(
        "لم تُضف الرابطة: سيؤدي ذلك إلى تجاوز التكافؤ المعتاد لإحدى الذرتين.",
      );
      return;
    }
    setModel((m) => ({
      ...m,
      bonds: [...m.bonds.filter((x) => x !== existing), { a, b, order }],
    }));
    setManual(true);
    setMessage("تم تحديث الرابطة.");
  }
  function add(element: Element) {
    if (model.atoms.length >= 64) {
      setMessage("حد العرض التعليمي 64 ذرة حفاظاً على الأداء.");
      return;
    }
    setModel((m) => {
      const id = Math.max(-1, ...m.atoms.map((a) => a.id)) + 1;
      return {
        ...m,
        atoms: [
          ...m.atoms,
          {
            id,
            element,
            x: Math.cos(id * 2.4) * (1 + id * 0.08),
            y: Math.sin(id * 2.4) * (1 + id * 0.08),
            z: 0,
          },
        ],
      };
    });
    setManual(true);
    setNote(
      "بناء حر بإحداثيات تقريبية؛ لا يمثل بنية ثلاثية الأبعاد محسّنة أو طول رابطة مقاساً.",
    );
  }
  const errs = issues(model),
    groups = functionalGroups(model),
    colored = Array.from(new Set([...selected, ...highlight]));
  const success =
    challenge &&
    manual &&
    !errs.length &&
    isomorphic(model, presets.ethanol.model);
  useEffect(() => {
    if (success && !challengeDone) {
      setChallengeDone(true);
      onChallengeComplete?.();
    }
  }, [success, challengeDone, onChallengeComplete]);
  const reset = () => {
    setModel({ atoms: [], bonds: [] });
    setSelected([]);
    setHighlight([]);
    setManual(false);
    setMessage("لوحة جديدة.");
  };
  return (
    <section className="card" aria-labelledby="molecule-title">
      <h2 id="molecule-title">مختبر بناء الجزيئات المتقدم</h2>
      <p>
        ابنِ الاتصال الذري ثم افحص التكافؤ. ذرات الهيدروجين صريحة؛ لا تُضاف
        تلقائياً. اختر الذرات بالنقر أو أزرار لوحة المفاتيح.
      </p>
      <div className="feedback">
        <h3>تحدي: ابنِ جزيء الإيثانول بنفسك</h3>
        <p>
          ابدأ بلوحة فارغة. أضف C₂H₆O، ثم اربط C–C–O ووزّع H لإكمال التكافؤ.
          اختيار نموذج جاهز يلغي محاولة التحدي.
        </p>
        <button
          onClick={() => {
            reset();
            setChallenge(true);
            setChallengeDone(false);
          }}
        >
          ابدأ تحدي الإيثانول
        </button>
        {challenge && (
          <p role="status">
            {success
              ? "🎉 أحسنت! بنيت الإيثانول: كربونان متصلان وOH على كربون مشبع، وجميع التكافؤات مكتملة."
              : "التحدي جارٍ: افحص اتصال C–C–O، ولا تنس هيدروجين مجموعة OH."}
          </p>
        )}
      </div>
      <details>
        <summary>
          مكتبة النماذج المدعومة ({Object.keys(presets).length})
        </summary>
        <div
          className="actions"
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          {Object.entries(presets).map(([key, p]) => (
            <button
              key={key}
              onClick={() => {
                setModel(copyModel(p.model));
                setSelected([]);
                setHighlight([]);
                setNote(p.note);
                setMessage("");
                setChallenge(false);
                setManual(false);
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </details>
      <div
        style={{
          background: "radial-gradient(ellipse,#102b4a,#080e22)",
          border: "1px solid #29405f",
          borderRadius: 20,
          margin: "16px 0",
          overflow: "hidden",
        }}
      >
        {fallback ? (
          <FlatMolecule
            model={model}
            highlightIds={colored}
            onSelect={choose}
          />
        ) : (
          <Scene
            model={model}
            select={colored}
            onSelect={choose}
            rotate={rotate && allowMotion}
            distance={distance}
            onFail={fail}
          />
        )}
      </div>
      <label>
        مسافة العرض (للتكبير والتصغير على الهاتف){" "}
        <input
          type="range"
          min="3"
          max="22"
          step="0.5"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
        />
      </label>
      <p>{note}</p>
      <p>
        <strong>
          الصيغة: <bdi>{formula(model) || "—"}</bdi> · {identify(model)}
        </strong>
      </p>
      <p>{geometryInfo(model)}</p>
      <details>
        <summary>الصيغة البنائية / قائمة الاتصال</summary>
        <p dir="ltr" style={{ overflowWrap: "anywhere" }}>
          {structuralFormula(model) || "أضف ذرات أولاً"}
        </p>
        <small>
          الأرقام معرّفات للذرات، وليست ترقيم IUPAC؛ يعرض السجل عدد H المتصلة بكل
          ذرة ثقيلة وروابطها.
        </small>
      </details>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setFallback((s) => !s)}>
          {fallback ? "تجربة العرض ثلاثي الأبعاد" : "البديل ثنائي الأبعاد"}
        </button>
        <button disabled={!allowMotion} onClick={() => setRotate((r) => !r)}>
          {rotate ? "إيقاف الدوران" : "دوران تلقائي"}
        </button>
        {(Object.keys(valence) as Element[]).map((e) => (
          <button
            key={e}
            onClick={() => add(e)}
            style={{ borderColor: colors[e] }}
          >
            أضف {e}
          </button>
        ))}
      </div>
      <p>
        اختر ذرتين:{" "}
        {selected
          .map(
            (id) =>
              model.atoms.find((a) => a.id === id)?.element + String(id + 1),
          )
          .join("، ") || "لم تحدد ذرات"}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {model.atoms.map((a) => (
          <button
            key={a.id}
            aria-pressed={selected.includes(a.id)}
            onClick={() => choose(a.id)}
            style={{
              borderColor: selected.includes(a.id) ? "#fbbf24" : undefined,
            }}
          >
            {a.element}
            {a.id + 1}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <label>
          رتبة الرابطة{" "}
          <select
            value={order}
            onChange={(e) => setOrder(Number(e.target.value) as 1 | 2 | 3)}
          >
            <option value="1">أحادية</option>
            <option value="2">ثنائية</option>
            <option value="3">ثلاثية</option>
          </select>
        </label>
        <button onClick={connect}>إنشاء / تعديل الرابطة</button>
        <button
          disabled={selected.length !== 2}
          onClick={() => {
            setModel((m) => ({
              ...m,
              bonds: m.bonds.filter(
                (b) => !(selected.includes(b.a) && selected.includes(b.b)),
              ),
            }));
            setManual(true);
          }}
        >
          حذف الرابطة
        </button>
        <button
          disabled={!selected.length}
          onClick={() => {
            setModel((m) => ({
              atoms: m.atoms.filter((a) => !selected.includes(a.id)),
              bonds: m.bonds.filter(
                (b) => !selected.includes(b.a) && !selected.includes(b.b),
              ),
            }));
            setSelected([]);
            setHighlight([]);
            setManual(true);
          }}
        >
          حذف المحدد
        </button>
        <button onClick={reset}>إعادة البناء</button>
      </div>
      <p role="status">{message}</p>
      <details open={errs.length > 0}>
        <summary>
          فحص التكافؤ:{" "}
          {!model.atoms.length
            ? "لا توجد ذرات"
            : errs.length
              ? `${errs.length} ملاحظة`
              : "مكتمل للذرات المتعادلة المعتادة"}
        </summary>
        {errs.map((e, i) => (
          <p key={i}>{e}</p>
        ))}
        <p>
          النطاق: C=4، H والهالوجينات=1، O=2، N=3. لا يحلل الأيونات أو الجذور
          الحرة أو فرط التكافؤ أو الثبات الكيميائي.
        </p>
      </details>
      <h3>المجموعات الوظيفية</h3>
      {groups.length ? (
        groups.map((g, i) => (
          <button
            key={i}
            onClick={() => setHighlight(g.atomIds)}
            title={g.description}
          >
            {g.name} — لوّن المجموعة
          </button>
        ))
      ) : (
        <p>
          لم تُكتشف مجموعة مدعومة في هذا الاتصال. أكمل الهيدروجين والتكافؤ أولاً.
        </p>
      )}
      <button onClick={() => setHighlight([])}>إلغاء التلوين</button>
      <details>
        <summary>قارن المتماكبات</summary>
        <label>
          قارن بناءك مع
          <select value={compare} onChange={(e) => setCompare(e.target.value)}>
            {Object.entries(presets).map(([key, p]) => (
              <option key={key} value={key}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <p>
          {errs.length
            ? "أكمل التكافؤ قبل مقارنة المتماكبات."
            : compareIsomers(model, presets[compare].model)}
        </p>
        <p>
          مثال: الإيثانول وثنائي ميثيل الإيثر C₂H₆O؛ يختلف الاتصال فتختلف
          المجموعة الوظيفية والخواص.
        </p>
      </details>
      <p>
        <small>
          النماذج تعليمية؛ الكرات والعصي ليست على مقياس ذري. التعرف يقارن
          الاتصال ورتب الروابط، وليس الصيغة وحدها.
        </small>
      </p>
    </section>
  );
}
