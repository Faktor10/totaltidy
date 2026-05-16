// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JoyRollCard } from "./joy-roll-card";

vi.mock("./joy-roll-card.module.css", () => ({
  default: new Proxy(
    {},
    {
      get: (_, prop) => `mock-${String(prop)}`,
    },
  ),
}));

describe("JoyRollCard", () => {
  afterEach(cleanup);

  const defaultSummary = {
    itemsCaptured: 8,
    locationsUsed: 3,
    unsortedItems: 2,
    durationMs: 90000,
  };

  it("renders the encouragement message", () => {
    render(<JoyRollCard summary={defaultSummary} />);
    expect(screen.getByText("You're on a roll!")).toBeDefined();
  });

  it("displays the items captured count", () => {
    render(<JoyRollCard summary={defaultSummary} />);
    expect(screen.getByTestId("joy-roll-items").textContent).toBe("8");
  });

  it("displays the locations used count", () => {
    render(<JoyRollCard summary={defaultSummary} />);
    expect(screen.getByTestId("joy-roll-locations").textContent).toBe("3");
  });

  it("displays the floor space reclaimed metaphor", () => {
    render(<JoyRollCard summary={defaultSummary} />);
    const el = screen.getByTestId("joy-roll-floor-space");
    expect(el.textContent).toContain("reclaimed");
    expect(el.textContent).toContain("sq ft");
  });

  it("displays the session duration", () => {
    render(<JoyRollCard summary={defaultSummary} />);
    expect(screen.getByTestId("joy-roll-duration").textContent).toContain("1m 30s");
  });

  it("renders singular labels for 1 item and 1 location", () => {
    render(
      <JoyRollCard
        summary={{ itemsCaptured: 1, locationsUsed: 1, unsortedItems: 0, durationMs: 5000 }}
      />,
    );
    expect(screen.getByText("item captured")).toBeDefined();
    expect(screen.getByText("location used")).toBeDefined();
  });

  it("calls onNewSession when button is clicked", () => {
    const onNewSession = vi.fn();
    render(<JoyRollCard summary={defaultSummary} onNewSession={onNewSession} />);
    fireEvent.click(screen.getByTestId("joy-roll-new-session"));
    expect(onNewSession).toHaveBeenCalledTimes(1);
  });

  it("calls onViewGallery when button is clicked", () => {
    const onViewGallery = vi.fn();
    render(<JoyRollCard summary={defaultSummary} onViewGallery={onViewGallery} />);
    fireEvent.click(screen.getByTestId("joy-roll-view-gallery"));
    expect(onViewGallery).toHaveBeenCalledTimes(1);
  });

  it("does not render new session button if callback not provided", () => {
    render(<JoyRollCard summary={defaultSummary} />);
    expect(screen.queryByTestId("joy-roll-new-session")).toBeNull();
  });

  it("does not render gallery button if callback not provided", () => {
    render(<JoyRollCard summary={defaultSummary} />);
    expect(screen.queryByTestId("joy-roll-view-gallery")).toBeNull();
  });

  it("handles zero items gracefully", () => {
    render(
      <JoyRollCard
        summary={{ itemsCaptured: 0, locationsUsed: 0, unsortedItems: 0, durationMs: 60000 }}
      />,
    );
    expect(screen.getByText("Ready when you are!")).toBeDefined();
    expect(screen.getByTestId("joy-roll-items").textContent).toBe("0");
  });
});
