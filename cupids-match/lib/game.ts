/**
 * Cupid's Match — core match-3 logic
 * -----------------------------------
 * Swap two adjacent love-icons to make lines of 3+. Matches clear, tiles above
 * fall, and fresh icons drop from the top with cascading chain reactions. A
 * round is a moves-limited goal: reach the target score within the move budget.
 *
 * All functions here are pure and deterministic given their RNG argument, so the
 * board logic stays testable and free of render-time randomness.
 */

export type Difficulty = "sweetheart" | "crush" | "heartbreaker";

export interface DifficultyDef {
  key: Difficulty;
  label: string;
  emoji: string;
  blurb: string;
  size: number; // square grid (size × size)
  icons: number; // distinct icon count in play
  moves: number; // move budget
  goal: number; // target score to win
  payout: number; // credit/score multiplier — harder modes pay more
}

export const DIFFICULTIES: Record<Difficulty, DifficultyDef> = {
  sweetheart: {
    key: "sweetheart",
    label: "Sweetheart",
    emoji: "💕",
    blurb: "7×7 · 5 icons · easy goal",
    size: 7,
    icons: 5,
    moves: 25,
    goal: 1200,
    payout: 1,
  },
  crush: {
    key: "crush",
    label: "Crush",
    emoji: "💘",
    blurb: "7×7 · 6 icons · steady",
    size: 7,
    icons: 6,
    moves: 22,
    goal: 1800,
    payout: 1.4,
  },
  heartbreaker: {
    key: "heartbreaker",
    label: "Heartbreaker",
    emoji: "💔",
    blurb: "8×8 · 6 icons · tight",
    size: 8,
    icons: 6,
    moves: 20,
    goal: 2600,
    payout: 1.9,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["sweetheart", "crush", "heartbreaker"];

/* ------------------------------ levels ------------------------------------ */

/**
 * A LevelDef is a concrete, playable challenge: a grid size, icon count, move
 * budget and score goal. Levels ramp difficulty smoothly across the whole curve
 * (1..LEVEL_COUNT). The classic Difficulty modes are kept as labels and map onto
 * bands of the level curve so RoundSummary / best-per-mode keep working.
 */
export interface LevelDef {
  level: number; // 1-based
  size: number;
  icons: number;
  moves: number;
  goal: number;
  difficulty: Difficulty; // which band this level belongs to (for payout/labelling)
}

export const LEVEL_COUNT = 12;

/** Which difficulty band a given level number belongs to. */
export function bandFor(level: number): Difficulty {
  if (level <= 4) return "sweetheart";
  if (level <= 8) return "crush";
  return "heartbreaker";
}

/**
 * Deterministic level curve. Grid grows 6→7→8, icon variety grows 4→6, the
 * move budget tightens and the goal climbs each level.
 */
export function levelDef(level: number): LevelDef {
  const l = Math.max(1, Math.min(LEVEL_COUNT, level));
  // grid: 6 for L1-3, 7 for L4-8, 8 for L9+
  const size = l <= 3 ? 6 : l <= 8 ? 7 : 8;
  // icons: 4 early, 5 mid, 6 late
  const icons = l <= 2 ? 4 : l <= 6 ? 5 : 6;
  // moves: start generous, tighten gently, never below 16
  const moves = Math.max(16, 28 - l);
  // goal: smooth climb
  const goal = 700 + (l - 1) * 320 + Math.floor((l - 1) * (l - 1) * 28);
  return { level: l, size, icons, moves, goal, difficulty: bandFor(l) };
}

export const LEVELS: LevelDef[] = Array.from({ length: LEVEL_COUNT }, (_, i) => levelDef(i + 1));

/** Payout multiplier for a level (used for credits / final score scaling). */
export function payoutForLevel(level: number): number {
  return DIFFICULTIES[bandFor(level)].payout;
}

/** HeartStamp-flavoured icon set (index 0..5 used by difficulty.icons). */
export const ICONS: { char: string; name: string; img: string }[] = [
  { char: "💖", name: "sparkling heart", img: "/fluent-icons/sparkle-heart.svg" },
  { char: "🌹", name: "rose", img: "/fluent-icons/rose.svg" },
  { char: "💌", name: "love letter", img: "/fluent-icons/love-letter.svg" },
  { char: "🍫", name: "chocolate", img: "/fluent-icons/chocolate.svg" },
  { char: "🎀", name: "ribbon", img: "/fluent-icons/ribbon.svg" },
  { char: "💍", name: "ring", img: "/fluent-icons/ring.svg" },
];

/** A board is a flat array of icon indices, row-major, length size*size. */
export type Board = number[];

export interface Pos {
  r: number;
  c: number;
}

/* ------------------------------ helpers ----------------------------------- */

export function idx(size: number, r: number, c: number): number {
  return r * size + c;
}

function randIcon(iconCount: number, rng: () => number): number {
  return Math.floor(rng() * iconCount);
}

/** Would placing `icon` at (r,c) complete a run of 3 with already-filled cells? */
function makesRun(board: Board, size: number, r: number, c: number, icon: number): boolean {
  // horizontal: two to the left already equal icon
  if (c >= 2 && board[idx(size, r, c - 1)] === icon && board[idx(size, r, c - 2)] === icon) {
    return true;
  }
  // vertical: two above already equal icon
  if (r >= 2 && board[idx(size, r - 1, c)] === icon && board[idx(size, r - 2, c)] === icon) {
    return true;
  }
  return false;
}

/* ------------------------------ board build ------------------------------- */

/**
 * Build a board with NO pre-existing matches and at least one valid move.
 * Re-rolls any tile that would complete a line; reshuffles if no move exists.
 */
export function makeBoard(d: Difficulty, rng: () => number = Math.random): Board {
  const def = DIFFICULTIES[d];
  return makeBoardSized(def.size, def.icons, rng);
}

/** Build a match-free board with a valid move for an arbitrary size/icon count. */
export function makeBoardSized(
  size: number,
  icons: number,
  rng: () => number = Math.random
): Board {
  for (let attempt = 0; attempt < 60; attempt++) {
    const board: Board = new Array(size * size).fill(-1);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        let icon = randIcon(icons, rng);
        // Avoid creating an immediate run; try the other icons in turn.
        let guard = 0;
        while (makesRun(board, size, r, c, icon) && guard < icons * 3) {
          icon = randIcon(icons, rng);
          guard++;
        }
        board[idx(size, r, c)] = icon;
      }
    }
    if (findMatches(board, size).size === 0 && hasAnyValidMove(board, size, icons)) {
      return board;
    }
  }

  // Fallback (extremely unlikely): a guaranteed match-free striped board.
  const board: Board = new Array(size * size).fill(0);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      board[idx(size, r, c)] = (r + c) % icons;
    }
  }
  return board;
}

