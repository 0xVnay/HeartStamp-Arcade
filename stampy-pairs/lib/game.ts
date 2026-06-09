/**
 * Stampy Pairs — core memory-matching logic
 * ------------------------------------------
 * Flip postcards two at a time to find matching HeartStamp icons. Difficulty
 * modes set the grid size; scoring rewards few moves and quick clears with stars.
 */

export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyDef {
  key: Difficulty;
  label: string;
  emoji: string;
  blurb: string;
  cols: number;
  rows: number;
  payout: number; // score multiplier — harder modes pay more
}

export const DIFFICULTIES: Record<Difficulty, DifficultyDef> = {
  easy: { key: "easy", label: "Easy", emoji: "🟢", blurb: "6 pairs · 3×4", cols: 3, rows: 4, payout: 1 },
  medium: {
    key: "medium",
    label: "Medium",
    emoji: "🟡",
    blurb: "8 pairs · 4×4",
    cols: 4,
    rows: 4,
    payout: 1.35,
  },
  hard: {
    key: "hard",
    label: "Hard",
    emoji: "🔴",
    blurb: "12 pairs · 4×6",
    cols: 4,
    rows: 6,
    payout: 1.8,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard"];

export function pairCount(d: Difficulty): number {
  const def = DIFFICULTIES[d];
  return (def.cols * def.rows) / 2;
}

/**
 * HeartStamp-flavoured icon set (need at least `max pairs` = 12 distinct).
 * Art: Microsoft Fluent Emoji Flat, MIT licensed — bundled under /public/fluent-icons.
 * `char` is kept as an accessible/emoji fallback.
 */
export const ICONS: { char: string; name: string; img: string }[] = [
  { char: "💌", name: "love letter", img: "/fluent-icons/love-letter.svg" },
  { char: "💖", name: "sparkling heart", img: "/fluent-icons/sparkle-heart.svg" },
  { char: "🌹", name: "rose", img: "/fluent-icons/rose.svg" },
  { char: "💍", name: "ring", img: "/fluent-icons/ring.svg" },
  { char: "🎂", name: "cake", img: "/fluent-icons/cake.svg" },
  { char: "🎈", name: "balloon", img: "/fluent-icons/balloon.svg" },
  { char: "🎁", name: "gift", img: "/fluent-icons/gift.svg" },
  { char: "🧸", name: "teddy bear", img: "/fluent-icons/teddy.svg" },
  { char: "💐", name: "bouquet", img: "/fluent-icons/bouquet.svg" },
  { char: "🕊️", name: "dove", img: "/fluent-icons/dove.svg" },
  { char: "🍫", name: "chocolate", img: "/fluent-icons/chocolate.svg" },
  { char: "🎀", name: "ribbon", img: "/fluent-icons/ribbon.svg" },
  { char: "🌸", name: "blossom", img: "/fluent-icons/blossom.svg" },
  { char: "⭐", name: "star", img: "/fluent-icons/star.svg" },
  { char: "🧁", name: "cupcake", img: "/fluent-icons/cupcake.svg" },
  { char: "🍬", name: "candy", img: "/fluent-icons/candy.svg" },
];

export interface Card {
  /** Stable per-card key for React. */
  key: number;
  /** Index into ICONS — two cards share an icon to form a pair. */
  icon: number;
}

/* ------------------------------ deck build -------------------------------- */

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Build a shuffled deck for the given difficulty. */
export function buildDeck(d: Difficulty, rng: () => number = Math.random): Card[] {
  const pairs = pairCount(d);
  const chosen = shuffle(
    ICONS.map((_, i) => i),
    rng
  ).slice(0, pairs);
  const doubled = chosen.flatMap((icon) => [icon, icon]);
  const shuffled = shuffle(doubled, rng);
  return shuffled.map((icon, key) => ({ key, icon }));
}

/* ------------------------------- scoring ---------------------------------- */

/** Best-case moves equals the pair count (perfect memory). */
export function parMoves(d: Difficulty): number {
  return pairCount(d);
}

/** 1–3 stars based on how close to par the player's move count is. */
export function starsFor(d: Difficulty, moves: number): number {
  const par = parMoves(d);
  if (moves <= Math.ceil(par * 1.5)) return 3;
  if (moves <= Math.ceil(par * 2.2)) return 2;
  return 1;
}

export function scoreFor(d: Difficulty, moves: number, seconds: number): number {
  const def = DIFFICULTIES[d];
  const pairs = pairCount(d);
  const par = parMoves(d);
  const base = 600 + pairs * 120;
  const movePenalty = Math.max(0, moves - par) * 22;
  const timePenalty = Math.floor(seconds) * 4;
  const raw = base - movePenalty - timePenalty;
  return Math.max(120, Math.round(raw * def.payout));
}

export function creditsFor(score: number, stars: number): number {
  return Math.round(score / 60) + (stars === 3 ? 6 : stars === 2 ? 3 : 0);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
