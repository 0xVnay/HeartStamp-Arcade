"use client";

import { useMemo, useState } from "react";
import { Beakers, canPour, pour } from "@/lib/game";
import Beaker from "./Beaker";

/**
 * Interactive, hands-on tutorial. Instead of just telling the player the rules,
 * it hands them a tiny pre-baked board and guides each tap with live highlights
 * and reactive coaching text. Two guided pours fully solve it.
 *
 * Board (bottom -> top), colors: 0 = Rose, 1 = Lavender
 *   A: [Rose, Rose]            (index 0)
 *   B: [Lav, Lav, Rose, Rose]  (index 1) — top run is 2 Roses
 *   C: [Lav, Lav]              (index 2)
 * Step 1: pour B's 2 Roses onto A  -> A = full Rose,  B = [Lav, Lav]
 * Step 2: pour C's 2 Lavs onto B   -> B = full Lav,   C = empty  => SOLVED
 */
const START: Beakers = [
  [0, 0],
  [1, 1, 0, 0],
  [1, 1],
];

type Phase = "intro" | "step1" | "step2" | "done";

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [beakers, setBeakers] = useState<Beakers>(START.map((b) => b.slice()));
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");

  // Which beaker should glow to guide the next correct tap.
  const guide = useMemo<{ pick: number; drop: number } | null>(() => {
    if (phase === "step1") return { pick: 1, drop: 0 };
    if (phase === "step2") return { pick: 2, drop: 1 };
    return null;
  }, [phase]);

  const highlightIdx =
    guide && selected === null ? guide.pick : guide && selected === guide.pick ? guide.drop : null;

  const coach = useMemo(() => {
    switch (phase) {
      case "intro":
        return {
          title: "Let's pour together",
          body: "Each beaker is a stack of potion. You move the top color from one beaker to another. Tap Begin to try it.",
        };
      case "step1":
        return selected === null
          ? {
              title: "Step 1 — pick up a color",
              body: "Tap the glowing beaker to lift its top potion (the Rose on top).",
            }
          : {
              title: "Step 1 — now pour",
              body: "Tap the glowing beaker. Rose pours onto Rose — matching colors stack.",
            };
      case "step2":
        return selected === null
          ? {
              title: "Step 2 — finish the sort",
              body: "Now the Rose jar is full. Tap the glowing jar to lift its Lavender.",
            }
          : {
              title: "Step 2 — pour to win",
              body: "Pour Lavender onto Lavender to fill that jar. Every jar one shade — solved!",
            };
      case "done":
        return {
          title: "That's the whole game 💖",
          body: "Match colors (or pour into an empty jar) until each jar holds a single shade. Fewer moves earn more credits.",
        };
    }
  }, [phase, selected]);

  function handleTap(idx: number) {
    if (phase === "intro" || phase === "done") return;
    if (!guide) return;

    if (selected === null) {
      // Only allow picking the guided beaker, to keep the lesson on rails.
      if (idx === guide.pick && beakers[idx].length) setSelected(idx);
      return;
    }
    if (idx === selected) {
      setSelected(null);
      return;
    }
    if (idx === guide.drop && canPour(beakers[selected], beakers[idx])) {
      const next = pour(beakers, selected, idx);
      setBeakers(next);
      setSelected(null);
      if (phase === "step1") setPhase("step2");
      else if (phase === "step2") setPhase("done");
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

      <div className="beaker-area" style={{ flex: "none", padding: "10px 6px 6px" }}>
        {beakers.map((b, i) => (
          <Beaker
            key={i}
            segments={b}
            selected={selected === i}
            pourable={false}
            highlight={highlightIdx === i}
            onClick={() => handleTap(i)}
          />
        ))}
      </div>

      <div className="tutorial-dots" aria-hidden>
        <span className={phase !== "intro" ? "on" : ""} />
        <span className={phase === "step2" || phase === "done" ? "on" : ""} />
        <span className={phase === "done" ? "on" : ""} />
      </div>

      {phase === "intro" ? (
        <button className="btn btn-primary" onClick={() => setPhase("step1")}>
          Begin →
        </button>
      ) : phase === "done" ? (
        <button className="btn btn-primary" onClick={onDone}>
          Start playing 🧪
        </button>
      ) : (
        <button className="btn btn-ghost" onClick={onDone}>
          Skip tutorial
        </button>
      )}
    </section>
  );
}
