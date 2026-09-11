/* ============================================================================
 * KRASHI MITRA — SOOCHNA SEVA (ek hi jagah se saari notification)
 * js/notify.js
 *
 * KYUN BANI
 *   Ab app ki chaar-paanch jagah se soochna aati hai — rog ki chetavni,
 *   fasal calendar ka reminder, samudaay me kisi ne jawab diya, vibhag ka
 *   broadcast. Agar har module apni marzi se ghanti bajaye to kisan ke phone
 *   par ek saath 6 notification girengi. Plantix ki sabse badi shikayat yahi
 *   hai — log app hi uninstall kar dete hain.
 *
 *   Isliye ab HAR soochna yahin se jaati hai, aur yeh seva teen kaam karti hai:
 *
 *   1. SHRENI (category) — kisan chun sakta hai kaunsi soochna chahiye.
 *      Samudaay ke jawab band kar de par rog ki chetavni chaalu rakhe.
 *
 *   2. KATAAR (queue) — ek saath 6 aayein to 6 ghantiyan nahi bajti.
 *      Ek-ek karke, beech me 45 second ka faasla dekar bheji jaati hain.
 *
 *   3. SEEMA (rate limit) — ek ghante me itni se zyada nahi. Seema paar ho
 *      to baaki ko ek hi "3 nayi soochnaayein" me jod diya jata hai.
 *
 * EK APVAAD — VIBHAG KA BROADCAST
 *   'broadcast' shreni sarkari chetavni hai (ola, tiddi dal, rog ka prakop).
 *   Yeh kisan ke mute ko bhi lāngh jaati hai aur kataar me sabse aage lagti
 *   hai. Baaki saari shreniyan kisan ki marzi maanti hain.
 *
 * Ghanti/kampan/notification ka kaam js/alerts.js (kmAlerts) karta hai —
 * yeh seva sirf yeh tay karti hai ki KYA, KAB aur KITNA bhejna hai.
 * ========================================================================= */

