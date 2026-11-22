import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Disable Turbopack on Windows due to native binding issues
  // turbopack is only enabled via CLI flags or config
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;