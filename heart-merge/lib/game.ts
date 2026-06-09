/**
 * Heart Merge — core swipe-merge logic
 * ------------------------------------
 * A 2048-style puzzle. Identical love-tokens collide and merge into the next
 * romance tier ("spark" → "crush" → ... → "the ring" → "big day"). Difficulty
 * modes set the grid feel; a LEVEL curve sets an ascending target tier and any
 * starting clutter, ramping toward 🌹 Rose → 💍 Ring → 🎂 Big Day → 💖 Forever.
 *
 * All randomness (tile spawning) lives in spawnTile / spawnRandom, only ever
 * called from event handlers — never during render — so SSR markup stays stable.
 */

export type Mode = "cozy" | "sweet" | "spicy";

export interface ModeDef {
  key: Mode;
  label: string;
  emoji: string;
  blurb: string;
  size: number; // grid is size × size
  payout: number; // score multiplier — spicier modes pay more
}

/**
 * Modes set the board grid + feel. The LEVEL sets the target tier ramp, so the
 * two compose: pick a cozy/sweet/spicy feel, then climb the level ladder.
 */
export const MODES: Record<Mode, ModeDef> = {
  cozy: {
    key: "cozy",
    label: "Cozy",
    emoji: "🫧",
    blurb: "5×5 · roomy & gentle",
    size: 5,
    payout: 1,
  },
  sweet: {
    key: "sweet",
    label: "Sweet",
    emoji: "💗",
    blurb: "4×4 · the classic",
    size: 4,
    payout: 1.35,
  },
  spicy: {
    key: "spicy",
    label: "Spicy",
    emoji: "🌶️",
    blurb: "4×4 · tight & fast",
    size: 4,
    payout: 1.8,
  },
};

export const MODE_ORDER: Mode[] = ["cozy", "sweet", "spicy"];

/**
 * Romance progression. Index 0 is unused (empty cell = 0); tiers start at 1.
 * Each merge of two tier-N tiles produces one tier-(N+1) tile.
 */
export interface Tier {
  tier: number;
  emoji: string;
  img: string;
  name: string;
}

export const TIERS: Tier[] = [
  { tier: 0, emoji: "", img: "", name: "" },
  { tier: 1, emoji: "✨", img: "/fluent-icons/sparkles.svg", name: "Spark" },
  { tier: 2, emoji: "💗", img: "/fluent-icons/heart.svg", name: "Crush" },
  { tier: 3, emoji: "💞", img: "/fluent-icons/sparkle-heart.svg", name: "Flutter" },
  { tier: 4, emoji: "💌", img: "/fluent-icons/love-letter.svg", name: "Love note" },
  { tier: 5, emoji: "🌹", img: "/fluent-icons/rose.svg", name: "Rose" },
  { tier: 6, emoji: "💐", img: "/fluent-icons/bouquet.svg", name: "Bouquet" },
  { tier: 7, emoji: "🍫", img: "/fluent-icons/chocolate.svg", name: "Sweets" },
  { tier: 8, emoji: "🎁", img: "/fluent-icons/gift.svg", name: "Gift" },
  { tier: 9, emoji: "💍", img: "/fluent-icons/ring.svg", name: "The Ring" },
  { tier: 10, emoji: "🎂", img: "/fluent-icons/cake.svg", name: "Big Day" },
  { tier: 11, emoji: "👰", img: "/fluent-icons/ribbon.svg", name: "Vows" },
  { tier: 12, emoji: "💖", img: "/fluent-icons/sparkle-heart.svg", name: "Forever" },
];

export const MAX_TIER = 12;

export function tierInfo(tier: number): Tier {
  return TIERS[tier] ?? TIERS[MAX_TIER];
}

/* ------------------------------- levels ----------------------------------- */

export interface LevelDef {
  level: number; // 1-based
  target: number; // tier you must reach to clear the level
  clutter: number; // extra low tiles pre-seeded onto the board
  blurb: string;
}

