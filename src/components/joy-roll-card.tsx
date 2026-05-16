"use client";

import styles from "./joy-roll-card.module.css";

export interface SessionSummary {
  itemsCaptured: number;
  locationsUsed: number;
  unsortedItems: number;
  durationMs: number;
}

export interface JoyRollCardProps {
  summary: SessionSummary;
  onDismiss?: () => void;
  onNewSession?: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

function calculateFloorSpace(itemCount: number): string {
  const sqFt = itemCount * 2.5;
  if (sqFt < 1) return "0 sq ft";
  if (sqFt < 10) return `${sqFt.toFixed(1)} sq ft`;
  return `${Math.round(sqFt)} sq ft`;
}

export function JoyRollCard({ summary, onDismiss, onNewSession }: JoyRollCardProps) {
  const floorSpace = calculateFloorSpace(summary.itemsCaptured);

  return (
    <div className={styles.overlay} data-testid="joy-roll-card">
      <div className={styles.card}>
        <h2 className={styles.title}>Session complete!</h2>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue} data-testid="joy-roll-items">
              {summary.itemsCaptured}
            </span>
            <span className={styles.statLabel}>
              {summary.itemsCaptured === 1 ? "item captured" : "items captured"}
            </span>
          </div>

          <div className={styles.stat}>
            <span className={styles.statValue} data-testid="joy-roll-locations">
              {summary.locationsUsed}
            </span>
            <span className={styles.statLabel}>
              {summary.locationsUsed === 1 ? "location used" : "locations used"}
            </span>
          </div>

          <div className={styles.stat}>
            <span className={styles.statValue} data-testid="joy-roll-duration">
              {formatDuration(summary.durationMs)}
            </span>
            <span className={styles.statLabel}>session time</span>
          </div>
        </div>

        <div className={styles.floorSpace} data-testid="joy-roll-floor-space">
          <span className={styles.floorSpaceValue}>~{floorSpace}</span>
          <span className={styles.floorSpaceLabel}>of floor space reclaimed</span>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onNewSession}
            data-testid="joy-roll-new-session"
          >
            Start new session
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onDismiss}
            data-testid="joy-roll-dismiss"
          >
            Done for now
          </button>
        </div>
      </div>
    </div>
  );
}
