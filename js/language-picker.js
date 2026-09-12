/* ============================================================================
 * VRIDHI AI — BHASHA CHUNAV (language picker)
 * js/language-picker.js
 *
 * KYA KARTA HAI
 *   1. Pehli baar app khulte hi — landing/login se bhi PEHLE — poore screen par
 *      22 bhashaon ka chunav dikhata hai, har ek apni hi lipi me.
 *   2. Chuni hui bhasha localStorage me sambhalta hai.
 *   3. Baad me kabhi bhi badalne ke liye ek chhota "भाषा" button deta hai.
 *   4. Awaaz (TTS) usi bhasha me chalti hai. Jis bhasha ki awaaz phone me nahi
 *      hai, uske liye chain: chuni bhasha -> हिन्दी -> English, aur ek chhoti
 *      line likh deta hai ki aisa kyun hua.
 *
 * ZAROORI: yeh koi NAYA storage nahi banata. v0 ne pehle se
 * `km.preferences.v1` bana rakha hai (js/offline-agriculture.js) — yeh usi ko
 * padhta-likhta hai, taaki do jagah do alag bhasha na ho jaayen.
 *
 * TEAM NOTE: yeh file poori tarah alag hai. Sab kuch ek IIFE me band hai,
 * saare class naam "kml-" se shuru hote hain.
 * ========================================================================= */

