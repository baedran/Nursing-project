// Minimal service worker. Two jobs only: (1) make the app installable on
// Android, (2) launch fast + show a friendly page when truly offline.
//
// PHI RULE: caches ONLY same-origin static assets (Next build chunks, icons,
// the offline page). Never caches portal pages, summaries, wound photos, or any
// Supabase/API response. Patient data must never sit in the device cache.
const CACHE = "cgc-static-v2";
const PRECACHE = ["/offline.html", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // writes always hit the network

  const url = new URL(req.url);
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname === "/offline.html");

  // Static assets: cache-first (they are immutable / non-PHI).
  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // Page navigations: network-only, fall back to the offline page if offline.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  // Everything else (data, photos, APIs): network-only. Nothing cached.
});
