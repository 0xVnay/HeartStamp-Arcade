/**
 * Full-screen heart/sparkle confetti burst. Only mounted on a win, so a little
 * variety via a seeded spread is fine (no SSR hydration concern here).
 */
const CHARS = ["💖", "✨", "💕", "🌸", "💝", "💗"];

function build(count: number) {
  // Deterministic pseudo-spread so pieces feel scattered without Math.random at render.
  const out = [];
  for (let i = 0; i < count; i++) {
    const left = (i * 37 + 11) % 100;
    const delay = ((i * 13) % 9) / 10;
    const dur = 2.4 + (((i * 7) % 12) / 10);
    const size = 14 + ((i * 5) % 14);
    out.push({ left, delay, dur, size, ch: CHARS[i % CHARS.length] });
  }
  return out;
}

export default function Confetti({ pieces = 22 }: { pieces?: number }) {
  return (
    <div className="confetti" aria-hidden>
      {build(pieces).map((p, i) => (
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
