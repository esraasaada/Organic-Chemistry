import { describe, it, expect } from "vitest";
import {
  combustion,
  fuels,
  bromine,
  addition,
  esterification,
  comparison,
} from "./experiments";
describe("scientific experiment engines", () => {
  it("conserves carbon hydrogen and oxygen over every supported oxygen increment", () => {
    fuels.forEach((f, i) => {
      for (let o = f.h / 4; o <= f.c + f.h / 4; o += 0.25) {
        const r = combustion(i, o);
        expect(r.co2 + r.co + r.carbon).toBe(f.c);
        expect(2 * r.water).toBe(f.h);
        expect(2 * r.co2 + r.co + r.water).toBe(2 * o);
        expect(r.co).toBeGreaterThanOrEqual(0);
      }
    });
  });
  it("balances methane complete and carbon monoxide scenarios", () => {
    expect(combustion(0, 2).equation).toBe("CH₄ + 2O₂ → CO₂ + 2H₂O");
    expect(combustion(0, 1.5).equation).toBe("2CH₄ + 3O₂ → 2CO + 4H₂O");
  });
  it("distinguishes saturated bromine test and unsaturated addition", () => {
    expect(bromine("ethane").reacts).toBe(false);
    expect(bromine("ethene").reacts).toBe(true);
    expect(addition(0, "H2").product).toBe("CH₃–CH₃");
    expect(addition(1, "Br2").product).toBe("CH₂Br–CHBr–CH₃");
  });
  it("forms all four esters and retains equilibrium arrows", () => {
    expect(esterification(1, 1).name).toBe("إيثانوات الإيثيل");
    for (let a = 0; a < 2; a++)
      for (let b = 0; b < 2; b++)
        expect(esterification(a, b).equation).toContain("⇌");
  });
  it("uses physically meaningful reference data", () => {
    comparison.forEach((c) => {
      expect(c.boiling).toBeGreaterThan(c.melting);
      expect(c.source).toMatch(/^https:\/\/pubchem/);
    });
    expect(comparison[2].boiling).toBeGreaterThan(comparison[0].boiling);
  });
});
