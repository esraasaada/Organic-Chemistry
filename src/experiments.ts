export const fuels = [
  { name: "الميثان", formula: "CH₄", c: 1, h: 4 },
  { name: "الإيثان", formula: "C₂H₆", c: 2, h: 6 },
  { name: "البروبان", formula: "C₃H₈", c: 3, h: 8 },
  { name: "الإيثين", formula: "C₂H₄", c: 2, h: 4 },
] as const;
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
export function combustion(index: number, oxygen: number) {
  const f = fuels[index];
  const water = f.h / 2;
  const available = 2 * oxygen - water;
  if (available < 0 || oxygen > f.c + f.h / 4)
    throw new Error("Oxygen outside the model range");
  const co2 = Math.max(0, available - f.c),
    co = Math.min(available, 2 * f.c - available),
    carbon = Math.max(0, f.c - available);
  const numbers = [1, oxygen, co2, co, carbon, water].map((n) =>
    Math.round(n * 4),
  );
  const divisor = numbers.reduce((a, b) => gcd(a, b), 0);
  const n = numbers.map((x) => x / divisor);
  const term = (v: number, s: string) => `${v === 1 ? "" : v}${s}`;
  const products = [
    [n[2], "CO₂"],
    [n[3], "CO"],
    [n[4], "C"],
    [n[5], "H₂O"],
  ] as [number, string][];
  return {
    equation: `${term(n[0], f.formula)} + ${term(n[1], "O₂")} → ${products
      .filter(([v]) => v > 0)
      .map(([v, s]) => term(v, s))
      .join(" + ")}`,
    complete: co === 0 && carbon === 0,
    co2,
    co,
    carbon,
    water,
    oxygen,
    fuel: f,
  };
}
export function bromine(compound: "ethane" | "ethene" | "ethyne") {
  return {
    reacts: compound !== "ethane",
    equation:
      compound === "ethene"
        ? "CH₂=CH₂ + Br₂ → CH₂Br–CH₂Br"
        : compound === "ethyne"
          ? "HC≡CH + 2Br₂ → CHBr₂–CHBr₂"
          : "لا تفاعل إضافة في شروط الاختبار (دون ضوء فوق بنفسجي).",
    explanation:
      compound === "ethane"
        ? "الإيثان مشبع؛ لا يزيل لون ماء البروم في شروط هذا الاختبار."
        : "تستهلك روابط π البروم بالإضافة، فيزول اللون البرتقالي. المعادلة تمثل إضافة Br₂ المدرسية المبسطة؛ في الوسط المائي قد تظهر نواتج أخرى مثل البروموهيدرين للألكينات. زوال اللون ليس دليلاً حصرياً على الألكينات.",
  };
}
export function addition(alkene: number, reagent: "H2" | "Br2") {
  const names = ["الإيثين", "البروبين"];
  const structures = ["CH₂=CH₂", "CH₂=CH–CH₃"];
  return {
    name: names[alkene],
    reactant: structures[alkene],
    reagent: reagent === "H2" ? "H₂" : "Br₂",
    product:
      reagent === "H2"
        ? alkene === 0
          ? "CH₃–CH₃"
          : "CH₃–CH₂–CH₃"
        : alkene === 0
          ? "CH₂Br–CH₂Br"
          : "CH₂Br–CHBr–CH₃",
    condition:
      reagent === "H2"
        ? "هدرجة حفزية بوجود Ni وحرارة مناسبة (تمثيل تعليمي)."
        : "إضافة البروم عبر الرابطة الثنائية في شروط مناسبة (تمثيل مبسّط).",
  };
}
export function esterification(acid: number, alcohol: number) {
  const acids = [
    {
      name: "حمض الميثانويك",
      formula: "HCOOH",
      prefix: "ميثانوات",
      group: "HCOO",
    },
    {
      name: "حمض الإيثانويك",
      formula: "CH₃COOH",
      prefix: "إيثانوات",
      group: "CH₃COO",
    },
  ];
  const alcohols = [
    { name: "الميثانول", formula: "CH₃OH", suffix: "الميثيل", group: "CH₃" },
    { name: "الإيثانول", formula: "C₂H₅OH", suffix: "الإيثيل", group: "C₂H₅" },
  ];
  const a = acids[acid],
    b = alcohols[alcohol];
  return {
    name: `${a.prefix} ${b.suffix}`,
    equation: `${a.formula} + ${b.formula} ⇌ ${a.group}${b.group} + H₂O`,
  };
}
export const comparison = [
  {
    name: "الإيثان",
    formula: "C₂H₆",
    structure: "CH₃–CH₃",
    family: "ألكان",
    boiling: -88.6,
    melting: -182.8,
    solubility: "ضعيفة جداً في الماء",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Ethane",
  },
  {
    name: "الإيثين",
    formula: "C₂H₄",
    structure: "CH₂=CH₂",
    family: "ألكين",
    boiling: -103.7,
    melting: -169.2,
    solubility: "ضعيفة في الماء",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Ethylene",
  },
  {
    name: "الإيثانول",
    formula: "C₂H₆O",
    structure: "CH₃–CH₂–OH",
    family: "كحول",
    boiling: 78.4,
    melting: -114.1,
    solubility: "يمتزج بالماء بكل النسب",
    source: "https://pubchem.ncbi.nlm.nih.gov/compound/Ethanol",
  },
];
