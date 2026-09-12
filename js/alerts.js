/* ============================================================================
 * VRIDHI AI — chetavni ki ghanti (notification + kampan + awaaz)
 * js/alerts.js
 *
 * KYUN
 *   Krishi vibhag ki chetavni ("aaj shaam ola girega", "is ilaake me
 *   tiddi dal") tabhi kaam ki hai jab wo kisan tak PAHUNCHE. Ab tak wo
 *   sirf app ke andar ek card thi — phone jeb me ho to kabhi nahi dikhti.
 *
 *   Kisan ka phone aksar khet me, jeb me, ya trolley ki awaaz ke beech
 *   hota hai. Isliye teen tarike ek saath:
 *     1. System notification  — app band ho tab bhi dikhe
 *     2. Tez kampan           — jeb me mehsoos ho
 *     3. Oonchi ghanti        — shor me sunai de
 *
 * GHANTI KHUD BANTI HAI
 *   Koi mp3 file nahi — WebAudio se do-sur wali ghanti banti hai. Isse
 *   ek bhi byte download nahi hota (khet ka 2g), aur wo offline bhi bajti
 *   hai. Sur jaan-boojhkar 880/1320 Hz rakhe hain — is range me tractor/
 *   pump ki gehri gadgadahat ke ooper aawaz kat kar nikalti hai.
 *
 * BROWSER KI SEEMA — ye jaan lein
 *   - Notification ki AWAAZ browser/OS ke haath me hai. Hum uski loudness
 *     nahi badal sakte. Isliye jab app khuli ho (ya haal hi me khuli thi)
 *     to hum khud ghanti bajate hain — wahan hum volume control karte hain.
 *   - vibrate() ko "user gesture" chahiye kai browsers me. Isliye pehle
 *     tap par hum audio+vibration ko "unlock" kar lete hain.
 *   - iOS Safari me vibrate() hai hi nahi. Wahan sirf ghanti + notification.
 *
 * ANUMATI
 *   Hum apne aap anumati nahi maangte — wo dabav lagta hai aur log "Block"
 *   dabakar hamesha ke liye band kar dete hain. Kisan jab "chetavni chालू
 *   karein" dabata hai, tabhi maangte hain.
 * ========================================================================= */

