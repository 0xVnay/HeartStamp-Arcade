/**
 * HeartStamp integration layer
 * -----------------------------
 * Host-app reward callbacks + localStorage persistence. While a card image is
 * generating, the game reports score / milestones / round-end so the host can
 * grant credits. Defaults log to the console when no host is present.
 */

import type { Board, Difficulty } from "./game";
import { LEVEL_COUNT } from "./game";

export interface RoundSummary {
  game: "cupids-match";
  difficulty: Difficulty;
  level: number;
  movesUsed: number;
  durationSec: number;
  stars: number;
  score: number;
  goal: number;
  won: boolean;
  creditsEarned: number;
  totalCredits: number;
  isBest: boolean;
}

export interface MilestoneEvent {
  type:
    | "match"
    | "combo"
    | "level-up"
    | "round-complete"
    | "perfect"
    | "credit-threshold"
    | "best-score";
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

const STORAGE_KEY = "cupids-match.v2";
const LEGACY_KEY = "cupids-match.v1";

/** Per-level record: best raw + final score, best star rating. */
export interface LevelRecord {
  stars: number;
  bestScore: number;
  cleared: boolean;
}

export interface PersistedState {
  totalCredits: number;
  gamesPlayed: number;
  highestUnlocked: number; // highest level the player may start (1..LEVEL_COUNT)
  levels: Record<number, LevelRecord>; // keyed by level number
  resume: ResumeSnapshot | null;
  muted: boolean;
}

export interface ResumeSnapshot {
  level: number;
  board: Board;
  score: number;
  movesLeft: number;
  startedAt: number; // epoch ms
}

function emptyState(): PersistedState {
  return {
    totalCredits: 0,
    gamesPlayed: 0,
    highestUnlocked: 1,
    levels: {},
    resume: null,
    muted: false,
  };
}

export function loadState(): PersistedState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PersistedState> & { best?: unknown };
    const base = emptyState();
    const levels: Record<number, LevelRecord> = {};
    if (parsed.levels && typeof parsed.levels === "object") {
      for (const [k, v] of Object.entries(parsed.levels)) {
        const n = Number(k);
        if (!Number.isFinite(n)) continue;
        const rec = v as Partial<LevelRecord>;
        levels[n] = {
          stars: rec?.stars ?? 0,
          bestScore: rec?.bestScore ?? 0,
          cleared: rec?.cleared ?? false,
        };
      }
    }
    const highest = Math.max(
      1,
      Math.min(LEVEL_COUNT, parsed.highestUnlocked ?? 1)
    );
    // A v1 resume (keyed by difficulty, no level) is not shape-compatible; drop it.
    const resume =
      parsed.resume && typeof (parsed.resume as ResumeSnapshot).level === "number"
        ? (parsed.resume as ResumeSnapshot)
        : null;
    return {
      totalCredits: parsed.totalCredits ?? base.totalCredits,
      gamesPlayed: parsed.gamesPlayed ?? base.gamesPlayed,
      highestUnlocked: highest,
      levels,
      resume,
      muted: parsed.muted ?? false,
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
