/* ============================================================================
 * VRIDHI AI — OFFLINE AAWAAZ PEHCHAN (Vosk)
 * js/vosk-stt.js
 *
 * SAMASYA
 *   Browser ka apna SpeechRecognition (Web Speech API) aawaaz ko Google ke
 *   server par bhejta hai. Khet me network kamzor ho to wo atak jaata hai ya
 *   "network" error deta hai. Yani aawaaz wala feature wahin fail hota hai
 *   jahan kisan ko uski sabse zyada zaroorat hai.
 *
 * HAL
 *   Vosk — ek chhota speech-to-text engine jo WASM me poori tarah PHONE ke
 *   andar chalta hai. Ek baar model utar gaya, uske baad internet ki bilkul
 *   zaroorat nahi.
 *
 * ── ZAROORI BAAT: MODEL KI FILE ────────────────────────────────────────────
 *   Model (~42 MB) is repo me JAAN-BOOJHKAR nahi rakha gaya, kyunki:
 *     - repo ka size teen guna ho jaata (abhi ~51 MB hai)
 *     - har git clone/deploy bhaari ho jaata
 *   Aur kisi bahari CDN se bhi nahi la sakte — humne jaanch liya, alphacephei
 *   aur HuggingFace dono CORS block karte hain, isliye browser unse file
 *   download hi nahi kar sakta. Model APNE hi server se aana zaroori hai.
 *
 *   ISLIYE: aap model khud rakhein, bilkul waise hi jaise models/<fasal>/
 *   me TF ke model rakhte hain:
 *
 *     1. https://alphacephei.com/vosk/models se utaarein:
 *          vosk-model-small-hi-0.22.zip   (Hindi, ~42 MB)
 *          vosk-model-small-en-us-0.15.zip (English, ~40 MB)
 *     2. Unhe aise rakhein (zip kholna NAHI hai):
 *          vosk/vosk-model-small-hi-0.22.zip
 *          vosk/vosk-model-small-en-us-0.15.zip
 *     3. Bas. App khud pehchaan legi.
 *
 *   Model NA HONE PAR kuch tootega nahi — app chup-chaap purane
 *   SpeechRecognition par chali jaati hai (jo internet maangta hai) aur
 *   UI me ek chhoti line likh deti hai.
 *
 * ── VOSK KI APNI SEEMA ─────────────────────────────────────────────────────
 *   Vosk ke paas Bharat ki sirf DO bhashaon ke model hain: Hindi aur English.
 *   Marathi, Tamil, Telugu, Bangla wagairah ke offline model abhi bane hi
 *   nahi hain. Isliye un bhashaon me bolne par hum Hindi wale model se
 *   sunte hain aur UI me saaf bata dete hain.
 * ========================================================================= */

