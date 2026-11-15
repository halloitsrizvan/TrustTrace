import type { NextConfig } from "next";

const imageHost = process.env.NEXT_PUBLIC_IMAGE_HOST ?? "**.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: imageHost }],
  },
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
