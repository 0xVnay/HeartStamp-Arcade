/**
 * HeartStamp integration layer
 * -----------------------------
 * Host-app reward callbacks + localStorage persistence. While a card image is
 * generating, the game reports score / milestones / round-end so the host can
 * grant credits. Defaults log to the console when no host is present.
 */

import type { Card, Difficulty } from "./game";

export interface RoundSummary {
  game: "stampy-pairs";
  difficulty: Difficulty;
  moves: number;
  durationSec: number;
  stars: number;
  score: number;
  creditsEarned: number;
  totalCredits: number;
  isBest: boolean;
}

export interface MilestoneEvent {
  type: "match" | "combo" | "round-complete" | "perfect" | "credit-threshold" | "best-score";
  label: string;
  value?: number;
}

export interface HeartStampCallbacks {
  onScore(score: number): void;
  onMilestone(event: MilestoneEvent): void;
  onRoundEnd(summary: RoundSummary): void;
}

type HostWindow = Window & { heartstamp?: Partial<HeartStampCallbacks> };

export function getHeartStampCallbacks(): HeartStampCallbacks {
  const host = (typeof window !== "undefined" ? (window as HostWindow).heartstamp : undefined) ?? {};
  return {
    onScore: host.onScore ?? ((s) => console.info("[HeartStamp] onScore", s)),
    onMilestone: host.onMilestone ?? ((e) => console.info("[HeartStamp] onMilestone", e)),
    onRoundEnd: host.onRoundEnd ?? ((s) => console.info("[HeartStamp] onRoundEnd", s)),
  };
}

/* -------------------------------------------------------------------------- */
/*  persistence                                                               */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "stampy-pairs.v1";

export interface ModeBest {
  bestScore: number;
  bestMoves: number | null;
  bestTimeSec: number | null;
  stars: number;
}

export interface ResumeSnapshot {
  difficulty: Difficulty;
  deck: Card[];
  matched: number[];
  moves: number;
  startedAt: number; // epoch ms
}

export interface PersistedState {
  difficulty: Difficulty;
  totalCredits: number;
  gamesPlayed: number;
  best: Record<Difficulty, ModeBest>;
  resume: ResumeSnapshot | null;
}

function emptyBest(): Record<Difficulty, ModeBest> {
  const blank: ModeBest = { bestScore: 0, bestMoves: null, bestTimeSec: null, stars: 0 };
  return { easy: { ...blank }, medium: { ...blank }, hard: { ...blank } };
}

function emptyState(): PersistedState {
  return {
    difficulty: "easy",
    totalCredits: 0,
    gamesPlayed: 0,
    best: emptyBest(),
    resume: null,
  };
}

export function loadState(): PersistedState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const best = emptyBest();
    if (parsed.best) {
      (Object.keys(best) as Difficulty[]).forEach((d) => {
        const b = parsed.best?.[d];
        if (b) best[d] = { ...best[d], ...b };
      });
    }
    return {
      difficulty: parsed.difficulty ?? "easy",
      totalCredits: parsed.totalCredits ?? 0,
      gamesPlayed: parsed.gamesPlayed ?? 0,
      best,
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
    /* storage unavailable — ignore */
  }
}
