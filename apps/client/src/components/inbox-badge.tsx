import { trpc } from "@/lib/trpc";
import styles from "./inbox-badge.module.css";

export function InboxBadge() {
  const { data: count } = trpc.items.inboxCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  if (!count) return null;

  return (
    <span className={styles.badge} data-testid="inbox-badge">
      {count > 99 ? "99+" : count}
    </span>
  );
}
