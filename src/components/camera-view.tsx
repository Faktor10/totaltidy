"use client";

import { useCallback, useEffect, useState } from "react";
import type { UseCameraOptions } from "@/hooks/use-camera";
import { useCamera } from "@/hooks/use-camera";
import styles from "./camera-view.module.css";

export interface CameraViewProps {
  onCapture?: (blob: Blob) => void;
  cameraOptions?: UseCameraOptions;
}

export function CameraView({ onCapture, cameraOptions }: CameraViewProps) {
  const { videoRef, canvasRef, isStreaming, error, startCamera, captureFrame } =
    useCamera(cameraOptions);

  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const handleShutter = useCallback(() => {
    setFlashKey((k) => k + 1);
    void captureFrame().then((blob) => {
      if (blob && onCapture) {
        onCapture(blob);
      }
    });
  }, [captureFrame, onCapture]);

  return (
    <div className={styles.container}>
      <video ref={videoRef} className={styles.video} autoPlay playsInline muted />
      <canvas ref={canvasRef} className={styles.canvas} />

      {flashKey > 0 && <div key={flashKey} className={styles.flash} data-testid="shutter-flash" />}

      {error ? (
        <div className={styles.errorOverlay}>
          <p className={styles.errorMessage}>{error}</p>
          <button type="button" className={styles.retryButton} onClick={startCamera}>
            Try again
          </button>
        </div>
      ) : (
        isStreaming && (
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.shutterButton}
              onClick={handleShutter}
              aria-label="Capture"
            />
          </div>
        )
      )}
    </div>
  );
}
