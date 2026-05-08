import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["playwright", "@modelcontextprotocol/sdk"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
