"use client";

import Lottie from "lottie-react";
import celebrationData from "@/lib/celebrationData";

/**
 * Lottie burst shown on a level win. Loaded via next/dynamic with ssr:false from
 * Game.tsx, so lottie-web never runs on the server.
 */
export default function LottieCelebration() {
  return (
    <Lottie
      animationData={celebrationData}
      loop={false}
      autoplay
      style={{ width: "100%", height: "100%" }}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
    />
  );
}
