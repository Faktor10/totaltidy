import { describe, expect, it, vi } from "vitest";
import { playCategorizeTone } from "./use-categorize-sound";

function createMockGainNode() {
  return {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
}

function createMockOscillator() {
  return {
    type: "" as OscillatorType,
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createMockAudioContext() {
  const gains: ReturnType<typeof createMockGainNode>[] = [];
  const oscillators: ReturnType<typeof createMockOscillator>[] = [];

  return {
    ctx: {
      currentTime: 1.0,
      destination: {},
      createGain: vi.fn(() => {
        const g = createMockGainNode();
        gains.push(g);
        return g;
      }),
      createOscillator: vi.fn(() => {
        const o = createMockOscillator();
        oscillators.push(o);
        return o;
      }),
    } as unknown as AudioContext,
    gains,
    oscillators,
  };
}

describe("playCategorizeTone", () => {
  it("creates two oscillators and two gain nodes", () => {
    const { ctx, gains, oscillators } = createMockAudioContext();
    playCategorizeTone(ctx);

    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
    expect(ctx.createGain).toHaveBeenCalledTimes(2);
    expect(gains).toHaveLength(2);
    expect(oscillators).toHaveLength(2);
  });

  it("uses sine waveform for both oscillators", () => {
    const { ctx, oscillators } = createMockAudioContext();
    playCategorizeTone(ctx);

    expect(oscillators[0].type).toBe("sine");
    expect(oscillators[1].type).toBe("sine");
  });

  it("sets ascending frequencies (C5 then E5)", () => {
    const { ctx, oscillators } = createMockAudioContext();
    playCategorizeTone(ctx);

    expect(oscillators[0].frequency.value).toBeCloseTo(523.25);
    expect(oscillators[1].frequency.value).toBeCloseTo(659.25);
    expect(oscillators[1].frequency.value).toBeGreaterThan(oscillators[0].frequency.value);
  });

  it("connects oscillators to gain nodes and gain nodes to destination", () => {
    const { ctx, gains, oscillators } = createMockAudioContext();
    playCategorizeTone(ctx);

    expect(oscillators[0].connect).toHaveBeenCalledWith(gains[0]);
    expect(oscillators[1].connect).toHaveBeenCalledWith(gains[1]);
    expect(gains[0].connect).toHaveBeenCalledWith(ctx.destination);
    expect(gains[1].connect).toHaveBeenCalledWith(ctx.destination);
  });

  it("starts both oscillators and schedules stops", () => {
    const { ctx, oscillators } = createMockAudioContext();
    playCategorizeTone(ctx);

    expect(oscillators[0].start).toHaveBeenCalledTimes(1);
    expect(oscillators[0].stop).toHaveBeenCalledTimes(1);
    expect(oscillators[1].start).toHaveBeenCalledTimes(1);
    expect(oscillators[1].stop).toHaveBeenCalledTimes(1);
  });

  it("second oscillator starts after the first", () => {
    const { ctx, oscillators } = createMockAudioContext();
    playCategorizeTone(ctx);

    const firstStart = oscillators[0].start.mock.calls[0][0] as number;
    const secondStart = oscillators[1].start.mock.calls[0][0] as number;
    expect(secondStart).toBeGreaterThan(firstStart);
  });

  it("applies gain envelope with fade-out to zero", () => {
    const { ctx, gains } = createMockAudioContext();
    playCategorizeTone(ctx);

    for (const g of gains) {
      expect(g.gain.setValueAtTime).toHaveBeenCalledTimes(1);
      expect(g.gain.linearRampToValueAtTime).toHaveBeenCalledTimes(1);
      const rampTarget = g.gain.linearRampToValueAtTime.mock.calls[0][0] as number;
      expect(rampTarget).toBe(0);
    }
  });
});
