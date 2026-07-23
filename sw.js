const CACHE_NAME = "kfg-map-cache-v20260723-8";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./docs/images/webapp.png",
  "./src/css/style.css",
  "./src/js/i18n.js",
  "./src/js/config.js",
  "./src/js/boundary.js",
  "./src/js/shadow.js",
  "./src/js/pois.js",
  "./src/js/help.js",
  "./src/js/streets.js",
  "./src/js/map.js",
  "./src/js/pwa.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isStaticAsset = /\.(css|js|json|png|jpg|jpeg|svg|webp|ico|gif)$/i.test(url.pathname);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (!isSameOrigin && !url.hostname.includes("kfg-gis-2026.github.io") && !url.hostname.includes("unpkg.com")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => {
        const cached = caches.match(event.request);
        return cached.then((result) => result || caches.match("./index.html"));
      })
  );
});
