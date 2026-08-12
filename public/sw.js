const CACHE = "baylayer-shell-v1";
const SHELL = ["/", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch((error) => {
        console.warn("Shell precache failed", error);
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .catch((error) => {
        console.warn("Stale cache cleanup failed", error);
      }),
  );
  self.clients.claim();
});

function offlineResponse() {
  return new Response("You are offline and this page is not cached yet.", {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function fromCache(request) {
  try {
    const cached = (await caches.match(request)) || (await caches.match("/"));
    return cached || offlineResponse();
  } catch (error) {
    console.warn("Cache lookup failed", error);
    return offlineResponse();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_vinext/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches
              .open(CACHE)
              .then((cache) => cache.put(request, copy))
              .catch((error) => {
                console.warn("Runtime cache write failed", error);
              }),
          );
        }
        return response;
      })
      .catch(() => fromCache(request)),
  );
});
