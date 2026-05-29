"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { triggerHaptic } from "@/lib/haptics";
import { springBouncy, springSnappy, tapScale, tapScaleSubtle } from "@/lib/motion";
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
          <motion.button
            type="button"
            className={styles.retryButton}
            onClick={startCamera}
            whileTap={tapScaleSubtle}
            transition={springBouncy}
          >
            Try again
          </motion.button>
          {onClose && (
            <motion.button
              type="button"
              className={styles.closeButtonInline}
              onClick={onClose}
              whileTap={tapScaleSubtle}
              transition={springBouncy}
            >
              Go back
            </motion.button>
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
        <motion.button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close camera"
          data-testid="close-button"
          whileTap={tapScale}
          transition={springSnappy}
        >
          &times;
        </motion.button>
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

        <motion.button
          type="button"
          className={styles.shutterButton}
          onClick={handleShutter}
          disabled={!isStreaming}
          aria-label="Capture photo"
          data-testid="shutter-button"
          whileTap={{ scale: 0.88 }}
          transition={springBouncy}
        >
          <span className={styles.shutterInner} />
        </motion.button>
      </div>

      {!isStreaming && !error && <div className={styles.loading} data-testid="camera-loading" />}

      {isSessionEnded && (
        <motion.div
          className={styles.sessionEndedOverlay}
          data-testid="session-ended-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <p className={styles.sessionEndedText}>Session ended due to inactivity</p>
          {onResume && (
            <motion.button
              type="button"
              className={styles.resumeButton}
              onClick={onResume}
              data-testid="resume-button"
              whileTap={tapScaleSubtle}
              transition={springBouncy}
            >
              Start new session
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}
