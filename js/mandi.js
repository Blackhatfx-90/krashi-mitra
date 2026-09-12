/* ============================================================================
 * VRIDHI AI — MANDI BHAAV (aas-paas ki mandiyon ka rate)
 * js/mandi.js
 *
 * KYA KARTA HAI
 *   1. Kisan ki jagah leta hai (wahi jagah jo mausam ke liye chuni gayi hai)
 *   2. Us rajya ki SAARI mandiyon ka aaj ka bhaav laata hai (data.gov.in)
 *   3. Har mandi ki doori naapta hai, aur radius ke andar wali chhaant leta hai
 *   4. Ek nazar me batata hai: SABSE ZYADA bhaav kahan, SABSE KAM kahan,
 *      aur aapki apni mandi se kitna zyada mil sakta hai
 *
 * KYUN: kisan ko aksar sirf apni hi mandi ka rate pata hota hai. 40 km door
 * wali mandi me ₹300/quintal zyada mil raha ho to use pata hi nahi chalta.
 * Yahi transparency is card ka poora maqsad hai.
 *
 * ZAROORI: is feature ko INTERNET chahiye (sarkari API se data aata hai).
 * Rog pehchan, salah, tour, awaaz — sab pehle jaisa OFFLINE chalta rahega.
 * Yahan koi bhi dikkat aaye to sirf yeh card ek friendly message dikhata hai,
 * baaki app par koi asar nahi padta.
 *
 * TEAM NOTE: yeh file poori tarah alag hai. Isme sab kuch ek IIFE ke andar
 * band hai, isliye app ke kisi variable se takraav nahi hoga.
 * ========================================================================= */

