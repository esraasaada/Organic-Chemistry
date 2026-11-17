import { useEffect, useState } from "react";
import { questions } from "./data";
import "./learning.css";
type Props = { onEarn: (badge: string, points: number) => void };
type PuzzleProps = {
  onFinish: (points: number, total: number) => void;
  resetKey: number;
  expired: boolean;
};
const catalog = [
  [
    "⚛",
    "تحدي بناء الجزيئات",
    "Molecular Builder Challenge",
    "ركّب أجزاء جزيئية بالسحب أو النقر، وافحص اتصالها.",
  ],
  [
    "⌬",
    "غرفة الهروب العضوية",
    "Organic Chemistry Escape Room",
    "افتح ثلاثة أقفال بالوزن والتفسير والتسمية.",
  ],
  [
    "OH",
    "محقق المجموعات الوظيفية",
    "Functional Groups Detective",
    "حدّد المجموعة في الصيغة ثم استنتج العائلة.",
  ],
  [
    "⇄",
    "تحدي توقع التفاعلات",
    "Reaction Prediction Challenge",
    "توقع الناتج من المتفاعلات والشروط.",
  ],
  [
    "⇌",
    "مطابقة الجزيئات",
    "Molecule Matching Game",
    "صِل كل صيغة بنائية باسمها بالسحب أو اختيار زوج.",
  ],
  [
    "✦",
    "بطولة الكيمياء",
    "Chemistry Tournament",
    "ست جولات متدرجة من DOK1 إلى DOK3.",
  ],
];
function BuilderPuzzle({ onFinish, expired }: PuzzleProps) {
  const goals = [
    {
      name: "الإيثانول",
      parts: ["CH₃", "CH₂", "OH"],
      why: "اتصال CH₃–CH₂–OH يعطي كربونين ومجموعة كحول: C₂H₆O.",
    },
    {
      name: "حمض الإيثانويك",
      parts: ["CH₃", "COOH"],
      why: "مجموعة COOH كاملة متصلة بـCH₃: CH₃–COOH، وليست كحولاً.",
    },
    {
      name: "بروبان-١-ول",
      parts: ["CH₃", "CH₂", "CH₂", "OH"],
      why: "ثلاث ذرات كربون في سلسلة وOH طرفية: C₃H₈O.",
    },
  ];
  const [index, setIndex] = useState(0),
    [parts, setParts] = useState<string[]>([]),
    [feedback, setFeedback] = useState(""),
    [solved, setSolved] = useState(false),
    [score, setScore] = useState(0),
    [attempts, setAttempts] = useState(0);
  const goal = goals[index];
  const add = (part: string) => {
    if (solved || expired) return;
    if (parts.length >= goal.parts.length) {
      setFeedback("اللوحة ممتلئة. احذف جزءاً لتصحيح الاتصال.");
      return;
    }
    setParts([...parts, part]);
    setFeedback("");
  };
  const check = () => {
    if (expired) return;
    const ok = parts.join("|") === goal.parts.join("|");
    setAttempts((a) => a + 1);
    setSolved(ok);
    setFeedback(
      ok
        ? "الإجابة: " + goal.why
        : "الإجابة: ليست هذه البنية المطلوبة. اقرأ السلسلة من CH₃ ثم ضع المجموعة الطرفية الصحيحة.",
    );
  };
  return (
    <>
      <h3>
        المهمة {index + 1}/3: ابنِ {goal.name}
      </h3>
      <p>
        أجزاء مكثفة محددة وليست محرراً لأي بنية. اسحب الجزء إلى اللوحة أو اضغطه.
        اضغط جزءاً موضوعاً لحذفه.
      </p>
      <div className="fragment-bank">
        {["CH₃", "CH₂", "OH", "COOH", "CHO"].map((p) => (
          <button
            className="fragment"
            key={p}
            draggable={!expired && !solved}
            onDragStart={(e) => e.dataTransfer.setData("text/plain", p)}
            disabled={expired || solved}
            onClick={() => add(p)}
            aria-label={"أضف الجزء " + p}
          >
            {p}
          </button>
        ))}
      </div>
      <div
        className="build-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const p = e.dataTransfer.getData("text/plain");
          if (["CH₃", "CH₂", "OH", "COOH", "CHO"].includes(p)) add(p);
        }}
        aria-label="لوحة تركيب الجزيء"
      >
        <span dir="ltr">
          {parts.length
            ? parts.map((p, i) => (
                <span key={i}>
                  <button
                    disabled={solved || expired}
                    onClick={() => setParts(parts.filter((_, j) => j !== i))}
                    aria-label={`احذف الجزء ${i + 1}`}
                  >
                    {p}
                  </button>
                  {i < parts.length - 1 ? " — " : ""}
                </span>
              ))
            : "اسحب الأجزاء هنا أو اخترها من الأعلى"}
        </span>
      </div>
      <button
        className="button"
        disabled={solved || expired || !parts.length}
        onClick={check}
      >
        افحص البنية
      </button>{" "}
      <button
        disabled={solved || expired}
        onClick={() => {
          setParts([]);
          setFeedback("");
        }}
      >
        امسح اللوحة
      </button>
      {feedback && (
        <p className="feedback" role="status">
          {feedback}
        </p>
      )}
      {solved && (
        <button
          className="button"
          onClick={() => {
            const n = score + Math.max(20, 120 - attempts * 20);
            if (index === 2) onFinish(n, 300);
            else {
              setScore(n);
              setIndex(index + 1);
              setParts([]);
              setSolved(false);
              setAttempts(0);
              setFeedback("");
            }
          }}
        >
          {index === 2 ? "إنهاء التحدي" : "الجزيء التالي"}
        </button>
      )}
    </>
  );
}
function EscapePuzzle({ onFinish, expired }: PuzzleProps) {
  const [lock, setLock] = useState(0),
    [answer, setAnswer] = useState(""),
    [solved, setSolved] = useState(false),
    [attempts, setAttempts] = useState(0),
    [points, setPoints] = useState(0),
    [feedback, setFeedback] = useState("");
  const normalize = (v: string) =>
    v.trim().replace(/[إأآ]/g, "ا").replace(/\s+/g, "");
  const check = () => {
    const ok =
      lock === 0
        ? answer === "2" || answer === "٢"
        : lock === 1
          ? answer === "delocalized"
          : ["ايثانول", "ethanol"].includes(normalize(answer.toLowerCase()));
    setSolved(ok);
    setAttempts((a) => a + 1);
    setFeedback(
      ok
        ? [
            "الإجابة: معامل الأكسجين 2، لأن النواتج تحوي أربع ذرات O.",
            "الإجابة: إلكترونات π غير متمركزة في حلقة البنزين؛ صيغ الرنين ليست جزيئين متبادلين.",
            "الإجابة: الإيثانول. كربونان ومجموعة OH مرتبطة بكربون مشبع.",
          ][lock]
        : "الإجابة: لم يُفتح القفل. " +
            [
              "زن ذرات O في CO₂ + 2H₂O ثم حوّلها إلى جزيئات O₂.",
              "اختر وصفاً يفسر تكافؤ روابط البنزين دون حركة الذرات.",
              "الجذر إيث يدل على كربونين، واللاحقة ول تدل على كحول.",
            ][lock],
    );
  };
  return (
    <>
      <div className="escape-locks">
        {[0, 1, 2].map((n) => (
          <span
            className={n < lock || (n === lock && solved) ? "unlocked" : ""}
            key={n}
          >
            {n < lock || (n === lock && solved) ? "✓" : "🔒"} القفل {n + 1}
          </span>
        ))}
      </div>
      <h3>{["قفل الموازنة", "قفل الرنين", "قفل الهوية"][lock]}</h3>
      <p>
        {
          [
            "أدخل معامل O₂: CH₄ + ? O₂ → CO₂ + 2H₂O",
            "ما التفسير الصحيح لتكافؤ روابط C–C في البنزين؟",
            "سمِّ المركب CH₃–CH₂–OH بالعربية أو الإنجليزية.",
          ][lock]
        }
      </p>
      {lock === 1 ? (
        <select
          aria-label="تفسير الرنين"
          disabled={solved || expired}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        >
          <option value="">اختر تفسيراً</option>
          <option value="switching">تنتقل ذرات الكربون بين موقعين</option>
          <option value="delocalized">
            إلكترونات π غير متمركزة على الحلقة
          </option>
          <option value="triple">كل الروابط ثلاثية</option>
        </select>
      ) : (
        <input
          aria-label="رمز القفل"
          disabled={solved || expired}
          value={answer}
          inputMode={lock === 0 ? "numeric" : "text"}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={lock === 0 ? "عدد صحيح" : "اسم المركب"}
        />
      )}
      <button
        className="button"
        disabled={!answer || solved || expired}
        onClick={check}
      >
        افتح القفل
      </button>
      {feedback && (
        <p className="feedback" role="status">
          {feedback}
        </p>
      )}
      {solved && (
        <button
          className="button"
          onClick={() => {
            const n = points + Math.max(20, 120 - attempts * 20);
            if (lock === 2) onFinish(n, 300);
            else {
              setPoints(n);
              setLock(lock + 1);
              setAnswer("");
              setSolved(false);
              setAttempts(0);
              setFeedback("");
            }
          }}
        >
          {lock === 2 ? "اخرج من غرفة الهروب" : "انتقل للقفل التالي"}
        </button>
      )}
    </>
  );
}
const pairs = [
  ["CH₃–CH₂–OH", "الإيثانول"],
  ["CH₃–COOH", "حمض الإيثانويك"],
  ["CH₂=CH₂", "الإيثين"],
  ["CH₃–CO–CH₃", "البروبانون"],
];
function MatchingPuzzle({ onFinish, expired }: PuzzleProps) {
  const [selected, setSelected] = useState<number | null>(null),
    [matched, setMatched] = useState<number[]>([]),
    [mistakes, setMistakes] = useState(0),
    [feedback, setFeedback] = useState("");
  const connect = (right: number, left = selected) => {
    if (left === null || expired || matched.includes(left)) return;
    if (left === right) {
      const next = [...matched, left];
      setMatched(next);
      setSelected(null);
      setFeedback("الإجابة: " + pairs[left][0] + " هو " + pairs[left][1] + ".");
      if (next.length === pairs.length)
        onFinish(Math.max(80, 400 - mistakes * 20), 400);
    } else {
      setMistakes((m) => m + 1);
      setFeedback(
        "الإجابة: الزوج غير متوافق. افحص عدد الكربونات والمجموعة الوظيفية قبل المحاولة.",
      );
    }
  };
  return (
    <>
      <h3>صِل البنية باسمها</h3>
      <p>
        اسحب الصيغة إلى الاسم، أو اختر صيغة ثم اضغط الاسم. تدعم الأزرار Tab
        وEnter.
      </p>
      <div className="matching-board">
        <div>
          {pairs.map(([formula], i) => (
            <button
              className={"match-token " + (selected === i ? "selected" : "")}
              key={formula}
              disabled={expired || matched.includes(i)}
              draggable={!expired && !matched.includes(i)}
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "application/x-chemistry-pair",
                  String(i),
                );
                setSelected(i);
              }}
              onClick={() => setSelected(i)}
            >
              {matched.includes(i) ? "✓ " : ""}
              <bdi>{formula}</bdi>
            </button>
          ))}
        </div>
        <div>
          {[2, 0, 3, 1].map((i) => (
            <button
              className="match-target"
              key={i}
              disabled={expired || matched.includes(i)}
              onClick={() => connect(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const raw = e.dataTransfer.getData(
                  "application/x-chemistry-pair",
                );
                if (raw !== "") {
                  const left = Number(raw);
                  if (Number.isInteger(left) && left >= 0 && left < 4)
                    connect(i, left);
                }
              }}
            >
              {pairs[i][1]}
              {matched.includes(i) ? " ✓" : ""}
            </button>
          ))}
        </div>
      </div>
      <p>أزواج صحيحة: {matched.length}/4</p>
      {feedback && (
        <p className="feedback" role="status">
          {feedback}
        </p>
      )}
    </>
  );
}
function DetectivePuzzle({ onFinish, expired }: PuzzleProps) {
  const cases = [
    {
      parts: ["CH₃", "CH₂", "OH"],
      group: 2,
      family: 0,
      why: "OH مرتبطة بكربون مشبع؛ هذه مجموعة كحول.",
    },
    {
      parts: ["CH₃", "C(=O)–OH"],
      group: 1,
      family: 1,
      why: "الكربوكسيل C(=O)OH وحدة كاملة. لا تُصنّف OH داخل الحمض ككحول.",
    },
    {
      parts: ["CH₃", "C(=O)", "CH₃"],
      group: 1,
      family: 2,
      why: "كربونيل بين مجموعتين كربونيتين يحدد الكيتون.",
    },
    {
      parts: ["CH₃", "C(=O)–O", "CH₃"],
      group: 1,
      family: 3,
      why: "أكسجين الإستر متصل بكربون الكربونيل وبمجموعة كربونية.",
    },
  ];
  const [index, setIndex] = useState(0),
    [picked, setPicked] = useState<number | null>(null),
    [choice, setChoice] = useState<number | null>(null),
    [feedback, setFeedback] = useState(""),
    [mistakes, setMistakes] = useState(0),
    [score, setScore] = useState(0);
  const item = cases[index],
    families = ["كحول", "حمض كربوكسيلي", "كيتون", "إستر"];
  return (
    <>
      <h3>ملف القضية {index + 1}/4</h3>
      <p>
        ١. اضغط الجزء الذي يحدد هوية المركب. ٢. اختر العائلة من الدليل. الرسم
        يوضح اتصال مجموعات مكثفة، وليس شكلاً فراغياً.
      </p>
      <div className="fragment-bank">
        {item.parts.map((part, i) => (
          <button
            className={"fragment " + (picked === i ? "selected" : "")}
            key={i}
            disabled={expired || choice !== null}
            aria-label={"حدد المجموعة " + part}
            onClick={() => {
              setPicked(i);
              if (i !== item.group) {
                setMistakes((m) => m + 1);
                setFeedback(
                  "الإجابة: هذا الجزء وحده لا يحدد العائلة. ابحث عن المجموعة المحتوية على الأكسجين كاملة.",
                );
              } else
                setFeedback(
                  "تم تحديد المجموعة المميزة. ما العائلة التي تنتمي إليها؟",
                );
            }}
          >
            {part}
            {i < item.parts.length - 1 ? " —" : ""}
          </button>
        ))}
      </div>
      {picked === item.group && (
        <div className="mini-options">
          {families.map((family, i) => (
            <button
              className="button secondary"
              key={family}
              disabled={expired || choice !== null}
              onClick={() => {
                setChoice(i);
                setFeedback(
                  "الإجابة: " + families[item.family] + ". " + item.why,
                );
                if (i !== item.family) setMistakes((m) => m + 1);
              }}
            >
              {family}
            </button>
          ))}
        </div>
      )}
      {feedback && (
        <p className="feedback" role="status">
          {feedback}
        </p>
      )}
      {choice !== null && (
        <button
          className="button"
          onClick={() => {
            const points =
              choice === item.family ? Math.max(20, 100 - mistakes * 20) : 0;
            const n = score + points;
            if (index === 3) onFinish(n, 400);
            else {
              setIndex(index + 1);
              setScore(n);
              setPicked(null);
              setChoice(null);
              setFeedback("");
              setMistakes(0);
            }
          }}
        >
          {index === 3 ? "إنهاء التحدي" : "القضية التالية"}
        </button>
      )}
    </>
  );
}
type Question = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  dok?: number;
};
const reactions: Question[] = [
  {
    prompt: "CH₂=CH₂ + H₂، بوجود حفاز مناسب. توقع الناتج.",
    options: ["CH₃–CH₃", "HC≡CH", "CH₃OH"],
    answer: 0,
    explanation:
      "تضاف ذرتا H عبر الرابطة الثنائية، فتتكون رابطة C–C أحادية في الإيثان.",
  },
  {
    prompt: "CH₃COOH + C₂H₅OH ⇌ ؟ + H₂O، بحفاز حمضي.",
    options: ["CH₃COOC₂H₅", "CH₃CHO", "CH₄"],
    answer: 0,
    explanation:
      "الأسترة تعطي إيثانوات الإيثيل وماء؛ التفاعل اتزاني ولا يكتمل بالضرورة.",
  },
  {
    prompt: "CH₄ + Cl₂ تحت ضوء مناسب: ناتج الاستبدال الأحادي؟",
    options: ["CH₃Cl + HCl", "CH₃–CH₃", "CO₂ + H₂O"],
    answer: 0,
    explanation:
      "تحل Cl محل H، فيتكون كلوروميثان وHCl؛ قد يحدث استبدال إضافي في المزيج الحقيقي.",
  },
  {
    prompt: "أكسدة CH₃–CH(OH)–CH₃ في الشروط المعتادة تعطي…",
    options: ["CH₃–CO–CH₃", "CH₃COOH", "CH₂=CH₂"],
    answer: 0,
    explanation: "الكحول الثانوي يتأكسد إلى كيتون؛ هنا بروبانون.",
  },
];
const detective: Question[] = [
  {
    prompt: "في CH₃–CH₂–OH، ما المجموعة المميزة؟",
    options: ["–OH على كربون مشبع: كحول", "–COOH: حمض", "–CHO: ألدهيد"],
    answer: 0,
    explanation: "الهيدروكسيل مرتبط بكربون مشبع؛ لذلك المركب كحول.",
  },
  {
    prompt: "في CH₃–C(=O)–OH، ما المجموعة الكاملة؟",
    options: ["–COOH: حمض كربوكسيلي", "–OH فقط: كحول", "–CO–: كيتون"],
    answer: 0,
    explanation:
      "OH هنا جزء من الكربوكسيل؛ يجب قراءة الاتصال كاملاً، فلا يصنف كحولاً.",
  },
  {
    prompt: "في CH₃–C(=O)–CH₃، أين الدليل؟",
    options: [
      "C=O بين مجموعتين كربونيتين: كيتون",
      "C=O طرفي متصل بـH: ألدهيد",
      "O بين كربونين: إيثر",
    ],
    answer: 0,
    explanation: "الكربونيل الداخلي المتصل بمجموعتين كربونيتين يحدد الكيتون.",
  },
  {
    prompt: "في CH₃–C(=O)–O–CH₃، حدد البصمة.",
    options: ["–C(=O)–O–C: إستر", "–C(=O)–H: ألدهيد", "–OH: كحول"],
    answer: 0,
    explanation: "أكسجين الإستر مرتبط بكربون الكربونيل وبمجموعة كربونية.",
  },
];
function shuffled<T>(a: T[]) {
  return [...a]
    .map((value) => ({ value, key: Math.random() }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.value);
}
function QuizPuzzle({
  onFinish,
  expired,
  kind,
}: {
  onFinish: PuzzleProps["onFinish"];
  expired: boolean;
  kind: number;
}) {
  const [items] = useState<Question[]>(() =>
    kind === 5
      ? [1, 2, 3].flatMap((dok) =>
          shuffled(questions.filter((q) => q.dok === dok)).slice(0, 2),
        )
      : shuffled(kind === 2 ? detective : reactions).map((q) => {
          const opts = shuffled(
            q.options.map((text, i) => ({ text, correct: i === q.answer })),
          );
          return {
            ...q,
            options: opts.map((o) => o.text),
            answer: opts.findIndex((o) => o.correct),
          };
        }),
  );
  const [index, setIndex] = useState(0),
    [choice, setChoice] = useState<number | null>(null),
    [score, setScore] = useState(0);
  const item = items[index];
  return (
    <>
      <span className="eyebrow">
        جولة {index + 1}/{items.length} · DOK {item.dok || 2}
      </span>
      <h3>{item.prompt}</h3>
      {kind === 2 && (
        <div className="detective-lens" aria-hidden="true">
          ⌕ <bdi>{item.prompt.split("،")[0].replace("في ", "")}</bdi>
        </div>
      )}
      <div className="answer-options">
        {item.options.map((option, i) => (
          <button
            className={"button secondary " + (choice === i ? "selected" : "")}
            key={option}
            disabled={choice !== null || expired}
            onClick={() => setChoice(i)}
          >
            {option}
          </button>
        ))}
      </div>
      {choice !== null && (
        <div className="feedback" role="status">
          <strong>{choice === item.answer ? "صحيح!" : "فرصة للتعلم"}</strong>
          <p>الإجابة: {item.options[item.answer]}</p>
          <p>{item.explanation}</p>
          <button
            className="button"
            onClick={() => {
              const n = score + (choice === item.answer ? 100 : 0);
              if (index === items.length - 1) onFinish(n, items.length * 100);
              else {
                setIndex(index + 1);
                setChoice(null);
                setScore(n);
              }
            }}
          >
            {index === items.length - 1 ? "إنهاء التحدي" : "التالي"}
          </button>
        </div>
      )}
    </>
  );
}
export default function Games({ onEarn }: Props) {
  const [game, setGame] = useState<number | null>(null),
    [timer, setTimer] = useState(false),
    [seconds, setSeconds] = useState(180),
    [result, setResult] = useState<{ points: number; total: number } | null>(
      null,
    ),
    [round, setRound] = useState(0);
  useEffect(() => {
    if (!timer || game === null || result || seconds <= 0) return;
    const handle = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(handle);
  }, [timer, game, result, seconds]);
  const start = (id: number) => {
    setGame(id);
    setSeconds(id === 5 ? 300 : 180);
    setResult(null);
    setRound((x) => x + 1);
  };
  const finish = (points: number, total: number) => {
    if (result) return;
    setResult({ points, total });
    if (points / total >= 0.7) onEarn(catalog[game!][1], points);
  };
  if (game === null)
    return (
      <section className="learning-games">
        <div className="card">
          <span className="eyebrow">ACADEMY CHALLENGES / 3.0</span>
          <h2>المعرفة تصبح مهارة عندما تستخدمها</h2>
          <p>
            ست ألعاب مختلفة: بناء واتصال ومطابقة وأقفال وتوقعات وبطولة. تحصل على
            شارة عند تحقيق 70%؛ أخطاء المحاولة في البناء والأقفال والمطابقة تقلل
            النقاط دون منع التعلم.
          </p>
          <label>
            <input
              type="checkbox"
              checked={timer}
              onChange={(e) => setTimer(e.target.checked)}
            />{" "}
            مؤقت اختياري لكل لعبة: ٣ دقائق، والبطولة ٥ دقائق
          </label>
        </div>
        <div className="grid">
          {catalog.map(([icon, title, en, desc], i) => (
            <article className="card game-entry" key={title}>
              <span className="game-icon">{icon}</span>
              <small>{en}</small>
              <h3>{title}</h3>
              <p>{desc}</p>
              <button className="button" onClick={() => start(i)}>
                ابدأ التحدي
              </button>
            </article>
          ))}
        </div>
      </section>
    );
  return (
    <section className="card learning-games">
      <div className="game-session-heading">
        <div>
          <span className="eyebrow">{catalog[game][2]}</span>
          <h2>{catalog[game][1]}</h2>
        </div>
        {timer && (
          <span className="timer" role="timer" aria-label="الوقت المتبقي">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
        )}
      </div>
      {result ? (
        <div className="game-result">
          <span>✦</span>
          <h3>
            {result.points}/{result.total} نقطة —{" "}
            {Math.round((result.points / result.total) * 100)}%
          </h3>
          <p>
            {result.points / result.total >= 0.7
              ? "اكتسبت شارة الإنجاز وحُفظت نقاطك."
              : "استفد من التفسيرات ثم أعد اللعب؛ تحتاج 70% للشارة."}
          </p>
          <button className="button" onClick={() => start(game)}>
            العب مرة أخرى
          </button>
        </div>
      ) : (
        <>
          {game === 0 ? (
            <BuilderPuzzle
              key={round}
              resetKey={round}
              expired={seconds <= 0 && timer}
              onFinish={finish}
            />
          ) : game === 1 ? (
            <EscapePuzzle
              key={round}
              resetKey={round}
              expired={seconds <= 0 && timer}
              onFinish={finish}
            />
          ) : game === 2 ? (
            <DetectivePuzzle
              key={round}
              resetKey={round}
              expired={seconds <= 0 && timer}
              onFinish={finish}
            />
          ) : game === 4 ? (
            <MatchingPuzzle
              key={round}
              resetKey={round}
              expired={seconds <= 0 && timer}
              onFinish={finish}
            />
          ) : (
            <QuizPuzzle
              key={round}
              kind={game}
              expired={seconds <= 0 && timer}
              onFinish={finish}
            />
          )}{" "}
          {timer && seconds <= 0 && (
            <div role="alert" className="feedback">
              <h3>انتهى الوقت</h3>
              <p>
                يمكنك إعادة اللعبة أو إلغاء المؤقت من قائمة الألعاب. لم تُسجل
                شارة لهذه المحاولة غير المكتملة.
              </p>
              <button className="button" onClick={() => start(game)}>
                محاولة جديدة
              </button>
            </div>
          )}
        </>
      )}
      <button
        className="button secondary"
        style={{ marginTop: 22 }}
        onClick={() => setGame(null)}
      >
        العودة إلى الألعاب
      </button>
    </section>
  );
}
