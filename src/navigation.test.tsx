// @vitest-environment jsdom
import React from "react";
import { it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import { App } from "./main";
it("navigates sections, saves student and preferences, restores progress after remount", async () => {
  window.scrollTo = vi.fn();
  localStorage.clear();
  location.hash = "";
  render(<App />);
  fireEvent.click(screen.getByText("ابدأ رحلتك العلمية"));
  fireEvent.change(screen.getByPlaceholderText("اكتب اسمك هنا"), {
    target: { value: "عمر الطالب" },
  });
  fireEvent.submit(
    screen.getByPlaceholderText("اكتب اسمك هنا").closest("form")!,
  );
  expect(JSON.parse(localStorage.getItem("ocu-progress-v1")!).name).toBe(
    "عمر الطالب",
  );
  fireEvent.click(screen.getByTitle("تكبير الخط"));
  expect(JSON.parse(localStorage.getItem("ocu-progress-v1")!).font).toBe(true);
  for (const page of [
    "games",
    "assessment",
    "life",
    "progress",
    "lessons",
    "lab",
  ]) {
    await act(async () => {
      location.hash = page;
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(document.querySelector("main")).toBeTruthy();
    expect(document.querySelector("main")!.textContent).not.toContain(
      "undefined",
    );
  }
  cleanup();
  render(<App />);
  expect(document.querySelector(".sidebar-bottom")!.textContent).toContain(
    "عمر الطالب",
  );
  expect(document.querySelector(".large")).toBeTruthy();
  cleanup();
});
it("migrates old comparison completion to physical-properties without losing student data", async () => {
  window.scrollTo = vi.fn();
  location.hash = "#progress";
  localStorage.setItem(
    "ocu-progress-v1",
    JSON.stringify({
      name: "طالبة سابقة",
      completed: [1, 2],
      experiments: [1, 5],
      results: [],
      points: 300,
      badges: ["شارة سابقة"],
      motion: false,
    }),
  );
  render(<App />);
  await act(async () => {});
  const saved = JSON.parse(localStorage.getItem("ocu-progress-v1")!);
  expect(saved.schemaVersion).toBe(3);
  expect(saved.experiments).toEqual([1, 6]);
  expect(saved.completed).toEqual([1, 2]);
  expect(saved.points).toBe(300);
  expect(screen.getByText("شارة سابقة", { exact: false })).toBeTruthy();
  cleanup();
});
it("persists the light theme and restores it after remount", async () => {
  localStorage.clear();
  location.hash = "#progress";
  const { unmount } = render(<App />);
  fireEvent.click(screen.getByLabelText("الوضع النهاري"));
  expect(JSON.parse(localStorage.getItem("ocu-progress-v1")!).theme).toBe(
    "light",
  );
  unmount();
  render(<App />);
  expect(document.querySelector(".day")).toBeTruthy();
  expect(screen.getByLabelText("الوضع الليلي")).toBeTruthy();
  cleanup();
});
