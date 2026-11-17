import {
  addition,
  bromine,
  combustion,
  esterification,
  fuels,
} from "./experiments";

export type ExperimentId =
  | "combustion"
  | "bromine"
  | "addition"
  | "ester"
  | "solubility"
  | "physical"
  | "polymer"
  | "functional";
export type Inputs = Record<string, number | string | boolean>;
export type LabQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};
export type ExperimentSpec = {
  id: ExperimentId;
  title: string;
  objective: string;
  tools: string[];
  instructions: string[];
  limits: string;
  questions: LabQuestion[];
};
export type SimulationResult = {
  equation?: string;
  summary: string;
  explanation: string;
  metrics: { label: string; value: string | number; unit?: string }[];
  color: string;
  modelKey?: string;
  highlight?: string[];
  chart?: { label: string; value: number }[];
  warnings: string[];
  details?: Record<string, number>;
};
const q = (
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
): LabQuestion => ({ prompt, options, answer, explanation });
export const experimentSpecs: ExperimentSpec[] = [
  {
    id: "combustion",
    title: "احتراق الهيدروكربونات",
    objective: "تفسير أثر كمية الأكسجين في النواتج مع التحقق من حفظ الذرات.",
    tools: ["heater", "cylinder", "flask"],
    instructions: [
      "انقل أداة التسخين والدورق وأداة القياس إلى الطاولة.",
      "اختر الوقود وحدّد الأكسجين لكل مول وقود.",
      "توقع النواتج، شغّل، ثم قارن بين حالتين في الدفتر.",
    ],
    limits:
      "نموذج حصيلة موزون لا يحاكي اللهب الحقيقي: يتحول H إلى ماء، ثم يتوزع الأكسجين الباقي على CO₂/CO/C. يتقيد O₂ بمجال هذا الافتراض، ولا يحاكي الحركية أو كل النواتج.",
    questions: [
      q(
        "عند اكتمال الاحتراق يتحول الكربون إلى…",
        ["CO₂", "CO", "C"],
        0,
        "وفرة الأكسجين المناسبة تسمح بأكسدة الكربون إلى CO₂.",
      ),
      q(
        "ظهور CO أو الكربون الصلب يدل هنا على…",
        ["نقص الأكسجين", "تكوّن ملح", "قياس حرارة"],
        0,
        "قد ينشأ CO والسناج عند الاحتراق غير الكامل؛ CO غاز سام.",
      ),
      q(
        "ما الذي يجب أن يبقى متساوياً في طرفي المعادلة؟",
        ["عدد ذرات كل عنصر", "عدد الجزيئات دائماً", "لون اللهب"],
        0,
        "تُحفظ ذرات C وH وO في الحصيلة الموزونة.",
      ),
    ],
  },
  {
    id: "bromine",
    title: "اختبار ماء البروم",
    objective: "ربط استهلاك البروم بعدد مكافئات الإضافة ووجود عدم التشبع.",
    tools: ["tube", "pipette", "cylinder"],
    instructions: [
      "انقل أنبوباً وماصة وأداة القياس إلى الطاولة.",
      "اختر العينة وكمية المادة وأضف جرعة الكاشف.",
      "راقب البروم المتبقي؛ جرّب جرعة أكبر وفسّر استمرار اللون.",
    ],
    limits:
      "اللون مؤشر تعليمي متناسب مع نسبة Br₂ المتبقية وليس امتصاصاً ضوئياً مقاساً. نموذج الإضافة مبسط؛ في الماء قد تتكون بروموهيدرينات، وقد تستهلك مركبات أخرى الكاشف. الإيثان دون ضوء UV.",
    questions: [
      q(
        "لماذا قد يبقى اللون مع الإيثين؟",
        ["وجود بروم زائد عن سعة العينة", "الإيثين ألكان", "لا توجد ذرات كربون"],
        0,
        "يستهلك مول الإيثين مول Br₂ واحداً في نموذج الإضافة؛ الكاشف الزائد يبقى.",
      ),
      q(
        "مول الإيثاين يستهلك حتى كم مول Br₂ عند الإضافة الكاملة؟",
        ["اثنين", "واحد فقط دائماً", "ثلاثة"],
        0,
        "تتيح الثلاثية إضافتين متتاليتين، أي مكافئين من Br₂.",
      ),
      q(
        "هل زوال اللون يحدد هوية مركب بعينه؟",
        ["لا؛ يلزم سياق وأدلة أخرى", "نعم، الإيثين وحده", "نعم، البنزين وحده"],
        0,
        "الاختبار ليس حصرياً ولا يكفي لتعيين هوية جزيء.",
      ),
    ],
  },
  {
    id: "addition",
    title: "تفاعلات الإضافة",
    objective:
      "تتبع تغير الروابط وتحديد المتفاعل المحدِّد عند إضافة H₂ أو Br₂.",
    tools: ["flask", "cylinder", "heater"],
    instructions: [
      "اختر الإيثين أو البروبين، ثم H₂ أو Br₂.",
      "حدّد كمية الألكين والمادة المضافة.",
      "شغّل وتتبّع انخفاض الثنائية إلى أحادية؛ افحص نموذج الناتج.",
    ],
    limits:
      "الحصيلة الستوكيومترية تفترض إتمام التفاعل الممكن. شريط التقدم تسلسل تعليمي وليس زمناً مقاساً. هدرجة حفزية تحت شروط مناسبة؛ إضافة البروم مرسومة لنموذج مبسط غير مائي.",
    questions: [
      q(
        "كم مول H₂ يلزم لهدرجة مول إيثين؟",
        ["واحد", "اثنان", "ثلاثة"],
        0,
        "C₂H₄ + H₂ → C₂H₆ بنسبة مولية 1:1.",
      ),
      q(
        "أي رابطة تبقى بين الكربونين بعد الإضافة؟",
        ["رابطة σ أحادية", "رابطة π فقط", "لا رابطة"],
        0,
        "تُستهلك π وتبقى σ مع تكوّن رابطتين جديدتين.",
      ),
      q(
        "عند وجود 2 مول ألكين و1 مول Br₂، ما المحدِّد؟",
        ["Br₂", "الألكين", "المحفز"],
        0,
        "كل مول ألكين أحادي الثنائية يحتاج مول Br₂؛ لا يكفي البروم إلا لتحويل مول واحد.",
      ),
    ],
  },
  {
    id: "ester",
    title: "الأسترة والاتزان",
    objective: "تمييز أثر تركيب المزيج عن دور الحفاز في اتزان الأسترة.",
    tools: ["flask", "pipette", "heater", "cylinder"],
    instructions: [
      "اختر الحمض والكحول وكمياتهما الابتدائية.",
      "اضبط الماء الابتدائي وما يُزال منه قبل الاتزان.",
      "قارن كمية الإستر عند الاتزان مع الحفاز وبدونه.",
    ],
    limits:
      "نموذج محلول مثالي افتراضي A+B⇌E+W مع K=4 تعليمي بلا وحدات، وليس ثابتاً مرجعياً لأي اختيار. إزالة الماء هنا تخص الماء الابتدائي قبل الوصول للاتزان. لا محاكاة لحركية حقيقية أو اعتماد K على الحرارة.",
    questions: [
      q(
        "ما تأثير الحفاز في كمية الإستر النهائية عند درجة حرارة ثابتة؟",
        ["لا يغير موضع الاتزان", "يضاعف ثابت الاتزان", "يلغي التفاعل العكسي"],
        0,
        "الحفاز يسرع الوصول إلى الاتزان ولا يغير ثابت الاتزان.",
      ),
      q(
        "زيادة الماء الابتدائي تميل إلى…",
        ["تقليل مقدار الإستر عند الاتزان", "خلق ذرات جديدة", "ضمان تحويل كامل"],
        0,
        "الماء ناتج في المعادلة؛ زيادته ترجح الاتجاه العكسي في هذا النموذج.",
      ),
      q(
        "العدد K=4 في المحاكاة هو…",
        [
          "قيمة افتراضية لتوضيح الفكرة",
          "قياس أجراه الطالب",
          "قيمة لكل الأسترات في كل حرارة",
        ],
        0,
        "القيمة توضيحية وليست بيانات تجريبية لمركب محدد.",
      ),
    ],
  },
  {
    id: "solubility",
    title: "الذوبانية والقطبية",
    objective:
      "مقارنة امتزاج سوائل عضوية بمذيب قطبي وآخر غير قطبي باستخدام أوصاف مرجعية.",
    tools: ["tube", "pipette", "cylinder"],
    instructions: [
      "اختر مركباً ومذيباً.",
      "أضف العينة افتراضياً وابدأ المقارنة.",
      "غيّر المذيب مع ثبات المركب وسجّل وصف الامتزاج ومصدره.",
    ],
    limits:
      "تصنيف وصفي قرب حرارة الغرفة، وليس حساب تركيز مشبع أو قياس لطبقات فعلية. لا يُستنتج مقدار الذوبان من اللون أو حجم الرسم؛ تتأثر الخواص بالحرارة والتركيب.",
    questions: [
      q(
        "لماذا يمتزج الإيثانول بالماء؟",
        [
          "تفاعلات قطبية وروابط هيدروجينية",
          "لأنه هيدروكربون خالص",
          "لأنه لا يحتوي H",
        ],
        0,
        "مجموعة OH تتفاعل مع الماء بروابط هيدروجينية.",
      ),
      q(
        "الهكسان والماء…",
        ["ضعيفا الامتزاج جداً", "يمتزجان بكل النسب", "يتحولان إلى إستر"],
        0,
        "الهكسان غير قطبي، وتفاعله مع الماء لا يعوّض شبكة الماء الهيدروجينية.",
      ),
      q(
        "كيف نختبر أثر المذيب بالمقارنة؟",
        [
          "نثبت المركب ونغيّر المذيب",
          "نغير كل المتغيرات معاً",
          "نقارن لون الزجاج فقط",
        ],
        0,
        "تثبيت العينة يجعل أثر تغيير المذيب أوضح.",
      ),
    ],
  },
  {
    id: "physical",
    title: "الخواص الفيزيائية",
    objective: "قراءة بيانات الغليان والانصهار وربطها بالبنية وقوى التجاذب.",
    tools: ["beaker", "cylinder", "balance"],
    instructions: [
      "اختر مركبين من القائمة المرجعية.",
      "اختر الغليان أو الانصهار لعرض المقارنة البيانية.",
      "قارن بيانات الماء الوصفية وقدّم تفسيراً يتجاوز الكتلة الجزيئية.",
    ],
    limits:
      "بيانات مرجعية مدورة؛ الغليان عند ضغط جوي يقارب 1 atm. الرسم يعرض بيانات ثابتة موثقة وليس قياساً افتراضياً؛ لا تنطبق قاعدة اتجاه بسيطة على الانصهار دائماً.",
    questions: [
      q(
        "أحد أسباب ارتفاع غليان الإيثانول مقارنة بالإيثان هو…",
        [
          "الروابط الهيدروجينية بين الجزيئات",
          "تحول C إلى معدن",
          "رابطة ثلاثية في الإيثانول",
        ],
        0,
        "مجموعة OH تتيح قوى تجاذب هيدروجينية بين الجزيئات.",
      ),
      q(
        "هل الغليان ثابت عند كل ضغط؟",
        ["لا، يتأثر بالضغط", "نعم بلا استثناء", "يتوقف على اللون فقط"],
        0,
        "درجة الغليان توافق تساوي ضغط البخار مع الضغط الخارجي.",
      ),
      q(
        "كيف تصف أعمدة الرسم؟",
        ["مقارنة بيانات مرجعية", "قياسات أجراها الطالب", "نتائج سرعة تفاعل"],
        0,
        "القيم مأخوذة من سجلات مرجعية مدورة، لا من حساس افتراضي.",
      ),
    ],
  },
  {
    id: "polymer",
    title: "البلمرة ونمو السلسلة",
    objective: "ربط فتح روابط π بتكوين سلسلة ووحدة تكرار في بلمرة الإضافة.",
    tools: ["flask", "heater"],
    instructions: [
      "اختر الإيثين أو البروبين.",
      "حدد عدد وحدات النموذج من 2 إلى 12.",
      "شغّل التسلسل ثم حدد وحدة التكرار على السلسلة.",
    ],
    limits:
      "سلسلة قصيرة لتعليم اتصال وحدات التكرار؛ ليست توزيع كتلة مولية أو نموذجاً لحركية أو تفرع أو تكتيكية البوليمر. الأقواس في معادلة التكرار تحذف النهايات وتعني امتداد السلسلة. النموذج ثلاثي الأبعاد مقطع بنائي مشبع النهايات بالهيدروجين لتوضيح الاتصال؛ ليس تمثيلاً لحصيلة جزيء البوليمر الكامل.",
    questions: [
      q(
        "وحدة تكرار بولي إيثيلين هي…",
        ["–CH₂–CH₂–", "CH₂=CH₂ داخل السلسلة", "–COOH–"],
        0,
        "تُفتح الرابطة π وتتصل الكربونات بروابط أحادية في العمود الفقري.",
      ),
      q(
        "ماذا تمثل مجموعة CH₃ في بولي بروبيلين؟",
        ["مجموعة جانبية من مونومر البروبين", "جزيء ماء مطرود", "رابطة ثلاثية"],
        0,
        "يبقى ميثيل البروبين مجموعة جانبية متصلة بأحد كربوني التكرار.",
      ),
      q(
        "هل يمثل العرض سرعة البلمرة الصناعية؟",
        ["لا؛ تسلسل تعليمي", "نعم؛ قياس فعلي", "نعم عند كل حرارة"],
        0,
        "عدد الوحدات المعروض اختيار تعليمي ولا يمثل حركية أو كتلة مولية فعلية.",
      ),
    ],
  },
  {
    id: "functional",
    title: "استكشاف المجموعات الوظيفية",
    objective: "تمييز المجموعات من اتصال الذرات وربطها بخواص وتفاعلات متوقعة.",
    tools: ["beaker", "tube"],
    instructions: [
      "اختر تركيباً من المكتبة.",
      "حدد المجموعة الوظيفية قبل الكشف.",
      "شغّل التمييز اللوني وقارن تركيبين لهما مجموعتان مختلفتان.",
    ],
    limits:
      "توقعات تعليمية لعائلات محددة وليست تنبؤاً شاملاً بالنشاط أو السلامة. وجود O وH لا يثبت كحولاً: يجب فحص اتصال المجموعة كاملة.",
    questions: [
      q(
        "مجموعة OH داخل COOH تُصنف ضمن…",
        ["الكربوكسيل، لا كحول مستقل", "الكحول دائماً", "الكيتون"],
        0,
        "COOH مجموعة كربوكسيل متكاملة؛ اتصال الأكسجين بالكربونيل يميزها.",
      ),
      q(
        "الكربونيل المرتبط بهيدروجين يميز…",
        ["ألدهيداً", "ألكاناً", "أميناً"],
        0,
        "تحتوي الألدهيدات C(=O)H مثل الميثانال.",
      ),
      q(
        "وجود N بثلاث روابط بسيطة في ميثيل أمين يدل على…",
        ["أمين", "إستر", "حمض كربوكسيلي"],
        0,
        "CH₃NH₂ أمين أولي في نطاق النماذج المتعادلة المعروضة.",
      ),
    ],
  },
];
export const defaultInputs: Record<ExperimentId, Inputs> = {
  combustion: { fuel: 0, oxygen: 2 },
  bromine: { sample: "ethene", sampleAmount: 1, dose: 1 },
  addition: { alkene: 0, reagent: "H2", sampleAmount: 1, dose: 1 },
  ester: {
    acid: 1,
    alcohol: 1,
    acidAmount: 1,
    alcoholAmount: 1,
    water: 0,
    removeWater: 0,
    catalyst: true,
  },
  solubility: { compound: "ethanol", solvent: "water" },
  physical: { first: "ethanol", second: "hexane", property: "boiling" },
  polymer: { monomer: "ethene", units: 6 },
  functional: { compound: "ethanol" },
};
export const solventChoices = [
  { id: "water", name: "الماء — قطبي" },
  { id: "hexane", name: "الهكسان — غير قطبي" },
];
export const propertyData: Record<
  string,
  {
    name: string;
    formula: string;
    boiling: number;
    melting: number;
    water: string;
    source: string;
  }
