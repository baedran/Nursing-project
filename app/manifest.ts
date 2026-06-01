import type { MetadataRoute } from "next";

// Web app manifest — the small file that lets a phone "install" the portal to
// the home screen and open it full-screen. Next serves it at
// /manifest.webmanifest. See docs/superpowers/specs/2026-06-01-nurse-mobile-pwa-design.md
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Caregivers Collective",
    short_name: "Caregivers",
    description:
      "Document home-care visits — vitals, notes, and wound photos — for Caregivers Collective nurses.",
    start_url: "/en/portal",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f7f3",
    theme_color: "#1a504f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
