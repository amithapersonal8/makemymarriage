import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep development startup from rewriting the project conventions.
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
