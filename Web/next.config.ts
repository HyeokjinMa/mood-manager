import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopack 루트 디렉토리 명시 (lockfile 경고 해결)
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
};

export default nextConfig;
