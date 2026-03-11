const CACHE_NAME="monolith-cache-999999";
const CACHE="monolith-v3-1770683485";
const ASSETS = [
  "/monolith/",
  "/monolith/index.html",
  "/monolith/rules.html",
  "/assets/monolith/monolith_logo.webp",
  "/assets/monolith/monolith_logo.png",
  "/assets/monolith/monolith_concept.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match("/monolith/")))
  );
});
