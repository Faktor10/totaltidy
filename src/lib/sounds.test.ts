// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createMockOscillator() {
  return {
    connect: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    type: "sine" as OscillatorType,
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createMockGainNode() {
  return {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  };
}

describe("playCategorizeSound", () => {
  let mockOscillator: ReturnType<typeof createMockOscillator>;
  let mockGainNode: ReturnType<typeof createMockGainNode>;
  let mockDestination: AudioDestinationNode;
  let mockContextInstance: {
    currentTime: number;
    state: AudioContextState;
    destination: AudioDestinationNode;
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockOscillator = createMockOscillator();
    mockGainNode = createMockGainNode();
    mockDestination = {} as AudioDestinationNode;

    mockContextInstance = {
      currentTime: 0,
      state: "running" as AudioContextState,
      destination: mockDestination,
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGainNode),
      resume: vi.fn(() => Promise.resolve()),
    };

    vi.stubGlobal("AudioContext", function MockAudioContext() {
      return mockContextInstance;
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function loadModule() {
    const mod = await import("./sounds");
    return mod.playCategorizeSound;
  }

  it("creates an oscillator and gain node", async () => {
    const playCategorizeSound = await loadModule();
    playCategorizeSound();
    expect(mockContextInstance.createOscillator).toHaveBeenCalled();
    expect(mockContextInstance.createGain).toHaveBeenCalled();
  });

  it("connects oscillator through gain to destination", async () => {
    const playCategorizeSound = await loadModule();
    playCategorizeSound();
    expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
    expect(mockGainNode.connect).toHaveBeenCalledWith(mockDestination);
  });

  it("uses sine wave oscillator type", async () => {
    const playCategorizeSound = await loadModule();
    playCategorizeSound();
    expect(mockOscillator.type).toBe("sine");
  });

  it("sets frequency starting at 880Hz", async () => {
    const playCategorizeSound = await loadModule();
    playCategorizeSound();
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(880, 0);
  });

  it("ramps frequency up to 1320Hz", async () => {
    const playCategorizeSound = await loadModule();
    playCategorizeSound();
    expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      1320,
      expect.any(Number),
    );
  });

  it("starts and stops the oscillator", async () => {
    const playCategorizeSound = await loadModule();
    playCategorizeSound();
    expect(mockOscillator.start).toHaveBeenCalledWith(0);
    expect(mockOscillator.stop).toHaveBeenCalledWith(expect.any(Number));
  });

  it("applies gain envelope with attack and decay", async () => {
    const playCategorizeSound = await loadModule();
    playCategorizeSound();
    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
    expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.12,
      expect.any(Number),
    );
    expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0.001,
      expect.any(Number),
    );
  });

  it("returns true on success", async () => {
    const playCategorizeSound = await loadModule();
    expect(playCategorizeSound()).toBe(true);
  });

  it("returns false when AudioContext is not available", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const playCategorizeSound = await loadModule();
    expect(playCategorizeSound()).toBe(false);
  });

  it("resumes suspended audio context", async () => {
    mockContextInstance.state = "suspended";
    const playCategorizeSound = await loadModule();
    playCategorizeSound();
    expect(mockContextInstance.resume).toHaveBeenCalled();
  });

  it("does not resume running audio context", async () => {
    mockContextInstance.state = "running";
    const playCategorizeSound = await loadModule();
    playCategorizeSound();
    expect(mockContextInstance.resume).not.toHaveBeenCalled();
  });
});
