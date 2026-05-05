import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes = [
    "",
    "/services",
    "/packages",
    "/how-we-work",
    "/faq",
    "/for-nurses",
    "/contact",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of site.locales) {
      entries.push({
        url: `${site.url}/${locale}${route}`,
        lastModified,
        changeFrequency: "monthly",
        priority: route === "" ? 1 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            site.locales.map((l) => [l, `${site.url}/${l}${route}`]),
          ),
        },
      });
    }
  }

  return entries;
}
