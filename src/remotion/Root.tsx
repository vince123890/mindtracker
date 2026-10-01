import { Composition } from "remotion";
import { DashboardMotion, DASHBOARD_MOTION_FRAMES } from "./DashboardMotion";
import { SAMPLE_PROPS } from "./sample-props";
import { theme } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="DashboardMotion"
    component={DashboardMotion}
    durationInFrames={DASHBOARD_MOTION_FRAMES}
    fps={theme.timing.fps}
    width={1280}
    height={600}
    defaultProps={SAMPLE_PROPS}
  />
);
