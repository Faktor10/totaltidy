"use client";

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

export function LocationStrip({ locations, selectedId, onSelect }: LocationStripProps) {
  const visible = locations.slice(0, MAX_BUBBLES);

  if (visible.length === 0) return null;

  return (
    <div className={styles.strip} data-testid="location-strip">
      {visible.map((location) => (
        <button
          key={location.id}
          type="button"
          className={`${styles.bubble}${selectedId === location.id ? ` ${styles.selected}` : ""}`}
          onClick={() => onSelect?.(location.id)}
          aria-label={`Select location: ${location.name}`}
          aria-pressed={selectedId === location.id}
          data-testid="location-bubble"
        >
          {location.icon && <span className={styles.icon}>{location.icon}</span>}
          <span className={styles.label}>{location.name}</span>
        </button>
      ))}
    </div>
  );
}
