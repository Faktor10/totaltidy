"use client";

import Image from "next/image";
import Link from "next/link";
import { BatchAssignPrompt } from "@/components/batch-assign-prompt";
import { trpc } from "@/lib/trpc";
import styles from "./inbox.module.css";

export default function InboxPage() {
  const { data: items, isLoading, error, refetch } = trpc.items.inbox.useQuery();
  const { data: lastLocation } = trpc.locations.lastUsed.useQuery();
  const utils = trpc.useUtils();

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>Loading inbox...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.error}>
          <p>Failed to load inbox</p>
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
          Unsorted <span className={styles.count}>({items?.length ?? 0})</span>
        </h1>
        <Link href="/capture" className={styles.captureLink}>
          + Capture
        </Link>
      </div>

      {items && items.length > 0 && lastLocation && (
        <BatchAssignPrompt
          inboxCount={items.length}
          locationId={lastLocation.id}
          locationName={lastLocation.name}
          onAssigned={() => {
            void refetch();
            void utils.items.inboxCount.invalidate();
          }}
        />
      )}

      {items && items.length > 0 ? (
        <div className={styles.grid} data-testid="inbox-grid">
          {items.map((item) => (
            <div key={item.id} className={styles.card} data-testid="inbox-item">
              <Image
                src={item.processedImageUrl ?? item.originalImageUrl}
                alt={item.label ?? "Unsorted item"}
                className={styles.image}
                fill
                sizes="(max-width: 640px) 50vw, 140px"
              />
              {item.label && <span className={styles.itemLabel}>{item.label}</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>&#x1F4E5;</span>
          <p className={styles.emptyTitle}>Inbox zero!</p>
          <p className={styles.emptyText}>
            All your items have a home. Capture more items to get started.
          </p>
          <Link href="/capture" className={styles.captureLink}>
            + Capture items
          </Link>
        </div>
      )}
    </main>
  );
}
