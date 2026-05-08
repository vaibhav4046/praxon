import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["playwright", "@modelcontextprotocol/sdk"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

// Disable ESLint during production builds (lint via `pnpm lint`).
// Cast through unknown because the property name changed across Next versions.
(nextConfig as unknown as { eslint: { ignoreDuringBuilds: boolean } }).eslint = {
  ignoreDuringBuilds: true,
};

export default nextConfig;
