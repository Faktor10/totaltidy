import { Link } from "wouter";
import { ShimmerCard } from "@/components/shimmer-card";
import { trpc } from "@/lib/trpc";
import styles from "./location-detail.module.css";

const POLLING_INTERVAL_MS = 3000;

export default function LocationDetailPage({ id }: { id: string }) {
  const {
    data: location,
    isLoading: locationLoading,
    error: locationError,
  } = trpc.locations.get.useQuery({ id });

  const {
    data: items,
    isLoading: itemsLoading,
    error: itemsError,
    refetch,
  } = trpc.items.byLocation.useQuery(
    { locationId: id },
    {
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return false;
        return data.some((item) => !item.processedImageUrl) ? POLLING_INTERVAL_MS : false;
      },
    },
  );

  const isLoading = locationLoading || itemsLoading;
  const error = locationError || itemsError;

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>Loading location...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <Link href="/gallery" className={styles.backLink}>
          &larr; Back to Gallery
        </Link>
        <div className={styles.error}>
          <p>
            {locationError?.data?.code === "NOT_FOUND"
              ? "Location not found"
              : "Failed to load location"}
          </p>
          <button type="button" className={styles.retryButton} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </main>
    );
  }

  const itemCount = items?.length ?? 0;

  return (
    <main className={styles.page}>
      <Link href="/gallery" className={styles.backLink} data-testid="back-to-gallery">
        &larr; Back to Gallery
      </Link>

      <div className={styles.header}>
        {location?.icon && <span className={styles.locationIcon}>{location.icon}</span>}
        <h1 className={styles.title}>
          {location?.name} <span className={styles.count}>({itemCount})</span>
        </h1>
      </div>

      {itemCount > 0 ? (
        <div className={styles.grid} data-testid="location-items-grid">
          {items?.map((item) =>
            item.processedImageUrl ? (
              <div key={item.id} className={styles.cardWrapper} data-testid="location-item">
                <div className={styles.card}>
                  <img
                    src={item.processedImageUrl}
                    alt={item.label ?? "Item"}
                    className={styles.image}
                    loading="lazy"
                  />
                </div>
                {item.label && (
                  <span className={styles.itemLabel} data-testid="item-label">
                    {item.label}
                  </span>
                )}
              </div>
            ) : (
              <ShimmerCard key={item.id} testId="location-item-processing" />
            ),
          )}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>{location?.icon ?? "\u{1F4E6}"}</span>
          <p className={styles.emptyTitle}>No items here yet</p>
          <p className={styles.emptyText}>
            Capture some items and assign them to {location?.name} to see them here.
          </p>
          <Link href="/capture" className={styles.captureLink}>
            + Capture items
          </Link>
        </div>
      )}
    </main>
  );
}
