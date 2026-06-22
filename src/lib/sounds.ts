let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || !window.AudioContext) {
    return null;
  }
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function _resetAudioContext(): void {
  audioContext = null;
}

const NOTE_C5 = 523.25;
const NOTE_E5 = 659.25;
const GAIN = 0.12;
const NOTE_DURATION = 0.08;
const GAP = 0.02;

export function playCategorizeSound(): boolean {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;

  for (let i = 0; i < 2; i++) {
    const freq = i === 0 ? NOTE_C5 : NOTE_E5;
    const start = now + i * (NOTE_DURATION + GAP);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(GAIN, start + 0.01);
    gain.gain.linearRampToValueAtTime(0, start + NOTE_DURATION);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + NOTE_DURATION);
  }

  return true;
}
