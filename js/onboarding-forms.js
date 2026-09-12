/* ============================================================================
 * KRASHI MITRA — kadam 4 se 6: apni jankari, anumatiyan, zameen
 * js/onboarding-forms.js
 *
 * Yeh js/onboarding-flow.js ke baad ka hissa hai — jo app ke ANDAR chalta
 * hai (login/signup ho jaane ke baad), dashboard ke upar parde ki tarah.
 *
 * HAR KHANA BOLKAR BHI BHARA JA SAKTA HAI
 *   Har khane ke aage ek mic ka button hai. Dabate hi sahayak wahi sawaal
 *   bolta hai ("apna gaon bataiye"), sunta hai, aur khane me likh deta hai.
 *   Kisan bol kuch bhi sakta hai — sunne wali bhasha uski chuni hui bhasha
 *   par lagti hai, par galat nikle to wo haath se sudhar sakta hai. Isliye
 *   khana hamesha khula rehta hai, sirf-awaaz wala tala kabhi nahi lagta.
 *
 * EK BAAR ME EK KAAM
 *   Spec do form maangta hai, ek nahi. Wajah seedhi hai: ek saath aath
 *   khane dekhte hi kisan chhod deta hai. Beech me anumatiyan aati hain,
 *   jisse form chhota lagta hai aur har anumati ka kaaran alag se samajh
 *   aata hai.
 * ========================================================================= */

