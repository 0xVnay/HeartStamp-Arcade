# Cupid's Match 💘

A juicy **match-3 swap puzzle** reskinned for [HeartStamp](https://heartstamp.com/). Swap two
adjacent love-icons to line up three or more, trigger cascading chain reactions, and hit the score
goal before your moves run out. Designed to be played in short bursts on a phone — for example,
while a HeartStamp greeting-card image is generating.

Part of the HeartStamp casual-games portfolio. Sibling projects: **Stampy Pairs**, **Love Lab
Sort**, **Real Moments Trivia**.

## Highlights

- **Real HeartStamp brand styling** — warm cream paper background, stamp-red chrome, postal-orange
  accents, warm-charcoal ink, and a mint/teal secondary. Greeting-card / postal motifs throughout:
  perforated stamp edges on the board frame and level tiles, a faint "HEARTSTAMP" postmark, and warm
  paper shadows. Typeset in **Hanken Grotesk** with **Caveat** handwritten accents.
- **Real Lottie animations** — self-contained, programmatically-built Lottie JSON (no external
  files), loaded via `next/dynamic` with `ssr:false`: a **win/level-up burst** of expanding rings +
  radiating dots, and a **"sealed with a stamp" heart-burst** flourish on clearing a level. Both
  brand-coloured and gated by `prefers-reduced-motion`.
- **Levels & progression** — a 12-level curve that ramps grid size (6→7→8), icon variety (4→6),
  move budget, and score goal. A **level-select** on the menu shows locked/unlocked levels with
  earned 1–3 stars; the HUD shows the current level beside a goal progress bar. Highest level
  unlocked and per-level stars/best score persist in `localStorage`.
- **Juicy clear / cascade + falling animation** — cleared tiles pop with a heart-particle burst,
  surviving tiles play a real **falling animation** (CSS `translateY`, distance-aware) as they drop
  into gaps, fresh icons fall in from above, a rising **combo banner** celebrates cascades, selected
  tiles wobble, and "+score" floats drift up. Cascades stack a rising multiplier with 4+/5+ bonuses.
- **Sound + haptics** — a tiny WebAudio SFX util (`lib/sfx.ts`, no audio files) plays short pleasant
  tones for select/swap/clear/cascade/level-up/win, with **rising pitch per cascade step**. A mute
  toggle in the topbar persists in `localStorage`. `navigator.vibrate` haptics fire on
  select/swap/clear/cascade/level-up/win, guarded for support and silenced under reduced-motion or
  when muted.
- **Micro-animations** — animated (tweened) score counter, button squash, smooth screen-enter
  transitions, and a goal bar that fills mint → gold at 100%.
- **Interactive tutorial** — a guided, hands-on mini-board where you make one real swap-and-match.
- **Fair boards** — every board is generated with no pre-existing matches and at least one valid
  move; the board softly reshuffles if it ever runs out of moves.
- **Forgiving swaps** — a swap that makes no match animates back and costs you nothing.
- **localStorage resume** — reload mid-round and pick up exactly where you left off (now level-aware,
  `cupids-match.v2` with a safe fallback from the old shape).
- **HeartStamp reward callbacks** — `onScore`, `onMilestone` (incl. the new **`"level-up"`**
  milestone), `onRoundEnd` with a level-aware `RoundSummary`.

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
  onMilestone(event) {},   // { type, label, value } — type incl. "match" | "combo" | "level-up" | ...
  onRoundEnd(summary) {},  // level-aware RoundSummary in lib/heartstamp.ts
};
```

If no host is present, the callbacks fall back to console logging so the integration points stay
visible. See [`lib/heartstamp.ts`](lib/heartstamp.ts).

## Project layout

```
app/                     Next.js App Router (layout, global styles, page)
components/              Game, Tile, Tutorial, FloatingHearts, Confetti, LottieCelebration
lib/game.ts             Board generation, matching, gravity/refill, cascades, scoring, levels
lib/heartstamp.ts       Reward callbacks + level-aware localStorage persistence
lib/sfx.ts              WebAudio SFX + guarded haptics
lib/celebrationData.ts  Programmatic Lottie JSON (win burst + level-up heart-burst)
```

## Deploy

Deploys as a standard Next.js app — free on **Vercel**, **Netlify**, or **Cloudflare Pages**. Each
HeartStamp game is its own deployable project.

## License & source

Original implementation — the match-3 swap mechanic is a generic, widely-used game design, but this
code was written fresh for HeartStamp and is freely reusable (MIT-style). No third-party or
GPL-licensed code is included.
