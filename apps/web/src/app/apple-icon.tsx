import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS adds its own rounded corners, so the tile is a full square.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#E8505B" }}>
        <svg width="132" height="132" viewBox="0 0 48 48"><g fill="#fff" transform="translate(0.8 0)"><rect x="10.4" y="13" width="5.2" height="22" rx="2.6" /><path d="M19 20.5 V27.5 Q19 35 25.30 30.93 L29.70 28.07 Q36 24 29.70 19.93 L25.30 17.07 Q19 13 19 20.5 Z" /></g></svg>
      </div>
    ),
    size,
  );
}