(function () {
  'use strict';

  const O = window.kmOnboard;
  if (!O) return;

  const t = O.t, esc = O.esc, say = O.say;

  /* 33 rajya + kendra shasit pradesh.
   *
   * Bhandaran me hamesha ANGREZI naam jaata hai — advisory ka nishana,
   * mandi ka data aur admin dashboard sab isi par milte hain. Kisan ko
   * DIKHTA uski apni bhasha me hai (st.* keys).
   *
   * Pehle yahan seedhe Hindi naam likhe the. Tamil chunne wale kisan ko
   * 33 Hindi naam ki soochi dikhti thi — poori app Tamil me, aur bas yahi
   * ek khana Hindi me. Spec ka pehla niyam yahi mana karta hai. */
  const STATE_KEYS = [
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chhattisgarh",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal",
      "Delhi",
      "Jammu & Kashmir",
      "Ladakh",
      "Puducherry",
      "Chandigarh"
  ];

  function stateName(key) {
    return t('st.' + key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), key);
  }

  /* ------------------------------------------------------------ awaaz se */

  /* Ek khane ke liye bolkar bharna. Sunne ki suvidha na ho to mic ka
     button dikhta hi nahi — jhootha button dena bura hai. */
  function sttAvailable() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function listenOnce(onText, onFail) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { if (onFail) onFail('nahi'); return null; }
    let rec;
    try { rec = new SR(); } catch (_) { if (onFail) onFail('nahi'); return null; }
    rec.lang = O.lang();
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = (e) => {
      const r = e.results && e.results[0];
      const txt = r && r[0] && r[0].transcript;
      if (txt) onText(String(txt).trim());
    };
    rec.onerror = (e) => { if (onFail) onFail((e && e.error) || 'error'); };
    try { rec.start(); } catch (_) { if (onFail) onFail('start'); }
    return rec;
  }

  /* Khane ke saath mic ka button jodta hai. */
  function wireMic(card) {
    if (!sttAvailable()) {
      card.querySelectorAll('.kmob__mic').forEach((b) => b.remove());
      return;
    }
    card.querySelectorAll('.kmob__mic').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = card.querySelector('#' + btn.dataset.for);
        if (!input) return;
        const ask = btn.dataset.ask || '';
        const listen = () => {
          btn.classList.add('is-live');
          btn.setAttribute('aria-label', t('ob.listening', 'सुन रहा हूँ'));
          listenOnce(
            (txt) => {
              btn.classList.remove('is-live');
              /* Ank wale khane me se shabd hata dete hain — kisan "nau nau
                 aath" bolta hai to browser aksar "99 8" jaisa deta hai. */
              input.value = (input.dataset.numeric === '1')
                ? txt.replace(/\D/g, '')
                : txt;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.focus();
            },
            () => {
              btn.classList.remove('is-live');
              /* Chup-chaap fail mat ho — kisan ko batao ki likhkar bhi chalega */
              const note = card.querySelector('.kmob__err');
              if (note) note.textContent = t('ob.sttFail', 'आवाज़ समझ नहीं आई — कृपया टाइप कर दीजिए।');
            }
          );
        };
        if (ask) say(ask, listen); else listen();
      });
    });
  }

  function micBtn(forId, ask) {
    return '<button type="button" class="kmob__mic" data-for="' + forId + '" ' +
           'data-ask="' + esc(ask) + '" aria-label="' + esc(t('ob.speak', 'बोलकर बताएँ')) + '">' +
           '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
           'stroke-width="1.8" stroke-linecap="round"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/>' +
           '<path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg></button>';
  }

  function field(id, label, ask, opts) {
    const o = opts || {};
    return '<label class="kmob__field">' +
      '<span class="kmob__label">' + esc(label) + '</span>' +
      '<span class="kmob__inwrap">' +
        '<input id="' + id + '" name="' + id + '" type="' + (o.type || 'text') + '" ' +
          (o.numeric ? 'data-numeric="1" inputmode="numeric" ' : '') +
          (o.required === false ? '' : 'required ') +
          (o.maxlength ? 'maxlength="' + o.maxlength + '" ' : '') +
          'autocomplete="' + (o.autocomplete || 'off') + '" ' +
          'value="' + esc(o.value || '') + '">' +
        micBtn(id, ask) +
      '</span>' +
    '</label>';
  }

  /* --------------------------------------------------- 4. apni jankari */

  async function stepForm1(prefill) {
    const p = prefill || {};
    const needsPassword = p.needsPassword === true;

    const card = O.shell(
      '<h2 class="kmob__h">' + esc(t('ob.f1Title', 'अपनी जानकारी भरिए')) + '</h2>' +
      '<p class="kmob__p">' + esc(t('ob.f1Sub',
        'हर खाने के आगे माइक का बटन है — चाहें तो बोलकर भरिए, चाहें तो टाइप कीजिए।')) + '</p>' +
      '<form id="kmobF1" novalidate>' +
        field('firstName', t('ob.firstName', 'पहला नाम'), t('ob.askFirstName', 'अपना पहला नाम बताइए')) +
        field('surname',   t('ob.surname', 'उपनाम'),      t('ob.askSurname', 'अपना उपनाम बताइए'), { required: false }) +
        field('village',   t('ob.village', 'गाँव'),        t('ob.askVillage', 'आपका गाँव कौन सा है')) +
        field('district',  t('ob.district', 'ज़िला / शहर'), t('ob.askDistrict', 'आपका ज़िला कौन सा है')) +
        '<label class="kmob__field"><span class="kmob__label">' + esc(t('ob.state', 'राज्य')) + '</span>' +
          '<select id="state" name="state" required>' +
            '<option value="">' + esc(t('ob.choose', 'चुनिए')) + '</option>' +
            STATE_KEYS.map((k) => '<option value="' + esc(k) + '"' +
              (p.state === k ? ' selected' : '') + '>' + esc(stateName(k)) + '</option>').join('') +
          '</select></label>' +
        field('phone', t('ob.phone', 'मोबाइल नंबर'), t('ob.askPhone', 'अपना दस अंकों का मोबाइल नंबर बोलिए'),
              { numeric: true, maxlength: 10, value: p.phone || '' }) +
        (needsPassword
          ? '<label class="kmob__field"><span class="kmob__label">' +
              esc(t('ob.password', 'पासवर्ड (कम से कम 8 अक्षर)')) + '</span>' +
              '<input id="password" name="password" type="password" minlength="8" required ' +
              'autocomplete="new-password"></label>'
          : '') +
        '<p class="kmob__err" role="alert"></p>' +
        '<div class="kmob__row">' +
          '<button type="submit" class="kmob__btn kmob__btn--primary">' +
            esc(t('ob.save', 'सेव करें')) + '</button>' +
        '</div>' +
      '</form>'
    );

    /* Password ka khana Google wale khate me hi aata hai — Google hamein
       password nahi deta, aur bina password ke kisan kabhi manually login
       nahi kar payega (net na ho to Google ka rasta bhi band). */

    wireMic(card);
    say(t('ob.f1Say', 'अब अपनी जानकारी भरिए। हर खाने के आगे माइक का बटन है।'));

    const form = card.querySelector('#kmobF1');
    const err = card.querySelector('.kmob__err');

    if (p.firstName) form.firstName.value = p.firstName;
    if (p.surname)   form.surname.value = p.surname;
    if (p.village)   form.village.value = p.village;
    if (p.district)  form.district.value = p.district;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.textContent = '';
      const data = Object.fromEntries(new FormData(form));

      const phone = String(data.phone || '').replace(/\D/g, '');
      /* Bharat me mobile 10 ank ka hai aur 6-9 se shuru hota hai. +91 kisan
         aksar bol deta hai, isliye aakhri 10 ank lete hain. */
      const ph = phone.slice(-10);
      if (!/^[6-9][0-9]{9}$/.test(ph)) {
        err.textContent = t('ob.badPhone', 'मोबाइल नंबर 10 अंकों का होना चाहिए और 6 से 9 के बीच के अंक से शुरू होना चाहिए।');
        return;
      }
      if (needsPassword && String(data.password || '').length < 8) {
        err.textContent = t('ob.badPass', 'पासवर्ड कम से कम 8 अक्षर का रखिए।');
        return;
      }

      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;

      try {
        if (needsPassword) {
          const r0 = await fetch('/api/auth?action=set-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: data.password }),
          });
          if (!r0.ok && r0.status !== 409) {
            const o0 = await r0.json().catch(() => ({}));
            err.textContent = o0.error || t('ob.saveFail', 'सेव नहीं हुआ।');
            btn.disabled = false; return;
          }
        }

        const r = await fetch('/api/auth?action=profile', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: 'personal',
            firstName: data.firstName, surname: data.surname,
            village: data.village, district: data.district,
            state: data.state, phone: ph,
          }),
        });
        const o = await r.json().catch(() => ({}));
        if (!r.ok) { err.textContent = o.error || t('ob.saveFail', 'सेव नहीं हुआ।'); btn.disabled = false; return; }

        /* Naam prefs me bhi — sahayak ise naam se bulane ke liye padhta hai
           aur wo net ke bina bhi chalta hai. */
        try {
          const pr = JSON.parse(localStorage.getItem('km.preferences.v1') || '{}');
          pr.name = [data.firstName, data.surname].filter(Boolean).join(' ');
          pr.village = data.village; pr.district = data.district; pr.state = data.state;
          localStorage.setItem('km.preferences.v1', JSON.stringify(pr));
        } catch (_) {}

        O.markDone('form1');
        window.kmObForms.run();
      } catch (_) {
        err.textContent = t('ob.offline', 'इंटरनेट नहीं है — थोड़ी देर बाद कोशिश कीजिए।');
        btn.disabled = false;
      }
    });
  }

  window.kmObForms = { stepForm1: stepForm1, STATE_KEYS: STATE_KEYS, stateName: stateName, wireMic: wireMic, field: field, listenOnce: listenOnce };
})();

