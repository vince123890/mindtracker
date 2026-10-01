import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // forbidden() untuk halaman 403 — penegakan Menu × Role di server
    authInterrupts: true,
  },
};

export default nextConfig;
