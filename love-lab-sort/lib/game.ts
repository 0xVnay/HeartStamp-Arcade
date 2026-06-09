/**
 * Love Lab Sort — core puzzle logic
 * ---------------------------------
 * A "color sort" (a.k.a. water/ball sort) puzzle reskinned as a love-potion lab.
 * Each beaker holds a stack of colored potion segments. Pour the top run of one
 * color into another beaker when the destination is empty or its top matches.
 * Win by gathering every color into its own beaker.
 *
 * Beakers are stored bottom -> top (index 0 is the bottom segment).
 */

export const CAPACITY = 4;

/** Potion palette — index === color id. Themed, warm, distinguishable on mobile. */
export const POTIONS: { name: string; from: string; to: string; glow: string }[] = [
  { name: "Rose", from: "#FF8FB1", to: "#E8487E", glow: "#FF6F91" },
  { name: "Lavender", from: "#C9A7F5", to: "#8E5BD6", glow: "#A678EC" },
  { name: "Honey", from: "#FFD27A", to: "#F2A93B", glow: "#FFC25C" },
  { name: "Mint", from: "#9BE8C9", to: "#3FBF8F", glow: "#5FD8A8" },
  { name: "Sky", from: "#A7D8FF", to: "#4FA6F0", glow: "#79C2FF" },
  { name: "Coral", from: "#FFB08F", to: "#F26B3F", glow: "#FF8F66" },
  { name: "Berry", from: "#F58FC9", to: "#C23E91", glow: "#E061AD" },
  { name: "Citrus", from: "#E8F58F", to: "#B5C23E", glow: "#D4E061" },
];

export type Beakers = number[][];

/* ------------------------------ difficulty -------------------------------- */

