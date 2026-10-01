// Satu-satunya sumber warna, easing, dan spring untuk grafik animasi dashboard.
// Jangan menulis hex/easing langsung di komponen (aturan skill remotion-motion-graphics).
import { loadFont } from "@remotion/google-fonts/Inter";
import { Easing } from "remotion";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "800"], subsets: ["latin"] });

export const theme = {
  colors: {
    bg: "#0B1024",
    bgAlt: "#121A38",
    primary: "#6366F1", // warna utama (indigo MIND Tracker) — satu elemen hero per frame
    accent: "#22D3EE",
    ok: "#34D399",
    warn: "#FBBF24",
    danger: "#FB7185",
    text: "#F8FAFC",
    textDim: "#94A3B8",
    track: "rgba(148, 163, 184, 0.16)",
    glow: "rgba(99, 102, 241, 0.45)",
  },
  font: fontFamily,
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    counter: { damping: 30, stiffness: 60 },
  },
  timing: {
    fps: 30,
    sceneFrames: 120, // 4 detik per adegan
    stagger: 5,
    exitFrames: 12,
  },
} as const;
