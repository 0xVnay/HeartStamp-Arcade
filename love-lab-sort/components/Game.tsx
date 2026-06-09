"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Beakers,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  Difficulty,
  canPour,
  creditsFor,
  generateLevel,
  isSolved,
  levelConfig,
  parMoves,
  pour,
  scoreLevel,
} from "@/lib/game";
import {
  PersistedState,
  ResumeSnapshot,
  getHeartStampCallbacks,
  loadState,
  saveState,
} from "@/lib/heartstamp";
import Beaker from "./Beaker";
import Tutorial from "./Tutorial";
import FloatingHearts from "./FloatingHearts";
import Confetti from "./Confetti";

// Lottie touches the DOM/window, so load it client-only.
const LottieCelebration = dynamic(() => import("./LottieCelebration"), { ssr: false });

type Screen = "menu" | "tutorial" | "playing";

interface Win {
  score: number;
  moves: number;
  credits: number;
  perfect: boolean;
  best: number;
}

const HINTS = [
  "Tap a jar, then tap where to pour.",
  "Only matching colors stack — or pour into an empty jar.",
  "Stuck? Undo and try a different order.",
];

/** Jar width shrinks as the board gets busier, so 6–9 jars wrap into tidy rows. */
function jarWidth(count: number): number {
  if (count <= 4) return 66;
  if (count === 5) return 60;
  if (count === 6) return 56;
  if (count === 7) return 51;
  if (count === 8) return 47;
  return 43;
}

