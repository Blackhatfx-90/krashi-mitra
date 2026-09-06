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

const CACHE_VERSION = 'krashi-mitra-v34';
const MODELS_CACHE  = 'krashi-mitra-models';   // naam sthir rahega — mat badlein

/* Sarkari officer ka Regional Admin dashboard (alag React app) yahan rehta hai.
   Yeh KISAN wali app se poori tarah alag hai — na iske page kisan ke shell me
   jaate hain, na yeh pre-cache hota hai (usme internet hamesha rehta hai). */
const ADMIN_PATH = 'regional-admin';

/* App shell — install ke waqt yahi cache hota hai (models NAHI). */
/* Ab site ke do hisse hain:
     /       -> landing / login / signup  (naya, nayi files)
     /app    -> kisan wali scan app       (purani, bilkul waisi hi)
   Dono ek hi service worker ke andar hain, par har page APNE URL par cache
   hota hai — pehle sab kuch './' par likha jata tha, jisse landing aur app
   ek doosre ko mita dete. */
const APP_PATH = 'app';

const APP_SHELL = [
  './',                 // landing
  './app',              // kisan wali app — asli app shell
  './login',
  './signup',
  './css/landing.css',
  './css/auth.css',
  './css/landing-tour.css',
  './js/landing.js',
  './js/auth.js',
  './js/landing-tour.js',
  './assets/logo-icon.png',
  // NOTE: './index.html' JAAN-BOOJH KAR yahan nahi hai.
  // Vercel me cleanUrls on hai, isliye /index.html -> 308 redirect -> /
  // Redirect wala jawab cache karke navigation me dena browser MANA karta hai
  // (ERR_FAILED aata hai). Isliye hum sirf './' rakhte hain.
  './css/style.css',
  './js/script.js',
  './js/tf.min.js',
  // Guided tour + voice assistant (alag files — Feature A & B)
  './css/tour.css',
  './css/voice.css',
  './js/tour.js',
  './js/voice-assistant.js',
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

  /* --- NAVIGATION (page khulna) — redirect-safe ---------------------------
   * Browser navigation ke liye AISA jawab kabhi nahi leta jo redirect hokar
   * aaya ho (response.redirected === true) — wo seedha ERR_FAILED de deta hai.
   * Vercel ka cleanUrls /index.html ko / par bhejta hai, isliye yahan hum
   * redirect wale jawab ki ek SAAF copy bana kar dete hain.
   * ---------------------------------------------------------------------- */
  if (req.mode === 'navigate') {
    /* ⚠️ /regional-admin ek ALAG app hai (sarkari officer ka dashboard).
     * Uske page ko kisan wali app ke shell ('./') me likh dena bahut bada
     * bug hota: offline kholne par kisan ko apni app ki jagah admin dashboard
     * dikhne lagta. Isliye admin ke page apne hi URL par cache hote hain.  */
    /* Har page apne hi URL par cache hota hai — landing, app aur admin
       teeno alag. Pehle sab './' par jaate the, jisse ek doosre ko mita dete. */
    const isAdmin = url.pathname.indexOf('/' + ADMIN_PATH) === 0;
    const shellKey = req;

    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      try {
        const fresh = await fetch(req);

        if (fresh && fresh.redirected) {
          // Redirect ke baad wala asli page — nayi, bina-redirect wali copy banao
          const body = await fresh.blob();
          const copy = new Response(body, {
            status: 200,
            statusText: 'OK',
            headers: fresh.headers,
          });
          cache.put(shellKey, copy.clone());
          return copy;
        }

        if (fresh && fresh.ok) cache.put(shellKey, fresh.clone());
        return fresh;
      } catch (_) {
        // Offline — cache se wahi shell do jo is app ka hai
        /* Offline: pehle bilkul wahi page, phir uske app ka shell */
        let shell = await cache.match(req, { ignoreSearch: true });
        if (!shell && !isAdmin) {
          // /app ke andar ka koi bhi rasta -> app ka shell
          shell = url.pathname.indexOf('/' + APP_PATH) === 0
            ? await cache.match('./app')
            : await cache.match('./');
        }
        if (shell) return shell;
        if (isAdmin) {
          return new Response(
            'Offline: Regional Admin dashboard ke liye internet chahiye.',
            { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
          );
        }
        return new Response('Offline: ऐप अभी कैश में नहीं है। एक बार इंटरनेट के साथ खोलें।', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })());
    return;
  }

  /* Cache-first SIRF vendor library ke liye (tf.min.js — 1.5 MB, kabhi badalti
   * nahi). App ka apna script.js/style.css cache-first NAHI hona chahiye, warna
   * naya code deploy karne par bhi purana hi chalta rehta hai jab tak
   * CACHE_VERSION na badle — team ka aadha din isi me nikal jata hai. */
  const isHeavyAsset = url.pathname.indexOf('tf.min.js') !== -1;

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

    // (navigation upar alag se handle ho chuka hai)
    return new Response('Offline: यह फ़ाइल कैश में नहीं मिली।', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  })());
});
