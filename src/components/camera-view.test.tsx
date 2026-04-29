// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockStartCamera = vi.fn();
const mockStopCamera = vi.fn();
const mockCaptureFrame = vi.fn();

vi.mock("@/hooks/use-camera", () => ({
  useCamera: vi.fn(() => ({
    videoRef: { current: null },
    canvasRef: { current: null },
    isStreaming: true,
    error: null,
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    captureFrame: mockCaptureFrame,
  })),
}));

import { useCamera } from "@/hooks/use-camera";
import { CameraView } from "./camera-view";

const mockUseCamera = vi.mocked(useCamera);

describe("CameraView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      canvasRef: { current: null },
      isStreaming: true,
      error: null,
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the camera view container", () => {
    render(<CameraView />);
    expect(screen.getByTestId("camera-view")).toBeDefined();
  });

  it("starts the camera on mount", () => {
    render(<CameraView />);
    expect(mockStartCamera).toHaveBeenCalledOnce();
  });

  it("stops the camera on unmount", () => {
    const { unmount } = render(<CameraView />);
    unmount();
    expect(mockStopCamera).toHaveBeenCalled();
  });

  it("renders the shutter button when streaming", () => {
    render(<CameraView />);
    const shutter = screen.getByTestId("shutter-button");
    expect(shutter).toBeDefined();
    expect(shutter.hasAttribute("disabled")).toBe(false);
  });

  it("disables shutter button when not streaming", () => {
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      canvasRef: { current: null },
      isStreaming: false,
      error: null,
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    });

    render(<CameraView />);
    const shutter = screen.getByTestId("shutter-button");
    expect(shutter.hasAttribute("disabled")).toBe(true);
  });

  it("calls onCapture with blob when shutter is pressed", async () => {
    const fakeBlob = new Blob(["fake-image"], { type: "image/jpeg" });
    mockCaptureFrame.mockResolvedValue(fakeBlob);

    const onCapture = vi.fn();
    render(<CameraView onCapture={onCapture} />);

    fireEvent.click(screen.getByTestId("shutter-button"));

    await waitFor(() => {
      expect(mockCaptureFrame).toHaveBeenCalledOnce();
      expect(onCapture).toHaveBeenCalledWith(fakeBlob);
    });
  });

  it("does not call onCapture when captureFrame returns null", async () => {
    mockCaptureFrame.mockResolvedValue(null);

    const onCapture = vi.fn();
    render(<CameraView onCapture={onCapture} />);

    fireEvent.click(screen.getByTestId("shutter-button"));

    await waitFor(() => {
      expect(mockCaptureFrame).toHaveBeenCalledOnce();
    });
    expect(onCapture).not.toHaveBeenCalled();
  });

  it("shows error overlay when camera has an error", () => {
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      canvasRef: { current: null },
      isStreaming: false,
      error: "Camera permission was denied",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    });

    render(<CameraView />);
    expect(screen.getByTestId("camera-error")).toBeDefined();
    expect(screen.getByText("Camera permission was denied")).toBeDefined();
  });

  it("hides shutter button when error is shown", () => {
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      canvasRef: { current: null },
      isStreaming: false,
      error: "No camera found on this device",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    });

    render(<CameraView />);
    expect(screen.queryByTestId("shutter-button")).toBeNull();
  });

  it("retries camera when retry button is clicked", () => {
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      canvasRef: { current: null },
      isStreaming: false,
      error: "Failed to access camera",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    });

    render(<CameraView />);
    mockStartCamera.mockClear();

    fireEvent.click(screen.getByText("Try again"));
    expect(mockStartCamera).toHaveBeenCalledOnce();
  });

  it("renders close button when onClose is provided", () => {
    const onClose = vi.fn();
    render(<CameraView onClose={onClose} />);
    expect(screen.getByTestId("close-button")).toBeDefined();
  });

  it("does not render close button when onClose is not provided", () => {
    render(<CameraView />);
    expect(screen.queryByTestId("close-button")).toBeNull();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<CameraView onClose={onClose} />);

    fireEvent.click(screen.getByTestId("close-button"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("passes facingMode to useCamera", () => {
    render(<CameraView facingMode="user" />);
    expect(mockUseCamera).toHaveBeenCalledWith({ facingMode: "user" });
  });

  it("uses environment facing mode by default", () => {
    render(<CameraView />);
    expect(mockUseCamera).toHaveBeenCalledWith({ facingMode: "environment" });
  });

  it("camera stays live after capture — stopCamera is not called on shutter press", async () => {
    const fakeBlob = new Blob(["fake-image"], { type: "image/jpeg" });
    mockCaptureFrame.mockResolvedValue(fakeBlob);

    render(<CameraView onCapture={vi.fn()} />);
    mockStopCamera.mockClear();

    fireEvent.click(screen.getByTestId("shutter-button"));

    await waitFor(() => {
      expect(mockCaptureFrame).toHaveBeenCalledOnce();
    });
    expect(mockStopCamera).not.toHaveBeenCalled();
  });

  it("renders video element with correct attributes", () => {
    render(<CameraView />);
    const video = document.querySelector("video");
    expect(video).toBeDefined();
    expect(video?.hasAttribute("autoplay")).toBe(true);
    expect(video?.getAttribute("playsinline")).not.toBeNull();
    expect(video?.muted).toBe(true);
  });
});
