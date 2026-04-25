// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockStartCamera = vi.fn();
const mockStopCamera = vi.fn();
const mockCaptureFrame = vi.fn();
const mockVideoRef = { current: null as HTMLVideoElement | null };
const mockCanvasRef = { current: null as HTMLCanvasElement | null };
const mockUseCamera = vi.fn(() => ({
  videoRef: mockVideoRef,
  canvasRef: mockCanvasRef,
  isStreaming: true,
  error: null as string | null,
  startCamera: mockStartCamera,
  stopCamera: mockStopCamera,
  captureFrame: mockCaptureFrame,
}));

vi.mock("@/hooks/use-camera", () => ({
  useCamera: (...args: unknown[]) => mockUseCamera(...args),
}));

import { CameraView } from "./camera-view";

describe("CameraView", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockUseCamera.mockImplementation(() => ({
      videoRef: mockVideoRef,
      canvasRef: mockCanvasRef,
      isStreaming: true,
      error: null,
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    }));
  });

  it("calls startCamera on mount", () => {
    render(<CameraView />);
    expect(mockStartCamera).toHaveBeenCalledOnce();
  });

  it("calls stopCamera on unmount", () => {
    const { unmount } = render(<CameraView />);
    unmount();
    expect(mockStopCamera).toHaveBeenCalled();
  });

  it("renders a video element", () => {
    render(<CameraView />);
    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    expect(video?.getAttribute("autoplay")).not.toBeNull();
    expect(video?.getAttribute("playsinline")).not.toBeNull();
  });

  it("renders a hidden canvas element", () => {
    render(<CameraView />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders the shutter button", () => {
    render(<CameraView />);
    const button = screen.getByRole("button", { name: /take photo/i });
    expect(button).toBeTruthy();
    expect(button.disabled).toBe(false);
  });

  it("disables shutter button when not streaming", () => {
    mockUseCamera.mockReturnValue({
      videoRef: mockVideoRef,
      canvasRef: mockCanvasRef,
      isStreaming: false,
      error: null,
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    });

    render(<CameraView />);
    const button = screen.getByRole("button", { name: /take photo/i });
    expect(button.disabled).toBe(true);
  });

  it("calls captureFrame and onCapture when shutter is clicked", async () => {
    const fakeBlob = new Blob(["test"], { type: "image/jpeg" });
    mockCaptureFrame.mockResolvedValue(fakeBlob);

    const onCapture = vi.fn();
    render(<CameraView onCapture={onCapture} />);

    const button = screen.getByRole("button", { name: /take photo/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockCaptureFrame).toHaveBeenCalledOnce();
      expect(onCapture).toHaveBeenCalledWith(fakeBlob);
    });
  });

  it("does not call onCapture when captureFrame returns null", async () => {
    mockCaptureFrame.mockResolvedValue(null);

    const onCapture = vi.fn();
    render(<CameraView onCapture={onCapture} />);

    const button = screen.getByRole("button", { name: /take photo/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockCaptureFrame).toHaveBeenCalledOnce();
    });
    expect(onCapture).not.toHaveBeenCalled();
  });

  it("displays error message when camera has an error", () => {
    mockUseCamera.mockReturnValue({
      videoRef: mockVideoRef,
      canvasRef: mockCanvasRef,
      isStreaming: false,
      error: "Camera permission was denied",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    });

    render(<CameraView />);
    expect(screen.getByText("Camera permission was denied")).toBeTruthy();
    expect(screen.getByText("Try again")).toBeTruthy();
  });

  it("calls startCamera when retry button is clicked", () => {
    mockUseCamera.mockReturnValue({
      videoRef: mockVideoRef,
      canvasRef: mockCanvasRef,
      isStreaming: false,
      error: "Camera permission was denied",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    });

    render(<CameraView />);
    mockStartCamera.mockClear();

    fireEvent.click(screen.getByText("Try again"));
    expect(mockStartCamera).toHaveBeenCalledOnce();
  });

  it("calls onError when error occurs", () => {
    const onError = vi.fn();

    mockUseCamera.mockReturnValue({
      videoRef: mockVideoRef,
      canvasRef: mockCanvasRef,
      isStreaming: false,
      error: "No camera found on this device",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      captureFrame: mockCaptureFrame,
    });

    render(<CameraView onError={onError} />);
    expect(onError).toHaveBeenCalledWith("No camera found on this device");
  });

  it("renders close button when onClose is provided", () => {
    const onClose = vi.fn();
    render(<CameraView onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: /close camera/i });
    expect(closeBtn).toBeTruthy();

    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not render close button when onClose is not provided", () => {
    render(<CameraView />);
    expect(screen.queryByRole("button", { name: /close camera/i })).toBeNull();
  });

  it("camera stays live after capture — stopCamera is not called", async () => {
    const fakeBlob = new Blob(["test"], { type: "image/jpeg" });
    mockCaptureFrame.mockResolvedValue(fakeBlob);

    render(<CameraView onCapture={vi.fn()} />);
    mockStopCamera.mockClear();

    const button = screen.getByRole("button", { name: /take photo/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockCaptureFrame).toHaveBeenCalledOnce();
    });

    expect(mockStopCamera).not.toHaveBeenCalled();
  });

  it("supports rapid-fire multiple captures without stopping camera", async () => {
    const fakeBlob = new Blob(["test"], { type: "image/jpeg" });
    mockCaptureFrame.mockResolvedValue(fakeBlob);

    const onCapture = vi.fn();
    render(<CameraView onCapture={onCapture} />);
    mockStopCamera.mockClear();

    const button = screen.getByRole("button", { name: /take photo/i });

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockCaptureFrame).toHaveBeenCalledTimes(3);
    });

    expect(mockStopCamera).not.toHaveBeenCalled();
  });
});
