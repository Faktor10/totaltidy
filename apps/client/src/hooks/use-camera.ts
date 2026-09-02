import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCameraOptions {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
}

export interface CaptureResult {
  blob: Blob;
  blobUrl: string;
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isStreaming: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureFrame: () => Promise<CaptureResult | null>;
}

export function buildConstraints(options: UseCameraOptions): MediaStreamConstraints {
  const { facingMode = "environment", width, height } = options;
  return {
    video: {
      facingMode,
      ...(width ? { width: { ideal: width } } : {}),
      ...(height ? { height: { ideal: height } } : {}),
    },
    audio: false,
  };
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Bumped by stopCamera and by every new start, so an in-flight start that has
  // been superseded (React StrictMode mounts effects twice) can bail out
  // instead of reporting its own teardown as a camera error.
  const startIdRef = useRef(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    const startId = ++startIdRef.current;
    const isStale = () => startIdRef.current !== startId;

    const releaseStream = (stream: MediaStream | null) => {
      for (const track of stream?.getTracks() ?? []) {
        track.stop();
      }
    };

    try {
      setError(null);

      releaseStream(streamRef.current);
      streamRef.current = null;

      const constraints = buildConstraints(options);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (isStale()) {
        releaseStream(stream);
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playError) {
          // Teardown mid-play rejects with AbortError; that is not a failure to
          // report, the next start will take over.
          if (!isStale() && (playError as Error)?.name !== "AbortError") {
            throw playError;
          }
        }
      }

      if (isStale()) return;

      setIsStreaming(true);
    } catch (err) {
      releaseStream(streamRef.current);
      streamRef.current = null;

      if (isStale()) return;

      const message = err instanceof Error ? err.message : "Failed to access camera";
      setError(message);
      setIsStreaming(false);
    }
  }, [options]);

  const stopCamera = useCallback(() => {
    // Invalidate any start still awaiting getUserMedia/play.
    startIdRef.current += 1;

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
  }, []);

  const captureFrame = useCallback(async (): Promise<CaptureResult | null> => {
    const video = videoRef.current;
    if (!video || !isStreaming) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    return new Promise<CaptureResult | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const blobUrl = URL.createObjectURL(blob);
          resolve({ blob, blobUrl });
        },
        "image/jpeg",
        0.85,
      );
    });
  }, [isStreaming]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    captureFrame,
  };
}
