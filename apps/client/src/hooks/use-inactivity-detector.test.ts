// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInactivityDetector } from "./use-inactivity-detector";

describe("useInactivityDetector", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onTimeout after the specified timeout period", () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityDetector({ timeoutMs: 60_000, onTimeout }));

    expect(onTimeout).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("does not call onTimeout before the timeout period", () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityDetector({ timeoutMs: 60_000, onTimeout }));

    act(() => {
      vi.advanceTimersByTime(59_999);
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("resets the timer when recordActivity is called", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useInactivityDetector({ timeoutMs: 60_000, onTimeout }));

    act(() => {
      vi.advanceTimersByTime(50_000);
    });

    act(() => {
      result.current.recordActivity();
    });

    act(() => {
      vi.advanceTimersByTime(50_000);
    });

    expect(onTimeout).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("sets isTimedOut to true after timeout", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useInactivityDetector({ timeoutMs: 60_000, onTimeout }));

    expect(result.current.isTimedOut).toBe(false);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.isTimedOut).toBe(true);
  });

  it("does not fire again after already timed out", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useInactivityDetector({ timeoutMs: 60_000, onTimeout }));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.recordActivity();
    });

    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("does not start the timer when enabled is false", () => {
    const onTimeout = vi.fn();
    renderHook(() =>
      useInactivityDetector({
        timeoutMs: 60_000,
        onTimeout,
        enabled: false,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("uses default 60s timeout when timeoutMs is not specified", () => {
    const onTimeout = vi.fn();
    renderHook(() => useInactivityDetector({ onTimeout }));

    act(() => {
      vi.advanceTimersByTime(59_999);
    });

    expect(onTimeout).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("reset restores the timer after a timeout", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useInactivityDetector({ timeoutMs: 60_000, onTimeout }));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.isTimedOut).toBe(true);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isTimedOut).toBe(false);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(2);
  });

  it("clears the timer on unmount", () => {
    const onTimeout = vi.fn();
    const { unmount } = renderHook(() => useInactivityDetector({ timeoutMs: 60_000, onTimeout }));

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });
});
