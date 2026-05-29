"use client";

import { motion } from "framer-motion";
import { springBouncy, tapScale } from "@/lib/motion";
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

export function LocationStrip({ locations, selectedId, onSelect }: LocationStripProps) {
  const visible = locations.slice(0, MAX_BUBBLES);

  if (visible.length === 0) return null;

  return (
    <div className={styles.strip} data-testid="location-strip">
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
            whileTap={tapScale}
            transition={springBouncy}
            layout
          >
            <span className={styles.icon}>{resolveIcon(loc.name, loc.icon)}</span>
            <span className={styles.label}>{loc.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
