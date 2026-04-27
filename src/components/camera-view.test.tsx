// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockStartCamera = vi.fn();
const mockStopCamera = vi.fn();
const mockCapture = vi.fn();

vi.mock("@/hooks/use-camera", () => ({
  useCamera: vi.fn(() => ({
    videoRef: { current: null },
    isActive: true,
    error: null,
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    capture: mockCapture,
  })),
}));

import { useCamera } from "@/hooks/use-camera";
import { CameraView } from "./camera-view";

const mockUseCamera = vi.mocked(useCamera);

function makeCaptureResult(id = "1") {
  const blob = new Blob([`test-${id}`], { type: "image/jpeg" });
  return { blob, blobUrl: `blob:http://localhost/${id}` };
}

describe("CameraView", () => {
  beforeEach(() => {
    mockStartCamera.mockReset();
    mockStopCamera.mockReset();
    mockCapture.mockReset();
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      isActive: true,
      error: null,
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      capture: mockCapture,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the camera container", () => {
    render(<CameraView />);
    expect(screen.getByTestId("camera-view")).toBeDefined();
  });

  it("renders video element", () => {
    render(<CameraView />);
    expect(screen.getByTestId("camera-video")).toBeDefined();
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
    const result = makeCaptureResult();
    mockCapture.mockResolvedValue(result);
    const onCapture = vi.fn();

    render(<CameraView onCapture={onCapture} />);
    fireEvent.click(screen.getByTestId("shutter-button"));

    await vi.waitFor(() => {
      expect(onCapture).toHaveBeenCalledWith(result.blob);
    });
  });

  it("does not call onCapture when capture returns null", async () => {
    mockCapture.mockResolvedValue(null);
    const onCapture = vi.fn();

    render(<CameraView onCapture={onCapture} />);
    fireEvent.click(screen.getByTestId("shutter-button"));

    await vi.waitFor(() => {
      expect(mockCapture).toHaveBeenCalled();
    });
    expect(onCapture).not.toHaveBeenCalled();
  });

  it("disables shutter button when not active", () => {
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      isActive: false,
      error: null,
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      capture: mockCapture,
    });

    render(<CameraView />);
    const button = screen.getByTestId("shutter-button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("shows loading indicator when not active and no error", () => {
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      isActive: false,
      error: null,
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      capture: mockCapture,
    });

    render(<CameraView />);
    expect(screen.getByTestId("camera-loading")).toBeDefined();
  });

  it("shows error message when camera has error", () => {
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      isActive: false,
      error: "Camera permission was denied",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      capture: mockCapture,
    });

    render(<CameraView />);
    expect(screen.getByText("Camera permission was denied")).toBeDefined();
  });

  it("shows retry button on error", () => {
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      isActive: false,
      error: "Camera permission was denied",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      capture: mockCapture,
    });

    render(<CameraView />);
    const retryButton = screen.getByText("Try again");
    expect(retryButton).toBeDefined();
  });

  it("calls startCamera when retry button is clicked", () => {
    mockUseCamera.mockReturnValue({
      videoRef: { current: null },
      isActive: false,
      error: "Camera permission was denied",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      capture: mockCapture,
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
      isActive: false,
      error: "No camera found on this device",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      capture: mockCapture,
    });

    const onClose = vi.fn();
    render(<CameraView onClose={onClose} />);
    const goBackButton = screen.getByText("Go back");
    expect(goBackButton).toBeDefined();
    fireEvent.click(goBackButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps camera streaming after capture (does not stop camera)", async () => {
    const result = makeCaptureResult();
    mockCapture.mockResolvedValue(result);
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
      isActive: false,
      error: "Camera permission was denied",
      startCamera: mockStartCamera,
      stopCamera: mockStopCamera,
      capture: mockCapture,
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

  describe("thumbnail tray", () => {
    it("does not show thumbnail tray before any captures", () => {
      render(<CameraView />);
      expect(screen.queryByTestId("thumbnail-tray")).toBeNull();
    });

    it("shows a thumbnail after capturing", async () => {
      const result = makeCaptureResult("a");
      mockCapture.mockResolvedValue(result);

      render(<CameraView />);
      fireEvent.click(screen.getByTestId("shutter-button"));

      await vi.waitFor(() => {
        expect(screen.getByTestId("thumbnail-tray")).toBeDefined();
      });

      const thumbnails = screen.getAllByTestId("thumbnail");
      expect(thumbnails).toHaveLength(1);
      expect((thumbnails[0] as HTMLImageElement).src).toBe(result.blobUrl);
    });

    it("shows multiple thumbnails after multiple captures", async () => {
      let callCount = 0;
      mockCapture.mockImplementation(() => {
        callCount++;
        return Promise.resolve(makeCaptureResult(String(callCount)));
      });

      render(<CameraView />);

      fireEvent.click(screen.getByTestId("shutter-button"));
      await vi.waitFor(() => {
        expect(screen.getAllByTestId("thumbnail")).toHaveLength(1);
      });

      fireEvent.click(screen.getByTestId("shutter-button"));
      await vi.waitFor(() => {
        expect(screen.getAllByTestId("thumbnail")).toHaveLength(2);
      });

      fireEvent.click(screen.getByTestId("shutter-button"));
      await vi.waitFor(() => {
        expect(screen.getAllByTestId("thumbnail")).toHaveLength(3);
      });
    });

    it("limits thumbnails to 4", async () => {
      let callCount = 0;
      mockCapture.mockImplementation(() => {
        callCount++;
        return Promise.resolve(makeCaptureResult(String(callCount)));
      });

      render(<CameraView />);

      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByTestId("shutter-button"));
        await vi.waitFor(() => {
          expect(mockCapture).toHaveBeenCalledTimes(i + 1);
        });
      }

      await vi.waitFor(() => {
        expect(screen.getAllByTestId("thumbnail")).toHaveLength(4);
      });
    });

    it("shows newest capture first", async () => {
      let callCount = 0;
      mockCapture.mockImplementation(() => {
        callCount++;
        return Promise.resolve(makeCaptureResult(String(callCount)));
      });

      render(<CameraView />);

      fireEvent.click(screen.getByTestId("shutter-button"));
      await vi.waitFor(() => {
        expect(screen.getAllByTestId("thumbnail")).toHaveLength(1);
      });

      fireEvent.click(screen.getByTestId("shutter-button"));
      await vi.waitFor(() => {
        expect(screen.getAllByTestId("thumbnail")).toHaveLength(2);
      });

      const thumbnails = screen.getAllByTestId("thumbnail");
      expect((thumbnails[0] as HTMLImageElement).src).toBe("blob:http://localhost/2");
      expect((thumbnails[1] as HTMLImageElement).src).toBe("blob:http://localhost/1");
    });

    it("does not show thumbnail tray when capture returns null", async () => {
      mockCapture.mockResolvedValue(null);

      render(<CameraView />);
      fireEvent.click(screen.getByTestId("shutter-button"));

      await vi.waitFor(() => {
        expect(mockCapture).toHaveBeenCalled();
      });

      expect(screen.queryByTestId("thumbnail-tray")).toBeNull();
    });

    it("revokes blob URLs on unmount", async () => {
      const revokeObjectURL = vi.fn();
      vi.stubGlobal("URL", { ...globalThis.URL, revokeObjectURL });

      const result = makeCaptureResult("cleanup");
      mockCapture.mockResolvedValue(result);

      const { unmount } = render(<CameraView />);
      fireEvent.click(screen.getByTestId("shutter-button"));

      await vi.waitFor(() => {
        expect(screen.getAllByTestId("thumbnail")).toHaveLength(1);
      });

      unmount();
      expect(revokeObjectURL).toHaveBeenCalledWith(result.blobUrl);

      vi.unstubAllGlobals();
    });
  });
});
