/**
 * HeartStamp integration layer
 * -----------------------------
 * Host-app reward callbacks + localStorage persistence. While a card image is
 * generating, the game reports score / milestones / round-end so the host can
 * grant credits. Defaults log to the console when no host is present.
 */

import { Board, Mode, MAX_LEVEL } from "./game";

export interface RoundSummary {
  game: "heart-merge";
  mode: Mode;
  level: number;
  highestTier: number;
  reachedTarget: boolean;
  durationSec: number;
  stars: number;
  score: number;
  creditsEarned: number;
  totalCredits: number;
  isBest: boolean;
}

export interface MilestoneEvent {
  type:
    | "combo"
    | "round-complete"
    | "perfect"
    | "level-up"
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

// Bumped to v2: shape now carries level progression + sound/mute prefs.
const STORAGE_KEY = "heart-merge.v2";
const LEGACY_KEY = "heart-merge.v1";

export interface LevelBest {
  stars: number;
  bestScore: number;
}

export interface ResumeSnapshot {
  mode: Mode;
  level: number;
  board: Board;
  score: number;
  highestTier: number;
  startedAt: number; // epoch ms
}

export interface PersistedState {
  mode: Mode;
  level: number; // currently selected level
  unlocked: number; // highest level unlocked (>= 1)
  totalCredits: number;
  gamesPlayed: number;
  muted: boolean;
  levelBest: Record<number, LevelBest>;
  resume: ResumeSnapshot | null;
}

function emptyState(): PersistedState {
  return {
    mode: "cozy",
    level: 1,
    unlocked: 1,
    totalCredits: 0,
    gamesPlayed: 0,
    muted: false,
    levelBest: {},
    resume: null,
  };
}

export function loadState(): PersistedState {
  if (typeof window === "undefined") return emptyState();
  const base = emptyState();
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    // Safe migration: if v2 is missing but a v1 blob exists, carry credits over.
    if (!raw) {
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        try {
          const old = JSON.parse(legacy) as { totalCredits?: number; gamesPlayed?: number };
          base.totalCredits = old.totalCredits ?? 0;
          base.gamesPlayed = old.gamesPlayed ?? 0;
        } catch {
          /* ignore malformed legacy */
        }
      }
      return base;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const levelBest: Record<number, LevelBest> = {};
    if (parsed.levelBest && typeof parsed.levelBest === "object") {
      for (const [k, v] of Object.entries(parsed.levelBest)) {
        const lvl = Number(k);
        if (lvl >= 1 && v) levelBest[lvl] = { stars: v.stars ?? 0, bestScore: v.bestScore ?? 0 };
      }
    }
    const unlocked = Math.min(Math.max(parsed.unlocked ?? 1, 1), MAX_LEVEL);
    return {
      mode: parsed.mode ?? "cozy",
      level: Math.min(Math.max(parsed.level ?? 1, 1), unlocked),
      unlocked,
      totalCredits: parsed.totalCredits ?? 0,
      gamesPlayed: parsed.gamesPlayed ?? 0,
      muted: parsed.muted ?? false,
      levelBest,
      resume: parsed.resume ?? null,
    };
  } catch {
    return base;
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
