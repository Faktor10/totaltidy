// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-camera");

import { useCamera } from "@/hooks/use-camera";
import { CameraView } from "./camera-view";

const mockUseCamera = vi.mocked(useCamera);

function createDefaultReturn() {
  return {
    videoRef: { current: null },
    canvasRef: { current: null },
    isStreaming: false,
    error: null,
    startCamera: vi.fn(),
    stopCamera: vi.fn(),
    captureFrame: vi.fn().mockResolvedValue(null),
  };
}

describe("CameraView", () => {
  let defaultReturn: ReturnType<typeof createDefaultReturn>;

  beforeEach(() => {
    defaultReturn = createDefaultReturn();
    mockUseCamera.mockReturnValue(defaultReturn);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("calls startCamera on mount", () => {
    render(<CameraView />);
    expect(defaultReturn.startCamera).toHaveBeenCalledOnce();
  });

  it("renders video and canvas elements", () => {
    render(<CameraView />);
    expect(document.querySelector("video")).toBeTruthy();
    expect(document.querySelector("canvas")).toBeTruthy();
  });

  it("hides shutter button when not streaming", () => {
    render(<CameraView />);
    expect(screen.queryByLabelText("Capture")).toBeNull();
  });

  it("shows shutter button when streaming", () => {
    mockUseCamera.mockReturnValue({ ...defaultReturn, isStreaming: true });
    render(<CameraView />);
    expect(screen.getByLabelText("Capture")).toBeTruthy();
  });

  it("shows error message and retry button on error", () => {
    mockUseCamera.mockReturnValue({
      ...defaultReturn,
      error: "Camera permission was denied",
    });
    render(<CameraView />);
    expect(screen.getByText("Camera permission was denied")).toBeTruthy();
    expect(screen.getByText("Try again")).toBeTruthy();
  });

  it("calls startCamera when retry button is clicked", () => {
    mockUseCamera.mockReturnValue({
      ...defaultReturn,
      error: "Camera permission was denied",
    });
    render(<CameraView />);
    fireEvent.click(screen.getByText("Try again"));
    expect(defaultReturn.startCamera).toHaveBeenCalledTimes(2);
  });

  it("does not show shutter when error is present", () => {
    mockUseCamera.mockReturnValue({
      ...defaultReturn,
      isStreaming: true,
      error: "No camera found on this device",
    });
    render(<CameraView />);
    expect(screen.queryByLabelText("Capture")).toBeNull();
  });

  it("calls captureFrame and onCapture when shutter is clicked", async () => {
    const fakeBlob = new Blob(["image"], { type: "image/jpeg" });
    const onCapture = vi.fn();
    const captureFrame = vi.fn().mockResolvedValue(fakeBlob);

    mockUseCamera.mockReturnValue({
      ...defaultReturn,
      isStreaming: true,
      captureFrame,
    });

    render(<CameraView onCapture={onCapture} />);
    await fireEvent.click(screen.getByLabelText("Capture"));

    expect(captureFrame).toHaveBeenCalledOnce();
    await vi.waitFor(() => {
      expect(onCapture).toHaveBeenCalledWith(fakeBlob);
    });
  });

  it("does not call onCapture when captureFrame returns null", async () => {
    const onCapture = vi.fn();
    const captureFrame = vi.fn().mockResolvedValue(null);

    mockUseCamera.mockReturnValue({
      ...defaultReturn,
      isStreaming: true,
      captureFrame,
    });

    render(<CameraView onCapture={onCapture} />);
    await fireEvent.click(screen.getByLabelText("Capture"));

    expect(captureFrame).toHaveBeenCalledOnce();
    await vi.waitFor(() => {
      expect(onCapture).not.toHaveBeenCalled();
    });
  });

  it("does not crash when onCapture is not provided", async () => {
    const fakeBlob = new Blob(["image"], { type: "image/jpeg" });
    const captureFrame = vi.fn().mockResolvedValue(fakeBlob);

    mockUseCamera.mockReturnValue({
      ...defaultReturn,
      isStreaming: true,
      captureFrame,
    });

    render(<CameraView />);
    await fireEvent.click(screen.getByLabelText("Capture"));

    expect(captureFrame).toHaveBeenCalledOnce();
  });

  it("passes cameraOptions to useCamera", () => {
    const options = { facingMode: "user" as const, width: 1280 };
    render(<CameraView cameraOptions={options} />);
    expect(mockUseCamera).toHaveBeenCalledWith(options);
  });

  it("passes undefined cameraOptions by default", () => {
    render(<CameraView />);
    expect(mockUseCamera).toHaveBeenCalledWith(undefined);
  });

  it("shows flash overlay when shutter is clicked", async () => {
    const captureFrame = vi.fn().mockResolvedValue(new Blob(["img"], { type: "image/jpeg" }));
    mockUseCamera.mockReturnValue({ ...defaultReturn, isStreaming: true, captureFrame });

    render(<CameraView />);
    expect(screen.queryByTestId("shutter-flash")).toBeNull();

    await fireEvent.click(screen.getByLabelText("Capture"));
    expect(screen.getByTestId("shutter-flash")).toBeTruthy();
  });

  it("supports rapid-fire capture without blocking", async () => {
    const fakeBlob = new Blob(["image"], { type: "image/jpeg" });
    const onCapture = vi.fn();
    const captureFrame = vi.fn().mockResolvedValue(fakeBlob);

    mockUseCamera.mockReturnValue({ ...defaultReturn, isStreaming: true, captureFrame });

    render(<CameraView onCapture={onCapture} />);
    const shutter = screen.getByLabelText("Capture");

    await fireEvent.click(shutter);
    await fireEvent.click(shutter);
    await fireEvent.click(shutter);

    expect(captureFrame).toHaveBeenCalledTimes(3);
    await vi.waitFor(() => {
      expect(onCapture).toHaveBeenCalledTimes(3);
    });
  });

  it("keeps shutter button enabled during capture", async () => {
    const captureFrame = vi.fn().mockResolvedValue(new Blob(["img"], { type: "image/jpeg" }));
    mockUseCamera.mockReturnValue({ ...defaultReturn, isStreaming: true, captureFrame });

    render(<CameraView />);
    const shutter = screen.getByLabelText("Capture");

    await fireEvent.click(shutter);
    expect((shutter as HTMLButtonElement).disabled).toBe(false);
  });
});
