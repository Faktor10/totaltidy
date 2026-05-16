"use client";

import {
  computeFloorSpaceReclaimed,
  formatDuration,
  getEncouragementMessage,
  type SessionSummary,
} from "@/lib/joy-roll";
import styles from "./joy-roll-card.module.css";

export interface JoyRollCardProps {
  summary: SessionSummary;
  onNewSession?: () => void;
  onViewGallery?: () => void;
}

export function JoyRollCard({ summary, onNewSession, onViewGallery }: JoyRollCardProps) {
  const { itemsCaptured, locationsUsed, durationMs } = summary;

  return (
    <div className={styles.overlay} data-testid="joy-roll-overlay">
      <div className={styles.card} data-testid="joy-roll-card">
        <p className={styles.encouragement}>{getEncouragementMessage(itemsCaptured)}</p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue} data-testid="joy-roll-items">
              {itemsCaptured}
            </span>
            <span className={styles.statLabel}>
              {itemsCaptured === 1 ? "item" : "items"} captured
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} data-testid="joy-roll-locations">
              {locationsUsed}
            </span>
            <span className={styles.statLabel}>
              {locationsUsed === 1 ? "location" : "locations"} used
            </span>
          </div>
        </div>

        <p className={styles.floorSpace} data-testid="joy-roll-floor-space">
          You reclaimed {computeFloorSpaceReclaimed(itemsCaptured)}
        </p>

        <p className={styles.duration} data-testid="joy-roll-duration">
          Session time: {formatDuration(durationMs)}
        </p>

        <div className={styles.actions}>
          {onNewSession && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onNewSession}
              data-testid="joy-roll-new-session"
            >
              Start new session
            </button>
          )}
          {onViewGallery && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onViewGallery}
              data-testid="joy-roll-view-gallery"
            >
              View gallery
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
