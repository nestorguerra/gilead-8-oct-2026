// Guarda la agenda para consultarla sin conexión tras la primera visita.
// Al cambiar cualquier archivo, sube la versión para que se renueve la caché.
// Solo se limpian cachés con este prefijo: otras apps del mismo dominio de GitHub Pages comparten origen.
const CACHE_PREFIX = 'agenda-8oct2026-';
const CACHE = `${CACHE_PREFIX}v2`;

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './agenda.ics',
  './sesion-1.ics',
  './sesion-2.ics',
  './sesion-3.ics',
  './sesion-4.ics',
  './sesion-5.ics',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Primero la caché (respuesta inmediata y sin conexión); se actualiza en segundo plano.
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // La página (con o sin index.html y con cualquier parámetro del QR) comparte una sola entrada.
  // Otras navegaciones, como abrir un .ics en iOS, usan su propio archivo.
  const scope = new URL(self.registration.scope);
  const isPage = request.mode === 'navigate' &&
    (url.pathname === scope.pathname || url.pathname === `${scope.pathname}index.html`);
  const key = isPage ? new Request(scope.href) : request;

  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(key, { ignoreSearch: true });
      const network = fetch(request)
        .then(response => {
          if (response && response.ok && response.type === 'basic') {
            cache.put(key, response.clone());
          }
          return response;
        })
        .catch(() => undefined);

      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      const response = await network;
      if (response) return response;
      const fallback = request.mode === 'navigate' ? await cache.match(scope.href) : undefined;
      return fallback || Response.error();
    })
  );
});
