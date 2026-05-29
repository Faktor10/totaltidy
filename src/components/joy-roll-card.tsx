"use client";

import { motion } from "framer-motion";
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
    <motion.div
      className={styles.overlay}
      data-testid="joy-roll-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={styles.card}
        data-testid="joy-roll-card"
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
      >
        <p className={styles.encouragement}>{getEncouragementMessage(itemsCaptured)}</p>

        <div className={styles.stats}>
          <motion.div
            className={styles.stat}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.3 }}
          >
            <span className={styles.statValue} data-testid="joy-roll-items">
              {itemsCaptured}
            </span>
            <span className={styles.statLabel}>
              {itemsCaptured === 1 ? "item" : "items"} captured
            </span>
          </motion.div>
          <motion.div
            className={styles.stat}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.4 }}
          >
            <span className={styles.statValue} data-testid="joy-roll-locations">
              {locationsUsed}
            </span>
            <span className={styles.statLabel}>
              {locationsUsed === 1 ? "location" : "locations"} used
            </span>
          </motion.div>
        </div>

        <p className={styles.floorSpace} data-testid="joy-roll-floor-space">
          You reclaimed {computeFloorSpaceReclaimed(itemsCaptured)}
        </p>

        <p className={styles.duration} data-testid="joy-roll-duration">
          Session time: {formatDuration(durationMs)}
        </p>

        <div className={styles.actions}>
          {onNewSession && (
            <motion.button
              type="button"
              className={styles.primaryButton}
              onClick={onNewSession}
              data-testid="joy-roll-new-session"
              whileTap={{ scale: 0.93 }}
            >
              Start new session
            </motion.button>
          )}
          {onViewGallery && (
            <motion.button
              type="button"
              className={styles.secondaryButton}
              onClick={onViewGallery}
              data-testid="joy-roll-view-gallery"
              whileTap={{ scale: 0.95 }}
            >
              View gallery
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
