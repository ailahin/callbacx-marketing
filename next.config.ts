import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack for faster dev compilation (Next.js 15+)
  turbopack: {
    // Resolve aliases if needed
    resolveAlias: {
      "@/*": "./src/*",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow HMR from network origins (e.g., 192.168.1.200)
  allowedDevOrigins: ["192.168.1.200"],
};

export default nextConfig;