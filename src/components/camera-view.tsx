"use client";

import { useCallback, useEffect } from "react";
import { useCamera } from "@/hooks/use-camera";
import styles from "./camera-view.module.css";

export interface CameraViewProps {
  onCapture?: (blob: Blob) => void;
  onClose?: () => void;
  facingMode?: "user" | "environment";
}

export function CameraView({ onCapture, onClose, facingMode = "environment" }: CameraViewProps) {
  const { videoRef, canvasRef, isStreaming, error, startCamera, stopCamera, captureFrame } =
    useCamera({ facingMode });

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleShutter = useCallback(async () => {
    const blob = await captureFrame();
    if (blob) {
      onCapture?.(blob);
    }
  }, [captureFrame, onCapture]);

  return (
    <div className={styles.container} data-testid="camera-view">
      <video ref={videoRef} className={styles.video} autoPlay playsInline muted />
      <canvas ref={canvasRef} className={styles.canvas} />

      {error ? (
        <div className={styles.errorOverlay} data-testid="camera-error">
          <p className={styles.errorMessage}>{error}</p>
          <button type="button" className={styles.retryButton} onClick={startCamera}>
            Try again
          </button>
        </div>
      ) : (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.shutterButton}
            onClick={handleShutter}
            disabled={!isStreaming}
            aria-label="Capture photo"
            data-testid="shutter-button"
          />
        </div>
      )}

      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close camera"
          data-testid="close-button"
        >
          ✕
        </button>
      )}
    </div>
  );
}
