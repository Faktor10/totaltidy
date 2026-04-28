// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocationStrip } from "./location-strip";

const sampleLocations = [
  { id: "1", name: "Playroom", icon: "🧸" },
  { id: "2", name: "Kitchen", icon: "🍳" },
  { id: "3", name: "Bedroom", icon: "🛏️" },
  { id: "4", name: "Garage", icon: null },
  { id: "5", name: "Attic" },
];

describe("LocationStrip", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing when locations is empty", () => {
    const { container } = render(<LocationStrip locations={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the strip container", () => {
    render(<LocationStrip locations={sampleLocations} />);
    expect(screen.getByTestId("location-strip")).toBeDefined();
  });

  it("renders a bubble for each location", () => {
    render(<LocationStrip locations={sampleLocations} />);
    const bubbles = screen.getAllByTestId("location-bubble");
    expect(bubbles).toHaveLength(5);
  });

  it("truncates to 5 when given more than 5 locations", () => {
    const extra = [...sampleLocations, { id: "6", name: "Basement", icon: "🔦" }];
    render(<LocationStrip locations={extra} />);
    expect(screen.getAllByTestId("location-bubble")).toHaveLength(5);
  });

  it("displays location names", () => {
    render(<LocationStrip locations={sampleLocations} />);
    expect(screen.getByText("Playroom")).toBeDefined();
    expect(screen.getByText("Kitchen")).toBeDefined();
    expect(screen.getByText("Bedroom")).toBeDefined();
  });

  it("displays icons when provided", () => {
    render(<LocationStrip locations={[{ id: "1", name: "Playroom", icon: "🧸" }]} />);
    expect(screen.getByText("🧸")).toBeDefined();
  });

  it("does not render icon span when icon is null", () => {
    render(<LocationStrip locations={[{ id: "4", name: "Garage", icon: null }]} />);
    const bubble = screen.getByTestId("location-bubble");
    const spans = bubble.querySelectorAll("span");
    expect(spans).toHaveLength(1);
  });

  it("does not render icon span when icon is undefined", () => {
    render(<LocationStrip locations={[{ id: "5", name: "Attic" }]} />);
    const bubble = screen.getByTestId("location-bubble");
    const spans = bubble.querySelectorAll("span");
    expect(spans).toHaveLength(1);
  });

  it("calls onSelect with location id when bubble is tapped", () => {
    const onSelect = vi.fn();
    render(<LocationStrip locations={sampleLocations} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Kitchen"));
    expect(onSelect).toHaveBeenCalledWith("2");
  });

  it("does not throw when onSelect is not provided", () => {
    render(<LocationStrip locations={sampleLocations} />);
    expect(() => {
      fireEvent.click(screen.getByText("Playroom"));
    }).not.toThrow();
  });

  it("marks selected bubble with aria-pressed true", () => {
    render(<LocationStrip locations={sampleLocations} selectedId="2" />);
    const bubbles = screen.getAllByTestId("location-bubble");
    expect(bubbles[1].getAttribute("aria-pressed")).toBe("true");
  });

  it("marks non-selected bubbles with aria-pressed false", () => {
    render(<LocationStrip locations={sampleLocations} selectedId="2" />);
    const bubbles = screen.getAllByTestId("location-bubble");
    expect(bubbles[0].getAttribute("aria-pressed")).toBe("false");
    expect(bubbles[2].getAttribute("aria-pressed")).toBe("false");
  });

  it("has no selected bubble when selectedId is null", () => {
    render(<LocationStrip locations={sampleLocations} selectedId={null} />);
    const bubbles = screen.getAllByTestId("location-bubble");
    for (const bubble of bubbles) {
      expect(bubble.getAttribute("aria-pressed")).toBe("false");
    }
  });

  it("sets accessible labels on bubbles", () => {
    render(<LocationStrip locations={[{ id: "1", name: "Playroom" }]} />);
    const bubble = screen.getByTestId("location-bubble");
    expect(bubble.getAttribute("aria-label")).toBe("Select location: Playroom");
  });
});
