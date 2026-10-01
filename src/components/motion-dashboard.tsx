"use client";

import { Player } from "@remotion/player";
import { DashboardMotion, DASHBOARD_MOTION_FRAMES, type DashboardMotionProps } from "@/remotion/DashboardMotion";
import { theme } from "@/remotion/theme";

/** Grafik animasi dashboard (Remotion Player) — data dikirim server sesuai role. */
export function MotionDashboard({ data }: { data: DashboardMotionProps }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      <Player
        component={DashboardMotion}
        inputProps={data}
        durationInFrames={DASHBOARD_MOTION_FRAMES}
        fps={theme.timing.fps}
        compositionWidth={1280}
        compositionHeight={600}
        style={{ width: "100%" }}
        autoPlay
        loop
        controls
        acknowledgeRemotionLicense
      />
    </div>
  );
}