/**
 * The level curve. Early levels target 🌹 Rose (tier 5); the ramp climbs to
 * 💍 Ring (9), 🎂 Big Day (10) and finally 💖 Forever (12), adding a little
 * starting clutter as it goes so later boards feel busier from the first move.
 */
export const LEVELS: LevelDef[] = [
  { level: 1, target: 4, clutter: 0, blurb: "Reach 💌 Love note" },
  { level: 2, target: 5, clutter: 0, blurb: "Reach 🌹 Rose" },
  { level: 3, target: 6, clutter: 1, blurb: "Reach 💐 Bouquet" },
  { level: 4, target: 7, clutter: 1, blurb: "Reach 🍫 Sweets" },
  { level: 5, target: 8, clutter: 2, blurb: "Reach 🎁 Gift" },
  { level: 6, target: 9, clutter: 2, blurb: "Reach 💍 The Ring" },
  { level: 7, target: 10, clutter: 3, blurb: "Reach 🎂 Big Day" },
  { level: 8, target: 11, clutter: 3, blurb: "Reach 👰 Vows" },
  { level: 9, target: 12, clutter: 4, blurb: "Reach 💖 Forever" },
];

export const MAX_LEVEL = LEVELS.length;

export function levelInfo(level: number): LevelDef {
  return LEVELS[Math.min(Math.max(level, 1), MAX_LEVEL) - 1];
}

/** A board cell holds 0 (empty) or a tier number (1..MAX_TIER). */
export type Board = number[][];

export type Direction = "up" | "down" | "left" | "right";

export function emptyBoard(size: number): Board {
  return Array.from({ length: size }, () => Array<number>(size).fill(0));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

/** List of [r, c] coordinates that are currently empty. */
export function emptyCells(board: Board): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

/** Spawn a tile (90% tier 1, 10% tier 2) into a given empty cell. Pure-ish. */
export function spawnAt(board: Board, r: number, c: number, rng: () => number = Math.random): Board {
  const next = cloneBoard(board);
  next[r][c] = rng() < 0.9 ? 1 : 2;
  return next;
}

/** Spawn a tile in a random empty cell. Returns the same board if full. */
export function spawnRandom(board: Board, rng: () => number = Math.random): Board {
  const cells = emptyCells(board);
  if (cells.length === 0) return board;
  const [r, c] = cells[Math.floor(rng() * cells.length)];
  return spawnAt(board, r, c, rng);
}

/**
 * Build a fresh starting board with two tiles plus optional clutter of extra
 * low tiles (tier 1) from the level curve. Call from effects/handlers only.
 */
export function newBoard(size: number, clutter = 0, rng: () => number = Math.random): Board {
  let b = emptyBoard(size);
  b = spawnRandom(b, rng);
  b = spawnRandom(b, rng);
  for (let i = 0; i < clutter; i++) {
    const cells = emptyCells(b);
    if (cells.length === 0) break;
    const [r, c] = cells[Math.floor(rng() * cells.length)];
    b = cloneBoard(b);
    b[r][c] = 1;
  }
  return b;
}

/* ------------------------------ movement ---------------------------------- */

export interface MoveResult {
  board: Board;
  moved: boolean;
  gained: number; // raw merge points (sum of resulting tiers' values)
  merges: number; // number of merges this move
  highestMerge: number; // highest tier produced by a merge (0 if none)
}

/** Collapse a single row to the left, merging equal neighbours once each. */
function collapseRow(row: number[]): { row: number[]; gained: number; merges: number; highestMerge: number } {
  const nums = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  let merges = 0;
  let highestMerge = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const merged = nums[i] + 1;
      out.push(merged);
      gained += tierValue(merged);
      merges += 1;
      if (merged > highestMerge) highestMerge = merged;
      i++; // skip the consumed neighbour
    } else {
      out.push(nums[i]);
    }
  }
  while (out.length < row.length) out.push(0);
  return { row: out, gained, merges, highestMerge };
}

/** Tier value used for scoring — grows with tier (2,4,8,...) like 2048. */
export function tierValue(tier: number): number {
  return tier <= 0 ? 0 : Math.pow(2, tier);
}

