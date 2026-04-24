import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCameraOptions {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
}

export interface CaptureResult {
  blob: Blob;
  blobUrl: string;
  width: number;
  height: number;
}

const DEFAULT_FACING_MODE = "environment";
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const JPEG_QUALITY = 0.92;

export function useCamera(options: UseCameraOptions = {}) {
  const {
    facingMode = DEFAULT_FACING_MODE,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback((stream: MediaStream) => {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }, []);

  const stopCamera = useCallback(() => {
    requestIdRef.current += 1;
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported in this browser");
      return;
    }

    stopCamera();

    const currentRequestId = requestIdRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      });

      // Discard stale stream if stopCamera or a newer startCamera was called while awaiting
      if (requestIdRef.current !== currentRequestId) {
        stopStream(stream);
        return;
      }

      streamRef.current = stream;

      if (!videoRef.current) {
        stopStream(stream);
        streamRef.current = null;
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsReady(true);
    } catch (err) {
      // Clean up the stream if play() failed but getUserMedia succeeded
      if (streamRef.current && requestIdRef.current === currentRequestId) {
        stopStream(streamRef.current);
        streamRef.current = null;
      }
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied");
          return;
        }
        if (err.name === "NotFoundError") {
          setError("No camera found on this device");
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Failed to access camera");
    }
  }, [facingMode, width, height, stopCamera, stopStream]);

  const capture = useCallback(async (): Promise<CaptureResult | null> => {
    const video = videoRef.current;
    if (!video || !isReady) return null;

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
          resolve({
            blob,
            blobUrl: URL.createObjectURL(blob),
            width: canvas.width,
            height: canvas.height,
          });
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    });
  }, [isReady]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isReady,
    error,
    capture,
    startCamera,
    stopCamera,
  };
}
