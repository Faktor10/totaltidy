"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import styles from "./camera-view.module.css";
import { ThumbnailTray } from "./thumbnail-tray";

export interface CameraViewProps {
  onCapture?: (blob: Blob) => void;
  onClose?: () => void;
}

const MAX_CAPTURES = 4;

export function CameraView({ onCapture, onClose }: CameraViewProps) {
  const { videoRef, canvasRef, isStreaming, error, startCamera, stopCamera, captureFrame } =
    useCamera({ facingMode: "environment" });
  const [recentCaptures, setRecentCaptures] = useState<string[]>([]);
  const captureUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      for (const url of captureUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, [startCamera, stopCamera]);

  const handleShutter = useCallback(async () => {
    const result = await captureFrame();
    if (!result) return;

    captureUrlsRef.current = [result.blobUrl, ...captureUrlsRef.current].slice(0, MAX_CAPTURES);
    setRecentCaptures((prev) => [result.blobUrl, ...prev].slice(0, MAX_CAPTURES));

    if (onCapture) {
      onCapture(result.blob);
    }
  }, [captureFrame, onCapture]);

  if (error) {
    return (
      <div className={styles.container} data-testid="camera-view">
        <div className={styles.errorOverlay}>
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.retryButton} onClick={startCamera}>
            Try again
          </button>
          {onClose && (
            <button type="button" className={styles.closeButtonInline} onClick={onClose}>
              Go back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="camera-view">
      <video
        ref={videoRef}
        className={styles.video}
        autoPlay
        playsInline
        muted
        data-testid="camera-video"
      />
      <canvas ref={canvasRef} className={styles.canvas} data-testid="camera-canvas" />

      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close camera"
          data-testid="close-button"
        >
          &times;
        </button>
      )}

      <div className={styles.controls}>
        <ThumbnailTray captures={recentCaptures} />
        <button
          type="button"
          className={styles.shutterButton}
          onClick={handleShutter}
          disabled={!isStreaming}
          aria-label="Capture photo"
          data-testid="shutter-button"
        >
          <span className={styles.shutterInner} />
        </button>
      </div>

      {!isStreaming && !error && <div className={styles.loading} data-testid="camera-loading" />}
    </div>
  );
}
