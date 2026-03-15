import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  // Skip static generation for dynamic pages
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;