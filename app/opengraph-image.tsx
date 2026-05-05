import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — Professional Home Nursing`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #1d4ed8 0%, #0d9488 60%, #14b8a6 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            ♥
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.5 }}>
            {site.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            <div>Professional home nursing,</div>
            <div>delivered to your door.</div>
          </div>
          <div style={{ fontSize: 30, opacity: 0.9, maxWidth: 800 }}>
            {`Licensed RNs in ${site.serviceArea}. Post-op, elderly care, wound care, IV therapy & companion shifts.`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            opacity: 0.85,
          }}
        >
          <div>WhatsApp · Same-day response · 7 days a week</div>
          <div style={{ fontWeight: 600 }}>{site.url.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
    ),
    size,
  );
}