/* ------------------------------ matching ---------------------------------- */

/** All cell indices that belong to a horizontal/vertical run of length >= 3. */
export function findMatches(board: Board, size: number): Set<number> {
  const cleared = new Set<number>();

  // horizontal runs
  for (let r = 0; r < size; r++) {
    let runStart = 0;
    for (let c = 1; c <= size; c++) {
      const same =
        c < size && board[idx(size, r, c)] === board[idx(size, r, runStart)] && board[idx(size, r, c)] >= 0;
      if (!same) {
        if (c - runStart >= 3) {
          for (let k = runStart; k < c; k++) cleared.add(idx(size, r, k));
        }
        runStart = c;
      }
    }
  }

  // vertical runs
  for (let c = 0; c < size; c++) {
    let runStart = 0;
    for (let r = 1; r <= size; r++) {
      const same =
        r < size && board[idx(size, r, c)] === board[idx(size, runStart, c)] && board[idx(size, r, c)] >= 0;
      if (!same) {
        if (r - runStart >= 3) {
          for (let k = runStart; k < r; k++) cleared.add(idx(size, k, c));
        }
        runStart = r;
      }
    }
  }

  return cleared;
}

/** Group cleared indices into runs to award size bonuses (4+/5+). */
function matchRuns(board: Board, size: number): number[][] {
  const runs: number[][] = [];

  for (let r = 0; r < size; r++) {
    let start = 0;
    for (let c = 1; c <= size; c++) {
      const same = c < size && board[idx(size, r, c)] === board[idx(size, r, start)] && board[idx(size, r, c)] >= 0;
      if (!same) {
        if (c - start >= 3) {
          const run: number[] = [];
          for (let k = start; k < c; k++) run.push(idx(size, r, k));
          runs.push(run);
        }
        start = c;
      }
    }
  }
  for (let c = 0; c < size; c++) {
    let start = 0;
    for (let r = 1; r <= size; r++) {
      const same = r < size && board[idx(size, r, c)] === board[idx(size, start, c)] && board[idx(size, r, c)] >= 0;
      if (!same) {
        if (r - start >= 3) {
          const run: number[] = [];
          for (let k = start; k < r; k++) run.push(idx(size, k, c));
          runs.push(run);
        }
        start = r;
      }
    }
  }
  return runs;
}

/* ------------------------- gravity + refill ------------------------------- */

/**
 * Drop tiles into the holes left by `cleared` (marked -1 here), then refill the
 * tops of columns with fresh icons. Mutates and returns a new board.
 */
export function applyGravityAndRefill(
  board: Board,
  size: number,
  iconCount: number,
  rng: () => number = Math.random
): Board {
  const next = board.slice();
  for (let c = 0; c < size; c++) {
    // collect surviving icons bottom-up
    const column: number[] = [];
    for (let r = size - 1; r >= 0; r--) {
      const v = next[idx(size, r, c)];
      if (v >= 0) column.push(v);
    }
    // write them back from the bottom
    let writeR = size - 1;
    for (const v of column) {
      next[idx(size, writeR, c)] = v;
      writeR--;
    }
    // refill the rest from the top with fresh icons
    for (let r = writeR; r >= 0; r--) {
      next[idx(size, r, c)] = randIcon(iconCount, rng);
    }
  }
  return next;
}

