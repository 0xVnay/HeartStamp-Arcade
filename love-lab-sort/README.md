# Love Lab Sort 🧪💖

A cozy **color-sort puzzle** reskinned for [HeartStamp](https://heartstamp.com/). Pour love
potions between beakers until each beaker holds a single shade. Designed to be played in short
bursts on a phone — for example, while a HeartStamp greeting-card image is generating.

Part of the HeartStamp casual-games portfolio. Sibling project: **Real Moments Trivia**.

## Highlights

- **Mobile-first** single-column layout, tap-to-pour controls, safe-area aware.
- **Interactive tutorial** — a guided, hands-on mini-board teaches the rules by doing, not just
  telling.
- **Guaranteed-solvable levels** — every board is generated and verified solvable by a DFS solver
  before it's shown.
- **Difficulty curve** — colors and empty beakers scale with level.
- **Score, credits, and best-moves** tracking with a results screen.
- **localStorage resume** — reload mid-level and pick up exactly where you left off.
- **Undo / restart** controls.
- **HeartStamp reward callbacks** — `onScore`, `onMilestone`, `onRoundEnd`.

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
  onMilestone(event) {},   // { type, label, value }
  onRoundEnd(summary) {},  // see RoundSummary in lib/heartstamp.ts
};
```

If no host is present, the callbacks fall back to console logging so the integration points stay
visible. See [`lib/heartstamp.ts`](lib/heartstamp.ts).

## Project layout

```
app/            Next.js App Router (layout, global styles, page)
components/     Game, Beaker, Tutorial (client components)
lib/game.ts     Puzzle rules, solvable level generation, scoring
lib/heartstamp.ts  Reward callbacks + localStorage persistence
```

## Deploy

Deploys as a standard Next.js app — free on **Vercel**, **Netlify**, or **Cloudflare Pages**. Each
HeartStamp game is its own deployable project.

## License & source

Original implementation — the color-sort mechanic is a classic genre, but this code was written
fresh for HeartStamp and is freely reusable (MIT-style). No GPL-licensed code is included.
