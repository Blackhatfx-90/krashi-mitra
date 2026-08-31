/* ============================================================================
 * sw.js — Service Worker
 *
 * Kaam: app ko OFFLINE-FIRST banata hai.
 *
 * DO ALAG CACHE hain — yeh design jaan-boojh kar hai:
 *
 *   1. CACHE_VERSION  -> app shell (html/css/js/tf.min.js). Chhota hai.
 *      App update hone par version badalta hai aur purana cache delete ho jata hai.
 *
 *   2. MODELS_CACHE   -> fasal ke AI models (models/<crop>/*). Bhaari hain (~2 MB per fasal).
 *      Iska naam KABHI nahi badalta, isliye app update hone par kisan ke
 *      download kiye hue models dobara download nahi karne padte.
 *
 * MODELS PRE-CACHE NAHI HOTE. Kyun?
 *   7 fasal x ~2.2 MB = ~15 MB. Pehli baar khulte hi itna mobile data kaat lena
 *   theek nahi. Iske badle:
 *     - jis fasal ko kisan actually use karta hai, wo apne aap cache ho jaati hai
 *     - "Offline & Help" screen me har fasal ke liye "डाउनलोड करें" button hai,
 *       taaki khet jaane se pehle (wifi par) model pehle se utaar liya jaye
 *
 * TEAM NOTE: HTML/CSS/JS badlo to neeche CACHE_VERSION ka number badha do.
 * Model files badlo to kuch mat karo — unka apna cache hai aur app khud
 * naya version le aati hai jab download dobara dabaya jaye.
 * ========================================================================= */

const CACHE_VERSION = 'krashi-mitra-v13';
const MODELS_CACHE  = 'krashi-mitra-models';   // naam sthir rahega — mat badlein

/* App shell — install ke waqt yahi cache hota hai (models NAHI). */
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './js/tf.min.js',
  './manifest.json',
  './icon.svg',
  './assets/logo.svg',

  // PWA icons — inke bina Chrome "Install app" offer hi nahi karta
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
];

/* ---------- INSTALL: sirf app shell ---------------------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);

    // Har file alag-alag add karte hain, taaki ek file missing hone par
    // poora install fail na ho jaye.
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

/* ---------- ACTIVATE: purane app-shell cache hatao ------------------------
 * MODELS_CACHE ko HAATH NAHI LAGATE — wahi to kisan ka offline model hai.
 * ------------------------------------------------------------------------ */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== CACHE_VERSION && k !== MODELS_CACHE)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* ---------- FETCH ---------------------------------------------------------
 * models/         -> MODELS_CACHE se cache-first; network se aaye to cache me daal do
 * js/ ki bhaari   -> cache-first
 * baaki app files -> stale-while-revalidate (turant cache se, peeche update)
 * /api/           -> bilkul haath nahi lagate (online AI ka jawab cache nahi karna)
 * ------------------------------------------------------------------------ */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // CDN etc. ko haath mat lagao
  if (url.pathname.startsWith('/api/')) return;      // online AI — hamesha taaza

  /* --- MODELS: apna alag, sthir cache --- */
  if (url.pathname.includes('/models/')) {
    event.respondWith((async () => {
      const cache = await caches.open(MODELS_CACHE);
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const res = await fetch(req);
        // Jis fasal ko kisan use kar raha hai wo apne aap offline ho jaati hai
        if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
        return res;
      } catch (_) {
        return new Response(
          'Offline: is fasal ka model abhi download nahi hua hai.',
          { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  const isHeavyAsset = url.pathname.includes('/js/');

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