(function () {
  'use strict';

  const PREF_KEY  = 'km.alerts.v1';
  const SHOWN_KEY = 'km.alerts.shown.v1';   // dobara wahi ghanti na baje

  /* Kampan ka namoona — lamba aur toota hua, taaki phone ki normal "tring"
     se alag lage aur jeb me pehchana jaye. [kampan, chup, kampan, ...] */
  const BUZZ = {
    critical: [400, 120, 400, 120, 400, 120, 700],
    warning:  [300, 150, 300, 150, 500],
    info:     [200, 120, 200]
  };

  /* Ghanti ke sur (Hz) aur har sur ka samay (ms). */
  const RING = {
    critical: [[880, 260], [1320, 260], [880, 260], [1320, 480]],
    warning:  [[880, 220], [1320, 380]],
    info:     [[880, 200]]
  };

  function prefs() {
    try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function savePrefs(p) {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (_) {}
  }

  function shown() {
    try { return JSON.parse(localStorage.getItem(SHOWN_KEY) || '[]'); }
    catch (_) { return []; }
  }
  function markShown(id) {
    const list = shown();
    if (list.indexOf(id) >= 0) return false;
    list.push(id);
    try { localStorage.setItem(SHOWN_KEY, JSON.stringify(list.slice(-80))); } catch (_) {}
    return true;
  }

  /* ---------- GHANTI --------------------------------------------------- */

  let ctx = null;

  function audio() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (_) { return null; }
    return ctx;
  }

  function ring(severity) {
    if (prefs().sound === false) return;
    const ac = audio();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});

    const notes = RING[severity] || RING.info;
    let at = ac.currentTime + 0.02;

    notes.forEach(([hz, ms]) => {
      const dur  = ms / 1000;
      const osc  = ac.createOscillator();
      const gain = ac.createGain();

      /* Square wave jaan-boojhkar — sine dheemi lagti hai. Iske harmonics
         shor ke beech kaan tak pahunchte hain. */
      osc.type = 'square';
      osc.frequency.setValueAtTime(hz, at);

      /* Bina fade ke "click" ki awaaz aati hai, isliye halka fade. */
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.32, at + 0.012);
      gain.gain.setValueAtTime(0.32, at + dur - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);

      osc.connect(gain).connect(ac.destination);
      osc.start(at);
      osc.stop(at + dur + 0.02);
      at += dur + 0.05;
    });
  }

  /* ---------- KAMPAN --------------------------------------------------- */

  function buzz(severity) {
    if (prefs().vibrate === false) return;
    if (!navigator.vibrate) return;                 // iOS Safari
    try { navigator.vibrate(BUZZ[severity] || BUZZ.info); } catch (_) {}
  }

  /* ---------- SYSTEM NOTIFICATION -------------------------------------- */

  async function systemNote(a, severity) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const body = String(a.message || a.messageHi || '').slice(0, 180);
    const opts = {
      body: body,
      icon: 'assets/icon-192.png',
      badge: 'assets/icon-192.png',
      tag: 'km-advisory-' + (a.id || ''),
      vibrate: BUZZ[severity] || BUZZ.info,
      /* critical chetavni apne aap gayab na ho — kisan ko dikhna chahiye
         chahe wo phone 10 minute baad uthaye. */
      requireInteraction: severity === 'critical',
      renotify: true,
      data: { url: 'app', id: a.id || '' }
    };

    /* SW ke through bhejna behtar hai — tab notification click par app
       khul sakti hai, aur app band hone par bhi dikhti rehti hai. */
    try {
      const reg = navigator.serviceWorker && await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(a.title || a.titleHi || 'कृषि विभाग की चेतावनी', opts);
        return;
      }
    } catch (_) { /* neeche wale tareeke par chalte hain */ }

    try { new Notification(a.title || a.titleHi || 'कृषि विभाग की चेतावनी', opts); }
    catch (_) {}
  }

  /* ---------- BAHAR SE BULANE KE LIYE ----------------------------------- */

  /* Ek chetavni par poora dhamaka: ghanti + kampan + notification.
     Ek hi id par dobara nahi bajti. */
  function alert(a) {
    if (!a) return false;
    const id = String(a.id || (a.title || '') + (a.createdAt || ''));
    if (!markShown(id)) return false;

    const severity = a.severity === 'critical' ? 'critical'
                   : a.severity === 'warning'  ? 'warning' : 'info';
    buzz(severity);
    ring(severity);
    systemNote(a, severity);
    return true;
  }

  /* Kai chetavniyan aayein to sabse gambhir wali par ek baar bajao —
     paanch ghantiyaan ek saath bajana kisan ko sirf gussa dilata hai. */
  function alertMany(list) {
    if (!Array.isArray(list) || !list.length) return;
    const order = { critical: 0, warning: 1, info: 2 };
    const fresh = list.filter(a => shown().indexOf(String(a.id || '')) < 0);
    if (!fresh.length) return;
    fresh.sort((x, y) => (order[x.severity] ?? 2) - (order[y.severity] ?? 2));
    alert(fresh[0]);
    fresh.slice(1).forEach(a => markShown(String(a.id || '')));
  }

  /* Kisan ne khud "chetavni chalu karein" dabaya — tabhi anumati maango. */
  async function enable() {
    const p = prefs();
    p.on = true; p.sound = p.sound !== false; p.vibrate = p.vibrate !== false;
    savePrefs(p);

    unlock();                                    // gesture abhi zinda hai

    if (!('Notification' in window)) return { ok: true, note: 'no-notification-api' };
    if (Notification.permission === 'granted') return { ok: true };
    if (Notification.permission === 'denied')  return { ok: false, note: 'denied' };

    try {
      const r = await Notification.requestPermission();
      return { ok: r === 'granted', note: r };
    } catch (_) { return { ok: false, note: 'error' }; }
  }

  function disable() { const p = prefs(); p.on = false; savePrefs(p); }

  function status() {
    const p = prefs();
    return {
      on: p.on === true,
      sound: p.sound !== false,
      vibrate: p.vibrate !== false,
      canVibrate: !!navigator.vibrate,
      permission: ('Notification' in window) ? Notification.permission : 'unsupported'
    };
  }

  /* Ek baar bajakar dikhao — kisan khud sun/mehsoos kar le ki kaisa lagta hai. */
  function test() {
    unlock();
    buzz('warning');
    ring('warning');
  }

  /* ---------- AUDIO/VIBRATION UNLOCK ------------------------------------ */
  /* Mobile browser bina "user gesture" ke na awaaz bajne dete hain na
     kampan. Isliye app par pehle tap/click ko pakadkar AudioContext jaga
     lete hain. Ek baar ke baad zaroorat nahi. */
  let unlocked = false;
  function unlock() {
    if (unlocked) return;
    const ac = audio();
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    unlocked = true;
  }

  ['pointerdown', 'keydown'].forEach(ev =>
    window.addEventListener(ev, unlock, { once: true, passive: true }));

  /* SW se aane wale push ko bhi ghanti/kampan chahiye jab app khuli ho. */
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', (e) => {
      const d = e && e.data;
      if (d && d.type === 'km:advisory' && d.advisory) alert(d.advisory);
    });
  }

  window.kmAlerts = { alert, alertMany, enable, disable, status, test };
})();
