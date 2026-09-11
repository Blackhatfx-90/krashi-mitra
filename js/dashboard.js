/* ============================================================================
 * KRASHI MITRA — DASHBOARD (login ke baad ka ghar)
 * js/dashboard.js
 *
 * PEHLE KYA THA: login ke turant baad kisan seedha "fasal chunein" par
 * pahunch jaata tha. Uske paas na apni jankari dekhne ka raasta tha, na
 * vibhag ki soochna, na sarkari portal ke link.
 *
 * AB: login ke baad yeh Dashboard khulta hai. Fasal jaanch yahin se ek tap
 * door hai — bas ab wo ekmatra raasta nahi hai.
 *
 * ISME KYA HAI
 *   1. Bade kaam ke buttons — fasal jaanch, salah, mandi bhaav, mausam
 *   2. Vibhag ki soochna (jo admin bhejta hai) — kisan ki apni bhasha me
 *   3. Sarkari portal ke seedhe link
 *   4. Apni jankari — dekhna aur badalna (asli API se, sirf dikhawa nahi)
 *   5. Logout
 *
 * OFFLINE: soochna aur portal link ke liye internet chahiye; unke bina
 * bhi baaki dashboard aur poori rog-pehchan chalti rehti hai.
 * ========================================================================= */

(function () {
  'use strict';

  /* Sarkari portal — inhe badalna ho to bas yahi list badlein */
  const PORTALS = [
    { hi:'कृषि एवं किसान कल्याण विभाग', en:'Dept. of Agriculture & Farmers Welfare',
      url:'https://agriwelfare.gov.in/', note:'योजनाएँ, आँकड़े, सरकारी सूचनाएँ' },
    { hi:'कृषि निवेश पोर्टल', en:'Krishi Nivesh',
      url:'https://krishinivesh.gov.in/', note:'निवेश और सब्सिडी की जानकारी' },
    { hi:'कृषि निर्णय सहायता प्रणाली', en:'Krishi DSS',
      url:'https://krishi-dss.gov.in/krishi-dss/', note:'मौसम, मिट्टी और फसल का नक़्शा' },
    { hi:'फसल बीमा / GCES', en:'GCES',
      url:'https://gces.dac.gov.in/', note:'फसल कटाई प्रयोग और बीमा' },
    { hi:'पीएम किसान', en:'PM-KISAN',
      url:'https://pmkisan.gov.in/', note:'किस्त की स्थिति देखें' },
    { hi:'ई-नाम मंडी', en:'e-NAM',
      url:'https://enam.gov.in/web/', note:'ऑनलाइन मंडी और भाव' },
  ];

  const esc = (t) => (typeof escapeHtml === 'function' ? escapeHtml(t) : String(t == null ? '' : t));
  const ico = (n, c) => (typeof icon === 'function' ? icon(n, c) : '');
  const $   = (s) => document.querySelector(s);
  const appState = () => (typeof state !== 'undefined') ? state : null;
  const appCrops = () => (typeof CROPS !== 'undefined') ? CROPS : {};
  const t = (k, f) => (window.kmI18n && window.kmI18n.t(k) !== k) ? window.kmI18n.t(k) : f;

  const D = { user: null, profile: null, news: [], el: {} };

  /* ------------------------------------------------------------------ */
  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return t('dash.morning', 'सुप्रभात');
    if (h < 17) return t('dash.afternoon', 'नमस्ते');
    return t('dash.evening', 'शुभ संध्या');
  }

  /* ---------- 1. bade kaam ke buttons ---------- */
  function tilesHtml() {
    const crop = appState() && appState().cropId ? appCrops()[appState().cropId] : null;
    const tiles = [
      { view:'crops', ic:'camera', hi:'फसल की जाँच', sub: crop ? ('अभी: ' + (typeof cropName==='function' ? cropName(crop.id) : crop.nameHi)) : 'फोटो से रोग पहचानें', big:true },
      { view:'advisory', ic:'bulb', hi:'सलाह', sub:'आख़िरी जाँच की सलाह' },
      { view:'handbook', ic:'book', hi:'रोग पुस्तिका', sub:'सभी रोगों की जानकारी' },
      { view:'history', ic:'clock', hi:'पुरानी जाँचें', sub:'पहले क्या मिला था' },
    ];
    return '<div class="dash-tiles">' + tiles.map((x) =>
      '<button type="button" class="dash-tile' + (x.big ? ' dash-tile--big' : '') +
      '" data-view="' + x.view + '">' +
        '<span class="dash-tile__ic">' + ico(x.ic) + '</span>' +
        '<span class="dash-tile__txt"><b>' + esc(x.hi) + '</b><small>' + esc(x.sub) + '</small></span>' +
      '</button>').join('') + '</div>';
  }

  /* ---------- 2. vibhag ki soochna ---------- */
  function newsHtml() {
    if (!D.news.length) {
      return '<p class="dash-empty">' +
        esc(t('dash.noNews', 'अभी कृषि विभाग की कोई नई सूचना नहीं है।')) + '</p>';
    }
    return '<ul class="dash-news">' + D.news.slice(0, 5).map((a) => {
      const cls = a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'warning' : 'info';
      const when = a.issuedAt ? new Date(a.issuedAt).toLocaleDateString('en-IN',
        { day:'numeric', month:'short' }) : '';
      return '<li class="dash-news__item dash-news__item--' + cls + '">' +
        '<span class="dash-news__ic">' + ico(cls === 'info' ? 'info' : 'alert') + '</span>' +
        '<div><p class="dash-news__title">' + esc(a.title || a.titleHi || '') + '</p>' +
        '<p class="dash-news__msg">' + esc((a.message || a.messageHi || '').slice(0, 160)) + '</p>' +
        '<p class="dash-news__meta">' + esc(a.issuedBy || 'कृषि विभाग') +
          (when ? ' · ' + when : '') + '</p></div></li>';
    }).join('') + '</ul>';
  }

  /* ---------- 3. sarkari portal ---------- */
  function portalsHtml() {
    return '<div class="dash-portals">' + PORTALS.map((p) =>
      '<a class="dash-portal" href="' + p.url + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="dash-portal__txt"><b>' + esc(p.hi) + '</b>' +
        '<small>' + esc(p.note) + '</small></span>' +
        ico('chevron', 'ic ic--xs') + '</a>').join('') + '</div>';
  }

  /* ---------- 4. apni jankari ---------- */
  function profileHtml() {
    const p = D.profile || {};
    const u = D.user || {};
    const row = (label, val) =>
      '<div class="dash-prow"><span>' + esc(label) + '</span><b>' + esc(val || '—') + '</b></div>';
    return '<div class="dash-profile">' +
      row(t('prof.name', 'नाम'), u.name) +
      row(t('prof.email', 'ईमेल'), u.email) +
      row(t('prof.village', 'गाँव / शहर'), p.village) +
      row(t('prof.state', 'राज्य'), p.state) +
      row(t('prof.pin', 'PIN'), p.pin) +
      row(t('prof.land', 'ज़मीन'), p.landAmount ? (p.landAmount + ' ' + (p.landUnit || 'acre')) : '') +
      row(t('prof.lang', 'भाषा'), (window.kmLang && window.kmLang.current().native) || '') +
      alertRowHtml() +
      notifyRowsHtml() +
      '<div class="dash-pactions">' +
        '<button type="button" class="btn btn--ghost btn--sm" id="dashEditProfile">' +
          esc(t('prof.edit', 'जानकारी बदलें')) + '</button>' +
        '<button type="button" class="btn btn--ghost btn--sm" id="dashChangeLang">' +
          esc(t('btn.changeLang', 'भाषा बदलें')) + '</button>' +
        '<button type="button" class="btn btn--ghost btn--sm dash-logout" id="dashLogout">' +
          esc(t('prof.logout', 'लॉग आउट')) + '</button>' +
      '</div></div>';
  }

  /* ---------- chetavni ki ghanti ---------- */
  /* Anumati apne aap nahi maangte — wo dabav lagta hai aur log ghabrakar
     "Block" dabate hain, jiske baad browser dobara poochta hi nahi. Kisan
     khud yahan se chalu karta hai. */
  function alertRowHtml() {
    if (!window.kmAlerts) return '';
    const st = window.kmAlerts.status();
    const on = st.on && st.permission === 'granted';
    const blocked = st.permission === 'denied';

    return '<div class="dash-prow dash-prow--act"><span>' +
      esc(t('alert.title', 'चेतावनी की घंटी')) +
      '<small>' + esc(blocked
        ? t('alert.blocked', 'ब्राउज़र में बंद है — सेटिंग से चालू करें')
        : t('alert.note', 'ओला, कीट या रोग की चेतावनी पर फ़ोन बजेगा')) + '</small></span>' +
      (blocked ? '' :
        '<button type="button" class="btn btn--ghost btn--sm" id="dashAlerts">' +
        esc(on ? t('alert.test', 'बजाकर देखें') : t('alert.on', 'चालू करें')) +
        '</button>') +
      '</div>';
  }

  /* ---------- kaunsi soochna chahiye ----------
     Ghanti chalu hai to hi ye dikhate hain — warna bematlab hai. Kisan
     samudaay ke jawab band kar sakta hai par vibhag ki chetavni nahi;
     wo 'badlaJaSakta:false' hoti hai, uska switch hum dikhate hi nahi. */
  function notifyRowsHtml() {
    if (!window.kmNotify || !window.kmAlerts) return '';
    const st = window.kmAlerts.status();
    if (!st.on || st.permission !== 'granted') return '';

    const rows = window.kmNotify.status().shreniyan.filter((c) => c.badlaJaSakta);
    if (!rows.length) return '';

    return '<div class="dash-prow dash-prow--sub"><span>' +
      esc(t('notify.pick', 'कौन-सी सूचना चाहिए')) +
      '<small>' + esc(t('notify.note',
        'एक घंटे में ' + window.kmNotify._limits.MAX_PER_HOUR +
        ' से ज़्यादा सूचना नहीं आएगी')) + '</small></span></div>' +
      rows.map((c) =>
        '<div class="dash-prow"><span>' + esc(c.naam) + '</span>' +
        '<button type="button" class="btn btn--ghost btn--sm" ' +
          'data-notif-cat="' + esc(c.id) + '" aria-pressed="' + (c.chaalu ? 'true' : 'false') + '">' +
          esc(c.chaalu ? t('notify.on', 'चालू') : t('notify.off', 'बंद')) +
        '</button></div>').join('');
  }

  /* ---------- poora dashboard ---------- */
  function render() {
    const host = D.el.body;
    if (!host) return;
    const name = (D.user && D.user.name) ? D.user.name.split(' ')[0] : '';

    host.innerHTML = [
      '<p class="dash-hello">', esc(greeting()), name ? ', ' + esc(name) : '', '</p>',
      '<p class="dash-sub">', esc(t('dash.sub', 'आज क्या करना है?')), '</p>',
      tilesHtml(),

      '<section class="dash-sec"><h3>', ico('broadcast', 'ic ic--xs'), ' ',
        esc(t('dash.news', 'कृषि विभाग की सूचना')), '</h3>', newsHtml(), '</section>',

      '<section class="dash-sec"><h3>', ico('globe', 'ic ic--xs'), ' ',
        esc(t('dash.portals', 'सरकारी पोर्टल')), '</h3>', portalsHtml(),
        '<p class="dash-note">', esc(t('dash.portalNote',
          'ये सरकारी वेबसाइटें हैं — इन्हें खोलने के लिए इंटरनेट चाहिए।')), '</p></section>',

      '<section class="dash-sec"><h3>', ico('user', 'ic ic--xs'), ' ',
        esc(t('dash.profile', 'आपकी जानकारी')), '</h3>', profileHtml(), '</section>',
    ].join('');

    /* buttons */
    host.querySelectorAll('[data-view]').forEach((b) =>
      b.addEventListener('click', () => { if (typeof switchView === 'function') switchView(b.dataset.view); }));

    const lang = host.querySelector('#dashChangeLang');
    if (lang) lang.addEventListener('click', () => window.kmLang && window.kmLang.open({ firstRun:false }));

    const edit = host.querySelector('#dashEditProfile');
    if (edit) edit.addEventListener('click', editProfile);

    const al = host.querySelector('#dashAlerts');
    if (al) al.addEventListener('click', async () => {
      const st = window.kmAlerts.status();
      if (st.on && st.permission === 'granted') { window.kmAlerts.test(); return; }
      al.disabled = true;
      await window.kmAlerts.enable();
      render();
    });

    host.querySelectorAll('[data-notif-cat]').forEach((b) =>
      b.addEventListener('click', () => {
        const cat = b.dataset.notifCat;
        const off = b.getAttribute('aria-pressed') === 'true';
        window.kmNotify.setCategory(cat, off ? false : true);
        render();
      }));

    const out = host.querySelector('#dashLogout');
    if (out) out.addEventListener('click', logout);
  }

  /* ---------- jankari badalna (asli API) ---------- */
  function editProfile() {
    const p = D.profile || {};
    const wrap = document.createElement('div');
    wrap.className = 'km-profile-modal';
    wrap.innerHTML = '<section class="km-profile-card" role="dialog" aria-modal="true">' +
      '<h1>' + esc(t('prof.edit', 'जानकारी बदलें')) + '</h1>' +
      '<form id="dash-prof-form">' +
        '<label>' + esc(t('setup.name','पूरा नाम')) + '<input name="name" required value="' +
          esc((D.user && D.user.name) || '') + '"></label>' +
        '<label>' + esc(t('setup.village','गाँव / शहर')) + '<input name="village" required value="' +
          esc(p.village || '') + '"></label>' +
        '<label>' + esc(t('setup.state','राज्य')) + '<input name="state" required value="' +
          esc(p.state || '') + '"></label>' +
        '<label>' + esc(t('setup.pin','PIN कोड')) +
          '<input name="pin" pattern="[0-9]{6}" maxlength="6" inputmode="numeric" required value="' +
          esc(p.pin || '') + '"></label>' +
        '<label>' + esc(t('setup.land','ज़मीन कितनी है')) + '<div class="km-land-row">' +
          '<input name="landAmount" type="number" min="0.01" step="0.01" required value="' +
          esc(p.landAmount || '') + '">' +
          '<select name="landUnit">' +
            ['acre','hectare','bigha','kanal'].map((u) =>
              '<option value="' + u + '"' + (p.landUnit === u ? ' selected' : '') + '>' + u + '</option>').join('') +
          '</select></div></label>' +
        '<p class="km-profile-error" aria-live="polite"></p>' +
        '<button class="km-profile-submit">' + esc(t('prof.save','सेव करें')) + '</button>' +
        '<button type="button" class="km-profile-cancel" id="dashProfCancel">' +
          esc(t('prof.cancel','रद्द करें')) + '</button>' +
      '</form></section>';
    document.body.appendChild(wrap);

    wrap.querySelector('#dashProfCancel').onclick = () => wrap.remove();
    wrap.querySelector('form').onsubmit = async (e) => {
      e.preventDefault();
      const err = wrap.querySelector('.km-profile-error');
      const btn = wrap.querySelector('.km-profile-submit');
      btn.disabled = true; err.textContent = '';
      try {
        const data = Object.fromEntries(new FormData(e.target));
        const r = await fetch('/api/auth?action=profile', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
        const o = await r.json().catch(() => ({}));
        if (!r.ok) { err.textContent = o.error || 'सेव नहीं हुआ।'; btn.disabled = false; return; }
        D.profile = o.profile || data;
        if (D.user) D.user.name = data.name;
        cachePrefs();
        wrap.remove();
        render();
      } catch (_) {
        err.textContent = t('setup.offline','इंटरनेट नहीं है — थोड़ी देर बाद कोशिश करें।');
        btn.disabled = false;
      }
    };
  }

  async function logout() {
    try { await fetch('/api/auth?action=logout', { method:'POST' }); } catch (_) {}
    location.href = '/login';
  }

  /* ---------- data ---------- */
  /* Naam/jagah ko prefs me bhi rakh dete hain, taaki AWAAZ WALA SAHAYAK
     offline rehte hue bhi kisan ko naam se bula sake — wo har baar
     /api/auth?action=session nahi maar sakta. */
  function cachePrefs() {
    try {
      const p = JSON.parse(localStorage.getItem('km.preferences.v1') || '{}');
      if (D.user && D.user.name) p.name = D.user.name;
      if (D.profile) {
        if (D.profile.state)    p.state = D.profile.state;
        if (D.profile.district) p.district = D.profile.district;
        if (D.profile.village)  p.village = D.profile.village;
      }
      localStorage.setItem('km.preferences.v1', JSON.stringify(p));
    } catch (_) { /* private mode — koi baat nahi */ }
  }

  async function loadSession() {
    try {
      const r = await fetch('/api/auth?action=session');
      if (!r.ok) return;
      const d = await r.json();
      D.user = d.user || null;
      D.profile = d.profile || null;
      cachePrefs();
    } catch (_) { /* offline — dashboard phir bhi dikhega */ }
  }

  async function loadNews() {
    try {
      const lang = (window.kmLang && window.kmLang.current) ? window.kmLang.current().code : '';
      const st = appState();
      const url = 'api/advisories?crop=' + encodeURIComponent((st && st.cropId) || 'all') +
                  (lang ? '&lang=' + encodeURIComponent(lang) : '');
      const r = await fetch(url);
      if (!r.ok) return;
      const d = await r.json();
      D.news = (d && d.advisories) || d.rows || [];
      /* Seedhi ghanti nahi — soochna seva se, taaki ek saath 6 na bajein */
      if (window.kmNotify) window.kmNotify.pushMany(D.news, 'broadcast');
      else if (window.kmAlerts) window.kmAlerts.alertMany(D.news);
    } catch (_) { /* offline */ }
  }

  async function refresh() {
    await Promise.all([loadSession(), loadNews()]);
    render();
  }

  function init() {
    D.el.body = $('#dashboardBody');
    if (!D.el.body) return;
    render();                                   // turant kuch dikhe
    refresh();                                  // phir asli data
    window.addEventListener('km:language', render);
    window.addEventListener('km:profile-ready', refresh);
  }

  window.kmDashboard = { refresh, render, PORTALS };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
