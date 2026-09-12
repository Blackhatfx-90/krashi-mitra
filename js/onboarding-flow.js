/* ============================================================================
 * KRASHI MITRA — awaaz se chalne wala pehla parichay (onboarding)
 * js/onboarding-flow.js
 *
 * YEH KYA HAI
 *   Naye kisan ko shuru se dashboard tak le jaane wala ek hi rasta. Har
 *   kadam bola jata hai aur likha bhi jata hai — kyunki bahut se kisan
 *   padh nahi paate, aur bahut se sun nahi paate. Dono ko chalna chahiye.
 *
 * KADAM (kram tay hai)
 *   0  mic ki anumati (kaaran bola aur likha jata hai)
 *   1  bhasha chuno            <- sabse pehle, kyunki iske baad SAB kuch
 *                                 usi bhasha me hoga
 *   2  app kya karti hai — chhota parichay
 *   3  naya khata ya purana
 *   4  apni jankari (naam, gaon, zila, rajya, phone, password)
 *   5  anumatiyan + niji-niti (privacy) ki sehmati
 *   6  kitni zameen
 *   7  dashboard
 *   8  "sab model utaar lein" ka sujhav
 *
 * DO BAATEIN JO JAAN-BOOJHKAR AISE HAIN
 *
 *   1. MIC NA MILE TO BHI RUKNA NAHI. Anumati na mile, ya browser me mic
 *      ho hi na, to wahi kadam chhoo-kar/likhkar poore hote hain. Awaaz
 *      ek suvidha hai, deewar nahi. (Bahut se purane Android me mic
 *      permission chup-chaap fail hoti hai — wahan app band nahi honi
 *      chahiye.)
 *
 *   2. BEECH ME CHHOD DIYA TO WAHIN SE SHURU. Har kadam localStorage me
 *      likha jata hai. Kisan ka net kat jaye ya wo app band kar de, to
 *      agli baar wo wahin se uthta hai — shuru se nahi. Kheti ke kaam ke
 *      beech me poora form dobara bharna sabse tez tareeka hai app
 *      chhudwane ka.
 * ========================================================================= */

