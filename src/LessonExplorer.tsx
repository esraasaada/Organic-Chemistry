import { useState } from "react";
import { questions } from "./data";
import "./learning.css";
const examples = [
  [
    "كيف يكوّن الكربون الميثان؟",
    "ذرة C لها أربعة إلكترونات تكافؤ؛ تتشارك أربع أزواج إلكترونية مع أربع ذرات H. الصيغة CH₄، ومجموع رتب الروابط حول C يساوي 4.",
  ],
  [
    "هل C₂H₆O هيدروكربون؟",
    "لا؛ الهيدروكربون يحوي C وH فقط. وجود O يستبعد التصنيف، حتى مع وجود الكربون والهيدروجين.",
  ],
  [
    "صيغة ألكان مفتوح يحوي 4 كربونات",
    "نطبق H=2n+2 ضمن السلاسل المشبعة غير الحلقية: H=2×4+2=10. إذن C₄H₁₀، وقد تمثل بيوتاناً أو 2-ميثيل بروبان.",
  ],
  [
    "تسمية CH₂=CH–CH₂–CH₃",
    "أطول سلسلة تضم الثنائية فيها 4 كربونات. نرقّم من طرف الثنائية لإعطائها 1 بدلاً من 3. الاسم: بيوت-1-ين.",
  ],
  [
    "هدرجة الإيثاين حتى الإيثان",
    "C₂H₂ + 2H₂ → C₂H₆. تنخفض رتبة C–C من ثلاثية إلى أحادية وتُضاف أربع ذرات H. الانتقائية الجزئية تحتاج شروطاً مناسبة.",
  ],
  [
    "لماذا لا يكفي رسم ثلاث ثنائيات للبنزين؟",
    "C₆H₆ حلقة ذات ستة إلكترونات π غير متمركزة؛ روابط C–C متكافئة تقريباً. رسم الدائرة أو صيغ كيكوله وسائل لوصف البنية الفعلية، وليست بنى تتناوب زمنياً.",
  ],
  [
    "هل OH في CH₃COOH تعني أنه كحول؟",
    "لا. افحص الجوار: OH مرتبطة بكربون يحمل C=O، فتكوّن –COOH كاملة. هذه مجموعة حمض كربوكسيلي. في الإيثانول ترتبط OH بكربون مشبع.",
  ],
  [
    "وزن احتراق الإيثانول الكامل",
    "C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O. نزن C ثم H ثم O، ونحسب ذرة O الموجودة أصلاً في الكحول.",
  ],
];
const singleFormula = (symbol: string, n: number) =>
  n === 1 ? symbol : symbol + n;
const familyModels: Record<
  string,
  { name: string; left: string; group: string; right?: string; marker: string }
