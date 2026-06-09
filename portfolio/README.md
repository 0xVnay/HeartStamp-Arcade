# HeartStamp Games — Portfolio 💌

A warm "Par Avion" showcase site for the HeartStamp casual-games work — hero pitch, the games as
collectible postage stamps, a cover-note, résumé download, and contact links.

## Make it yours

Everything you need to edit lives in **one file**: [`site.config.ts`](site.config.ts).

1. Replace each `TODO:` — your name, LinkedIn, GitHub, the cover-note text, and the live game URLs
   once deployed.
2. Drop your résumé at **`public/resume.pdf`** (a placeholder is included — replace it).
3. Game screenshots live in `public/shots/` (regenerate anytime — see below).

The entire look is driven by CSS variables at the top of [`app/globals.css`](app/globals.css)
(`:root { … }`) — change the palette/fonts there to reskin without touching markup.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start
```

## Refreshing game screenshots

With a game's dev server running, capture a mobile screenshot with headless Chrome:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=390,780 --virtual-time-budget=3500 \
  --screenshot=public/shots/<slug>.png http://localhost:<port>
```

## Tech

Next.js (App Router) · TypeScript · CSS (no UI framework). Fonts: Fraunces / Quicksand / Caveat.

## Deploy

Its own deployable Next.js project — free on Vercel / Netlify / Cloudflare Pages, like each game.
