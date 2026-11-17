export type LabNote = {
  student: string;
  hypothesis: string;
  independent: string;
  dependent: string;
  constants: string;
  steps: string;
  observations: string;
  results: string;
  conclusion: string;
};
export type LabSnapshot = {
  id: string;
  title: string;
  date: string;
  note: LabNote;
  inputs: Record<string, number | string | boolean>;
  equation?: string;
  summary: string;
  score: number;
  total: number;
  mistakes: number;
  chart?: { label: string; value: number }[];
  metrics?: { label: string; value: number | string; unit?: string }[];
  explanation?: string;
  limits?: string;
};
export const emptyNote = (student: string): LabNote => ({
  student,
  hypothesis: "",
  independent: "",
  dependent: "",
  constants: "",
  steps: "",
  observations: "",
  results: "",
  conclusion: "",
});
export const notebookKey = "ocu-notebook-v3";
export function readNotebook(): {
  notes: Record<string, LabNote>;
  reports: LabSnapshot[];
} {
  try {
    const x = JSON.parse(localStorage.getItem(notebookKey) || "{}");
    const normalize = (n: unknown): LabNote => {
      const clean = emptyNote("");
      if (n && typeof n === "object")
        for (const k of Object.keys(clean) as (keyof LabNote)[]) {
          const v = (n as Record<string, unknown>)[k];
          if (typeof v === "string") clean[k] = v.slice(0, 4000);
        }
      return clean;
    };
    const notes: Record<string, LabNote> = {};
    if (x?.notes && typeof x.notes === "object" && !Array.isArray(x.notes))
      for (const [id, n] of Object.entries(x.notes)) {
        if (
          [
            "combustion",
            "bromine",
            "addition",
            "ester",
            "solubility",
            "physical",
            "polymer",
            "functional",
          ].includes(id)
        )
          notes[id] = normalize(n);
      }
    const reports = Array.isArray(x?.reports)
      ? x.reports
          .filter(
            (r: LabSnapshot) =>
              r &&
              r.note &&
              typeof r.title === "string" &&
              typeof r.id === "string" &&
              typeof r.summary === "string" &&
              r.inputs &&
              typeof r.inputs === "object" &&
              Number.isFinite(r.score) &&
              r.total > 0 &&
              Array.isArray(r.chart || []) &&
              Array.isArray(r.metrics || []),
          )
          .map((r: LabSnapshot) => ({
            ...r,
            note: normalize(r.note),
            chart: r.chart?.filter(
              (d) =>
                d && typeof d.label === "string" && Number.isFinite(d.value),
            ),
            metrics: r.metrics?.filter(
              (m) =>
                m &&
                typeof m.label === "string" &&
                ["string", "number"].includes(typeof m.value),
            ),
          }))
          .slice(0, 80)
      : [];
    return { notes, reports };
  } catch {
    return { notes: {}, reports: [] };
  }
}
export function guideLab({
  missingTools,
  missingMaterials,
  progress,
  answered,
  mistakes,
  level,
  correct = 3,
}: {
  missingTools: string[];
  missingMaterials: string[];
  progress: number;
  answered: number;
  mistakes: number;
  level: string;
  correct?: number;
}) {
  if (missingTools.length)
    return `لنجهز الطاولة أولاً. أضف: ${missingTools.join("، ")}. اسحب الأداة أو استخدم زر الإضافة.`;
  if (missingMaterials.length)
    return `أدواتك جاهزة. حدّد الكميات ثم أضف: ${missingMaterials.join("، ")} إلى الوعاء. الإضافة افتراضية بالكامل.`;
  if (progress === 0)
    return "سجّل فرضيتك قبل التشغيل. ماذا تتوقع عندما تغير متغيراً واحداً؟ ثم شغّل المحاكاة.";
  if (progress < 1)
    return "قارن النتيجة بتوقعك. يمكنك إيقاف العرض مؤقتاً لدراسة المدخلات والمعادلة؛ زمن العرض ليس زمن تفاعل مقاساً.";
  if (answered < 3)
    return `انتهى العرض التعليمي. أجب عن أسئلة التقويم الثلاثة.${mistakes ? " تذكر: الأخطاء فرصة لتفسير السبب، وليست عقوبة." : ""}`;
  if (correct < 2)
    return "أكملت المحاولة، لكن إجابات التقويم تشير إلى حاجة للمراجعة. اقرأ التفسيرات ثم أعد التقويم قبل الانتقال إلى تجربة أصعب.";
  return level === "beginner"
    ? "أحسنت إكمال خطوات التجربة. اقترح تجربة الذوبانية التالية: غيّر المذيب وراقب الفرق."
    : "اكتب استنتاجاً يستند إلى النتائج ثم احفظ تقريرك. جرّب الأسترة لإجراء مقارنة مع ضبط المتغيرات.";
}
