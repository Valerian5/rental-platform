const CACHE_NAME = "rental-platform-v1"
const urlsToCache = ["/", "/static/js/bundle.js", "/static/css/main.css", "/manifest.json"]

// Installation du service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

// Activation du service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retourner la réponse du cache si disponible
      if (response) {
        return response
      }
      return fetch(event.request)
    }),
  )
})

// Notifications push
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Nouvelle notification",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Voir",
        icon: "/icon-check.png",
      },
      {
        action: "close",
        title: "Fermer",
        icon: "/icon-close.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("RentalPlatform", options))
})

// Gestion des clics sur les notifications
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})
