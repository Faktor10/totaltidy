// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createMockOscillator() {
  return {
    type: "sine" as OscillatorType,
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createMockGain() {
  return {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
}

describe("playCategorizeSound", () => {
  let mockOsc: ReturnType<typeof createMockOscillator>;
  let mockGain: ReturnType<typeof createMockGain>;
  let mockCtx: {
    currentTime: number;
    state: string;
    destination: object;
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetModules();
    mockOsc = createMockOscillator();
    mockGain = createMockGain();
    mockCtx = {
      currentTime: 0,
      state: "running",
      destination: {},
      createOscillator: vi.fn(() => mockOsc),
      createGain: vi.fn(() => mockGain),
      resume: vi.fn(() => Promise.resolve()),
    };

    const MockAudioContext = class {
      currentTime = mockCtx.currentTime;
      state = mockCtx.state;
      destination = mockCtx.destination;
      createOscillator = mockCtx.createOscillator;
      createGain = mockCtx.createGain;
      resume = mockCtx.resume;
    };
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns true and creates oscillator and gain nodes", async () => {
    const { playCategorizeSound } = await import("./categorize-sound");
    const result = playCategorizeSound();
    expect(result).toBe(true);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it("uses a sine wave starting at 880Hz rising to 1320Hz", async () => {
    const { playCategorizeSound } = await import("./categorize-sound");
    playCategorizeSound();
    expect(mockOsc.type).toBe("sine");
    expect(mockOsc.frequency.setValueAtTime).toHaveBeenCalledWith(880, 0);
    expect(mockOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1320, 0.15);
  });

  it("sets gain to fade out quickly", async () => {
    const { playCategorizeSound } = await import("./categorize-sound");
    playCategorizeSound();
    expect(mockGain.gain.setValueAtTime).toHaveBeenCalledWith(0.12, 0);
    expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.15);
  });

  it("connects oscillator → gain → destination", async () => {
    const { playCategorizeSound } = await import("./categorize-sound");
    playCategorizeSound();
    expect(mockOsc.connect).toHaveBeenCalledWith(mockGain);
    expect(mockGain.connect).toHaveBeenCalledWith(mockCtx.destination);
  });

  it("starts and stops the oscillator within the duration window", async () => {
    const { playCategorizeSound } = await import("./categorize-sound");
    playCategorizeSound();
    expect(mockOsc.start).toHaveBeenCalledWith(0);
    expect(mockOsc.stop).toHaveBeenCalledWith(0.15);
  });

  it("resumes a suspended AudioContext", async () => {
    mockCtx.state = "suspended";
    const { playCategorizeSound } = await import("./categorize-sound");
    playCategorizeSound();
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it("does not resume an already running AudioContext", async () => {
    mockCtx.state = "running";
    const { playCategorizeSound } = await import("./categorize-sound");
    playCategorizeSound();
    expect(mockCtx.resume).not.toHaveBeenCalled();
  });

  it("returns false when AudioContext is not available", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const { playCategorizeSound } = await import("./categorize-sound");
    const result = playCategorizeSound();
    expect(result).toBe(false);
  });
});
