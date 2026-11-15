import { ImageResponse } from "next/og";

/** The tag mark on an ultramarine square: used for PWA icons. */
export function iconResponse(size: number) {
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, background: "#2F3FE0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: size * 0.56, height: size * 0.66, background: "#F3F4FA", borderRadius: size * 0.05,
            display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: size * 0.07,
          }}
        >
          <div style={{ width: size * 0.12, height: size * 0.12, borderRadius: 999, background: "#2F3FE0" }} />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
