// @vitest-environment jsdom
import React from "react";
import { afterEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
  within,
} from "@testing-library/react";
import AdvancedLab from "./AdvancedLab";
import { experimentSpecs } from "./labEngine";
import { notebookKey, guideLab, readNotebook } from "./labNotebook";
vi.mock("./AdvancedLabScene", () => ({
  default: () => <div>مشهد المختبر التجريبي</div>,
}));
vi.mock("./MoleculeLab", () => ({
  MolecularView: () => <div>نموذج النتيجة</div>,
}));
const names: Record<string, string> = {
  beaker: "كأس زجاجي",
  flask: "دورق كيميائي",
  tube: "أنبوب اختبار",
  pipette: "ماصة",
  balance: "ميزان رقمي",
  heater: "سخان تعليمي",
  cylinder: "مخبار مدرج",
};
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
});
it("runs every advanced experiment through tools, material transfer, answers and saved notebook", async () => {
  localStorage.clear();
  location.hash = "#lab";
  vi.useFakeTimers();
  const complete = vi.fn();
  render(
    <AdvancedLab student="طالب اختبار" onComplete={complete} reducedMotion />,
  );
  await act(async () => {});
  for (let i = 0; i < 8; i++) {
    const spec = experimentSpecs[i];
    fireEvent.click(
      within(screen.getByRole("group", { name: "التجارب المتاحة" })).getByRole(
        "button",
        { name: new RegExp(spec.title) },
      ),
    );
    fireEvent.click(screen.getByText("تشغيل المحاكاة"));
    expect(screen.queryByText("الملاحظة والنتيجة")).toBeNull();
    for (const t of spec.tools)
      fireEvent.click(screen.getByRole("button", { name: names[t] }));
    const materials = screen
      .getAllByText("اسحب أو انقر للإضافة")
      .map((x) => x.closest("button")!);
    materials.forEach((b) => fireEvent.click(b));
    fireEvent.change(screen.getByLabelText("مدة العرض التعليمي"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByText("تشغيل المحاكاة"));
    await act(async () => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.getByText("الملاحظة والنتيجة")).toBeTruthy();
    for (const q of spec.questions)
      fireEvent.click(
        screen.getByRole("button", { name: q.options[q.answer] }),
      );
    fireEvent.click(screen.getByText("دفتر المختبر"));
    fireEvent.change(screen.getByLabelText("الفرضية"), {
      target: { value: "أتوقع اختلاف النتيجة عند تغيير المتغير المستقل." },
    });
    fireEvent.change(screen.getByLabelText("الاستنتاج"), {
      target: {
        value: "النتيجة تؤيد علاقة التركيب والمتغير بالناتج ضمن النموذج.",
      },
    });
    fireEvent.click(screen.getByText("احفظ إنجاز التجربة والتقرير"));
    expect(complete).toHaveBeenLastCalledWith(i + 1);
    const saved = JSON.parse(localStorage.getItem(notebookKey)!);
    expect(saved.reports[0]).toMatchObject({
      id: spec.id,
      score: 3,
      total: 3,
      note: { student: "طالب اختبار" },
    });
  }
  expect(complete).toHaveBeenCalledTimes(8);
  expect(readNotebook().reports).toHaveLength(8);
});
it("transfers actual drag-drop payloads and rejects material before tools", async () => {
  location.hash = "#lab";
  vi.useFakeTimers();
  render(<AdvancedLab student="عمر" onComplete={vi.fn()} />);
  await act(async () => {});
  const zone = screen.getByLabelText(
    "طاولة العمل، منطقة إسقاط الأدوات والمواد",
  );
  fireEvent.drop(zone, { dataTransfer: { getData: () => "sample" } });
  expect(
    screen.getByText(/جهّز أدوات التجربة أولاً حتى تجد المواد وعاءً مناسباً/),
  ).toBeTruthy();
  for (const t of ["heater", "cylinder", "flask"])
    fireEvent.drop(zone, { dataTransfer: { getData: () => "tool:" + t } });
  fireEvent.drop(zone, { dataTransfer: { getData: () => "sample" } });
  fireEvent.drop(zone, { dataTransfer: { getData: () => "reagent" } });
  fireEvent.click(screen.getByText("تشغيل المحاكاة"));
  expect(screen.getByText("إيقاف مؤقت")).toBeTruthy();
  await act(async () => {
    vi.advanceTimersByTime(200);
  });
  fireEvent.click(screen.getByText("إيقاف مؤقت"));
  expect(screen.getByText("استئناف المحاكاة")).toBeTruthy();
});
it("persists editable hypotheses and handles broken notebook JSON", async () => {
  localStorage.setItem(notebookKey, "broken");
  expect(readNotebook()).toEqual({ notes: {}, reports: [] });
  location.hash = "#lab";
  const { unmount } = render(
    <AdvancedLab student="عمر" onComplete={vi.fn()} />,
  );
  await act(async () => {});
  fireEvent.click(screen.getByText("دفتر المختبر"));
  fireEvent.change(screen.getByLabelText("الفرضية"), {
    target: { value: "فرضية محفوظة" },
  });
  unmount();
  render(<AdvancedLab student="عمر" onComplete={vi.fn()} />);
  await act(async () => {});
  fireEvent.click(screen.getByText("دفتر المختبر"));
  expect((screen.getByLabelText("الفرضية") as HTMLTextAreaElement).value).toBe(
    "فرضية محفوظة",
  );
});
it("uses readiness and actual answer state in the rule guide", () => {
  const base = {
    missingTools: [],
    missingMaterials: [],
    progress: 1,
    answered: 3,
    mistakes: 0,
    level: "medium",
  };
  expect(guideLab({ ...base, missingTools: ["دورق"] })).toContain("دورق");
  expect(guideLab({ ...base, missingMaterials: ["الكحول"] })).toContain(
    "الكحول",
  );
  expect(guideLab({ ...base, answered: 1 })).toContain("أسئلة");
  expect(guideLab({ ...base, level: "beginner" })).toContain("الذوبانية");
});
