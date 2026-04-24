// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCamera } from "./use-camera";

function createMockTrack(): MediaStreamTrack {
  return { stop: vi.fn(), kind: "video" } as unknown as MediaStreamTrack;
}

function createMockStream(tracks: MediaStreamTrack[] = [createMockTrack()]): MediaStream {
  return { getTracks: () => tracks } as unknown as MediaStream;
}

function createMockVideo(): HTMLVideoElement {
  return {
    srcObject: null,
    play: vi.fn().mockResolvedValue(undefined),
    videoWidth: 1920,
    videoHeight: 1080,
  } as unknown as HTMLVideoElement;
}

function createMockCanvas(): HTMLCanvasElement {
  const ctx = {
    drawImage: vi.fn(),
  };
  return {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(ctx),
    toBlob: vi.fn().mockImplementation((cb: BlobCallback) => {
      cb(new Blob(["fake-image"], { type: "image/jpeg" }));
    }),
  } as unknown as HTMLCanvasElement;
}

describe("useCamera", () => {
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
    vi.restoreAllMocks();
  });

  it("initialises with streaming off and no error", () => {
    const { result } = renderHook(() => useCamera());

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("provides refs for video and canvas", () => {
    const { result } = renderHook(() => useCamera());

    expect(result.current.videoRef).toBeDefined();
    expect(result.current.canvasRef).toBeDefined();
    expect(result.current.videoRef.current).toBeNull();
    expect(result.current.canvasRef.current).toBeNull();
  });

  it("sets error when getUserMedia is not supported", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { mediaDevices: undefined },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.error).toBe("Camera access is not supported in this browser");
    expect(result.current.isStreaming).toBe(false);
  });

  it("requests camera with default constraints", async () => {
    const stream = createMockStream();
    mockGetUserMedia.mockResolvedValue(stream);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
  });

  it("requests camera with custom facing mode", async () => {
    const stream = createMockStream();
    mockGetUserMedia.mockResolvedValue(stream);

    const { result } = renderHook(() => useCamera({ facingMode: "user" }));

    await act(async () => {
      await result.current.startCamera();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({ facingMode: "user" }),
      }),
    );
  });

  it("sets isStreaming to true after successful start", async () => {
    const stream = createMockStream();
    mockGetUserMedia.mockResolvedValue(stream);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isStreaming).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("attaches stream to video element and plays", async () => {
    const stream = createMockStream();
    mockGetUserMedia.mockResolvedValue(stream);

    const { result } = renderHook(() => useCamera());
    const mockVideo = createMockVideo();
    (result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current =
      mockVideo;

    await act(async () => {
      await result.current.startCamera();
    });

    expect(mockVideo.srcObject).toBe(stream);
    expect(mockVideo.play).toHaveBeenCalledOnce();
  });

  it("sets permission denied error on NotAllowedError", async () => {
    const err = new DOMException("Permission denied", "NotAllowedError");
    mockGetUserMedia.mockRejectedValue(err);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.error).toBe("Camera permission was denied");
    expect(result.current.isStreaming).toBe(false);
  });

  it("sets no camera error on NotFoundError", async () => {
    const err = new DOMException("No device", "NotFoundError");
    mockGetUserMedia.mockRejectedValue(err);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.error).toBe("No camera found on this device");
  });

  it("sets generic error for unknown failures", async () => {
    mockGetUserMedia.mockRejectedValue(new Error("something broke"));

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.error).toBe("Failed to access camera");
  });

  it("stops all tracks and resets state on stopCamera", async () => {
    const track = createMockTrack();
    const stream = createMockStream([track]);
    mockGetUserMedia.mockResolvedValue(stream);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.isStreaming).toBe(true);

    act(() => {
      result.current.stopCamera();
    });

    expect(track.stop).toHaveBeenCalledOnce();
    expect(result.current.isStreaming).toBe(false);
  });

  it("clears video srcObject on stop", async () => {
    const stream = createMockStream();
    mockGetUserMedia.mockResolvedValue(stream);

    const { result } = renderHook(() => useCamera());
    const mockVideo = createMockVideo();
    (result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current =
      mockVideo;

    await act(async () => {
      await result.current.startCamera();
    });
    act(() => {
      result.current.stopCamera();
    });

    expect(mockVideo.srcObject).toBeNull();
  });

  it("stops existing stream before starting a new one", async () => {
    const track1 = createMockTrack();
    const stream1 = createMockStream([track1]);
    const stream2 = createMockStream();
    mockGetUserMedia.mockResolvedValueOnce(stream1).mockResolvedValueOnce(stream2);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });
    await act(async () => {
      await result.current.startCamera();
    });

    expect(track1.stop).toHaveBeenCalledOnce();
  });

  it("captures frame as blob from canvas", async () => {
    const stream = createMockStream();
    mockGetUserMedia.mockResolvedValue(stream);

    const { result } = renderHook(() => useCamera());
    const mockVideo = createMockVideo();
    const mockCanvas = createMockCanvas();
    (result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current =
      mockVideo;
    (result.current.canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current =
      mockCanvas;

    await act(async () => {
      await result.current.startCamera();
    });

    let blob: Blob | null = null;
    await act(async () => {
      blob = await result.current.captureFrame();
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(mockCanvas.width).toBe(1920);
    expect(mockCanvas.height).toBe(1080);
    expect(mockCanvas.getContext).toHaveBeenCalledWith("2d");
    const ctx = mockCanvas.getContext("2d");
    expect(ctx.drawImage).toHaveBeenCalledWith(mockVideo, 0, 0);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.92);
  });

  it("returns null from captureFrame when not streaming", async () => {
    const { result } = renderHook(() => useCamera());
    const mockVideo = createMockVideo();
    const mockCanvas = createMockCanvas();
    (result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current =
      mockVideo;
    (result.current.canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current =
      mockCanvas;

    let blob: Blob | null = null;
    await act(async () => {
      blob = await result.current.captureFrame();
    });

    expect(blob).toBeNull();
  });

  it("returns null from captureFrame when video ref is missing", async () => {
    const stream = createMockStream();
    mockGetUserMedia.mockResolvedValue(stream);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    let blob: Blob | null = null;
    await act(async () => {
      blob = await result.current.captureFrame();
    });

    expect(blob).toBeNull();
  });

  it("captures with custom image format and quality", async () => {
    const stream = createMockStream();
    mockGetUserMedia.mockResolvedValue(stream);

    const { result } = renderHook(() => useCamera({ imageFormat: "image/png", imageQuality: 1.0 }));
    const mockVideo = createMockVideo();
    const mockCanvas = createMockCanvas();
    (result.current.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current =
      mockVideo;
    (result.current.canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current =
      mockCanvas;

    await act(async () => {
      await result.current.startCamera();
    });
    await act(async () => {
      await result.current.captureFrame();
    });

    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png", 1.0);
  });

  it("stops tracks on unmount", async () => {
    const track = createMockTrack();
    const stream = createMockStream([track]);
    mockGetUserMedia.mockResolvedValue(stream);

    const { result, unmount } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    unmount();

    expect(track.stop).toHaveBeenCalled();
  });

  it("clears error when starting camera again", async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error("fail"));
    mockGetUserMedia.mockResolvedValueOnce(createMockStream());

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.error).toBe("Failed to access camera");

    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isStreaming).toBe(true);
  });
});
