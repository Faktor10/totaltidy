"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import styles from "./batch-assign-prompt.module.css";

export interface BatchAssignPromptProps {
  itemCount: number;
  onAssigned: () => void;
}

export function BatchAssignPrompt({ itemCount, onAssigned }: BatchAssignPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const { data: lastLocation, isLoading } = trpc.locations.lastUsed.useQuery();
  const batchAssign = trpc.items.batchAssign.useMutation({
    onSuccess: () => onAssigned(),
  });

  if (dismissed || isLoading || !lastLocation || itemCount === 0) {
    return null;
  }

  return (
    <div className={styles.prompt} data-testid="batch-assign-prompt">
      <p className={styles.message}>
        {itemCount} {itemCount === 1 ? "item is" : "items are"} homeless &mdash; all going to{" "}
        <span className={styles.locationName}>{lastLocation.name}</span>?
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.confirmButton}
          disabled={batchAssign.isPending}
          onClick={() => batchAssign.mutate({ locationId: lastLocation.id })}
          data-testid="batch-assign-confirm"
        >
          {batchAssign.isPending ? "Assigning..." : "Yes"}
        </button>
        <button
          type="button"
          className={styles.dismissButton}
          onClick={() => setDismissed(true)}
          data-testid="batch-assign-dismiss"
        >
          No
        </button>
      </div>
    </div>
  );
}
