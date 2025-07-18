const CACHE_NAME = "spendr-v1";
const ASSETS = [
    "/expense-tracker/",
    "/expense-tracker/index.html",
    "/expense-tracker/style.css",
    "/expense-tracker/script.js",
    "/expense-tracker/icons/icon-192x192.png",
    "/expense-tracker/icons/icon-512x512.png",
];

// Install Service Worker & Cache Files
self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

// Fetch Cached Files When Offline
self.addEventListener("fetch", (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
