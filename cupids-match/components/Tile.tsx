"use client";

import { ICONS } from "@/lib/game";

/**
 * A single board tile showing a love-icon.
 * - `selected` highlights the picked tile (wobble).
 * - `clearing` plays the juicy pop + heart-particle burst.
 * - `hint` pulses for the tutorial.
 * - `fall` is the number of rows this tile just dropped; the tile renders
 *   pre-shifted up by that many rows and CSS animates it down to settle —
 *   a real falling animation rather than a bare re-render.
 */
export default function Tile({
  icon,
  selected,
  clearing,
  hint,
  fall = 0,
  onClick,
}: {
  icon: number;
  selected: boolean;
  clearing: boolean;
  hint?: boolean;
  fall?: number;
  onClick: () => void;
}) {
  const ic = ICONS[icon];
  const style =
    fall > 0
      ? ({ ["--fall" as string]: String(fall) } as React.CSSProperties)
      : undefined;
  return (
    <button
      className={`tile${selected ? " selected" : ""}${clearing ? " clearing" : ""}${
        hint ? " hint" : ""
      }${fall > 0 ? " falling" : ""}`}
      onClick={onClick}
      style={style}
      aria-label={ic?.name ?? "tile"}
    >
      <span className="tile-face" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ic?.img} alt="" className="tile-icon" draggable={false} />
      </span>
      {clearing && (
        <span className="pop-burst" aria-hidden>
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      )}
    </button>
  );
}
