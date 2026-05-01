"use client";

import { useCallback, useEffect } from "react";
import { useCamera } from "@/hooks/use-camera";
import styles from "./camera-view.module.css";

export interface CameraViewProps {
  onCapture?: (blob: Blob) => void;
  onClose?: () => void;
}

export function CameraView({ onCapture, onClose }: CameraViewProps) {
  const { videoRef, canvasRef, isStreaming, error, startCamera, stopCamera, captureFrame } =
    useCamera();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = useCallback(async () => {
    const blob = await captureFrame();
    if (blob && onCapture) {
      onCapture(blob);
    }
  }, [captureFrame, onCapture]);

  return (
    <div className={styles.root}>
      <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
      <canvas ref={canvasRef} className={styles.canvas} />

      {error ? (
        <div className={styles.error}>
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.retryButton} onClick={() => startCamera()}>
            Try again
          </button>
        </div>
      ) : null}

      <div className={styles.controls}>
        {onClose ? (
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close camera"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <div className={styles.controlSpacer} />
        )}

        <button
          type="button"
          className={styles.shutter}
          onClick={handleCapture}
          disabled={!isStreaming}
          aria-label="Capture photo"
        />

        <div className={styles.controlSpacer} />
      </div>
    </div>
  );
}
