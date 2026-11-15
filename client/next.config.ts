import type { NextConfig } from "next";

const imageHost = process.env.NEXT_PUBLIC_IMAGE_HOST ?? "res.cloudinary.com";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: imageHost }],
  },
  poweredByHeader: false,
  // Lets phones and other devices on the local network use the dev server (HMR websocket, dev assets).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
