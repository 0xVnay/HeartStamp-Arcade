"use client";

import Lottie from "lottie-react";
import { winData, levelUpData } from "@/lib/celebrationData";

/**
 * Self-contained Lottie burst in the HeartStamp palette. `variant` picks the
 * win celebration or the "sealed with a stamp" level-up flourish. Loaded via
 * next/dynamic with ssr:false from Game.tsx so lottie-web never runs on server.
 */
export default function LottieCelebration({ variant = "win" }: { variant?: "win" | "levelup" }) {
  return (
    <Lottie
      animationData={variant === "levelup" ? levelUpData : winData}
      loop={false}
      autoplay
      style={{ width: "100%", height: "100%" }}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
    />
  );
}
