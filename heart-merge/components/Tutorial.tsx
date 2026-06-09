"use client";

import { useMemo, useState } from "react";
import { Board, PosTile, movePos, tilesFromBoard } from "@/lib/game";
import Tile from "./Tile";

/**
 * Hands-on tutorial: a tiny 2×2 board the player actually merges. A row of two
 * tier-1 sparks is pre-placed; one guided swipe (left) merges them into a tier-2
 * crush, teaching "swipe to slide, identical tokens merge into the next tier".
 */
function startBoard(): Board {
  return [
    [1, 1],
    [0, 0],
  ];
}

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [tiles, setTiles] = useState<PosTile[]>(() => tilesFromBoard(startBoard()));
  const [step, setStep] = useState(0); // 0 = before swipe, 1 = merged once, 2 = done
  const [started, setStarted] = useState(false);

  const done = step >= 2;

  const coach = useMemo(() => {
    if (!started)
      return {
        title: "Swipe to merge",
        body: "Tiles slide as far as they can. When two identical love-tokens collide, they merge into the next tier. Tap Begin to try.",
      };
    if (step === 0)
      return {
        title: "Swipe left ←",
        body: "Tap the glowing arrow (or swipe left) to slide the two ✨ Sparks together.",
      };
    if (step === 1)
      return {
        title: "They leveled up 💗",
        body: "Two Sparks became one Crush. Swipe again to feel it once more, then start playing.",
      };
    return {
      title: "You've got it 💌",
      body: "Keep merging to climb the romance ladder. Clear each level's target tier for a milestone — and a big credit payout.",
    };
  }, [started, step]);

  function doSwipe() {
    if (!started || done) return;
    const res = movePos(tiles, 2, "left");
    if (!res.moved) return;
    // settle ghosts into survivors
    const survivors = res.tiles
      .filter((t, i) => res.tiles.findIndex((o) => o.r === t.r && o.c === t.c && o.tier >= t.tier) === i)
      .map((t) => ({ ...t, fromR: t.r, fromC: t.c, merged: false, spawned: false }));
    setTiles(survivors);
    setStep((s) => s + 1);
  }

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
          className="board"
          style={{ ["--size" as string]: 2, maxWidth: 220 } as React.CSSProperties}
        >
          <div className="board-cells" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="cell" key={i} />
            ))}
          </div>
          {tiles.map((t) => (
            <Tile key={t.id} tile={t} size={2} />
          ))}
        </div>
      </div>

      {started && !done && (
        <button className="swipe-coach" onClick={doSwipe} aria-label="Swipe left">
          <span className="swipe-arrow">←</span> Swipe left
        </button>
      )}

      <div className="tutorial-dots" aria-hidden>
        <span className={started ? "on" : ""} />
        <span className={step >= 1 ? "on" : ""} />
        <span className={done ? "on" : ""} />
      </div>

      {!started ? (
        <button className="btn btn-primary" onClick={() => setStarted(true)}>
          Begin →
        </button>
      ) : done ? (
        <button className="btn btn-primary" onClick={onDone}>
          Start playing 💌
        </button>
      ) : (
        <button className="btn btn-ghost" onClick={onDone}>
          Skip tutorial
        </button>
      )}
    </section>
  );
}
