/**
 * A self-contained Lottie celebration (expanding rings + radiating dots) in the
 * HeartStamp palette, built programmatically so the JSON is always well-formed.
 * Rendered by components/LottieCelebration.tsx on a level win.
 */

const OP = 80; // animation length in frames
const CENTER: [number, number, number] = [120, 120, 0];

// brand colors as Lottie [r,g,b,a] (0..1)
const ROSE = [0.91, 0.36, 0.54, 1];
const BLUSH = [1, 0.56, 0.69, 1];
const GOLD = [0.95, 0.71, 0.35, 1];

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

const dotColors = [ROSE, BLUSH, GOLD];
const dots = [0, 60, 120, 180, 240, 300].map((ang, i) =>
  dot(10 + i, ang, dotColors[i % dotColors.length], 4)
);

const celebrationData = {
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
    ring(1, 0, ROSE, 190),
    ring(2, 8, BLUSH, 160),
    ring(3, 16, GOLD, 215),
    ...dots,
  ],
};

export default celebrationData;
