import styles from "./shimmer-card.module.css";

interface ShimmerCardProps {
  testId?: string;
}

export function ShimmerCard({ testId = "shimmer-card" }: ShimmerCardProps) {
  return (
    <div className={styles.shimmerCard} data-testid={testId}>
      <div className={styles.shimmer} />
      <span className={styles.label}>Processing</span>
    </div>
  );
}
