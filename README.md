# HeartStamp Arcade 🎮

The four finalized casual web games for HeartStamp, plus a lightweight portfolio
showcase page. The games are small, mobile-first arcade experiences to play during
the short wait while a greeting-card image generates. Each is a standalone
**Next.js 15 / React 19 / TypeScript** app with the same HeartStamp integration
conventions (reward callbacks, localStorage resume, levels, Lottie).

## The games — by category

| Folder | Game | Category | Open-source base |
|---|---|---|---|
| `heart-merge/` | **Heart Merge** | Block / merge puzzle | 2048 (MIT, Gabriele Cirulli) |
| `stampy-pairs/` | **Stampy Pairs** | Memory match | classic flip-pairs |
| `love-lab-sort/` | **Love Lab Sort** | Color-sort puzzle | water/potion sort |
| `cupids-match/` | **Cupid's Match** | Match-3 | original implementation |

## Showcase

| Folder | Purpose |
|---|---|
| `portfolio/` | Cover-letter style showcase site that links to the four deployed games |

## Shared conventions (all four)

- **Reward hooks:** `window.heartstamp.onScore` · `onMilestone` (incl. `level-up`) · `onRoundEnd`
- **Persistence:** localStorage best scores, credits, mid-game resume, per-level stars
- **Levels:** difficulty progression with a level-select on the menu
- **Polish:** self-contained Lottie celebrations (SSR-off), WebAudio SFX + mute toggle, haptics, reduced-motion support
- **Mobile-first** responsive layouts

## Run any game

```bash
cd heart-merge      # or stampy-pairs / love-lab-sort / cupids-match
npm install
npm run dev         # http://localhost:3000
npm run build       # production build (all four pass clean)
```

## Deploy from one GitHub repo

Create separate Vercel projects from this same repository and set the project
root directory for each deploy:

| Vercel project | Root directory |
|---|---|
| HeartStamp Arcade Portfolio | `portfolio` |
| Heart Merge | `heart-merge` |
| Stampy Pairs | `stampy-pairs` |
| Love Lab Sort | `love-lab-sort` |
| Cupid's Match | `cupids-match` |

After the four games are live, paste their deployed URLs into
`portfolio/site.config.ts` (`playUrl` for each game) and redeploy the portfolio.

## Assets for swapping icons

- `_icon-kit-fluent-flat/` — 25 **Microsoft Fluent Emoji (Flat)** SVGs (MIT license,
  no attribution required), a "warm celebration mix" vocabulary (gift, star, cake,
  balloon, flowers, sparkles, ribbon, candy, hearts, …) ready to drop into each
  game's `public/` and wire up in place of the system emojis.
- `HEARTSTAMP_BRAND.md` — brand tokens pulled from heartstamp.com (cream `#FCFAF7`,
  stamp-red `#BF2031`, postal-orange `#F25A29`, ink `#242423`; fonts Hanken Grotesk
  + Caveat).
