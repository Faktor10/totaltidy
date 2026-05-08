"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ShimmerCard } from "@/components/shimmer-card";
import { trpc } from "@/lib/trpc";
import styles from "./gallery.module.css";

const POLLING_INTERVAL_MS = 3000;

interface GalleryItem {
  id: string;
  originalImageUrl: string;
  processedImageUrl: string | null;
  label: string | null;
  locationId: string | null;
  locationName: string | null;
  locationIcon: string | null;
  createdAt: Date;
}

interface LocationGroup {
  locationId: string | null;
  locationName: string;
  locationIcon: string | null;
  items: GalleryItem[];
}

function groupByLocation(items: GalleryItem[]): LocationGroup[] {
  const groups = new Map<string | null, LocationGroup>();

  for (const item of items) {
    const key = item.locationId;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, {
        locationId: key,
        locationName: item.locationName ?? "Unsorted",
        locationIcon: item.locationIcon,
        items: [item],
      });
    }
  }

  const sorted = Array.from(groups.values()).sort((a, b) => {
    if (a.locationId === null) return 1;
    if (b.locationId === null) return -1;
    return a.locationName.localeCompare(b.locationName);
  });

  return sorted;
}

export default function GalleryPage() {
  const {
    data: items,
    isLoading,
    error,
    refetch,
  } = trpc.items.gallery.useQuery(undefined, {
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      return data.some((item) => !item.processedImageUrl) ? POLLING_INTERVAL_MS : false;
    },
  });

  const groups = useMemo(() => groupByLocation(items ?? []), [items]);
  const totalCount = items?.length ?? 0;

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>Loading gallery...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.error}>
          <p>Failed to load gallery</p>
          <button type="button" className={styles.retryButton} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Gallery <span className={styles.count}>({totalCount})</span>
        </h1>
        <Link href="/capture" className={styles.captureLink}>
          + Capture
        </Link>
      </div>

      {groups.length > 0 ? (
        groups.map((group) => (
          <section
            key={group.locationId ?? "unsorted"}
            className={styles.locationGroup}
            data-testid="location-group"
          >
            <div className={styles.locationHeader}>
              {group.locationIcon && (
                <span className={styles.locationIcon}>{group.locationIcon}</span>
              )}
              <h2 className={styles.locationName}>{group.locationName}</h2>
              <span className={styles.locationCount}>
                {group.items.length} {group.items.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className={styles.grid} data-testid="gallery-grid">
              {group.items.map((item) =>
                item.processedImageUrl ? (
                  <div key={item.id} className={styles.cardWrapper} data-testid="gallery-item">
                    <div className={styles.card}>
                      <Image
                        src={item.processedImageUrl}
                        alt={item.label ?? "Item"}
                        className={styles.image}
                        fill
                        sizes="(max-width: 640px) 50vw, 140px"
                      />
                    </div>
                    {item.label && (
                      <span className={styles.itemLabel} data-testid="item-label">
                        {item.label}
                      </span>
                    )}
                  </div>
                ) : (
                  <ShimmerCard key={item.id} testId="gallery-item-processing" />
                ),
              )}
            </div>
          </section>
        ))
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>&#x1F5BC;</span>
          <p className={styles.emptyTitle}>No items yet</p>
          <p className={styles.emptyText}>
            Capture some items and they&apos;ll appear here with clean, studio-white backgrounds.
          </p>
          <Link href="/capture" className={styles.captureLink}>
            + Capture items
          </Link>
        </div>
      )}
    </main>
  );
}