(function () {
  'use strict';

  /* ┌──────────────────────────────────────────────────────────────────────┐
     │  API KEY YAHAN NAHI AATI — aur nahi aani chahiye.                    │
     │                                                                      │
     │  Pehle yahan "apni key paste karein" likha tha. Yeh file har         │
     │  browser me jaati hai (View Source me dikhti hai) aur GitHub par     │
     │  bhi padi rehti hai — yani paste karte hi key sabki ho jaati.        │
     │  Mausam wali key ke saath theek yahi ho chuka tha.                   │
     │                                                                      │
     │  Ab key sirf server par rehti hai:                                   │
     │     Vercel -> Project -> Settings -> Environment Variables           │
     │     DATAGOV_API_KEY = <data.gov.in se mili free key>                 │
     │                                                                      │
     │  Yeh file api/mandi.js se poochti hai.                               │
     └──────────────────────────────────────────────────────────────────────┘ */
  const MANDI_PROXY = 'api/mandi';


  const CFG = {
    /* Agmarknet ka "Variety-wise Daily Market Prices" dataset */
    RESOURCE_ID: '9ef84268-d588-465a-a308-a864a43d0070',
    BASE_URL: 'https://api.data.gov.in/resource/',

    /* Ek baar me kitne record maangein (rajya bhar ka data aa jaaye) */
    ROW_LIMIT: 2000,

    /* Radius ke vikalp (km). Pehla wala default hota hai. */
    RADIUS_CHOICES: [100, 50, 200, 500],

    /* Kitni mandiyon ke coordinates dhoondein. Har ek ek API call hai,
       isliye seema zaroori hai. Ye sab cache ho jaate hain. */
    MAX_GEOCODE: 22,

    /* Bhaav kitni der tak cache rakhein (minute). Mandi ka data din me
       ek hi baar update hota hai, isliye 3 ghante theek hai. */
    CACHE_MINUTES: 180,

    PRICE_CACHE_KEY: 'krashimitra.mandi.v1',
    GEO_CACHE_KEY:   'krashimitra.mandigeo.v1',
    RADIUS_KEY:      'krashimitra.mandiradius',
  };


  /* ==========================================================================
   * 1. FASAL -> Agmarknet ka commodity naam
   *
   * Agmarknet apne hi naam use karta hai (jaise dhaan ko "Paddy(Dhan)(Common)").
   * Har fasal ke liye kai naam likhe hain — jo pehle mile wahi le lete hain.
   *
   * NAYI FASAL jodni ho to bas yahan ek line jod dein.
   * ======================================================================= */
  const COMMODITY = {
    rice:      ['Paddy(Dhan)(Common)', 'Paddy(Dhan)(Basmati)', 'Rice'],
    wheat:     ['Wheat'],
    sugarcane: ['Sugarcane'],
    cotton:    ['Cotton'],
    onion:     ['Onion'],
    maize:     ['Maize'],
    potato:    ['Potato'],
    tomato:    ['Tomato'],
    mango:     ['Mango', 'Mango (Raw-Ripe)'],
    apple:     ['Apple'],
  };


  /* ==========================================================================
   * 2. CHHOTE HELPERS
   * ======================================================================= */

  /* ---------------------------------------------------------------------
   * script.js me `state`, `CROPS`, `WEATHER_API_KEY` sab `const` hain.
   * Classic script me `const`/`let` window par NAHI aate (sirf `function`
   * aur `var` aate hain) — isliye window.state likhne se undefined milta hai.
   * Lekin dono file ek hi global scope share karti hain, isliye seedha naam
   * likhne par mil jaata hai. `typeof` guard isliye hai taaki script.js load
   * na ho paye tab bhi yeh file crash na kare.
   * (Yahi tarika js/voice-assistant.js me bhi use hua hai.)
   * ------------------------------------------------------------------- */
  const appState = () => (typeof state !== 'undefined') ? state : null;
  const appCrops = () => (typeof CROPS !== 'undefined') ? CROPS : {};
  const appWeatherKey = () => (typeof WEATHER_API_KEY !== 'undefined' && WEATHER_API_KEY) ? WEATHER_API_KEY : '520c40d9ec23d08f1445a7bd44b14f06';

  /** App ke apne helper — agar kisi wajah se na milein to app tootni nahi chahiye. */
  const esc  = (t) => (typeof escapeHtml === 'function' ? escapeHtml(t) : String(t == null ? '' : t));
  const ico  = (n, c) => (typeof icon === 'function' ? icon(n, c) : '');
  const $    = (sel) => document.querySelector(sel);

  /** Do jagahon ke beech ki seedhi doori (km) — Haversine formula. */
  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;                                  // dharti ki trijya (km)
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * data.gov.in kabhi 'state' bhejta hai, kabhi 'State', kabhi 'state.keyword'.
   * Isliye har record ki chaabiyan chhote akshar me karke dhoondte hain —
   * warna API me zara sa badlav aate hi card khali ho jaata.
   */
  function pick(row, names) {
    const flat = {};
    Object.keys(row).forEach((k) => {
      flat[k.toLowerCase().replace(/[^a-z]/g, '')] = row[k];
    });
    for (const n of names) {
      const v = flat[n];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  }

  /** "1850" -> "₹1,850" */
  function rupee(n) {
    const v = Math.round(Number(n) || 0);
    return '₹' + v.toLocaleString('en-IN');
  }

  /** "05/09/2026" ya "2026-09-05" -> "5 Sep 2026" */
  function niceDate(raw) {
    if (!raw) return '';
    let d;
    const m = String(raw).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);   // dd/mm/yyyy
    d = m ? new Date(+m[3], +m[2] - 1, +m[1]) : new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function readJSON(key) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
    catch (_) { return null; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  /* Key ab server par hai, isliye yahan se pehle se pata nahi chal sakta.
     Server 503 'not_configured' bhejta hai — wahi yaad rakh lete hain. */
  let notConfigured = false;
  function keyMissing() { return notConfigured; }


  /* ==========================================================================
   * 3. STATE
   * ======================================================================= */
  const M = {
    busy: false,
    radius: Number(localStorage.getItem(CFG.RADIUS_KEY)) || CFG.RADIUS_CHOICES[0],
    last: null,        // { cropId, place, rows, best, worst, mine, date, radius }
    el: {},
  };


  /* ==========================================================================
   * 4. JAGAH — wahi jagah jo mausam feature use karta hai
   * ======================================================================= */
  async function whereAmI() {
    // Kisan ne khud koi gaon/PIN chuna ho to wahi sabse pehle
    const manual = (typeof readManualPlace === 'function') ? readManualPlace() : null;
    if (manual) return { lat: manual.lat, lon: manual.lon, label: manual.label, manual: true };

    if (typeof getPosition !== 'function') throw new Error('GEO_UNSUPPORTED');
    const pos = await getPosition();                 // GPS (wahi function jo mausam use karta hai)
    return { lat: pos.lat, lon: pos.lon, label: '', manual: false };
  }

  /** lat/lon -> { name, state } (OpenWeather ka reverse geocoding, wahi key). */
  async function whichState(lat, lon) {
    const key = appWeatherKey();
    if (!key || key === 'PASTE_KEY_HERE') throw new Error('NO_WEATHER_KEY');

    const url = 'https://api.openweathermap.org/geo/1.0/reverse?lat=' + lat +
                '&lon=' + lon + '&limit=1&appid=' + key;
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const arr = await res.json();
    const hit = Array.isArray(arr) ? arr[0] : null;
    if (!hit) throw new Error('STATE_NOT_FOUND');
    return { name: hit.name || '', state: hit.state || '' };
  }


  /* ==========================================================================
   * 5. MANDI KE COORDINATES (cache ke saath)
   *
   * data.gov.in mandi ka lat/lon nahi deta — sirf naam deta hai. Doori naapne
   * ke liye hum har mandi ka naam ek baar geocode karke localStorage me sada
   * ke liye rakh lete hain. Agli baar koi API call nahi lagti.
   * ======================================================================= */
  async function marketCoords(market, district, stateName) {
    const cache = readJSON(CFG.GEO_CACHE_KEY) || {};
    const ck = (market + '|' + district).toLowerCase();

    if (cache[ck]) return cache[ck];                 // pehle se pata hai
    if (cache[ck] === null) return null;             // pehle bhi nahi mila tha

    const key = appWeatherKey();
    const tries = [
      market + ',' + district + ',' + stateName + ',IN',
      market + ',' + stateName + ',IN',
      district + ',' + stateName + ',IN',            // aakhri sahara: jila
    ];

    for (const q of tries) {
      try {
        const url = 'https://api.openweathermap.org/geo/1.0/direct?q=' +
                    encodeURIComponent(q) + '&limit=1&appid=' + key;
        const res = await fetch(url);
        if (!res.ok) continue;
        const arr = await res.json();
        const hit = Array.isArray(arr) ? arr[0] : null;
        if (hit && typeof hit.lat === 'number') {
          const c = { lat: hit.lat, lon: hit.lon };
          cache[ck] = c; writeJSON(CFG.GEO_CACHE_KEY, cache);
          return c;
        }
      } catch (_) { /* agli koshish */ }
    }

    cache[ck] = null; writeJSON(CFG.GEO_CACHE_KEY, cache);   // dobara na dhoondein
    return null;
  }


  /* ==========================================================================
   * 6. data.gov.in se bhaav laana
   * ======================================================================= */
  async function fetchPrices(stateName, cropId) {
    const names = COMMODITY[cropId] || [];
    if (!names.length) throw new Error('CROP_NOT_MAPPED');

    for (const commodity of names) {
      const url = MANDI_PROXY +
        '?state=' + encodeURIComponent(stateName) +
        '&commodity=' + encodeURIComponent(commodity) +
        '&limit=' + CFG.ROW_LIMIT;

      const res = await fetch(url);
      if (res.status === 503) { notConfigured = true; throw new Error('BAD_KEY'); }
      if (res.status === 401 || res.status === 403) throw new Error('BAD_KEY');
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const data = await res.json();
      const recs = data.records || [];
      if (recs.length) return { commodity: commodity, records: recs };
    }
    return { commodity: names[0], records: [] };     // is rajya me aaj data nahi
  }

  /** Kacche records ko saaf, ek-jaisi list me badalta hai. */
  function normalize(records) {
    const out = [];
    records.forEach((r) => {
      const modal = Number(pick(r, ['modalprice', 'modalpricers', 'modal']));
      if (!modal || modal <= 0) return;              // bina bhaav wali line chhod do

      out.push({
        market:   pick(r, ['market']),
        district: pick(r, ['district']),
        variety:  pick(r, ['variety']),
        min:      Number(pick(r, ['minprice', 'min'])) || 0,
        max:      Number(pick(r, ['maxprice', 'max'])) || 0,
        modal:    modal,
        date:     pick(r, ['arrivaldate', 'date']),
      });
    });

    // Ek hi mandi ki kai varieties aa sakti hain — sabse mehnga wala rakhte hain
    const best = {};
    out.forEach((r) => {
      const k = (r.market + '|' + r.district).toLowerCase();
      if (!best[k] || r.modal > best[k].modal) best[k] = r;
    });
    return Object.values(best);
  }


  /* ==========================================================================
   * 7. MUKHYA KAAM — sab jodkar list banao
   * ======================================================================= */
  async function load(opts) {
    const o = opts || {};
    if (M.busy) return;

    const st = appState();
    const cropId = st && st.cropId;
    if (!cropId) { renderMsg('pehle fasal chunein'); return; }

    if (keyMissing()) {
      /* Yeh sandesh KISAN padhta hai — usse code ki baat karna bematlab
         hai. Pehle yahan "js/mandi.js me key paste karein" likha tha.
         Lagane wale ke liye asli hidayat console me jaati hai. */
      console.warn('[mandi] Server par DATAGOV_API_KEY set nahi hai. ' +
                   'Vercel > Project > Settings > Environment Variables me daalein.');
      renderMsg('key', {
        hi: 'मंडी भाव की सुविधा अभी चालू नहीं है। बाकी ऐप — रोग पहचान, ' +
            'सलाह और मौसम — पहले की तरह चलती रहेगी।',
        en: 'Mandi prices are not switched on yet. The rest of the app keeps working.',
        icon: 'key', retry: false,
      });
      return;
    }

    /* Cache — 3 ghante purana data chalega, mandi ka rate din me ek baar badalta hai */
    const cached = readJSON(CFG.PRICE_CACHE_KEY);
    if (!o.force && cached && cached.cropId === cropId &&
        (Date.now() - cached.at) < CFG.CACHE_MINUTES * 60000) {
      M.last = cached.data;
      render();
      return;
    }

    if (navigator.onLine === false) {
      if (cached && cached.cropId === cropId) {
        M.last = cached.data; M.last.stale = true; render(); return;
      }
      renderMsg('offline', {
        hi: 'मंडी भाव के लिए इंटरनेट चाहिए। बाकी ऐप (रोग पहचान, सलाह) बिना इंटरनेट के चलता रहेगा।',
        en: 'Mandi prices need an internet connection. The rest of the app keeps working offline.',
        icon: 'wifi-off',
      });
      return;
    }

    M.busy = true;
    renderLoading('आपके आस-पास की मंडियों का भाव लाया जा रहा है…');

    try {
      const place = await whereAmI();
      const geo   = await whichState(place.lat, place.lon);
      if (!geo.state) throw new Error('STATE_NOT_FOUND');

      renderLoading('“' + geo.state + '” की मंडियों का भाव आ रहा है…');
      const { commodity, records } = await fetchPrices(geo.state, cropId);
      let rows = normalize(records);

      if (!rows.length) {
        M.busy = false;
        renderMsg('nodata', {
          hi: 'आज ' + geo.state + ' में इस फसल का कोई मंडी भाव दर्ज नहीं हुआ। ' +
              'मंडी का डेटा रोज़ सुबह अपडेट होता है — कल दोबारा देखें।',
          en: 'No mandi price was reported for this crop in ' + geo.state + ' today. Data updates every morning.',
          icon: 'info',
        });
        return;
      }

      /* Doori naapo — sabse mehnge bhaav walon ko pehle geocode karte hain,
         kyunki wahi kisan ke kaam ke hain aur API calls bachti hain. */
      rows.sort((a, b) => b.modal - a.modal);
      const head = rows.slice(0, CFG.MAX_GEOCODE);

      renderLoading('मंडियों की दूरी नापी जा रही है…');
      for (const r of head) {
        const c = await marketCoords(r.market, r.district, geo.state);
        if (c) r.km = Math.round(distanceKm(place.lat, place.lon, c.lat, c.lon));
      }

      const withKm = head.filter((r) => typeof r.km === 'number');

      M.last = {
        cropId: cropId,
        commodity: commodity,
        stateName: geo.state,
        placeName: place.label || geo.name || '',
        all: head,
        withKm: withKm,
        date: (rows[0] && rows[0].date) || '',
        stale: false,
      };
      writeJSON(CFG.PRICE_CACHE_KEY, { cropId: cropId, at: Date.now(), data: M.last });
      render();

    } catch (err) {
      console.warn('[mandi]', err.message);
      const cachedAny = readJSON(CFG.PRICE_CACHE_KEY);
      if (cachedAny && cachedAny.cropId === cropId) {
        M.last = cachedAny.data; M.last.stale = true; render();
      } else {
        renderMsg('fail', msgFor(err.message));
      }
    } finally {
      M.busy = false;
    }
  }

  /** Har error ke liye ek seedha-sada sandesh. */
  function msgFor(code) {
    switch (code) {
      case 'GEO_DENIED':
        return { hi: 'लोकेशन की अनुमति नहीं मिली। ऊपर मौसम वाले कार्ड में अपना गाँव/शहर या PIN कोड ' +
                     'लिख दीजिए — मंडी भाव भी वहीं का दिखेगा।',
                 en: 'Location permission denied. Set your village/PIN in the weather card above.', icon: 'pin' };
      case 'GEO_UNSUPPORTED':
      case 'GEO_FAILED':
        return { hi: 'लोकेशन नहीं मिल पाई। ऊपर मौसम वाले कार्ड में अपना गाँव/शहर या PIN कोड लिख दीजिए।',
                 en: 'Could not get your location. Set your village/PIN in the weather card above.', icon: 'pin' };
      case 'NO_WEATHER_KEY':
        return { hi: 'जगह पहचानने के लिए मौसम वाली API key चाहिए (js/script.js में WEATHER_API_KEY)।',
                 en: 'The weather API key is needed to resolve your location.', icon: 'key' };
      case 'BAD_KEY':
        return { hi: 'data.gov.in की API key गलत है या अभी चालू नहीं हुई।',
                 en: 'The data.gov.in API key is wrong or not active yet.', icon: 'key' };
      case 'CROP_NOT_MAPPED':
        return { hi: 'इस फसल के लिए मंडी भाव की सूची अभी नहीं जुड़ी है (js/mandi.js का COMMODITY देखें)।',
                 en: 'This crop is not mapped to a mandi commodity yet.', icon: 'info' };
      default:
        return { hi: 'मंडी भाव नहीं मिल पाया (इंटरनेट या सरकारी सर्वर की दिक्कत)। थोड़ी देर बाद कोशिश करें।',
                 en: 'Could not fetch mandi prices (internet or government server problem).', icon: 'alert' };
    }
  }


  /* ==========================================================================
   * 8. DIKHANA
   * ======================================================================= */

  function renderLoading(text) {
    if (!M.el.body) return;
    M.el.body.innerHTML =
      '<div class="mandi-msg"><span class="spinner spinner--sm"></span><p>' + esc(text) + '</p></div>';
    if (M.el.speak) M.el.speak.disabled = true;
  }

  function renderMsg(kind, m) {
    if (!M.el.body) return;
    if (kind === 'pehle fasal chunein') {
      m = { hi: 'पहले अपनी फसल चुनें — फिर उसी फसल का मंडी भाव यहाँ दिखेगा।',
            en: 'Choose your crop first to see its mandi price.', icon: 'sprout', retry: false };
    }
    M.el.body.innerHTML = [
      '<div class="mandi-msg">',
        '<span class="mandi-msg__ic">', ico(m.icon || 'info'), '</span>',
        '<p>', esc(m.hi), '</p>',
        m.en ? '<p class="mandi-msg__en">' + esc(m.en) + '</p>' : '',
        (m.retry === false ? '' :
          '<button type="button" class="btn btn--ghost btn--sm" id="mandiRetry">' +
          'दोबारा कोशिश करें / Retry</button>'),
      '</div>',
    ].join('');
    const r = $('#mandiRetry');
    if (r) r.addEventListener('click', () => load({ force: true }));
    if (M.el.speak) M.el.speak.disabled = true;
  }

  function render() {
    const d = M.last;
    if (!d || !M.el.body) return;

    /* Radius ke andar wali mandi. Agar ek bhi na ho to radius ki rok hata dete
       hain — kuch na dikhane se behtar hai ki door wali hi dikha dein. */
    let list = d.withKm.filter((r) => r.km <= M.radius);
    let widened = false;
    if (!list.length && d.withKm.length) { list = d.withKm.slice(); widened = true; }
    if (!list.length) list = d.all.slice();          // doori bilkul na mili ho

    list.sort((a, b) => b.modal - a.modal);
    const best  = list[0];
    const worst = list[list.length - 1];

    /* "Aapki apni mandi" = sabse paas wali */
    const nearest = list.filter((r) => typeof r.km === 'number')
                        .sort((a, b) => a.km - b.km)[0] || null;

    const gain = (nearest && best && best.modal > nearest.modal)
      ? best.modal - nearest.modal : 0;

    const crops = appCrops();
    const cropName = crops[d.cropId] ? crops[d.cropId].nameHi : d.cropId;

    /* ---- radius chips ---- */
    const chips = CFG.RADIUS_CHOICES.map((km) =>
      '<button type="button" class="mandi-chip' + (km === M.radius ? ' is-on' : '') +
      '" data-km="' + km + '">' + km + ' km</button>'
    ).join('');

    /* ---- ek mandi ki line ---- */
    const rowHtml = (r, cls, tag) => [
      '<li class="mandi-row', (cls ? ' ' + cls : ''), '">',
        '<div class="mandi-row__main">',
          '<p class="mandi-row__name">', esc(r.market),
            (tag ? '<span class="mandi-tag">' + esc(tag) + '</span>' : ''), '</p>',
          '<p class="mandi-row__sub">', esc(r.district),
            (typeof r.km === 'number' ? ' · ' + r.km + ' km' : ''),
            (r.variety ? ' · ' + esc(r.variety) : ''), '</p>',
        '</div>',
        '<div class="mandi-row__price">',
          '<b>', rupee(r.modal), '</b>',
          '<small>', rupee(r.min), '–', rupee(r.max), '</small>',
        '</div>',
      '</li>',
    ].join('');

    M.el.body.innerHTML = [
      /* ---- sabse upar: sabse achha bhaav ---- */
      '<div class="mandi-best">',
        '<p class="mandi-best__label">', ico('bolt', 'ic ic--xs'),
          ' सबसे अच्छा भाव / Best price</p>',
        '<p class="mandi-best__price">', rupee(best.modal),
          '<span> प्रति क्विंटल</span></p>',
        '<p class="mandi-best__where">', esc(best.market), ' · ', esc(best.district),
          (typeof best.km === 'number' ? ' · ' + best.km + ' km दूर' : ''), '</p>',
        gain > 0
          ? '<p class="mandi-best__gain">' + ico('check', 'ic ic--xs') +
            ' आपकी पास वाली मंडी (' + esc(nearest.market) + ') से <b>' + rupee(gain) +
            ' प्रति क्विंटल ज़्यादा</b></p>'
          : '<p class="mandi-best__gain mandi-best__gain--flat">' +
            'आपकी पास वाली मंडी में भी लगभग यही भाव चल रहा है।</p>',
      '</div>',

      widened
        ? '<p class="mandi-note">' + ico('info', 'ic ic--xs') + ' ' + M.radius +
          ' km के अंदर कोई मंडी नहीं मिली, इसलिए ' + esc(d.stateName) +
          ' की नज़दीकी मंडियाँ दिखा रहे हैं।</p>'
        : '',

      d.stale
        ? '<p class="mandi-note">' + ico('wifi-off', 'ic ic--xs') +
          ' इंटरनेट नहीं है — पिछली बार का सहेजा हुआ भाव दिखा रहे हैं।</p>'
        : '',

      /* ---- radius chunav ---- */
      '<div class="mandi-radius">',
        '<span>कितनी दूर तक देखें?</span>',
        '<div class="mandi-chips">', chips, '</div>',
      '</div>',

      /* ---- poori list ---- */
      '<ul class="mandi-list">',
        list.map((r, i) =>
          rowHtml(r,
            i === 0 ? 'mandi-row--best' : (r === worst && list.length > 1 ? 'mandi-row--worst' : ''),
            i === 0 ? 'सबसे ज़्यादा' : (r === worst && list.length > 1 ? 'सबसे कम' : ''))
        ).join(''),
      '</ul>',

      /* ---- neeche: bharosa ---- */
      '<p class="mandi-foot">',
        esc(cropName), ' · ', esc(d.commodity), ' · भाव की तारीख़: ',
        esc(niceDate(d.date) || '—'),
        '<br />स्रोत: Agmarknet / data.gov.in · दाम प्रति क्विंटल · ',
        'मंडी का डेटा रोज़ सुबह अपडेट होता है।',
      '</p>',
    ].join('');

    /* radius chips wire karo */
    M.el.body.querySelectorAll('.mandi-chip').forEach((b) => {
      b.addEventListener('click', () => {
        M.radius = Number(b.dataset.km);
        localStorage.setItem(CFG.RADIUS_KEY, String(M.radius));
        render();                                    // dobara API call nahi — sirf chhaanto
      });
    });

    if (M.el.speak) M.el.speak.disabled = false;
    M.el.spoken = buildSpeech(cropName, best, worst, nearest, gain, d);
  }

  /** Awaaz ke liye saaf Hindi. */
  function buildSpeech(cropName, best, worst, nearest, gain, d) {
    let t = cropName + ' का आज का मंडी भाव। ';
    t += 'सबसे अच्छा भाव ' + best.market + ' मंडी में है, ' +
         Math.round(best.modal) + ' रुपये प्रति क्विंटल';
    if (typeof best.km === 'number') t += ', जो आपसे लगभग ' + best.km + ' किलोमीटर दूर है';
    t += '। ';
    if (gain > 0 && nearest) {
      t += 'आपकी पास वाली ' + nearest.market + ' मंडी से यह ' + Math.round(gain) +
           ' रुपये प्रति क्विंटल ज़्यादा है। ' +
           'अगर आप दस क्विंटल बेचते हैं तो लगभग ' + (Math.round(gain) * 10) +
           ' रुपये का फ़ायदा हो सकता है। ले जाने का ख़र्च ज़रूर जोड़ लीजिए। ';
    } else {
      t += 'आपकी पास वाली मंडी में भी लगभग यही भाव चल रहा है। ';
    }
    if (worst && worst !== best) {
      t += 'सबसे कम भाव ' + worst.market + ' में है, ' + Math.round(worst.modal) +
           ' रुपये प्रति क्विंटल। वहाँ बेचने से बचिए। ';
    }
    t += 'यह भाव ' + (niceDate(d.date) || 'आज') + ' का है, स्रोत सरकारी एगमार्कनेट है।';
    return t;
  }


  /* ==========================================================================
   * 9. SHURUAAT — card ko page se jodna
   * ======================================================================= */
  function init() {
    M.el.card  = $('#mandiCard');
    M.el.body  = $('#mandiBody');
    M.el.speak = $('#mandiSpeakBtn');
    M.el.refresh = $('#mandiRefreshBtn');
    if (!M.el.card || !M.el.body) return;             // card page par hai hi nahi

    if (M.el.refresh) {
      M.el.refresh.addEventListener('click', () => load({ force: true }));
    }

    if (M.el.speak) {
      M.el.speak.disabled = true;
      M.el.speak.addEventListener('click', () => {
        if (typeof speakText !== 'function' || !M.el.spoken) return;
        if (M.el.speak.dataset.speaking === 'true') {
          if (typeof stopSpeaking === 'function') stopSpeaking();
          return;
        }
        speakText(M.el.spoken, M.el.speak, M.el.card);
      });
    }

    // Internet wapas aane par apne aap dobara koshish
    window.addEventListener('online', () => { if (!M.last) load({ force: true }); });

    renderMsg('pehle fasal chunein');
  }

  /* Bahar se bulane ke liye — script.js ka selectCrop() ise call karta hai */
  window.kmMandi = {
    load: load,
    refresh: () => load({ force: true }),
    init: init,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