/* ------------------------------ scoring ----------------------------------- */

/** Points for one run, given its length and the current cascade multiplier. */
export function runScore(runLength: number, cascade: number): number {
  // base 30 per tile, with juicy bonuses for long runs
  let pts = runLength * 30;
  if (runLength === 4) pts += 60;
  else if (runLength >= 5) pts += 150;
  return Math.round(pts * cascade);
}

export interface ResolveResult {
  board: Board;
  scoreGained: number;
  clearedTiles: number;
  cascades: number; // number of cascade steps that produced matches
  bigMatch: boolean; // any run of length >= 4 occurred
}

/**
 * Resolve the board: repeatedly clear matches, apply gravity/refill, and keep
 * going until no matches remain. Score accumulates with a rising cascade
 * multiplier. Assumes the board may already contain matches (post-swap).
 */
export function resolveBoard(
  board: Board,
  size: number,
  iconCount: number,
  rng: () => number = Math.random
): ResolveResult {
  let current = board.slice();
  let scoreGained = 0;
  let clearedTiles = 0;
  let cascades = 0;
  let bigMatch = false;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const runs = matchRuns(current, size);
    if (runs.length === 0) break;

    cascades++;
    const cascadeMult = 1 + (cascades - 1) * 0.5; // 1, 1.5, 2, 2.5 ...

    const toClear = new Set<number>();
    for (const run of runs) {
      if (run.length >= 4) bigMatch = true;
      scoreGained += runScore(run.length, cascadeMult);
      for (const i of run) toClear.add(i);
    }
    clearedTiles += toClear.size;

    for (const i of toClear) current[i] = -1;
    current = applyGravityAndRefill(current, size, iconCount, rng);
  }

  return { board: current, scoreGained, clearedTiles, cascades, bigMatch };
}

/* ------------------------------ swapping ---------------------------------- */

export function areAdjacent(size: number, a: number, b: number): boolean {
  const ar = Math.floor(a / size);
  const ac = a % size;
  const br = Math.floor(b / size);
  const bc = b % size;
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
}

function swapped(board: Board, a: number, b: number): Board {
  const next = board.slice();
  const t = next[a];
  next[a] = next[b];
  next[b] = t;
  return next;
}

/**
 * Try swapping two adjacent cells. Returns the swapped board and whether it
 * produced any match. Caller decides whether to commit (resolve) or revert.
 */
export function trySwap(
  board: Board,
  size: number,
  a: number,
  b: number
): { board: Board; matched: boolean } {
  if (!areAdjacent(size, a, b)) return { board, matched: false };
  const next = swapped(board, a, b);
  const matched = findMatches(next, size).size > 0;
  return { board: next, matched };
}

/** Is there any adjacent swap that would create a match? */
export function hasAnyValidMove(board: Board, size: number, iconCount: number): boolean {
  void iconCount;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const a = idx(size, r, c);
      // swap right
      if (c + 1 < size) {
        const b = idx(size, r, c + 1);
        const t = swapped(board, a, b);
        if (findMatches(t, size).size > 0) return true;
      }
      // swap down
      if (r + 1 < size) {
        const b = idx(size, r + 1, c);
        const t = swapped(board, a, b);
        if (findMatches(t, size).size > 0) return true;
      }
    }
  }
  return false;
}

/* ----------------------------- round scoring ------------------------------ */

/** 1–3 stars: based on how far past the goal you reach with leftover moves. */
export function starsFor(d: Difficulty, score: number, movesLeft: number): number {
  const def = DIFFICULTIES[d];
  if (score < def.goal) return 0; // did not win
  if (score >= def.goal * 1.5 || movesLeft >= Math.ceil(def.moves * 0.3)) return 3;
  if (score >= def.goal * 1.2 || movesLeft >= 2) return 2;
  return 1;
}

/** 1–3 stars for a concrete level (goal/moves come from the LevelDef). */
export function starsForLevel(def: LevelDef, score: number, movesLeft: number): number {
  if (score < def.goal) return 0;
  if (score >= def.goal * 1.5 || movesLeft >= Math.ceil(def.moves * 0.3)) return 3;
  if (score >= def.goal * 1.2 || movesLeft >= 2) return 2;
  return 1;
}

/** Final score with the mode payout multiplier applied. */
export function scoreFor(d: Difficulty, rawScore: number): number {
  const def = DIFFICULTIES[d];
  return Math.round(rawScore * def.payout);
}

/** Final score with the level's band payout applied. */
export function scoreForLevel(level: number, rawScore: number): number {
  return Math.round(rawScore * payoutForLevel(level));
}

export function creditsFor(score: number, stars: number): number {
  return Math.round(score / 80) + (stars === 3 ? 8 : stars === 2 ? 4 : stars === 1 ? 1 : 0);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