> = {
  ethane: {
    name: "الإيثان",
    formula: "C₂H₆",
    boiling: -88.6,
    melting: -182.8,
    water: "ضعيفة جداً",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Ethane",
  },
  ethene: {
    name: "الإيثين",
    formula: "C₂H₄",
    boiling: -103.7,
    melting: -169.2,
    water: "ضعيفة",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Ethylene",
  },
  pentane: {
    name: "البنتان",
    formula: "C₅H₁₂",
    boiling: 36.1,
    melting: -129.7,
    water: "ضعيفة جداً",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Pentane",
  },
  hexane: {
    name: "الهكسان",
    formula: "C₆H₁₄",
    boiling: 68.7,
    melting: -95,
    water: "ضعيفة جداً",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Hexane",
  },
  ethanol: {
    name: "الإيثانول",
    formula: "C₂H₆O",
    boiling: 78.4,
    melting: -114.1,
    water: "يمتزج بكل النسب",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Ethanol",
  },
  propanol: {
    name: "بروبان-1-ول",
    formula: "C₃H₈O",
    boiling: 97.2,
    melting: -126.5,
    water: "يمتزج بكل النسب",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/1-Propanol",
  },
  ethanoicAcid: {
    name: "حمض الإيثانويك",
    formula: "C₂H₄O₂",
    boiling: 118.1,
    melting: 16.6,
    water: "يمتزج بكل النسب",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Acetic-acid",
  },
};
export const compoundChoices = [
  { id: "ethanol", name: "الإيثانول" },
  { id: "hexane", name: "الهكسان" },
  { id: "ethanoicAcid", name: "حمض الإيثانويك" },
];
export const functionalChoices = [
  { id: "ethanol", name: "الإيثانول" },
  { id: "ethanoicAcid", name: "حمض الإيثانويك" },
  { id: "methanal", name: "الميثانال" },
  { id: "propanone", name: "البروبانون" },
  { id: "methylEthanoate", name: "إيثانوات الميثيل" },
  { id: "methylamine", name: "ميثيل أمين" },
  { id: "chloroethane", name: "كلوروإيثان" },
];
const functionalInfo: Record<
  string,
  { group: string; explanation: string; formula: string }
