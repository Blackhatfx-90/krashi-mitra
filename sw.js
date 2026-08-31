/* ============================================================================
 * sw.js — Service Worker
 *
 * Kaam: pehli baar load hone par saari files browser ke cache me daal deta hai,
 * uske baad app bina internet ke bhi chalti hai (offline-first).
 *
 * TEAM NOTE: jab bhi HTML/CSS/JS ya model badlo, neeche CACHE_VERSION ka number
 * badha do (v1 -> v2). Warna purani cached file hi milti rahegi.
 * ========================================================================= */

const CACHE_VERSION = 'krashi-mitra-v8';

/* App shell — ye files install ke time hi cache ho jaati hain. */
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './js/tf.min.js',
  './manifest.json',
  './icon.svg',
  './assets/logo.svg',

  // Rice model — Teachable Machine / TFJS export
  './models/rice/model.json',
  './models/rice/metadata.json',
  './models/rice/weights.bin',

  // Wheat model
  './models/wheat/model.json',
  './models/wheat/metadata.json',
  './models/wheat/weights.bin',

  // Onion model
  './models/onion/model.json',
  './models/onion/metadata.json',
  './models/onion/weights.bin',

  // Sugarcane model
  './models/sugarcane/model.json',
  './models/sugarcane/metadata.json',
  './models/sugarcane/weights.bin',
];

/* ---------- INSTALL: sab kuch cache karo ---------------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);

    // Har file alag-alag add karte hain, taaki ek file (jaise weights.bin ka naam
    // alag ho) missing hone par poora install fail na ho jaye.
    await Promise.all(APP_SHELL.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (err) {
        console.warn('[sw] cache nahi ho payi:', url, '-', err.message);
      }
    }));

    self.skipWaiting();
  })());
});

/* ---------- ACTIVATE: purane version ke cache hatao ---------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* ---------- FETCH ---------------------------------------------------------
 * model/ aur js/ ki bhaari files  -> CACHE FIRST (ek baar download, hamesha ke liye)
 * baaki app files (html/css/js)   -> STALE-WHILE-REVALIDATE (turant cache se,
 *                                     background me nayi copy le aata hai)
 * ------------------------------------------------------------------------ */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // CDN etc. ko haath mat lagao

  const isHeavyAsset = url.pathname.includes('/models/') || url.pathname.includes('/js/');

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(req, { ignoreSearch: true });

    if (isHeavyAsset && cached) return cached;        // cache-first

    const networkPromise = fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
        return res;
      })
      .catch(() => null);

    if (cached) {
      networkPromise;                                  // background me update
      return cached;
    }

    const fresh = await networkPromise;
    if (fresh) return fresh;

    // Offline + cache me bhi nahi -> navigation ho to index.html de do
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    return new Response('Offline: यह फ़ाइल कैश में नहीं मिली।', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  })());
});
