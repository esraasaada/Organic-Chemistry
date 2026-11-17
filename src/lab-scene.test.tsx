// @vitest-environment jsdom
import React from "react";
import { it, expect, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import AdvancedLabScene from "./AdvancedLabScene";
it("notifies the owning lab to provide its 2D fallback when WebGL is unavailable", () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => null,
  );
  vi.spyOn(console, "error").mockImplementation(() => {});
  const onFail = vi.fn();
  render(
    <AdvancedLabScene
      tools={["beaker"]}
      selectedTool={null}
      onSelectTool={() => {}}
      running={false}
      progress={0}
      color="#34d399"
      reducedMotion
      onFail={onFail}
    />,
  );
  expect(onFail).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "إعادة الكاميرا" }));
  fireEvent.click(screen.getByRole("button", { name: "طاولة العمل" }));
  fireEvent.click(screen.getByRole("button", { name: "خزانة الأدوات" }));
  expect(screen.getByText(/تدريجات وميزان توضيحيان/)).toBeTruthy();
  cleanup();
  vi.restoreAllMocks();
});
