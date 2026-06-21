"use client";

import { useState } from "react";
import { playCategorizeSound } from "@/lib/sounds";
import { trpc } from "@/lib/trpc";
import styles from "./batch-assign-prompt.module.css";

export interface BatchAssignPromptProps {
  inboxCount: number;
  locationId: string;
  locationName: string;
  onAssigned: () => void;
}

export function BatchAssignPrompt({
  inboxCount,
  locationId,
  locationName,
  onAssigned,
}: BatchAssignPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const batchAssign = trpc.items.batchAssignLocation.useMutation({
    onSuccess: () => {
      playCategorizeSound();
      onAssigned();
    },
  });

  if (dismissed || inboxCount === 0) return null;

  return (
    <div className={styles.banner} data-testid="batch-assign-prompt">
      <span className={styles.text}>
        {inboxCount} {inboxCount === 1 ? "item is" : "items are"} homeless &mdash; all going to{" "}
        <span className={styles.locationName}>{locationName}</span>?
      </span>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.confirmButton}
          disabled={batchAssign.isPending}
          onClick={() => batchAssign.mutate({ locationId })}
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
