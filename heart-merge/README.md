# Heart Merge ❤️💌

A warm, greeting-card **swipe-merge puzzle** for [HeartStamp](https://heartstamp.com/). Slide the
love-tokens across the board — when two identical tokens collide they merge into the next romance
tier, climbing from a tiny ✨ Spark all the way to 💖 Forever. Designed to be played in short
bursts on a phone — for example, while a HeartStamp greeting-card image is generating.

Part of the HeartStamp casual-games portfolio. Sibling project: **Stampy Pairs**.

## Highlights

- **Real HeartStamp brand styling** — warm cream paper (`#FCFAF7`), stamp-red brand (`#BF2031`),
  postal-orange accent (`#F25A29`), warm-charcoal ink, kraft/tan secondary, plus this game's own
  lavender/plum (`#7B4EA8`) tile family. Hanken Grotesk + Caveat fonts, perforated stamp edges on
  the board frame and brand mark, a faint postmark wash, and soft warm paper shadows.
- **Levels / progression** — a 9-level ladder that ramps the target tier from 💌 Love note → 🌹
  Rose → … → 💍 The Ring → 🎂 Big Day → 💖 Forever, layering in a little starting clutter as it
  climbs. The menu has a **level-select** (locked/unlocked + per-level stars); the HUD shows the
  current level, its target tier, and a **goal progress bar**. Clearing a level fires a new
  `"level-up"` milestone and unlocks the next, with a **Next level →** button.
- **Real Lottie animations** — programmatic, self-contained Lottie JSON in HeartStamp colors
  (`lib/celebrationData.ts`), loaded via `next/dynamic` (`ssr:false`): a **win burst** on the
  results overlay and a **"sealed with a stamp"** heart-burst level-up flourish on the board.
- **Smooth slide + merge animation** — tiles are absolutely positioned and animate their CSS
  `transform` from old cell to new cell (real sliding), with a **merge bounce/scale-pop**, a
  **spawn pop** for new tiles, a drifting **+score float** on merges, and an animated (tweened)
  score counter.
- **Sound + haptics** — a tiny WebAudio SFX util (`lib/sfx.ts`, no audio files) plays short
  pleasant tones for move/merge/level-up/win/game-over, with a **mute toggle** in the topbar
  (persisted). Light `navigator.vibrate` haptics, guarded for support and disabled when muted or
  under reduced motion.
- **Mobile-first** — single-column layout, swipe controls _and_ arrow keys, safe-area aware. The
  board uses `touch-action: none` so swiping never scrolls the page.
- **Three board feels** — Cozy (roomy 5×5), Sweet (4×4 classic), and Spicy (4×4 tight, fastest
  payout). Modes set the grid/feel; the level sets the target-tier ramp.
- **localStorage resume** — reload mid-game and the full board, score, level, and mode pick up
  exactly where you left off (storage key `heart-merge.v2`, with safe fallback from `v1`).
- **HeartStamp reward callbacks** — `onScore`, `onMilestone` (incl. `"combo"` and `"level-up"`),
  `onRoundEnd`.
- **Respects `prefers-reduced-motion`** — big motion (slides, Lottie energy, background hearts) is
  gated; haptics and SFX are disabled.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start   # production
```

Requires Node 18+ (developed on Node 22).

## HeartStamp integration

The host page can wire up reward callbacks by setting `window.heartstamp` before the game loads:

```js
window.heartstamp = {
  onScore(score) {},
  onMilestone(event) {},   // { type, label, value } — combo / level-up / round-complete / perfect / best-score / credit-threshold
  onRoundEnd(summary) {},  // RoundSummary { game:"heart-merge", level, ... } — see lib/heartstamp.ts
};
```

If no host is present, the callbacks fall back to console logging so the integration points stay
visible. See [`lib/heartstamp.ts`](lib/heartstamp.ts).

## Project layout

```
app/                    Next.js App Router (layout w/ fonts, global styles, page)
components/             Game, Tile (slide), Tutorial, ScoreCounter,
                        LottieCelebration, FloatingHearts, Confetti (client components)
lib/game.ts             Modes, tier table, levels, board + move/merge + positioned-tile slide logic
lib/heartstamp.ts       Reward callbacks + localStorage persistence (levels, stars, mute)
lib/celebrationData.ts  Self-contained Lottie JSON (win burst + level-up flourish)
lib/sfx.ts              WebAudio sound effects (no external files)
lib/haptics.ts          navigator.vibrate helpers
```

## Deploy

Deploys as a standard Next.js app — free on **Vercel**, **Netlify**, or **Cloudflare Pages**. Each
HeartStamp game is its own deployable project.

## License & source

The 2048 sliding-merge mechanic was popularized by **2048 by Gabriele Cirulli**, which is released
under the **MIT License**. This project is an **original reskin / reimplementation** — none of the
original 2048 source is included; the board, merge, scoring, and UI code were written fresh for
HeartStamp and are freely reusable (MIT-style). No GPL-licensed code is included.
