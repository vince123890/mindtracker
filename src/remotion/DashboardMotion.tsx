import type React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BgMesh, Counter, Entrance, Grade, Grain, SceneExit, Vignette } from "./layers";
import { theme } from "./theme";

export interface MotionKpi { label: string; value: number | null; format: "pct" | "int" }
export interface MotionBar { label: string; value: number | null }
export interface MotionPair { label: string; a: number | null; b: number | null }

export interface DashboardMotionProps {
  [key: string]: unknown;
  title: string;
  subtitle: string;
  kpis: MotionKpi[];
  barsTitle: string;
  bars: MotionBar[];
  /** Ambang (mis. 0.60 untuk Index 1). Batang di bawah ambang diberi warna peringatan. */
  threshold: number | null;
  thresholdLabel: string;
  pairsTitle: string;
  pairLabels: [string, string];
  pairs: MotionPair[];
  footnote: string;
}

const { sceneFrames, stagger } = theme.timing;
export const DASHBOARD_MOTION_FRAMES = sceneFrames * 3;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const fmt = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

const Heading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <Entrance>
    <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -0.5, color: theme.colors.text }}>{title}</div>
    {subtitle ? <div style={{ fontSize: 20, color: theme.colors.textDim, marginTop: 6 }}>{subtitle}</div> : null}
  </Entrance>
);

// ------------------------------------------------------------------ adegan 1 — KPI
const KpiScene: React.FC<DashboardMotionProps> = ({ title, subtitle, kpis }) => {
  const frame = useCurrentFrame();
  return (
    <SceneExit duration={sceneFrames}>
      <AbsoluteFill style={{ padding: 64, gap: 44, justifyContent: "center" }}>
        <Heading title={title} subtitle={subtitle} />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(4, kpis.length)}, 1fr)`, gap: 24 }}>
          {kpis.map((k, i) => (
            <Entrance key={k.label} delay={10 + i * stagger}>
              <div
                style={{
                  borderRadius: 20,
                  padding: "28px 26px",
                  background: theme.colors.bgAlt,
                  border: `1px solid ${theme.colors.track}`,
                  // idle breathing untuk elemen yang tampil > 2 detik
                  transform: `translateY(${Math.sin((frame + i * 9) / 30) * 3}px)`,
                }}
              >
                <Counter value={k.value} format={k.format} delay={14 + i * stagger} style={{ fontSize: 64, fontWeight: 800, color: i === 0 ? theme.colors.primary : theme.colors.text }} />
                <div style={{ fontSize: 19, color: theme.colors.textDim, marginTop: 8 }}>{k.label}</div>
              </div>
            </Entrance>
          ))}
        </div>
      </AbsoluteFill>
    </SceneExit>
  );
};

// ------------------------------------------------------------------ adegan 2 — batang + ambang
const BarsScene: React.FC<DashboardMotionProps> = ({ barsTitle, bars, threshold, thresholdLabel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = bars.slice(0, 7);
  const trackW = 760;
  const lineP = interpolate(frame, [18, 40], [0, 1], { easing: theme.ease.out, ...clamp });
  return (
    <SceneExit duration={sceneFrames}>
      <AbsoluteFill style={{ padding: 64, gap: 48, justifyContent: "center" }}>
        <Heading title={barsTitle} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 20 }}>
          {rows.map((b, i) => {
            const p = spring({ frame: frame - 12 - i * stagger, fps, config: theme.spring.smooth });
            const target = Math.min(1, Math.max(0, b.value ?? 0));
            const below = threshold !== null && b.value !== null && b.value < threshold;
            const color = b.value === null ? theme.colors.track : below ? theme.colors.warn : theme.colors.ok;
            return (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 20, opacity: p, transform: `translateX(${interpolate(p, [0, 1], [-30, 0])}px)` }}>
                <div style={{ width: 300, fontSize: 20, color: theme.colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.label}</div>
                <div style={{ position: "relative", width: trackW, height: 30, borderRadius: 15, background: theme.colors.track }}>
                  <div style={{ width: trackW * target * p, height: 30, borderRadius: 15, background: color, boxShadow: below ? "none" : `0 0 24px ${theme.colors.ok}55` }} />
                </div>
                <div style={{ width: 90, fontSize: 24, fontWeight: 700, color: theme.colors.text, fontVariantNumeric: "tabular-nums" }}>{fmt(b.value === null ? null : b.value * p)}</div>
              </div>
            );
          })}
          {threshold !== null ? (
            <div style={{ position: "absolute", top: -14, bottom: -14, left: 320 + trackW * threshold, width: 3, borderRadius: 2, background: theme.colors.danger, transform: `scaleY(${lineP})`, transformOrigin: "top" }}>
              <div style={{ position: "absolute", top: -34, left: 0, transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: 16, fontWeight: 600, color: theme.colors.danger, opacity: lineP }}>{thresholdLabel}</div>
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </SceneExit>
  );
};

// ------------------------------------------------------------------ adegan 3 — pasangan indeks
const PairsScene: React.FC<DashboardMotionProps> = ({ pairsTitle, pairLabels, pairs, footnote }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = pairs.slice(0, 5);
  const colH = 240;
  return (
    <SceneExit duration={sceneFrames}>
      <AbsoluteFill style={{ padding: 64, gap: 24, justifyContent: "center" }}>
        <Heading title={pairsTitle} />
        <div style={{ display: "flex", gap: 34, alignItems: "flex-end", height: colH + 70 }}>
          {rows.map((r, i) => {
            const p = spring({ frame: frame - 12 - i * stagger, fps, config: theme.spring.smooth });
            return (
              <div key={r.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: p, transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: colH }}>
                  {[r.a, r.b].map((v, k) => (
                    <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.text, fontVariantNumeric: "tabular-nums" }}>{fmt(v === null ? null : v * p)}</div>
                      <div style={{ width: 46, height: colH * Math.min(1, v ?? 0) * p, minHeight: 2, borderRadius: 10, background: k === 0 ? theme.colors.primary : theme.colors.accent }} />
                    </div>
                  ))}
                </div>
                <div style={{ width: 170, textAlign: "center", fontSize: 17, color: theme.colors.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
              </div>
            );
          })}
        </div>
        <Entrance delay={30}>
          <div style={{ display: "flex", gap: 28, fontSize: 18, color: theme.colors.textDim }}>
            <span><span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 4, background: theme.colors.primary, marginRight: 8 }} />{pairLabels[0]}</span>
            <span><span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 4, background: theme.colors.accent, marginRight: 8 }} />{pairLabels[1]}</span>
            <span style={{ marginLeft: "auto" }}>{footnote}</span>
          </div>
        </Entrance>
      </AbsoluteFill>
    </SceneExit>
  );
};

/** Komposisi dashboard: BgMesh → konten → grade → grain → vignette. */
export const DashboardMotion: React.FC<DashboardMotionProps> = (props) => (
  <AbsoluteFill style={{ fontFamily: theme.font }}>
    <BgMesh />
    <Sequence durationInFrames={sceneFrames}><KpiScene {...props} /></Sequence>
    <Sequence from={sceneFrames} durationInFrames={sceneFrames}><BarsScene {...props} /></Sequence>
    <Sequence from={sceneFrames * 2} durationInFrames={sceneFrames}>
      {props.pairs.length ? <PairsScene {...props} /> : <BarsScene {...props} />}
    </Sequence>
    <Grade />
    <Grain />
    <Vignette />
  </AbsoluteFill>
);
