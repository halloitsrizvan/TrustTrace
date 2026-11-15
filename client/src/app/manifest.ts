import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrustTrace",
    short_name: "TrustTrace",
    description: "Lost and found on one campus board.",
    start_url: "/board",
    display: "standalone",
    background_color: "#F3F4FA",
    theme_color: "#2F3FE0",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
