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

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const childVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function JoyRollCard({ summary, onNewSession, onViewGallery }: JoyRollCardProps) {
  const { itemsCaptured, locationsUsed, durationMs } = summary;

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      data-testid="joy-roll-overlay"
    >
      <motion.div
        className={styles.card}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ type: "spring", stiffness: 300, damping: 22, mass: 0.8 }}
        data-testid="joy-roll-card"
      >
        <motion.p
          className={styles.encouragement}
          variants={childVariants}
          initial="hidden"
          animate="visible"
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
        >
          {getEncouragementMessage(itemsCaptured)}
        </motion.p>

        <motion.div
          className={styles.stats}
          variants={childVariants}
          initial="hidden"
          animate="visible"
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.25 }}
        >
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
        </motion.div>

        <motion.p
          className={styles.floorSpace}
          variants={childVariants}
          initial="hidden"
          animate="visible"
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.35 }}
          data-testid="joy-roll-floor-space"
        >
          You reclaimed {computeFloorSpaceReclaimed(itemsCaptured)}
        </motion.p>

        <motion.p
          className={styles.duration}
          variants={childVariants}
          initial="hidden"
          animate="visible"
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
          data-testid="joy-roll-duration"
        >
          Session time: {formatDuration(durationMs)}
        </motion.p>

        <motion.div
          className={styles.actions}
          variants={childVariants}
          initial="hidden"
          animate="visible"
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
        >
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
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
