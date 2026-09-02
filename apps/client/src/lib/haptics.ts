const SHUTTER_VIBRATION_MS = 50;

export function triggerHaptic(durationMs: number = SHUTTER_VIBRATION_MS): boolean {
  if (typeof navigator === "undefined" || !navigator.vibrate) {
    return false;
  }
  return navigator.vibrate(durationMs);
}
