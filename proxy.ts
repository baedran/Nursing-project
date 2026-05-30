import { NextRequest, NextResponse } from "next/server";
import { site } from "@/lib/site";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // First, refresh the Supabase auth session so cookies stay fresh.
  // updateSession returns a NextResponse; we'll carry its cookies forward.
  const sessionResponse = await updateSession(request);

  const hasLocale = site.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  // If the locale is already present, return the session-refreshed response.
  if (hasLocale) return sessionResponse;

  // Otherwise, redirect to the default locale and carry session cookies.
  const url = request.nextUrl.clone();
  url.pathname = `/${site.defaultLocale}${pathname}`;
  const redirectResponse = NextResponse.redirect(url);

  // Copy any Set-Cookie headers from the session refresh into the redirect.
  sessionResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    redirectResponse.cookies.set(name, value, options);
  });

  return redirectResponse;
}

export const config = {
  matcher: [
    // Match everything except: _next internals, api routes, files with extensions
    // (sitemap.xml, robots.txt, favicon.ico, og images), and the opengraph-image route.
    "/((?!_next|api|opengraph-image|.*\\..*).*)",
  ],
};
