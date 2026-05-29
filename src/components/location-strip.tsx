"use client";

import { motion } from "framer-motion";
import styles from "./location-strip.module.css";

export interface LocationBubble {
  id: string;
  name: string;
  icon?: string | null;
}

export interface LocationStripProps {
  locations: LocationBubble[];
  selectedId?: string | null;
  onSelect?: (locationId: string) => void;
}

const MAX_BUBBLES = 5;

const DEFAULT_ICONS: Record<string, string> = {
  bedroom: "\u{1F6CF}\u{FE0F}",
  kitchen: "\u{1F373}",
  bathroom: "\u{1F6C1}",
  garage: "\u{1F697}",
  closet: "\u{1F45A}",
  playroom: "\u{1F3B2}",
  office: "\u{1F4BB}",
  living: "\u{1F6CB}\u{FE0F}",
  basement: "\u{1F4E6}",
  attic: "\u{1F4E6}",
};

function resolveIcon(name: string, icon?: string | null): string {
  if (icon) return icon;
  const lower = name.toLowerCase();
  for (const [keyword, emoji] of Object.entries(DEFAULT_ICONS)) {
    if (lower.includes(keyword)) return emoji;
  }
  return "\u{1F4CD}";
}

const stripVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const bubbleVariants = {
  hidden: { opacity: 0, scale: 0.7, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
};

export function LocationStrip({ locations, selectedId, onSelect }: LocationStripProps) {
  const visible = locations.slice(0, MAX_BUBBLES);

  if (visible.length === 0) return null;

  return (
    <motion.div
      className={styles.strip}
      data-testid="location-strip"
      variants={stripVariants}
      initial="hidden"
      animate="visible"
    >
      {visible.map((loc) => {
        const isSelected = loc.id === selectedId;
        return (
          <motion.button
            key={loc.id}
            type="button"
            className={`${styles.bubble}${isSelected ? ` ${styles.selected}` : ""}`}
            onClick={() => onSelect?.(loc.id)}
            aria-pressed={isSelected}
            data-testid="location-bubble"
            variants={bubbleVariants}
            whileTap={{ scale: 0.9 }}
          >
            <span className={styles.icon}>{resolveIcon(loc.name, loc.icon)}</span>
            <span className={styles.label}>{loc.name}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