(function () {
  'use strict';

  const KEY = 'km.onboarding.v1';

  /* Kadam ka kram. 'done' ke baad kabhi dobara nahi chalta. */
  const STEPS = ['mic', 'lang', 'intro', 'auth', 'form1', 'perms', 'form2', 'models', 'done'];

  /* ---------------------------------------------------------------- state */

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function save(patch) {
    const s = Object.assign(load(), patch || {});
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {}
    return s;
  }
  function stepIndex(name) { return Math.max(0, STEPS.indexOf(name)); }

  /** Abhi kis kadam par hain. Kuch na ho to sabse pehla. */
  function current() {
    const s = load();
    return STEPS.indexOf(s.step) >= 0 ? s.step : 'mic';
  }
  function markDone(step) {
    const next = STEPS[Math.min(STEPS.length - 1, stepIndex(step) + 1)];
    save({ step: next, ['did_' + step]: true, at: new Date().toISOString() });
    return next;
  }
  function finished() { return current() === 'done'; }

  /* ------------------------------------------------------------- bhasha */

  function lang() {
    try {
      if (window.kmI18n && window.kmI18n.current) return window.kmI18n.current();
      return JSON.parse(localStorage.getItem('km.preferences.v1') || '{}').language || 'hi-IN';
    } catch (_) { return 'hi-IN'; }
  }

  /** i18n se text. Na mile to jo diya hai wahi (Hindi aadhaar). */
  function t(key, fallback) {
    if (window.kmI18n && typeof window.kmI18n.t === 'function') {
      const v = window.kmI18n.t(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }

  /* Bolna. Kisi bhi haal me phenkta nahi — awaaz na chale to bhi kadam
     aage badhna chahiye, kyunki likha hua saath me hamesha rehta hai. */
  function say(text, done) {
    if (!text) { if (done) done(); return; }
    try {
      if (!('speechSynthesis' in window)) { if (done) done(); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = (typeof window.kmSpeechLang === 'function' && window.kmSpeechLang()) || lang();
      u.rate = 0.92;
      if (done) { u.onend = done; u.onerror = done; }
      window.speechSynthesis.speak(u);
      /* Kuch browser onend nahi bhejte. Peechhe se ek chhota pehra. */
      if (done) setTimeout(() => { try { done(); } catch (_) {} }, Math.min(20000, 2500 + text.length * 70));
    } catch (_) { if (done) done(); }
  }

  function hush() { try { window.speechSynthesis.cancel(); } catch (_) {} }

  /* --------------------------------------------------------------- parda */
  /* Ek hi parda (overlay) sab kadam ke liye — alag-alag page nahi. Kisan
     ko lagna chahiye ki wo ek hi baat-cheet me hai. */

  let host = null;

  function shell(bodyHtml, opts) {
    const o = opts || {};
    if (!host) {
      host = document.createElement('div');
      host.className = 'kmob';
      host.setAttribute('role', 'dialog');
      host.setAttribute('aria-modal', 'true');
      document.body.appendChild(host);
    }
    host.innerHTML =
      '<div class="kmob__card">' +
        (o.progress === false ? '' : progressHtml()) +
        bodyHtml +
      '</div>';
    host.hidden = false;
    document.body.classList.add('kmob-open');
    return host.querySelector('.kmob__card');
  }

  function close() {
    hush();
    if (host) { host.hidden = true; host.innerHTML = ''; }
    document.body.classList.remove('kmob-open');
  }

  /* Kitna ho gaya — kisan ko dikhna chahiye ki yeh kabhi khatam hoga.
     Bina iske lamba form chhod diya jata hai. */
  function progressHtml() {
    const visible = ['lang', 'intro', 'auth', 'form1', 'perms', 'form2', 'models'];
    const at = Math.max(0, visible.indexOf(current()));
    return '<div class="kmob__steps" aria-hidden="true">' +
      visible.map((_, i) =>
        '<span class="kmob__dot' + (i < at ? ' is-done' : i === at ? ' is-now' : '') + '"></span>'
      ).join('') + '</div>';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  window.kmOnboard = {
    STEPS: STEPS,
    current: current, markDone: markDone, finished: finished,
    load: load, save: save, close: close, shell: shell,
    say: say, hush: hush, t: t, lang: lang, esc: esc,
  };
})();

/* ============================================================================
 * KADAM 0-3 — mic, bhasha, parichay, khata
 * ========================================================================= */

(function () {
  'use strict';

  const O = window.kmOnboard;
  if (!O) return;

  /* ---------------------------------------------------------- 0. mic */
  /* Mic maangne se PEHLE kaaran batate hain — likhkar aur bolkar. Seedha
     browser ka popup phenkne par log ghabrakar "Block" daba dete hain, aur
     uske baad browser dobara poochta hi nahi. Ek baar block hua to awaaz
     wala poora rasta hamesha ke liye band.

     Yahan bola Hindi+English me hi jata hai — kyunki abhi bhasha chuni hi
     nahi gayi. Yeh ek matr jagah hai jahan do bhasha saath aati hain. */
  function stepMic() {
    const card = O.shell(
      '<h2 class="kmob__h">नमस्ते 🙏</h2>' +
      '<p class="kmob__p">' +
        'मैं बोलकर आपका खाता बनाने में मदद कर सकता हूँ। इसके लिए माइक की ' +
        'अनुमति चाहिए। आप चाहें तो बिना माइक के, छूकर भी सब कुछ कर सकते हैं।' +
      '</p>' +
      '<p class="kmob__p kmob__p--en">' +
        'I can set up your account by voice. That needs microphone access. ' +
        'You can also do everything by tapping instead.' +
      '</p>' +
      '<div class="kmob__row">' +
        '<button type="button" class="kmob__btn kmob__btn--primary" id="kmobMicYes">' +
          'माइक चालू करें / Allow mic</button>' +
        '<button type="button" class="kmob__btn" id="kmobMicNo">' +
          'बिना माइक के / Without mic</button>' +
      '</div>',
      { progress: false }
    );

    O.say('नमस्ते। मैं बोलकर आपका खाता बनाने में मदद कर सकता हूँ। इसके लिए माइक की अनुमति चाहिए।', () => {
      O.say('Hello. I can help you set up your account by voice. For that I need microphone access.');
    });

    card.querySelector('#kmobMicNo').addEventListener('click', () => {
      O.hush();
      O.save({ mic: 'skipped' });
      O.markDone('mic');
      run();
    });

    card.querySelector('#kmobMicYes').addEventListener('click', async () => {
      O.hush();
      let granted = false;
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach((tr) => tr.stop());   // sirf anumati chahiye thi
        granted = true;
      } catch (_) { granted = false; }
      /* Mana kar diya to bhi aage badhte hain — awaaz suvidha hai, deewar nahi. */
      O.save({ mic: granted ? 'granted' : 'denied' });
      O.markDone('mic');
      run();
    });
  }

  /* ------------------------------------------------------- 1. bhasha */
  function stepLang() {
    O.close();
    O.say('कृपया अपनी भाषा चुनें।', () => O.say('Please select your language.'));

    const go = () => {
      window.removeEventListener('km:language', go);
      O.markDone('lang');
      setTimeout(run, 250);
    };
    window.addEventListener('km:language', go);

    if (window.kmLang && window.kmLang.open) {
      window.kmLang.open({ firstRun: true });
    } else {
      /* Picker hi na aaye to ruko mat — Hindi maankar aage badho. */
      O.markDone('lang'); run();
    }
  }

  /* ------------------------------------------------------ 2. parichay */
  /* Ab se har shabd sirf chuni hui bhasha me. */
  function stepIntro() {
    const title = O.t('ob.introTitle', 'यह ऐप क्या करता है');
    const body  = O.t('ob.introBody',
      'कृषि मित्र आपकी फसल की पत्ती की फोटो से रोग पहचानता है — बिना इंटरनेट के भी। ' +
      'यह आपको दवा और सही मात्रा बताता है, मौसम और छिड़काव की चेतावनी देता है, ' +
      'पास की मंडी का भाव दिखाता है, और कृषि विभाग की सूचनाएँ आप तक पहुँचाता है। ' +
      'सब कुछ आपकी अपनी भाषा में।');

    const card = O.shell(
      '<h2 class="kmob__h">' + O.esc(title) + '</h2>' +
      '<p class="kmob__p">' + O.esc(body) + '</p>' +
      '<div class="kmob__row">' +
        '<button type="button" class="kmob__btn kmob__btn--primary" id="kmobNext">' +
          O.esc(O.t('ob.next', 'आगे बढ़ें')) + '</button>' +
        '<button type="button" class="kmob__btn" id="kmobRepeat">' +
          O.esc(O.t('ob.repeat', 'दोबारा सुनें')) + '</button>' +
      '</div>'
    );

    O.say(body);
    card.querySelector('#kmobRepeat').addEventListener('click', () => O.say(body));
    card.querySelector('#kmobNext').addEventListener('click', () => {
      O.hush(); O.markDone('intro'); run();
    });
  }

  /* --------------------------------------------------------- 3. khata */
  function stepAuth() {
    const q = O.t('ob.authAsk', 'नया खाता बनाना है या पहले से खाता है?');
    const card = O.shell(
      '<h2 class="kmob__h">' + O.esc(q) + '</h2>' +
      '<div class="kmob__row kmob__row--stack">' +
        '<button type="button" class="kmob__btn kmob__btn--primary" id="kmobNew">' +
          O.esc(O.t('ob.signup', 'नया खाता बनाएँ')) + '</button>' +
        '<button type="button" class="kmob__btn" id="kmobOld">' +
          O.esc(O.t('ob.login', 'मेरा खाता पहले से है')) + '</button>' +
      '</div>'
    );

    O.say(q);

    /* Purana khata -> seedha login. */
    card.querySelector('#kmobOld').addEventListener('click', () => {
      O.hush();
      O.markDone('auth');
      O.save({ path: 'login' });
      location.href = '/login';
    });

    card.querySelector('#kmobNew').addEventListener('click', () => {
      O.hush();
      O.markDone('auth');
      O.save({ path: 'signup' });
      location.href = '/signup';
    });
  }

  /* ------------------------------------------------------------ chalao */
  function run() {
    if (/\/app(?:\.html)?$/.test(location.pathname)) {
      if (['mic', 'lang', 'intro', 'auth'].indexOf(O.current()) >= 0) {
        O.save({ step: 'form1', did_auth: true });
      }
      if (window.kmObForms && typeof window.kmObForms.run === 'function') {
        return window.kmObForms.run();
      }
      return O.close();
    }
    switch (O.current()) {
      case 'mic':   return stepMic();
      case 'lang':  return stepLang();
      case 'intro': return stepIntro();
      case 'auth':  return stepAuth();
      default:      return O.close();   // aage ke kadam app ke andar hote hain
    }
  }

  O.run = run;

  /* Landing par apne aap shuru — par sirf tab jab yeh kisan naya ho.
     4 second ka intezaar jaan-boojhkar: page theek se khul jaye, aur
     kisan ek nazar dekh le ki wo kahan aaya hai, tab baat shuru ho. */
  function autostart() {
    if (O.finished()) return;
    if (['form1', 'perms', 'form2', 'models'].indexOf(O.current()) >= 0) return;  // wo app ke andar hain
    setTimeout(run, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autostart);
  else autostart();
})();
