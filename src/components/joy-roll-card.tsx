"use client";

import styles from "./joy-roll-card.module.css";

export interface SessionSummary {
  itemsCaptured: number;
  locationsUsed: number;
  unsortedItems: number;
  durationMs: number;
}

interface JoyRollCardProps {
  summary: SessionSummary;
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

function calculateFloorSpace(itemCount: number): string {
  const sqFt = itemCount * 2.5;
  if (sqFt < 1) return "a tiny corner";
  if (sqFt < 10) return `${sqFt.toFixed(0)} sq ft`;
  return `${sqFt.toFixed(0)} sq ft`;
}

export function JoyRollCard({ summary }: JoyRollCardProps) {
  const { itemsCaptured, locationsUsed, durationMs } = summary;
  const floorSpace = calculateFloorSpace(itemsCaptured);

  return (
    <div className={styles.overlay} data-testid="joy-roll-card">
      <div className={styles.card}>
        <h2 className={styles.title}>Session Complete</h2>

        <div className={styles.stats}>
          <div className={styles.stat} data-testid="joy-roll-items">
            <span className={styles.statValue}>{itemsCaptured}</span>
            <span className={styles.statLabel}>
              {itemsCaptured === 1 ? "item captured" : "items captured"}
            </span>
          </div>

          <div className={styles.stat} data-testid="joy-roll-locations">
            <span className={styles.statValue}>{locationsUsed}</span>
            <span className={styles.statLabel}>
              {locationsUsed === 1 ? "location used" : "locations used"}
            </span>
          </div>

          <div className={styles.stat} data-testid="joy-roll-duration">
            <span className={styles.statValue}>{formatDuration(durationMs)}</span>
            <span className={styles.statLabel}>session time</span>
          </div>
        </div>

        {itemsCaptured > 0 && (
          <p className={styles.floorSpace} data-testid="joy-roll-floor-space">
            You just reclaimed ~{floorSpace} of floor space
          </p>
        )}
      </div>
    </div>
  );
}
