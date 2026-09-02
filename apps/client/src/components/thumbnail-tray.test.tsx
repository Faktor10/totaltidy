// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThumbnailTray } from "./thumbnail-tray";

describe("ThumbnailTray", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing when captures is empty", () => {
    const { container } = render(<ThumbnailTray captures={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a single thumbnail", () => {
    render(<ThumbnailTray captures={["blob:http://localhost/1"]} />);
    expect(screen.getByTestId("thumbnail-tray")).toBeDefined();
    const images = screen.getAllByTestId("thumbnail-image");
    expect(images).toHaveLength(1);
  });

  it("renders up to 4 thumbnails", () => {
    const urls = [
      "blob:http://localhost/1",
      "blob:http://localhost/2",
      "blob:http://localhost/3",
      "blob:http://localhost/4",
    ];
    render(<ThumbnailTray captures={urls} />);
    expect(screen.getAllByTestId("thumbnail-image")).toHaveLength(4);
  });

  it("truncates to 4 when given more than 4 captures", () => {
    const urls = [
      "blob:http://localhost/1",
      "blob:http://localhost/2",
      "blob:http://localhost/3",
      "blob:http://localhost/4",
      "blob:http://localhost/5",
    ];
    render(<ThumbnailTray captures={urls} />);
    expect(screen.getAllByTestId("thumbnail-image")).toHaveLength(4);
  });

  it("renders images with correct src attributes", () => {
    const urls = ["blob:http://localhost/a", "blob:http://localhost/b"];
    render(<ThumbnailTray captures={urls} />);
    const images = screen.getAllByTestId("thumbnail-image") as HTMLImageElement[];
    expect(images[0].src).toBe("blob:http://localhost/a");
    expect(images[1].src).toBe("blob:http://localhost/b");
  });

  it("renders images with alt text", () => {
    const urls = ["blob:http://localhost/a", "blob:http://localhost/b"];
    render(<ThumbnailTray captures={urls} />);
    const images = screen.getAllByTestId("thumbnail-image") as HTMLImageElement[];
    expect(images[0].alt).toBe("Capture 2");
    expect(images[1].alt).toBe("Capture 1");
  });
});
