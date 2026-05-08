// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ShimmerCard } from "./shimmer-card";

describe("ShimmerCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with default test id", () => {
    render(<ShimmerCard />);
    expect(screen.getByTestId("shimmer-card")).toBeDefined();
  });

  it("renders with custom test id", () => {
    render(<ShimmerCard testId="gallery-item-processing" />);
    expect(screen.getByTestId("gallery-item-processing")).toBeDefined();
  });

  it("contains the shimmer animation element", () => {
    render(<ShimmerCard />);
    const card = screen.getByTestId("shimmer-card");
    expect(card.children.length).toBeGreaterThanOrEqual(1);
  });

  it("displays processing label", () => {
    render(<ShimmerCard />);
    expect(screen.getByText("Processing")).toBeDefined();
  });

  it("does not render an img element", () => {
    const { container } = render(<ShimmerCard />);
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(0);
  });
});
