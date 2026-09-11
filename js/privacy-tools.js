/* ============================================================================
 * KRASHI MITRA — MERA DATA (dekhо, le jao, mita do)
 * js/privacy-tools.js
 *
 * KYUN
 *   privacy.html me likha tha ki "aapka data aapka hai", par use mitane ka
 *   koi button nahi tha. Likhi hui baat par amal ka rasta na ho to wo sirf
 *   kaagaz hai.
 *
 * TEEN CHEEZEIN
 *   1. Dekho  — is phone par kya-kya rakha hai, saaf suchi me
 *   2. Le jao — sab kuch ek JSON file me download
 *   3. Mitao  — is phone se sab hata do
 *
 * EK BAAT SAAF KEHNI ZAROORI HAI
 *   Jo jaanch kisan ne khud "report bhejein" chalu karke vibhag ko bheji
 *   thi, wo SERVER par hai. Use yeh button nahi mita sakta — wo ab
 *   sarkari record hai. Hum yeh chhupate nahi, saaf likhte hain, aur
 *   aage badhne se pehle batate hain.
 *
 * Poora kaam phone par — koi server call nahi, isliye offline bhi chalta hai.
 * ========================================================================= */

(function () {
  'use strict';

  /* Har cheez jo hum is phone par rakhte hain. Nayi key jodo to yahan bhi
     jodna — warna "sab mita do" adhoora rah jayega. */
  const KEYS = [
    { k:'agriai.history.v1',        hi:'पुरानी जाँचें'              },
    { k:'agriai.advisory.seen.v1',  hi:'देखी हुई चेतावनियाँ'        },
    { k:'agriai.report.v1',         hi:'रिपोर्ट भेजने की सेटिंग'    },
    { k:'agriai.netmode.v1',        hi:'ऑनलाइन/ऑफ़लाइन सेटिंग'      },
    { k:'km.preferences.v1',        hi:'नाम, गाँव, ज़िला, भाषा'     },
    { k:'km.calendar.sowing.v1',    hi:'बुवाई की तारीख़ें'           },
    { k:'km.calendar.done.v1',      hi:'निपटाए गए काम'             },
    { k:'km.calendar.reminded.v1',  hi:'भेजी गई याद'                },
    { k:'km.outbreak.cache.v1',     hi:'ज़िले के रोग की जानकारी'     },
    { k:'km.outbreak.seen.v1',      hi:'देखे हुए प्रकोप'            },
    { k:'km.community.cache.v1',    hi:'चौपाल की पढ़ी हुई बातें'     },
    { k:'km.community.seen.v1',     hi:'चौपाल के देखे जवाब'         },
    { k:'km.notify.prefs.v1',       hi:'सूचना की पसंद'              },
    { k:'km.notify.queue.v1',       hi:'भेजी जाने वाली सूचना'       },
    { k:'km.notify.log.v1',         hi:'सूचना का हिसाब'             },
    { k:'km.alerts.v1',             hi:'घंटी की सेटिंग'             },
    { k:'km.alerts.shown.v1',       hi:'दिखाई गई चेतावनी'           },
    { k:'km.protocols.v1',          hi:'दवा के प्रोटोकॉल'           },
    { k:'km.langPicked.v1',         hi:'चुनी हुई भाषा'              },
    { k:'km.landingLang',           hi:'पहले पन्ने की भाषा'         },
    { k:'km.tourMuted',             hi:'टूर की सेटिंग'              },
    { k:'km.tourPart2',             hi:'टूर की स्थिति'              },
    { k:'km.permissionsAsked',      hi:'माँगी गई अनुमतियाँ'         },
  ];

  function raw(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }

  function sizeOf(s) {
    if (!s) return 0;
    return new Blob([s]).size;
  }
  function human(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return Math.round(b / 1024) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  /** Is phone par kya-kya hai */
  function summary() {
    const rows = [];
    let total = 0;
    KEYS.forEach((e) => {
      const v = raw(e.k);
      if (v == null) return;
      const n = sizeOf(v);
      total += n;
      let count = null;
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) count = parsed.length;
        else if (parsed && typeof parsed === 'object') count = Object.keys(parsed).length;
      } catch (_) {}
      rows.push({ key: e.k, hi: e.hi, bytes: n, size: human(n), count: count });
    });
    return { rows: rows, total: total, totalSize: human(total) };
  }

  /** Sab kuch ek file me — kisan apne paas rakh sake */
  function exportAll() {
    const out = {
      app: 'Krashi Mitra',
      banaya: new Date().toISOString(),
      note: 'Yeh aapke phone par rakha hua data hai. Server par bheji hui ' +
            'jaanch isme nahi hai.',
      data: {},
    };
    KEYS.forEach((e) => {
      const v = raw(e.k);
      if (v == null) return;
      try { out.data[e.k] = JSON.parse(v); } catch (_) { out.data[e.k] = v; }
    });

    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'krashi-mitra-mera-data-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { ok: true, keys: Object.keys(out.data).length };
  }

  /**
   * Sab mita do. Login ki cookie ko haath nahi lagate — wo alag cheez hai,
   * uske liye logout hai.
   */
  function wipe() {
    let n = 0;
    KEYS.forEach((e) => {
      try { if (localStorage.getItem(e.k) != null) { localStorage.removeItem(e.k); n += 1; } }
      catch (_) {}
    });
    /* Cache bhi — warna purani jaanch cache me padi rahegi */
    try {
      if (window.caches && caches.keys) {
        caches.keys().then((ks) => ks.forEach((k) => {
          if (k.indexOf('krashi-mitra-models') === -1) caches.delete(k);
        }));
      }
    } catch (_) {}
    return { ok: true, mitaye: n };
  }

  /* ---------------------------------------------------------------------
   * Dikhana
   * ------------------------------------------------------------------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);

  function render() {
    const host = document.getElementById('privacyToolsBody');
    if (!host) return;
    const s = summary();

    host.innerHTML =
      '<p class="pv-lead">' + esc('यह ऐप जो कुछ आपके फ़ोन पर रखता है, वह सब यहाँ है। ' +
        'आप इसे उतार सकते हैं या मिटा सकते हैं — किसी से पूछे बिना।') + '</p>' +

      (s.rows.length
        ? '<ul class="pv-list">' + s.rows.map((r) =>
            '<li><span>' + esc(r.hi) +
              (r.count != null ? ' <em>(' + r.count + ')</em>' : '') +
            '</span><b>' + esc(r.size) + '</b></li>').join('') +
          '</ul><p class="pv-total">' + esc('कुल: ' + s.totalSize) + '</p>'
        : '<p class="pv-empty">' + esc('अभी इस फ़ोन पर कुछ नहीं रखा है।') + '</p>') +

      '<div class="pv-actions">' +
        '<button type="button" class="btn btn--ghost btn--sm" id="pvExport">' +
          esc('मेरा डेटा उतारें') + '</button>' +
        '<button type="button" class="btn btn--danger btn--sm" id="pvWipe">' +
          esc('सब मिटा दें') + '</button>' +
      '</div>' +

      /* Yeh chhupana bemaani hoga — kisan ko pehle se pata hona chahiye */
      '<p class="pv-warn">' + esc('जो जाँच आपने खुद "रिपोर्ट भेजें" चालू करके कृषि ' +
        'विभाग को भेजी थी, वह सरकारी रिकॉर्ड में है और इस बटन से नहीं मिटती। ' +
        'उसे हटवाने के लिए अपने कृषि कार्यालय से कहें।') + '</p>';

    const ex = host.querySelector('#pvExport');
    if (ex) ex.addEventListener('click', () => {
      const r = exportAll();
      ex.textContent = r.keys ? 'फ़ाइल बन गई' : 'कुछ नहीं था';
      setTimeout(render, 2500);
    });

    const wp = host.querySelector('#pvWipe');
    if (wp) wp.addEventListener('click', () => {
      /* Do baar poochte hain — yeh wapas nahi aata */
      if (!confirm('इस फ़ोन से ऐप का सारा डेटा मिटा दें?\n\n' +
                   'पुरानी जाँचें, बुवाई की तारीख़ें, गाँव-ज़िला — सब चला जाएगा। ' +
                   'यह वापस नहीं आएगा।')) return;
      if (!confirm('पक्का? उतारना चाहें तो पहले "मेरा डेटा उतारें" दबा लें।')) return;
      const r = wipe();
      alert(r.mitaye + ' चीज़ें मिटा दी गईं।');
      render();
    });
  }

  window.kmPrivacy = { summary, exportAll, wipe, render, KEYS: KEYS };

  function init() { if (document.getElementById('privacyToolsBody')) render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
