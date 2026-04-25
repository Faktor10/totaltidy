"use client";

import { useCamera } from "@/hooks/use-camera";
import "./camera-view.css";
import { useCallback, useEffect } from "react";

export interface CameraViewProps {
  onCapture?: (blob: Blob) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export function CameraView({ onCapture, onError, onClose }: CameraViewProps) {
  const { videoRef, canvasRef, isStreaming, error, startCamera, stopCamera, captureFrame } =
    useCamera();

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleShutter = useCallback(async () => {
    const blob = await captureFrame();
    if (blob) {
      onCapture?.(blob);
    }
  }, [captureFrame, onCapture]);

  return (
    <div className="camera-view">
      <video ref={videoRef} autoPlay playsInline muted className="camera-view__video" />
      <canvas ref={canvasRef} className="camera-view__canvas" />

      {error && (
        <div className="camera-view__error">
          <p>{error}</p>
          <button type="button" onClick={() => startCamera()} className="camera-view__retry-btn">
            Try again
          </button>
        </div>
      )}

      <div className="camera-view__controls">
        {onClose && (
          <button type="button" onClick={onClose} className="camera-view__close-btn">
            <span className="camera-view__close-icon" aria-hidden="true">
              &#x2715;
            </span>
            <span className="sr-only">Close camera</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleShutter}
          disabled={!isStreaming}
          className="camera-view__shutter-btn"
          aria-label="Take photo"
        >
          <span className="camera-view__shutter-ring" />
        </button>
      </div>
    </div>
  );
}