> = {
  ethanol: {
    group: "كحول — هيدروكسيل",
    formula: "CH₃–CH₂–OH",
    explanation:
      "ترتبط OH بكربون مشبع؛ تسمح بروابط هيدروجينية، ويمكن أكسدة هذا الكحول الأولي إلى ألدهيد ثم حمض في ظروف مناسبة.",
  },
  ethanoicAcid: {
    group: "حمض كربوكسيلي — كربوكسيل",
    formula: "CH₃–C(=O)–OH",
    explanation:
      "مجموعة COOH تمنح سلوكاً حمضياً. OH هنا جزء من الكربوكسيل وليست مجموعة كحول مستقلة؛ يتفاعل الحمض مع كحول في الأسترة.",
  },
  methanal: {
    group: "ألدهيد — كربونيل طرفي",
    formula: "H–C(=O)–H",
    explanation:
      "كربون الكربونيل متصل بهيدروجين؛ يمكن أكسدته إلى حمض الميثانويك. الميثانال أبسط الألدهيدات.",
  },
  propanone: {
    group: "كيتون — كربونيل داخلي",
    formula: "CH₃–C(=O)–CH₃",
    explanation:
      "كربون الكربونيل متصل بمجموعتين كربونيتين. الكيتون لا يتأكسد إلى حمض بالطريقة البسيطة المعتادة لأكسدة الألدهيد.",
  },
  methylEthanoate: {
    group: "إستر — C(=O)O",
    formula: "CH₃–C(=O)–O–CH₃",
    explanation:
      "يرتبط أكسجين الإستر بكربونيل وبمجموعة كربونية؛ قد يخضع لتحلل مائي ضمن شروط مناسبة. لا تُستنتج الرائحة أو السلامة من العائلة وحدها.",
  },
  methylamine: {
    group: "أمين أولي",
    formula: "CH₃–NH₂",
    explanation:
      "نيتروجين متعادل بثلاث روابط بسيطة وزوج حر؛ يُظهر سلوكاً قاعدياً في الماء. لا يشمل هذا العرض أملاح الأمونيوم.",
  },
  chloroethane: {
    group: "هالوألكان — رابطة C–Cl",
    formula: "CH₃–CH₂–Cl",
    explanation:
      "ذرة الكلور مرتبطة بكربون مشبع. يمكن للهالوألكانات الخضوع لاستبدال أو حذف بحسب البنية والشروط؛ ليست نتيجة واحدة مضمونة.",
  },
};
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const number = (
  input: Inputs,
  key: string,
  fallback: number,
  min = 0,
  max = 100,
) => {
  const n = Number(input[key]);
  return Number.isFinite(n) ? clamp(n, min, max) : fallback;
};
const pick = (
  input: Inputs,
  key: string,
  allowed: string[],
  fallback: string,
) => (allowed.includes(String(input[key])) ? String(input[key]) : fallback);
const round = (n: number) => Math.round(n * 1000) / 1000;
/** Ideal illustrative A+B ⇌ E+W, no initial ester. K is dimensionless, not a reference constant. */
export function esterExtent(
  acid: number,
  alcohol: number,
  water: number,
  K = 4,
) {
  if (
    ![acid, alcohol, water, K].every(Number.isFinite) ||
    acid < 0 ||
    alcohol < 0 ||
    water < 0 ||
    K <= 0
  )
    throw new Error("Invalid ideal-equilibrium input");
  let lo = 0,
    hi = Math.min(acid, alcohol);
  for (let i = 0; i < 80; i++) {
    const x = (lo + hi) / 2;
    if (x * (water + x) > K * (acid - x) * (alcohol - x)) hi = x;
    else lo = x;
  }
  return (lo + hi) / 2;
}
export function simulate(
  id: ExperimentId,
  provided: Inputs = {},
  progress = 1,
): SimulationResult {
  const input = { ...defaultInputs[id], ...provided },
    p = clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
  const base = { warnings: [] as string[] };
  if (id === "combustion") {
    const fuel = Math.round(number(input, "fuel", 0, 0, fuels.length - 1)),
      f = fuels[fuel];
    const oxygen =
      Math.round(number(input, "oxygen", 2, f.h / 4, f.c + f.h / 4) * 4) / 4;
    const b = combustion(fuel, oxygen);
    return {
      ...base,
      equation: b.equation,
      summary: b.complete
        ? "احتراق كامل في النموذج"
        : "احتراق غير كامل في النموذج",
      explanation: experimentSpecs[0].limits,
      metrics: [
        { label: "O₂ لكل مول وقود", value: oxygen, unit: "مول" },
        { label: "CO₂ متكوّن", value: round(b.co2 * p), unit: "مول" },
        { label: "CO متكوّن", value: round(b.co * p), unit: "مول" },
        { label: "كربون صلب", value: round(b.carbon * p), unit: "مول" },
        { label: "ماء", value: round(b.water * p), unit: "مول" },
      ],
      chart: [
        { label: "CO₂", value: b.co2 * p },
        { label: "CO", value: b.co * p },
        { label: "C", value: b.carbon * p },
        { label: "H₂O", value: b.water * p },
      ],
      color: b.complete ? "#6ab7ff" : "#e49c48",
      modelKey: ["methane", "ethane", "propane", "ethene"][fuel],
      warnings: b.complete
        ? []
        : ["CO سام؛ الأرقام حصيلة تعليمية وليست قياسات غازات."],
      details: {
        oxygen,
        c: f.c,
        h: f.h,
        co2: b.co2,
        co: b.co,
        carbon: b.carbon,
        water: b.water,
      },
    };
  }
  if (id === "bromine") {
    const sample = pick(
      input,
      "sample",
      ["ethane", "ethene", "ethyne"],
      "ethene",
    ) as "ethane" | "ethene" | "ethyne";
    const amount = number(input, "sampleAmount", 1, 0.25, 3),
      dose = number(input, "dose", 1, 0, 6),
      capacity =
        amount * (sample === "ethane" ? 0 : sample === "ethyne" ? 2 : 1),
      consumed = Math.min(capacity, dose) * p,
      remaining = dose - consumed;
    const b = bromine(sample);
    return {
      ...base,
      equation: b.equation,
      summary:
        dose === 0
          ? "لم يُضف كاشف؛ لم يبدأ اختبار ماء البروم"
          : remaining < 1e-8
            ? "استهلك البروم المضاف"
            : "بقي بروم في المزيج",
      explanation:
        b.explanation +
        " تبقى الجرعة الزائدة ملونة حتى بعد استهلاك سعة الإضافة للعينة.",
      metrics: [
        { label: "العينة الابتدائية", value: amount, unit: "مول" },
        { label: "Br₂ مضاف", value: dose, unit: "مول" },
        { label: "Br₂ مستهلك", value: round(consumed), unit: "مول" },
        { label: "Br₂ متبقٍ", value: round(remaining), unit: "مول" },
      ],
      color: dose > 0 && remaining / dose > 0.02 ? "#ca6f25" : "#b1dce6",
      modelKey: sample,
      warnings:
        dose === 0
          ? ["لم تضف كاشفاً؛ غياب اللون قبل الإضافة ليس نتيجة اختبار."]
          : [],
      chart: [
        { label: "Br₂ مستهلك", value: consumed },
        { label: "Br₂ متبقٍ", value: remaining },
      ],
      details: { capacity, consumed, remaining, dose },
    };
  }
  if (id === "addition") {
    const alkene = Math.round(number(input, "alkene", 0, 0, 1)),
      reagent = pick(input, "reagent", ["H2", "Br2"], "H2") as "H2" | "Br2";
    const amount = number(input, "sampleAmount", 1, 0.25, 3),
      dose = number(input, "dose", 1, 0, 6),
      extent = Math.min(amount, dose) * p;
    const a = addition(alkene, reagent);
    return {
      ...base,
      equation: `${a.reactant} + ${a.reagent} → ${a.product}`,
      summary:
        extent > 0
          ? `الناتج المدعوم: ${a.product}`
          : "لا ناتج قبل إضافة المتفاعل وتشغيل التسلسل",
      explanation:
        a.condition +
        " النسبة المولية 1:1. المعادلة تعرض الحصيلة؛ القيم تتبع كمية المتفاعل المحدِّد.",
      metrics: [
        {
          label: "الألكين المتبقي",
          value: round(amount - extent),
          unit: "مول",
        },
        {
          label: "المادة المضافة المتبقية",
          value: round(dose - extent),
          unit: "مول",
        },
        { label: "الناتج", value: round(extent), unit: "مول" },
      ],
      modelKey:
        extent > 0
          ? reagent === "H2"
            ? alkene === 0
              ? "ethane"
              : "propane"
            : alkene === 0
              ? "dibromoethane"
              : "dibromopropane"
          : alkene === 0
            ? "ethene"
            : "propene",
      color: reagent === "Br2" && dose - extent > 0.001 ? "#d38e49" : "#80d9e9",
      warnings:
        dose === 0
          ? ["أضف H₂ أو Br₂؛ لا تُنتج المحاكاة مركباً من دون حفظ الذرات."]
          : [],
      chart: [
        { label: "ألكين متبقٍ", value: amount - extent },
        { label: "ناتج", value: extent },
      ],
      details: {
        extent,
        remainingAlkene: amount - extent,
        remainingReagent: dose - extent,
      },
    };
  }
  if (id === "ester") {
    const acid = Math.round(number(input, "acid", 1, 0, 1)),
      alcohol = Math.round(number(input, "alcohol", 1, 0, 1)),
      a = number(input, "acidAmount", 1, 0.25, 3),
      b = number(input, "alcoholAmount", 1, 0.25, 3),
      initialWater = number(input, "water", 0, 0, 3),
      removed = Math.min(initialWater, number(input, "removeWater", 0, 0, 3)),
      water = initialWater - removed,
      eq = esterExtent(a, b, water),
      catalyst = Boolean(input.catalyst),
      approach =
        p === 1
          ? 1
          : (1 - Math.exp(-(catalyst ? 5 : 1.5) * p)) /
            (1 - Math.exp(-(catalyst ? 5 : 1.5))),
      x = eq * approach;
    const e = esterification(acid, alcohol);
    return {
      ...base,
      equation: e.equation,
      summary: `${e.name} — اتزان افتراضي تعليمي`,
      explanation:
        "الحفاز يغير سرعة عرض الاقتراب فقط؛ عند اكتمال التسلسل تتساوى كمية الإستر مع الحفاز وبدونه. زيادة الكحول أو خفض الماء الابتدائي ترجّح تكوّن الإستر في هذا النموذج المثالي.",
      metrics: [
        { label: "حمض متبقٍ", value: round(a - x), unit: "مول" },
        { label: "كحول متبقٍ", value: round(b - x), unit: "مول" },
        { label: "إستر متكوّن", value: round(x), unit: "مول" },
        { label: "ماء في المزيج", value: round(water + x), unit: "مول" },
        { label: "K التوضيحي", value: 4 },
      ],
      color: "#9ad4d0",
      warnings: [
        "K=4 قيمة افتراضية، وتدرج التقدم ليس زمناً حركياً مقاساً.",
        "إزالة الماء مطبقة على الماء الابتدائي فقط، وليست عملية فصل مستمرة.",
      ],
      chart: [
        { label: "حمض", value: a - x },
        { label: "كحول", value: b - x },
        { label: "إستر", value: x },
        { label: "ماء", value: water + x },
      ],
      details: {
        extent: x,
        equilibriumExtent: eq,
        initialAcid: a,
        initialAlcohol: b,
        initialWater: water,
        K: 4,
      },
      modelKey:
        acid === 1 && alcohol === 0
          ? "methylEthanoate"
          : acid === 1 && alcohol === 1
            ? "ethylEthanoate"
            : alcohol === 0
              ? "methylMethanoate"
              : "ethylMethanoate",
    };
  }
  if (id === "solubility") {
    const compound = pick(
        input,
        "compound",
        compoundChoices.map((c) => c.id),
        "ethanol",
      ),
      solvent = pick(input, "solvent", ["water", "hexane"], "water"),
      c = propertyData[compound];
    // Only documented water pairs and identity are classified; a general compound record does not establish a binary-pair miscibility result.
    const unsupported = solvent === "hexane" && compound !== "hexane";
    const description =
      solvent === "water"
        ? compound === "hexane"
          ? "ضعيف الامتزاج جداً؛ يميل لتكوين طورين"
          : "يمتزج بالماء بكل النسب قرب حرارة الغرفة"
        : compound === "hexane"
          ? "المادة نفسها: طور سائل واحد"
          : "لا تتوفر في قاعدة هذا المختبر بيانات موثقة لتصنيف امتزاج هذا الزوج؛ لا تُعرض نتيجة كمية";
    return {
      ...base,
      summary: description,
      explanation: unsupported
        ? "لا يكفي تصنيف المذيب غير قطبي أو معرفة ذوبان المركب في مذيب عضوي آخر لتعيين امتزاج هذا الزوج. يلزم مرجع خاص بالزوج ودرجة الحرارة والتركيب قبل استخلاص نتيجة."
        : compound === "hexane" && solvent === "water"
          ? "الماء قطبي والهكسان غير قطبي؛ التجاذبات الجديدة لا تعوض شبكة الماء الهيدروجينية."
          : "الماء والإيثانول أو حمض الإيثانويك يمتزجان قرب حرارة الغرفة؛ تتفاعل المجموعات القطبية مع الماء، ولا يجوز تعميم هذه النتيجة على كل المذيبات.",
      metrics: [
        { label: "المركب", value: c.name },
        { label: "المذيب", value: solvent === "water" ? "الماء" : "الهكسان" },
        {
          label: unsupported
            ? "مرجع تعريف المركب؛ ليس بيانات امتزاج هذا الزوج"
            : "المصدر المرجعي",
          value: c.source,
        },
      ],
      color: unsupported
        ? "#8b95b2"
        : compound === "hexane" && solvent === "water"
          ? "#c5b48e"
          : "#a8d9e0",
      modelKey: compound,
      warnings: unsupported
        ? [
            "اختيار خارج أزواج الامتزاج الموثقة في قاعدة المحاكاة؛ لا تستنتج نتيجة من اللون.",
          ]
        : ["وصف مرجعي نوعي، لا توجد هنا قياسات تركيز أو حجم طبقات."],
    };
  }
  if (id === "physical") {
    const first = pick(input, "first", Object.keys(propertyData), "ethanol"),
      second = pick(input, "second", Object.keys(propertyData), "hexane"),
      property = pick(input, "property", ["boiling", "melting"], "boiling") as
        | "boiling"
        | "melting",
      a = propertyData[first],
      b = propertyData[second];
    return {
      ...base,
      summary: `مقارنة ${property === "boiling" ? "الغليان عند نحو 1 atm" : "الانصهار المرجعي"}`,
      explanation:
        "الكتلة والبنية والتفرع وقوى التجاذب تؤثر في الخواص. الكحولات والأحماض تتيح روابط هيدروجينية؛ لا تُعمم اتجاهاً واحداً لدرجة الانصهار لأن انتظام البلورة يؤثر أيضاً.",
      metrics: [
        { label: a.name, value: a[property], unit: "°C" },
        { label: b.name, value: b[property], unit: "°C" },
        { label: `${a.name} في الماء`, value: a.water },
        { label: `${b.name} في الماء`, value: b.water },
        { label: "مصدر المركب الأول", value: a.source },
        { label: "مصدر المركب الثاني", value: b.source },
      ],
      chart: [
        { label: a.name, value: a[property] },
        { label: b.name, value: b[property] },
      ],
      color: "#b3a4e9",
      warnings: [
        "قيم مرجعية مدورة وليست قياسات أُجريت داخل المختبر الافتراضي.",
      ],
      modelKey: first,
    };
  }
  if (id === "polymer") {
    const monomer = pick(input, "monomer", ["ethene", "propene"], "ethene"),
      units = Math.round(number(input, "units", 6, 2, 12)),
      shown = p === 1 ? units : Math.max(2, Math.floor(units * p));
    return {
      ...base,
      equation:
        monomer === "ethene"
          ? "n CH₂=CH₂ → [–CH₂–CH₂–]ₙ"
          : "n CH₂=CH–CH₃ → [–CH₂–CH(CH₃)–]ₙ",
      summary:
        monomer === "ethene"
          ? "بولي إيثيلين — وحدة تكرار C₂H₄"
          : "بولي بروبيلين — وحدة تكرار C₃H₆",
      explanation:
        "تُستهلك رابطة π للمونومر وتتشكل روابط σ بين الوحدات. معادلة الأقواس تصف وحدة التكرار وتحذف مجموعات النهاية؛ لا يتكون جزيء صغير مصاحب في بلمرة الإضافة. أما النموذج ثلاثي الأبعاد فهو مقطع قصير مشبع النهايات بالهيدروجين لتوضيح البنية، وليس حصيلة جزيئية موزونة للبوليمر الكامل.",
      metrics: [
        { label: "وحدات النموذج المختارة", value: units },
        { label: "الوحدات الظاهرة في التسلسل", value: shown },
        {
          label: "الكربونات في وحدات التكرار",
          value: shown * (monomer === "ethene" ? 2 : 3),
        },
      ],
      modelKey: `polymer:${monomer}:${shown}`,
      color: "#7fd8b4",
      warnings: [
        "السلسلة قصيرة وتقريبية؛ لا تمثل كتلة مولية صناعية أو ترتيباً فراغياً محدداً.",
        "الهيدروجين على نهايتي المقطع غطاء بنائي تعليمي؛ صيغة المقطع ليست n مضروباً بصيغة وحدة التكرار.",
      ],
      details: { units, shown, carbonsPerRepeat: monomer === "ethene" ? 2 : 3 },
    };
  }
  const compound = pick(
      input,
      "compound",
      Object.keys(functionalInfo),
      "ethanol",
    ),
    c = functionalInfo[compound];
  return {
    ...base,
    equation: c.formula,
    summary: p > 0 ? c.group : "توقع المجموعة من البنية قبل الكشف",
    explanation: c.explanation,
    metrics: [
      { label: "المجموعة الوظيفية", value: p > 0 ? c.group : "لم تكشف بعد" },
    ],
    modelKey: compound,
    highlight: p > 0 ? [c.group] : [],
    color: "#d99acb",
    warnings: [
      "تمييز لوني تعليمي للمجموعة؛ ليس خريطة كثافة إلكترونية أو نتيجة قياس.",
    ],
  };
}
