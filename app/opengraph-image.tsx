import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social preview, generated once at build time.
export default function OpengraphImage() {
  const tile = (color: string, opacity = 1) => (
    <div style={{ width: 54, height: 54, borderRadius: 12, background: color, opacity }} />
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #2b2385 0%, #3b2fa0 55%, #4a3dbb 100%)",
          color: "white",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 124, gap: 16 }}>
            {tile("#ffffff")}
            {tile("#ffffff", 0.75)}
            {tile("#ffffff", 0.75)}
            {tile("#f2b84b")}
          </div>
          <div style={{ fontSize: 72, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, lineHeight: 1.1, maxWidth: 950 }}>The academic year, without the paperwork.</div>
          <div style={{ fontSize: 30, opacity: 0.8, fontFamily: "sans-serif" }}>
            Course registration · Grading · Transcripts · Tuition payments
          </div>
        </div>
      </div>
    ),
    size,
  );
}
