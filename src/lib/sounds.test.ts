// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let playCategorizeSound: typeof import("./sounds").playCategorizeSound;

function createMockAudioContext() {
  const gainNode = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
  const oscillatorNode = {
    type: "sine" as OscillatorType,
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  return {
    state: "running" as AudioContextState,
    currentTime: 0,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => oscillatorNode),
    createGain: vi.fn(() => gainNode),
    _oscillator: oscillatorNode,
    _gain: gainNode,
  };
}

describe("playCategorizeSound", () => {
  let mockCtx: ReturnType<typeof createMockAudioContext>;
  let constructorCallCount: number;

  beforeEach(async () => {
    vi.resetModules();
    mockCtx = createMockAudioContext();
    constructorCallCount = 0;
    function MockAudioContext() {
      constructorCallCount++;
      return mockCtx;
    }
    vi.stubGlobal("AudioContext", MockAudioContext);
    const mod = await import("./sounds");
    playCategorizeSound = mod.playCategorizeSound;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns true when AudioContext is available", () => {
    expect(playCategorizeSound()).toBe(true);
  });

  it("creates an oscillator and gain node", () => {
    playCategorizeSound();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it("uses sine wave with ascending frequency", () => {
    playCategorizeSound();
    const freq = mockCtx._oscillator.frequency;
    expect(freq.setValueAtTime).toHaveBeenCalledWith(660, 0);
    expect(freq.exponentialRampToValueAtTime).toHaveBeenCalledWith(880, 0.08);
  });

  it("sets low volume for subtlety", () => {
    playCategorizeSound();
    const gain = mockCtx._gain.gain;
    expect(gain.setValueAtTime).toHaveBeenCalledWith(0.12, 0);
    expect(gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.15);
  });

  it("starts and stops the oscillator within 150ms", () => {
    playCategorizeSound();
    expect(mockCtx._oscillator.start).toHaveBeenCalledWith(0);
    expect(mockCtx._oscillator.stop).toHaveBeenCalledWith(0.15);
  });

  it("resumes suspended audio context", () => {
    mockCtx.state = "suspended";
    playCategorizeSound();
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it("returns false when AudioContext is unavailable", async () => {
    vi.resetModules();
    vi.stubGlobal("AudioContext", undefined);
    const mod = await import("./sounds");
    expect(mod.playCategorizeSound()).toBe(false);
  });

  it("reuses the same AudioContext across calls", () => {
    playCategorizeSound();
    playCategorizeSound();
    expect(constructorCallCount).toBe(1);
  });
});
