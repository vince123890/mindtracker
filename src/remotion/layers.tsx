import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Lapis 1 — background mesh yang bergerak pelan (bukan latar polos). */
export const BgMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 55) * 50;
  const d2 = Math.cos(frame / 70) * 40;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", top: -420, left: -260 + d1, filter: "blur(60px)", background: `radial-gradient(circle, ${theme.colors.primary}40, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", bottom: -380, right: -220 - d2, filter: "blur(70px)", background: `radial-gradient(circle, ${theme.colors.accent}26, transparent 65%)` }} />
    </AbsoluteFill>
  );
};

/** Lapis 4 — color grade. */
export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.primary, mixBlendMode: "soft-light", opacity: 0.2 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.12), transparent 28%, transparent 72%, rgba(0,0,0,0.25))" }} />
  </AbsoluteFill>
);

/** Lapis 5a — grain prosedural. */
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "220px", backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`, opacity: 0.06, mixBlendMode: "overlay" }} />
  );
};

/** Lapis 5b — vignette (paling atas). */
export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)" }} />
);

/** Masuk: opacity + naik + skala (tidak pernah fade saja). */
export const Entrance: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  return (
    <div style={{ opacity: p, transform: `translateY(${interpolate(p, [0, 1], [36, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`, ...style }}>
      {children}
    </div>
  );
};

/** Keluar lebih cepat dari masuk (12 frame vs ~20). */
export const SceneExit: React.FC<{ duration: number; children: React.ReactNode }> = ({ duration, children }) => {
  const frame = useCurrentFrame();
  const start = duration - theme.timing.exitFrames;
  const y = interpolate(frame, [start, duration - 2], [0, -36], { easing: theme.ease.in, ...clamp });
  const o = interpolate(frame, [start, duration - 2], [1, 0], { easing: theme.ease.in, ...clamp });
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${y}px)` }}>{children}</AbsoluteFill>;
};

/** Angka berjalan dengan spring; null tampil "—" (pembagi nol bukan 0%). */
export const Counter: React.FC<{ value: number | null; format: "pct" | "int"; delay?: number; style?: React.CSSProperties }> = ({ value, format, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (value === null) return <span style={style}>—</span>;
  const p = spring({ frame: frame - delay, fps, config: theme.spring.counter });
  const v = interpolate(p, [0, 1], [0, format === "pct" ? value * 100 : value]);
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{format === "pct" ? `${Math.round(v)}%` : Math.round(v)}</span>;
};
