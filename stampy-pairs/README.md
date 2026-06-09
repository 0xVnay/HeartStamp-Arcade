# Stampy Pairs 🃏💖

A cozy **memory-matching game** for [HeartStamp](https://heartstamp.com/). Flip the postcards two
at a time to pair up HeartStamp's icons — love letters, roses, rings, cakes and more. Built to fill
a short wait (like while a greeting-card image is generating) on a phone.

Part of the HeartStamp casual-games portfolio. Sibling projects: **Love Lab Sort**, **Real Moments
Trivia**.

## Highlights

- **Mobile-first** responsive card grid with a satisfying **3D postcard flip**.
- **Difficulty modes** — Easy (3×4 · 6 pairs), Medium (4×4 · 8 pairs), Hard (4×6 · 12 pairs).
- **Moves + time + stars** scoring (1–3 ⭐), score and credits.
- **Interactive tutorial** — a guided 2×2 board you actually solve.
- **Celebrations** — a Lottie burst, full-screen heart confetti, and animated stars on a win.
- **Floating-hearts backdrop** and reduced-motion support.
- **localStorage** per-mode best score/moves/time/stars, total credits, and **mid-game resume**.
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

Without a host, the callbacks log to the console so the integration points stay visible. See
[`lib/heartstamp.ts`](lib/heartstamp.ts).

## Project layout

```
app/                 Next.js App Router (layout, global styles, page)
components/          Game, Card, Tutorial, FloatingHearts, Confetti, LottieCelebration
lib/game.ts          Difficulty modes, deck build/shuffle, stars + scoring
lib/heartstamp.ts    Reward callbacks + localStorage persistence
lib/celebrationData.ts  Bundled Lottie celebration (rings + dots)
```

### Changing the icons

Edit the `ICONS` array in `lib/game.ts`. You need at least as many distinct icons as the largest
mode's pair count (12 for Hard).

## Deploy

Deploys as a standard Next.js app — free on **Vercel**, **Netlify**, or **Cloudflare Pages**. Each
HeartStamp game is its own deployable project.

## License & source

Original implementation, written fresh for HeartStamp and freely reusable (MIT-style). No
third-party or GPL-licensed game code is included; `lottie-react` is MIT.

Card artwork is **Microsoft Fluent Emoji Flat**, MIT licensed — bundled under `public/fluent-icons/`.
No attribution is required, but credit is given here. Source:
https://github.com/microsoft/fluentui-emoji
