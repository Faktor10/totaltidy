// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    mockStartCamera.mockReset();
    mockStopCamera.mockReset();
    mockCaptureFrame.mockReset();
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

  it("renders the camera container", () => {
    render(<CameraView />);
    expect(screen.getByTestId("camera-view")).toBeDefined();
  });

  it("renders video and canvas elements", () => {
    render(<CameraView />);
    expect(screen.getByTestId("camera-video")).toBeDefined();
    expect(screen.getByTestId("camera-canvas")).toBeDefined();
  });

  it("renders the shutter button", () => {
    render(<CameraView />);
    expect(screen.getByTestId("shutter-button")).toBeDefined();
  });

  it("starts camera on mount", () => {
    render(<CameraView />);
    expect(mockStartCamera).toHaveBeenCalledOnce();
  });

  it("stops camera on unmount", () => {
    const { unmount } = render(<CameraView />);
    unmount();
    expect(mockStopCamera).toHaveBeenCalled();
  });

  it("calls onCapture with blob when shutter is pressed", async () => {
    const blob = new Blob(["test"], { type: "image/jpeg" });
    mockCaptureFrame.mockResolvedValue(blob);
    const onCapture = vi.fn();

    render(<CameraView onCapture={onCapture} />);
    fireEvent.click(screen.getByTestId("shutter-button"));

    await vi.waitFor(() => {
      expect(onCapture).toHaveBeenCalledWith(blob);
    });
  });

  it("does not call onCapture when captureFrame returns null", async () => {
    mockCaptureFrame.mockResolvedValue(null);
    const onCapture = vi.fn();

    render(<CameraView onCapture={onCapture} />);
    fireEvent.click(screen.getByTestId("shutter-button"));

    await vi.waitFor(() => {
      expect(mockCaptureFrame).toHaveBeenCalled();
    });
    expect(onCapture).not.toHaveBeenCalled();
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
    const button = screen.getByTestId("shutter-button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("shows loading indicator when not streaming and no error", () => {
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
    expect(screen.getByTestId("camera-loading")).toBeDefined();
  });

  it("shows error message when camera has error", () => {
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
    expect(screen.getByText("Camera permission was denied")).toBeDefined();
  });

  it("shows retry button on error", () => {
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
    const retryButton = screen.getByText("Try again");
    expect(retryButton).toBeDefined();
  });

  it("calls startCamera when retry button is clicked", () => {
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
    mockStartCamera.mockReset();
    fireEvent.click(screen.getByText("Try again"));
    expect(mockStartCamera).toHaveBeenCalledOnce();
  });

  it("renders close button when onClose is provided", () => {
    render(<CameraView onClose={() => {}} />);
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

  it("shows go back button on error when onClose is provided", () => {
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      canvasRef: { current: null },
      isStreaming: false,
      error: "No camera found on this device",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    });

    const onClose = vi.fn();
    render(<CameraView onClose={onClose} />);
    const goBackButton = screen.getByText("Go back");
    expect(goBackButton).toBeDefined();
    fireEvent.click(goBackButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps camera streaming after capture (does not stop camera)", async () => {
    const blob = new Blob(["test"], { type: "image/jpeg" });
    mockCaptureFrame.mockResolvedValue(blob);
    const onCapture = vi.fn();

    render(<CameraView onCapture={onCapture} />);
    fireEvent.click(screen.getByTestId("shutter-button"));

    await vi.waitFor(() => {
      expect(onCapture).toHaveBeenCalled();
    });

    expect(mockStopCamera).not.toHaveBeenCalled();
  });

  it("does not show video/shutter in error state", () => {
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
    expect(screen.queryByTestId("camera-video")).toBeNull();
    expect(screen.queryByTestId("shutter-button")).toBeNull();
  });

  it("video element has correct attributes", () => {
    render(<CameraView />);
    const video = screen.getByTestId("camera-video") as HTMLVideoElement;
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.playsInline).toBe(true);
  });
});
