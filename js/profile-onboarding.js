/* ============================================================================
 * KRASHI MITRA — naye khate ka setup (password + kisan profile)
 * js/profile-onboarding.js
 *
 * KAB CHALTA HAI: sirf /app par, login ke turant baad.
 *
 * DO KADAM, DONO ZAROORI (chhode nahi ja sakte):
 *   1. PASSWORD  — sirf un khaton ke liye jo Google se bane hain. Unme
 *      password hota hi nahi, isliye kisan kabhi email+password se login
 *      nahi kar paata tha. Ek baar yahan bana lete hain, taaki Google na
 *      chale tab bhi wo andar aa sake.
 *   2. PROFILE   — gaon, rajya, PIN aur zameen ka naap. Inke bina dawa ki
 *      matra aur mandi bhaav dono galat nikalte hain.
 *
 * OFFLINE KA DHYAN: agar server se baat hi na ho paye (khet me net nahi),
 * to hum kisan ko ROKTE NAHI. Rog pehchan poori tarah offline chalti hai —
 * usi ke liye to app hai. Sirf tab login bhejte hain jab server SAAF-SAAF
 * kahe ki session nahi hai (401).
 * ========================================================================= */

(() => {
  // Sirf app wale page par
  if (!/\/app(?:\.html)?$/.test(location.pathname)) return;

  const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
    'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
    'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
    'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Other'];

  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Chuni hui bhasha ka text — js/i18n.js ho to wahan se, warna Hindi. */
  const t = (key, fallback) =>
    (window.kmI18n && window.kmI18n.t(key) !== key) ? window.kmI18n.t(key) : fallback;

  /* -------------------------------------------------------------------
   * Session ka natija teen tarah ka: 'in' | 'out' | 'unknown'
   * Yeh farq zaroori hai — 'unknown' (offline/server down) par kisan ko
   * login par bhejna matlab bina internet app hi band ho jaana.
   * ----------------------------------------------------------------- */
  async function session() {
    try {
      const r = await fetch('/api/auth?action=session');
      if (r.status === 401 || r.status === 403) return { state: 'out' };
      if (!r.ok) return { state: 'unknown' };
      const d = await r.json();
      return { state: 'in', data: d };
    } catch (_) {
      return { state: 'unknown' };
    }
  }

  /* ---------------- overlay ---------------- */
  let modal = null;
  function shell(inner) {
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'km-profile-modal';
      document.body.append(modal);
    }
    modal.innerHTML =
      '<section class="km-profile-card" role="dialog" aria-modal="true">' + inner + '</section>';
    return modal.querySelector('.km-profile-card');
  }
  function done() { if (modal) { modal.remove(); modal = null; } }

  /* ===================================================================
   * KADAM 1 — password (sirf Google se bane khate ke liye)
   * ================================================================= */
  function askPassword(user, next) {
    const card = shell(
      '<p class="km-step">' + esc(t('setup.step1', 'चरण 1 / 2')) + '</p>' +
      '<h1>' + esc(t('setup.pwTitle', 'एक पासवर्ड बना लीजिए')) + '</h1>' +
      '<p>' + esc(t('setup.pwWhy',
        'आपका खाता Google से बना है। एक पासवर्ड बना लें ताकि Google न चले तब भी ' +
        'आप ईमेल और पासवर्ड से ऐप में आ सकें।')) + '</p>' +
      '<form id="km-pw-form">' +
        '<label>' + esc(t('setup.pw', 'नया पासवर्ड')) +
          '<input name="password" type="password" minlength="8" required ' +
          'autocomplete="new-password" placeholder="कम से कम 8 अक्षर"></label>' +
        '<label>' + esc(t('setup.pw2', 'दोबारा लिखें')) +
          '<input name="confirm" type="password" minlength="8" required ' +
          'autocomplete="new-password"></label>' +
        '<p class="km-profile-error" aria-live="polite"></p>' +
        '<button class="km-profile-submit">' + esc(t('setup.save', 'आगे बढ़ें')) + '</button>' +
      '</form>');

    const form = card.querySelector('form');
    const err = card.querySelector('.km-profile-error');

    form.onsubmit = async (e) => {
      e.preventDefault();
      err.textContent = '';
      if (form.password.value !== form.confirm.value) {
        err.textContent = t('setup.pwMismatch', 'दोनों पासवर्ड एक जैसे नहीं हैं।');
        return;
      }
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        const r = await fetch('/api/auth?action=set-password', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: form.password.value }),
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok) { err.textContent = out.error || 'पासवर्ड सेव नहीं हुआ।'; btn.disabled = false; return; }
        next();
      } catch (_) {
        err.textContent = t('setup.offline', 'इंटरनेट नहीं है — थोड़ी देर बाद कोशिश करें।');
        btn.disabled = false;
      }
    };
  }

  /* ===================================================================
   * KADAM 2 — kisan profile
   * NOTE: "pasandeeda mandi" ka field JAAN-BOOJHKAR nahi hai. App khud
   * aas-paas ki saari mandi ka bhaav laakar dikhata hai (js/mandi.js),
   * isliye kisan se ek mandi chunwana bekaar hai.
   * ================================================================= */
  function askProfile(user, twoStep) {
    const card = shell(
      (twoStep ? '<p class="km-step">' + esc(t('setup.step2', 'चरण 2 / 2')) + '</p>' : '') +
      '<h1>' + esc(t('setup.profTitle', 'किसान प्रोफ़ाइल पूरी करें')) + '</h1>' +
      '<p>' + esc(t('setup.profWhy',
        'नमस्ते ' + (user.name || '') + '। सही सलाह, दवा की मात्रा और अपने पास की मंडी का ' +
        'भाव दिखाने के लिए ये जानकारी ज़रूरी है।')) + '</p>' +
      '<form id="km-profile-form">' +
        '<label>' + esc(t('setup.name', 'पूरा नाम')) +
          '<input name="name" required autocomplete="name" value="' + esc(user.name || '') + '"></label>' +
        '<label>' + esc(t('setup.village', 'गाँव / शहर')) +
          '<input name="village" required autocomplete="address-level2"></label>' +
        '<label>' + esc(t('setup.state', 'राज्य')) +
          '<select name="state" required><option value="">' + esc(t('setup.pickState', 'राज्य चुनें')) +
          '</option>' + STATES.map((s) => '<option>' + s + '</option>').join('') + '</select></label>' +
        '<label>' + esc(t('setup.pin', 'PIN कोड')) +
          '<input name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required ' +
          'placeholder="262001"></label>' +
        '<label>' + esc(t('setup.land', 'ज़मीन कितनी है')) +
          '<button type="button" id="km-speak-land">' + esc(t('setup.speak', 'बोलकर भरें')) + '</button>' +
          '<div class="km-land-row">' +
            '<input name="landAmount" type="number" min="0.01" step="0.01" required placeholder="2.5">' +
            '<select name="landUnit">' +
              '<option value="acre">एकड़ / acre</option>' +
              '<option value="hectare">हेक्टेयर / hectare</option>' +
              '<option value="bigha">बीघा / bigha</option>' +
              '<option value="kanal">कनाल / kanal</option>' +
            '</select>' +
          '</div></label>' +
        '<p class="km-profile-error" aria-live="polite"></p>' +
        '<button class="km-profile-submit">' + esc(t('setup.finish', 'प्रोफ़ाइल सेव करें')) + '</button>' +
      '</form>');

    const form = card.querySelector('form');
    const err = card.querySelector('.km-profile-error');

    /* Zameen ka naap bolkar bharna — bahut se kisan likhna pasand nahi karte.
       Bhasha wahi jo kisan ne chuni hai, hardcoded Hindi nahi. */
    card.querySelector('#km-speak-land').onclick = () => {
      const R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) { alert(t('setup.noVoice', 'इस फ़ोन में आवाज़ पहचान नहीं है। कृपया लिखकर भरें।')); return; }
      const r = new R();
      r.lang = (window.kmLang && window.kmLang.current) ? window.kmLang.current().code : 'hi-IN';
      r.onresult = (e) => {
        const text = e.results[0][0].transcript.replace(',', '.');
        const n = text.match(/[0-9]+(?:\.[0-9]+)?/);
        if (n) form.landAmount.value = n[0];
      };
      try { r.start(); } catch (_) {}
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      err.textContent = '';
      const btn = form.querySelector('.km-profile-submit');
      btn.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(form));
        const r = await fetch('/api/auth?action=profile', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok) { err.textContent = out.error || 'जानकारी सेव नहीं हुई।'; btn.disabled = false; return; }
        done();
        window.dispatchEvent(new CustomEvent('km:profile-ready', { detail: out.profile || null }));
      } catch (_) {
        err.textContent = t('setup.offline', 'इंटरनेट नहीं है — थोड़ी देर बाद कोशिश करें।');
        btn.disabled = false;
      }
    };
  }

  /* ---------------- shuruaat ---------------- */
  session().then((s) => {
    if (s.state === 'out') { location.replace('/login'); return; }
    if (s.state !== 'in') {
      console.info('[auth] session pata nahi chala (offline?) — app offline chalti rahegi');
      return;
    }

    const d = s.data || {};
    const user = d.user || {};

    /* Server par sambhali hui bhasha is phone par bhi laga do */
    if (d.language && window.kmLang) {
      try { window.kmLang.apply(d.language, { silent: true, fromServer: true }); } catch (_) {}
    }

    const needsPw = !!d.needsPassword;
    const needsProfile = !d.profile;

    if (needsPw && needsProfile) askPassword(user, () => askProfile(user, true));
    else if (needsPw)           askPassword(user, () => done());
    else if (needsProfile)      askProfile(user, false);
  });
})();
