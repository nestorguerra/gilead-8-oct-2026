'use strict';

// Solo se gestionan las cachés con este prefijo; las de otras apps del mismo dominio no se tocan.
const PREFIJO = 'gilead-agenda-8oct2026-';
const CACHE = PREFIJO + 'v2';

const RECURSOS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './agenda.ics',
  './ics/sesion-1.ics',
  './ics/sesion-2.ics',
  './ics/sesion-3.ics',
  './ics/sesion-4.ics',
  './ics/sesion-5.ics',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(RECURSOS.map((ruta) => new Request(ruta, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(
        nombres
          .filter((nombre) => nombre.startsWith(PREFIJO) && nombre !== CACHE)
          .map((nombre) => caches.delete(nombre))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  evento.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const esNavegacion = peticion.mode === 'navigate';
    const guardada = await cache.match(peticion, { ignoreSearch: true }) ||
      (esNavegacion ? await cache.match('./index.html') : undefined);

    // Respuesta inmediata desde la caché propia y actualización en segundo plano.
    const red = fetch(peticion).then((respuesta) => {
      if (respuesta.ok && respuesta.type === 'basic' && !url.search) {
        cache.put(peticion, respuesta.clone());
      }
      return respuesta;
    });

    if (guardada) {
      evento.waitUntil(red.catch(() => {}));
      return guardada;
    }
    return red.catch(() => Response.error());
  })());
});
