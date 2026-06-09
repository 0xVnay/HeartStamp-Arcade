import { site } from "@/site.config";
import {
  ArrowDown,
  ArrowUpRight,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  FlaskConical,
  Gamepad2,
  Github,
  Grid3x3,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  Palette,
  Phone,
  Play,
  Smartphone,
  Sparkles,
  Trophy,
  Wrench,
  Zap,
} from "lucide-react";

/* eslint-disable @next/next/no-img-element */

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FlaskConical,
  Copy,
  Grid3x3,
  Heart,
  Code2,
  Smartphone,
  Trophy,
  Zap,
  Palette,
};

function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Sparkles;
  return <C className={className} />;
}

export default function Page() {
  const realShots = site.games.filter((g) => g.shot);

  return (
    <>
      {/* ── nav ─────────────────────────────────────────────────────── */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="brand">
            <span className="dot">
              <Gamepad2 />
            </span>
            {site.name}
          </div>
          <div className="nav-links">
            <a href="#games">Games</a>
            <a href="#fit">Why me</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <a
              className="btn btn-primary btn-sm"
              href={site.links.resume}
              target="_blank"
              rel="noopener noreferrer"
            >
              Resume
            </a>
          </div>
        </div>
      </nav>

      {/* ── hero ────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="kicker reveal">
              <Sparkles /> Demo for HeartStamp&apos;s in-card arcade
            </span>
            <h1 className="reveal d1">
              Four web games, <span className="hl">reskinned and ready</span> to plug into
              HeartStamp.
            </h1>
            <p className="hero-sub reveal d2">{site.hero.sub}</p>
            <div className="hero-cta reveal d3">
              <a className="btn btn-primary" href="#games">
                <Play /> {site.hero.primaryCta}
                <ArrowDown />
              </a>
              <a
                className="btn btn-ghost"
                href={site.links.resume}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText /> {site.hero.secondaryCta}
              </a>
            </div>
          </div>

          <div className="devices reveal d2" aria-hidden>
            <span className="blob" />
            {realShots.slice(0, 3).map((g, i) => (
              <div key={g.slug} className={`phone p${i + 1}${i === 1 ? " float" : ""}`}>
                <span className="screen">
                  <img src={g.shot} alt="" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── games ───────────────────────────────────────────────────── */}
      <section className="section" id="games">
        <div className="container">
          <span className="kicker">
            <Gamepad2 /> Games built for HeartStamp
          </span>
          <h2 className="h2">Four playable, browser-ready games.</h2>
          <p className="lead">{site.gamesIntro}</p>

          <div className="game-grid">
            {site.games.map((g) => (
              <article
                className="game-card"
                key={g.slug}
                style={{ ["--accent" as string]: g.accent } as React.CSSProperties}
              >
                <div className="game-shot">
                  <span className="badge">
                    <Icon name={g.icon} /> {g.genre}
                  </span>
                  {g.shot ? (
                    <img src={g.shot} alt={`${g.title} screenshot`} />
                  ) : (
                    <span className="soon">
                      <Icon name={g.icon} />
                      <span>Coming soon</span>
                    </span>
                  )}
                </div>
                <div className="game-body">
                  <h3>{g.title}</h3>
                  <p>{g.oneLiner}</p>
                <div className="game-actions">
                    {g.comingSoon || g.playUrl === "#" ? (
                      <button className="btn btn-ghost btn-sm btn-block" disabled>
                        Deploy pending
                      </button>
                    ) : (
                      <a
                        className="btn btn-primary btn-sm btn-block"
                        href={g.playUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Play /> Play game
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="caption">{site.gamesCaption}</p>
        </div>
      </section>

      {/* ── why fit ─────────────────────────────────────────────────── */}
      <section className="section" id="fit">
        <div className="container">
          <span className="kicker">
            <Heart /> Why I&apos;m a fit
          </span>
          <h2 className="h2">The exact shape of this role.</h2>

          <div className="fit-grid">
            {site.fit.map((f) => (
              <div className="fit-card" key={f.title}>
                <div className="icon-badge">
                  <Icon name={f.icon} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── about / experience ──────────────────────────────────────── */}
      <section className="section" id="about">
        <div className="container">
          <span className="kicker">
            <Sparkles /> About me
          </span>
          <div className="about-grid">
            <div>
              <h2 className="h2">~5 years, 0-to-1 product work.</h2>
              <p className="lead">{site.about}</p>
            </div>
            <div className="exp">
              {site.experience.map((e) => (
                <div className="exp-item" key={e.company}>
                  <div className="role">
                    {e.role} — <span>{e.company}</span>
                  </div>
                  <div className="meta">{e.meta}</div>
                  <p>{e.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── recent work ─────────────────────────────────────────────── */}
      <section className="section-sm">
        <div className="container">
          <span className="kicker">
            <ExternalLink /> Recent work · live
          </span>
          <h2 className="h2">Shipped &amp; in production.</h2>
          <div className="links">
            {site.recentWork.map((w) => (
              <a className="link-row" key={w.url} href={w.url} target="_blank" rel="noopener noreferrer">
                <span className="lico">
                  <ArrowUpRight />
                </span>
                <span>{w.label}</span>
                <span className="ext">
                  <ExternalLink />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── tech stack ──────────────────────────────────────────────── */}
      <section className="section-sm">
        <div className="container">
          <span className="kicker">
            <Wrench /> Tech stack
          </span>
          <h2 className="h2">What I build with.</h2>
          <div className="tech">
            {site.techStack.map((t) => (
              <div className="tech-group" key={t.label}>
                <span className="label">{t.label}</span>
                <div className="chips">
                  {t.items.map((it) => (
                    <span className="chip" key={it}>
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── contact ─────────────────────────────────────────────────── */}
      <section className="section" id="contact">
        <div className="container">
          <div className="contact-card">
            <span className="kicker" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
              <Mail /> Get in touch
            </span>
            <h2 style={{ marginTop: 14 }}>Let&apos;s wire these into HeartStamp.</h2>
            <p className="sub">
              Happy to walk through the games, talk reskins and the credit + leaderboard
              integration, or jump on a quick trial.
            </p>
            <div className="contact-grid">
              <a className="contact-item" href={`mailto:${site.email}`}>
                <span className="cico">
                  <Mail />
                </span>
                <span className="ctxt">
                  <small>Email</small>
                  <b>{site.email}</b>
                </span>
              </a>
              <a className="contact-item" href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>
                <span className="cico">
                  <Phone />
                </span>
                <span className="ctxt">
                  <small>Phone</small>
                  <b>{site.phone}</b>
                </span>
              </a>
              <a className="contact-item" href={site.links.github} target="_blank" rel="noopener noreferrer">
                <span className="cico">
                  <Github />
                </span>
                <span className="ctxt">
                  <small>GitHub</small>
                  <b>{site.links.github.replace("https://", "")}</b>
                </span>
              </a>
              <a className="contact-item" href={site.links.linkedin} target="_blank" rel="noopener noreferrer">
                <span className="cico">
                  <Linkedin />
                </span>
                <span className="ctxt">
                  <small>LinkedIn</small>
                  <b>{site.links.linkedin.replace("https://", "")}</b>
                </span>
              </a>
              <a
                className="contact-item"
                href={site.links.resume}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="cico">
                  <FileText />
                </span>
                <span className="ctxt">
                  <small>Resume</small>
                  <b>Open résumé</b>
                </span>
              </a>
            </div>
            <div className="contact-loc">
              <MapPin /> {site.location}
            </div>
          </div>
        </div>
      </section>

      <footer className="foot">{site.footer}</footer>
    </>
  );
}
