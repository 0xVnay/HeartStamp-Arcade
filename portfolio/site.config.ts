/**
 * ─────────────────────────────────────────────────────────────────────────
 *  EDIT ME — single source of truth for the showcase site.
 *  Fill the `TODO:` items (game live URLs, résumé) before deploying.
 *  Reskin look-and-feel via the CSS variables at the top of app/globals.css.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface GameEntry {
  slug: string;
  title: string;
  genre: string;
  /** lucide-react icon name, mapped in app/page.tsx */
  icon: string;
  oneLiner: string;
  shot: string;
  playUrl: string;
  sourceUrl: string;
  accent: string;
  comingSoon?: boolean;
}

export const site = {
  // —— You ——————————————————————————————————————————————————————————————
  name: "Vinay Gupta",
  role: "Full-stack Developer",
  email: "vinayleokumar@gmail.com",
  phone: "+91-9519948533",
  location: "India (UTC+5:30) — comfortable with US / EU / Singapore / Australia overlap",
  links: {
    github: "https://github.com/0xVnay",
    linkedin: "https://linkedin.com/in/0xvnay",
    resume: "https://drive.google.com/file/d/1RDqVtRZSjVqmMYrRUw1op8-U0XPLsu6h/view",
  },

  // —— Hero ——————————————————————————————————————————————————————————————
  hero: {
    headline: "Four web games, reskinned and ready to plug into HeartStamp.",
    sub: "I'm Vinay Gupta — a full-stack developer (React, Next.js, TypeScript, React Native) who builds web and mobile products for early-stage startups. I built these four casual games as a working demo for HeartStamp's in-card arcade: responsive, mobile-first, and ready to wire into a credit + leaderboard system.",
    primaryCta: "Play the games",
    secondaryCta: "View my resume",
  },

  // —— Games ————————————————————————————————————————————————————————————
  gamesIntro:
    "Four playable, browser-ready games. Each is a client-side React component, mobile-first, and built to slot cleanly into a Next.js app.",
  gamesCaption:
    "Each game is responsive on phone and desktop, uses localStorage for resume-state, and exposes simple score / milestone callbacks — ready to connect to HeartStamp's rewards and leaderboard endpoints.",
  games: [
    {
      slug: "heart-merge",
      title: "Heart Merge",
      genre: "Block / Merge",
      icon: "Heart",
      oneLiner: "Slide love-tokens across the board; identical tokens merge up the romance ladder.",
      shot: "/shots/heart-merge.png",
      playUrl: "https://heart-merge.vercel.app",
      sourceUrl: "#", // TODO: GitHub URL
      accent: "#7b4ea8",
    },
    {
      slug: "love-lab-sort",
      title: "Love Lab Sort",
      genre: "Color-sort Puzzle",
      icon: "FlaskConical",
      oneLiner: "Pour love-potion colors between jars until each holds a single shade.",
      shot: "/shots/love-lab-sort.png",
      playUrl: "https://love-lab-sort.vercel.app",
      sourceUrl: "#", // TODO: GitHub URL
      accent: "#e85d8a",
    },
    {
      slug: "stampy-pairs",
      title: "Stampy Pairs",
      genre: "Memory Match",
      icon: "Copy",
      oneLiner: "Flip postcards two at a time to pair HeartStamp icons in as few moves as possible.",
      shot: "/shots/stampy-pairs.png",
      playUrl: "https://stampy-pairs.vercel.app",
      sourceUrl: "#", // TODO
      accent: "#c23e72",
    },
    {
      slug: "cupids-match",
      title: "Cupid's Match",
      genre: "Match-3",
      icon: "Grid3x3",
      oneLiner: "Swap adjacent love-icons to line up three or more, trigger cascades, and hit the goal.",
      shot: "/shots/cupids-match.png",
      playUrl: "https://cupids-match-vinayleokumargmailcoms-projects.vercel.app",
      sourceUrl: "#", // TODO
      accent: "#16a98c",
    },
  ] as GameEntry[],

  // —— Why I'm a fit ————————————————————————————————————————————————————
  fit: [
    {
      icon: "Code2",
      title: "Strong JavaScript & TypeScript",
      body: "Working daily inside existing React and Next.js codebases.",
    },
    {
      icon: "Smartphone",
      title: "Mobile-first by default",
      body: "Shipped 3 hybrid mobile apps (iOS & Android) and spend a lot of time making interfaces feel right on a phone, including 60fps performance tuning.",
    },
    {
      icon: "Trophy",
      title: "Leaderboards & gamification",
      body: "At NOVOS I built a community leaderboard plus streaks and daily-action mechanics — the same shape of work as wiring games into a credit + leaderboard system.",
    },
    {
      icon: "Zap",
      title: "Next.js client-only patterns",
      body: "Comfortable with dynamic import, SSR off, and clean component teardown for client-side interactive components.",
    },
    {
      icon: "Palette",
      title: "Reskin & integration mindset",
      body: "I take a permissively licensed open-source base, restyle it into a brand without breaking gameplay, and verify the license is cleanly permissive.",
    },
  ],

  // —— About / experience ————————————————————————————————————————————————
  about:
    "Full-stack developer with ~5 years building web and mobile apps at early-stage startups, including ~3 years in healthtech. 0-to-1 experience taking products from scratch to production. Specialize in React, React Native, Next.js, and TypeScript.",
  experience: [
    {
      role: "Software Engineer",
      company: "NOVOS",
      meta: "NYC healthtech / longevity · Remote · Jul 2023–Present",
      body: "Early mobile-team member on the NOVOS Life consumer app. Built an AI Coach chatbot with real-time streaming responses, integrated 6+ health data sources, built health dashboards and a community leaderboard, and shipped gamification features (streaks, daily actions). Also building a B2B React/Next.js portal. Use Claude Code daily as a development force-multiplier.",
    },
    {
      role: "Software Engineer",
      company: "Osbiome",
      meta: "Singapore gut-health · Remote · May 2022–Dec 2023",
      body: "Built a React Native health-tracking app and a React admin portal. Independently managed the entire frontend for the final 6 months. Built a referral system that increased user acquisition by ~30%.",
    },
    {
      role: "Software Engineer",
      company: "OneIoT",
      meta: "India IoT · Remote · Apr 2021–Apr 2022",
      body: "Built a React Native smart-home app from scratch to production with real-time device control over WebSockets via AWS IoT Core, plus native BLE integrations for 15+ device types.",
    },
  ],

  // —— Recent work (live links) ————————————————————————————————————————
  recentWork: [
    { label: "NOVOS — website", url: "https://novoslabs.com/" },
    {
      label: "NOVOS Life — iOS",
      url: "https://apps.apple.com/us/app/novos-life/id6468173076",
    },
    {
      label: "NOVOS Life — Android",
      url: "https://play.google.com/store/apps/details?id=com.novoslabs.NovosLife",
    },
    { label: "OneIoT — website", url: "https://oneiot.io" },
  ],

  // —— Tech stack ————————————————————————————————————————————————————————
  techStack: [
    {
      label: "Frontend",
      items: ["React", "Next.js", "React Native (Expo)", "TypeScript", "JavaScript (ES6+)", "Tailwind CSS", "HTML5", "CSS3"],
    },
    {
      label: "Game / Interactive",
      items: ["HTML5 Canvas", "Web-native game integration", "Responsive game UI", "localStorage save-state"],
    },
    { label: "State", items: ["Redux Toolkit", "React Query", "Context API"] },
    { label: "Backend", items: ["Node.js", "Express.js"] },
    { label: "Databases", items: ["MongoDB", "Firebase / Firestore"] },
    { label: "Cloud", items: ["AWS (Lambda, Amplify, Cognito, S3, IoT Core)", "Firebase"] },
    { label: "AI / LLM", items: ["Claude integration", "Production AI chatbot", "Claude Code daily"] },
  ],

  footer: "Built for HeartStamp by Vinay Gupta.",
};

export type Site = typeof site;
