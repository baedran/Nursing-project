import { NextRequest, NextResponse } from "next/server";
import { site } from "@/lib/site";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = site.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${site.defaultLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Match everything except: _next internals, api routes, files with extensions
    // (sitemap.xml, robots.txt, favicon.ico, og images), and the opengraph-image route.
    "/((?!_next|api|opengraph-image|.*\\..*).*)",
  ],
};
