import type { NextConfig } from "next";

const imageHost = process.env.NEXT_PUBLIC_IMAGE_HOST ?? "**.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: imageHost }],
  },
  poweredByHeader: false,
  // msw/browser has a null "node" export; the server graph gets an empty stub instead.
  turbopack: {
    resolveAlias: {
      "msw/browser": { browser: "msw/browser", default: "./src/mocks/empty.ts" },
    },
  },
};

export default nextConfig;
