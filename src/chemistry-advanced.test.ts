import { describe, it, expect } from "vitest";
import {
  presets,
  teachingModel,
  functionalGroups,
  formula,
  issues,
  compareIsomers,
  structuralFormula,
  geometryInfo,
  polymerSegment,
} from "./chemistry";
describe("advanced molecular chemistry", () => {
  it("uses Hill element order with explicit neutral nitrogen and halogens", () => {
    const m = teachingModel(
      ["C", "N", "Cl", "Br"],
      [
        [0, 1, 1],
        [0, 2, 1],
        [0, 3, 1],
      ],
    );
    expect(formula(m)).toBe("CH3BrClN");
    expect(issues(m)).toEqual([]);
  });
  it("all extended presets respect supported neutral valence", () => {
    for (const p of Object.values(presets))
      expect(issues(p.model), p.name).toEqual([]);
  });
  it("distinguishes acid OH and ester oxygen from alcohol and ether", () => {
    const acid = functionalGroups(presets.ethanoicAcid.model);
    expect(acid.map((g) => g.name)).toEqual(["حمض كربوكسيلي"]);
    const ester = functionalGroups(presets.methylEthanoate.model);
    expect(ester.map((g) => g.name)).toEqual(["إستر"]);
    expect(
      functionalGroups(presets.ethanol.model).map((g) => g.name),
    ).toContain("كحول");
  });
  it("marks functional atoms and correctly recognises aldehydes ketones amines and halo compounds", () => {
    for (const [key, name] of [
      ["methanal", "ألدهيد"],
      ["propanone", "كيتون"],
      ["methylamine", "أمين"],
      ["chloroethane", "هالوجين عضوي"],
    ]) {
      const group = functionalGroups(presets[key].model).find(
        (g) => g.name === name,
      );
      expect(group).toBeDefined();
      expect(
        group!.atomIds.every((id) =>
          presets[key].model.atoms.some((a) => a.id === id),
        ),
      ).toBe(true);
    }
  });
  it("does not label benzene an ordinary alkene", () => {
    expect(functionalGroups(presets.benzene.model).map((g) => g.name)).toEqual([
      "حلقة أروماتية",
    ]);
  });
  it("compares connectivity and emits an explicit adjacency structural representation", () => {
    expect(
      compareIsomers(presets.ethanol.model, presets.dimethylEther.model),
    ).toContain("متماكبان بنائيان");
    expect(structuralFormula(presets.ethanol.model)).toContain("O3H");
    expect(geometryInfo(presets.methane.model)).toContain("109.5");
    expect(geometryInfo(presets.ethanol.model)).toContain("لا تتوفر");
  });
  it("builds H-capped polymer segments with 2n or 3n carbons and full valence", () => {
    for (const n of [2, 4, 12])
      for (const type of ["ethene", "propene"] as const) {
        const m = polymerSegment(type, n);
        expect(m.atoms.filter((a) => a.element === "C")).toHaveLength(
          n * (type === "ethene" ? 2 : 3),
        );
        expect(issues(m)).toEqual([]);
        expect(m.bonds.every((b) => b.order === 1)).toBe(true);
      }
  });
  it("rejects malformed self and duplicate edges in scientific validation", () => {
    expect(
      issues({
        atoms: [{ id: 0, element: "C", x: 0, y: 0, z: 0 }],
        bonds: [{ a: 0, b: 0, order: 1 }],
      }).some((s) => s.includes("غير صحيحة")),
    ).toBe(true);
  });
});

it("provides formula-correct approximate models for all comparison and ester choices", () => {
  for (const [key, expected] of Object.entries({
    pentane: "C5H12",
    hexane: "C6H14",
    propanol: "C3H8O",
    methanoicAcid: "CH2O2",
    methylMethanoate: "C2H4O2",
    ethylMethanoate: "C3H6O2",
  })) {
    expect(formula(presets[key].model)).toBe(expected);
    expect(issues(presets[key].model)).toEqual([]);
    expect(presets[key].note).toContain("تقريبية");
  }
});
