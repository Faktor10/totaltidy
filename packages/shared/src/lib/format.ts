/**
 * Format an item count into a human-readable nudge string.
 * Used in inbox badges and batch-assign prompts.
 */
export function formatItemCount(count: number): string {
  if (count === 0) return "All tidy!";
  if (count === 1) return "1 item needs a home";
  return `${count} items need a home`;
}
