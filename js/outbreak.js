/* ============================================================================
 * KRASHI MITRA — JILE KA PRAKOP (outbreak)
 * js/outbreak.js
 *
 * "Aapke jile me gehun me rattua phail raha hai — 8 kisan, 3 gaon."
 *
 * KYUN
 *   Apna khet dekh kar kisan ko pata nahi chalta ki padosi gaon me wahi rog
 *   aa chuka hai. Jab tak apne khet me dikhta hai, der ho chuki hoti hai.
 *   Rog phailne se pehle chetavni mile to bachav sasta hai — dawa baad me
 *   mehngi padti hai.
 *
 * AANKDE KAHAN SE
 *   api/outbreaks se, jo khud kisano ki jaanch (scans) jod kar banta hai.
 *   Wahan se kabhi kisi ka naam ya phone nahi aata — sirf ginti, jila,
 *   fasal aur rog.
 *
 * SOOCHNA
 *   Ghanti seedhi nahi bajate — js/notify.js ki kataar se, 'outbreak' shreni
 *   me. Isliye ek saath teen prakop milen to teen ghantiyan nahi bajengi,
 *   aur kisan ne shreni band ki ho to kuch nahi bajega.
 *
 *   Ek prakop par ek hi baar bajti hai. Dobara sirf tab jab haalat bigde —
 *   'nazar' se 'chetavni' ho jaye. Warna roz wahi chetavni aati rehti aur
 *   kisan dekhna band kar deta.
 *
 * OFFLINE
 *   Aakhri jawab localStorage me rehta hai, to network na ho to bhi kal ki
 *   chetavni dikhti hai — saath me "kab ki jankari hai" bhi likha jata hai.
 * ========================================================================= */

(function () {
  'use strict';

  const CACHE_KEY = 'km.outbreak.cache.v1';
  const SEEN_KEY  = 'km.outbreak.seen.v1';
  const PREFS_KEY = 'km.preferences.v1';
  const ENDPOINT  = 'api/outbreaks';

  const REFRESH_MS = 6 * 60 * 60 * 1000;   // 6 ghante me ek baar kaafi hai
  const STALE_MS   = 3 * 24 * 60 * 60 * 1000;
  const RANK = { nazar: 1, chetavni: 2, gambhir: 3 };

  function read(k, d) {
    try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; }
    catch (_) { return d; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {}
  }

  /** Kisan ka jila — profile se. Na ho to prakop nahi bata sakte. */
  function district() {
    const p = read(PREFS_KEY, {});
    return (p.district || '').trim();
  }

  function cache() { return read(CACHE_KEY, { at: 0, district: '', outbreaks: [] }); }

  /* ---------------------------------------------------------------------
   * Server se laana
   * ------------------------------------------------------------------- */
  async function refresh(opts) {
    const o = opts || {};
    const d = district();
    if (!d) return { ok: false, reason: 'jila pata nahi — profile me bharein' };

    const c = cache();
    if (!o.force && c.district === d && (Date.now() - c.at) < REFRESH_MS) {
      return { ok: true, fromCache: true, outbreaks: c.outbreaks };
    }

    try {
      const res = await fetch(ENDPOINT + '?district=' + encodeURIComponent(d), { cache: 'no-store' });
      if (!res.ok) throw new Error('http_' + res.status);
      const data = await res.json();
      if (!data || !data.ok) throw new Error('bad_reply');

      const list = data.outbreaks || [];
      write(CACHE_KEY, { at: Date.now(), district: d, outbreaks: list, storage: data.storage });
      notifyNew(list);
      emit();
      return { ok: true, outbreaks: list, storage: data.storage };

    } catch (err) {
      /* Network gaya — purana dikhate rahenge, chup-chaap */
      return { ok: false, offline: true, reason: err.message, outbreaks: c.outbreaks };
    }
  }

  /* ---------------------------------------------------------------------
   * Kis prakop par ghanti bajani hai
   * Naya ho, ya pehle se bura ho gaya ho. Warna nahi.
   * ------------------------------------------------------------------- */
  function notifyNew(list) {
    if (!window.kmNotify) return;
    const seen = read(SEEN_KEY, {});
    let changed = false;

    list.forEach((o) => {
      const was = seen[o.id];
      const nowRank = RANK[o.level] || 0;
      if (was && (RANK[was] || 0) >= nowRank) return;     // kuch naya nahi

      const fasal = o.cropNameHi || o.crop;
      const rog = o.diseaseHi || o.diseaseEn || o.label;

      window.kmNotify.push({
        id: 'outbreak:' + o.id + ':' + o.level,
        category: 'outbreak',
        severity: o.severity || 'warning',
        title: fasal + ' में ' + rog + ' — ' + o.district,
        body: o.farmerCount + ' किसानों के खेत में मिला' +
              (o.villageCount > 1 ? ', ' + o.villageCount + ' गाँव में' : '') + '. ' +
              (o.confirmed ? 'कृषि विभाग ने जाँच की है. ' : '') +
              (o.level === 'gambhir' ? 'अपने खेत को आज ही देखें.'
                                     : 'अपने खेत पर नज़र रखें.'),
      });
      seen[o.id] = o.level;
      changed = true;
    });

    /* Jo prakop khatam ho gaye unki yaad hata do, warna list badhti rehti */
    const live = {};
    list.forEach((o) => { live[o.id] = 1; });
    Object.keys(seen).forEach((id) => { if (!live[id]) { delete seen[id]; changed = true; } });

    if (changed) write(SEEN_KEY, seen);
  }

  /* ---------------------------------------------------------------------
   * Dikhane ke liye
   * ------------------------------------------------------------------- */
  function list() { return cache().outbreaks || []; }

  /** Kisan ki chuni hui fasal ke prakop pehle — wahi uske kaam ke hain. */
  function forCrop(cropId) {
    const all = list();
    if (!cropId) return all;
    const mine = all.filter((o) => o.crop === cropId);
    return mine.length ? mine : all;
  }

  function info() {
    const c = cache();
    return {
      district: c.district || district(),
      count: (c.outbreaks || []).length,
      updatedAt: c.at || 0,
      purani: c.at ? (Date.now() - c.at) > STALE_MS : false,
      storage: c.storage || '',
    };
  }

  function emit() {
    try { window.dispatchEvent(new CustomEvent('km:outbreaks', { detail: info() })); }
    catch (_) {}
  }

  function clear() { write(CACHE_KEY, { at: 0, district: '', outbreaks: [] }); write(SEEN_KEY, {}); }

  window.kmOutbreak = { refresh, list, forCrop, info, clear, _notifyNew: notifyNew };

  /* App khulne ke thodi der baad — turant nahi, warna model load ke saath
     takraata hai aur pehla scan slow lagta hai. */
  function boot() { setTimeout(() => { refresh(); }, 6000); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }

  /* Network wapas aaya to ek baar phir dekh lo */
  window.addEventListener('online', () => setTimeout(() => refresh({ force: true }), 2000));
})();
