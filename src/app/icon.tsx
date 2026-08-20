import { ImageResponse } from "next/og";

// Next.js wires this up as the site favicon automatically (file-based metadata).
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1c1917",
          borderRadius: 14,
          color: "#ea580c",
          fontFamily: "serif",
          fontWeight: 600,
          fontSize: 34,
          letterSpacing: "-0.02em",
        }}
      >
        SC
      </div>
    ),
    { ...size }
  );
}
