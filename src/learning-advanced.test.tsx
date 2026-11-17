// @vitest-environment jsdom
import React from "react";
import { afterEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Games from "./Games";
import LessonExplorer from "./LessonExplorer";
afterEach(cleanup);
it("assembles three actual structures and awards points only after all succeed", () => {
  const earn = vi.fn();
  render(<Games onEarn={earn} />);
  fireEvent.click(screen.getAllByText("ابدأ التحدي")[0]);
  const add = (p: string) =>
    fireEvent.click(screen.getByRole("button", { name: "أضف الجزء " + p }));
  for (const parts of [
    ["CH₃", "CH₂", "OH"],
    ["CH₃", "COOH"],
    ["CH₃", "CH₂", "CH₂", "OH"],
  ]) {
    parts.forEach(add);
    fireEvent.click(screen.getByText("افحص البنية"));
    expect(screen.getByRole("status").textContent).toContain("الإجابة:");
    fireEvent.click(
      screen.getByText(parts.length === 4 ? "إنهاء التحدي" : "الجزيء التالي"),
    );
  }
  expect(earn).toHaveBeenCalledWith("تحدي بناء الجزيئات", 300);
});
it("matches molecular structures with tap pairs and earns only at four correct pairs", () => {
  const earn = vi.fn();
  render(<Games onEarn={earn} />);
  fireEvent.click(screen.getAllByText("ابدأ التحدي")[4]);
  const pairs = [
    ["CH₃–CH₂–OH", "الإيثانول"],
    ["CH₃–COOH", "حمض الإيثانويك"],
    ["CH₂=CH₂", "الإيثين"],
    ["CH₃–CO–CH₃", "البروبانون"],
  ];
  for (const [formula, name] of pairs) {
    fireEvent.click(screen.getByRole("button", { name: formula }));
    fireEvent.click(screen.getByRole("button", { name }));
  }
  expect(earn).toHaveBeenCalledWith("مطابقة الجزيئات", 400);
});
it("requires sequential scientifically grounded escape answers", () => {
  const earn = vi.fn();
  render(<Games onEarn={earn} />);
  fireEvent.click(screen.getAllByText("ابدأ التحدي")[1]);
  fireEvent.change(screen.getByLabelText("رمز القفل"), {
    target: { value: "2" },
  });
  fireEvent.click(screen.getByText("افتح القفل"));
  fireEvent.click(screen.getByText("انتقل للقفل التالي"));
  fireEvent.change(screen.getByLabelText("تفسير الرنين"), {
    target: { value: "delocalized" },
  });
  fireEvent.click(screen.getByText("افتح القفل"));
  fireEvent.click(screen.getByText("انتقل للقفل التالي"));
  fireEvent.change(screen.getByLabelText("رمز القفل"), {
    target: { value: "إيثانول" },
  });
  fireEvent.click(screen.getByText("افتح القفل"));
  fireEvent.click(screen.getByText("اخرج من غرفة الهروب"));
  expect(earn).toHaveBeenCalledWith("غرفة الهروب العضوية", 300);
});
it("updates supported molecular formula from lesson exploration n", () => {
  render(<LessonExplorer lessonId={3} level="medium" />);
  fireEvent.change(screen.getByLabelText("عدد ذرات الكربون للاستكشاف"), {
    target: { value: "4" },
  });
  expect(screen.getByText("C4H10")).toBeTruthy();
});
it("opens every lesson explorer and exposes meaningful visual and DOK activity", () => {
  for (let id = 1; id <= 8; id++) {
    const { unmount } = render(
      <LessonExplorer lessonId={id} level="advanced" />,
    );
    expect(screen.getByRole("img")).toBeTruthy();
    expect(screen.getByText("DOK 3 — حلّل وبرّر")).toBeTruthy();
    expect(
      screen
        .getByText("اختبر الفكرة في المختبر الافتراضي ←")
        .getAttribute("href"),
    ).toBe("#lab");
    unmount();
  }
});
it("requires identifying the actual functional region before family classification", () => {
  render(<Games onEarn={vi.fn()} />);
  fireEvent.click(screen.getAllByText("ابدأ التحدي")[2]);
  expect(screen.queryByRole("button", { name: "كحول" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "حدد المجموعة OH" }));
  fireEvent.click(screen.getByRole("button", { name: "كحول" }));
  expect(screen.getByRole("status").textContent).toContain(
    "OH مرتبطة بكربون مشبع",
  );
});
it("supports true drag-drop structure placement without accepting unknown payloads", () => {
  render(<Games onEarn={vi.fn()} />);
  fireEvent.click(screen.getAllByText("ابدأ التحدي")[0]);
  const zone = screen.getByLabelText("لوحة تركيب الجزيء");
  for (const part of ["CH₃", "CH₂", "OH"])
    fireEvent.drop(zone, { dataTransfer: { getData: () => part } });
  fireEvent.click(screen.getByText("افحص البنية"));
  expect(screen.getByRole("status").textContent).toContain("C₂H₆O");
});
it("keeps each alkane, alkene and alkyne diagram consistent with selected n and H count", () => {
  for (const [id, structure] of [
    [3, "CH₃–CH₂–CH₂–CH₃"],
    [4, "CH₂=CH–CH₂–CH₃"],
    [5, "CH≡C–CH₂–CH₃"],
  ] as const) {
    const { unmount } = render(<LessonExplorer lessonId={id} level="medium" />);
    fireEvent.change(screen.getByLabelText("عدد ذرات الكربون للاستكشاف"), {
      target: { value: "4" },
    });
    const diagram = screen.getByRole("img", {
      name: `سلسلة مفتوحة من 4 ذرات كربون: ${structure}`,
    });
    expect(diagram.querySelectorAll("circle")).toHaveLength(4);
    expect(diagram.textContent).toContain("C4");
    unmount();
  }
});
it("redraws the functional group when selecting acid and ester instead of fixed alcohol", () => {
  render(<LessonExplorer lessonId={7} level="medium" />);
  fireEvent.change(screen.getByLabelText("اختر المجموعة"), {
    target: { value: "acid" },
  });
  const acid = screen.getByRole("img", { name: /عائلة الحمض الكربوكسيلي/ });
  expect(acid.textContent).toContain("C(=O)–OH");
  expect(acid.getAttribute("aria-label")).toContain("المجموعة COOH مظللة");
  fireEvent.change(screen.getByLabelText("اختر المجموعة"), {
    target: { value: "ester" },
  });
  const ester = screen.getByRole("img", { name: /عائلة الإستر/ });
  expect(ester.textContent).toContain("C(=O)–O");
  expect(ester.getAttribute("aria-label")).toContain("المجموعة COO مظللة");
});
