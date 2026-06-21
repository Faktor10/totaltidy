// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("playCategorizeSound", () => {
  let mockOscillator: {
    type: string;
    frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };
  let mockGain: {
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
  };
  let mockContext: {
    state: string;
    currentTime: number;
    resume: ReturnType<typeof vi.fn>;
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    destination: object;
  };

  beforeEach(() => {
    mockOscillator = {
      type: "",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    mockGain = {
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
    mockContext = {
      state: "running",
      currentTime: 0,
      resume: vi.fn(),
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      destination: {},
    };

    const MockAudioContext = class {
      state = mockContext.state;
      currentTime = mockContext.currentTime;
      resume = mockContext.resume;
      createOscillator = mockContext.createOscillator;
      createGain = mockContext.createGain;
      destination = mockContext.destination;
    };
    Object.defineProperty(window, "AudioContext", {
      value: MockAudioContext,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("creates an oscillator with sine wave at 880 Hz", async () => {
    const { playCategorizeSound: fn } = await import("./sound");
    fn();
    expect(mockOscillator.type).toBe("sine");
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(880, 0);
  });

  it("applies a quick fade-in and fade-out envelope", async () => {
    const { playCategorizeSound: fn } = await import("./sound");
    fn();
    expect(mockGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
    expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.15, 0.01);
    expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 0.12);
  });

  it("connects oscillator → gain → destination", async () => {
    const { playCategorizeSound: fn } = await import("./sound");
    fn();
    expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);
    expect(mockGain.connect).toHaveBeenCalledWith(mockContext.destination);
  });

  it("starts and stops the oscillator within the duration", async () => {
    const { playCategorizeSound: fn } = await import("./sound");
    fn();
    expect(mockOscillator.start).toHaveBeenCalledWith(0);
    expect(mockOscillator.stop).toHaveBeenCalledWith(0.12);
  });

  it("returns true when audio plays successfully", async () => {
    const { playCategorizeSound: fn } = await import("./sound");
    expect(fn()).toBe(true);
  });

  it("returns false when AudioContext is not available", async () => {
    Object.defineProperty(window, "AudioContext", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "webkitAudioContext", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const { playCategorizeSound: fn } = await import("./sound");
    expect(fn()).toBe(false);
  });

  it("resumes audio context when suspended", async () => {
    mockContext.state = "suspended";
    const { playCategorizeSound: fn } = await import("./sound");
    fn();
    expect(mockContext.resume).toHaveBeenCalled();
  });
});
