/* Service worker · Jornada II. La lista ASSETS y VERSION las actualiza tools/build.mjs. */
const VERSION = "10f418a918-iphone";
const CACHE = "jornada-ii-" + VERSION;
const ASSETS = [
  "./",
  "./assets/css/app.css",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon-32.png",
  "./assets/icons/favicon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-192.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/js/app.js",
  "./assets/js/data.js",
  "./ics/jornada-completa.ics",
  "./ics/sesion-1.ics",
  "./ics/sesion-2.ics",
  "./ics/sesion-3.ics",
  "./ics/sesion-4.ics",
  "./ics/sesion-5.ics",
  "./index.html",
  "./manifest.webmanifest"
];

const SCOPE = new URL("./", self.location).href;
const INDEX = new URL("./index.html", self.location).href;
const NAV_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((a) => new Request(a, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("jornada-ii-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isAppShell(url) {
  const u = url.origin + url.pathname;
  return u === SCOPE || u === INDEX;
}

// Página principal: red primero (con tiempo límite) para recoger cambios de agenda; si no hay red, caché.
async function appShell(event) {
  const cache = await caches.open(CACHE);
  const network = fetch(event.request).then((res) => {
    if (res && res.ok) cache.put(INDEX, res.clone());
    return res;
  });
  event.waitUntil(network.then(() => {}, () => {}));
  const cached = await cache.match(INDEX);
  if (!cached) return network;
  try {
    return await Promise.race([
      network,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), NAV_TIMEOUT_MS)),
    ]);
  } catch (e) {
    return cached;
  }
}

// Resto de archivos: caché primero; si faltan, red y se guardan.
async function asset(request) {
  const hit = await caches.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok && res.type === "basic") {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(request, copy));
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;
  if (req.mode === "navigate" && isAppShell(url)) {
    event.respondWith(appShell(event));
    return;
  }
  event.respondWith(asset(req));
});
