// @vitest-environment jsdom
import React from "react";
import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import MoleculeLab from "./MoleculeLab";
it("awards ethanol construction only for a manual graph, not a loaded preset", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => null,
  );
  const completed = vi.fn();
  render(<MoleculeLab allowMotion={false} onChallengeComplete={completed} />);
  fireEvent.click(screen.getByText("ابدأ تحدي الإيثانول"));
  fireEvent.click(screen.getByText("الإيثانول", { selector: "button" }));
  expect(completed).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("ابدأ تحدي الإيثانول"));
  for (const e of ["C", "C", "O", "H", "H", "H", "H", "H", "H"])
    fireEvent.click(screen.getByText("أضف " + e));
  const connect = (a: string, b: string) => {
    screen
      .getAllByRole("button")
      .filter((x) => x.getAttribute("aria-pressed") === "true")
      .forEach((x) => fireEvent.click(x));
    fireEvent.click(screen.getByRole("button", { name: a }));
    fireEvent.click(screen.getByRole("button", { name: b }));
    fireEvent.click(screen.getByText("إنشاء / تعديل الرابطة"));
  };
  for (const [a, b] of [
    ["C1", "C2"],
    ["C2", "O3"],
    ["C1", "H4"],
    ["C1", "H5"],
    ["C1", "H6"],
    ["C2", "H7"],
    ["C2", "H8"],
    ["O3", "H9"],
  ])
    connect(a, b);
  expect(completed).toHaveBeenCalledOnce();
  expect(screen.getByText(/بنيت الإيثانول/)).toBeTruthy();
  cleanup();
  vi.restoreAllMocks();
});
