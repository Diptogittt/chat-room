const CACHE_NAME = 'chat-app-cache-v1';
const urlsToCache = [
    '/index.html',
    '/style.css',
    '/index.js',
];
async function ac() {
   const cache = await caches.open(CACHE_NAME)
    return cache.addAll(urlsToCache)
}
self.addEventListener('install', (event) => {
    console.log("actived sw i")
    event.waitUntil(ac())
});
async function fc(event) {
  try {
      const response = await fetch(event.request)
      return response
  } catch (error) {
      const cache = await caches.open(CACHE_NAME)
      const cachedResponse = await cache.match(event.request)
      return cachedResponse
  }
}
self.addEventListener('fetch', (event) => {
     console.log("actived sw fc")
  event.respondWith(fc(event));
});
self.addEventListener('activate', (event) => {
     console.log("actived sw ac")
    
});

/* const cacheWhitelist = [CACHE_NAME];
event.waitUntil(
    caches.keys().then((cacheNames) => {
        return Promise.all(
cacheNames.map((cacheName) => {
                if (cacheWhitelist.indexOf(cacheName) === -1) {
                    return caches.delete(cacheName);
                }
            })
        );
    })
);*/