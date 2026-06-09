"use client";

import { CAPACITY, POTIONS } from "@/lib/game";

/**
 * A romantic glass potion jar.
 *
 * Layered so the liquid clip never hides the glass rim or the gold pour-ring:
 *   .jar-slot  — outer, NOT clipped — owns the lift transform, hint ring, and rim
 *     .jar     — glass body, overflow:hidden lives here so liquid stays inside
 *       .liquid — column-reverse stack of segments (bottom seg matches the curved base)
 *       .jar-gloss — diagonal shine streak over the glass
 */
export default function Beaker({
  segments,
  selected,
  pourable,
  onClick,
  highlight,
  shake,
}: {
  segments: number[];
  selected: boolean;
  pourable: boolean;
  onClick: () => void;
  /** Tutorial-only: draw an attention ring even when nothing is selected. */
  highlight?: boolean;
  /** Wobble to signal an invalid pour target. */
  shake?: boolean;
}) {
  const showRing = pourable || highlight;
  return (
    <button
      className={`jar-slot${selected ? " selected" : ""}${showRing ? " pourable" : ""}${
        shake ? " shake" : ""
      }`}
      onClick={onClick}
      aria-label={`Potion jar with ${segments.length} of ${CAPACITY} potions`}
    >
      <span className="jar-ring" aria-hidden />
      <span className="jar-rim" aria-hidden />
      <span className="jar">
        <span className="liquid">
          {segments.map((color, i) => {
            const potion = POTIONS[color];
            const isTop = i === segments.length - 1;
            const isBottom = i === 0;
            return (
              <span
                key={i}
                className={`seg${isTop ? " top" : ""}${isBottom ? " bottom" : ""}`}
                style={{ background: `linear-gradient(180deg, ${potion.from}, ${potion.to})` }}
              >
                {isTop && selected ? <span className="heart-cap">♥</span> : null}
              </span>
            );
          })}
        </span>
        <span className="jar-gloss" aria-hidden />
      </span>
    </button>
  );
}
