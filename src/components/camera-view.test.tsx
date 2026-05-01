// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockStartCamera = vi.fn();
const mockStopCamera = vi.fn();
const mockCaptureFrame = vi.fn();

vi.mock("@/hooks/use-camera", () => ({
  useCamera: () => ({
    videoRef: { current: null },
    canvasRef: { current: null },
    isStreaming: mockIsStreaming,
    error: mockError,
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    captureFrame: mockCaptureFrame,
  }),
}));

let mockIsStreaming = false;
let mockError: string | null = null;

describe("CameraView", () => {
  beforeEach(() => {
    mockIsStreaming = false;
    mockError = null;
    mockStartCamera.mockReset();
    mockStopCamera.mockReset();
    mockCaptureFrame.mockReset().mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  async function renderCameraView(props: Record<string, unknown> = {}) {
    const { CameraView } = await import("./camera-view");
    return render(<CameraView {...props} />);
  }

  it("starts camera on mount", async () => {
    await renderCameraView();
    expect(mockStartCamera).toHaveBeenCalledOnce();
  });

  it("stops camera on unmount", async () => {
    const { unmount } = await renderCameraView();
    unmount();
    expect(mockStopCamera).toHaveBeenCalled();
  });

  it("renders shutter button", async () => {
    await renderCameraView();
    expect(screen.getByRole("button", { name: "Capture photo" })).toBeDefined();
  });

  it("disables shutter when not streaming", async () => {
    mockIsStreaming = false;
    await renderCameraView();
    const shutter = screen.getByRole("button", { name: "Capture photo" });
    expect((shutter as HTMLButtonElement).disabled).toBe(true);
  });

  it("enables shutter when streaming", async () => {
    mockIsStreaming = true;
    await renderCameraView();
    const shutter = screen.getByRole("button", { name: "Capture photo" });
    expect((shutter as HTMLButtonElement).disabled).toBe(false);
  });

  it("calls captureFrame and onCapture when shutter is clicked", async () => {
    mockIsStreaming = true;
    const fakeBlob = new Blob(["test"], { type: "image/jpeg" });
    mockCaptureFrame.mockResolvedValue(fakeBlob);
    const onCapture = vi.fn();

    await renderCameraView({ onCapture });
    const shutter = screen.getByRole("button", { name: "Capture photo" });
    fireEvent.click(shutter);

    await vi.waitFor(() => {
      expect(mockCaptureFrame).toHaveBeenCalledOnce();
      expect(onCapture).toHaveBeenCalledWith(fakeBlob);
    });
  });

  it("does not call onCapture when captureFrame returns null", async () => {
    mockIsStreaming = true;
    mockCaptureFrame.mockResolvedValue(null);
    const onCapture = vi.fn();

    await renderCameraView({ onCapture });
    const shutter = screen.getByRole("button", { name: "Capture photo" });
    fireEvent.click(shutter);

    await vi.waitFor(() => {
      expect(mockCaptureFrame).toHaveBeenCalledOnce();
    });
    expect(onCapture).not.toHaveBeenCalled();
  });

  it("displays error message when error exists", async () => {
    mockError = "Camera permission was denied";
    await renderCameraView();
    expect(screen.getByText("Camera permission was denied")).toBeDefined();
  });

  it("shows retry button on error", async () => {
    mockError = "No camera found on this device";
    await renderCameraView();
    const retryButton = screen.getByRole("button", { name: "Try again" });
    expect(retryButton).toBeDefined();
    fireEvent.click(retryButton);
    expect(mockStartCamera).toHaveBeenCalledTimes(2);
  });

  it("renders close button when onClose is provided", async () => {
    await renderCameraView({ onClose: vi.fn() });
    expect(screen.getByRole("button", { name: "Close camera" })).toBeDefined();
  });

  it("does not render close button when onClose is not provided", async () => {
    await renderCameraView();
    expect(screen.queryByRole("button", { name: "Close camera" })).toBeNull();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    await renderCameraView({ onClose });
    const closeButton = screen.getByRole("button", { name: "Close camera" });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders video element with playsInline attribute", async () => {
    await renderCameraView();
    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(video?.playsInline).toBe(true);
  });

  it("renders hidden canvas for frame capture", async () => {
    await renderCameraView();
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });
});
