"use client";

import { useCallback, useEffect, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import styles from "./camera-view.module.css";

export interface CameraViewProps {
  onCapture?: (blob: Blob) => void;
}

export function CameraView({ onCapture }: CameraViewProps) {
  const { videoRef, canvasRef, isStreaming, error, startCamera, stopCamera, captureFrame } =
    useCamera({ facingMode: "environment" });

  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleShutter = useCallback(async () => {
    const blob = await captureFrame();
    if (!blob) return;

    setShowFlash(true);
    onCapture?.(blob);
  }, [captureFrame, onCapture]);

  const handleFlashEnd = useCallback(() => {
    setShowFlash(false);
  }, []);

  return (
    <div className={styles.container} data-testid="camera-view">
      <video ref={videoRef} className={styles.video} autoPlay playsInline muted />
      <canvas ref={canvasRef} className={styles.canvas} />

      {showFlash && (
        <div className={styles.flash} data-testid="capture-flash" onAnimationEnd={handleFlashEnd} />
      )}

      {error && (
        <div className={styles.errorOverlay}>
          <p className={styles.errorMessage}>{error}</p>
          <button type="button" className={styles.retryButton} onClick={startCamera}>
            Try again
          </button>
        </div>
      )}

      {!error && !isStreaming && (
        <div className={styles.startOverlay}>
          <p className={styles.startLabel}>Starting camera…</p>
        </div>
      )}

      {isStreaming && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.shutterButton}
            onClick={handleShutter}
            aria-label="Capture photo"
            data-testid="shutter-button"
          >
            <span className={styles.shutterInner} />
          </button>
        </div>
      )}
    </div>
  );
}
