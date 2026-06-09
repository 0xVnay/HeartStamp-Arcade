/**
 * Self-contained Lottie animations in the HeartStamp palette, built
 * programmatically so the JSON is always well-formed (no external files/URLs).
 *
 *  - `winData`     : a celebratory burst (expanding rings + radiating dots) for
 *                    the results overlay, in stamp-red / postal-orange / kraft.
 *  - `levelUpData` : a "sealed with a stamp" flourish — a heart that pops in
 *                    with a ring of sparks — shown when a level/target is cleared.
 *
 * Rendered by components/LottieCelebration.tsx via next/dynamic ssr:false.
 */

const OP = 80; // animation length in frames
const CENTER: [number, number, number] = [120, 120, 0];

// HeartStamp brand colors as Lottie [r,g,b,a] (0..1)
const STAMP_RED = [0.749, 0.125, 0.192, 1]; // #BF2031
const POSTAL_ORANGE = [0.949, 0.353, 0.161, 1]; // #F25A29
const KRAFT = [0.769, 0.604, 0.424, 1]; // #C49A6C
const PLUM = [0.482, 0.306, 0.659, 1]; // #7B4EA8

function ring(ind: number, st: number, color: number[], maxScale: number) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: `ring${ind}`,
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 0, s: [0] },
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 5, s: [85] },
          { t: 50, s: [0] },
        ],
      },
      r: { a: 0, k: 0 },
      p: { a: 0, k: CENTER },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1,
        k: [
          {
            i: { x: [0.15, 0.15, 0.15], y: [1, 1, 1] },
            o: { x: [0.4, 0.4, 0.4], y: [0, 0, 0] },
            t: 0,
            s: [0, 0, 100],
          },
          { t: 56, s: [maxScale, maxScale, 100] },
        ],
      },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        nm: "g",
        it: [
          { ty: "el", d: 1, s: { a: 0, k: [70, 70] }, p: { a: 0, k: [0, 0] }, nm: "e" },
          {
            ty: "st",
            c: { a: 0, k: color },
            o: { a: 0, k: 100 },
            w: { a: 0, k: 7 },
            lc: 2,
            lj: 1,
            ml: 4,
            bm: 0,
            nm: "s",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
          },
        ],
      },
    ],
    ip: 0,
    op: OP,
    st,
    bm: 0,
  };
}

function dot(ind: number, angleDeg: number, color: number[], st: number, radius = 86) {
  const rad = (angleDeg * Math.PI) / 180;
  const end: [number, number, number] = [120 + radius * Math.cos(rad), 120 + radius * Math.sin(rad), 0];
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: `dot${ind}`,
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 0, s: [0] },
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 7, s: [100] },
          { t: 46, s: [0] },
        ],
      },
      r: { a: 0, k: 0 },
      p: {
        a: 1,
        k: [
          { i: { x: [0.1], y: [1] }, o: { x: [0.5], y: [0] }, t: 0, s: CENTER },
          { t: 50, s: end },
        ],
      },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1,
        k: [
          {
            i: { x: [0.2, 0.2, 0.2], y: [1, 1, 1] },
            o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] },
            t: 0,
            s: [40, 40, 100],
          },
          {
            i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] },
            o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] },
            t: 14,
            s: [120, 120, 100],
          },
          { t: 50, s: [55, 55, 100] },
        ],
      },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        nm: "g",
        it: [
          { ty: "el", d: 1, s: { a: 0, k: [16, 16] }, p: { a: 0, k: [0, 0] }, nm: "e" },
          { ty: "fl", c: { a: 0, k: color }, o: { a: 0, k: 100 }, r: 1, bm: 0, nm: "f" },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
    ip: 0,
    op: OP,
    st,
    bm: 0,
  };
}

/* ------------------------------ WIN burst --------------------------------- */

const winDotColors = [STAMP_RED, POSTAL_ORANGE, KRAFT];
const winDots = [0, 45, 90, 135, 180, 225, 270, 315].map((ang, i) =>
  dot(20 + i, ang, winDotColors[i % winDotColors.length], 4)
);

export const winData = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: OP,
  w: 240,
  h: 240,
  nm: "win",
  ddd: 0,
  assets: [],
  layers: [
    ring(1, 0, STAMP_RED, 200),
    ring(2, 8, POSTAL_ORANGE, 165),
    ring(3, 16, KRAFT, 225),
    ...winDots,
  ],
};

/* --------------------------- LEVEL-UP flourish ---------------------------- */
/* A stamp-red heart that pops in with a postal-orange ring of sparks —
   "sealed with a stamp". */

// A heart path (Lottie bezier) centered roughly on the origin.
const heartShape = {
  ty: "sh",
  d: 1,
  ks: {
    a: 0,
    k: {
      c: true,
      v: [
        [0, -18],
        [-30, -44],
        [-52, -20],
        [-30, 14],
        [0, 40],
        [30, 14],
        [52, -20],
        [30, -44],
      ],
      i: [
        [0, 0],
        [14, -16],
        [22, 10],
        [-6, -16],
        [0, 0],
        [-12, 16],
        [-6, -22],
        [-20, -10],
      ],
      o: [
        [-14, -16],
        [-22, 10],
        [6, 16],
        [0, 0],
        [12, 16],
        [6, -16],
        [22, -10],
        [-14, 16],
      ],
    },
  },
  nm: "heart",
};

function heartLayer() {
  return {
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: "heart",
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 0, s: [0] },
          { t: 8, s: [100] },
        ],
      },
      r: {
        a: 1,
        k: [
          { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 0, s: [-12] },
          { t: 26, s: [0] },
        ],
      },
      p: { a: 0, k: CENTER },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1,
        k: [
          {
            i: { x: [0.2, 0.2, 0.2], y: [1, 1, 1] },
            o: { x: [0.4, 0.4, 0.4], y: [0, 0, 0] },
            t: 0,
            s: [0, 0, 100],
          },
          {
            i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] },
            o: { x: [0.4, 0.4, 0.4], y: [0, 0, 0] },
            t: 16,
            s: [135, 135, 100],
          },
          { t: 28, s: [110, 110, 100] },
        ],
      },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        nm: "g",
        it: [
          heartShape,
          { ty: "fl", c: { a: 0, k: STAMP_RED }, o: { a: 0, k: 100 }, r: 1, bm: 0, nm: "f" },
          {
            ty: "st",
            c: { a: 0, k: [1, 1, 1, 1] },
            o: { a: 0, k: 100 },
            w: { a: 0, k: 4 },
            lc: 2,
            lj: 1,
            ml: 4,
            bm: 0,
            nm: "s",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };
}

const levelUpDotColors = [POSTAL_ORANGE, KRAFT, PLUM];
const levelUpDots = [10, 55, 100, 145, 190, 235, 280, 325].map((ang, i) =>
  dot(30 + i, ang, levelUpDotColors[i % levelUpDotColors.length], 6, 92)
);

export const levelUpData = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: OP,
  w: 240,
  h: 240,
  nm: "levelup",
  ddd: 0,
  assets: [],
  layers: [ring(2, 4, POSTAL_ORANGE, 185), heartLayer(), ...levelUpDots],
};

export default winData;
