// Service Worker: guarda la app en el teléfono para que abra sin internet.
// Si cambias cualquier archivo de la app, sube también este número de versión.
const VERSION = 'v6';
const CACHE = 'cronicas-' + VERSION;

const NUCLEO = [
  './', 'index.html', 'styles.css', 'datos.js', 'personajes.js', 'almacen.js', 'app.js',
  'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png',
  'fondo-portada.svg', 'personajes.webp', 'mapa-gris.webp', 'mapa-color.webp', 'santuario-escena.webp', 'niebla.webp'
];
// Archivos que se añadirán después (si aún no existen, no pasa nada).
const OPCIONALES = ['fuente-titulos.woff2', 'fuente-texto.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(NUCLEO);
    await Promise.allSettled(OPCIONALES.map((u) => c.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const claves = await caches.keys();
    await Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const guardado = await caches.match(req, { ignoreSearch: true });
    if (guardado) return guardado;
    try {
      const resp = await fetch(req);
      if (resp.ok) (await caches.open(CACHE)).put(req, resp.clone());
      return resp;
    } catch (err) {
      if (req.mode === 'navigate') return caches.match('index.html');
      return new Response('', { status: 504 });
    }
  })());
});
