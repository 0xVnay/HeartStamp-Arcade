/**
 * Tiny WebAudio SFX — short, pleasant tones synthesized on the fly. No external
 * audio files. All play() calls are no-ops on the server, when muted, or when
 * the user prefers reduced motion. The AudioContext is created lazily on first
 * use (a user gesture) so browsers don't block it.
 */

export type SfxName = "move" | "merge" | "levelup" | "win" | "gameover";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Note {
  freq: number;
  start: number; // seconds offset
  dur: number;
  type?: OscillatorType;
  gain?: number;
}

const PATTERNS: Record<SfxName, Note[]> = {
  // soft wooden click
  move: [{ freq: 220, start: 0, dur: 0.07, type: "triangle", gain: 0.16 }],
  // bright two-note chime
  merge: [
    { freq: 523, start: 0, dur: 0.09, type: "sine", gain: 0.2 },
    { freq: 784, start: 0.06, dur: 0.12, type: "sine", gain: 0.2 },
  ],
  // rising flourish — "sealed with a stamp"
  levelup: [
    { freq: 523, start: 0, dur: 0.1, type: "triangle", gain: 0.22 },
    { freq: 659, start: 0.09, dur: 0.1, type: "triangle", gain: 0.22 },
    { freq: 784, start: 0.18, dur: 0.1, type: "triangle", gain: 0.22 },
    { freq: 1046, start: 0.27, dur: 0.22, type: "triangle", gain: 0.24 },
  ],
  // celebratory arpeggio
  win: [
    { freq: 659, start: 0, dur: 0.12, type: "sine", gain: 0.22 },
    { freq: 880, start: 0.1, dur: 0.12, type: "sine", gain: 0.22 },
    { freq: 1046, start: 0.2, dur: 0.12, type: "sine", gain: 0.22 },
    { freq: 1318, start: 0.3, dur: 0.28, type: "sine", gain: 0.24 },
  ],
  // gentle descending sigh
  gameover: [
    { freq: 440, start: 0, dur: 0.16, type: "sine", gain: 0.2 },
    { freq: 349, start: 0.14, dur: 0.16, type: "sine", gain: 0.2 },
    { freq: 262, start: 0.28, dur: 0.3, type: "sine", gain: 0.2 },
  ],
};

/**
 * Play a synthesized effect. `muted` is the user's persisted preference.
 */
export function playSfx(name: SfxName, muted: boolean): void {
  if (muted || prefersReducedMotion()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const now = ac.currentTime;
  for (const note of PATTERNS[name]) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = note.type ?? "sine";
    osc.frequency.value = note.freq;
    const t0 = now + note.start;
    const peak = note.gain ?? 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + note.dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + note.dur + 0.02);
  }
}
