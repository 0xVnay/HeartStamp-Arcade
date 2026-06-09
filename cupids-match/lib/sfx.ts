/**
 * Tiny WebAudio sound + haptics helper for Cupid's Match.
 * ------------------------------------------------------
 * No external audio files — every cue is a short synthesized tone. Lazily
 * creates a single AudioContext on first use (after a user gesture, which the
 * game always has). All sound is gated by a mute flag; haptics by both mute and
 * `prefers-reduced-motion`.
 */

type Cue = "select" | "swap" | "nope" | "clear" | "cascade" | "level-up" | "win" | "lose";

let ctx: AudioContext | null = null;
let muted = false;

function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

/** One short tone with a soft attack/decay envelope. */
function tone(freq: number, durMs: number, type: OscillatorType, gain: number, delayMs = 0): void {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  const t0 = ac.currentTime + delayMs / 1000;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + durMs / 1000 + 0.02);
}

/**
 * Play a cue. `step` lets cascades rise in pitch (0,1,2,...).
 */
export function playSfx(cue: Cue, step = 0): void {
  if (muted) return;
  switch (cue) {
    case "select":
      tone(520, 70, "sine", 0.07);
      break;
    case "swap":
      tone(440, 80, "triangle", 0.08);
      tone(620, 90, "triangle", 0.06, 40);
      break;
    case "nope":
      tone(300, 120, "sawtooth", 0.05);
      tone(220, 140, "sawtooth", 0.05, 60);
      break;
    case "clear": {
      const base = 540 + Math.min(step, 6) * 80; // rising pitch per cascade step
      tone(base, 120, "sine", 0.09);
      tone(base * 1.5, 130, "sine", 0.05, 30);
      break;
    }
    case "cascade": {
      const base = 660 + Math.min(step, 6) * 90;
      tone(base, 140, "triangle", 0.09);
      tone(base * 1.34, 160, "sine", 0.06, 45);
      break;
    }
    case "level-up": {
      // ascending arpeggio — "sealed with a stamp"
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 220, "triangle", 0.09, i * 90));
      break;
    }
    case "win": {
      [659, 784, 988, 1319].forEach((f, i) => tone(f, 260, "sine", 0.1, i * 110));
      break;
    }
    case "lose":
      tone(392, 200, "sine", 0.08);
      tone(294, 260, "sine", 0.08, 120);
      break;
  }
}

/** Guarded haptic feedback — silent under mute or reduced-motion or no support. */
export function haptic(pattern: number | number[]): void {
  if (muted || reducedMotion()) return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
