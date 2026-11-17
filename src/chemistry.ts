export type Element = "C" | "H" | "O" | "N" | "F" | "Cl" | "Br" | "I";
export type Atom = {
  id: number;
  element: Element;
  x: number;
  y: number;
  z: number;
};
export type Bond = { a: number; b: number; order: 1 | 2 | 3 };
export type Molecule = { atoms: Atom[]; bonds: Bond[] };
export const valence: Record<Element, number> = {
  C: 4,
  H: 1,
  O: 2,
  N: 3,
  F: 1,
  Cl: 1,
  Br: 1,
  I: 1,
};
export function formula(m: Molecule) {
  return (
    m.atoms.some((a) => a.element === "C")
      ? [
          "C",
          "H",
          ...Object.keys(valence)
            .filter((e) => e !== "C" && e !== "H")
            .sort(),
        ]
      : Object.keys(valence).sort()
  )
    .map((e) => e as Element)
    .map((e) => {
      const n = m.atoms.filter((a) => a.element === e).length;
      return n ? e + (n > 1 ? n : "") : "";
    })
    .join("");
}
export function bondSum(m: Molecule, id: number) {
  return m.bonds
    .filter((b) => b.a === id || b.b === id)
    .reduce((n, b) => n + b.order, 0);
}
export function issues(m: Molecule) {
  const malformed = m.bonds.flatMap((b, i) =>
    b.a === b.b ||
    !m.atoms.some((a) => a.id === b.a) ||
    !m.atoms.some((a) => a.id === b.b) ||
    m.bonds
      .slice(0, i)
      .some((v) => (v.a === b.a && v.b === b.b) || (v.a === b.b && v.b === b.a))
      ? ["رابطة غير صحيحة أو مكررة"]
      : [],
  );
  return [
    ...malformed,
    ...m.atoms.flatMap((a) => {
      const n = bondSum(m, a.id),
        v = valence[a.element];
      return n === v
        ? []
        : [
            `${a.element}${a.id + 1}: مجموع الرتب ${n}؛ التكافؤ المعتاد ${v} (${n > v ? "تجاوز التكافؤ" : "روابط ناقصة"}).`,
          ];
    }),
  ];
}
export function complete(
  atoms: Atom[],
  bonds: Bond[],
  planar = false,
): Molecule {
  const original = [...atoms];
  for (const a of original) {
    const needed =
      valence[a.element] -
      bonds
        .filter((b) => b.a === a.id || b.b === a.id)
        .reduce((n, b) => n + b.order, 0);
    for (let i = 0; i < needed; i++) {
      const theta =
        (i / Math.max(needed, 1)) * Math.PI * 2 + (a.id % 2 ? 0 : Math.PI);
      const neighbor = original.find((n) =>
        bonds.some(
          (b) =>
            (b.a === a.id && b.b === n.id) || (b.b === a.id && b.a === n.id),
        ),
      );
      let dx = 0,
        dy = 0,
        dz = 0;
      if (needed === 1 && neighbor) {
        dx = a.x - neighbor.x;
        dy = a.y - neighbor.y;
        dz = a.z - neighbor.z;
        const norm = Math.hypot(dx, dy, dz) || 1;
        dx /= norm;
        dy /= norm;
        dz /= norm;
      } else {
        dx = Math.cos(theta) * 0.75;
        dy = Math.sin(theta) * 0.9;
        dz = planar ? 0 : i % 2 ? 0.8 : -0.8;
      }
      const id = atoms.length;
      atoms.push({ id, element: "H", x: a.x + dx, y: a.y + dy, z: a.z + dz });
      bonds.push({ a: a.id, b: id, order: 1 });
    }
  }
  return { atoms, bonds };
}
const atom = (id: number, element: Element, x: number, y = 0, z = 0): Atom => ({
  id,
  element,
  x,
  y,
  z,
});
export const presets: Record<
  string,
  { name: string; model: Molecule; note: string }
