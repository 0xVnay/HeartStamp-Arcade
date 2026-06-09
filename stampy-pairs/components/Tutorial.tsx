"use client";

import { useMemo, useState } from "react";
import { Card as CardT } from "@/lib/game";
import Card from "./Card";

/**
 * Hands-on tutorial: a 2×2 board the player actually solves. Taps are guided in
 * a fixed order [0,2,1,3] so each pair matches — teaching flip, match, and "a
 * matched pair stays up" without any chance of a confusing mismatch.
 */
const DECK: CardT[] = [
  { key: 0, icon: 0 }, // 💌
  { key: 1, icon: 1 }, // 💖
  { key: 2, icon: 0 }, // 💌
  { key: 3, icon: 1 }, // 💖
];
const ORDER = [0, 2, 1, 3];

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [ptr, setPtr] = useState(0);
  const [started, setStarted] = useState(false);
  const [lock, setLock] = useState(false);

  const done = matched.length === DECK.length;
  const nextIdx = started && !done ? ORDER[ptr] : -1;

  const coach = useMemo(() => {
    if (!started)
      return {
        title: "Find the pairs",
        body: "Flip two postcards at a time. If the icons match, they stay face-up. Tap Begin to try.",
      };
    if (done)
      return {
        title: "You've got it 💖",
        body: "Match every pair with as few flips as possible. Fewer moves and a quick clear earn more stars and credits.",
      };
    if (matched.length === 0 && flipped.length === 0)
      return { title: "Flip a card", body: "Tap the glowing postcard to reveal its icon." };
    if (flipped.length === 1)
      return { title: "Now its match", body: "Tap the other glowing card — same icon makes a pair." };
    if (matched.length === 2)
      return { title: "A match! 🎉", body: "Matched cards stay up. Now find the last pair." };
    return { title: "Keep going", body: "Flip the remaining cards to clear the board." };
  }, [started, done, matched.length, flipped.length]);

  function handleTap(i: number) {
    if (!started || done || lock) return;
    if (i !== ORDER[ptr]) return; // guided: only the highlighted card
    if (flipped.includes(i) || matched.includes(i)) return;

    const nf = [...flipped, i];
    setFlipped(nf);
    setPtr((p) => p + 1);

    if (nf.length === 2) {
      setLock(true);
      const [a, b] = nf;
      const isMatch = DECK[a].icon === DECK[b].icon;
      window.setTimeout(() => {
        if (isMatch) setMatched((m) => [...m, a, b]);
        setFlipped([]);
        setLock(false);
      }, 420);
    }
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
        <div className="card-grid" style={{ ["--cols" as string]: 2, maxWidth: 230 } as React.CSSProperties}>
          {DECK.map((c, i) => (
            <Card
              key={c.key}
              icon={c.icon}
              flipped={flipped.includes(i) || matched.includes(i)}
              matched={matched.includes(i)}
              hint={nextIdx === i}
              onClick={() => handleTap(i)}
            />
          ))}
        </div>
      </div>

      <div className="tutorial-dots" aria-hidden>
        <span className={started ? "on" : ""} />
        <span className={matched.length >= 2 ? "on" : ""} />
        <span className={done ? "on" : ""} />
      </div>

      {!started ? (
        <button className="btn btn-primary" onClick={() => setStarted(true)}>
          Begin →
        </button>
      ) : done ? (
        <button className="btn btn-primary" onClick={onDone}>
          Start playing 🃏
        </button>
      ) : (
        <button className="btn btn-ghost" onClick={onDone}>
          Skip tutorial
        </button>
      )}
    </section>
  );
}