(function () {
  'use strict';

  const CFG = {
    /* Library jsdelivr se — yeh CORS deta hai, aur service worker ise pehli
       baar ke baad cache kar leta hai. */
    LIB_URL: 'https://cdn.jsdelivr.net/npm/vosk-browser@0.0.8/dist/vosk.js',

    /* Model APNE server se (CORS ki wajah se koi aur raasta nahi). */
    MODEL_DIR: 'vosk/',
    MODELS: {
      'hi': 'vosk-model-small-hi-0.22.zip',
      'en': 'vosk-model-small-en-us-0.15.zip',
    },

    SAMPLE_RATE: 16000,      // Vosk ka small model isi par bana hai
    CACHE_NAME: 'km-vosk-v1',
    MAX_SECONDS: 12,         // itni der baad khud band
  };

  const S = {
    lib: null,               // Vosk namespace
    model: null,             // loaded model
    modelLang: null,         // 'hi' | 'en'
    recognizer: null,
    stream: null, ctx: null, node: null, source: null,
    listening: false,
    installing: false,
  };

  /* ------------------------------------------------------------------ */
  const log = (...a) => console.info('[vosk]', ...a);

  /** Chuni hui bhasha ke liye kaunsa Vosk model — sirf hi/en hain. */
  function modelKeyFor(langCode) {
    const base = String(langCode || 'hi-IN').toLowerCase().split('-')[0];
    if (base === 'en') return 'en';
    return 'hi';                       // baaki sab Hindi model se
  }

  function modelUrl(key) { return CFG.MODEL_DIR + CFG.MODELS[key]; }

  /**
   * Model ki file server par hai ya nahi.
   * Offline hone par service worker cache se bhi mil sakti hai — isliye
   * HEAD fail ho to GET (range) se dobara jaanchte hain.
   */
  async function modelPresent(key) {
    const url = modelUrl(key);
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (r.ok) return true;
      if (r.status === 404) return false;
    } catch (_) { /* neeche GET */ }
    try {
      const r = await fetch(url, { headers: { Range: 'bytes=0-64' } });
      return r.ok || r.status === 206;
    } catch (_) { return false; }
  }

  /** Kaunsi bhashaon ke model asal me pade hain. */
  async function availableLangs() {
    const out = [];
    for (const k of Object.keys(CFG.MODELS)) {
      if (await modelPresent(k)) out.push(k);
    }
    return out;
  }

  /* ---------------------------------------------------------------------
   * LIBRARY + MODEL LOAD
   * ------------------------------------------------------------------- */
  function loadLib() {
    if (S.lib) return Promise.resolve(S.lib);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = CFG.LIB_URL;
      s.async = true;
      s.onload = () => {
        S.lib = window.Vosk || null;
        S.lib ? resolve(S.lib) : reject(new Error('LIB_BAD'));
      };
      s.onerror = () => reject(new Error('LIB_FAIL'));
      document.head.appendChild(s);
    });
  }

  /**
   * Model taiyaar karo. Pehli baar ~42 MB utarta hai (ek hi baar), phir
   * browser cache me pada rehta hai — uske baad internet ki zaroorat nahi.
   * @param {function} onProgress  0..1 (jitna pata chale)
   */
  async function install(langCode, onProgress) {
    if (S.installing) return false;
    const key = modelKeyFor(langCode);

    if (S.model && S.modelLang === key) return true;      // pehle se taiyaar

    if (!(await modelPresent(key))) {
      log('model file nahi mili:', modelUrl(key));
      return false;                                        // fallback chalega
    }

    S.installing = true;
    try {
      if (onProgress) onProgress(0.05);
      await loadLib();
      if (onProgress) onProgress(0.25);

      /* Zip ko pehle Cache Storage me daal dete hain, taaki agli baar
         bilkul offline mile. Vosk khud bhi isi URL se padhta hai. */
      try {
        const cache = await caches.open(CFG.CACHE_NAME);
        if (!(await cache.match(modelUrl(key)))) {
          log('model utar raha hai (ek hi baar)…');
          const res = await fetch(modelUrl(key));
          if (res.ok) await cache.put(modelUrl(key), res.clone());
        }
      } catch (e) { log('cache nahi hua (koi baat nahi):', e.message); }

      if (onProgress) onProgress(0.7);
      S.model = await S.lib.createModel(modelUrl(key));
      S.modelLang = key;
      if (onProgress) onProgress(1);
      log('model taiyaar:', key);
      return true;

    } catch (err) {
      log('model load fail:', err && err.message);
      S.model = null; S.modelLang = null;
      return false;
    } finally {
      S.installing = false;
    }
  }

  /* ---------------------------------------------------------------------
   * SUNNA SHURU
   * onPartial(text) — beech ka anumaan  |  onFinal(text) — poora vaakya
   * ------------------------------------------------------------------- */
  async function start(handlers) {
    const h = handlers || {};
    if (S.listening) return true;
    if (!S.model) return false;

    try {
      S.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      log('mic nahi mila:', err && err.name);
      if (h.onError) h.onError(err && err.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture');
      return false;
    }

    try {
      S.ctx = new (window.AudioContext || window.webkitAudioContext)(
        { sampleRate: CFG.SAMPLE_RATE }
      );
      S.recognizer = new S.model.KaldiRecognizer(S.ctx.sampleRate);
      S.recognizer.setWords(true);

      let finalText = '';
      S.recognizer.on('result', (m) => {
        const t = (m && m.result && m.result.text) || '';
        if (t) { finalText += ' ' + t; if (h.onPartial) h.onPartial(finalText.trim()); }
      });
      S.recognizer.on('partialresult', (m) => {
        const t = (m && m.result && m.result.partial) || '';
        if (t && h.onPartial) h.onPartial((finalText + ' ' + t).trim());
      });

      S.source = S.ctx.createMediaStreamSource(S.stream);
      // ScriptProcessor purana hai par har phone par chalta hai — AudioWorklet
      // ke liye alag file chahiye hoti, jo offline setup ko bhaari bana deti.
      S.node = S.ctx.createScriptProcessor(4096, 1, 1);
      S.node.onaudioprocess = (e) => {
        try { S.recognizer.acceptWaveform(e.inputBuffer); } catch (_) {}
      };
      S.source.connect(S.node);
      S.node.connect(S.ctx.destination);

      S.listening = true;
      S._finish = (reason) => {
        const said = finalText.trim();
        stop();
        if (h.onFinal) h.onFinal(said, reason);
      };
      S._timer = setTimeout(() => { if (S.listening) S._finish('timeout'); }, CFG.MAX_SECONDS * 1000);
      return true;

    } catch (err) {
      log('start fail:', err && err.message);
      stop();
      if (h.onError) h.onError('vosk-start');
      return false;
    }
  }

  /** Bolna khatam — jo suna wo onFinal me chala jaata hai. */
  function finish() { if (S.listening && S._finish) S._finish('manual'); }

  function stop() {
    clearTimeout(S._timer);
    S.listening = false;
    try { if (S.node) { S.node.disconnect(); S.node.onaudioprocess = null; } } catch (_) {}
    try { if (S.source) S.source.disconnect(); } catch (_) {}
    try { if (S.ctx && S.ctx.state !== 'closed') S.ctx.close(); } catch (_) {}
    try { if (S.stream) S.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
    try { if (S.recognizer) S.recognizer.remove(); } catch (_) {}
    S.node = S.source = S.ctx = S.stream = S.recognizer = null;
  }

  /* Bahar ke liye */
  window.kmVosk = {
    /** Model file server par hai? (bina kuch download kiye) */
    modelPresent: (lang) => modelPresent(modelKeyFor(lang)),
    availableLangs: availableLangs,
    /** Model taiyaar karo — pehli baar ~42 MB. */
    install: install,
    /** Taiyaar hai? */
    isReady: () => !!S.model,
    /** Abhi kis bhasha ka model chadha hai. */
    loadedLang: () => S.modelLang,
    /** Chuni bhasha ke liye Vosk kaunsa model istemal karega. */
    modelKeyFor: modelKeyFor,
    start: start,
    finish: finish,
    stop: stop,
    isListening: () => S.listening,
    SUPPORTED: ['hi', 'en'],
  };
})();