(function () {
  'use strict';

  const PREFS_KEY = 'km.preferences.v1';        // wahi key jo baaki app use karti hai
  const SEEN_KEY  = 'km.langPicked.v1';         // pehli baar dikha ya nahi

  /* ---------------------------------------------------------------------
   * 22 anusoochit bhashayein. `voice` batata hai ki is bhasha ki TTS awaaz
   * aam taur par Android/iOS me milti hai ya nahi — isse hum pehle hi
   * imaandari se bata dete hain ki awaaz Hindi me sunai degi.
   * ------------------------------------------------------------------- */
  const LANGS = [
    { code: 'hi-IN',  native: 'हिन्दी',        en: 'Hindi',     voice: true  },
    { code: 'en-IN',  native: 'English',       en: 'English',   voice: true  },
    { code: 'bn-IN',  native: 'বাংলা',          en: 'Bengali',   voice: true  },
    { code: 'mr-IN',  native: 'मराठी',          en: 'Marathi',   voice: true  },
    { code: 'te-IN',  native: 'తెలుగు',         en: 'Telugu',    voice: true  },
    { code: 'ta-IN',  native: 'தமிழ்',          en: 'Tamil',     voice: true  },
    { code: 'gu-IN',  native: 'ગુજરાતી',        en: 'Gujarati',  voice: true  },
    { code: 'kn-IN',  native: 'ಕನ್ನಡ',          en: 'Kannada',   voice: true  },
    { code: 'ml-IN',  native: 'മലയാളം',        en: 'Malayalam', voice: true  },
    { code: 'pa-IN',  native: 'ਪੰਜਾਬੀ',         en: 'Punjabi',   voice: true  },
    { code: 'or-IN',  native: 'ଓଡ଼ିଆ',          en: 'Odia',      voice: false },
    { code: 'as-IN',  native: 'অসমীয়া',        en: 'Assamese',  voice: false },
    { code: 'ur-IN',  native: 'اردو',           en: 'Urdu',      voice: true  },
    { code: 'ne-IN',  native: 'नेपाली',         en: 'Nepali',    voice: false },
    { code: 'sa-IN',  native: 'संस्कृतम्',       en: 'Sanskrit',  voice: false },
    { code: 'kok-IN', native: 'कोंकणी',         en: 'Konkani',   voice: false },
    { code: 'mai-IN', native: 'मैथिली',         en: 'Maithili',  voice: false },
    { code: 'doi-IN', native: 'डोगरी',          en: 'Dogri',     voice: false },
    { code: 'brx-IN', native: 'बड़ो',           en: 'Bodo',      voice: false },
    { code: 'ks-IN',  native: 'کٲشُر',          en: 'Kashmiri',  voice: false },
    { code: 'sat-IN', native: 'ᱥᱟᱱᱛᱟᱲᱤ',        en: 'Santali',   voice: false },
    { code: 'sd-IN',  native: 'سنڌي',           en: 'Sindhi',    voice: false },
    { code: 'mni-IN', native: 'ꯃꯤꯇꯩꯂꯣꯟ',       en: 'Manipuri',  voice: false },
  ];

  /* Har bhasha me sirf DO line — picker aur fallback ke liye itna hi chahiye.
     Poora UI translation alag kaam hai; yeh sirf pehli screen ke liye hai. */
  const PICKER_TITLE = {
    'hi-IN': 'अपनी भाषा चुनें',       'en-IN': 'Choose your language',
    'bn-IN': 'আপনার ভাষা বেছে নিন',   'mr-IN': 'तुमची भाषा निवडा',
    'te-IN': 'మీ భాషను ఎంచుకోండి',    'ta-IN': 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    'gu-IN': 'તમારી ભાષા પસંદ કરો',   'kn-IN': 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    'ml-IN': 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക', 'pa-IN': 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    'ur-IN': 'اپنی زبان منتخب کریں',
  };

  /* ---------- chhote helper ---------- */
  function prefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function savePrefs(p) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (_) {}
  }
  function byCode(code) { return LANGS.find((l) => l.code === code) || LANGS[0]; }

  /** Abhi kaunsi bhasha chuni hui hai. */
  function current() { return byCode(prefs().language); }

  /** Kabhi chuni hi nahi to true. */
  function neverPicked() {
    try { return !localStorage.getItem(SEEN_KEY) && !prefs().language; }
    catch (_) { return false; }
  }

  /* ---------------------------------------------------------------------
   * AWAAZ KI FALLBACK CHAIN
   * Har bhasha ki TTS awaaz har phone me nahi hoti. Isliye:
   *   chuni hui bhasha -> हिन्दी -> English
   * Jo pehle mil jaye wahi. Kis par gire, wo bhi batate hain taaki UI ek
   * chhoti line likh sake — kisan ko lage nahi ki app kharab hai.
   * ------------------------------------------------------------------- */
  function resolveVoice(wantCode) {
    const out = { code: wantCode, voice: null, fellBack: false, note: '' };
    if (!('speechSynthesis' in window)) return out;

    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return out;              // voices abhi load nahi hui

    const base = (c) => String(c || '').toLowerCase().split('-')[0];
    const find = (code) => {
      const lc = String(code).toLowerCase();
      return voices.find((v) => (v.lang || '').toLowerCase() === lc)
          || voices.find((v) => base(v.lang) === base(code));
    };

    const chain = [wantCode, 'hi-IN', 'en-IN'];
    for (let i = 0; i < chain.length; i++) {
      const v = find(chain[i]);
      if (v) {
        out.voice = v;
        out.code = chain[i];
        out.fellBack = i > 0;
        if (i === 1) {
          out.note = 'इस भाषा के लिए आवाज़ उपलब्ध नहीं है, हिंदी में सुन रहे हैं।';
        } else if (i === 2) {
          out.note = 'इस भाषा के लिए आवाज़ उपलब्ध नहीं है, English में सुन रहे हैं।';
        }
        return out;
      }
    }
    return out;                                  // koi bhi awaaz nahi mili
  }

  /* ---------------------------------------------------------------------
   * BHASHA LAGAO
   * ------------------------------------------------------------------- */
  function apply(code, opts) {
    const lang = byCode(code);
    const p = prefs();
    p.language = lang.code;
    savePrefs(p);
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (_) {}

    document.documentElement.lang = lang.code.split('-')[0];
    document.documentElement.dir = (lang.code === 'ur-IN' || lang.code === 'ks-IN' ||
                                    lang.code === 'sd-IN') ? 'rtl' : 'ltr';

    /* Baaki app ko bata do. js/script.js is event par apni SPEECH_LANG
       badal leta hai — isliye awaaz turant nayi bhasha me aa jaati hai. */
    window.dispatchEvent(new CustomEvent('km:language', {
      detail: { code: lang.code, lang: lang, voice: resolveVoice(lang.code) },
    }));

    updateChip();
    if (!(opts && opts.silent)) console.info('[lang] chuni gayi:', lang.code, lang.en);

    /* Logged-in kisan ki bhasha account ke saath bhi sambhal do — naye phone
       par ya dobara login karne par phir se chunni na pade.
       Fail ho jaye (offline / logged out) to koi baat nahi, localStorage me
       to hai hi. Isliye chup-chaap ignore karte hain. */
    if (!(opts && opts.fromServer)) {
      try {
        fetch('/api/auth?action=language', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lang.code }),
        }).catch(() => {});
      } catch (_) {}
    }
  }

  /**
   * Login ke baad server par sambhali hui bhasha uthao.
   * Sirf tab lagate hain jab is phone par kisan ne khud kuch chuna hi na ho —
   * warna abhi ka chunav server wale purane chunav se badal jaata.
   */
  async function syncFromServer() {
    try {
      const r = await fetch('/api/auth?action=session');
      if (!r.ok) return;
      const s = await r.json();
      if (!s || !s.language) return;
      const already = prefs().language;
      if (already) return;                       // is phone par pehle se chuni hui hai
      apply(s.language, { silent: true, fromServer: true });
      close();                                   // picker khula ho to band kar do
    } catch (_) { /* offline — koi baat nahi */ }
  }

  /* ---------------------------------------------------------------------
   * PICKER SCREEN
   * ------------------------------------------------------------------- */
  let overlay = null;

  function open(opts) {
    if (overlay) return;
    const firstRun = !!(opts && opts.firstRun);
    const cur = current().code;

    overlay = document.createElement('div');
    overlay.className = 'kml-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = [
      '<div class="kml-sheet">',
        '<div class="kml-head">',
          '<img class="kml-logo" src="assets/logo.svg" alt="" width="44" height="44" />',
          '<h1 class="kml-title">अपनी भाषा चुनें</h1>',
          '<p class="kml-sub">Choose your language &middot; ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ &middot; உங்கள் மொழி</p>',
        '</div>',
        '<div class="kml-grid">',
          LANGS.map((l) => [
            '<button type="button" class="kml-btn', (l.code === cur ? ' is-on' : ''), '"',
              ' data-code="', l.code, '" lang="', l.code.split('-')[0], '">',
              '<span class="kml-native">', l.native, '</span>',
              '<span class="kml-en">', l.en, '</span>',
              (l.voice ? '' : '<span class="kml-novoice">आवाज़: हिंदी</span>'),
            '</button>',
          ].join('')).join(''),
        '</div>',
        '<p class="kml-foot">',
          'जिन भाषाओं पर <strong>आवाज़: हिंदी</strong> लिखा है, उनमें लिखा हुआ उसी भाषा में ',
          'रहेगा पर बोलकर सुनाना हिंदी में होगा — क्योंकि उन भाषाओं की आवाज़ अभी ',
          'ज़्यादातर फ़ोन में नहीं होती।',
        '</p>',
        (firstRun ? '' :
          '<button type="button" class="kml-close" id="kmlClose">रद्द करें / Cancel</button>'),
      '</div>',
    ].join('');

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.addEventListener('click', (e) => {
      const btn = e.target.closest('.kml-btn');
      if (btn) { apply(btn.dataset.code); close(); return; }
      if (e.target.id === 'kmlClose' || (!firstRun && e.target === overlay)) close();
    });
  }

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.body.style.overflow = '';
  }

  /* ---------------------------------------------------------------------
   * CHHOTA "भाषा" BUTTON — kabhi bhi badalne ke liye
   * ------------------------------------------------------------------- */
  let chip = null;

  function mountChip() {
    if (chip || !document.body) return;
    chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'kml-chip';
    chip.setAttribute('aria-label', 'भाषा बदलें / Change language');
    chip.addEventListener('click', () => open({ firstRun: false }));
    document.body.appendChild(chip);
    updateChip();
  }

  function updateChip() {
    if (!chip) return;
    const l = current();
    chip.innerHTML =
      '<svg class="kml-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>' +
      '<path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18z"/></svg>' +
      '<span>' + l.native + '</span>';
  }

  /* ---------------------------------------------------------------------
   * SHURUAAT
   * ------------------------------------------------------------------- */
  function init() {
    mountChip();

    if (neverPicked()) {
      /* Ho sakta hai kisan pehle kisi aur phone par bhasha chun chuka ho —
         pehle wo dekh lete hain, tabhi poochhte hain. */
      syncFromServer().then(() => { if (neverPicked()) open({ firstRun: true }); });
    } else {
      apply(current().code, { silent: true, fromServer: true });   // sambhali hui bhasha lagao
    }

    // voices baad me load hoti hain — tab fallback dobara jaanch lo
    if ('speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        /* Picker abhi khula hai matlab kisan ne bhasha chuni hi nahi. Tab yeh
           event bhejna galat hai — tour/voice ise "bhasha chun li gayi" samajh
           kar chal padte hain aur picker ke upar aa jaate hain. */
        if (overlay) return;
        window.dispatchEvent(new CustomEvent('km:language', {
          detail: { code: current().code, lang: current(), voice: resolveVoice(current().code) },
        }));
      });
    }
  }

  /* Bahar se use karne ke liye */
  window.kmLang = {
    LANGS: LANGS,
    current: current,
    apply: apply,
    open: open,
    close: close,
    resolveVoice: resolveVoice,
    syncFromServer: syncFromServer,
    titleFor: (code) => PICKER_TITLE[code] || PICKER_TITLE['en-IN'],
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