export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyDef {
  key: Difficulty;
  label: string;
  emoji: string;
  blurb: string;
  /** Colors in level 1 of this mode. */
  startColors: number;
  /** Hard cap on colors as levels ramp. */
  maxColors: number;
  /** Add one color every N levels. */
  ramp: number;
  /** Spare (empty) beakers — kept at 2 for reliable, instant solvable generation. */
  emptyBeakers: number;
  /** Scoring multiplier — harder modes pay out more. */
  payout: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyDef> = {
  easy: {
    key: "easy",
    label: "Easy",
    emoji: "🟢",
    blurb: "Gentle & relaxing",
    startColors: 3,
    maxColors: 5,
    ramp: 5,
    emptyBeakers: 2,
    payout: 1,
  },
  medium: {
    key: "medium",
    label: "Medium",
    emoji: "🟡",
    blurb: "A proper puzzle",
    startColors: 4,
    maxColors: 6,
    ramp: 4,
    emptyBeakers: 2,
    payout: 1.35,
  },
  hard: {
    key: "hard",
    label: "Hard",
    emoji: "🔴",
    blurb: "For potion masters",
    startColors: 5,
    maxColors: 7,
    ramp: 3,
    emptyBeakers: 2,
    payout: 1.75,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard"];

export interface LevelConfig {
  level: number;
  difficulty: Difficulty;
  colors: number;
  emptyBeakers: number;
}

/** Difficulty curve: each mode sets a starting color count, ramp speed, and cap. */
export function levelConfig(level: number, difficulty: Difficulty): LevelConfig {
  const def = DIFFICULTIES[difficulty];
  const colors = Math.min(def.startColors + Math.floor((level - 1) / def.ramp), def.maxColors);
  return { level, difficulty, colors, emptyBeakers: def.emptyBeakers };
}

/* --------------------------- pour / win rules ----------------------------- */

export function topColor(beaker: number[]): number | null {
  return beaker.length ? beaker[beaker.length - 1] : null;
}

/** Number of same-colored segments at the top of a beaker. */
export function topRun(beaker: number[]): number {
  if (!beaker.length) return 0;
  const c = beaker[beaker.length - 1];
  let n = 1;
  for (let i = beaker.length - 2; i >= 0 && beaker[i] === c; i--) n++;
  return n;
}

export function canPour(from: number[], to: number[]): boolean {
  if (from.length === 0) return false;
  if (to.length >= CAPACITY) return false;
  if (to.length === 0) {
    // Pouring a full single-color beaker into an empty one is a wasted move.
    return !(from.length === CAPACITY && topRun(from) === CAPACITY);
  }
  return topColor(from) === topColor(to);
}

/** Returns a new Beakers array with the pour applied. Caller must check canPour. */
export function pour(beakers: Beakers, fromIdx: number, toIdx: number): Beakers {
  const next = beakers.map((b) => b.slice());
  const from = next[fromIdx];
  const to = next[toIdx];
  const color = topColor(from)!;
  const space = CAPACITY - to.length;
  const amount = Math.min(topRun(from), space);
  for (let i = 0; i < amount; i++) {
    from.pop();
    to.push(color);
  }
  return next;
}

export function isBeakerSolved(beaker: number[]): boolean {
  if (beaker.length === 0) return true;
  if (beaker.length !== CAPACITY) return false;
  return beaker.every((c) => c === beaker[0]);
}

export function isSolved(beakers: Beakers): boolean {
  return beakers.every(isBeakerSolved);
}

/* --------------------------- level generation ----------------------------- */

/**
 * Deterministic-ish PRNG (mulberry32) so a given seed reproduces a level — handy
 * for resume and for not depending on Math.random at module init.
 */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function canonical(beakers: Beakers): string {
  return beakers
    .map((b) => b.join(","))
    .sort()
    .join("|");
}

/**
 * Solvability check via DFS with a visited set. Beakers are interchangeable, so
 * states are canonicalized (sorted) to shrink the search space. Node-capped so it
 * always terminates quickly for our level sizes.
 */
function isSolvable(start: Beakers): boolean {
  const visited = new Set<string>();
  const stack: Beakers[] = [start];
  let nodes = 0;
  const NODE_CAP = 200000;

  while (stack.length) {
    if (++nodes > NODE_CAP) return false;
    const state = stack.pop()!;
    if (isSolved(state)) return true;
    const key = canonical(state);
    if (visited.has(key)) continue;
    visited.add(key);

    for (let i = 0; i < state.length; i++) {
      for (let j = 0; j < state.length; j++) {
        if (i === j) continue;
        if (canPour(state[i], state[j])) {
          stack.push(pour(state, i, j));
        }
      }
    }
  }
  return false;
}

/**
 * Generate a solvable starting position for a level. Builds an even multiset of
 * colors, shuffles them into the filled beakers, appends empties, and verifies
 * solvability — regenerating until solvable.
 */
export function generateLevel(level: number, difficulty: Difficulty, seed?: number): Beakers {
  const { colors, emptyBeakers } = levelConfig(level, difficulty);
  const baseSeed = seed ?? level * 100003 + DIFFICULTY_ORDER.indexOf(difficulty) * 31 + 7;

  for (let attempt = 0; attempt < 200; attempt++) {
    const rng = makeRng(baseSeed + attempt * 7919);
    const pool: number[] = [];
    for (let c = 0; c < colors; c++) {
      for (let k = 0; k < CAPACITY; k++) pool.push(c);
    }
    const shuffled = shuffle(pool, rng);

    const beakers: Beakers = [];
    for (let i = 0; i < colors; i++) {
      beakers.push(shuffled.slice(i * CAPACITY, i * CAPACITY + CAPACITY));
    }
    for (let e = 0; e < emptyBeakers; e++) beakers.push([]);

    // Avoid handing the player an already-solved board.
    if (!isSolved(beakers) && isSolvable(beakers)) return beakers;
  }

  // Extremely unlikely fallback: solved-but-rotated layout (always solvable).
  const fallback: Beakers = [];
  for (let c = 0; c < colors; c++) fallback.push(Array(CAPACITY).fill(c));
  for (let e = 0; e < emptyBeakers; e++) fallback.push([]);
  return fallback;
}

/* ------------------------------- scoring ---------------------------------- */

/** Fewest moves possible is roughly (filled beakers). Reward efficiency + speed. */
export function scoreLevel(
  level: number,
  moves: number,
  durationMs: number,
  difficulty: Difficulty
): number {
  const def = DIFFICULTIES[difficulty];
  const { colors } = levelConfig(level, difficulty);
  // Hard modes get a tighter par, so sloppy play is penalised more.
  const par = colors + (difficulty === "hard" ? 1 : 2);
  const base = 500 + level * 120;
  const movePenalty = Math.max(0, moves - par) * 18;
  const speedBonus = Math.max(0, 90 - Math.floor(durationMs / 1000)) * 4;
  return Math.max(120, Math.round((base - movePenalty + speedBonus) * def.payout));
}

export function creditsFor(score: number, perfect: boolean): number {
  return Math.round(score / 50) + (perfect ? 5 : 0);
}

/** Roughly how many moves count as a "perfect" clear for this level. */
export function parMoves(level: number, difficulty: Difficulty): number {
  return levelConfig(level, difficulty).colors + 1;
}