/* ============================================================================
 * KADAM 5 — anumatiyan aur niji-niti (privacy)
 * ========================================================================= */

(function () {
  'use strict';

  const O = window.kmOnboard;
  const F = window.kmObForms;
  if (!O || !F) return;
  const t = O.t, esc = O.esc, say = O.say;

  /* Kram spec se: jagah, soochna, camera. Mic yahan NAHI hai — wo kadam 0
     me hi maanga ja chuka hai, aur ek hi cheez dobara maangna kisan ko
     lagta hai ki app kuch chhupa rahi hai. */
  const PERMS = [
    { id: 'location', icon: 'pin',
      label: 'ob.permLoc',     labelHi: 'जगह (लोकेशन)',
      why:   'ob.permLocWhy',  whyHi: 'आपके इलाके का मौसम, छिड़काव की चेतावनी और पास की मंडी का भाव दिखाने के लिए।' },
    { id: 'notify', icon: 'bell',
      label: 'ob.permNotify',  labelHi: 'सूचनाएँ',
      why:   'ob.permNotifyWhy', whyHi: 'ओला, कीट या रोग की चेतावनी आप तक तब भी पहुँचे जब ऐप बंद हो।' },
    { id: 'camera', icon: 'camera',
      label: 'ob.permCam',     labelHi: 'कैमरा',
      why:   'ob.permCamWhy',  whyHi: 'पत्ती की फोटो खींचकर रोग पहचानने के लिए। फोटो आपके फ़ोन पर ही जाँची जाती है।' },
  ];

  async function ask(id) {
    try {
      if (id === 'location') {
        return await new Promise((res) => {
          if (!navigator.geolocation) return res(false);
          navigator.geolocation.getCurrentPosition(() => res(true), () => res(false),
            { timeout: 12000, maximumAge: 600000 });
        });
      }
      if (id === 'notify') {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        const r = await Notification.requestPermission();
        return r === 'granted';
      }
      if (id === 'camera') {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        s.getTracks().forEach((tr) => tr.stop());
        return true;
      }
    } catch (_) { return false; }
    return false;
  }

  function stepPerms() {
    const rows = PERMS.map((p) =>
      '<div class="kmob__perm" data-perm="' + p.id + '">' +
        '<div class="kmob__permtext">' +
          '<b>' + esc(t(p.label, p.labelHi)) + '</b>' +
          '<small>' + esc(t(p.why, p.whyHi)) + '</small>' +
        '</div>' +
        '<button type="button" class="kmob__btn kmob__btn--sm" data-ask="' + p.id + '">' +
          esc(t('ob.allow', 'अनुमति दें')) + '</button>' +
      '</div>').join('');

    const card = O.shell(
      '<h2 class="kmob__h">' + esc(t('ob.permTitle', 'कुछ अनुमतियाँ चाहिए')) + '</h2>' +
      '<p class="kmob__p">' + esc(t('ob.permSub',
        'इनके बिना भी ऐप चलेगी, पर ये सुविधाएँ बंद रहेंगी। आप बाद में कभी भी चालू कर सकते हैं।')) + '</p>' +
      rows +
      '<div class="kmob__privacy">' +
        '<label class="kmob__agree">' +
          '<input type="checkbox" id="kmobAgree">' +
          '<span>' + esc(t('ob.agree', 'मैंने निजता नीति पढ़ ली है और सहमत हूँ।')) +
            ' <a href="/privacy" target="_blank" rel="noopener">' +
            esc(t('ob.readPolicy', 'नीति पढ़ें')) + '</a></span>' +
        '</label>' +
        '<p class="kmob__fine">' + esc(t('ob.privacyGist',
          'आपकी फोटो आपके फ़ोन पर ही जाँची जाती है। कृषि विभाग को जाँच तभी भेजी जाती है ' +
          'जब आप खुद वह सुविधा चालू करें।')) + '</p>' +
      '</div>' +
      '<div class="kmob__row">' +
        '<button type="button" class="kmob__btn kmob__btn--primary" id="kmobPermNext" disabled>' +
          esc(t('ob.next', 'आगे बढ़ें')) + '</button>' +
      '</div>'
    );

    say(t('ob.permSay', 'अब कुछ अनुमतियाँ चाहिए। हर एक का कारण नीचे लिखा है।'));

    card.querySelectorAll('[data-ask]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.ask;
        const meta = PERMS.find((p) => p.id === id);
        btn.disabled = true;
        say(t(meta.why, meta.whyHi));
        const ok = await ask(id);
        const row = card.querySelector('[data-perm="' + id + '"]');
        row.classList.add(ok ? 'is-on' : 'is-off');
        btn.textContent = ok
          ? t('ob.allowed', 'मिल गई')
          : t('ob.notAllowed', 'नहीं मिली — बाद में सेटिंग से');
        /* Mana karne par bhi aage badhne dete hain. Kisan ko bandhak nahi
           banate; sirf itna likh dete hain ki wo suvidha abhi band hai. */
        const st = O.load().perms || {};
        st[id] = ok; O.save({ perms: st });
      });
    });

    const agree = card.querySelector('#kmobAgree');
    const next = card.querySelector('#kmobPermNext');
    /* Sehmati ke bina aage nahi — yeh spec me bhi hai aur sahi bhi hai. */
    agree.addEventListener('change', () => { next.disabled = !agree.checked; });
    next.addEventListener('click', () => {
      O.hush();
      O.save({ privacyAgreedAt: new Date().toISOString() });
      O.markDone('perms');
      window.kmObForms.run();
    });
  }

  /* ==========================================================================
   * KADAM 6 — kitni zameen
   * ======================================================================= */

  /* Bigha har rajya me alag hota hai — isliye use "lagbhag" likhte hain,
     aur bhandaran hamesha unit ke saath hota hai, kabhi akela number nahi. */
  const UNITS = [
    ['acre',    'एकड़'],
    ['hectare', 'हेक्टेयर'],
    ['bigha',   'बीघा (लगभग)'],
    ['guntha',  'गुंठा'],
  ];

  function stepForm2() {
    const card = O.shell(
      '<h2 class="kmob__h">' + esc(t('ob.f2Title', 'आपके पास कितनी ज़मीन है?')) + '</h2>' +
      '<p class="kmob__p">' + esc(t('ob.f2Sub',
        'इससे दवा और खाद की मात्रा आपके खेत के हिसाब से बताई जाती है।')) + '</p>' +
      '<form id="kmobF2" novalidate>' +
        '<div class="kmob__landrow">' +
          F.field('landAmount', t('ob.landAmount', 'ज़मीन'),
                  t('ob.askLand', 'आपके पास कितनी ज़मीन है'), { numeric: false }) +
          '<label class="kmob__field kmob__field--unit">' +
            '<span class="kmob__label">' + esc(t('ob.unit', 'इकाई')) + '</span>' +
            '<select id="landUnit" name="landUnit">' +
              UNITS.map(([v, hi]) => '<option value="' + v + '">' +
                esc(t('ob.unit.' + v, hi)) + '</option>').join('') +
            '</select>' +
          '</label>' +
        '</div>' +
        '<p class="kmob__err" role="alert"></p>' +
        '<div class="kmob__row">' +
          '<button type="submit" class="kmob__btn kmob__btn--primary">' +
            esc(t('ob.finish', 'पूरा करें')) + '</button>' +
        '</div>' +
      '</form>'
    );

    F.wireMic(card);
    say(t('ob.f2Say', 'आपके पास कितनी ज़मीन है? संख्या बोलिए या लिखिए।'));

    const form = card.querySelector('#kmobF2');
    const err = card.querySelector('.kmob__err');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.textContent = '';
      /* "do point paanch" jaisa bola ja sakta hai — ank aur dashamlav
         chhod kar baaki hata dete hain. */
      const raw = String(form.landAmount.value || '').replace(/[^0-9.]/g, '');
      const land = Number(raw);
      if (!isFinite(land) || land <= 0) {
        err.textContent = t('ob.badLand', 'ज़मीन की मात्रा संख्या में लिखिए, जैसे 2 या 1.5');
        return;
      }
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        const r = await fetch('/api/auth?action=profile', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'land', landAmount: land, landUnit: form.landUnit.value }),
        });
        const o = await r.json().catch(() => ({}));
        if (!r.ok) { err.textContent = o.error || t('ob.saveFail', 'सेव नहीं हुआ।'); btn.disabled = false; return; }
        O.markDone('form2');
        window.kmObForms.run();
      } catch (_) {
        err.textContent = t('ob.offline', 'इंटरनेट नहीं है — थोड़ी देर बाद कोशिश कीजिए।');
        btn.disabled = false;
      }
    });
  }

  window.kmObForms.stepPerms = stepPerms;
  window.kmObForms.stepForm2 = stepForm2;
  window.kmObForms.UNITS = UNITS;
})();

