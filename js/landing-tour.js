/* ============================================================================
 * js/landing-tour.js — naye user ko landing/login page par raasta dikhana
 *
 * App ke andar wala tour (js/tour.js) alag hai — wo scan, fasal, salah samjhata
 * hai. Yeh chhota tour SIRF pehle pehal wale pages ke liye hai: landing, login,
 * signup — taaki naya kisan samajh jaye ki shuru kahan se karna hai.
 *
 * Ek baar dekh lene ke baad dobara nahi aata (localStorage me yaad rehta hai),
 * par footer/navbar ke "मदद" se kabhi bhi chalaya ja sakta hai.
 *
 * NOTE: awaaz (voice welcome) yahan JAAN-BOOJH KAR nahi hai — wo baad me
 * jodna hai. Yeh tour bilkul chup hai.
 * ========================================================================= */

'use strict';

(function () {
  const SEEN_KEY = 'kisansathi.landingtour.v1';

  /* Har page ke apne kadam. Selector na mile to wo kadam apne aap chhod diya
     jata hai — isliye design badalne par tour toota nahi. */
  const STEPS_BY_PAGE = {
    landing: [
      { sel: '.navbar__brand',
        titleHi: 'कृषि मित्र में आपका स्वागत है',
        bodyHi: 'यह ऐप आपकी फसल की पत्ती की फोटो से रोग पहचानती है और हिंदी में सलाह देती है — ' +
                'वो भी बिना इंटरनेट के।' },
      { sel: '.navbar__cta .btn, .hero .btn--primary',
        titleHi: 'यहाँ से शुरू करें',
        bodyHi: '"Get Started" दबाकर मोबाइल नंबर से खाता बनाएँ या लॉगिन करें। ' +
                'एक बार खाता बनने के बाद सीधे ऐप खुल जाएगी।' },
      { sel: '#features',
        titleHi: 'क्या-क्या मिलेगा',
        bodyHi: '10 फसलों के रोग, हिंदी आवाज़ में सलाह, मौसम की चेतावनी, और ऑफ़लाइन जाँच।' },
      { sel: '#how-it-works',
        titleHi: 'कैसे काम करता है',
        bodyHi: 'फसल चुनें → खेत की 5 से 40 पत्तियों की फोटो लें → पूरे खेत का नतीजा और इलाज।' },
    ],
    login: [
      { sel: '#login-phone',
        titleHi: 'मोबाइल नंबर से लॉगिन',
        bodyHi: 'वही 10 अंकों का नंबर डालें जिससे खाता बनाया था।' },
      { sel: '#login-google-btn',
        titleHi: 'या Google से आएँ',
        bodyHi: 'नंबर याद न हो तो Google खाते से भी आ सकते हैं।' },
      { sel: 'a[href="/signup"]',
        titleHi: 'नए हैं?',
        bodyHi: '"Sign Up" दबाकर एक मिनट में नया खाता बना लें।' },
    ],
    signup: [
      { sel: '#signup-name',
        titleHi: 'अपना नाम भरें',
        bodyHi: 'यही नाम ऐप में और कृषि विभाग की सलाह में दिखेगा।' },
      { sel: '#signup-phone',
        titleHi: 'मोबाइल नंबर',
        bodyHi: '10 अंकों का नंबर — यही आपका लॉगिन आईडी रहेगा।' },
      { sel: '#signup-password',
        titleHi: 'पासवर्ड',
        bodyHi: 'कम से कम 6 अक्षर। याद रखने में आसान पर किसी और को पता न हो।' },
    ],
  };

  function pageKind() {
    const p = location.pathname.replace(/\.html$/, '');
    if (/\/login$/.test(p)) return 'login';
    if (/\/signup$/.test(p)) return 'signup';
    if (p === '/' || /\/index$/.test(p)) return 'landing';
    return null;
  }

  let steps = [], idx = 0, els = {};

  function build() {
    const wrap = document.createElement('div');
    wrap.className = 'ltour';
    wrap.innerHTML = [
      '<div class="ltour__scrim"></div>',
      '<div class="ltour__ring"></div>',
      '<div class="ltour__box" role="dialog" aria-modal="true" aria-labelledby="ltourTitle">',
        '<p class="ltour__step"></p>',
        '<h3 class="ltour__title" id="ltourTitle"></h3>',
        '<p class="ltour__body"></p>',
        '<div class="ltour__btns">',
          '<button type="button" class="ltour__skip">छोड़ें</button>',
          '<button type="button" class="ltour__next">आगे</button>',
        '</div>',
      '</div>',
    ].join('');
    document.body.appendChild(wrap);

    els = {
      wrap: wrap,
      ring: wrap.querySelector('.ltour__ring'),
      box: wrap.querySelector('.ltour__box'),
      step: wrap.querySelector('.ltour__step'),
      title: wrap.querySelector('.ltour__title'),
      body: wrap.querySelector('.ltour__body'),
      next: wrap.querySelector('.ltour__next'),
      skip: wrap.querySelector('.ltour__skip'),
    };

    els.next.addEventListener('click', () => show(idx + 1));
    els.skip.addEventListener('click', end);
    wrap.querySelector('.ltour__scrim').addEventListener('click', end);
    document.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (!els.wrap) return;
    if (e.key === 'Escape') end();
    if (e.key === 'ArrowRight' || e.key === 'Enter') show(idx + 1);
  }

  function show(i) {
    if (i >= steps.length) return end();
    idx = i;
    const s = steps[i];
    const target = document.querySelector(s.sel);

    els.step.textContent = (i + 1) + ' / ' + steps.length;
    els.title.textContent = s.titleHi;
    els.body.textContent = s.bodyHi;
    els.next.textContent = (i === steps.length - 1) ? 'शुरू करें' : 'आगे';

    if (!target) { return show(i + 1); }     // element na mile to agla kadam

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      const r = target.getBoundingClientRect();
      const pad = 8;
      els.ring.style.cssText =
        'top:' + (r.top - pad) + 'px;left:' + (r.left - pad) + 'px;' +
        'width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px;';

      // Box ko target ke neeche rakho, jagah na ho to upar
      const bh = els.box.offsetHeight || 170;
      const neeche = r.bottom + 14;
      const top = (neeche + bh < window.innerHeight) ? neeche : Math.max(14, r.top - bh - 14);
      els.box.style.top = top + 'px';
    }, 320);
  }

  function end() {
    document.removeEventListener('keydown', onKey);
    if (els.wrap) els.wrap.remove();
    els = {};
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (_) {}
  }

  function start() {
    const kind = pageKind();
    if (!kind) return;
    steps = STEPS_BY_PAGE[kind] || [];
    if (!steps.length) return;
    if (els.wrap) return;
    build();
    show(0);
  }
  window.startLandingTour = start;          // "मदद" button ise bulata hai

  document.addEventListener('DOMContentLoaded', () => {
    // "मदद / Help" button jahan bhi ho, use jod do
    document.querySelectorAll('[data-landing-tour]').forEach((b) =>
      b.addEventListener('click', (e) => { e.preventDefault(); start(); }));

    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch (_) {}
    if (seen) return;

    // Page settle hone ke baad — warna ring galat jagah banti hai
    setTimeout(start, 1200);
  });
})();