function transpose(board: Board): Board {
  const n = board.length;
  const out = emptyBoard(n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out[c][r] = board[r][c];
  return out;
}

function reverseRows(board: Board): Board {
  return board.map((row) => row.slice().reverse());
}

/** Apply a move in a direction. Always normalises to "left", then maps back. */
export function move(board: Board, dir: Direction): MoveResult {
  let work = cloneBoard(board);
  if (dir === "up") work = transpose(work);
  else if (dir === "down") work = reverseRows(transpose(work));
  else if (dir === "right") work = reverseRows(work);

  let gained = 0;
  let merges = 0;
  let highestMerge = 0;
  const collapsed = work.map((row) => {
    const res = collapseRow(row);
    gained += res.gained;
    merges += res.merges;
    if (res.highestMerge > highestMerge) highestMerge = res.highestMerge;
    return res.row;
  });

  let result = collapsed;
  if (dir === "up") result = transpose(result);
  else if (dir === "down") result = transpose(reverseRows(result));
  else if (dir === "right") result = reverseRows(result);

  const moved = !boardsEqual(board, result);
  return { board: result, moved, gained, merges, highestMerge };
}

export function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

/** Can the board move in the given direction (would it change)? */
export function canMove(board: Board, dir: Direction): boolean {
  return move(board, dir).moved;
}

const ALL_DIRS: Direction[] = ["up", "down", "left", "right"];

/** Game over when there are no empty cells and no merges possible. */
export function isGameOver(board: Board): boolean {
  if (emptyCells(board).length > 0) return false;
  return ALL_DIRS.every((d) => !canMove(board, d));
}

/* ------------------------- positioned tile tracking ----------------------- */

/**
 * A tile with a stable identity so the UI can animate it sliding from its old
 * cell to its new cell. `merged` marks a tile that just formed from a merge
 * (used for the merge bounce); `spawned` marks a freshly added tile (spawn pop).
 */
export interface PosTile {
  id: number;
  tier: number;
  r: number; // current (destination) row
  c: number; // current (destination) col
  fromR: number; // origin row (for slide animation)
  fromC: number; // origin col
  merged: boolean;
  spawned: boolean;
}

let TILE_SEQ = 1;
function nextId(): number {
  return TILE_SEQ++;
}

/** Snapshot a board into positioned tiles, each at rest (from == to). */
export function tilesFromBoard(board: Board): PosTile[] {
  const out: PosTile[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const v = board[r][c];
      if (v > 0) out.push({ id: nextId(), tier: v, r, c, fromR: r, fromC: c, merged: false, spawned: false });
    }
  }
  return out;
}

/**
 * Collapse one ordered line (index 0 = the wall tiles slide toward). Returns a
 * list of "slots": each slot is the surviving tile that ends up at that
 * position, plus an optional consumed tile (the one it merged with) that should
 * slide into the same position before vanishing.
 */
interface Slot {
  survivor: PosTile;
  consumed?: PosTile; // a tile that merged into the survivor
  newTier: number;
  isMerge: boolean;
}

function collapseLine(line: PosTile[]): { slots: Slot[]; gained: number; merges: number; highestMerge: number } {
  const present = line.filter((t) => t.tier > 0);
  const slots: Slot[] = [];
  let gained = 0;
  let merges = 0;
  let highestMerge = 0;
  for (let i = 0; i < present.length; i++) {
    if (i + 1 < present.length && present[i].tier === present[i + 1].tier) {
      const newTier = present[i].tier + 1;
      slots.push({ survivor: present[i], consumed: present[i + 1], newTier, isMerge: true });
      gained += tierValue(newTier);
      merges += 1;
      if (newTier > highestMerge) highestMerge = newTier;
      i++; // skip the consumed neighbour
    } else {
      slots.push({ survivor: present[i], newTier: present[i].tier, isMerge: false });
    }
  }
  return { slots, gained, merges, highestMerge };
}

export interface PosMoveResult {
  tiles: PosTile[]; // tiles after the move (animating to new positions)
  board: Board; // resulting numeric board
  moved: boolean;
  gained: number;
  merges: number;
  highestMerge: number;
}

