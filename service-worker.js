self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("khdomtak-cache").then((cache) => {
      return cache.addAll([
        "/Your-service-is-our/index.html",
        "/Your-service-is-our/css/style.css",
        "/Your-service-is-our/js/app.js"
      ]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
