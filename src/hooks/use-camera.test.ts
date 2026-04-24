// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCamera } from "./use-camera";

const mockStop = vi.fn();
const mockGetTracks = vi.fn(() => [{ stop: mockStop, kind: "video" }]);
const mockStream = { getTracks: mockGetTracks } as unknown as MediaStream;
const mockGetUserMedia = vi.fn();

function mockVideoElement() {
  return {
    srcObject: null as MediaStream | null,
    play: vi.fn().mockResolvedValue(undefined),
    videoWidth: 1920,
    videoHeight: 1080,
  } as unknown as HTMLVideoElement;
}

beforeEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia: mockGetUserMedia },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  mockStop.mockClear();
  mockGetTracks.mockClear();
  mockGetUserMedia.mockReset();
});

describe("useCamera", () => {
  it("returns initial state with isReady false and no error", () => {
    const { result } = renderHook(() => useCamera());

    expect(result.current.isReady).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.videoRef.current).toBeNull();
  });

  it("sets error when getUserMedia is not supported", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.error).toBe("Camera access is not supported in this browser");
    expect(result.current.isReady).toBe(false);
  });

  it("sets error on NotAllowedError (permission denied)", async () => {
    const permissionError = new DOMException("Permission denied", "NotAllowedError");
    mockGetUserMedia.mockRejectedValue(permissionError);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.error).toBe("Camera permission denied");
    expect(result.current.isReady).toBe(false);
  });

  it("sets error on NotFoundError (no camera)", async () => {
    const notFoundError = new DOMException("No device", "NotFoundError");
    mockGetUserMedia.mockRejectedValue(notFoundError);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.error).toBe("No camera found on this device");
  });

  it("sets generic error for unknown failures", async () => {
    mockGetUserMedia.mockRejectedValue(new Error("Something went wrong"));

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.error).toBe("Something went wrong");
  });

  it("starts camera and sets isReady when video element is attached", async () => {
    mockGetUserMedia.mockResolvedValue(mockStream);
    const video = mockVideoElement();

    const { result } = renderHook(() => useCamera());
    result.current.videoRef.current = video;

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isReady).toBe(true);
    expect(result.current.error).toBeNull();
    expect(video.srcObject).toBe(mockStream);
    expect(video.play).toHaveBeenCalledOnce();
  });

  it("requests environment-facing camera by default", async () => {
    mockGetUserMedia.mockResolvedValue(mockStream);
    const video = mockVideoElement();

    const { result } = renderHook(() => useCamera());
    result.current.videoRef.current = video;

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

  it("respects custom facingMode and resolution", async () => {
    mockGetUserMedia.mockResolvedValue(mockStream);
    const video = mockVideoElement();

    const { result } = renderHook(() =>
      useCamera({ facingMode: "user", width: 1280, height: 720 }),
    );
    result.current.videoRef.current = video;

    await act(async () => {
      await result.current.startCamera();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  });

  it("stops camera by stopping all tracks and clearing srcObject", async () => {
    mockGetUserMedia.mockResolvedValue(mockStream);
    const video = mockVideoElement();

    const { result } = renderHook(() => useCamera());
    result.current.videoRef.current = video;

    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.isReady).toBe(true);

    act(() => {
      result.current.stopCamera();
    });

    expect(mockStop).toHaveBeenCalled();
    expect(video.srcObject).toBeNull();
    expect(result.current.isReady).toBe(false);
  });

  it("stops existing stream before starting a new one", async () => {
    const firstStop = vi.fn();
    const firstStream = {
      getTracks: () => [{ stop: firstStop, kind: "video" }],
    } as unknown as MediaStream;
    const secondStream = {
      getTracks: () => [{ stop: vi.fn(), kind: "video" }],
    } as unknown as MediaStream;

    mockGetUserMedia.mockResolvedValueOnce(firstStream).mockResolvedValueOnce(secondStream);
    const video = mockVideoElement();

    const { result } = renderHook(() => useCamera());
    result.current.videoRef.current = video;

    await act(async () => {
      await result.current.startCamera();
    });
    await act(async () => {
      await result.current.startCamera();
    });

    expect(firstStop).toHaveBeenCalled();
  });

  it("clears previous error on new startCamera call", async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error("first failure"));

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.error).toBe("first failure");

    mockGetUserMedia.mockResolvedValueOnce(mockStream);
    result.current.videoRef.current = mockVideoElement();

    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.error).toBeNull();
  });

  it("capture returns null when camera is not ready", async () => {
    const { result } = renderHook(() => useCamera());

    const captureResult = await act(async () => {
      return result.current.capture();
    });

    expect(captureResult).toBeNull();
  });

  it("cleans up stream on unmount", async () => {
    mockGetUserMedia.mockResolvedValue(mockStream);
    const video = mockVideoElement();

    const { result, unmount } = renderHook(() => useCamera());
    result.current.videoRef.current = video;

    await act(async () => {
      await result.current.startCamera();
    });

    unmount();

    expect(mockStop).toHaveBeenCalled();
  });

  it("discards stale stream when stopCamera is called during getUserMedia", async () => {
    const staleStop = vi.fn();
    const staleStream = {
      getTracks: () => [{ stop: staleStop, kind: "video" }],
    } as unknown as MediaStream;

    let resolveGetUserMedia: ((stream: MediaStream) => void) | undefined;
    mockGetUserMedia.mockReturnValue(
      new Promise<MediaStream>((resolve) => {
        resolveGetUserMedia = resolve;
      }),
    );

    const { result } = renderHook(() => useCamera());
    result.current.videoRef.current = mockVideoElement();

    let startPromise: Promise<void> | undefined;
    act(() => {
      startPromise = result.current.startCamera();
    });

    act(() => {
      result.current.stopCamera();
    });

    await act(async () => {
      resolveGetUserMedia?.(staleStream);
      await startPromise;
    });

    expect(staleStop).toHaveBeenCalled();
    expect(result.current.isReady).toBe(false);
  });

  it("stops stream when videoRef.current is null after getUserMedia resolves", async () => {
    const orphanStop = vi.fn();
    const orphanStream = {
      getTracks: () => [{ stop: orphanStop, kind: "video" }],
    } as unknown as MediaStream;
    mockGetUserMedia.mockResolvedValue(orphanStream);

    const { result } = renderHook(() => useCamera());
    // Intentionally do NOT set videoRef.current

    await act(async () => {
      await result.current.startCamera();
    });

    expect(orphanStop).toHaveBeenCalled();
    expect(result.current.isReady).toBe(false);
  });

  it("stops stream when video.play() fails", async () => {
    const failStop = vi.fn();
    const failStream = {
      getTracks: () => [{ stop: failStop, kind: "video" }],
    } as unknown as MediaStream;
    mockGetUserMedia.mockResolvedValue(failStream);

    const video = mockVideoElement();
    video.play = vi
      .fn()
      .mockRejectedValue(new Error("play() interrupted")) as unknown as typeof video.play;

    const { result } = renderHook(() => useCamera());
    result.current.videoRef.current = video;

    await act(async () => {
      await result.current.startCamera();
    });

    expect(failStop).toHaveBeenCalled();
    expect(result.current.isReady).toBe(false);
    expect(result.current.error).toBe("play() interrupted");
  });
});