/**
 * Move a set of positioned tiles in a direction, preserving identity so the UI
 * can slide each tile from its old cell to its new cell. Returns the new tile
 * set and the equivalent numeric board.
 */
export function movePos(prev: PosTile[], size: number, dir: Direction): PosMoveResult {
  const horizontal = dir === "left" || dir === "right";
  const toward0 = dir === "left" || dir === "up"; // collapse toward index 0
  const lines: PosTile[][] = Array.from({ length: size }, () => []);

  for (const t of prev) {
    const lineIdx = horizontal ? t.r : t.c;
    lines[lineIdx].push(t);
  }

  const outTiles: PosTile[] = [];
  let gained = 0;
  let merges = 0;
  let highestMerge = 0;

  for (let li = 0; li < size; li++) {
    const line = lines[li].slice();
    line.sort((a, b) => {
      const av = horizontal ? a.c : a.r;
      const bv = horizontal ? b.c : b.r;
      return toward0 ? av - bv : bv - av;
    });
    const { slots, gained: g, merges: m, highestMerge: hm } = collapseLine(line);
    gained += g;
    merges += m;
    if (hm > highestMerge) highestMerge = hm;

    slots.forEach((slot, idx) => {
      const axisPos = toward0 ? idx : size - 1 - idx;
      const r = horizontal ? li : axisPos;
      const c = horizontal ? axisPos : li;
      // surviving tile (keeps its id; animates to new cell)
      outTiles.push({
        id: slot.survivor.id,
        tier: slot.newTier,
        r,
        c,
        fromR: slot.survivor.r,
        fromC: slot.survivor.c,
        merged: slot.isMerge,
        spawned: false,
      });
      // consumed tile slides under the survivor, then is removed next frame
      if (slot.consumed) {
        outTiles.push({
          id: slot.consumed.id,
          tier: slot.consumed.tier,
          r,
          c,
          fromR: slot.consumed.r,
          fromC: slot.consumed.c,
          merged: false,
          spawned: false,
        });
      }
    });
  }

  const board = emptyBoard(size);
  for (const t of outTiles) {
    if (t.tier > board[t.r][t.c]) board[t.r][t.c] = t.tier;
  }

  const movedTile = outTiles.some((t) => t.r !== t.fromR || t.c !== t.fromC) || merges > 0;
  return { tiles: outTiles, board, moved: movedTile, gained, merges, highestMerge };
}

/** Add a spawned tile to a tile list at an empty cell, returning a new list. */
export function spawnPosTile(tiles: PosTile[], size: number, rng: () => number = Math.random): PosTile[] {
  const occupied = new Set(tiles.map((t) => t.r * size + t.c));
  const empties: [number, number][] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!occupied.has(r * size + c)) empties.push([r, c]);
  if (empties.length === 0) return tiles;
  const [r, c] = empties[Math.floor(rng() * empties.length)];
  const tier = rng() < 0.9 ? 1 : 2;
  return [...tiles, { id: nextId(), tier, r, c, fromR: r, fromC: c, merged: false, spawned: true }];
}

/** Highest tier currently present on the board. */
export function highestTier(board: Board): number {
  let max = 0;
  for (const row of board) for (const v of row) if (v > max) max = v;
  return max;
}

/* ------------------------------- scoring ---------------------------------- */

/** Apply the mode multiplier to raw merge points. */
export function scoreFor(mode: Mode, rawPoints: number): number {
  return Math.round(rawPoints * MODES[mode].payout);
}

/** 1–3 stars based on highest tier reached vs the level target. */
export function starsForLevel(level: number, reachedTier: number): number {
  const target = levelInfo(level).target;
  if (reachedTier >= target + 1) return 3; // beat the target by a tier
  if (reachedTier >= target) return 2; // hit the target
  if (reachedTier >= target - 1) return 1; // one short
  return 0;
}

export function creditsFor(score: number, stars: number): number {
  return Math.round(score / 90) + (stars === 3 ? 6 : stars === 2 ? 3 : 0);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