> = {
  methane: {
    name: "الميثان",
    model: {
      atoms: [
        atom(0, "C", 0),
        atom(1, "H", 0.7, 0.7, 0.7),
        atom(2, "H", 0.7, -0.7, -0.7),
        atom(3, "H", -0.7, 0.7, -0.7),
        atom(4, "H", -0.7, -0.7, 0.7),
      ],
      bonds: [1, 2, 3, 4].map((b) => ({ a: 0, b, order: 1 })),
    },
    note: "هندسة رباعية السطوح؛ زاوية H–C–H نحو 109.5°.",
  },
  ethene: {
    name: "الإيثين",
    model: {
      atoms: [
        atom(0, "C", -0.67),
        atom(1, "C", 0.67),
        atom(2, "H", -1.21, 0.94),
        atom(3, "H", -1.21, -0.94),
        atom(4, "H", 1.21, 0.94),
        atom(5, "H", 1.21, -0.94),
      ],
      bonds: [
        { a: 0, b: 1, order: 2 },
        { a: 0, b: 2, order: 1 },
        { a: 0, b: 3, order: 1 },
        { a: 1, b: 4, order: 1 },
        { a: 1, b: 5, order: 1 },
      ],
    },
    note: "جزيء مستوٍ؛ الزوايا حول الكربون تقارب 120°.",
  },
  ethyne: {
    name: "الإيثاين",
    model: {
      atoms: [
        atom(0, "C", -0.6),
        atom(1, "C", 0.6),
        atom(2, "H", -1.66),
        atom(3, "H", 1.66),
      ],
      bonds: [
        { a: 0, b: 1, order: 3 },
        { a: 0, b: 2, order: 1 },
        { a: 1, b: 3, order: 1 },
      ],
    },
    note: "جزيء خطي؛ زاوية الروابط 180°.",
  },
  ethanol: {
    name: "الإيثانول",
    model: complete(
      [atom(0, "C", -1.5), atom(1, "C", 0), atom(2, "O", 0.75, 1.2)],
      [
        { a: 0, b: 1, order: 1 },
        { a: 1, b: 2, order: 1 },
      ],
    ),
    note: "تمثيل تقريبي للاتصال؛ اتجاهات الهيدروجين ليست بنية محسّنة طاقياً.",
  },
  benzene: {
    name: "البنزين",
    model: (() => {
      const atoms = Array.from({ length: 6 }, (_, i) =>
        atom(
          i,
          "C",
          1.4 * Math.cos((i * Math.PI) / 3),
          1.4 * Math.sin((i * Math.PI) / 3),
        ),
      );
      const bonds: Bond[] = Array.from({ length: 6 }, (_, i) => ({
        a: i,
        b: (i + 1) % 6,
        order: i % 2 ? 1 : 2,
      }));
      for (let i = 0; i < 6; i++) {
        atoms.push(
          atom(
            i + 6,
            "H",
            2.48 * Math.cos((i * Math.PI) / 3),
            2.48 * Math.sin((i * Math.PI) / 3),
          ),
        );
        bonds.push({ a: i, b: i + 6, order: 1 });
      }
      return { atoms, bonds };
    })(),
    note: "رسم كيكوله: الروابط الفعلية متكافئة بسبب عدم تمركز إلكترونات π؛ لا يتذبذب الجزيء بين رسمين.",
  },
};
export function isomorphic(a: Molecule, b: Molecule) {
  if (
    a.atoms.length !== b.atoms.length ||
    a.bonds.length !== b.bonds.length ||
    formula(a) !== formula(b)
  )
    return false;
  const rank = (m: Molecule, id: number) =>
    m.bonds
      .filter((x) => x.a === id || x.b === id)
      .map((x) => x.order)
      .sort()
      .join(",");
  const order = [...a.atoms].sort(
    (x, y) => bondSum(a, y.id) - bondSum(a, x.id),
  );
  const mapped = new Map<number, number>(),
    used = new Set<number>();
  const edge = (m: Molecule, x: number, y: number) =>
    m.bonds.find((v) => (v.a === x && v.b === y) || (v.a === y && v.b === x))
      ?.order || 0;
  function match(i: number): boolean {
    if (i === order.length) return true;
    const x = order[i];
    for (const y of b.atoms) {
      if (
        used.has(y.id) ||
        x.element !== y.element ||
        rank(a, x.id) !== rank(b, y.id)
      )
        continue;
      if ([...mapped].some(([p, q]) => edge(a, x.id, p) !== edge(b, y.id, q)))
        continue;
      mapped.set(x.id, y.id);
      used.add(y.id);
      if (match(i + 1)) return true;
      mapped.delete(x.id);
      used.delete(y.id);
    }
    return false;
  }
  return match(0);
}
export function identify(m: Molecule) {
  return (
    Object.values(presets).find((p) => isomorphic(m, p.model))?.name ||
    "مركب غير موجود في مكتبة التعرف / تركيب غير مكتمل"
  );
}
export function copyModel(m: Molecule): Molecule {
  return {
    atoms: m.atoms.map((a) => ({ ...a })),
    bonds: m.bonds.map((b) => ({ ...b })),
  };
}

