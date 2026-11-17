import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  FlaskConical,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Printer,
  Check,
  ChevronLeft,
  Sparkles,
  Move,
  Layers,
  Download,
} from "lucide-react";
import {
  experimentSpecs,
  defaultInputs,
  simulate,
  type ExperimentId,
  type Inputs as LabInputs,
} from "./labEngine";
import { fuels } from "./experiments";
import { presets, functionalGroups, polymerSegment } from "./chemistry";
import {
  emptyNote,
  guideLab,
  readNotebook,
  notebookKey,
  type LabNote,
  type LabSnapshot,
} from "./labNotebook";
import "./advanced-lab.css";
const LabScene = lazy(() => import("./AdvancedLabScene"));
const MolecularView = lazy(() =>
  import("./MoleculeLab").then((m) => ({ default: m.MolecularView })),
);
const toolNames: Record<string, string> = {
  beaker: "كأس زجاجي",
  flask: "دورق كيميائي",
  tube: "أنبوب اختبار",
  pipette: "ماصة",
  balance: "ميزان رقمي",
  heater: "سخان تعليمي",
  cylinder: "مخبار مدرج",
};
const stageNames = ["التجهيز", "المواد", "الاكتشاف", "التفسير", "التقرير"];
const fields: { key: keyof LabNote; label: string }[] = [
  { key: "student", label: "اسم الطالب" },
  { key: "hypothesis", label: "الفرضية" },
  { key: "independent", label: "المتغير المستقل" },
  { key: "dependent", label: "المتغير التابع" },
  { key: "constants", label: "المتغيرات الثابتة" },
  { key: "steps", label: "خطوات التجربة" },
  { key: "observations", label: "الملاحظات" },
  { key: "results", label: "النتائج" },
  { key: "conclusion", label: "الاستنتاج" },
];
function initialExperiment(): ExperimentId {
  const id = new URLSearchParams(location.hash.split("?")[1]).get("experiment");
  return experimentSpecs.some((s) => s.id === id)
    ? (id as ExperimentId)
    : "combustion";
}
function Assistant({
  message,
  running,
  mistakes,
  onHint,
  onQuestion,
}: {
  message: string;
  running: boolean;
  mistakes: number;
  onHint: () => void;
  onQuestion: () => void;
}) {
  return (
    <aside className="lab-assistant">
      <div className="assistant-top">
        <svg
          viewBox="0 0 90 90"
          width="63"
          height="63"
          role="img"
          aria-label="شخصية مساعد المختبر الذكي"
        >
          <defs>
            <linearGradient id="assistant">
              <stop stopColor="#a28bfa" />
              <stop offset="1" stopColor="#64dfd1" />
            </linearGradient>
          </defs>
          <g className={running ? "assistant-working" : ""}>
            <path
              d="M45 5v10M27 72l-7 12M63 72l7 12"
              stroke="#93b7db"
              strokeWidth="4"
            />
            <circle cx="45" cy="5" r="4" fill="#7ce8d1" />
            <rect
              x="13"
              y="18"
              width="64"
              height="54"
              rx="19"
              fill="url(#assistant)"
            />
            <rect x="21" y="28" width="48" height="30" rx="12" fill="#11213c" />
            <ellipse
              cx="34"
              cy="41"
              rx="4"
              ry={running ? 2 : 5}
              fill="#81ffe4"
            />
            <ellipse
              cx="56"
              cy="41"
              rx="4"
              ry={running ? 2 : 5}
              fill="#81ffe4"
            />
            <path
              d={mistakes ? "M37 52q8 -7 16 0" : "M37 49q8 7 16 0"}
              fill="none"
              stroke="#81ffe4"
              strokeWidth="2"
            />
            <path
              d="M7 35v18M83 35v18"
              stroke="#8ac7dc"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>
        </svg>
        <div>
          <small>إرشاد قائم على قواعد محلية</small>
          <h3>مساعد المختبر الذكي</h3>
          <span className="assistant-status">
            <i />
            {running ? "أراقب خطواتك" : "معك في كل اكتشاف"}
          </span>
        </div>
      </div>
      <p aria-live="polite">{message}</p>
      <div className="assistant-actions">
        <button onClick={onHint}>
          <Sparkles size={14} /> تلميح علمي
        </button>
        <button onClick={onQuestion}>سؤال للتفكير</button>
      </div>
      <small>لا اتصال بنموذج ذكاء اصطناعي خارجي.</small>
    </aside>
  );
}
function Chart({
  data,
  title,
}: {
  data: { label: string; value: number }[];
  title: string;
}) {
  const [selected, setSelected] = useState(0);
  const bound = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  return (
    <figure className="lab-chart">
      <figcaption>{title}</figcaption>
      {data.map((d, i) => (
        <button
          className={selected === i ? "chart-bar selected-bar" : "chart-bar"}
          key={i}
          onClick={() => setSelected(i)}
          aria-label={`${d.label}: ${d.value}`}
        >
          <span>{d.label}</span>
          <i
            style={{
              width: Math.max(2, (Math.abs(d.value) / bound) * 70) + "%",
            }}
          />
          <b dir="ltr">{Number(d.value.toFixed(3))}</b>
        </button>
      ))}
      <small>
        القيمة المحددة: {data[selected]?.label} = {data[selected]?.value}. طول
        الشريط يمثل القيمة المطلقة؛ الإشارة ظاهرة في الرقم.
      </small>
    </figure>
  );
}
export default function AdvancedLab({
  student,
  onComplete,
  reducedMotion = false,
  level = "medium",
}: {
  student: string;
  onComplete: (id: number) => void;
  reducedMotion?: boolean;
  level?: string;
}) {
  const [printReport, setPrintReport] = useState<LabSnapshot | null>(null);
  const [id, setId] = useState<ExperimentId>(initialExperiment),
    [inputs, setInputs] = useState<LabInputs>(() => ({
      ...defaultInputs[initialExperiment()],
    })),
    [tools, setTools] = useState<string[]>([]),
    [selectedTool, setSelectedTool] = useState<string | null>(null),
    [added, setAdded] = useState<string[]>([]),
    [running, setRunning] = useState(false),
    [progress, setProgress] = useState(0),
    [duration, setDuration] = useState(6),
    [fallback, setFallback] = useState(false),
    [answers, setAnswers] = useState<Record<number, number>>({}),
    [mistakes, setMistakes] = useState(0),
    [feedback, setFeedback] = useState(""),
    [tab, setTab] = useState<"controls" | "notebook" | "reports">("controls"),
    [store, setStore] = useState(readNotebook),
    [storageError, setStorageError] = useState(false),
    [saveMessage, setSaveMessage] = useState("");
  const spec = experimentSpecs.find((s) => s.id === id)!;
  const note =
    store.notes[id] || emptyNote(student === "مستكشف" ? "" : student);
  const result = useMemo(
    () => simulate(id, inputs, progress),
    [id, inputs, progress],
  );
  const needsReagent = ["combustion", "bromine", "addition", "ester"].includes(
    id,
  );
  const vessels = tools.filter((t) =>
    ["beaker", "flask", "tube", "cylinder"].includes(t),
  );
  const vesselId =
    selectedTool && vessels.includes(selectedTool)
      ? selectedTool
      : vessels[0] || null;
  const missingTools = spec.tools.filter((t) => !tools.includes(t));
  const missingMaterials = [
    "sample",
    ...(needsReagent ? ["reagent"] : []),
  ].filter((t) => !added.includes(t));
  const guide = guideLab({
    missingTools: missingTools.map((t) => toolNames[t] || t),
    missingMaterials: missingMaterials.map((t) =>
      t === "sample" ? "العينة" : "المادة المضافة",
    ),
    progress,
    answered: Object.keys(answers).length,
    mistakes,
    level,
    correct: spec.questions.filter((q, i) => answers[i] === q.answer).length,
  });
  const stage = missingTools.length
    ? 0
    : missingMaterials.length
      ? 1
      : progress === 0
        ? 2
        : progress < 1
          ? 2
          : Object.keys(answers).length < 3
            ? 3
            : 4;
  useEffect(() => {
    try {
      localStorage.setItem(notebookKey, JSON.stringify(store));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [store]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => setProgress((p) => Math.min(1, p + 0.1 / duration)),
      100,
    );
    return () => clearInterval(timer);
  }, [running, duration]);
  useEffect(() => {
    if (progress >= 1) setRunning(false);
  }, [progress]);
  useEffect(() => {
    const fn = () => {
      const next = initialExperiment();
      if (next !== id) switchExperiment(next);
    };
    addEventListener("hashchange", fn);
    return () => removeEventListener("hashchange", fn);
  }, [id]);
  function switchExperiment(next: ExperimentId) {
    setId(next);
    setInputs({ ...defaultInputs[next] });
    setRunning(false);
    setProgress(0);
    setAdded([]);
    setTools([]);
    setAnswers({});
    setFeedback("");
    setMistakes(0);
    setSaveMessage("");
    setTab("controls");
    setSelectedTool(null);
    setPrintReport(null);
  }
  function reset() {
    setProgress(0);
    setRunning(false);
    setAnswers({});
    setFeedback("");
    setSaveMessage("");
  }
  function change(key: string, value: number | string | boolean) {
    setInputs((v) => ({
      ...v,
      [key]: value,
      ...(key === "water"
        ? { removeWater: Math.min(Number(v.removeWater), Number(value)) }
        : {}),
    }));
    setProgress(0);
    setRunning(false);
    setAnswers({});
    setAdded([]);
    setFeedback("تغيّر أحد المدخلات؛ أعد إضافة المواد لتوثيق الكميات الجديدة.");
    setSaveMessage("");
  }
  function selectTool(t: string) {
    if (running) return;
    if (["beaker", "flask", "tube", "cylinder"].includes(t) && vesselId !== t) {
      setAdded([]);
      reset();
    }
    setSelectedTool(t);
  }
  function transfer(kind: string) {
    if (running) {
      setFeedback(
        "أوقف العرض قبل تغيير الأدوات أو المواد، حتى تبقى المقارنة مضبوطة.",
      );
      setMistakes((m) => m + 1);
      return;
    }
    if (kind.startsWith("tool:")) {
      const t = kind.slice(5);
      if (!toolNames[t]) return;
      setTools((v) => [...new Set([...v, t])]);
      selectTool(t);
      setFeedback(`نُقلت أداة ${toolNames[t]} إلى الطاولة.`);
    } else if (kind === "sample" || kind === "reagent") {
      if (missingTools.length) {
        setFeedback("جهّز أدوات التجربة أولاً حتى تجد المواد وعاءً مناسباً.");
        setMistakes((m) => m + 1);
        return;
      }
      setAdded((v) => [...new Set([...v, kind])]);
      setFeedback(
        kind === "sample"
          ? `أُضيفت العينة الافتراضية بالكمية المحددة إلى ${toolNames[vesselId || "flask"]}.`
          : `أُضيفت المادة الثانية بالكمية المحددة إلى ${toolNames[vesselId || "flask"]}.`,
      );
    }
  }
  function run() {
    if (missingTools.length || missingMaterials.length) {
      setMistakes((m) => m + 1);
      setFeedback(guide);
      return;
    }
    if (progress >= 1) {
      setProgress(0);
      setAnswers({});
      setPrintReport(null);
    }
    setFeedback("راقب التغير. هذا زمن عرض تعليمي وليس زمناً حركياً مقاساً.");
    setRunning(true);
  }
  function saveReport() {
    if (progress < 1 || Object.keys(answers).length < 3) {
      setFeedback("أكمل تشغيل العرض وأسئلة التقويم قبل حفظ التقرير.");
      return;
    }
    if (
      !note.student.trim() ||
      !note.hypothesis.trim() ||
      !note.conclusion.trim()
    ) {
      setFeedback(
        "أضف اسم الطالب والفرضية والاستنتاج في دفتر المختبر قبل حفظ التقرير.",
      );
      setTab("notebook");
      return;
    }
    const snap: LabSnapshot = {
      id,
      title: spec.title,
      date: new Date().toISOString(),
      note: { ...note },
      inputs: { ...inputs },
      equation: result.equation,
      summary: result.summary,
      score: spec.questions.filter((q, i) => answers[i] === q.answer).length,
      total: 3,
      mistakes,
      chart: result.chart,
      metrics: result.metrics,
      explanation: result.explanation,
      limits: spec.limits,
    };
    setStore((s) => ({ ...s, reports: [snap, ...s.reports].slice(0, 80) }));
    onComplete(experimentSpecs.findIndex((e) => e.id === id) + 1);
    setSaveMessage("حُفظ تقرير التجربة وإنجازها على هذا الجهاز.");
    setFeedback("تقريرك جاهز. قارن استنتاجك بفرضيتك: هل تدعمه النتائج؟");
  }
  const polymerUnits = Math.max(2, result.details?.shown || 2);
  const model = useMemo(
    () =>
      id === "polymer"
        ? polymerSegment(
            String(inputs.monomer) as "ethene" | "propene",
            polymerUnits,
          )
        : presets[result.modelKey || ""]?.model,
    [id, inputs.monomer, polymerUnits, result.modelKey],
  );
  const highlight = useMemo(
    () =>
      model && id === "functional"
        ? functionalGroups(model).flatMap((g) => g.atomIds)
        : [],
    [model, id],
  );
  const range = (
    key: string,
    label: string,
    min: number,
    max: number,
    step = 0.25,
  ) => (
    <label className="lab-input" key={key}>
      {label}
      <output>{String(inputs[key])}</output>
      <input
        disabled={running}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number(inputs[key])}
        onChange={(e) => change(key, +e.target.value)}
      />
    </label>
  );
  const select = (
    key: string,
    label: string,
    options: [string | number, string][],
    numeric = false,
  ) => (
    <label className="lab-input" key={key}>
      {label}
      <select
        disabled={running}
        value={String(inputs[key])}
        onChange={(e) => {
          if (id === "combustion" && key === "fuel") {
            const f = fuels[+e.target.value];
            setInputs((v) => ({
              ...v,
              fuel: +e.target.value,
              oxygen: f.c + f.h / 4,
            }));
            reset();
            setAdded([]);
          } else change(key, numeric ? +e.target.value : e.target.value);
        }}
      >
        {options.map(([v, t]) => (
          <option value={v} key={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
  const materialLabels =
    id === "combustion"
      ? ["الهيدروكربون", "الأكسجين"]
      : id === "bromine"
        ? ["العينة العضوية", "ماء البروم"]
        : id === "addition"
          ? ["الألكين", "H₂ أو Br₂"]
          : id === "ester"
            ? ["الحمض الكربوكسيلي", "الكحول"]
            : ["العينة / النموذج", ""];
  const currentReport: LabSnapshot = {
    id,
    title: spec.title,
    date: new Date().toISOString(),
    note,
    inputs,
    equation: result.equation,
    summary: progress ? result.summary : "لم تشغّل المحاكاة بعد",
    score: spec.questions.filter((q, i) => answers[i] === q.answer).length,
    total: 3,
    mistakes,
    chart: result.chart,
    metrics: result.metrics,
    explanation: result.explanation,
    limits: spec.limits,
  };
  return (
    <section className="advanced-lab">
      <div className="lab-titlebar">
        <div>
          <span className="eyebrow">VIRTUAL LAB · V3.0</span>
          <h2>مختبر الاكتشاف العضوي</h2>
          <p>طاولتك. أدواتك. سؤالك العلمي التالي.</p>
        </div>
        <span className="lab-safe">
          <i /> محاكاة تعليمية آمنة
        </span>
      </div>
      <div
        className="experiment-tabs"
        role="group"
        aria-label="التجارب المتاحة"
      >
        {experimentSpecs.map((s, i) => (
          <button
            aria-pressed={id === s.id}
            className={id === s.id ? "selected" : ""}
            key={s.id}
            onClick={() => switchExperiment(s.id)}
          >
            <b>{String(i + 1).padStart(2, "0")}</b>
            {s.title}
          </button>
        ))}
      </div>
      <div className="lab-stage-strip">
        {stageNames.map((n, i) => (
          <span
            className={i === stage ? "current" : i < stage ? "finished" : ""}
            key={n}
          >
            {i < stage ? <Check size={13} /> : <b>{i + 1}</b>}
            {n}
          </span>
        ))}
      </div>
      <div className="lab-main-grid">
        <div>
          <div className="lab-viewport">
            <div className="viewport-top">
              <span>
                <span className="live-dot" />{" "}
                {running ? "العرض جارٍ" : "مساحة العمل التفاعلية"}
              </span>
              <button onClick={() => setFallback((v) => !v)}>
                {fallback
                  ? "تجربة العرض ثلاثي الأبعاد"
                  : "البديل ثنائي الأبعاد"}
              </button>
            </div>
            {fallback ? (
              <div
                className="lab-2d"
                role="img"
                aria-label="مختبر ثنائي الأبعاد تفاعلي"
              >
                <svg viewBox="0 0 650 300">
                  <defs>
                    <linearGradient id="glass">
                      <stop stopColor="#94d8ed" stopOpacity=".15" />
                      <stop offset="1" stopColor="#d8f6ff" stopOpacity=".4" />
                    </linearGradient>
                  </defs>
                  <path d="M30 225H620V255H30Z" fill="#506277" />
                  <rect x="50" y="255" width="16" height="40" fill="#314454" />
                  <rect x="580" y="255" width="16" height="40" fill="#314454" />
                  {tools.map((t, i) => (
                    <g key={t} transform={`translate(${75 + i * 73},70)`}>
                      <path
                        d="M12 20V40L0 130Q20 155 40 130L28 40V20"
                        stroke="#b5e7fa"
                        fill="url(#glass)"
                        strokeWidth="2"
                      />
                      <path
                        d={`M7 ${110 - progress * 40}L3 128Q20 145 37 128L33 ${110 - progress * 40}Z`}
                        fill={result.color}
                        opacity=".65"
                      />
                      <text
                        x="20"
                        y="174"
                        textAnchor="middle"
                        fill="#d6edf8"
                        fontSize="10"
                      >
                        {toolNames[t]}
                      </text>
                      {running && (
                        <circle cx="20" cy="90" r="4" fill="#cdf7ff" />
                      )}
                    </g>
                  ))}
                </svg>
                <p>
                  أدوات الطاولة:{" "}
                  {tools.length
                    ? tools.map((t) => toolNames[t]).join("، ")
                    : "أضف أداة من الخزانة"}
                </p>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="lab-loading">
                    نجهّز الإضاءة والزجاج والأدوات…
                  </div>
                }
              >
                <LabScene
                  tools={tools}
                  selectedTool={selectedTool}
                  onSelectTool={(t) => transfer("tool:" + t)}
                  running={running}
                  progress={progress}
                  color={result.color}
                  filled={
                    id === "bromine"
                      ? added.includes("reagent")
                      : ["ester", "solubility"].includes(id) &&
                        added.includes("sample")
                  }
                  vesselId={vesselId}
                  reducedMotion={reducedMotion}
                  onFail={() => setFallback(true)}
                />
              </Suspense>
            )}
            <div className="viewport-caption">
              <Move size={14} /> اسحب للدوران · قرّب بإصبعيك أو بعجلة الفأرة ·
              اختر الأدوات من الأزرار أيضاً
            </div>
          </div>
          <div className="lab-runbar">
            <button
              className="primary"
              onClick={running ? () => setRunning(false) : run}
            >
              {running ? <Pause size={17} /> : <Play size={17} />}{" "}
              {running
                ? "إيقاف مؤقت"
                : progress > 0 && progress < 1
                  ? "استئناف المحاكاة"
                  : "تشغيل المحاكاة"}
            </button>
            <button onClick={reset}>
              <RotateCcw size={16} /> إعادة
            </button>
            <label>
              مدة العرض{" "}
              <select
                aria-label="مدة العرض التعليمي"
                value={duration}
                disabled={running}
                onChange={(e) => setDuration(+e.target.value)}
              >
                <option value="3">٣ ثوانٍ</option>
                <option value="6">٦ ثوانٍ</option>
                <option value="12">١٢ ثانية</option>
              </select>
            </label>
            <progress max="1" value={progress} aria-label="تقدم المحاكاة" />
            <b>{Math.round(progress * 100)}%</b>
          </div>
          <div
            className="lab-dropzone"
            tabIndex={0}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              transfer(e.dataTransfer.getData("text/plain"));
            }}
            aria-label="طاولة العمل، منطقة إسقاط الأدوات والمواد"
          >
            <Layers size={20} />
            <div>
              <strong>طاولة العمل</strong>
              <small>
                اسحب الأداة أو المادة إلى هنا، أو استخدم أزرار الإضافة أدناه.
              </small>
            </div>
            <div className="bench-chips">
              {tools.map((t) => (
                <span className="bench-chip" key={t}>
                  <button
                    className={selectedTool === t ? "selected" : ""}
                    onClick={() => selectTool(t)}
                  >
                    {toolNames[t]}
                  </button>
                  <button
                    disabled={running}
                    aria-label={"إزالة " + toolNames[t]}
                    onClick={() => {
                      setTools((v) => v.filter((x) => x !== t));
                      reset();
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <Assistant
          message={feedback ? feedback + " " + guide : guide}
          running={running && !reducedMotion}
          mistakes={mistakes}
          onHint={() => setFeedback(spec.limits)}
          onQuestion={() =>
            setFeedback(
              spec.questions[0].prompt +
                " ناقش السبب قبل اختيار الإجابة في قسم التقويم.",
            )
          }
        />
      </div>
      <div className="lab-bottom-tabs">
        <button
          className={tab === "controls" ? "selected" : ""}
          onClick={() => setTab("controls")}
        >
          <FlaskConical size={16} /> إعداد التجربة
        </button>
        <button
          className={tab === "notebook" ? "selected" : ""}
          onClick={() => setTab("notebook")}
        >
          <BookOpen size={16} /> دفتر المختبر
        </button>
        <button
          className={tab === "reports" ? "selected" : ""}
          onClick={() => setTab("reports")}
        >
          <Printer size={16} /> التقارير ({store.reports.length})
        </button>
      </div>
      {tab === "controls" && (
        <div className="lab-controls-grid">
          <section className="card">
            <span className="eyebrow">01 / سؤال وتجهيز</span>
            <h3>{spec.title}</h3>
            <p>
              <strong>الهدف:</strong> {spec.objective}
            </p>
            <ol>
              {spec.instructions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <h4>خزانة الأدوات</h4>
            <div className="tool-cabinet">
              {Object.entries(toolNames).map(([t, n]) => (
                <button
                  key={t}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", "tool:" + t)
                  }
                  onClick={() => transfer("tool:" + t)}
                  aria-pressed={tools.includes(t)}
                >
                  <FlaskConical size={17} />
                  {n}
                  {tools.includes(t) && <Check size={14} />}
                </button>
              ))}
            </div>
            <small>
              المطلوب لهذه التجربة:{" "}
              {spec.tools.map((t) => toolNames[t] || t).join("، ")}
            </small>
          </section>
          <section className="card">
            <span className="eyebrow">02 / متغيرات ومواد</span>
            <h3>غيّر المدخلات… واختبر الفكرة</h3>
            <div className="lab-fields">
              {id === "combustion" && (
                <>
                  {select(
                    "fuel",
                    "المركب",
                    fuels.map((f, i) => [i, f.name]),
                    true,
                  )}
                  {range(
                    "oxygen",
                    "مول O₂ لكل مول وقود",
                    fuels[Number(inputs.fuel)].h / 4,
                    fuels[Number(inputs.fuel)].c +
                      fuels[Number(inputs.fuel)].h / 4,
                  )}
                </>
              )}
              {id === "bromine" && (
                <>
                  {select("sample", "العينة", [
                    ["ethane", "إيثان"],
                    ["ethene", "إيثين"],
                    ["ethyne", "إيثاين"],
                  ])}
                  {range("sampleAmount", "كمية العينة (مول افتراضي)", 0.25, 2)}
                  {range("dose", "كمية Br₂ المضافة (مول افتراضي)", 0, 4)}
                </>
              )}
              {id === "addition" && (
                <>
                  {select(
                    "alkene",
                    "الألكين",
                    [
                      [0, "إيثين"],
                      [1, "بروبين"],
                    ],
                    true,
                  )}
                  {select("reagent", "المادة المضافة", [
                    ["H2", "H₂"],
                    ["Br2", "Br₂"],
                  ])}
                  {range("sampleAmount", "كمية الألكين (مول افتراضي)", 0.25, 2)}
                  {range("dose", "كمية المضاف (مول افتراضي)", 0, 3)}
                </>
              )}
              {id === "ester" && (
                <>
                  {select(
                    "acid",
                    "الحمض",
                    [
                      [0, "حمض الميثانويك"],
                      [1, "حمض الإيثانويك"],
                    ],
                    true,
                  )}
                  {select(
                    "alcohol",
                    "الكحول",
                    [
                      [0, "ميثانول"],
                      [1, "إيثانول"],
                    ],
                    true,
                  )}
                  {range("acidAmount", "كمية الحمض (مول افتراضي)", 0.5, 3)}
                  {range("alcoholAmount", "كمية الكحول (مول افتراضي)", 0.5, 3)}
                  {range("water", "ماء ابتدائي (مول افتراضي)", 0, 2)}
                  {range(
                    "removeWater",
                    "الماء الابتدائي المُزال قبل الاتزان",
                    0,
                    Number(inputs.water) || 0,
                  )}
                  <label className="check-field">
                    <input
                      type="checkbox"
                      checked={Boolean(inputs.catalyst)}
                      disabled={running}
                      onChange={(e) => change("catalyst", e.target.checked)}
                    />
                    حفاز حمضي (يؤثر في وتيرة العرض، لا موضع الاتزان)
                  </label>
                </>
              )}
              {id === "solubility" && (
                <>
                  {select("compound", "المركب", [
                    ["ethanol", "إيثانول"],
                    ["hexane", "هكسان"],
                    ["ethanoicAcid", "حمض الإيثانويك"],
                  ])}
                  {select("solvent", "المذيب", [
                    ["water", "الماء"],
                    ["hexane", "الهكسان"],
                  ])}
                </>
              )}
              {id === "physical" && (
                <>
                  {select("first", "المركب الأول", [
                    ["ethane", "إيثان"],
                    ["ethene", "إيثين"],
                    ["ethanol", "إيثانول"],
                    ["hexane", "هكسان"],
                    ["propanol", "بروبان-1-ول"],
                    ["ethanoicAcid", "حمض الإيثانويك"],
                  ])}
                  {select("second", "المركب الثاني", [
                    ["ethane", "إيثان"],
                    ["ethene", "إيثين"],
                    ["ethanol", "إيثانول"],
                    ["hexane", "هكسان"],
                    ["propanol", "بروبان-1-ول"],
                    ["ethanoicAcid", "حمض الإيثانويك"],
                  ])}
                  {select("property", "الخاصية", [
                    ["boiling", "درجة الغليان °C"],
                    ["melting", "درجة الانصهار °C"],
                  ])}
                </>
              )}
              {id === "polymer" && (
                <>
                  {select("monomer", "المونومر", [
                    ["ethene", "إيثين ← بولي إيثيلين"],
                    ["propene", "بروبين ← بولي بروبيلين"],
                  ])}
                  {range("units", "وحدات التكرار في المقطع", 2, 12, 1)}
                </>
              )}
              {id === "functional" && (
                <>
                  {select("compound", "المركب", [
                    ["ethanol", "إيثانول"],
                    ["ethanoicAcid", "حمض الإيثانويك"],
                    ["methanal", "ميثانال"],
                    ["propanone", "بروبانون"],
                    ["methylEthanoate", "إيثانوات الميثيل"],
                    ["methylamine", "ميثيل أمين"],
                    ["chloroethane", "كلوروإيثان"],
                  ])}
                </>
              )}
            </div>
            <label className="lab-input">
              الوعاء المستهدف
              <select
                disabled={running || !vessels.length}
                value={vesselId || ""}
                onChange={(e) => selectTool(e.target.value)}
              >
                {!vessels.length && <option value="">أضف وعاءً أولاً</option>}
                {vessels.map((t) => (
                  <option key={t} value={t}>
                    {toolNames[t]}
                  </option>
                ))}
              </select>
            </label>
            <div className="reagent-palette">
              {["sample", ...(needsReagent ? ["reagent"] : [])].map((m, i) => (
                <button
                  key={m}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", m)}
                  className={added.includes(m) ? "added" : ""}
                  onClick={() => transfer(m)}
                >
                  <span
                    style={{ background: i === 0 ? "#8cafff" : "#db9f55" }}
                  />
                  <b>{materialLabels[i]}</b>
                  <small>
                    {added.includes(m) ? "✓ أضيفت" : "اسحب أو انقر للإضافة"}
                  </small>
                </button>
              ))}
            </div>
            <p className="lab-limit">{spec.limits}</p>
          </section>
        </div>
      )}
      {tab === "notebook" && (
        <section className="card notebook">
          <div className="notebook-heading">
            <div>
              <span className="eyebrow">MY LAB NOTEBOOK</span>
              <h3>دفتر {spec.title}</h3>
            </div>
            <span>
              {storageError
                ? "تعذر الحفظ المحلي"
                : "● محفوظ تلقائياً على هذا الجهاز"}
            </span>
          </div>
          <div className="notebook-fields">
            {fields.map((f) => (
              <label key={f.key}>
                {f.label}
                {f.key === "student" ? (
                  <input
                    maxLength={80}
                    value={note[f.key]}
                    onChange={(e) =>
                      setStore((s) => ({
                        ...s,
                        notes: {
                          ...s.notes,
                          [id]: { ...note, [f.key]: e.target.value },
                        },
                      }))
                    }
                  />
                ) : (
                  <textarea
                    rows={3}
                    maxLength={4000}
                    value={note[f.key]}
                    placeholder={"سجّل " + f.label + " هنا…"}
                    onChange={(e) =>
                      setStore((s) => ({
                        ...s,
                        notes: {
                          ...s.notes,
                          [id]: { ...note, [f.key]: e.target.value },
                        },
                      }))
                    }
                  />
                )}
              </label>
            ))}
          </div>
          <button
            className="secondary"
            onClick={() => {
              setStore((s) => ({
                ...s,
                notes: {
                  ...s.notes,
                  [id]: {
                    ...note,
                    steps: spec.instructions.join("\n"),
                    results: progress >= 1 ? result.summary : note.results,
                  },
                },
              }));
            }}
          >
            أدرج خطوات التجربة والنتيجة الحالية
          </button>
          <p>
            لا تُكتب الفرضية أو الاستنتاج نيابةً عنك؛ سجّل تفسيرك العلمي بنفسك.
          </p>
        </section>
      )}
      {tab === "reports" && (
        <section className="card">
          <h3>تقاريرك المحفوظة</h3>
          {!store.reports.length && (
            <p>أكمل العرض والتقويم، وسجّل فرضيتك واستنتاجك، ثم احفظ التقرير.</p>
          )}
          {store.reports.map((r, i) => (
            <article key={r.date + i} className="saved-report">
              <div>
                <strong>
                  {r.title} — {r.note.student}
                </strong>
                <small>
                  {new Date(r.date).toLocaleString("ar-AE", {
                    timeZone: "Asia/Dubai",
                  })}{" "}
                  · التقويم {r.score}/{r.total}
                </small>
                <p>{r.summary}</p>
              </div>
              <button
                onClick={() => {
                  setPrintReport(r);
                  window.setTimeout(() => window.print(), 40);
                }}
              >
                <Printer size={16} /> طباعة
              </button>
            </article>
          ))}
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(store, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "organic-lab-notebook.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={16} /> تنزيل نسخة JSON من الدفتر
          </button>
        </section>
      )}
      {progress > 0 && (
        <section className="lab-results card">
          <div className="result-heading">
            <span className="eyebrow">03 / ملاحظات وتفسير</span>
            <span>
              {progress >= 1 ? "اكتمل العرض" : "نتيجة المرحلة الحالية"}
            </span>
          </div>
          <h3>الملاحظة والنتيجة</h3>
          {result.equation && (
            <div className="lab-equation" dir="ltr">
              {result.equation}
            </div>
          )}
          <h3>{result.summary}</h3>
          <p>{result.explanation}</p>
          <div className="lab-metrics">
            {result.metrics.map((m, i) => (
              <div key={i}>
                <span>{m.label}</span>
                <b>
                  {String(m.value).startsWith("https://") ? (
                    <a href={String(m.value)} target="_blank" rel="noreferrer">
                      السجل المرجعي ↗
                    </a>
                  ) : (
                    String(m.value)
                  )}{" "}
                  <small>{m.unit || ""}</small>
                </b>
              </div>
            ))}
          </div>
          {result.chart && (
            <Chart
              data={result.chart}
              title={
                id === "physical"
                  ? "بيانات مرجعية · °C"
                  : "قيم النموذج التعليمي"
              }
            />
          )}
          <div className="model-result">
            {model && (
              <>
                <h4>
                  {id === "polymer"
                    ? "مقطع سلسلة بوليمرية (نهايات توضيحية مغطاة بالهيدروجين)"
                    : id === "functional"
                      ? "المجموعة الوظيفية مميزة باللون الذهبي"
                      : "النموذج الجزيئي للتركيب المعروض"}
                </h4>
                <Suspense fallback={<p>تحميل النموذج…</p>}>
                  <MolecularView
                    model={model}
                    allowMotion={!reducedMotion}
                    highlightIds={highlight}
                  />
                </Suspense>
                <small>
                  تمثيل اتصال وهندسة تقريبية، وليس تحسيناً طاقياً أو قياساً
                  بنيوياً.
                </small>
              </>
            )}
          </div>
          {result.warnings.map((w) => (
            <p className="lab-limit" key={w}>
              {w}
            </p>
          ))}
          {progress >= 1 && (
            <div className="lab-assessment">
              <h3>فسّر ما اكتشفته</h3>
              {spec.questions.map((q, i) => (
                <fieldset key={q.prompt}>
                  <legend>
                    {i + 1}. {q.prompt}
                  </legend>
                  <div>
                    {q.options.map((o, j) => (
                      <button
                        key={o}
                        className={answers[i] === j ? "selected" : ""}
                        disabled={answers[i] !== undefined}
                        onClick={() => {
                          setAnswers((a) => ({ ...a, [i]: j }));
                          setFeedback(
                            j === q.answer
                              ? "إجابة موفقة. " + q.explanation
                              : "لنراجع السبب: " + q.explanation,
                          );
                        }}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                  {answers[i] !== undefined && (
                    <p
                      className={
                        answers[i] === q.answer
                          ? "correct-answer"
                          : "review-answer"
                      }
                    >
                      {answers[i] === q.answer
                        ? "✓ صحيح"
                        : "الإجابة الصحيحة: " + q.options[q.answer]}{" "}
                      — {q.explanation}
                    </p>
                  )}
                </fieldset>
              ))}
              {Object.keys(answers).length === 3 && (
                <p>
                  التقويم:{" "}
                  {
                    spec.questions.filter((q, i) => answers[i] === q.answer)
                      .length
                  }
                  /3 · محاولات تجهيز تحتاج مراجعة: {mistakes}.{" "}
                  {spec.questions.filter((q, i) => answers[i] === q.answer)
                    .length < 2
                    ? "راجع التفسير ثم أعد التقويم."
                    : "أنت مستعد لتوثيق استنتاجك."}
                </p>
              )}
              <button onClick={() => setAnswers({})}>إعادة التقويم</button>
            </div>
          )}
        </section>
      )}
      <div className="lab-final-actions">
        <button className="primary" onClick={saveReport}>
          <BookOpen size={17} /> احفظ إنجاز التجربة والتقرير
        </button>
        <button
          onClick={() => {
            setPrintReport(currentReport);
            window.setTimeout(() => window.print(), 40);
          }}
        >
          <Printer size={17} /> طباعة التقرير الحالي / PDF
        </button>
        <span role="status">{saveMessage}</span>
      </div>
      {storageError && (
        <p role="alert">
          تعذر التخزين المحلي. يمكنك طباعة التقرير أو تنزيل نسخة الدفتر الآن.
        </p>
      )}
      <LabPrint report={printReport || currentReport} />
    </section>
  );
}
function LabPrint({ report: r }: { report: LabSnapshot }) {
  return (
    <article className="lab-report">
      <h1>عالم الكيمياء العضوية — تقرير مختبر</h1>
      <h2>{r.title}</h2>
      <p>
        إعداد المعلم: عمر فرج الله ·{" "}
        {new Date(r.date).toLocaleString("ar-AE", { timeZone: "Asia/Dubai" })}
      </p>
      {fields.map((f) => (
        <section key={f.key}>
          <h3>{f.label}</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {r.note[f.key] || "لم يُسجّل بعد"}
          </p>
        </section>
      ))}
      <h3>إعدادات المحاكاة</h3>
      <p>{describeInputs(r.id, r.inputs)}</p>
      {r.equation && <p dir="ltr">{r.equation}</p>}
      <p>{r.summary}</p>
      {r.metrics && (
        <table>
          <thead>
            <tr>
              <th>البند</th>
              <th>النتيجة</th>
            </tr>
          </thead>
          <tbody>
            {r.metrics.map((m, i) => (
              <tr key={i}>
                <td>{m.label}</td>
                <td>
                  {String(m.value)} {m.unit || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>{r.explanation}</p>
      <p>{r.limits}</p>
      {r.chart && (
        <>
          <PrintChart data={r.chart} />
          <table>
            <thead>
              <tr>
                <th>المتغير</th>
                <th>القيمة</th>
              </tr>
            </thead>
            <tbody>
              {r.chart.map((d, i) => (
                <tr key={i}>
                  <td>{d.label}</td>
                  <td>{d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p>
        التقويم: {r.score}/{r.total} · أخطاء التجهيز: {r.mistakes}
      </p>
      <p>
        هذه نتائج نموذج تعليمي أو بيانات مرجعية، وليست قياسات مخبرية أجراها
        الطالب. راجع حدود التجربة في المنصة.
      </p>
    </article>
  );
}

const inputLabels: Record<string, string> = {
  fuel: "الوقود",
  oxygen: "مول O₂ لكل مول وقود",
  sample: "العينة",
  sampleAmount: "كمية العينة الافتراضية",
  dose: "كمية المضاف الافتراضية",
  alkene: "الألكين",
  reagent: "المضاف",
  acid: "الحمض",
  alcohol: "الكحول",
  acidAmount: "كمية الحمض",
  alcoholAmount: "كمية الكحول",
  water: "الماء الابتدائي",
  removeWater: "الماء الابتدائي المُزال",
  catalyst: "الحفاز",
  compound: "المركب",
  solvent: "المذيب",
  first: "المركب الأول",
  second: "المركب الثاني",
  property: "الخاصية",
  monomer: "المونومر",
  units: "عدد وحدات التكرار",
};
const valueLabels: Record<string, string> = {
  ethane: "الإيثان",
  ethene: "الإيثين",
  ethyne: "الإيثاين",
  propene: "البروبين",
  ethanol: "الإيثانول",
  hexane: "الهكسان",
  propanol: "بروبان-1-ول",
  ethanoicAcid: "حمض الإيثانويك",
  water: "الماء",
  methanal: "الميثانال",
  propanone: "البروبانون",
  methylEthanoate: "إيثانوات الميثيل",
  methylamine: "ميثيل أمين",
  chloroethane: "كلوروإيثان",
  boiling: "الغليان °C",
  melting: "الانصهار °C",
  H2: "H₂",
  Br2: "Br₂",
};
function describeInputs(id: string, inputs: LabSnapshot["inputs"]) {
  return Object.entries(inputs)
    .map(([k, v]) => {
      let name = valueLabels[String(v)] || String(v);
      if (typeof v === "boolean") name = v ? "موجود" : "غير موجود";
      if (k === "fuel") name = fuels[Number(v)]?.name || name;
      if (k === "alkene") name = Number(v) ? "البروبين" : "الإيثين";
      if (k === "acid") name = Number(v) ? "حمض الإيثانويك" : "حمض الميثانويك";
      if (k === "alcohol") name = Number(v) ? "الإيثانول" : "الميثانول";
      return (inputLabels[k] || k) + ": " + name;
    })
    .join(" · ");
}
function PrintChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  return (
    <svg
      viewBox={`0 0 600 ${data.length * 42 + 25}`}
      style={{ width: "100%", maxHeight: 240 }}
      role="img"
      aria-label="الرسم البياني لبيانات التقرير"
    >
      {data.map((d, i) => (
        <g key={i}>
          <text
            x="585"
            y={i * 42 + 25}
            textAnchor="end"
            fontSize="13"
            fill="#111"
          >
            {d.label}
          </text>
          <rect
            x="100"
            y={i * 42 + 12}
            width={(Math.abs(d.value) / max) * 330}
            height="18"
            rx="3"
            fill="#8872bb"
          />
          <text
            x="85"
            y={i * 42 + 25}
            textAnchor="end"
            fontSize="13"
            fill="#111"
          >
            {Number(d.value.toFixed(3))}
          </text>
        </g>
      ))}
    </svg>
  );
}