(function () {
  'use strict';

  const PREF_KEY  = 'km.notify.prefs.v1';
  const QUEUE_KEY = 'km.notify.queue.v1';
  const LOG_KEY   = 'km.notify.log.v1';    // kab-kab bheji — seema naapne ke liye

  /* ---------------------------------------------------------------------
   * SHRENIYAN
   * mutable:false  -> kisan ise band nahi kar sakta (sarkari chetavni)
   * perHour        -> is shreni ki apni seema
   * ------------------------------------------------------------------- */
  const CATEGORIES = {
    broadcast: { hi: 'कृषि विभाग की चेतावनी', mutable: false, perHour: 12, priority: 0 },
    outbreak:  { hi: 'रोग फैलने की चेतावनी',   mutable: true,  perHour: 4,  priority: 1 },
    weather:   { hi: 'मौसम की चेतावनी',        mutable: true,  perHour: 3,  priority: 2 },
    calendar:  { hi: 'फसल कैलेंडर के काम',     mutable: true,  perHour: 2,  priority: 3 },
    community: { hi: 'समुदाय में जवाब',        mutable: true,  perHour: 2,  priority: 4 },
  };

  /* Poore app ki seema — chahe shreniyan alag-alag hon */
  const MAX_PER_HOUR   = 6;
  const MIN_GAP_MS     = 45 * 1000;    // do soochnaon ke beech kam se kam
  const DIGEST_AFTER   = 3;            // itni se zyada kataar me ho to ek me jodo
  const QUEUE_MAX      = 40;
  const TICK_MS        = 10 * 1000;

  /* ---------- chhote helpers ------------------------------------------ */
  const now = () => Date.now();

  function read(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
    catch (_) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  /* ---------- kisan ki marzi ------------------------------------------ */
  function prefs() {
    const p = read(PREF_KEY, {});
    // default: sab chaalu
    Object.keys(CATEGORIES).forEach((c) => { if (p[c] === undefined) p[c] = true; });
    return p;
  }
  function setCategory(cat, on) {
    if (!CATEGORIES[cat]) return false;
    if (!CATEGORIES[cat].mutable && !on) return false;   // sarkari chetavni band nahi hoti
    const p = prefs();
    p[cat] = !!on;
    write(PREF_KEY, p);
    return true;
  }
  function isMuted(cat) {
    const c = CATEGORIES[cat];
    if (!c) return false;
    if (!c.mutable) return false;          // broadcast kabhi mute nahi
    return prefs()[cat] === false;
  }

  /* ---------- kab-kab bheji (seema naapne ke liye) -------------------- */
  function log() {
    const cutoff = now() - 60 * 60 * 1000;
    return read(LOG_KEY, []).filter((e) => e.at > cutoff);   // sirf pichhle 1 ghante ka
  }
  function noteSent(cat) {
    const l = log();
    l.push({ cat: cat, at: now() });
    write(LOG_KEY, l.slice(-60));
  }
  function sentLastHour(cat) {
    const l = log();
    return cat ? l.filter((e) => e.cat === cat).length : l.length;
  }
  function lastSentAt() {
    const l = log();
    return l.length ? Math.max.apply(null, l.map((e) => e.at)) : 0;
  }

  /* ---------- kataar --------------------------------------------------- */
  function queue() { return read(QUEUE_KEY, []); }
  function saveQueue(q) { write(QUEUE_KEY, q.slice(0, QUEUE_MAX)); }

  /**
   * Nayi soochna kataar me lagao.
   * @param {object} n { id, category, severity, title, body, url }
   * @returns {object} { queued:boolean, reason?:string }
   */
  function push(n) {
    if (!n || !n.category || !CATEGORIES[n.category]) {
      return { queued: false, reason: 'shreni galat' };
    }
    if (isMuted(n.category)) {
      return { queued: false, reason: 'kisan ne is shreni ko band kiya hai' };
    }

    const id = String(n.id || (n.category + ':' + (n.title || '') + ':' + now()));
    const q = queue();
    if (q.some((x) => x.id === id)) return { queued: false, reason: 'pehle se kataar me' };

    q.push({
      id: id,
      category: n.category,
      severity: n.severity === 'critical' ? 'critical'
              : n.severity === 'warning' ? 'warning' : 'info',
      title: String(n.title || CATEGORIES[n.category].hi),
      body: String(n.body || ''),
      url: n.url || '',
      at: now(),
    });

    /* Kram: pehle shreni ki priority (broadcast sabse upar), phir gambhirta,
       phir jo pehle aayi. */
    const sev = { critical: 0, warning: 1, info: 2 };
    q.sort((a, b) =>
      (CATEGORIES[a.category].priority - CATEGORIES[b.category].priority) ||
      (sev[a.severity] - sev[b.severity]) ||
      (a.at - b.at));

    saveQueue(q);
    setTimeout(drain, 0);                  // ho sake to abhi bhej do
    return { queued: true, id: id };
  }

  /* ---------------------------------------------------------------------
   * Kataar se ek soochna bhejna — saari seemaayein yahan lagti hain
   * ------------------------------------------------------------------- */
  function drain() {
    const q = queue();
    if (!q.length) return { sent: 0, reason: 'kataar khali' };

    const head = q[0];
    const cat = CATEGORIES[head.category];
    const isBroadcast = head.category === 'broadcast';
    const gap = now() - lastSentAt();

    /* Sarkari chetavni ke alawa sab par faasla aur seema lagti hai */
    if (!isBroadcast) {
      if (gap < MIN_GAP_MS) {
        return { sent: 0, reason: 'abhi ' + Math.ceil((MIN_GAP_MS - gap) / 1000) + ' sec baaki' };
      }
      if (sentLastHour() >= MAX_PER_HOUR) {
        return { sent: 0, reason: 'is ghante ki seema poori (' + MAX_PER_HOUR + ')' };
      }
      if (sentLastHour(head.category) >= cat.perHour) {
        return { sent: 0, reason: head.category + ' ki ghante-bhar ki seema poori' };
      }
    }

    /* Bahut saari ikatthi ho gayin to ek hi me jod do — 5 ghantiyan nahi */
    const sameCat = q.filter((x) => x.category === head.category);
    let toSend, rest;

    if (sameCat.length >= DIGEST_AFTER) {
      toSend = {
        id: head.category + ':digest:' + now(),
        category: head.category,
        severity: head.severity,
        title: sameCat.length + ' नई ' + cat.hi,
        body: sameCat.slice(0, 3).map((x) => '• ' + x.title).join('\n') +
              (sameCat.length > 3 ? '\n• और ' + (sameCat.length - 3) + '…' : ''),
        url: head.url,
      };
      rest = q.filter((x) => x.category !== head.category);
    } else {
      toSend = head;
      rest = q.slice(1);
    }

    saveQueue(rest);
    deliver(toSend);
    noteSent(toSend.category);
    return { sent: 1, id: toSend.id, baaki: rest.length };
  }

  /* Asli ghanti — js/alerts.js ke haath me */
  function deliver(n) {
    if (window.kmAlerts && typeof window.kmAlerts.alert === 'function') {
      window.kmAlerts.alert({
        id: n.id,
        severity: n.severity,
        title: n.title,
        body: n.body,
        url: n.url,
        createdAt: new Date().toISOString(),
      });
    } else {
      console.info('[notify]', n.category, '—', n.title);   // alerts.js na ho to bhi na toote
    }
    try {
      window.dispatchEvent(new CustomEvent('km:notification', { detail: n }));
    } catch (_) {}
  }

  /* ---------- halat dekhne ke liye ------------------------------------ */
  function status() {
    const p = prefs();
    return {
      shreniyan: Object.keys(CATEGORIES).map((c) => ({
        id: c,
        naam: CATEGORIES[c].hi,
        chaalu: !isMuted(c),
        badlaJaSakta: CATEGORIES[c].mutable,
        isGhanteMe: sentLastHour(c) + ' / ' + CATEGORIES[c].perHour,
      })),
      kataarMe: queue().length,
      isGhanteMeKul: sentLastHour() + ' / ' + MAX_PER_HOUR,
      agliSoochnaTak: Math.max(0, MIN_GAP_MS - (now() - lastSentAt())),
    };
  }

  function clearQueue() { saveQueue([]); }
  function resetLimits() { write(LOG_KEY, []); }     // sirf testing ke liye

  /* Har 10 second kataar dekho — page khula ho tab */
  let timer = null;
  function start() {
    if (timer) return;
    timer = setInterval(drain, TICK_MS);
    setTimeout(drain, 1500);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(drain, 500);    // wapas aate hi dekho
  });

  window.kmNotify = {
    push, drain, status, setCategory, prefs, isMuted,
    clearQueue, resetLimits, start, stop,
    CATEGORIES: CATEGORIES,
    _limits: { MAX_PER_HOUR, MIN_GAP_MS, DIGEST_AFTER },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})();
