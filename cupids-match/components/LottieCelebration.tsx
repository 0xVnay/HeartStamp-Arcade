"use client";

import Lottie from "lottie-react";
import { celebrationData, levelUpData } from "@/lib/celebrationData";

/**
 * Self-contained Lottie flourishes in the HeartStamp palette. Loaded via
 * next/dynamic with ssr:false from Game.tsx, so lottie-web never runs on the
 * server. `variant` chooses the WIN burst vs the LEVEL-UP "sealed with a stamp"
 * heart-burst.
 */
export default function LottieCelebration({
  variant = "win",
}: {
  variant?: "win" | "level-up";
}) {
  return (
    <Lottie
      animationData={variant === "level-up" ? levelUpData : celebrationData}
      loop={false}
      autoplay
      style={{ width: "100%", height: "100%" }}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
    />
  );
}
