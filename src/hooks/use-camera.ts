"use client";

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
  isActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capture: () => Promise<CaptureResult | null>;
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
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }

      const constraints = buildConstraints(options);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
    } catch (err) {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }
      const message = err instanceof Error ? err.message : "Failed to access camera";
      setError(message);
      setIsActive(false);
    }
  }, [options]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
  }, []);

  const capture = useCallback(async (): Promise<CaptureResult | null> => {
    const video = videoRef.current;
    if (!video || !isActive) return null;

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
  }, [isActive]);

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
    isActive,
    error,
    startCamera,
    stopCamera,
    capture,
  };
}
