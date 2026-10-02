// Satu-satunya sumber warna, easing, dan spring untuk grafik animasi dashboard.
// Jangan menulis hex/easing langsung di komponen (aturan skill remotion-motion-graphics).
import { loadFont } from "@remotion/google-fonts/Inter";
import { Easing } from "remotion";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "800"], subsets: ["latin"] });

export const theme = {
  colors: {
    // Mengikuti design system (docs/DESIGN-SYSTEM-MIND-Tracker.md): latar navy brand, biru & oranye seri grafik.
    bg: "#121D3D",
    bgAlt: "#1C2D5A",
    primary: "#4C7DF0", // brand-blue versi terang agar terbaca di latar gelap — satu elemen hero per frame
    accent: "#F28C28", // brand-orange terang
    ok: "#34D399",
    warn: "#FBBF24",
    danger: "#E8455A", // brand-red terang
    text: "#F8FAFC",
    textDim: "#94A3B8",
    track: "rgba(148, 163, 184, 0.16)",
    glow: "rgba(76, 125, 240, 0.45)",
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
