"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_TIMEOUT_MS = 60_000;

export interface UseInactivityDetectorOptions {
  timeoutMs?: number;
  onTimeout: () => void;
  enabled?: boolean;
}

export interface UseInactivityDetectorReturn {
  recordActivity: () => void;
  isTimedOut: boolean;
  reset: () => void;
}

export function useInactivityDetector({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onTimeout,
  enabled = true,
}: UseInactivityDetectorOptions): UseInactivityDetectorReturn {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const isTimedOutRef = useRef(false);

  onTimeoutRef.current = onTimeout;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (!enabled || isTimedOutRef.current) return;
    timerRef.current = setTimeout(() => {
      isTimedOutRef.current = true;
      setIsTimedOut(true);
      onTimeoutRef.current();
    }, timeoutMs);
  }, [clearTimer, timeoutMs, enabled]);

  const recordActivity = useCallback(() => {
    if (!enabled || isTimedOutRef.current) return;
    startTimer();
  }, [enabled, startTimer]);

  const reset = useCallback(() => {
    isTimedOutRef.current = false;
    setIsTimedOut(false);
    clearTimer();
    if (enabled) {
      startTimer();
    }
  }, [clearTimer, startTimer, enabled]);

  useEffect(() => {
    if (enabled) {
      startTimer();
    }
    return clearTimer;
  }, [enabled, startTimer, clearTimer]);

  return { recordActivity, isTimedOut, reset };
}
