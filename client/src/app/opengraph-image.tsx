import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TrustTrace: lost it or found it? Start on one board.";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#F3F4FA", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, color: "#141A3C" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
          <div style={{ width: 180, height: 90, background: "#fff", borderLeft: "16px solid #F26B21", display: "flex" }} />
          <div style={{ width: 180, height: 90, background: "#fff", borderRight: "16px solid #0FA77A", display: "flex" }} />
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, display: "flex" }}>Lost it or found it?</div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, display: "flex" }}>Start on one board.</div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#4A5078", display: "flex" }}>TrustTrace, campus lost and found</div>
      </div>
    ),
    size,
  );
}
