import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  images: {
    minimumCacheTTL: 86400, // Cache optimized images for 24 hours to save bandwidth
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.storageapi.dev" },
    ],
  },
};

export default nextConfig;
