"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { slideUp, springBouncy, springGentle, tapScaleSubtle } from "@/lib/motion";
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
    onSuccess: () => onAssigned(),
  });

  if (dismissed || inboxCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.banner}
        data-testid="batch-assign-prompt"
        variants={slideUp}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={springGentle}
      >
        <span className={styles.text}>
          {inboxCount} {inboxCount === 1 ? "item is" : "items are"} homeless &mdash; all going to{" "}
          <span className={styles.locationName}>{locationName}</span>?
        </span>
        <div className={styles.actions}>
          <motion.button
            type="button"
            className={styles.confirmButton}
            disabled={batchAssign.isPending}
            onClick={() => batchAssign.mutate({ locationId })}
            data-testid="batch-assign-confirm"
            whileTap={tapScaleSubtle}
            transition={springBouncy}
          >
            {batchAssign.isPending ? "Assigning..." : "Yes"}
          </motion.button>
          <motion.button
            type="button"
            className={styles.dismissButton}
            onClick={() => setDismissed(true)}
            data-testid="batch-assign-dismiss"
            whileTap={tapScaleSubtle}
            transition={springBouncy}
          >
            No
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
