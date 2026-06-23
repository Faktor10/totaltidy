// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeOscillatorMock() {
  return {
    type: "sine" as OscillatorType,
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function makeGainMock() {
  return {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
}

describe("playCategorizeTone", () => {
  let mockCtx: {
    currentTime: number;
    state: string;
    destination: object;
    resume: ReturnType<typeof vi.fn>;
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetModules();

    mockCtx = {
      currentTime: 0,
      state: "running",
      destination: {},
      resume: vi.fn(),
      createOscillator: vi.fn(() => makeOscillatorMock()),
      createGain: vi.fn(() => makeGainMock()),
    };

    class MockAudioContext {
      currentTime = mockCtx.currentTime;
      state = mockCtx.state;
      destination = mockCtx.destination;
      resume = mockCtx.resume;
      createOscillator = mockCtx.createOscillator;
      createGain = mockCtx.createGain;
    }

    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates oscillator and gain nodes for each note", async () => {
    const { playCategorizeTone } = await import("./sounds");
    playCategorizeTone();

    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockCtx.createGain).toHaveBeenCalledTimes(2);
  });

  it("returns true when AudioContext is available", async () => {
    const { playCategorizeTone } = await import("./sounds");
    expect(playCategorizeTone()).toBe(true);
  });

  it("returns false when AudioContext is not available", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const mod = await import("./sounds");
    expect(mod.playCategorizeTone()).toBe(false);
  });

  it("connects oscillators through gain to destination", async () => {
    const oscMock = makeOscillatorMock();
    const gainMock = makeGainMock();
    mockCtx.createOscillator.mockReturnValue(oscMock);
    mockCtx.createGain.mockReturnValue(gainMock);

    const { playCategorizeTone } = await import("./sounds");
    playCategorizeTone();

    expect(oscMock.connect).toHaveBeenCalledWith(gainMock);
    expect(gainMock.connect).toHaveBeenCalledWith(mockCtx.destination);
  });

  it("uses sine wave type", async () => {
    const oscMock = makeOscillatorMock();
    mockCtx.createOscillator.mockReturnValue(oscMock);
    mockCtx.createGain.mockReturnValue(makeGainMock());

    const { playCategorizeTone } = await import("./sounds");
    playCategorizeTone();

    expect(oscMock.type).toBe("sine");
  });

  it("resumes suspended AudioContext", async () => {
    mockCtx.state = "suspended";
    mockCtx.resume.mockResolvedValue(undefined);

    class SuspendedMockAudioContext {
      currentTime = mockCtx.currentTime;
      state = "suspended";
      destination = mockCtx.destination;
      resume = mockCtx.resume;
      createOscillator = mockCtx.createOscillator;
      createGain = mockCtx.createGain;
    }
    vi.stubGlobal("AudioContext", SuspendedMockAudioContext);

    const { playCategorizeTone } = await import("./sounds");
    playCategorizeTone();

    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it("does not resume already-running AudioContext", async () => {
    mockCtx.state = "running";

    const { playCategorizeTone } = await import("./sounds");
    playCategorizeTone();

    expect(mockCtx.resume).not.toHaveBeenCalled();
  });

  it("starts and stops oscillators at scheduled times", async () => {
    const oscMocks = [makeOscillatorMock(), makeOscillatorMock()];
    let oscIdx = 0;
    mockCtx.createOscillator.mockImplementation(() => {
      const mock = oscMocks[oscIdx];
      oscIdx++;
      return mock;
    });
    mockCtx.createGain.mockReturnValue(makeGainMock());

    const { playCategorizeTone } = await import("./sounds");
    playCategorizeTone();

    expect(oscMocks[0].start).toHaveBeenCalled();
    expect(oscMocks[0].stop).toHaveBeenCalled();
    expect(oscMocks[1].start).toHaveBeenCalled();
    expect(oscMocks[1].stop).toHaveBeenCalled();
  });
});
