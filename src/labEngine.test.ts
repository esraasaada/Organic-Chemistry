import { describe, it, expect } from "vitest";
import {
  defaultInputs,
  esterExtent,
  experimentSpecs,
  simulate,
} from "./labEngine";
import { fuels } from "./experiments";
describe("advanced lab engine", () => {
  it("provides eight complete experimental journeys with 24 explanations", () => {
    expect(experimentSpecs).toHaveLength(8);
    for (const s of experimentSpecs) {
      expect(s.questions).toHaveLength(3);
      expect(s.tools.length).toBeGreaterThan(0);
      expect(s.instructions.length).toBeGreaterThan(1);
      for (const q of s.questions) {
        expect(q.options[q.answer]).toBeTruthy();
        expect(q.explanation.length).toBeGreaterThan(15);
      }
      const r = simulate(s.id, defaultInputs[s.id]);
      expect(r.summary).toBeTruthy();
      expect(r.explanation).toBeTruthy();
    }
  });
  it("conserves C H O for every supported combustion setting", () => {
    for (let fuel = 0; fuel < fuels.length; fuel++) {
      const f = fuels[fuel];
      for (let oxygen = f.h / 4; oxygen <= f.c + f.h / 4; oxygen += 0.25) {
        const d = simulate("combustion", { fuel, oxygen }, 1).details!;
        expect(d.co2 + d.co + d.carbon).toBeCloseTo(f.c);
        expect(d.water * 2).toBe(f.h);
        expect(d.co2 * 2 + d.co + d.water).toBeCloseTo(oxygen * 2);
      }
    }
  });
  it("keeps bromine excess and distinguishes unsaturation capacity", () => {
    expect(
      simulate("bromine", { sample: "ethane", dose: 2 }).details!.remaining,
    ).toBe(2);
    expect(
      simulate("bromine", { sample: "ethene", dose: 3 }).details!.remaining,
    ).toBe(2);
    expect(
      simulate("bromine", { sample: "ethyne", dose: 3 }).details!.remaining,
    ).toBe(1);
    expect(
      simulate("bromine", { sample: "ethene", sampleAmount: 2, dose: 1 })
        .details!.consumed,
    ).toBe(1);
  });
  it("uses the limiting reactant in addition and preserves nonnegative amounts", () => {
    const d = simulate("addition", { sampleAmount: 2, dose: 0.5 }).details!;
    expect(d.extent).toBe(0.5);
    expect(d.remainingAlkene).toBe(1.5);
    expect(d.remainingReagent).toBe(0);
    expect(simulate("addition", { dose: 0 }).details!.extent).toBe(0);
  });
  it("solves ideal equilibrium and does not change it with a catalyst", () => {
    const x = esterExtent(1, 1, 0);
    expect(x).toBeCloseTo(2 / 3);
    expect((x * x) / ((1 - x) * (1 - x))).toBeCloseTo(4);
    expect(simulate("ester", { catalyst: true }).details!.extent).toBeCloseTo(
      simulate("ester", { catalyst: false }).details!.extent,
    );
    expect(
      simulate("ester", { catalyst: true }, 0.5).details!.extent,
    ).toBeGreaterThan(
      simulate("ester", { catalyst: false }, 0.5).details!.extent,
    );
  });
  it("increases equilibrium conversion when initial water is removed", () => {
    const wet = simulate("ester", { water: 2, removeWater: 0 }).details!,
      dry = simulate("ester", { water: 2, removeWater: 2 }).details!;
    expect(dry.extent).toBeGreaterThan(wet.extent);
    expect(dry.initialWater).toBe(0);
    expect(
      simulate("ester", { water: 1, removeWater: 3 }).details!.initialWater,
    ).toBe(0);
    expect(() => esterExtent(-1, 1, 0)).toThrow();
  });
  it("does not invent quantitative solubility or graph live measurements", () => {
    const r = simulate("solubility", { compound: "hexane", solvent: "water" });
    expect(r.summary).toContain("طورين");
    expect(r.chart).toBeUndefined();
    expect(
      r.metrics.some((m) =>
        String(m.value).includes("pubchem.ncbi.nlm.nih.gov"),
      ),
    ).toBe(true);
    const data = simulate("physical", { first: "ethanol", second: "hexane" });
    expect(data.chart!.map((x) => x.value)).toEqual([78.4, 68.7]);
  });
  it("bounds polymer sequence and identifies functional groups", () => {
    expect(simulate("polymer", { units: 100 }, 1).details!.shown).toBe(12);
    expect(simulate("polymer", { units: 6 }, 0).details!.shown).toBe(2);
    expect(
      simulate("functional", { compound: "ethanoicAcid" }).summary,
    ).toContain("كربوكسيلي");
    expect(
      simulate("functional", { compound: "ethanoicAcid" }).explanation,
    ).toContain("ليست مجموعة كحول");
  });
  it("does not interpret absent bromine as a positive decolorisation test", () => {
    const r = simulate("bromine", { sample: "ethene", dose: 0 });
    expect(r.summary).toContain("لم يبدأ");
    expect(r.summary).not.toContain("استهلك");
    expect(r.details!.consumed).toBe(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it("labels unsupported binary-solvent pairs instead of extrapolating organic-solvent data", () => {
    for (const compound of ["ethanol", "ethanoicAcid"]) {
      const r = simulate("solubility", { compound, solvent: "hexane" });
      expect(r.summary).toContain("لا تتوفر");
      expect(r.summary).not.toContain("قابل للذوبان");
      expect(r.chart).toBeUndefined();
      expect(r.warnings[0]).toContain("خارج أزواج الامتزاج الموثقة");
    }
    expect(
      simulate("solubility", { compound: "hexane", solvent: "hexane" }).summary,
    ).toContain("المادة نفسها");
  });
  it("bounds malformed numerical inputs without negative inventories or NaN metrics", () => {
    const high = simulate(
      "bromine",
      { sample: "ethyne", sampleAmount: 999, dose: 999 },
      99,
    );
    expect(high.details).toMatchObject({
      dose: 6,
      capacity: 6,
      consumed: 6,
      remaining: 0,
    });
    const low = simulate("addition", { sampleAmount: -5, dose: -3 }, -1);
    expect(low.details).toMatchObject({
      extent: 0,
      remainingAlkene: 0.25,
      remainingReagent: 0,
    });
    const invalid = simulate(
      "combustion",
      { fuel: NaN, oxygen: Infinity },
      NaN,
    );
    expect(invalid.details!.oxygen).toBe(2);
    for (const metric of invalid.metrics)
      if (typeof metric.value === "number")
        expect(Number.isFinite(metric.value)).toBe(true);
    expect(simulate("polymer", { units: -5 }, -1).details!.shown).toBe(2);
    expect(esterExtent(0, 1, 0)).toBe(0);
    expect(() => esterExtent(1, 1, NaN)).toThrow();
  });
  it("distinguishes the repeat-unit equation from H-capped display segments", () => {
    const r = simulate("polymer", { monomer: "propene", units: 4 });
    expect(r.equation).toContain("CH(CH₃)");
    expect(r.explanation).toContain("مشبع النهايات بالهيدروجين");
    expect(r.warnings.some((w) => w.includes("غطاء بنائي"))).toBe(true);
  });
});
