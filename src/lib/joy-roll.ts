export interface SessionSummary {
  itemsCaptured: number;
  locationsUsed: number;
  unsortedItems: number;
  durationMs: number;
}

const SQ_FT_PER_ITEM = 0.75;

export function computeFloorSpaceReclaimed(itemsCaptured: number): string {
  const sqFt = itemsCaptured * SQ_FT_PER_ITEM;
  if (sqFt < 1) return "a bit of breathing room";
  if (sqFt < 5) return `~${Math.round(sqFt)} sq ft of floor space`;
  if (sqFt < 15) return `~${Math.round(sqFt)} sq ft — a whole closet`;
  if (sqFt < 30) return `~${Math.round(sqFt)} sq ft — a small room`;
  return `~${Math.round(sqFt)} sq ft — practically a whole room`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

export function getEncouragementMessage(itemsCaptured: number): string {
  if (itemsCaptured === 0) return "Ready when you are!";
  if (itemsCaptured <= 3) return "Great start!";
  if (itemsCaptured <= 8) return "You're on a roll!";
  if (itemsCaptured <= 15) return "Incredible session!";
  return "Absolute legend!";
}