/** Hydrogen-completed teaching models. Coordinates show connectivity, not energy minima. */
export function teachingModel(
  elements: Element[],
  edges: [number, number, 1 | 2 | 3][],
): Molecule {
  return complete(
    elements.map((e, i) =>
      atom(i, e, (i - (elements.length - 1) / 2) * 1.4, (i % 2) * 0.5),
    ),
    edges.map(([a, b, order]) => ({ a, b, order })),
  );
}
const approximate =
  "نموذج اتصال تعليمي بإحداثيات تقريبية؛ ليس بنية محسنة طاقياً ولا طول رابطة مقاساً.";
Object.assign(presets, {
  ethane: {
    name: "الإيثان",
    model: teachingModel(["C", "C"], [[0, 1, 1]]),
    note: approximate,
  },
  propene: {
    name: "البروبين",
    model: teachingModel(
      ["C", "C", "C"],
      [
        [0, 1, 2],
        [1, 2, 1],
      ],
    ),
    note: approximate,
  },
  propane: {
    name: "البروبان",
    model: teachingModel(
      ["C", "C", "C"],
      [
        [0, 1, 1],
        [1, 2, 1],
      ],
    ),
    note: approximate,
  },
  dibromoethane: {
    name: "1،2-ثنائي بروموإيثان",
    model: teachingModel(
      ["C", "C", "Br", "Br"],
      [
        [0, 1, 1],
        [0, 2, 1],
        [1, 3, 1],
      ],
    ),
    note: approximate,
  },
  dibromopropane: {
    name: "1،2-ثنائي بروموبروبان",
    model: teachingModel(
      ["C", "C", "C", "Br", "Br"],
      [
        [0, 1, 1],
        [1, 2, 1],
        [0, 3, 1],
        [1, 4, 1],
      ],
    ),
    note: approximate,
  },
  dimethylEther: {
    name: "ثنائي ميثيل الإيثر",
    model: teachingModel(
      ["C", "O", "C"],
      [
        [0, 1, 1],
        [1, 2, 1],
      ],
    ),
    note: approximate,
  },
  methanol: {
    name: "الميثانول",
    model: teachingModel(["C", "O"], [[0, 1, 1]]),
    note: approximate,
  },
  ethanoicAcid: {
    name: "حمض الإيثانويك",
    model: teachingModel(
      ["C", "C", "O", "O"],
      [
        [0, 1, 1],
        [1, 2, 2],
        [1, 3, 1],
      ],
    ),
    note: approximate,
  },
  methanal: {
    name: "الميثانال",
    model: teachingModel(["C", "O"], [[0, 1, 2]]),
    note: approximate,
  },
  propanone: {
    name: "البروبانون",
    model: teachingModel(
      ["C", "C", "C", "O"],
      [
        [0, 1, 1],
        [1, 2, 1],
        [1, 3, 2],
      ],
    ),
    note: approximate,
  },
  methylEthanoate: {
    name: "إيثانوات الميثيل",
    model: teachingModel(
      ["C", "C", "O", "O", "C"],
      [
        [0, 1, 1],
        [1, 2, 2],
        [1, 3, 1],
        [3, 4, 1],
      ],
    ),
    note: approximate,
  },
  ethylEthanoate: {
    name: "إيثانوات الإيثيل",
    model: teachingModel(
      ["C", "C", "O", "O", "C", "C"],
      [
        [0, 1, 1],
        [1, 2, 2],
        [1, 3, 1],
        [3, 4, 1],
        [4, 5, 1],
      ],
    ),
    note: approximate,
  },
  methylamine: {
    name: "ميثيل أمين",
    model: teachingModel(["C", "N"], [[0, 1, 1]]),
    note: approximate,
  },
  pentane: {
    name: "البنتان",
    model: teachingModel(
      ["C", "C", "C", "C", "C"],
      [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
        [3, 4, 1],
      ],
    ),
    note: approximate,
  },
  hexane: {
    name: "الهكسان",
    model: teachingModel(
      ["C", "C", "C", "C", "C", "C"],
      [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
        [3, 4, 1],
        [4, 5, 1],
      ],
    ),
    note: approximate,
  },
  propanol: {
    name: "بروبان-1-ول",
    model: teachingModel(
      ["C", "C", "C", "O"],
      [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
      ],
    ),
    note: approximate,
  },
  methanoicAcid: {
    name: "حمض الميثانويك",
    model: teachingModel(
      ["C", "O", "O"],
      [
        [0, 1, 2],
        [0, 2, 1],
      ],
    ),
    note: approximate,
  },
  methylMethanoate: {
    name: "ميثانوات الميثيل",
    model: teachingModel(
      ["C", "O", "O", "C"],
      [
        [0, 1, 2],
        [0, 2, 1],
        [2, 3, 1],
      ],
    ),
    note: approximate,
  },
  ethylMethanoate: {
    name: "ميثانوات الإيثيل",
    model: teachingModel(
      ["C", "O", "O", "C", "C"],
      [
        [0, 1, 2],
        [0, 2, 1],
        [2, 3, 1],
        [3, 4, 1],
      ],
    ),
    note: approximate,
  },
  chloroethane: {
    name: "كلوروإيثان",
    model: teachingModel(
      ["C", "C", "Cl"],
      [
        [0, 1, 1],
        [1, 2, 1],
      ],
    ),
    note: approximate,
  },
});
export type FunctionalGroup = {
  name: string;
  atomIds: number[];
  description: string;
};
export function functionalGroups(m: Molecule): FunctionalGroup[] {
  if (isomorphic(m, presets.benzene.model))
    return [
      {
        name: "حلقة أروماتية",
        atomIds: m.atoms.filter((a) => a.element === "C").map((a) => a.id),
        description: "نظام π غير متمركز؛ لا نصنف البنزين ألكيناً عادياً.",
      },
    ];
  const result: FunctionalGroup[] = [];
  const neighbors = (id: number) =>
    m.bonds
      .filter((b) => b.a === id || b.b === id)
      .map((b) => ({
        atom: m.atoms.find((a) => a.id === (b.a === id ? b.b : b.a))!,
        order: b.order,
      }))
      .filter((x) => x.atom);
  const add = (name: string, atomIds: number[], description: string) => {
    if (
      !result.some(
        (r) => r.name === name && r.atomIds.join(",") === atomIds.join(","),
      )
    )
      result.push({ name, atomIds, description });
  };
  for (const a of m.atoms) {
    const n = neighbors(a.id);
    if (a.element === "C") {
      const oxygen = n.find((v) => v.atom.element === "O" && v.order === 2);
      if (oxygen) {
        const singleO = n.find((v) => v.atom.element === "O" && v.order === 1);
        if (singleO) {
          const on = neighbors(singleO.atom.id);
          if (on.some((v) => v.atom.element === "H"))
            add(
              "حمض كربوكسيلي",
              [
                a.id,
                oxygen.atom.id,
                singleO.atom.id,
                ...on
                  .filter((v) => v.atom.element === "H")
                  .map((v) => v.atom.id),
              ],
              "COOH: مجموعة كربوكسيل.",
            );
          else if (on.some((v) => v.atom.element === "C" && v.atom.id !== a.id))
            add(
              "إستر",
              [a.id, oxygen.atom.id, singleO.atom.id],
              "C(=O)O–C: مجموعة إستر.",
            );
        } else if (n.some((v) => v.atom.element === "N"))
          add(
            "أميد",
            [
              a.id,
              oxygen.atom.id,
              ...n.filter((v) => v.atom.element === "N").map((v) => v.atom.id),
            ],
            "كربونيل متصل بنيتروجين؛ ليس أميناً عادياً.",
          );
        else if (n.some((v) => v.atom.element === "H"))
          add(
            "ألدهيد",
            [a.id, oxygen.atom.id],
            "كربونيل طرفي مرتبط بهيدروجين.",
          );
        else if (n.filter((v) => v.atom.element === "C").length === 2)
          add(
            "كيتون",
            [a.id, oxygen.atom.id],
            "كربونيل مرتبط بمجموعتين كربونيتين.",
          );
      }
    }
    if (a.element === "O" && n.length === 2 && n.every((v) => v.order === 1)) {
      const carbon = n.find((v) => v.atom.element === "C"),
        hydrogen = n.find((v) => v.atom.element === "H");
      const carbonyl = (id: number) =>
        neighbors(id).some((v) => v.atom.element === "O" && v.order === 2);
      if (
        carbon &&
        hydrogen &&
        !carbonyl(carbon.atom.id) &&
        neighbors(carbon.atom.id).every((v) => v.order === 1)
      )
        add(
          "كحول",
          [carbon.atom.id, a.id, hydrogen.atom.id],
          "OH مرتبطة بكربون مشبع.",
        );
      if (
        n.every((v) => v.atom.element === "C") &&
        !n.some((v) => carbonyl(v.atom.id))
      )
        add(
          "إيثر",
          [n[0].atom.id, a.id, n[1].atom.id],
          "أكسجين بين مجموعتين كربونيتين.",
        );
    }
    if (
      a.element === "N" &&
      n.every((v) => v.order === 1) &&
      n.some((v) => v.atom.element === "C") &&
      !n.some((v) =>
        neighbors(v.atom.id).some(
          (t) => t.atom.element === "O" && t.order === 2,
        ),
      )
    )
      add(
        "أمين",
        [
          a.id,
          ...n.filter((v) => v.atom.element === "C").map((v) => v.atom.id),
        ],
        "نيتروجين متعادل بروابط أحادية؛ لا يشمل الأميدات.",
      );
    if (
      ["F", "Cl", "Br", "I"].includes(a.element) &&
      n.some((v) => v.atom.element === "C")
    )
      add("هالوجين عضوي", [a.id, n[0].atom.id], "رابطة كربون–هالوجين.");
  }
  for (const b of m.bonds) {
    if (
      [b.a, b.b].every(
        (id) => m.atoms.find((a) => a.id === id)?.element === "C",
      ) &&
      b.order > 1
    )
      add(
        b.order === 2 ? "ألكين (رابطة C=C)" : "ألكاين (رابطة C≡C)",
        [b.a, b.b],
        "تحديد بنيوي محلي؛ الحلقات الأروماتية تتطلب تفسيراً خاصاً.",
      );
  }
  return result;
}
export function structuralFormula(m: Molecule) {
  return m.atoms
    .filter((a) => a.element !== "H")
    .map((a) => {
      const neighbors = m.bonds
        .filter((b) => b.a === a.id || b.b === a.id)
        .map((b) => ({ id: b.a === a.id ? b.b : b.a, order: b.order }));
      const h = neighbors.filter(
        (v) => m.atoms.find((a) => a.id === v.id)?.element === "H",
      ).length;
      return `${a.element}${a.id + 1}${h ? "H" + (h > 1 ? h : "") : ""}: ${neighbors
        .filter((v) => m.atoms.find((a) => a.id === v.id)?.element !== "H")
        .map(
          (v) =>
            `${v.order === 3 ? "≡" : v.order === 2 ? "=" : "–"}${m.atoms.find((a) => a.id === v.id)?.element}${v.id + 1}`,
        )
        .join(" ")}`;
    })
    .join(" | ");
}
export function geometryInfo(m: Molecule) {
  if (isomorphic(m, presets.methane.model))
    return "الميثان: رباعي السطوح، H–C–H ≈109.5°.";
  if (isomorphic(m, presets.ethene.model))
    return "الإيثين: مستوٍ، الزوايا المحلية حول C ≈120°.";
  if (isomorphic(m, presets.ethyne.model)) return "الإيثاين: خطي، H–C–C =180°.";
  if (isomorphic(m, presets.benzene.model))
    return "البنزين: حلقة مستوية، زوايا الحلقة ≈120°؛ الروابط الفعلية متكافئة بالرنين.";
  return "لا تتوفر زوايا موثوقة لهذا البناء؛ الإحداثيات المعروضة تقريبية فقط.";
}
export function compareIsomers(a: Molecule, b: Molecule) {
  return formula(a) !== formula(b)
    ? "الصيغ الجزيئية مختلفة: ليسا متماكبين."
    : isomorphic(a, b)
      ? "الاتصال ورتب الروابط متطابقان؛ المقارنة لا تفحص المتماكبات الفراغية."
      : "الصيغة واحدة والاتصال مختلف: متماكبان بنائيان في نطاق النماذج المكتملة.";
}

/** A finite H-capped segment illustrates repeat-unit connectivity, not an actual chain end mechanism. */
export function polymerSegment(
  monomer: "ethene" | "propene",
  units: number,
): Molecule {
  const n = Math.max(2, Math.min(12, Math.round(units)));
  const atoms: Atom[] = [],
    bonds: Bond[] = [];
  for (let i = 0; i < 2 * n; i++) {
    atoms.push(atom(i, "C", (i - (2 * n - 1) / 2) * 1.1, (i % 2) * 0.65));
    if (i) bonds.push({ a: i - 1, b: i, order: 1 });
  }
  if (monomer === "propene")
    for (let i = 1; i < 2 * n; i += 2) {
      const id = atoms.length;
      atoms.push(atom(id, "C", atoms[i].x, atoms[i].y + 1.4));
      bonds.push({ a: i, b: id, order: 1 });
    }
  return complete(atoms, bonds);
}
