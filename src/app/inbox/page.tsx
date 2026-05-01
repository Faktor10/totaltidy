"use client";

import Image from "next/image";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import styles from "./inbox.module.css";

export default function InboxPage() {
  const { data: items, isLoading } = trpc.items.listUnsorted.useQuery();

  if (isLoading) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Unsorted Items</h1>
        </header>
        <div className={styles.grid} data-testid="inbox-loading">
          <div key="s1" className={styles.shimmer} />
          <div key="s2" className={styles.shimmer} />
          <div key="s3" className={styles.shimmer} />
          <div key="s4" className={styles.shimmer} />
          <div key="s5" className={styles.shimmer} />
          <div key="s6" className={styles.shimmer} />
        </div>
      </main>
    );
  }

  const count = items?.length ?? 0;

  return (
    <main className={styles.page} data-testid="inbox-page">
      <header className={styles.header}>
        <h1 className={styles.title}>Unsorted Items</h1>
        <span className={styles.count} data-testid="inbox-count">
          {count} {count === 1 ? "item" : "items"}
        </span>
      </header>

      {count === 0 ? (
        <div className={styles.empty} data-testid="inbox-empty">
          <p className={styles.emptyText}>Nothing here — all items have a home!</p>
          <Link href="/capture" className={styles.captureLink}>
            Capture items
          </Link>
        </div>
      ) : (
        <ul className={styles.grid} data-testid="inbox-grid">
          {items?.map((item) => (
            <li key={item.id} className={styles.card} data-testid="inbox-item">
              <div className={styles.imageWrapper}>
                <Image
                  src={item.processedImageUrl ?? item.originalImageUrl}
                  alt={item.label ?? "Unsorted item"}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={styles.image}
                />
              </div>
              {item.label && <span className={styles.label}>{item.label}</span>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
