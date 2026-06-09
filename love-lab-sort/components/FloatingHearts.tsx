/**
 * Decorative backdrop of slowly rising hearts/petals. Positions are fixed (not
 * random) so server and client markup match — no hydration mismatch.
 */
const PIECES = [
  { left: 6, delay: 0, dur: 17, size: 16, ch: "💗" },
  { left: 18, delay: 6, dur: 21, size: 13, ch: "🌸" },
  { left: 31, delay: 11, dur: 19, size: 18, ch: "💕" },
  { left: 44, delay: 3, dur: 23, size: 12, ch: "✨" },
  { left: 57, delay: 14, dur: 18, size: 17, ch: "💗" },
  { left: 69, delay: 8, dur: 22, size: 14, ch: "🌸" },
  { left: 81, delay: 2, dur: 20, size: 15, ch: "💕" },
  { left: 92, delay: 12, dur: 24, size: 13, ch: "✨" },
];

export default function FloatingHearts() {
  return (
    <div className="bg-hearts" aria-hidden>
      {PIECES.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        >
          {p.ch}
        </span>
      ))}
    </div>
  );
}
