"use client";

import { useCallback, useRef } from "react";

const NOTE_C5 = 523.25;
const NOTE_E5 = 659.25;
const GAIN = 0.12;
const FIRST_NOTE_DURATION = 0.08;
const SECOND_NOTE_DELAY = 0.06;
const SECOND_NOTE_DURATION = 0.1;
const FADE_OUT_DURATION = 0.04;

export function playCategorizeTone(ctx: AudioContext) {
  const now = ctx.currentTime;

  const g1 = ctx.createGain();
  g1.gain.setValueAtTime(GAIN, now);
  g1.gain.linearRampToValueAtTime(0, now + FIRST_NOTE_DURATION + FADE_OUT_DURATION);
  g1.connect(ctx.destination);

  const o1 = ctx.createOscillator();
  o1.type = "sine";
  o1.frequency.value = NOTE_C5;
  o1.connect(g1);
  o1.start(now);
  o1.stop(now + FIRST_NOTE_DURATION + FADE_OUT_DURATION);

  const secondStart = now + SECOND_NOTE_DELAY;
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(GAIN, secondStart);
  g2.gain.linearRampToValueAtTime(0, secondStart + SECOND_NOTE_DURATION + FADE_OUT_DURATION);
  g2.connect(ctx.destination);

  const o2 = ctx.createOscillator();
  o2.type = "sine";
  o2.frequency.value = NOTE_E5;
  o2.connect(g2);
  o2.start(secondStart);
  o2.stop(secondStart + SECOND_NOTE_DURATION + FADE_OUT_DURATION);
}

export function useCategorizeSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    if (typeof window === "undefined" || !window.AudioContext) return;

    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }

    const ctx = ctxRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume().then(() => playCategorizeTone(ctx));
      return;
    }

    playCategorizeTone(ctx);
  }, []);

  return { play };
}
