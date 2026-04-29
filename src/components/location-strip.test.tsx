// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LocationBubble } from "./location-strip";
import { LocationStrip } from "./location-strip";

function makeLocations(count: number): LocationBubble[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `loc-${i + 1}`,
    name: `Room ${i + 1}`,
    icon: null,
  }));
}

describe("LocationStrip", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing when locations is empty", () => {
    const { container } = render(<LocationStrip locations={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the strip container", () => {
    render(<LocationStrip locations={makeLocations(3)} />);
    expect(screen.getByTestId("location-strip")).toBeDefined();
  });

  it("renders one bubble per location", () => {
    render(<LocationStrip locations={makeLocations(3)} />);
    const bubbles = screen.getAllByTestId("location-bubble");
    expect(bubbles).toHaveLength(3);
  });

  it("truncates to 5 bubbles when given more", () => {
    render(<LocationStrip locations={makeLocations(7)} />);
    const bubbles = screen.getAllByTestId("location-bubble");
    expect(bubbles).toHaveLength(5);
  });

  it("displays location names", () => {
    const locations: LocationBubble[] = [
      { id: "1", name: "Kitchen", icon: null },
      { id: "2", name: "Bedroom", icon: null },
    ];
    render(<LocationStrip locations={locations} />);
    expect(screen.getByText("Kitchen")).toBeDefined();
    expect(screen.getByText("Bedroom")).toBeDefined();
  });

  it("displays custom icon when provided", () => {
    const locations: LocationBubble[] = [{ id: "1", name: "Attic", icon: "\u{2B50}" }];
    render(<LocationStrip locations={locations} />);
    expect(screen.getByText("\u{2B50}")).toBeDefined();
  });

  it("displays a default icon based on name when no icon is set", () => {
    const locations: LocationBubble[] = [{ id: "1", name: "Kitchen", icon: null }];
    render(<LocationStrip locations={locations} />);
    expect(screen.getByText("\u{1F373}")).toBeDefined();
  });

  it("displays fallback icon for unknown location names", () => {
    const locations: LocationBubble[] = [{ id: "1", name: "Shed", icon: null }];
    render(<LocationStrip locations={locations} />);
    expect(screen.getByText("\u{1F4CD}")).toBeDefined();
  });

  it("calls onSelect with location id when bubble is tapped", () => {
    const onSelect = vi.fn();
    const locations: LocationBubble[] = [{ id: "loc-42", name: "Garage", icon: null }];
    render(<LocationStrip locations={locations} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("location-bubble"));
    expect(onSelect).toHaveBeenCalledWith("loc-42");
  });

  it("does not throw when onSelect is not provided", () => {
    const locations: LocationBubble[] = [{ id: "1", name: "Garage", icon: null }];
    render(<LocationStrip locations={locations} />);
    expect(() => fireEvent.click(screen.getByTestId("location-bubble"))).not.toThrow();
  });

  it("marks the selected bubble with aria-pressed=true", () => {
    const locations: LocationBubble[] = [
      { id: "1", name: "Room A", icon: null },
      { id: "2", name: "Room B", icon: null },
    ];
    render(<LocationStrip locations={locations} selectedId="2" />);
    const bubbles = screen.getAllByTestId("location-bubble");
    expect(bubbles[0].getAttribute("aria-pressed")).toBe("false");
    expect(bubbles[1].getAttribute("aria-pressed")).toBe("true");
  });

  it("applies selected class only to the selected bubble", () => {
    const locations: LocationBubble[] = [
      { id: "1", name: "Room A", icon: null },
      { id: "2", name: "Room B", icon: null },
    ];
    render(<LocationStrip locations={locations} selectedId="1" />);
    const bubbles = screen.getAllByTestId("location-bubble");
    expect(bubbles[0].className).toContain("selected");
    expect(bubbles[1].className).not.toContain("selected");
  });

  it("shows no selected bubble when selectedId is null", () => {
    const locations: LocationBubble[] = [
      { id: "1", name: "Room A", icon: null },
      { id: "2", name: "Room B", icon: null },
    ];
    render(<LocationStrip locations={locations} selectedId={null} />);
    const bubbles = screen.getAllByTestId("location-bubble");
    for (const bubble of bubbles) {
      expect(bubble.getAttribute("aria-pressed")).toBe("false");
    }
  });
});
