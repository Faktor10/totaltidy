// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JoyRollCard, type SessionSummary } from "./joy-roll-card";

afterEach(cleanup);

const baseSummary: SessionSummary = {
  itemsCaptured: 5,
  locationsUsed: 3,
  unsortedItems: 1,
  durationMs: 125000,
};

describe("JoyRollCard", () => {
  it("renders items captured count", () => {
    render(<JoyRollCard summary={baseSummary} />);
    expect(screen.getByTestId("joy-roll-items").textContent).toBe("5");
    expect(screen.getByText("items captured")).toBeDefined();
  });

  it("renders singular label for 1 item", () => {
    render(<JoyRollCard summary={{ ...baseSummary, itemsCaptured: 1 }} />);
    expect(screen.getByText("item captured")).toBeDefined();
  });

  it("renders locations used count", () => {
    render(<JoyRollCard summary={baseSummary} />);
    expect(screen.getByTestId("joy-roll-locations").textContent).toBe("3");
    expect(screen.getByText("locations used")).toBeDefined();
  });

  it("renders singular label for 1 location", () => {
    render(<JoyRollCard summary={{ ...baseSummary, locationsUsed: 1 }} />);
    expect(screen.getByText("location used")).toBeDefined();
  });

  it("renders formatted duration", () => {
    render(<JoyRollCard summary={baseSummary} />);
    expect(screen.getByTestId("joy-roll-duration").textContent).toBe("2m 5s");
  });

  it("formats duration as seconds only when under 60s", () => {
    render(<JoyRollCard summary={{ ...baseSummary, durationMs: 45000 }} />);
    expect(screen.getByTestId("joy-roll-duration").textContent).toBe("45s");
  });

  it("formats duration without seconds when exact minutes", () => {
    render(<JoyRollCard summary={{ ...baseSummary, durationMs: 180000 }} />);
    expect(screen.getByTestId("joy-roll-duration").textContent).toBe("3m");
  });

  it("renders floor space reclaimed metric", () => {
    render(<JoyRollCard summary={baseSummary} />);
    const el = screen.getByTestId("joy-roll-floor-space");
    expect(el.textContent).toContain("~13 sq ft");
    expect(el.textContent).toContain("of floor space reclaimed");
  });

  it("calculates floor space with decimal for small counts", () => {
    render(<JoyRollCard summary={{ ...baseSummary, itemsCaptured: 2 }} />);
    expect(screen.getByTestId("joy-roll-floor-space").textContent).toContain("~5.0 sq ft");
  });

  it("shows 0 sq ft when no items captured", () => {
    render(<JoyRollCard summary={{ ...baseSummary, itemsCaptured: 0 }} />);
    expect(screen.getByTestId("joy-roll-floor-space").textContent).toContain("~0 sq ft");
  });

  it("calls onNewSession when primary button clicked", () => {
    const onNewSession = vi.fn();
    render(<JoyRollCard summary={baseSummary} onNewSession={onNewSession} />);
    fireEvent.click(screen.getByTestId("joy-roll-new-session"));
    expect(onNewSession).toHaveBeenCalledOnce();
  });

  it("calls onDismiss when secondary button clicked", () => {
    const onDismiss = vi.fn();
    render(<JoyRollCard summary={baseSummary} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId("joy-roll-dismiss"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders title text", () => {
    render(<JoyRollCard summary={baseSummary} />);
    expect(screen.getByText("Session complete!")).toBeDefined();
  });

  it("renders the card container", () => {
    render(<JoyRollCard summary={baseSummary} />);
    expect(screen.getByTestId("joy-roll-card")).toBeDefined();
  });
});
