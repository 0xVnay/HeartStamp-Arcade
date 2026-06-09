/**
 * Self-contained Lottie celebrations in the HeartStamp palette, built
 * programmatically so the JSON is always well-formed. Rendered by
 * components/LottieCelebration.tsx.
 *
 *   celebrationData — WIN burst (expanding rings + radiating dots).
 *   levelUpData     — LEVEL-UP / "sealed with a stamp" heart-burst.
 *
 * Brand colors (Lottie uses [r,g,b,a] in 0..1):
 *   STAMP RED    #BF2031   POSTAL ORANGE #F25A29
 *   MINT/TEAL    #19B89B   GOLD          #F2B23A
 */

const OP = 80; // animation length in frames
const CENTER: [number, number, number] = [120, 120, 0];

const RED = [0.749, 0.125, 0.192, 1]; // #BF2031
const ORANGE = [0.949, 0.353, 0.161, 1]; // #F25A29
const MINT = [0.098, 0.722, 0.604, 1]; // #19B89B
const GOLD = [0.949, 0.698, 0.227, 1]; // #F2B23A
const CREAM = [0.988, 0.98, 0.969, 1]; // #FCFAF7

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

function dot(ind: number, angleDeg: number, color: number[], st: number) {
  const r = 86;
  const rad = (angleDeg * Math.PI) / 180;
  const end: [number, number, number] = [120 + r * Math.cos(rad), 120 + r * Math.sin(rad), 0];
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

const dotColors = [RED, ORANGE, MINT, GOLD];
const dots = [0, 45, 90, 135, 180, 225, 270, 315].map((ang, i) =>
  dot(20 + i, ang, dotColors[i % dotColors.length], 4)
);

export const celebrationData = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: OP,
  w: 240,
  h: 240,
  nm: "celebrate",
  ddd: 0,
  assets: [],
  layers: [
    ring(1, 0, RED, 190),
    ring(2, 8, ORANGE, 160),
    ring(3, 16, MINT, 215),
    ...dots,
  ],
};

export default celebrationData;

/* -------------------------------------------------------------------------- */
/*  LEVEL-UP — "sealed with a stamp" heart-burst                              */
/* -------------------------------------------------------------------------- */

// A chunky heart path (centered at origin, ~70px wide), as a Lottie shape "sh".
const HEART_PATH = {
  ind: 0,
  ty: "sh",
  ix: 1,
  ks: {
    a: 0,
    k: {
      c: true,
      v: [
        [0, 22],
        [-30, -8],
        [-30, -28],
        [-15, -40],
        [0, -28],
        [15, -40],
        [30, -28],
        [30, -8],
      ],
      i: [
        [0, 0],
        [0, 10],
        [-8, 0],
        [-8, 0],
        [-8, -8],
        [-8, 0],
        [0, -8],
        [0, 0],
      ],
      o: [
        [0, 0],
        [0, -10],
        [8, 0],
        [8, 0],
        [8, 8],
        [8, 0],
        [0, 8],
        [0, 0],
      ],
    },
  },
  nm: "heart",
};

function heart(ind: number, color: number[]) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: "centerHeart",
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 0, s: [0] },
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 8, s: [100] },
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 60, s: [100] },
          { t: 78, s: [0] },
        ],
      },
      r: {
        a: 1,
        k: [
          { i: { x: [0.4], y: [1] }, o: { x: [0.4], y: [0] }, t: 0, s: [-12] },
          { i: { x: [0.4], y: [1] }, o: { x: [0.4], y: [0] }, t: 18, s: [6] },
          { t: 40, s: [0] },
        ],
      },
      p: { a: 0, k: CENTER },
      a: { a: 0, k: [0, -6, 0] },
      s: {
        a: 1,
        k: [
          {
            i: { x: [0.2, 0.2, 0.2], y: [1, 1, 1] },
            o: { x: [0.35, 0.35, 0.35], y: [0, 0, 0] },
            t: 0,
            s: [0, 0, 100],
          },
          {
            i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] },
            o: { x: [0.4, 0.4, 0.4], y: [0, 0, 0] },
            t: 14,
            s: [150, 150, 100],
          },
          { t: 26, s: [118, 118, 100] },
        ],
      },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        nm: "g",
        it: [
          HEART_PATH,
          { ty: "fl", c: { a: 0, k: color }, o: { a: 0, k: 100 }, r: 1, bm: 0, nm: "f" },
          {
            ty: "st",
            c: { a: 0, k: CREAM },
            o: { a: 0, k: 100 },
            w: { a: 0, k: 5 },
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

// A scalloped "postmark" ring that snaps in around the heart like a stamp seal.
function seal(ind: number) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: "seal",
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 6, s: [0] },
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 14, s: [70] },
          { t: 70, s: [0] },
        ],
      },
      r: {
        a: 1,
        k: [
          { i: { x: [0.4], y: [1] }, o: { x: [0.4], y: [0] }, t: 6, s: [-30] },
          { t: 40, s: [0] },
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
            t: 6,
            s: [40, 40, 100],
          },
          { t: 24, s: [128, 128, 100] },
        ],
      },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        nm: "g",
        it: [
          { ty: "el", d: 1, s: { a: 0, k: [150, 150] }, p: { a: 0, k: [0, 0] }, nm: "e" },
          {
            ty: "st",
            c: { a: 0, k: RED },
            o: { a: 0, k: 100 },
            w: { a: 0, k: 6 },
            lc: 2,
            lj: 1,
            ml: 4,
            d: [
              { n: "d", nm: "dash", v: { a: 0, k: 3 } },
              { n: "g", nm: "gap", v: { a: 0, k: 12 } },
            ],
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

const luDotColors = [RED, ORANGE, MINT, GOLD];
const luDots = [10, 55, 100, 145, 190, 235, 280, 325].map((ang, i) =>
  dot(40 + i, ang, luDotColors[i % luDotColors.length], 10)
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
  layers: [
    ...luDots,
    seal(2),
    heart(1, RED),
  ],
};