> = {
  alcohol: { name: "الكحول", left: "CH₃–CH₂", group: "OH", marker: "OH" },
  acid: {
    name: "الحمض الكربوكسيلي",
    left: "CH₃",
    group: "C(=O)–OH",
    marker: "COOH",
  },
  aldehyde: { name: "الألدهيد", left: "CH₃", group: "C(=O)–H", marker: "CHO" },
  ketone: {
    name: "الكيتون",
    left: "CH₃",
    group: "C(=O)",
    right: "CH₃",
    marker: "C=O",
  },
  ester: {
    name: "الإستر",
    left: "CH₃",
    group: "C(=O)–O",
    right: "CH₃",
    marker: "COO",
  },
};
function Diagram({
  lessonId,
  order,
  ring,
  n,
  family,
}: {
  lessonId: number;
  order: number;
  ring: boolean;
  n: number;
  family: string;
}) {
  const functional = lessonId === 7,
    chainLength = lessonId >= 3 && lessonId <= 5 ? n : 2;
  const chainOrder =
    lessonId === 3 ? 1 : lessonId === 4 ? 2 : lessonId === 5 ? 3 : order;
  const bondOrders = Array.from({ length: chainLength - 1 }, (_, i) =>
    i === 0 ? chainOrder : 1,
  );
  const hydrogen = Array.from(
    { length: chainLength },
    (_, i) => 4 - (bondOrders[i - 1] || 0) - (bondOrders[i] || 0),
  );
  const subscripts = ["", "", "₂", "₃"];
  const groups = hydrogen.map((h) => "C" + (h ? "H" + subscripts[h] : ""));
  const structure = groups
    .map(
      (g, i) =>
        g +
        (i < chainLength - 1
          ? bondOrders[i] === 1
            ? "–"
            : bondOrders[i] === 2
              ? "="
              : "≡"
          : ""),
    )
    .join("");
  const f = familyModels[family] || familyModels.alcohol;
  const label =
    lessonId === 6
      ? "رسم حلقة البنزين وصيغ الرنين"
      : functional
        ? `صيغة بنائية لعائلة ${f.name}: ${f.left}–${f.group}${f.right ? "–" + f.right : ""}؛ المجموعة ${f.marker} مظللة`
        : `سلسلة مفتوحة من ${chainLength} ذرات كربون: ${structure}`;
  return (
    <svg
      className="science-diagram"
      viewBox="0 0 600 180"
      role="img"
      aria-label={label}
    >
      {lessonId === 6 ? (
        <>
          <polygon
            points="300,25 350,55 350,115 300,145 250,115 250,55"
            fill="none"
            stroke="#8ce5dd"
            strokeWidth="4"
          />
          {ring ? (
            <circle
              cx="300"
              cy="85"
              r="36"
              fill="none"
              stroke="#b5a0ff"
              strokeWidth="3"
            />
          ) : (
            <g stroke="#b5a0ff" strokeWidth="3">
              <line x1="297" y1="38" x2="338" y2="62" />
              <line x1="338" y1="111" x2="300" y2="133" />
              <line x1="262" y1="108" x2="262" y2="61" />
            </g>
          )}
          <text x="405" y="90" fill="#c1cde1" fontSize="17">
            C₆H₆
          </text>
        </>
      ) : functional ? (
        <>
          <text x="130" y="95" fill="#b5d9ee" textAnchor="middle" fontSize="25">
            {f.left}
          </text>
          <line
            x1="198"
            y1="85"
            x2="230"
            y2="85"
            stroke="#a2c3d4"
            strokeWidth="3"
          />
          <rect
            x="230"
            y="53"
            width="200"
            height="62"
            rx="12"
            fill="#d375a72b"
            stroke="#eaa0cc"
          />
          <text x="330" y="95" fill="#ffc1dc" textAnchor="middle" fontSize="25">
            {f.group}
          </text>
          {f.right && (
            <>
              <line
                x1="430"
                y1="85"
                x2="465"
                y2="85"
                stroke="#a2c3d4"
                strokeWidth="3"
              />
              <text
                x="510"
                y="95"
                fill="#b5d9ee"
                textAnchor="middle"
                fontSize="25"
              >
                {f.right}
              </text>
            </>
          )}
          <text
            x="300"
            y="150"
            fill="#9daec8"
            textAnchor="middle"
            fontSize="13"
          >
            المجموعة المميزة لعائلة {f.name} مظللة: {f.marker}
          </text>
        </>
      ) : (
        <>
          {bondOrders.map((rank, i) => {
            const start = 50 + (i * 500) / (chainLength - 1),
              end = start + 500 / (chainLength - 1);
            return (
              <g key={i} stroke="#9bb9d0" strokeWidth="3">
                {Array.from({ length: rank }, (_, j) => (
                  <line
                    key={j}
                    x1={start + 27}
                    y1={80 + (j - (rank - 1) / 2) * 8}
                    x2={end - 27}
                    y2={80 + (j - (rank - 1) / 2) * 8}
                  />
                ))}
              </g>
            );
          })}
          {groups.map((g, i) => (
            <g key={i}>
              <circle
                cx={50 + (i * 500) / (chainLength - 1)}
                cy="80"
                r="27"
                fill="#285e73"
              />
              <text
                x={50 + (i * 500) / (chainLength - 1)}
                y="87"
                textAnchor="middle"
                fill="#e5faff"
                fontSize={chainLength > 5 ? 18 : 22}
              >
                {g}
              </text>
              <text
                x={50 + (i * 500) / (chainLength - 1)}
                y="124"
                textAnchor="middle"
                fill="#789ab0"
                fontSize="10"
              >
                C{i + 1}
              </text>
            </g>
          ))}
          <text
            x="300"
            y="158"
            textAnchor="middle"
            fill="#9daec8"
            fontSize="12"
          >
            مجموعات مكثفة توضح الاتصال؛ التخطيط الخطي لا يمثل زوايا الروابط أو
            الشكل الفراغي
          </text>
        </>
      )}
    </svg>
  );
}
export default function LessonExplorer({
  lessonId,
  level,
}: {
  lessonId: number;
  level: string;
}) {
  const [n, setN] = useState(2),
    [order, setOrder] = useState(lessonId === 4 ? 2 : lessonId === 5 ? 3 : 1),
    [ring, setRing] = useState(true),
    [family, setFamily] = useState("alcohol"),
    [choice, setChoice] = useState<number | null>(null),
    [answers, setAnswers] = useState<Record<string, number>>({});
  const ex = examples[lessonId - 1] || examples[0];
  const h = lessonId === 3 ? 2 * n + 2 : lessonId === 4 ? 2 * n : 2 * n - 2;
  const senQuestion =
    lessonId === 2
      ? "أي صيغة تتكون من C وH فقط؟"
      : lessonId === 7
        ? "أي رمز يحدد الحمض الكربوكسيلي؟"
        : "أي رمز يمثل رابطة ثنائية؟";
  const senOptions =
    lessonId === 2
      ? ["C₂H₆", "C₂H₆O"]
      : lessonId === 7
        ? ["–COOH", "–OH"]
        : ["C=C", "C–C"];
  const senWhy =
    lessonId === 2
      ? "الهيدروكربون يتكون من C وH فقط."
      : lessonId === 7
        ? "مجموعة COOH كاملة تحدد الحمض، ولا يكفي النظر إلى OH وحدها."
        : "خطّان بين C وC يعنيان رابطة ثنائية.";
  const bank = [1, 2, 3]
    .map((dok) => questions.find((q) => q.lesson === lessonId && q.dok === dok))
    .filter((q): q is NonNullable<typeof q> => !!q);
  return (
    <section className="lesson-explorer">
      <span className="eyebrow">تعلّم بصرياً / استكشف وفسّر</span>
      <h3>من الفكرة إلى الدليل</h3>
      <Diagram
        lessonId={lessonId}
        order={order}
        ring={ring}
        n={n}
        family={family}
      />
      <div className="explorer-control">
        {lessonId >= 3 && lessonId <= 5 ? (
          <>
            <label>
              عدد ذرات الكربون n: {n}
              <input
                aria-label="عدد ذرات الكربون للاستكشاف"
                type="range"
                min="2"
                max="8"
                step="1"
                value={n}
                onChange={(e) => setN(+e.target.value)}
              />
            </label>
            <div className="explorer-value">
              {singleFormula("C", n)}
              {singleFormula("H", h)}
            </div>
            <p>
              {lessonId === 3
                ? "CnH₂n₊₂: سلسلة مشبعة مفتوحة، بلا حلقات."
                : lessonId === 4
                  ? "CnH₂n: سلسلة مفتوحة برابطة ثنائية واحدة."
                  : "CnH₂n₋₂: سلسلة مفتوحة برابطة ثلاثية واحدة."}{" "}
              الصيغة الجزيئية لا تحدد متماكباً واحداً.
            </p>
          </>
        ) : lessonId === 6 ? (
          <>
            <button onClick={() => setRing(!ring)}>
              {ring ? "اعرض صيغة كيكوله الحدية" : "اعرض دائرة عدم التمركز"}
            </button>
            <p>
              نبدّل طريقة الرسم فقط؛ لا تتبدل الروابط الفعلية زمنياً بين
              الرسمين.
            </p>
          </>
        ) : lessonId === 7 ? (
          <>
            <label>
              اختر المجموعة
              <select
                value={family}
                onChange={(e) => setFamily(e.target.value)}
              >
                <option value="alcohol">الكحول</option>
                <option value="acid">الحمض الكربوكسيلي</option>
                <option value="aldehyde">الألدهيد</option>
                <option value="ketone">الكيتون</option>
                <option value="ester">الإستر</option>
              </select>
            </label>
            <div className="explorer-value">
              {
                {
                  alcohol: "R–OH",
                  acid: "R–C(=O)–OH",
                  aldehyde: "R–C(=O)–H",
                  ketone: "R–C(=O)–R′",
                  ester: "R–C(=O)–O–R′",
                }[family]
              }
            </div>
            <p>
              افحص الذرات المتصلة بكربون الكربونيل أو بالأكسجين؛ وجود العناصر
              وحده لا يحدد العائلة.
            </p>
          </>
        ) : (
          <>
            <label>
              رتبة الرابطة بين الكربونين
              <select
                aria-label="رتبة الرابطة في الرسم"
                value={order}
                onChange={(e) => setOrder(+e.target.value)}
              >
                <option value="1">أحادية</option>
                <option value="2">ثنائية</option>
                <option value="3">ثلاثية</option>
              </select>
            </label>
            <div className="explorer-value">
              {order === 1 ? "C₂H₆" : order === 2 ? "C₂H₄" : "C₂H₂"}
            </div>
            <p>
              كلما ازدادت رتبة C–C قلّ عدد H اللازم لإكمال تكافؤ الكربون في هذه
              الأمثلة البسيطة.{" "}
              {lessonId === 8
                ? "تستطيع الإضافة تقليل رتبة الرابطة مع إضافة ذرات عبرها."
                : ""}
            </p>
          </>
        )}
      </div>
      <h3>مثال محلول: {ex[0]}</h3>
      <p className="solved-example">{ex[1]}</p>
      <div className="sen-block">
        <span className="eyebrow">خطوة صغيرة / SEN</span>
        <p>{senQuestion}</p>
        <div className="mini-options">
          {senOptions.map((text, i) => (
            <button key={text} onClick={() => setChoice(i)}>
              {text}
            </button>
          ))}
        </div>
        {choice !== null && (
          <p role="status" className="feedback">
            {choice === 0 ? "✓ أحسنت. " : "حاول ملاحظة الرمز كاملاً. "}
            {senWhy}
          </p>
        )}
      </div>
      <h3 style={{ marginTop: 24 }}>تدرّج في التفكير</h3>
      {bank
        .filter((q) => level !== "beginner" || q.dok === 1)
        .map((q) => (
          <details key={q.id}>
            <summary>
              DOK {q.dok} —{" "}
              {q.dok === 1
                ? "تذكر وافهم"
                : q.dok === 2
                  ? "طبّق وقارن"
                  : "حلّل وبرّر"}
            </summary>
            <p>{q.prompt}</p>
            <div className="mini-options">
              {q.options
                .map((text, i) => ({ text, i }))
                .filter(
                  (o) =>
                    level !== "beginner" ||
                    o.i === q.answer ||
                    o.i === q.options.findIndex((_, i) => i !== q.answer),
                )
                .map(({ text, i }) => (
                  <button
                    disabled={answers[q.id] !== undefined}
                    key={text}
                    onClick={() => setAnswers({ ...answers, [q.id]: i })}
                  >
                    {text}
                  </button>
                ))}
            </div>
            {answers[q.id] !== undefined && (
              <p className="feedback" role="status">
                {answers[q.id] === q.answer
                  ? "صحيح. "
                  : "الإجابة الصحيحة: " + q.options[q.answer] + ". "}
                {q.explanation}
              </p>
            )}
          </details>
        ))}
      <a className="lab-link" href="#lab">
        اختبر الفكرة في المختبر الافتراضي ←
      </a>
      <p>
        <small>
          النشاط استكشاف تعليمي؛ نتيجته لا تُحتسب درجة اختبار الدرس. أكمل
          الاختبار الختامي لاعتماد إنجازك.
        </small>
      </p>
    </section>
  );
}
