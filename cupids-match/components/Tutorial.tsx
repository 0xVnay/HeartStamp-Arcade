"use client";

import { useMemo, useState } from "react";
import { ICONS } from "@/lib/game";
import Tile from "./Tile";

/**
 * Hands-on tutorial: a fixed 4×4 board the player actually solves with one real
 * swap. The two glowing tiles, when swapped, line up three 💖 in the top row —
 * teaching tap-to-select, tap-adjacent-to-swap, and the match clear, with no
 * chance of a confusing dead swap.
 *
 *   row0:  💖 💖 🌹 💌
 *   row1:  🌹 💌 💖 🎀     ← swap (1,1)=💌 with (0,1)? no — we swap horizontally
 *
 * Concretely: tile A = (0,2)=🌹 and tile B = (1,2)=💖 are adjacent (vertical).
 * Swapping makes the top row 💖 💖 💖 — a match of three.
 */
const SIZE = 4;
// indices: r*4 + c
const BOARD: number[] = [
  0, 0, 1, 2, // 💖 💖 🌹 💌
  1, 2, 0, 4, // 🌹 💌 💖 🎀
  2, 1, 4, 0, // 💌 🌹 🎀 💖
  4, 0, 2, 1, // 🎀 💖 💌 🌹
];
const A = 2; // (0,2) = 🌹
const B = 6; // (1,2) = 💖  → swap lines up 💖💖💖 on the top row

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [board, setBoard] = useState<number[]>(BOARD);
  const [selected, setSelected] = useState<number | null>(null);
  const [clearing, setClearing] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const [lock, setLock] = useState(false);

  const coach = useMemo(() => {
    if (!started)
      return {
        title: "Make a match of three",
        body: "Tap a love-icon to pick it up, then tap a neighbour to swap them. Line up three of a kind to clear them. Tap Begin to try.",
      };
    if (done)
      return {
        title: "Sweet! 💖",
        body: "That swap lined up three hearts and cleared them. New icons drop in from the top — chain more clears for combo bonuses. Reach the goal before your moves run out!",
      };
    if (selected === null)
      return { title: "Pick a tile", body: "Tap the glowing 🌹 to pick it up." };
    return { title: "Now swap", body: "Tap the glowing 💖 just below it to swap — three hearts will line up." };
  }, [started, done, selected]);

  function handleTap(i: number) {
    if (!started || done || lock) return;

    // Guided: only the two highlighted tiles are interactive, in order.
    if (selected === null) {
      if (i !== A) return;
      setSelected(i);
      return;
    }
    if (i !== B) {
      // re-pick the first tile only
      if (i === A) setSelected(A);
      return;
    }

    // Perform the swap A <-> B, then clear the matched top row.
    setLock(true);
    const swappedBoard = board.slice();
    const t = swappedBoard[A];
    swappedBoard[A] = swappedBoard[B];
    swappedBoard[B] = t;
    setBoard(swappedBoard);
    setSelected(null);

    window.setTimeout(() => {
      // top row indices 0,1,2 now all 💖
      setClearing([0, 1, 2]);
      window.setTimeout(() => {
        setClearing([]);
        setDone(true);
        setLock(false);
      }, 420);
    }, 260);
  }

  const hintIdx = !started || done ? -1 : selected === null ? A : B;

  return (
    <section className="screen" style={{ justifyContent: "flex-start", paddingTop: 6 }}>
      <div className="panel how" style={{ paddingBottom: 18 }}>
        <h2>Interactive tutorial</h2>
        <div className="coach">
          <strong>{coach.title}</strong>
          <p>{coach.body}</p>
        </div>
      </div>

      <div className="board-wrap" style={{ flex: "none" }}>
        <div
          className="tile-grid"
          style={{ ["--cols" as string]: SIZE, maxWidth: 260 } as React.CSSProperties}
        >
          {board.map((icon, i) => (
            <Tile
              key={i}
              icon={icon}
              selected={selected === i}
              clearing={clearing.includes(i)}
              hint={hintIdx === i}
              onClick={() => handleTap(i)}
            />
          ))}
        </div>
      </div>

      <div className="tutorial-dots" aria-hidden>
        <span className={started ? "on" : ""} />
        <span className={selected !== null || done ? "on" : ""} />
        <span className={done ? "on" : ""} />
      </div>

      {!started ? (
        <button className="btn btn-primary" onClick={() => setStarted(true)}>
          Begin →
        </button>
      ) : done ? (
        <button className="btn btn-primary" onClick={onDone}>
          Start playing 💘
        </button>
      ) : (
        <button className="btn btn-ghost" onClick={onDone}>
          Skip tutorial
        </button>
      )}
    </section>
  );
}
