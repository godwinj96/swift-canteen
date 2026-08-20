import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          color: "#ea580c",
          fontFamily: "serif",
          fontWeight: 600,
          fontSize: 92,
          letterSpacing: "-0.02em",
        }}
      >
        SC
      </div>
    ),
    { ...size }
  );
}
