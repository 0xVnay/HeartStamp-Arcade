"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Board,
  Direction,
  LEVELS,
  MAX_LEVEL,
  MODES,
  MODE_ORDER,
  Mode,
  PosTile,
  creditsFor,
  formatTime,
  highestTier,
  isGameOver,
  levelInfo,
  movePos,
  newBoard,
  scoreFor,
  spawnPosTile,
  starsForLevel,
  tierInfo,
  tilesFromBoard,
} from "@/lib/game";
import {
  PersistedState,
  ResumeSnapshot,
  getHeartStampCallbacks,
  loadState,
  saveState,
} from "@/lib/heartstamp";
import { playSfx } from "@/lib/sfx";
import { vibrate } from "@/lib/haptics";
import Tile from "./Tile";
import Tutorial from "./Tutorial";
import FloatingHearts from "./FloatingHearts";
import Confetti from "./Confetti";
import ScoreCounter from "./ScoreCounter";

// Lottie never runs on the server.
const LottieCelebration = dynamic(() => import("./LottieCelebration"), { ssr: false });

type Screen = "menu" | "tutorial" | "playing";

interface Result {
  stars: number;
  score: number;
  credits: number;
  highestTier: number;
  reachedTarget: boolean;
  seconds: number;
  isBest: boolean;
  level: number;
}

interface ScoreFloat {
  id: number;
  amount: number;
}

const HINTS = [
  "Swipe or use arrow keys to slide every tile.",
  "Identical tokens merge into the next tier.",
  "Reach this level's target tier to clear it.",
];

const SWIPE_THRESHOLD = 28; // px
const SLIDE_MS = 130; // tile slide animation duration (keep in sync with CSS)

