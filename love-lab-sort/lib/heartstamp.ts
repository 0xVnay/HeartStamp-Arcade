/**
 * HeartStamp integration layer
 * -----------------------------
 * These are the host-app callbacks the embedding HeartStamp page can wire up.
 * While a greeting-card image is generating, the game reports score, milestone,
 * and round-end events so the host can grant credits / rewards.
 *
 * In a real embed, HeartStamp would inject `window.heartstamp` (or pass props).
 * Here we provide safe default no-op placeholders that log to the console so the
 * integration points are obvious and testable.
 */

import type { Difficulty } from "./game";

export interface RoundSummary {
  game: "love-lab-sort";
  difficulty: Difficulty;
  level: number;
  moves: number;
  bestMoves: number | null;
  durationMs: number;
  score: number;
  creditsEarned: number;
  totalCredits: number;
}

export interface MilestoneEvent {
  type: "level-complete" | "perfect-level" | "streak" | "credit-threshold";
  label: string;
  value?: number;
}

export interface HeartStampCallbacks {
  onScore(score: number): void;
  onMilestone(event: MilestoneEvent): void;
  onRoundEnd(summary: RoundSummary): void;
}

type HostWindow = Window & {
  heartstamp?: Partial<HeartStampCallbacks>;
};

/**
 * Resolve callbacks from the host (window.heartstamp) when present, otherwise
 * fall back to console-logging placeholders. The host can override any subset.
 */
export function getHeartStampCallbacks(): HeartStampCallbacks {
  const host = (typeof window !== "undefined" ? (window as HostWindow).heartstamp : undefined) ?? {};

  return {
    onScore: host.onScore ?? ((score) => console.info("[HeartStamp] onScore", score)),
    onMilestone:
      host.onMilestone ?? ((event) => console.info("[HeartStamp] onMilestone", event)),
    onRoundEnd:
      host.onRoundEnd ?? ((summary) => console.info("[HeartStamp] onRoundEnd", summary)),
  };
}

/* -------------------------------------------------------------------------- */
/*  localStorage persistence (best scores, credits, resume)                   */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "love-lab-sort.v2";

export interface ModeProgress {
  highestLevel: number;
  bestMoves: Record<number, number>;
}

export interface PersistedState {
  /** Last chosen mode — restored on the menu. */
  difficulty: Difficulty;
  totalCredits: number;
  /** Per-mode progress, so each difficulty keeps its own level + best moves. */
  progress: Record<Difficulty, ModeProgress>;
  /** Snapshot of an in-progress level so the player can resume after a reload. */
  resume: ResumeSnapshot | null;
}

export interface ResumeSnapshot {
  difficulty: Difficulty;
  level: number;
  tubes: number[][];
  moves: number;
  startedAt: number;
}

function emptyProgress(): Record<Difficulty, ModeProgress> {
  return {
    easy: { highestLevel: 1, bestMoves: {} },
    medium: { highestLevel: 1, bestMoves: {} },
    hard: { highestLevel: 1, bestMoves: {} },
  };
}

function emptyState(): PersistedState {
  return {
    difficulty: "easy",
    totalCredits: 0,
    progress: emptyProgress(),
    resume: null,
  };
}

export function loadState(): PersistedState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const base = emptyProgress();
    if (parsed.progress) {
      (Object.keys(base) as Difficulty[]).forEach((d) => {
        const p = parsed.progress?.[d];
        if (p) base[d] = { highestLevel: p.highestLevel ?? 1, bestMoves: p.bestMoves ?? {} };
      });
    }
    return {
      difficulty: parsed.difficulty ?? "easy",
      totalCredits: parsed.totalCredits ?? 0,
      progress: base,
      resume: parsed.resume ?? null,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable (private mode / quota) — fail silently */
  }
}

export function clearResume(state: PersistedState): PersistedState {
  const next = { ...state, resume: null };
  saveState(next);
  return next;
}
