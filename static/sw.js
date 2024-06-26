const CACHE_NAME = 'flask-app-cache-v1';
const urlsToCache = [
    '/',
    '/static/imhotep_finance.ico',
    '/static/imhotep_finance.jpeg',
    '/static/manifest.json',
    '/static/style.css',
    '/static/avatar-anonymous-300x300.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