export default function Game() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [persist, setPersist] = useState<PersistedState | null>(null);
  const [mode, setMode] = useState<Mode>("cozy");
  const [level, setLevel] = useState(1);

  const [tiles, setTiles] = useState<PosTile[]>([]);
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [reachedTarget, setReachedTarget] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);
  const [floats, setFloats] = useState<ScoreFloat[]>([]);
  const [levelUpFlash, setLevelUpFlash] = useState(false);

  const cb = useMemo(() => getHeartStampCallbacks(), []);
  const persistRef = useRef<PersistedState | null>(null);
  persistRef.current = persist;
  const modeRef = useRef<Mode>("cozy");
  modeRef.current = mode;
  const levelRef = useRef(1);
  levelRef.current = level;
  const tilesRef = useRef<PosTile[]>([]);
  tilesRef.current = tiles;
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const reachedRef = useRef(false);
  reachedRef.current = reachedTarget;
  const resultRef = useRef<Result | null>(null);
  resultRef.current = result;
  const screenRef = useRef<Screen>("menu");
  screenRef.current = screen;
  const startedAtRef = useRef(0);
  const animRef = useRef(false);
  const floatSeq = useRef(0);

  const muted = persist?.muted ?? false;
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  /* ----------------------------- bootstrap ------------------------------- */
  useEffect(() => {
    const loaded = loadState();
    setPersist(loaded);
    setMode(loaded.mode);
    setLevel(loaded.level);
  }, []);

  const commit = useCallback((next: PersistedState) => {
    setPersist(next);
    saveState(next);
  }, []);

  /* ------------------------------- timer --------------------------------- */
  useEffect(() => {
    if (screen !== "playing" || result) return;
    const id = window.setInterval(() => {
      setElapsed((Date.now() - startedAtRef.current) / 1000);
    }, 250);
    return () => window.clearInterval(id);
  }, [screen, result]);

  /* ------------------- board <-> resume helpers -------------------------- */
  const boardFromTiles = useCallback((ts: PosTile[], size: number): Board => {
    const b: Board = Array.from({ length: size }, () => Array<number>(size).fill(0));
    for (const t of ts) if (t.tier > b[t.r][t.c]) b[t.r][t.c] = t.tier;
    return b;
  }, []);

  /* --------------------------- game lifecycle ---------------------------- */
  const beginGame = useCallback(
    (m: Mode, lvl: number, snap?: ResumeSnapshot) => {
      const size = MODES[m].size;
      setMode(m);
      setLevel(lvl);
      const initialBoard = snap ? snap.board : newBoard(size, levelInfo(lvl).clutter);
      setTiles(tilesFromBoard(initialBoard));
      setScore(snap?.score ?? 0);
      setReachedTarget((snap?.highestTier ?? 0) >= levelInfo(lvl).target);
      setResult(null);
      setFloats([]);
      startedAtRef.current = snap?.startedAt ?? Date.now();
      setElapsed((Date.now() - startedAtRef.current) / 1000);
      setScreen("playing");
    },
    []
  );

  const startNew = useCallback(() => {
    const p = persistRef.current;
    if (p?.resume) commit({ ...p, resume: null });
    beginGame(modeRef.current, levelRef.current);
  }, [beginGame, commit]);

  const resume = useCallback(() => {
    const snap = persistRef.current?.resume;
    if (snap) beginGame(snap.mode, snap.level, snap);
  }, [beginGame]);

  const pickMode = useCallback(
    (m: Mode) => {
      setMode(m);
      const p = persistRef.current;
      if (p) commit({ ...p, mode: m });
    },
    [commit]
  );

  const pickLevel = useCallback(
    (lvl: number) => {
      setLevel(lvl);
      const p = persistRef.current;
      if (p) commit({ ...p, level: lvl });
    },
    [commit]
  );

  const toggleMute = useCallback(() => {
    const p = persistRef.current;
    if (p) commit({ ...p, muted: !p.muted });
  }, [commit]);

  /* --------------------------- persist resume ---------------------------- */
  useEffect(() => {
    if (screen !== "playing" || result || !persistRef.current || !tiles.length) return;
    const p = persistRef.current;
    const size = MODES[mode].size;
    const board = boardFromTiles(tiles, size);
    const snap: ResumeSnapshot = {
      mode,
      level,
      board,
      score,
      highestTier: highestTier(board),
      startedAt: startedAtRef.current,
    };
    commit({ ...p, resume: snap });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles, score, screen, result]);

  /* ------------------------------ ending --------------------------------- */
  const finishGame = useCallback(
    (finalBoard: Board) => {
      const p = persistRef.current;
      const m = modeRef.current;
      const lvl = levelRef.current;
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      const top = highestTier(finalBoard);
      const finalScore = scoreRef.current;
      const target = levelInfo(lvl).target;
      const reached = top >= target;
      const stars = starsForLevel(lvl, top);
      const credits = creditsFor(finalScore, stars);
      const prevBest = p?.levelBest[lvl]?.bestScore ?? 0;
      const isBest = finalScore > prevBest;

      playSfx(reached ? "win" : "gameover", mutedRef.current);
      vibrate(reached ? "win" : "gameover", mutedRef.current);

      cb.onScore(finalScore);
      cb.onMilestone({
        type: reached ? "level-up" : "round-complete",
        label: reached
          ? `Level ${lvl} cleared — reached ${tierInfo(target).name} ${tierInfo(target).emoji}!`
          : "Board full — round over",
        value: top,
      });
      cb.onRoundEnd({
        game: "heart-merge",
        mode: m,
        level: lvl,
        highestTier: top,
        reachedTarget: reached,
        durationSec: Math.round(seconds),
        stars,
        score: finalScore,
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
        const prev = p.levelBest[lvl] ?? { stars: 0, bestScore: 0 };
        const newUnlocked = reached ? Math.min(Math.max(p.unlocked, lvl + 1), MAX_LEVEL) : p.unlocked;
        commit({
          ...p,
          totalCredits: newTotal,
          gamesPlayed: p.gamesPlayed + 1,
          unlocked: newUnlocked,
          levelBest: {
            ...p.levelBest,
            [lvl]: {
              stars: Math.max(prev.stars, stars),
              bestScore: Math.max(prev.bestScore, finalScore),
            },
          },
          resume: null,
        });
      }

      setResult({
        stars,
        score: finalScore,
        credits,
        highestTier: top,
        reachedTarget: reached,
        seconds,
        isBest,
        level: lvl,
      });
    },
    [cb, commit]
  );

  /* ------------------------------ moving --------------------------------- */
  const doMove = useCallback(
    (dir: Direction) => {
      if (screenRef.current !== "playing" || resultRef.current || animRef.current) return;
      const m = modeRef.current;
      const size = MODES[m].size;
      const lvl = levelRef.current;
      const current = tilesRef.current;
      const res = movePos(current, size, dir);
      if (!res.moved) return;

      animRef.current = true;

      // Phase 1: tiles slide to their new positions (ghosts still present).
      setTiles(res.tiles);

      const gained = scoreFor(m, res.gained);
      if (res.merges > 0) {
        playSfx("merge", mutedRef.current);
        vibrate("merge", mutedRef.current);
      } else {
        playSfx("move", mutedRef.current);
        vibrate("move", mutedRef.current);
      }
      if (gained > 0) {
        const nextScore = scoreRef.current + gained;
        setScore(nextScore);
        cb.onScore(nextScore);
        const id = floatSeq.current++;
        setFloats((f) => [...f, { id, amount: gained }]);
        window.setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 900);
      }

      if (res.merges >= 3) {
        cb.onMilestone({ type: "combo", label: `${res.merges}× merge combo!`, value: res.merges });
      }

      // Crossing this level's target tier for the first time = level-up milestone.
      const target = levelInfo(lvl).target;
      if (res.highestMerge >= target && !reachedRef.current) {
        setReachedTarget(true);
        setLevelUpFlash(true);
        playSfx("levelup", mutedRef.current);
        vibrate("levelup", mutedRef.current);
        cb.onMilestone({
          type: "level-up",
          label: `Level ${lvl} goal: ${tierInfo(target).name} ${tierInfo(target).emoji}!`,
          value: res.highestMerge,
        });
        window.setTimeout(() => setLevelUpFlash(false), 1500);
      }

      // Phase 2: after the slide, drop merge-ghosts and spawn a fresh tile.
      window.setTimeout(() => {
        const survivors = res.tiles
          .filter((t, i) => {
            // keep only one tile per cell (the highest tier survivor)
            const sameCell = res.tiles.findIndex((o) => o.r === t.r && o.c === t.c && o.tier >= t.tier);
            return sameCell === i;
          })
          .map((t) => ({ ...t, fromR: t.r, fromC: t.c, merged: false, spawned: false }));
        const withSpawn = spawnPosTile(survivors, size);
        setTiles(withSpawn);
        animRef.current = false;
        const board = boardFromTiles(withSpawn, size);
        if (isGameOver(board)) finishGame(board);
      }, SLIDE_MS);
    },
    [cb, finishGame, boardFromTiles]
  );

  /* --------------------------- keyboard input ---------------------------- */
  useEffect(() => {
    if (screen !== "playing" || result) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      doMove(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, result, doMove]);

  /* ----------------------------- touch input ----------------------------- */
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (Math.max(adx, ady) < SWIPE_THRESHOLD) return;
      if (adx > ady) doMove(dx > 0 ? "right" : "left");
      else doMove(dy > 0 ? "down" : "up");
    },
    [doMove]
  );

  const restart = useCallback(() => beginGame(modeRef.current, levelRef.current), [beginGame]);
  const nextLevel = useCallback(() => {
    const next = Math.min(levelRef.current + 1, MAX_LEVEL);
    pickLevel(next);
    beginGame(modeRef.current, next);
  }, [beginGame, pickLevel]);
  const cycleHint = useCallback(() => setHintIdx((i) => (i + 1) % HINTS.length), []);

  /* ------------------------------ derived -------------------------------- */
  const def = MODES[mode];
  const lvlDef = levelInfo(level);
  const totalCredits = persist?.totalCredits ?? 0;
  const canResume = !!persist?.resume && screen === "menu";
  const size = def.size;
  const board = tiles.length ? boardFromTiles(tiles, size) : [];
  const top = board.length ? highestTier(board) : 0;
  const topInfo = tierInfo(top);
  const targetInfo = tierInfo(lvlDef.target);
  const goalPct = Math.min(100, Math.round((top / lvlDef.target) * 100));
  const hasNextLevel = result ? result.level < MAX_LEVEL : false;

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
              <strong>Heart Merge</strong>
              <span>HeartStamp</span>
            </div>
          </div>
          <div className="stats">
            <button
              className="mute-btn"
              onClick={toggleMute}
              aria-label={muted ? "Unmute sound" : "Mute sound"}
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
            mode={mode}
            level={level}
            canResume={canResume}
            onPickMode={pickMode}
            onPickLevel={pickLevel}
            onStart={startNew}
            onResume={resume}
            onLearn={() => setScreen("tutorial")}
          />
        ) : screen === "tutorial" ? (
          <Tutorial onDone={startNew} />
        ) : (
          <section className="play">
            <div className="playbar">
              <div className="hud">
                <span className="mode-badge">
                  {def.emoji} {def.label} · Lvl {level}
                </span>
                <div className="hud-item">
                  <small>Score</small>
                  <b>
                    <ScoreCounter value={score} />
                  </b>
                </div>
                <div className="hud-item">
                  <small>Top</small>
                  <b>
                    {topInfo.emoji} {top}
                  </b>
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

            <div className="goal">
              <div className="goal-top">
                <span>
                  Goal: {targetInfo.emoji} {targetInfo.name}
                </span>
                <span className={`goal-pct${reachedTarget ? " hit" : ""}`}>
                  {reachedTarget ? "✓ cleared" : `${goalPct}%`}
                </span>
              </div>
              <div className="goal-bar">
                <div
                  className={`goal-fill${reachedTarget ? " done" : ""}`}
                  style={{ width: `${goalPct}%` }}
                />
              </div>
            </div>

            <div className="board-wrap">
              <div
                className="board"
                style={{ ["--size" as string]: size } as React.CSSProperties}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <div className="board-cells" aria-hidden>
                  {Array.from({ length: size * size }).map((_, i) => (
                    <div className="cell" key={i} />
                  ))}
                </div>
                {tiles.map((t) => (
                  <Tile key={t.id} tile={t} size={size} />
                ))}
                {floats.map((f) => (
                  <span key={f.id} className="score-float">
                    +{f.amount}
                  </span>
                ))}
                {levelUpFlash && (
                  <div className="board-lottie" aria-hidden>
                    <LottieCelebration variant="levelup" />
                  </div>
                )}
              </div>
            </div>

            <button className="hint-line" onClick={cycleHint}>
              💡 {HINTS[hintIdx]}
            </button>
          </section>
        )}

        <p className="footnote">
          Swipe-merge puzzle · sealed with a stamp for HeartStamp.
          <br />
          Reward hooks: onScore · onMilestone · onRoundEnd
        </p>
      </div>

      {result && (
        <div className="overlay" role="dialog" aria-modal="true">
          {result.reachedTarget && (
            <>
              <Confetti pieces={30} />
              <div className="result-lottie" aria-hidden>
                <LottieCelebration variant="win" />
              </div>
            </>
          )}
          <div className="panel result">
            {result.isBest && result.score > 0 && <div className="hs-ribbon">★ New best</div>}
            <div className="burst">{result.reachedTarget ? "💌" : "💜"}</div>
            <h2>{result.reachedTarget ? "Sealed with a stamp!" : "Board's full!"}</h2>
            <p className="result-level">
              {result.reachedTarget
                ? `Level ${result.level} cleared`
                : `Level ${result.level} — give it another go`}
            </p>
            <div className="stars" aria-label={`${result.stars} of 3 stars`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`s${i < result.stars ? " on" : ""}`}>
                  ⭐
                </span>
              ))}
            </div>
            <p className="sub" style={{ marginTop: 12 }}>
              Reached {tierInfo(result.highestTier).emoji} {tierInfo(result.highestTier).name} ·{" "}
              {formatTime(result.seconds)}
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
              {result.reachedTarget && hasNextLevel ? (
                <button className="btn btn-primary" onClick={nextLevel}>
                  Next level →
                </button>
              ) : (
                <button className="btn btn-primary" onClick={restart}>
                  Play again →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------ subviews --------------------------------- */

function MenuScreen({
  persist,
  mode,
  level,
  canResume,
  onPickMode,
  onPickLevel,
  onStart,
  onResume,
  onLearn,
}: {
  persist: PersistedState | null;
  mode: Mode;
  level: number;
  canResume: boolean;
  onPickMode: (m: Mode) => void;
  onPickLevel: (l: number) => void;
  onStart: () => void;
  onResume: () => void;
  onLearn: () => void;
}) {
  const unlocked = persist?.unlocked ?? 1;
  return (
    <section className="screen">
      <h1 className="hero-title">{"Merge sparks,\nlevel up love."}</h1>
      <p className="hero-sub">
        Swipe to slide the love-tokens. When two match they merge into the next tier — climb each
        level from a tiny ✨ Spark toward 💖 Forever.
      </p>

      {canResume && (
        <div className="resume-banner">
          <span>💌 You have a game in progress.</span>
          <button onClick={onResume}>Resume</button>
        </div>
      )}

      <div>
        <p className="section-label">Pick a board feel</p>
        <div className="difficulty">
          {MODE_ORDER.map((key) => {
            const d = MODES[key];
            return (
              <button
                key={key}
                className={`diff-card${mode === key ? " active" : ""}`}
                onClick={() => onPickMode(key)}
                aria-pressed={mode === key}
              >
                {mode === key && <span className="diff-check">✓</span>}
                <span className="diff-emoji">{d.emoji}</span>
                <span className="diff-label">{d.label}</span>
                <span className="diff-blurb">{d.blurb}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="section-label">Choose your level</p>
        <div className="levels">
          {LEVELS.map((l) => {
            const locked = l.level > unlocked;
            const best = persist?.levelBest[l.level];
            const stars = best?.stars ?? 0;
            return (
              <button
                key={l.level}
                className={`lvl-card${level === l.level ? " active" : ""}${locked ? " locked" : ""}`}
                onClick={() => !locked && onPickLevel(l.level)}
                disabled={locked}
                aria-pressed={level === l.level}
              >
                <span className="lvl-num">{locked ? "🔒" : l.level}</span>
                <span className="lvl-tier">{tierEmojiFor(l.target)}</span>
                <span className="lvl-stars" aria-label={`${stars} stars`}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={i < stars ? "on" : ""}>
                      ★
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <p className="level-blurb">{levelInfo(level).blurb}</p>
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onLearn}>
          How to play
        </button>
        <button className="btn btn-primary" onClick={onStart}>
          Start merging 💌
        </button>
      </div>
    </section>
  );
}

function tierEmojiFor(target: number): string {
  return tierInfo(target).emoji;
}
