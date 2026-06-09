/**
 * Light haptic feedback via navigator.vibrate, guarded for support and disabled
 * under prefers-reduced-motion or when the player has muted the game.
 */

export type HapticKind = "move" | "merge" | "levelup" | "win" | "gameover";

const PATTERNS: Record<HapticKind, number | number[]> = {
  move: 8,
  merge: 16,
  levelup: [0, 20, 40, 30],
  win: [0, 30, 50, 30, 50, 40],
  gameover: [0, 40, 60, 20],
};

function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function vibrate(kind: HapticKind, muted: boolean): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (muted || reducedMotion()) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* ignore */
  }
}
