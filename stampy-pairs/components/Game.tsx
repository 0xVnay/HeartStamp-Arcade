"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Card as CardT,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  Difficulty,
  buildDeck,
  creditsFor,
  formatTime,
  scoreFor,
  starsFor,
} from "@/lib/game";
import {
  PersistedState,
  ResumeSnapshot,
  getHeartStampCallbacks,
  loadState,
  saveState,
} from "@/lib/heartstamp";
import Card from "./Card";
import Tutorial from "./Tutorial";
import FloatingHearts from "./FloatingHearts";
import Confetti from "./Confetti";

const LottieCelebration = dynamic(() => import("./LottieCelebration"), { ssr: false });

type Screen = "menu" | "tutorial" | "playing";

interface Win {
  stars: number;
  score: number;
  credits: number;
  moves: number;
  seconds: number;
  isBest: boolean;
}

const HINTS = [
  "Flip two cards to find a matching pair.",
  "Matched pairs stay face-up.",
  "Fewer flips and a quick clear earn more stars.",
];

export default function Game() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [persist, setPersist] = useState<PersistedState | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  const [deck, setDeck] = useState<CardT[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [win, setWin] = useState<Win | null>(null);
  const [hintIdx, setHintIdx] = useState(0);

  const cb = useMemo(() => getHeartStampCallbacks(), []);
  const persistRef = useRef<PersistedState | null>(null);
  persistRef.current = persist;
  const diffRef = useRef<Difficulty>("easy");
  diffRef.current = difficulty;
  const deckRef = useRef<CardT[]>([]);
  deckRef.current = deck;
  const matchedRef = useRef<number[]>([]);
  matchedRef.current = matched;
  const movesRef = useRef(0);
  movesRef.current = moves;
  const startedAtRef = useRef(0);

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

  /* ------------------------------- timer --------------------------------- */
  useEffect(() => {
    if (screen !== "playing" || win) return;
    const id = window.setInterval(() => {
      setElapsed((Date.now() - startedAtRef.current) / 1000);
    }, 250);
    return () => window.clearInterval(id);
  }, [screen, win]);

  /* --------------------------- game lifecycle ---------------------------- */
  const beginGame = useCallback((diff: Difficulty, snap?: ResumeSnapshot) => {
    setDifficulty(diff);
    setDeck(snap ? snap.deck : buildDeck(diff));
    setMatched(snap?.matched ?? []);
    setMoves(snap?.moves ?? 0);
    setFlipped([]);
    setLock(false);
    setWin(null);
    startedAtRef.current = snap?.startedAt ?? Date.now();
    setElapsed((Date.now() - startedAtRef.current) / 1000);
    setScreen("playing");
  }, []);

  const startNew = useCallback(() => {
    const p = persistRef.current;
    if (p?.resume) commit({ ...p, resume: null });
    beginGame(diffRef.current);
  }, [beginGame, commit]);

  const resume = useCallback(() => {
    const snap = persistRef.current?.resume;
    if (snap) beginGame(snap.difficulty, snap);
  }, [beginGame]);

  const pickDifficulty = useCallback(
    (d: Difficulty) => {
      setDifficulty(d);
      const p = persistRef.current;
      if (p) commit({ ...p, difficulty: d });
    },
    [commit]
  );

  /* --------------------------- persist resume ---------------------------- */
  useEffect(() => {
    if (screen !== "playing" || win || !persistRef.current || !deck.length) return;
    const p = persistRef.current;
    const snap: ResumeSnapshot = {
      difficulty,
      deck,
      matched,
      moves,
      startedAt: startedAtRef.current,
    };
    commit({ ...p, resume: snap });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched, moves, screen, win, deck.length]);

  /* ------------------------------ flipping ------------------------------- */
  const finishGame = useCallback(
    (finalMatched: number[]) => {
      const p = persistRef.current;
      const diff = diffRef.current;
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      const finalMoves = movesRef.current;
      const stars = starsFor(diff, finalMoves);
      const score = scoreFor(diff, finalMoves, seconds);
      const credits = creditsFor(score, stars);
      const prevBest = p?.best[diff].bestScore ?? 0;
      const isBest = score > prevBest;

      cb.onScore(score);
      cb.onMilestone({
        type: stars === 3 ? "perfect" : "round-complete",
        label: stars === 3 ? `Perfect ${diff} clear!` : `${diff} board cleared`,
        value: stars,
      });
      cb.onRoundEnd({
        game: "stampy-pairs",
        difficulty: diff,
        moves: finalMoves,
        durationSec: Math.round(seconds),
        stars,
        score,
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
        if (isBest && score > 0) {
          cb.onMilestone({ type: "best-score", label: "New best score!", value: score });
        }
        const b = p.best[diff];
        commit({
          ...p,
          totalCredits: newTotal,
          gamesPlayed: p.gamesPlayed + 1,
          best: {
            ...p.best,
            [diff]: {
              bestScore: Math.max(b.bestScore, score),
              bestMoves: b.bestMoves === null ? finalMoves : Math.min(b.bestMoves, finalMoves),
              bestTimeSec:
                b.bestTimeSec === null ? Math.round(seconds) : Math.min(b.bestTimeSec, Math.round(seconds)),
              stars: Math.max(b.stars, stars),
            },
          },
          resume: null,
        });
      }

      void finalMatched;
      setWin({ stars, score, credits, moves: finalMoves, seconds, isBest });
    },
    [cb, commit]
  );

  const handleFlip = useCallback(
    (i: number) => {
      if (lock || win) return;
      if (flipped.includes(i) || matchedRef.current.includes(i)) return;
      if (flipped.length >= 2) return;

      const nf = [...flipped, i];
      setFlipped(nf);
      if (nf.length < 2) return;

      const [a, b] = nf;
      const isMatch = deckRef.current[a].icon === deckRef.current[b].icon;
      setMoves((m) => m + 1);
      setLock(true);

      window.setTimeout(
        () => {
          if (isMatch) {
            const nm = [...matchedRef.current, a, b];
            setMatched(nm);
            cb.onMilestone({ type: "match", label: "Pair matched" });
            setFlipped([]);
            setLock(false);
            if (nm.length === deckRef.current.length) finishGame(nm);
          } else {
            setFlipped([]);
            setLock(false);
          }
        },
        isMatch ? 380 : 850
      );
    },
    [flipped, lock, win, cb, finishGame]
  );

  const restart = useCallback(() => beginGame(diffRef.current), [beginGame]);
  const cycleHint = useCallback(() => setHintIdx((i) => (i + 1) % HINTS.length), []);

  /* ------------------------------ derived -------------------------------- */
  const def = DIFFICULTIES[difficulty];
  const totalCredits = persist?.totalCredits ?? 0;
  const canResume = !!persist?.resume && screen === "menu";
  const pairsLeft = deck.length ? (deck.length - matched.length) / 2 : 0;

  /* -------------------------------- views -------------------------------- */
  return (
    <>
      <FloatingHearts />
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden>
              🃏
            </div>
            <div className="brand-name">
              <strong>Stampy Pairs</strong>
              <span>HeartStamp</span>
            </div>
          </div>
          <div className="stats">
            <div className="stat">
              <div className="stat-label">Best ★</div>
              <div className="stat-value">{persist?.best[difficulty].stars ?? 0}</div>
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
              <div className="hud">
                <span className="mode-badge">
                  {def.emoji} {def.label}
                </span>
                <div className="hud-item">
                  <small>Moves</small>
                  <b>{moves}</b>
                </div>
                <div className="hud-item">
                  <small>Time</small>
                  <b>{formatTime(elapsed)}</b>
                </div>
                <div className="hud-item">
                  <small>Pairs left</small>
                  <b>{pairsLeft}</b>
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

            <div className="board-wrap">
              <div
                className="card-grid"
                style={{ ["--cols" as string]: def.cols } as React.CSSProperties}
              >
                {deck.map((c, i) => (
                  <Card
                    key={c.key}
                    icon={c.icon}
                    flipped={flipped.includes(i) || matched.includes(i)}
                    matched={matched.includes(i)}
                    onClick={() => handleFlip(i)}
                  />
                ))}
              </div>
            </div>

            <button className="hint-line" onClick={cycleHint}>
              💡 {HINTS[hintIdx]}
            </button>
          </section>
        )}

        <p className="footnote">
          Memory match · built for HeartStamp · original code, MIT-style reusable.
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
            {win.isBest && win.score > 0 && <div className="hs-ribbon">★ New best</div>}
            <div className="burst">{win.stars === 3 ? "💖" : "✨"}</div>
            <h2>{win.stars === 3 ? "Perfect memory!" : "All matched!"}</h2>
            <div className="stars" aria-label={`${win.stars} of 3 stars`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`s${i < win.stars ? " on" : ""}`}>
                  ⭐
                </span>
              ))}
            </div>
            <p className="sub" style={{ marginTop: 12 }}>
              {win.moves} moves · {formatTime(win.seconds)}
            </p>
            <div className="scoreline">
              <div>
                <span className="k">Score</span>
                <span className="v">{win.score}</span>
              </div>
              <div>
                <span className="k">Credits</span>
                <span className="v gold">+{win.credits}</span>
              </div>
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setScreen("menu")}>
                Menu
              </button>
              <button className="btn btn-primary" onClick={restart}>
                Play again →
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
  onPickDifficulty,
  onStart,
  onResume,
  onLearn,
}: {
  persist: PersistedState | null;
  difficulty: Difficulty;
  canResume: boolean;
  onPickDifficulty: (d: Difficulty) => void;
  onStart: () => void;
  onResume: () => void;
  onLearn: () => void;
}) {
  return (
    <section className="screen">
      <h1 className="hero-title">{"Flip, match,\nremember with love."}</h1>
      <p className="hero-sub">
        Stampy hid matching icons under the postcards. Flip two at a time and pair them all in as few
        moves as you can.
      </p>

      {canResume && (
        <div className="resume-banner">
          <span>🃏 You have a game in progress.</span>
          <button onClick={onResume}>Resume</button>
        </div>
      )}

      <div>
        <p className="section-label">Choose your mode</p>
        <div className="difficulty">
          {DIFFICULTY_ORDER.map((key) => {
            const d = DIFFICULTIES[key];
            const best = persist?.best[key];
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
                <span className="diff-best">{best && best.stars > 0 ? `Best ${"★".repeat(best.stars)}` : "—"}</span>
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
          Start matching 🃏
        </button>
      </div>
    </section>
  );
}
