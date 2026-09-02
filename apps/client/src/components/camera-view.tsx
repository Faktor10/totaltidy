import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { triggerHaptic } from "@/lib/haptics";
import styles from "./camera-view.module.css";
import type { LocationBubble } from "./location-strip";
import { LocationStrip } from "./location-strip";
import { ThumbnailTray } from "./thumbnail-tray";

const MAX_THUMBNAILS = 4;
const CAMERA_OPTIONS = { facingMode: "environment" } as const;

export interface CameraViewProps {
  onCapture?: (blob: Blob) => void;
  onClose?: () => void;
  locations?: LocationBubble[];
  selectedLocationId?: string | null;
  onLocationSelect?: (locationId: string) => void;
  isSessionEnded?: boolean;
  onResume?: () => void;
}

export function CameraView({
  onCapture,
  onClose,
  locations,
  selectedLocationId,
  onLocationSelect,
  isSessionEnded,
  onResume,
}: CameraViewProps) {
  const { videoRef, isStreaming, error, startCamera, stopCamera, captureFrame } =
    useCamera(CAMERA_OPTIONS);
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
    const result = await captureFrame();
    if (!result) return;

    triggerHaptic();

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
        <ThumbnailTray captures={thumbnails} />

        {locations && locations.length > 0 && (
          <LocationStrip
            locations={locations}
            selectedId={selectedLocationId}
            onSelect={onLocationSelect}
          />
        )}

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

      {isSessionEnded && (
        <div className={styles.sessionEndedOverlay} data-testid="session-ended-overlay">
          <p className={styles.sessionEndedText}>Session ended due to inactivity</p>
          {onResume && (
            <button
              type="button"
              className={styles.resumeButton}
              onClick={onResume}
              data-testid="resume-button"
            >
              Start new session
            </button>
          )}
        </div>
      )}
    </div>
  );
}
