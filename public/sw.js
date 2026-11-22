/**
 * CALLBACX TECHNOLOGY — Service Worker
 *
 * Provides offline fallback and caching strategies for the admin dashboard
 * and PWA installability. Serves cached assets when offline and
 * falls back to a offline page for navigation requests.
 */

const CACHE_NAME = "callbacx-admin-v1";
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = [
  "/",
  "/dashboard/admin",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-72x72.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

// ---------------------------------------------------------------------------
// Install: cache static assets
// ---------------------------------------------------------------------------

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Failed to cache some assets:", err);
      });
    })
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate: clean up old caches
// ---------------------------------------------------------------------------

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch: network-first for API, cache-first for static, offline fallback
// ---------------------------------------------------------------------------

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network-first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET responses
          if (request.method === "GET" && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || new Response(JSON.stringify({ error: { code: "OFFLINE", message: "You are offline." } }), { status: 503, headers: { "Content-Type": "application/json" } }));
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && request.method === "GET") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for HTML navigations
        if (request.destination === "document") {
          return caches.match(OFFLINE_URL);
        }
        return new Response("Offline", { status: 503 });
      });
    })
  );
});

// ---------------------------------------------------------------------------
// Push notifications (placeholder for future mobile push)
// ---------------------------------------------------------------------------

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || "You have a new notification from CALLBACX Admin.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: data.tag || "admin-notification",
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(data.title || "CALLBACX Admin", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(new URL(url).origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
