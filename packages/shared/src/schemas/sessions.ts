import { z } from "zod";

export const sessionIdInput = z.object({
  sessionId: z.uuid(),
});
export type SessionIdInput = z.infer<typeof sessionIdInput>;

/** Shape stored in `capture_sessions.summary` and rendered by the joy-roll card. */
export const sessionSummarySchema = z.object({
  itemsCaptured: z.number().int().nonnegative(),
  locationsUsed: z.number().int().nonnegative(),
  unsortedItems: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative(),
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;
