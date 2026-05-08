import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["playwright", "@modelcontextprotocol/sdk"],
  eslint: {
    // Lint runs separately via `pnpm lint` — don't block production build.
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