export default function Game() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [persist, setPersist] = useState<PersistedState | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  const [level, setLevel] = useState(1);
  const [beakers, setBeakers] = useState<Beakers>([]);
  const [history, setHistory] = useState<Beakers[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [win, setWin] = useState<Win | null>(null);
  const [hintIdx, setHintIdx] = useState(0);

  const startedAt = useRef<number>(0);
  const cb = useMemo(() => getHeartStampCallbacks(), []);
  const persistRef = useRef<PersistedState | null>(null);
  persistRef.current = persist;
  const diffRef = useRef<Difficulty>("easy");
  diffRef.current = difficulty;

  /* ----------------------------- bootstrap ------------------------------- */
  useEffect(() => {
    const loaded = loadState();
    setPersist(loaded);
    setDifficulty(loaded.difficulty);
  }, []);

  const commit = useCallback((next: PersistedState) => {
    setPersist(next);
    saveState(next);
  }, []);

  /* --------------------------- level lifecycle --------------------------- */
  const beginLevel = useCallback((lvl: number, diff: Difficulty, snapshot?: ResumeSnapshot) => {
    const board = snapshot ? snapshot.tubes.map((t) => t.slice()) : generateLevel(lvl, diff);
    setDifficulty(diff);
    setLevel(lvl);
    setBeakers(board);
    setHistory([]);
    setSelected(null);
    setShakeIdx(null);
    setMoves(snapshot?.moves ?? 0);
    setWin(null);
    startedAt.current =
      snapshot?.startedAt ?? (typeof performance !== "undefined" ? performance.now() : 0);
    setScreen("playing");
  }, []);

  const startNew = useCallback(() => {
    const p = persistRef.current;
    const diff = diffRef.current;
    if (p?.resume) commit({ ...p, resume: null });
    beginLevel(p?.progress[diff].highestLevel ?? 1, diff);
  }, [beginLevel, commit]);

  const resume = useCallback(() => {
    const snap = persistRef.current?.resume;
    if (snap) beginLevel(snap.level, snap.difficulty, snap);
  }, [beginLevel]);

  const pickDifficulty = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      const p = persistRef.current;
      if (p) commit({ ...p, difficulty: diff });
    },
    [commit]
  );

  /* ------------------------------ snapshot ------------------------------- */
  useEffect(() => {
    if (screen !== "playing" || win || !persistRef.current) return;
    const p = persistRef.current;
    const snap: ResumeSnapshot = {
      difficulty,
      level,
      tubes: beakers,
      moves,
      startedAt: startedAt.current,
    };
    commit({ ...p, resume: snap });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beakers, moves, screen, win, level, difficulty]);

  /* ------------------------------ pouring -------------------------------- */
  const handleTap = useCallback(
    (idx: number) => {
      if (win) return;
      if (selected === null) {
        if (beakers[idx].length === 0) return;
        setSelected(idx);
        return;
      }
      if (selected === idx) {
        setSelected(null);
        return;
      }
      if (canPour(beakers[selected], beakers[idx])) {
        const next = pour(beakers, selected, idx);
        setHistory((h) => [...h, beakers]);
        setBeakers(next);
        setMoves((m) => m + 1);
        setSelected(null);
        if (isSolved(next)) finishLevel(next);
      } else {
        // invalid target — wobble it, then move the selection there if it has liquid
        setShakeIdx(idx);
        window.setTimeout(() => setShakeIdx(null), 420);
        setSelected(beakers[idx].length ? idx : null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [beakers, selected, win]
  );

  const finishLevel = useCallback(
    (finalBoard: Beakers) => {
      const p = persistRef.current;
      const diff = diffRef.current;
      const duration =
        (typeof performance !== "undefined" ? performance.now() : 0) - startedAt.current;
      const finalMoves = moves + 1;
      const score = scoreLevel(level, finalMoves, duration, diff);
      const prevBest = p?.progress[diff].bestMoves[level] ?? null;
      const perfect = finalMoves <= parMoves(level, diff);
      const credits = creditsFor(score, perfect);
      const best = prevBest === null ? finalMoves : Math.min(prevBest, finalMoves);

      cb.onScore(score);
      cb.onMilestone({
        type: perfect ? "perfect-level" : "level-complete",
        label: perfect ? `Perfect ${diff} level ${level}!` : `${diff} level ${level} complete`,
        value: level,
      });
      cb.onRoundEnd({
        game: "love-lab-sort",
        difficulty: diff,
        level,
        moves: finalMoves,
        bestMoves: best,
        durationMs: Math.round(duration),
        score,
        creditsEarned: credits,
        totalCredits: (p?.totalCredits ?? 0) + credits,
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
        const mode = p.progress[diff];
        commit({
          ...p,
          totalCredits: newTotal,
          progress: {
            ...p.progress,
            [diff]: {
              highestLevel: Math.max(mode.highestLevel, level + 1),
              bestMoves: { ...mode.bestMoves, [level]: best },
            },
          },
          resume: null,
        });
      }

      setBeakers(finalBoard);
      setWin({ score, moves: finalMoves, credits, perfect, best });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cb, commit, level, moves]
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setBeakers(prev);
      setMoves((m) => Math.max(0, m - 1));
      setSelected(null);
      return h.slice(0, -1);
    });
  }, []);

  const restart = useCallback(() => beginLevel(level, difficulty), [beginLevel, level, difficulty]);
  const nextLevel = useCallback(
    () => beginLevel(level + 1, difficulty),
    [beginLevel, level, difficulty]
  );
  const cycleHint = useCallback(() => setHintIdx((i) => (i + 1) % HINTS.length), []);

  /* ------------------------------ derived -------------------------------- */
  const pourableTargets = useMemo(() => {
    if (selected === null) return new Set<number>();
    const set = new Set<number>();
    beakers.forEach((b, i) => {
      if (i !== selected && canPour(beakers[selected], b)) set.add(i);
    });
    return set;
  }, [beakers, selected]);

  const totalCredits = persist?.totalCredits ?? 0;
  const def = DIFFICULTIES[difficulty];
  const headerLevel = screen === "playing" ? level : persist?.progress[difficulty].highestLevel ?? 1;
  const canResume = !!persist?.resume && screen === "menu";

  /* -------------------------------- views -------------------------------- */
  return (
    <>
      <FloatingHearts />
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden>
              🧪
            </div>
            <div className="brand-name">
              <strong>Love Lab Sort</strong>
              <span>HeartStamp</span>
            </div>
          </div>
          <div className="stats">
            <div className="stat">
              <div className="stat-label">Level</div>
              <div className="stat-value">{headerLevel}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Credits</div>
              <div className="stat-value credits">{totalCredits}</div>
            </div>
          </div>
        </header>

        {screen === "menu" ? (
          <MenuScreen
            persist={persist}
            difficulty={difficulty}
            canResume={canResume}
            resumeLevel={persist?.resume?.level ?? 1}
            onPickDifficulty={pickDifficulty}
            onStart={startNew}
            onResume={resume}
            onLearn={() => setScreen("tutorial")}
          />
        ) : screen === "tutorial" ? (
          <Tutorial onDone={startNew} />
        ) : (
          <section className="play">
            <div className="playbar">
              <div className="level-chip">
                Level {level}
                <span className="mode-badge">
                  {def.emoji} {def.label}
                </span>
                <small>
                  {levelConfig(level, difficulty).colors} potions · {moves} moves
                </small>
              </div>
              <div className="toolbtns">
                <button className="tool" onClick={undo} disabled={!history.length} aria-label="Undo">
                  ↩︎
                </button>
                <button className="tool" onClick={restart} aria-label="Restart level">
                  ⟲
                </button>
                <button className="tool" onClick={() => setScreen("menu")} aria-label="Menu">
                  ☰
                </button>
              </div>
            </div>

            <div
              className="beaker-area"
              style={{ "--jar-w": `${jarWidth(beakers.length)}px` } as React.CSSProperties}
            >
              {beakers.map((b, i) => (
                <Beaker
                  key={i}
                  segments={b}
                  selected={selected === i}
                  pourable={pourableTargets.has(i)}
                  shake={shakeIdx === i}
                  onClick={() => handleTap(i)}
                />
              ))}
            </div>

            <button className="hint-line" onClick={cycleHint}>
              💡 {HINTS[hintIdx]}
            </button>
          </section>
        )}

        <p className="footnote">
          Color-sort puzzle · built for HeartStamp · original code, MIT-style reusable.
          <br />
          Reward hooks: onScore · onMilestone · onRoundEnd
        </p>
      </div>

      {win && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="celebrate-layer" aria-hidden>
            <LottieCelebration />
          </div>
          <Confetti pieces={26} />
          <div className="panel result">
            <div className="burst">{win.perfect ? "💖" : "✨"}</div>
            <h2>{win.perfect ? "Perfect!" : "Sorted!"}</h2>
            <p>
              {win.perfect
                ? "Flawless pour work — Stampy is impressed."
                : "Every potion in its place. Lovely."}
            </p>
            <div className="scoreline">
              <div>
                <span className="k">Score</span>
                <span className="v">{win.score}</span>
              </div>
              <div>
                <span className="k">Moves</span>
                <span className="v">{win.moves}</span>
              </div>
              <div>
                <span className="k">Credits</span>
                <span className="v gold">+{win.credits}</span>
              </div>
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={restart}>
                Replay
              </button>
              <button className="btn btn-primary" onClick={nextLevel}>
                Next level →
              </button>
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
  difficulty,
  canResume,
  resumeLevel,
  onPickDifficulty,
  onStart,
  onResume,
  onLearn,
}: {
  persist: PersistedState | null;
  difficulty: Difficulty;
  canResume: boolean;
  resumeLevel: number;
  onPickDifficulty: (d: Difficulty) => void;
  onStart: () => void;
  onResume: () => void;
  onLearn: () => void;
}) {
  return (
    <section className="screen">
      <h1 className="hero-title">Brew. Pour.{"\n"}Sort with love.</h1>
      <p className="hero-sub">
        Stampy&apos;s potion shelf is a mess. Pour the colors together until every jar holds a
        single shade of love.
      </p>

      {canResume && (
        <div className="resume-banner">
          <span>🫙 You have a level {resumeLevel} in progress.</span>
          <button onClick={onResume}>Resume</button>
        </div>
      )}

      <div>
        <p className="section-label">Choose your mode</p>
        <div className="difficulty">
          {DIFFICULTY_ORDER.map((key) => {
            const d = DIFFICULTIES[key];
            const reached = persist?.progress[key].highestLevel ?? 1;
            return (
              <button
                key={key}
                className={`diff-card${difficulty === key ? " active" : ""}`}
                onClick={() => onPickDifficulty(key)}
                aria-pressed={difficulty === key}
              >
                {difficulty === key && <span className="diff-check">✓</span>}
                <span className="diff-emoji">{d.emoji}</span>
                <span className="diff-label">{d.label}</span>
                <span className="diff-blurb">{d.blurb}</span>
                <span className="diff-best">Reached Lv {reached}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onLearn}>
          How to play
        </button>
        <button className="btn btn-primary" onClick={onStart}>
          Start brewing 🧪
        </button>
      </div>
    </section>
  );
}
