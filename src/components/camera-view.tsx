"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import styles from "./camera-view.module.css";

const MAX_THUMBNAILS = 4;
const CAMERA_OPTIONS = { facingMode: "environment" } as const;

export interface CameraViewProps {
  onCapture?: (blob: Blob) => void;
  onClose?: () => void;
}

export function CameraView({ onCapture, onClose }: CameraViewProps) {
  const { videoRef, isActive, error, startCamera, stopCamera, capture } = useCamera(CAMERA_OPTIONS);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const thumbnailsRef = useRef<string[]>([]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      for (const url of thumbnailsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, [startCamera, stopCamera]);

  const handleShutter = useCallback(async () => {
    const result = await capture();
    if (!result) return;

    setThumbnails((prev) => {
      const next = [result.blobUrl, ...prev];
      if (next.length > MAX_THUMBNAILS) {
        for (const url of next.slice(MAX_THUMBNAILS)) {
          URL.revokeObjectURL(url);
        }
        const trimmed = next.slice(0, MAX_THUMBNAILS);
        thumbnailsRef.current = trimmed;
        return trimmed;
      }
      thumbnailsRef.current = next;
      return next;
    });

    if (onCapture) {
      onCapture(result.blob);
    }
  }, [capture, onCapture]);

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
        {thumbnails.length > 0 && (
          <div className={styles.thumbnailTray} data-testid="thumbnail-tray">
            {thumbnails.map((url) => (
              // biome-ignore lint/performance/noImgElement: blob URLs cannot be optimized by next/image
              <img
                key={url}
                src={url}
                alt="Recent capture"
                className={styles.thumbnail}
                data-testid="thumbnail"
              />
            ))}
          </div>
        )}

        <button
          type="button"
          className={styles.shutterButton}
          onClick={handleShutter}
          disabled={!isActive}
          aria-label="Capture photo"
          data-testid="shutter-button"
        >
          <span className={styles.shutterInner} />
        </button>
      </div>

      {!isActive && !error && <div className={styles.loading} data-testid="camera-loading" />}
    </div>
  );
}
