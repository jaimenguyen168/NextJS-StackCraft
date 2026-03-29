import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["whole-truly-yak.ngrok-free.app"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-81ad471a54e64a1dbbae161137b4d8c3.r2.dev",
      },
    ],
  },
};

export default nextConfig;
