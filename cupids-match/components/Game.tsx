"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Board,
  LEVELS,
  LEVEL_COUNT,
  LevelDef,
  applyGravityAndRefill,
  areAdjacent,
  bandFor,
  creditsFor,
  findMatches,
  formatTime,
  hasAnyValidMove,
  levelDef,
  makeBoardSized,
  scoreForLevel,
  starsForLevel,
} from "@/lib/game";
import {
  LevelRecord,
  PersistedState,
  ResumeSnapshot,
  getHeartStampCallbacks,
  loadState,
  saveState,
} from "@/lib/heartstamp";
import { haptic, isMuted, playSfx, setMuted } from "@/lib/sfx";
import Tile from "./Tile";
import Tutorial from "./Tutorial";
import FloatingHearts from "./FloatingHearts";
import Confetti from "./Confetti";

const LottieCelebration = dynamic(() => import("./LottieCelebration"), { ssr: false });

type Screen = "menu" | "tutorial" | "playing";

interface Result {
  won: boolean;
  stars: number;
  score: number;
  credits: number;
  movesUsed: number;
  seconds: number;
  isBest: boolean;
  level: number;
  hasNext: boolean;
}

const HINTS = [
  "Tap a tile, then tap a neighbour to swap.",
  "Line up 3+ of a kind to clear them.",
  "Cascades and 4+ matches score big bonuses.",
  "Reach the goal before your moves run out!",
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Tween a number toward `target` for a satisfying animated counter. */
function useTweenedNumber(target: number): number {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(target);
  const startRef = useRef(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(target);
      return;
    }
    fromRef.current = display;
    startRef.current = performance.now();
    const dur = 420;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(fromRef.current + (target - fromRef.current) * eased);
      setDisplay(val);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return display;
}

/**
 * Gravity that also reports how far each surviving tile fell, so Tile can play a
 * real falling animation. Mirrors applyGravityAndRefill but tracks per-cell drop
 * distance (in rows). Newly refilled cells fall from above the board.
 */
function gravityWithFalls(
  board: Board,
  size: number,
  iconCount: number,
  rng: () => number = Math.random
): { board: Board; falls: number[] } {
  const next = board.slice();
  const falls = new Array(size * size).fill(0);
  for (let c = 0; c < size; c++) {
    let writeR = size - 1;
    // walk bottom-up, compacting survivors
    for (let r = size - 1; r >= 0; r--) {
      const v = next[r * size + c];
      if (v >= 0) {
        if (writeR !== r) {
          next[writeR * size + c] = v;
          next[r * size + c] = -1;
        }
        falls[writeR * size + c] = writeR - r; // dropped this many rows
        writeR--;
      }
    }
    // refill remaining top cells; they fall in from above the board
    let spawn = 1;
    for (let r = writeR; r >= 0; r--) {
      next[r * size + c] = Math.floor(rng() * iconCount);
      falls[r * size + c] = writeR - r + spawn;
      spawn++;
    }
  }
  return { board: next, falls };
}

export default function Game() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [persist, setPersist] = useState<PersistedState | null>(null);
  const [level, setLevel] = useState(1);

  const [board, setBoard] = useState<Board>([]);
  const [falls, setFalls] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [clearing, setClearing] = useState<number[]>([]);
  const [lock, setLock] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [hintIdx, setHintIdx] = useState(0);
  const [floats, setFloats] = useState<{ id: number; text: string; big: boolean }[]>([]);
  const [combo, setCombo] = useState<{ id: number; text: string } | null>(null);
  const [muted, setMutedState] = useState(false);

  const displayScore = useTweenedNumber(score);

  const cb = useMemo(() => getHeartStampCallbacks(), []);
  const persistRef = useRef<PersistedState | null>(null);
  persistRef.current = persist;
  const levelRef = useRef(1);
  levelRef.current = level;
  const boardRef = useRef<Board>([]);
  boardRef.current = board;
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const movesRef = useRef(0);
  movesRef.current = movesLeft;
  const startedAtRef = useRef(0);
  const floatId = useRef(0);
  const comboId = useRef(0);
  const endedRef = useRef(false);

  const def: LevelDef = levelDef(level);

  /* ----------------------------- bootstrap ------------------------------- */
  useEffect(() => {
    const loaded = loadState();
    setPersist(loaded);
    setLevel(Math.min(loaded.highestUnlocked, LEVEL_COUNT));
    setMuted(loaded.muted);
    setMutedState(loaded.muted);
  }, []);

  const commit = useCallback((next: PersistedState) => {
    setPersist(next);
    saveState(next);
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      const next = !m;
      setMuted(next);
      const p = persistRef.current;
      if (p) {
        const updated = { ...p, muted: next };
        setPersist(updated);
        saveState(updated);
      }
      if (!next) playSfx("select");
      return next;
    });
  }, []);

  /* ------------------------------- timer --------------------------------- */
  useEffect(() => {
    if (screen !== "playing" || result) return;
    const id = window.setInterval(() => {
      setElapsed((Date.now() - startedAtRef.current) / 1000);
    }, 250);
    return () => window.clearInterval(id);
  }, [screen, result]);

  /* --------------------------- game lifecycle ---------------------------- */
  const beginGame = useCallback((lvl: number, snap?: ResumeSnapshot) => {
    const d = levelDef(lvl);
    setLevel(lvl);
    setBoard(snap ? snap.board : makeBoardSized(d.size, d.icons));
    setFalls([]);
    setScore(snap?.score ?? 0);
    setMovesLeft(snap?.movesLeft ?? d.moves);
    setSelected(null);
    setClearing([]);
    setLock(false);
    setResult(null);
    setFloats([]);
    setCombo(null);
    endedRef.current = false;
    startedAtRef.current = snap?.startedAt ?? Date.now();
    setElapsed((Date.now() - startedAtRef.current) / 1000);
    setScreen("playing");
  }, []);

  const startLevel = useCallback(
    (lvl: number) => {
      const p = persistRef.current;
      if (p?.resume) commit({ ...p, resume: null });
      beginGame(lvl);
    },
    [beginGame, commit]
  );

  const resume = useCallback(() => {
    const snap = persistRef.current?.resume;
    if (snap) beginGame(snap.level, snap);
  }, [beginGame]);

  /* --------------------------- persist resume ---------------------------- */
  useEffect(() => {
    if (screen !== "playing" || result || !persistRef.current || !board.length) return;
    const p = persistRef.current;
    const snap: ResumeSnapshot = {
      level,
      board,
      score,
      movesLeft,
      startedAt: startedAtRef.current,
    };
    commit({ ...p, resume: snap });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, score, movesLeft, screen, result]);

  /* ------------------------------ floats --------------------------------- */
  const pushFloat = useCallback((text: string, big = false) => {
    const id = ++floatId.current;
    setFloats((f) => [...f, { id, text, big }]);
    window.setTimeout(() => {
      setFloats((f) => f.filter((x) => x.id !== id));
    }, 1000);
  }, []);

  const showCombo = useCallback((text: string) => {
    const id = ++comboId.current;
    setCombo({ id, text });
    window.setTimeout(() => {
      setCombo((c) => (c && c.id === id ? null : c));
    }, 1100);
  }, []);

  /* ------------------------------ finish --------------------------------- */
  const finishGame = useCallback(
    (won: boolean, finalScoreRaw: number, finalMovesLeft: number) => {
      if (endedRef.current) return;
      endedRef.current = true;
      const p = persistRef.current;
      const lvl = levelRef.current;
      const d = levelDef(lvl);
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      const movesUsed = d.moves - finalMovesLeft;
      const stars = starsForLevel(d, finalScoreRaw, finalMovesLeft);
      const finalScore = scoreForLevel(lvl, finalScoreRaw);
      const credits = creditsFor(finalScore, stars);
      const prevBest = p?.levels[lvl]?.bestScore ?? 0;
      const isBest = finalScore > prevBest;
      const hasNext = lvl < LEVEL_COUNT;

      cb.onScore(finalScore);
      if (won) {
        cb.onMilestone({
          type: "level-up",
          label: `Level ${lvl} cleared`,
          value: lvl,
        });
        if (stars === 3) {
          cb.onMilestone({ type: "perfect", label: `Perfect Level ${lvl}!`, value: stars });
        }
        playSfx("level-up");
        haptic([0, 30, 40, 30, 60, 60]);
      } else {
        cb.onMilestone({ type: "round-complete", label: `Level ${lvl} — out of moves`, value: 0 });
        playSfx("lose");
        haptic(120);
      }
      cb.onRoundEnd({
        game: "cupids-match",
        difficulty: bandFor(lvl),
        level: lvl,
        movesUsed,
        durationSec: Math.round(seconds),
        stars,
        score: finalScore,
        goal: d.goal,
        won,
        creditsEarned: credits,
        totalCredits: (p?.totalCredits ?? 0) + credits,
        isBest,
      });

      if (p) {
        const newTotal = p.totalCredits + credits;
        const crossed = Math.floor(newTotal / 100) > Math.floor(p.totalCredits / 100);
        if (crossed) {
          cb.onMilestone({
            type: "credit-threshold",
            label: "Credit milestone reached",
            value: Math.floor(newTotal / 100) * 100,
          });
        }
        if (isBest && finalScore > 0) {
          cb.onMilestone({ type: "best-score", label: "New best score!", value: finalScore });
        }
        const prev: LevelRecord = p.levels[lvl] ?? { stars: 0, bestScore: 0, cleared: false };
        const newRecord: LevelRecord = {
          stars: Math.max(prev.stars, stars),
          bestScore: Math.max(prev.bestScore, finalScore),
          cleared: prev.cleared || won,
        };
        const newHighest = won
          ? Math.max(p.highestUnlocked, Math.min(LEVEL_COUNT, lvl + 1))
          : p.highestUnlocked;
        commit({
          ...p,
          totalCredits: newTotal,
          gamesPlayed: p.gamesPlayed + 1,
          highestUnlocked: newHighest,
          levels: { ...p.levels, [lvl]: newRecord },
          resume: null,
        });
      }

      setResult({ won, stars, score: finalScore, credits, movesUsed, seconds, isBest, level: lvl, hasNext });
    },
    [cb, commit]
  );

  /* ------------------------------ swapping ------------------------------- */
  const attemptSwap = useCallback(
    (a: number, b: number) => {
      const d = levelDef(levelRef.current);
      const size = d.size;
      const start = boardRef.current;
      if (!areAdjacent(size, a, b)) {
        setSelected(b);
        return;
      }

      const swapped = start.slice();
      const t = swapped[a];
      swapped[a] = swapped[b];
      swapped[b] = t;

      const willMatch = findMatches(swapped, size).size > 0;
      setLock(true);
      setSelected(null);
      setFalls([]);
      setBoard(swapped);
      playSfx("swap");
      haptic(12);

      if (!willMatch) {
        // revert without consuming a move — forgiving on mobile
        playSfx("nope");
        window.setTimeout(() => {
          setBoard(start);
          setLock(false);
        }, 220);
        return;
      }

      const newMovesLeft = movesRef.current - 1;
      setMovesLeft(newMovesLeft);

      window.setTimeout(() => {
        runResolve(swapped, newMovesLeft);
      }, 180);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Resolve cascades step-by-step so clears visibly pop before tiles fall.
  const runResolve = useCallback(
    (afterSwap: Board, movesLeftNow: number) => {
      const d = levelDef(levelRef.current);
      const size = d.size;
      const icons = d.icons;

      let working = afterSwap;
      let cascade = 0;

      const step = () => {
        const matches = findMatches(working, size);
        if (matches.size === 0) {
          const finalScore = scoreRef.current;
          setLock(false);
          setSelected(null);

          if (finalScore >= d.goal) {
            finishGame(true, finalScore, movesLeftNow);
            return;
          }
          if (movesLeftNow <= 0) {
            finishGame(false, finalScore, movesLeftNow);
            return;
          }
          if (!hasAnyValidMove(working, size, icons)) {
            const reshuffled = makeBoardSized(size, icons);
            setFalls([]);
            setBoard(reshuffled);
            boardRef.current = reshuffled;
          }
          return;
        }

        cascade++;
        const cascadeMult = 1 + (cascade - 1) * 0.5;

        const ids = Array.from(matches);
        const layer = scoreLayer(working, size, cascadeMult);

        const nextScore = scoreRef.current + layer.points;
        setScore(nextScore);
        scoreRef.current = nextScore;
        cb.onScore(nextScore);

        cb.onMilestone({ type: "match", label: `Cleared ${ids.length}`, value: ids.length });
        playSfx(cascade >= 2 ? "cascade" : "clear", cascade - 1);
        haptic(cascade >= 2 ? [0, 14, 20, 18] : 18);

        if (cascade >= 2) {
          cb.onMilestone({ type: "combo", label: `Combo x${cascade}`, value: cascade });
          showCombo(`Combo ×${cascade}!`);
          pushFloat(`+${layer.points}`, true);
        } else if (layer.big) {
          cb.onMilestone({ type: "combo", label: "Big match!", value: layer.points });
          showCombo("Sweet!");
          pushFloat(`+${layer.points}`, true);
        } else {
          pushFloat(`+${layer.points}`);
        }

        // show the clearing pop (no falls during the pop frame)
        setFalls([]);
        setClearing(ids);
        const cleared = working.slice();
        for (const i of ids) cleared[i] = -1;

        window.setTimeout(() => {
          setClearing([]);
          const { board: dropped, falls: dropFalls } = gravityWithFalls(cleared, size, icons);
          working = dropped;
          setFalls(dropFalls);
          setBoard(dropped);
          boardRef.current = dropped;
          window.setTimeout(step, 200);
        }, 300);
      };

      step();
    },
    [cb, finishGame, pushFloat, showCombo]
  );

  /* score a single cascade layer (groups runs for 4+/5+ bonuses) */
  function scoreLayer(b: Board, size: number, cascadeMult: number): { points: number; big: boolean } {
    const runs = singleLayerRuns(b, size);
    let points = 0;
    let big = false;
    for (const run of runs) {
      if (run.length >= 4) big = true;
      let pts = run.length * 30;
      if (run.length === 4) pts += 60;
      else if (run.length >= 5) pts += 150;
      points += Math.round(pts * cascadeMult);
    }
    return { points, big };
  }

  const handleTap = useCallback(
    (i: number) => {
      if (lock || result || screen !== "playing") return;
      const size = levelDef(levelRef.current).size;
      if (selected === null) {
        setSelected(i);
        playSfx("select");
        haptic(8);
        return;
      }
      if (selected === i) {
        setSelected(null);
        return;
      }
      if (areAdjacent(size, selected, i)) {
        attemptSwap(selected, i);
      } else {
        setSelected(i);
        playSfx("select");
        haptic(8);
      }
    },
    [lock, result, screen, selected, attemptSwap]
  );

  const restart = useCallback(() => beginGame(levelRef.current), [beginGame]);
  const nextLevel = useCallback(() => {
    const next = Math.min(LEVEL_COUNT, levelRef.current + 1);
    beginGame(next);
  }, [beginGame]);
  const cycleHint = useCallback(() => setHintIdx((h) => (h + 1) % HINTS.length), []);

  /* ------------------------------ derived -------------------------------- */
  const totalCredits = persist?.totalCredits ?? 0;
  const canResume = !!persist?.resume && screen === "menu";
  const progress = Math.min(1, def.goal ? score / def.goal : 0);
  const bestStars = persist?.levels[level]?.stars ?? 0;

  /* -------------------------------- views -------------------------------- */
  return (
    <>
      <FloatingHearts />
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden>
              💌
            </div>
            <div className="brand-name">
              <strong>Cupid&apos;s Match</strong>
              <span>HeartStamp</span>
            </div>
          </div>
          <div className="stats">
            <button
              className="iconbtn"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              aria-pressed={muted}
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <div className="stat">
              <div className="stat-label">Credits</div>
              <div className="stat-value credits">{totalCredits}</div>
            </div>
          </div>
        </header>

        {screen === "menu" ? (
          <MenuScreen
            persist={persist}
            level={level}
            canResume={canResume}
            onPickLevel={setLevel}
            onStart={() => startLevel(level)}
            onResume={resume}
            onLearn={() => setScreen("tutorial")}
          />
        ) : screen === "tutorial" ? (
          <Tutorial onDone={() => startLevel(level)} />
        ) : (
          <section className="play">
            <div className="playbar">
              <div className="hud">
                <span className="mode-badge">📮 Level {level}</span>
                <div className="hud-item">
                  <small>Score</small>
                  <b>{displayScore}</b>
                </div>
                <div className="hud-item">
                  <small>Moves</small>
                  <b className={movesLeft <= 3 ? "low" : ""}>{movesLeft}</b>
                </div>
              </div>
              <div className="toolbtns">
                <button className="tool" onClick={restart} aria-label="Restart">
                  ⟲
                </button>
                <button className="tool" onClick={() => setScreen("menu")} aria-label="Menu">
                  ☰
                </button>
              </div>
            </div>

            <div className="goalbar">
              <div className="goalbar-track">
                <div
                  className={`goalbar-fill${progress >= 1 ? " full" : ""}`}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="goalbar-label">
                {Math.min(score, def.goal)} / {def.goal}
              </span>
            </div>

            <div className="board-wrap">
              <div
                className="tile-grid"
                style={{ ["--cols" as string]: def.size } as React.CSSProperties}
              >
                {board.map((icon, i) => (
                  <Tile
                    key={i}
                    icon={icon}
                    selected={selected === i}
                    clearing={clearing.includes(i)}
                    fall={falls[i] ?? 0}
                    onClick={() => handleTap(i)}
                  />
                ))}
                {floats.map((f) => (
                  <span
                    key={f.id}
                    className={`score-float${f.big ? " big" : ""}`}
                    aria-hidden
                  >
                    {f.text}
                  </span>
                ))}
                {combo && (
                  <span key={combo.id} className="combo-banner" aria-hidden>
                    {combo.text}
                  </span>
                )}
              </div>
            </div>

            <button className="hint-line" onClick={cycleHint}>
              💡 {HINTS[hintIdx]}
            </button>
          </section>
        )}

        <p className="footnote">
          Match-3 swap puzzle · made with love for HeartStamp · sealed with a stamp.
          <br />
          Reward hooks: onScore · onMilestone · onRoundEnd
        </p>
      </div>

      {result && (
        <div className="overlay" role="dialog" aria-modal="true">
          {result.won && <Confetti pieces={26} />}
          <div className="panel result">
            <div className="lottie-stage" aria-hidden>
              <LottieCelebration variant={result.won ? "level-up" : "win"} />
            </div>
            {result.isBest && result.score > 0 && <div className="hs-ribbon">★ New best</div>}
            <h2>
              {result.won
                ? result.stars === 3
                  ? "Sealed with a stamp!"
                  : `Level ${result.level} cleared!`
                : "Out of moves"}
            </h2>
            {result.won ? (
              <div className="stars" aria-label={`${result.stars} of 3 stars`}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`s${i < result.stars ? " on" : ""}`}>
                    ⭐
                  </span>
                ))}
              </div>
            ) : (
              <p className="sub" style={{ marginTop: 10 }}>
                So close — reach {def.goal} next time.
              </p>
            )}
            <p className="sub" style={{ marginTop: 12 }}>
              {result.movesUsed} moves · {formatTime(result.seconds)}
            </p>
            <div className="scoreline">
              <div>
                <span className="k">Score</span>
                <span className="v">{result.score}</span>
              </div>
              <div>
                <span className="k">Credits</span>
                <span className="v gold">+{result.credits}</span>
              </div>
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setScreen("menu")}>
                Menu
              </button>
              {result.won && result.hasNext ? (
                <button className="btn btn-primary" onClick={nextLevel}>
                  Next level →
                </button>
              ) : result.won && !result.hasNext ? (
                <button className="btn btn-primary" onClick={() => setScreen("menu")}>
                  All levels done 💖
                </button>
              ) : (
                <button className="btn btn-primary" onClick={restart}>
                  Try again →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------ helpers ---------------------------------- */

/** Group cells of a board into horizontal/vertical runs of length >= 3. */
function singleLayerRuns(board: Board, size: number): number[][] {
  const runs: number[][] = [];
  for (let r = 0; r < size; r++) {
    let start = 0;
    for (let c = 1; c <= size; c++) {
      const same =
        c < size && board[r * size + c] === board[r * size + start] && board[r * size + c] >= 0;
      if (!same) {
        if (c - start >= 3) {
          const run: number[] = [];
          for (let k = start; k < c; k++) run.push(r * size + k);
          runs.push(run);
        }
        start = c;
      }
    }
  }
  for (let c = 0; c < size; c++) {
    let start = 0;
    for (let r = 1; r <= size; r++) {
      const same =
        r < size && board[r * size + c] === board[start * size + c] && board[r * size + c] >= 0;
      if (!same) {
        if (r - start >= 3) {
          const run: number[] = [];
          for (let k = start; k < r; k++) run.push(k * size + c);
          runs.push(run);
        }
        start = r;
      }
    }
  }
  return runs;
}

/* ------------------------------ subviews --------------------------------- */

function MenuScreen({
  persist,
  level,
  canResume,
  onPickLevel,
  onStart,
  onResume,
  onLearn,
}: {
  persist: PersistedState | null;
  level: number;
  canResume: boolean;
  onPickLevel: (lvl: number) => void;
  onStart: () => void;
  onResume: () => void;
  onLearn: () => void;
}) {
  const highest = persist?.highestUnlocked ?? 1;
  return (
    <section className="screen">
      <h1 className="hero-title">{"Swap, match,\nspread the love."}</h1>
      <p className="hero-sub">
        Cupid scattered the love-icons. Swap two neighbours to line up three or more, trigger juicy
        cascades, and clear each level&apos;s goal before your moves run out.
      </p>

      {canResume && (
        <div className="resume-banner">
          <span>💌 You have a match in progress.</span>
          <button onClick={onResume}>Resume</button>
        </div>
      )}

      <div>
        <p className="section-label">Choose a level</p>
        <div className="level-grid">
          {LEVELS.map((d) => {
            const rec = persist?.levels[d.level];
            const unlocked = d.level <= highest;
            const stars = rec?.stars ?? 0;
            return (
              <button
                key={d.level}
                className={`level-card${level === d.level ? " active" : ""}${
                  unlocked ? "" : " locked"
                }`}
                onClick={() => unlocked && onPickLevel(d.level)}
                disabled={!unlocked}
                aria-pressed={level === d.level}
                aria-label={`Level ${d.level}${unlocked ? "" : " (locked)"}`}
              >
                <span className="level-num">{unlocked ? d.level : "🔒"}</span>
                <span className="level-stars" aria-hidden>
                  {unlocked
                    ? [0, 1, 2].map((i) => (
                        <i key={i} className={i < stars ? "on" : ""}>
                          ★
                        </i>
                      ))
                    : null}
                </span>
              </button>
            );
          })}
        </div>
        <p className="level-detail">
          Level {level} · {levelDef(level).size}×{levelDef(level).size} ·{" "}
          {levelDef(level).icons} icons · {levelDef(level).moves} moves · goal{" "}
          {levelDef(level).goal}
        </p>
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onLearn}>
          How to play
        </button>
        <button className="btn btn-primary" onClick={onStart}>
          Play Level {level} 💌
        </button>
      </div>
    </section>
  );
}
