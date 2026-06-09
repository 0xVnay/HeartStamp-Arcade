"use client";

import { ICONS } from "@/lib/game";

/**
 * A flipping postcard. Face-down shows a HeartStamp "stamp" back; face-up
 * reveals an icon. `flipped` is true while revealed or matched.
 */
export default function Card({
  icon,
  flipped,
  matched,
  hint,
  onClick,
}: {
  icon: number;
  flipped: boolean;
  matched: boolean;
  /** Tutorial-only attention pulse. */
  hint?: boolean;
  onClick: () => void;
}) {
  const ic = ICONS[icon];
  return (
    <button
      className={`card${flipped ? " flipped" : ""}${matched ? " matched" : ""}${
        hint ? " hint" : ""
      }`}
      onClick={onClick}
      aria-label={flipped ? ic.name : "face-down card"}
    >
      <span className="card-inner">
        <span className="card-face card-back" aria-hidden>
          <span className="stamp-mark">♥</span>
        </span>
        <span className="card-face card-front" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ic.img} alt="" className="card-icon" draggable={false} />
        </span>
      </span>
    </button>
  );
}
