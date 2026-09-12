/* ============================================================================
 * VRIDHI AI — network ki halat ka sanket (wifi signal icon)
 * js/connectivity.js
 *
 * PEHLE KYA THA
 *   Topbar me ek chip thi jispar seedha "Offline" likha rehta tha — hamesha,
 *   chahe phone internet se juda ho ya nahi. Do dikkatein thi:
 *     1. Wo shabd angrezi me tha, aur bhasha badalne par bhi nahi badalta tha.
 *     2. Wo jhootha tha — usska matlab tha "jaanch aapke phone par hoti hai",
 *        par kisan use "internet nahi hai" padhta tha.
 *
 * AB KYA HAI
 *   Ek wifi ke danday (bars) — jitna achha network, utne jyada dande jalte
 *   hain. Koi shabd nahi, isliye har bhasha me ek jaisa samajh aata hai.
 *     0 dande + kata hua      = internet nahi
 *     1 danda  (laal-peela)   = bahut dheema (2g)
 *     2 dande  (peela)        = theek-thaak (3g)
 *     3 dande  (hara)         = achha (4g/wifi)
 *
 *   Poora vivaran chhoo kar / hover karke dikhta hai (title + aria-label),
 *   aur wo kisan ki chuni hui bhasha me hota hai.
 *
 * DHYAN REHE
 *   navigator.connection har browser me nahi hai (iOS Safari me nahi).
 *   Wahan hum sirf "juda hai / nahi juda" bata paate hain — us haalat me
 *   3 dande dikhate hain, jhoothi speed ka andaza nahi lagate.
 * ========================================================================= */

(function () {
  'use strict';

  const LEVELS = {
    0: { key: 'net.offline', cls: 'is-off',  bars: 0 },
    1: { key: 'net.weak',    cls: 'is-weak', bars: 1 },
    2: { key: 'net.ok',      cls: 'is-ok',   bars: 2 },
    3: { key: 'net.good',    cls: 'is-good', bars: 3 }
  };

  function t(key, fallback) {
    if (window.kmI18n && typeof window.kmI18n.t === 'function') {
      const v = window.kmI18n.t(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }

  /* Network ki halat 0-3 me batao. */
  function level() {
    if (navigator.onLine === false) return 0;

    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return 3;                       // pata nahi chal sakta — andaza mat lagao

    const et = c.effectiveType;
    if (et === 'slow-2g' || et === '2g') return 1;
    if (et === '3g') return 2;
    if (et === '4g') return 3;

    // effectiveType na mile to downlink (Mbps) se kaam chalao
    if (typeof c.downlink === 'number') {
      if (c.downlink < 0.4) return 1;
      if (c.downlink < 2)   return 2;
    }
    return 3;
  }

  /* 3 arcs + ek bindu. Jitne "on" utne gehre, baaki halke. */
  function iconHtml(bars, off) {
    const arc = (d, i) =>
      '<path d="' + d + '" class="' + (i <= bars ? 'on' : 'dim') + '"/>';
    return '<svg class="netsig__svg" viewBox="0 0 24 24" fill="none" ' +
             'stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
             arc('M1.5 8.8a16.5 16.5 0 0 1 21 0', 3) +
             arc('M5 12.4a11.5 11.5 0 0 1 14 0', 2) +
             arc('M8.5 16a6.5 6.5 0 0 1 7 0', 1) +
             '<circle cx="12" cy="19.6" r="1.15" fill="currentColor" stroke="none" ' +
               'class="' + (bars > 0 ? 'on' : 'dim') + '"/>' +
             (off ? '<path d="M2.5 2.5l19 19" class="on netsig__slash"/>' : '') +
           '</svg>';
  }

  let el = null;

  function render() {
    if (!el) return;
    const lv = LEVELS[level()];
    const label = t(lv.key, {
      'net.offline': 'इंटरनेट नहीं',
      'net.weak':    'बहुत धीमा इंटरनेट',
      'net.ok':      'ठीक-ठाक इंटरनेट',
      'net.good':    'अच्छा इंटरनेट'
    }[lv.key]);

    el.className = 'chip netsig ' + lv.cls;
    el.title = label;
    el.setAttribute('aria-label', label);
    el.innerHTML = iconHtml(lv.bars, lv.bars === 0);
  }

  function init() {
    el = document.getElementById('netSignal');
    if (!el) return;
    render();

    window.addEventListener('online', render);
    window.addEventListener('offline', render);
    window.addEventListener('km:language', render);

    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c && typeof c.addEventListener === 'function') c.addEventListener('change', render);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.kmNetSignal = { refresh: render, level: level };
})();
