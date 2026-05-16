// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SessionSummary } from "./joy-roll-card";
import { JoyRollCard } from "./joy-roll-card";

const baseSummary: SessionSummary = {
  itemsCaptured: 8,
  locationsUsed: 3,
  unsortedItems: 2,
  durationMs: 95_000,
};

describe("JoyRollCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the card with test id", () => {
    render(<JoyRollCard summary={baseSummary} />);
    expect(screen.getByTestId("joy-roll-card")).toBeDefined();
  });

  it("displays the session complete title", () => {
    render(<JoyRollCard summary={baseSummary} />);
    expect(screen.getByText("Session Complete")).toBeDefined();
  });

  it("displays items captured count", () => {
    render(<JoyRollCard summary={baseSummary} />);
    expect(screen.getByTestId("joy-roll-items").textContent).toContain("8");
    expect(screen.getByText("items captured")).toBeDefined();
  });

  it("uses singular form for one item", () => {
    render(<JoyRollCard summary={{ ...baseSummary, itemsCaptured: 1 }} />);
    expect(screen.getByText("item captured")).toBeDefined();
  });

  it("displays locations used count", () => {
    render(<JoyRollCard summary={baseSummary} />);
    expect(screen.getByTestId("joy-roll-locations").textContent).toContain("3");
    expect(screen.getByText("locations used")).toBeDefined();
  });

  it("uses singular form for one location", () => {
    render(<JoyRollCard summary={{ ...baseSummary, locationsUsed: 1 }} />);
    expect(screen.getByText("location used")).toBeDefined();
  });

  it("displays session duration in minutes and seconds", () => {
    render(<JoyRollCard summary={baseSummary} />);
    expect(screen.getByTestId("joy-roll-duration").textContent).toContain("1m 35s");
  });

  it("displays duration in seconds only for short sessions", () => {
    render(<JoyRollCard summary={{ ...baseSummary, durationMs: 45_000 }} />);
    expect(screen.getByTestId("joy-roll-duration").textContent).toContain("45s");
  });

  it("displays duration without seconds when exactly on the minute", () => {
    render(<JoyRollCard summary={{ ...baseSummary, durationMs: 120_000 }} />);
    expect(screen.getByTestId("joy-roll-duration").textContent).toContain("2m");
  });

  it("displays floor space reclaimed metaphor", () => {
    render(<JoyRollCard summary={baseSummary} />);
    const floorSpace = screen.getByTestId("joy-roll-floor-space");
    expect(floorSpace.textContent).toContain("20 sq ft");
    expect(floorSpace.textContent).toContain("reclaimed");
  });

  it("does not show floor space when zero items captured", () => {
    render(<JoyRollCard summary={{ ...baseSummary, itemsCaptured: 0 }} />);
    expect(screen.queryByTestId("joy-roll-floor-space")).toBeNull();
  });

  it("calculates floor space at 2.5 sq ft per item", () => {
    render(<JoyRollCard summary={{ ...baseSummary, itemsCaptured: 4 }} />);
    const floorSpace = screen.getByTestId("joy-roll-floor-space");
    expect(floorSpace.textContent).toContain("10 sq ft");
  });
});