/* ============================================================================
 * KADAM 8 — "sab model utaar lein"  +  app ke andar ka runner
 * ========================================================================= */

(function () {
  'use strict';

  const O = window.kmOnboard;
  const F = window.kmObForms;
  if (!O || !F) return;
  const t = O.t, esc = O.esc, say = O.say;

  /* Kyun SAARE model, sirf ek nahi:
     Kisan aaj dhaan ki jaanch karne aaya hai, par agle mahine gehun bota
     hai — aur tab tak wo khet me hoga jahan net nahi hai. Model tabhi
     utarna chahiye jab net HAI, chahe zaroorat baad me pade.
     Isliye ek hi button, aur wo sab kuch utaarta hai. */
  function stepModels() {
    const card = O.shell(
      '<h2 class="kmob__h">' + esc(t('ob.dlTitle', 'बिना इंटरनेट के चलाने के लिए')) + '</h2>' +
      '<p class="kmob__p">' + esc(t('ob.dlBody',
        'खेत में अक्सर नेटवर्क नहीं होता। अभी नेट है, तो सभी फसलों की जाँच अपने ' +
        'फ़ोन में उतार लीजिए — उसके बाद जाँच बिना इंटरनेट के चलेगी।')) + '</p>' +
      '<p class="kmob__fine" id="kmobDlNote"></p>' +
      '<div class="kmob__bar" hidden><span id="kmobDlBar"></span></div>' +
      '<div class="kmob__row kmob__row--stack">' +
        '<button type="button" class="kmob__btn kmob__btn--primary" id="kmobDl">' +
          esc(t('ob.dlNow', 'अभी उतार लें')) + '</button>' +
        '<button type="button" class="kmob__btn" id="kmobDlLater">' +
          esc(t('ob.dlLater', 'बाद में')) + '</button>' +
      '</div>'
    );

    say(t('ob.dlSay', 'खेत में अक्सर नेटवर्क नहीं होता। अभी सभी फसलों की जाँच अपने फ़ोन में उतार लीजिए।'));

    const note = card.querySelector('#kmobDlNote');
    const bar = card.querySelector('.kmob__bar');
    const fill = card.querySelector('#kmobDlBar');

    /* Net na ho to jhootha button mat dikhao — saaf batao. */
    if (navigator.onLine === false) {
      note.textContent = t('ob.dlOffline',
        'अभी इंटरनेट नहीं है। नेट आने पर "पुरानी जाँचें" वाले पन्ने से कभी भी उतार सकते हैं।');
      card.querySelector('#kmobDl').disabled = true;
    }

    const finish = () => { O.markDone('models'); O.close(); };

    card.querySelector('#kmobDlLater').addEventListener('click', () => {
      O.hush();
      /* "Baad me" ka matlab hamesha ke liye nahi. Kadam poora maankar aage
         badhte hain, par ye yaad rakhte hain taaki app baad me ek baar
         phir chhota sa sujhav de sake. */
      O.save({ modelsDeferred: true });
      finish();
    });

    card.querySelector('#kmobDl').addEventListener('click', async () => {
      O.hush();
      const btn = card.querySelector('#kmobDl');
      btn.disabled = true;
      btn.textContent = t('ob.dlGoing', 'उतर रहा है…');
      bar.hidden = false;
      note.textContent = t('ob.dlKeepOpen',
        'ऐप खुली रहने दीजिए। यह एक बार का काम है।');

      /* Asli download maujooda offline manager karta hai — usi ko bulate
         hain, nayi nakal nahi banate. */
      try {
        if (typeof window.downloadAllModels === 'function') {
          await window.downloadAllModels();
        } else if (typeof downloadAllModels === 'function') {
          await downloadAllModels();
        } else {
          throw new Error('no-downloader');
        }
        fill.style.width = '100%';
        note.textContent = t('ob.dlDone', 'हो गया — अब जाँच बिना इंटरनेट के भी चलेगी।');
        say(t('ob.dlDone', 'हो गया — अब जाँच बिना इंटरनेट के भी चलेगी।'));
        setTimeout(finish, 1400);
      } catch (_) {
        note.textContent = t('ob.dlFail',
          'पूरा नहीं उतर पाया। कोई बात नहीं — बाद में "पुरानी जाँचें" वाले पन्ने से दोबारा कोशिश कर सकते हैं।');
        btn.disabled = false;
        btn.textContent = t('ob.dlRetry', 'दोबारा कोशिश करें');
      }
    });
  }

  /* --------------------------------------------------- app ka runner */

  /* Kaun sa kadam bacha hai, wo server se poochte hain — localStorage
     doosre phone par nahi hota. Kisan naya phone le to bhi uski profile
     bhari hui hai; use dobara form nahi dikhna chahiye. */
  async function session() {
    try {
      const r = await fetch('/api/auth?action=session');
      if (!r.ok) return null;
      return await r.json();
    } catch (_) { return null; }
  }

  async function run() {
    const step = O.current();

    /* Form/permission wale kadam se pehle hi nahi hain to kuch mat karo —
       wo landing page ka kaam hai. */
    if (['mic', 'lang', 'intro', 'auth'].indexOf(step) >= 0) return;
    if (step === 'done') return;

    if (step === 'form1') {
      const s = await session();
      if (!s || !s.authenticated) return;        // abhi login hi nahi hua
      const p = s.profile || {};
      /* Purana kisan (profile pehle se poori) — form dobara mat dikhao.
         Yeh spec ki saaf maang hai, aur Google se aane walon par bhi lagti
         hai jinhone pehle kabhi form bhar diya tha. */
      if (p.village && p.state) {
        O.save({ step: p.landAmount ? 'models' : 'form2' });
        return run();
      }
      const nm = String(s.user && s.user.name || '').trim().split(/\s+/);
      return F.stepForm1({
        needsPassword: s.needsPassword === true,
        firstName: nm[0] || '', surname: nm.slice(1).join(' '),
        phone: (s.user && s.user.phone) || '',
        village: p.village || '', district: p.district || '', state: p.state || '',
      });
    }

    if (step === 'perms')  return F.stepPerms();
    if (step === 'form2')  return F.stepForm2();
    if (step === 'models') return stepModels();
  }

  window.kmObForms.stepModels = stepModels;
  window.kmObForms.run = run;

  /* app.html par apne aap — par sirf jab kaam bacha ho. */
  function autostart() {
    if (O.finished()) return;
    setTimeout(() => { run(); }, 900);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autostart);
  else autostart();
})();
