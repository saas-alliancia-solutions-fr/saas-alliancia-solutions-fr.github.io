const CACHE_PREFIX = "saas-versioned-static-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const VERSIONED_FILE = /-v\d+\.(?:avif|webp|png|jpe?g|svg)$/i;
const VERSIONED_QUERY_FILE = /\.(?:css|js)$/i;

const isVersionedStaticAsset = (url) => (
  url.origin === self.location.origin
  && (
    VERSIONED_FILE.test(url.pathname)
    || (url.searchParams.has("v") && VERSIONED_QUERY_FILE.test(url.pathname))
  )
);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (!isVersionedStaticAsset(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    }),
  );
});
