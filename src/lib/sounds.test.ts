// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _resetAudioContext, playCategorizeSound } from "./sounds";

function createMockOscillator() {
  return {
    type: "sine" as OscillatorType,
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createMockGain() {
  return {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
}

describe("playCategorizeSound", () => {
  let mockOscillators: ReturnType<typeof createMockOscillator>[];
  let mockGains: ReturnType<typeof createMockGain>[];
  let mockResume: ReturnType<typeof vi.fn>;
  let mockState: string;

  beforeEach(() => {
    _resetAudioContext();
    mockOscillators = [];
    mockGains = [];
    mockResume = vi.fn(() => Promise.resolve());
    mockState = "running";

    class MockAudioContext {
      currentTime = 0;
      destination = {};
      get state() {
        return mockState;
      }
      resume = mockResume;
      createOscillator = vi.fn(() => {
        const osc = createMockOscillator();
        mockOscillators.push(osc);
        return osc;
      });
      createGain = vi.fn(() => {
        const g = createMockGain();
        mockGains.push(g);
        return g;
      });
    }

    Object.defineProperty(window, "AudioContext", {
      value: MockAudioContext,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when AudioContext is not available", () => {
    _resetAudioContext();
    Object.defineProperty(window, "AudioContext", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(playCategorizeSound()).toBe(false);
  });

  it("returns true when sound is played successfully", () => {
    expect(playCategorizeSound()).toBe(true);
  });

  it("creates two oscillators for the ascending two-note tone", () => {
    playCategorizeSound();
    expect(mockOscillators).toHaveLength(2);
  });

  it("uses sine wave type for both notes", () => {
    playCategorizeSound();
    expect(mockOscillators[0].type).toBe("sine");
    expect(mockOscillators[1].type).toBe("sine");
  });

  it("plays an ascending interval (second note higher than first)", () => {
    playCategorizeSound();
    expect(mockOscillators[1].frequency.value).toBeGreaterThan(mockOscillators[0].frequency.value);
  });

  it("connects each oscillator through a gain node to destination", () => {
    playCategorizeSound();
    for (let i = 0; i < 2; i++) {
      expect(mockOscillators[i].connect).toHaveBeenCalledWith(mockGains[i]);
      expect(mockGains[i].connect).toHaveBeenCalled();
    }
  });

  it("starts and stops each oscillator", () => {
    playCategorizeSound();
    for (const osc of mockOscillators) {
      expect(osc.start).toHaveBeenCalledOnce();
      expect(osc.stop).toHaveBeenCalledOnce();
    }
  });

  it("resumes audio context when suspended", () => {
    mockState = "suspended";
    playCategorizeSound();
    expect(mockResume).toHaveBeenCalledOnce();
  });

  it("does not resume audio context when already running", () => {
    mockState = "running";
    playCategorizeSound();
    expect(mockResume).not.toHaveBeenCalled();
  });
});
