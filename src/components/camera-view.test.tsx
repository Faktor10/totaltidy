// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CameraView } from "./camera-view";

function createMockTrack(): MediaStreamTrack {
  return { stop: vi.fn(), kind: "video" } as unknown as MediaStreamTrack;
}

function createMockStream(tracks: MediaStreamTrack[] = [createMockTrack()]): MediaStream {
  return { getTracks: () => tracks } as unknown as MediaStream;
}

describe("CameraView", () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetUserMedia = vi.fn();
    Object.defineProperty(globalThis, "navigator", {
      value: {
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the camera view container", async () => {
    mockGetUserMedia.mockResolvedValue(createMockStream());
    render(<CameraView />);

    expect(screen.getByTestId("camera-view")).toBeDefined();
  });

  it("shows loading state before camera starts", () => {
    mockGetUserMedia.mockReturnValue(new Promise(() => {}));
    render(<CameraView />);

    expect(screen.getByText("Starting camera…")).toBeDefined();
  });

  it("shows error message and retry button when camera fails", async () => {
    const err = new DOMException("Permission denied", "NotAllowedError");
    mockGetUserMedia.mockRejectedValue(err);

    render(<CameraView />);

    await waitFor(() => {
      expect(screen.getByText("Camera permission was denied")).toBeDefined();
    });
    expect(screen.getByText("Try again")).toBeDefined();
  });

  it("shows shutter button when camera is streaming", async () => {
    const stream = createMockStream();
    mockGetUserMedia.mockResolvedValue(stream);

    render(<CameraView />);

    await waitFor(() => {
      expect(screen.getByTestId("shutter-button")).toBeDefined();
    });
  });

  it("renders video and hidden canvas elements when streaming", async () => {
    mockGetUserMedia.mockResolvedValue(createMockStream());

    render(<CameraView />);

    await waitFor(() => {
      expect(screen.getByTestId("shutter-button")).toBeDefined();
    });

    const video = document.querySelector("video");
    const canvas = document.querySelector("canvas");
    expect(video).not.toBeNull();
    expect(canvas).not.toBeNull();
    expect(video?.autoplay).toBe(true);
    expect(video?.muted).toBe(true);
  });

  it("calls onCapture with blob when shutter is pressed", async () => {
    const stream = createMockStream();
    mockGetUserMedia.mockResolvedValue(stream);
    const onCapture = vi.fn();

    render(<CameraView onCapture={onCapture} />);

    await waitFor(() => {
      expect(screen.getByTestId("shutter-button")).toBeDefined();
    });

    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (canvas) {
      const mockCtx = { drawImage: vi.fn() };
      vi.spyOn(canvas, "getContext").mockReturnValue(
        mockCtx as unknown as CanvasRenderingContext2D,
      );
      vi.spyOn(canvas, "toBlob").mockImplementation((cb) => {
        cb(new Blob(["test"], { type: "image/jpeg" }));
      });
    }

    const video = document.querySelector("video") as HTMLVideoElement;
    if (video) {
      Object.defineProperty(video, "videoWidth", { value: 1920 });
      Object.defineProperty(video, "videoHeight", { value: 1080 });
    }

    fireEvent.click(screen.getByTestId("shutter-button"));

    await waitFor(() => {
      expect(onCapture).toHaveBeenCalledOnce();
      expect(onCapture.mock.calls[0][0]).toBeInstanceOf(Blob);
    });
  });

  it("shows flash animation on capture", async () => {
    const stream = createMockStream();
    mockGetUserMedia.mockResolvedValue(stream);

    render(<CameraView onCapture={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("shutter-button")).toBeDefined();
    });

    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (canvas) {
      const mockCtx = { drawImage: vi.fn() };
      vi.spyOn(canvas, "getContext").mockReturnValue(
        mockCtx as unknown as CanvasRenderingContext2D,
      );
      vi.spyOn(canvas, "toBlob").mockImplementation((cb) => {
        cb(new Blob(["test"], { type: "image/jpeg" }));
      });
    }

    const video = document.querySelector("video") as HTMLVideoElement;
    if (video) {
      Object.defineProperty(video, "videoWidth", { value: 1920 });
      Object.defineProperty(video, "videoHeight", { value: 1080 });
    }

    fireEvent.click(screen.getByTestId("shutter-button"));

    await waitFor(() => {
      expect(screen.getByTestId("capture-flash")).toBeDefined();
    });
  });

  it("camera remains streaming after capture", async () => {
    const track = createMockTrack();
    const stream = createMockStream([track]);
    mockGetUserMedia.mockResolvedValue(stream);

    render(<CameraView onCapture={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("shutter-button")).toBeDefined();
    });

    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (canvas) {
      const mockCtx = { drawImage: vi.fn() };
      vi.spyOn(canvas, "getContext").mockReturnValue(
        mockCtx as unknown as CanvasRenderingContext2D,
      );
      vi.spyOn(canvas, "toBlob").mockImplementation((cb) => {
        cb(new Blob(["test"], { type: "image/jpeg" }));
      });
    }

    const video = document.querySelector("video") as HTMLVideoElement;
    if (video) {
      Object.defineProperty(video, "videoWidth", { value: 1920 });
      Object.defineProperty(video, "videoHeight", { value: 1080 });
    }

    fireEvent.click(screen.getByTestId("shutter-button"));

    await waitFor(() => {
      expect(screen.getByTestId("capture-flash")).toBeDefined();
    });

    expect(track.stop).not.toHaveBeenCalled();
    expect(screen.getByTestId("shutter-button")).toBeDefined();
  });

  it("retries camera when retry button is clicked", async () => {
    const err = new DOMException("Permission denied", "NotAllowedError");
    mockGetUserMedia.mockRejectedValueOnce(err);
    mockGetUserMedia.mockResolvedValueOnce(createMockStream());

    render(<CameraView />);

    await waitFor(() => {
      expect(screen.getByText("Try again")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
    });
  });

  it("stops camera tracks on unmount", async () => {
    const track = createMockTrack();
    const stream = createMockStream([track]);
    mockGetUserMedia.mockResolvedValue(stream);

    const { unmount } = render(<CameraView />);

    await waitFor(() => {
      expect(screen.getByTestId("shutter-button")).toBeDefined();
    });

    unmount();

    expect(track.stop).toHaveBeenCalled();
  });

  it("shutter button has accessible label", async () => {
    mockGetUserMedia.mockResolvedValue(createMockStream());

    render(<CameraView />);

    await waitFor(() => {
      const button = screen.getByTestId("shutter-button");
      expect(button.getAttribute("aria-label")).toBe("Capture photo");
    });
  });

  it("does not call onCapture when captureFrame returns null", async () => {
    mockGetUserMedia.mockResolvedValue(createMockStream());
    const onCapture = vi.fn();

    render(<CameraView onCapture={onCapture} />);

    await waitFor(() => {
      expect(screen.getByTestId("shutter-button")).toBeDefined();
    });

    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (canvas) {
      vi.spyOn(canvas, "getContext").mockReturnValue(null);
    }

    fireEvent.click(screen.getByTestId("shutter-button"));

    await new Promise((r) => setTimeout(r, 50));
    expect(onCapture).not.toHaveBeenCalled();
  });

  it("renders with no onCapture callback without errors", async () => {
    mockGetUserMedia.mockResolvedValue(createMockStream());

    render(<CameraView />);

    await waitFor(() => {
      expect(screen.getByTestId("shutter-button")).toBeDefined();
    });

    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (canvas) {
      const mockCtx = { drawImage: vi.fn() };
      vi.spyOn(canvas, "getContext").mockReturnValue(
        mockCtx as unknown as CanvasRenderingContext2D,
      );
      vi.spyOn(canvas, "toBlob").mockImplementation((cb) => {
        cb(new Blob(["test"], { type: "image/jpeg" }));
      });
    }

    const video = document.querySelector("video") as HTMLVideoElement;
    if (video) {
      Object.defineProperty(video, "videoWidth", { value: 1920 });
      Object.defineProperty(video, "videoHeight", { value: 1080 });
    }

    fireEvent.click(screen.getByTestId("shutter-button"));

    await waitFor(() => {
      expect(screen.getByTestId("capture-flash")).toBeDefined();
    });
  });
});
