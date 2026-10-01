// Entry Remotion CLI — hanya untuk render frame verifikasi (`npm run motion:still`).
// Aplikasi memakai @remotion/player, bukan render video.
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
