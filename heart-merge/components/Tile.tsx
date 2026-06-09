"use client";

import { PosTile, tierInfo } from "@/lib/game";

/**
 * A single positioned board tile. It is absolutely placed via CSS custom props
 * (--r/--c) over a percentage grid, so changing r/c animates a smooth slide via
 * `transition: transform`. `merged` plays a bounce, `spawned` plays a pop.
 * Per-tier color comes from the `data-tier` attribute (palette lives in CSS).
 */
export default function Tile({ tile, size }: { tile: PosTile; size: number }) {
  const info = tierInfo(tile.tier);
  const cls = ["tile"];
  if (tile.merged) cls.push("pop-merge");
  if (tile.spawned) cls.push("pop-spawn");
  return (
    <div
      className={cls.join(" ")}
      data-tier={tile.tier}
      aria-label={`${info.name}, tier ${tile.tier}`}
      style={
        {
          "--r": tile.r,
          "--c": tile.c,
          "--n": size,
        } as React.CSSProperties
      }
    >
      <span className="tile-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={info.img} alt="" className="tile-icon" draggable={false} />
        <span className="tile-name">{info.name}</span>
        <span className="tile-tier">{tile.tier}</span>
      </span>
    </div>
  );
}
