let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!window.AudioContext) return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

const TONE_FREQUENCY = 880;
const TONE_END_FREQUENCY = 1320;
const TONE_DURATION_S = 0.2;
const TONE_PEAK_GAIN = 0.12;
const TONE_ATTACK_S = 0.015;
const TONE_DECAY_MIN = 0.001;

export function playCategorizeSound(): boolean {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(TONE_FREQUENCY, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    TONE_END_FREQUENCY,
    ctx.currentTime + TONE_DURATION_S,
  );

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(TONE_PEAK_GAIN, ctx.currentTime + TONE_ATTACK_S);
  gainNode.gain.exponentialRampToValueAtTime(TONE_DECAY_MIN, ctx.currentTime + TONE_DURATION_S);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + TONE_DURATION_S);

  return true;
}
