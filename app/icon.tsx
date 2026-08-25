import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Generates the site favicon at build time — a simple rounded cross mark in
// the brand green, so the tab icon matches the header logo mark.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#26794e",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 14,
            height: 4,
            background: "white",
            borderRadius: 2,
            position: "absolute",
          }}
        />
        <div
          style={{
            width: 4,
            height: 14,
            background: "white",
            borderRadius: 2,
            position: "absolute",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
