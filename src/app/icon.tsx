import { ImageResponse } from "next/og";

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
          background: "#0d0714",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 800,
            fontFamily: "sans-serif",
            letterSpacing: -1.5,
          }}
        >
          <span style={{ color: "#f2edf7" }}>S</span>
          <span style={{ color: "#a855f7" }}>E</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
