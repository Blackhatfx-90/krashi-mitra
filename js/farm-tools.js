/* ============================================================================
 * KRASHI MITRA — KHETI SAHAYAK (khaad calculator + kheti ki salah + visheshagya)
 * js/farm-tools.js
 *
 * TEEN CHEEZEIN, TEENON POORI TARAH OFFLINE:
 *   1. KHAAD CALCULATOR — fasal + zameen ka naap -> kitni bori Urea/DAP/MOP
 *   2. KHETI KI SALAH    — fasal ki har avastha par kya karna hai
 *   3. VISHESHAGYA       — kis se baat karein aur kitna kharcha
 *
 * KYUN OFFLINE: server par bhi (api/agriculture.js) yahi hisaab hai, par
 * usse internet chahiye. Kisan khet me khada hokar khaad ka hisaab lagata
 * hai — wahan network nahi hota. Isliye poora ganit yahin, phone me.
 * Aankde server wale se BILKUL milte hain (wahi TARGETS), taaki do jagah
 * do alag jawab na aayen.
 *
 * TEAM NOTE: file poori tarah alag hai, sab "ft-" prefix ke saath.
 * ========================================================================= */

(function () {
  'use strict';

  /* Kisan ne khud avastha dabayi hai ya nahi. Dabayi ho to calendar use
     nahi badalta — warna uska chuna hua button apne aap wapas kood jata. */
  let stagePicked = false;

  /* setSowing ki wajah Hindi me — kisan ko English reason nahi dikhani */
  function sowErrHi(reason) {
    if (/aane wali/.test(reason)) return 'आगे की तारीख़ नहीं चलेगी — बुवाई हो चुकी तारीख़ लिखें।';
    if (/purani/.test(reason))    return 'तारीख़ बहुत पुरानी है — साल देख लें।';
    if (/ped par/.test(reason))   return 'पेड़ में बुवाई की तारीख़ नहीं चलती।';
    return 'तारीख़ ठीक नहीं लगी — फिर लिखें।';
  }

  /* ---------------------------------------------------------------------
   * 1. POSHAK TATVA KI ZAROORAT (kg prati acre)
   *    Ye wahi aankde hain jo lib/fertilizer.js (server) me hain.
   *    Badalna ho to DONO jagah badlein.
   * ------------------------------------------------------------------- */
  const TARGETS = {
    rice:{n:120,p:60,k:40}, wheat:{n:120,p:60,k:40}, maize:{n:120,p:60,k:40},
    cotton:{n:100,p:50,k:50}, sugarcane:{n:250,p:115,k:115},
    tomato:{n:150,p:80,k:120}, potato:{n:180,p:80,k:120}, onion:{n:100,p:50,k:50},
    mango:{n:50,p:25,k:50}, apple:{n:80,p:40,k:80},
  };

  /* Zameen ke naap -> acre */
  const UNITS = {
    acre:    { hi:'एकड़',     toAcre: 1 },
    hectare: { hi:'हेक्टेयर', toAcre: 2.47105 },
    bigha:   { hi:'बीघा',     toAcre: 0.625 },
    kanal:   { hi:'कनाल',     toAcre: 0.125 },
  };

  /* Bazaar me milne wali khaad me kitna poshak tatva hota hai */
  const SOURCES = {
    urea: { hi:'यूरिया',  n:0.46, p:0,    k:0    },
    dap:  { hi:'डी.ए.पी.', n:0.18, p:0.46, k:0    },
    mop:  { hi:'म्यूरेट ऑफ़ पोटाश (MOP)', n:0, p:0, k:0.60 },
  };
  const BAG_KG = 50;                       // ek bori = 50 kg

  /* ---------------------------------------------------------------------
   * 2. KHETI KI SALAH — har fasal, har avastha
   *    (server wali data/cultivation-tips.json sirf English aur 5 fasal thi;
   *     yahan 10 fasal, Hindi + English dono)
   * ------------------------------------------------------------------- */
  const STAGES = [
    { id:'sowing',     hi:'बुवाई',        en:'Sowing' },
    { id:'vegetative', hi:'बढ़वार',        en:'Vegetative' },
    { id:'flowering',  hi:'फूल व बाली',   en:'Flowering' },
    { id:'harvest',    hi:'कटाई',         en:'Harvest' },
  ];

  const TIPS = {
    rice: {
      sowing:['प्रमाणित बीज लें और बीज उपचार करके ही बोएँ','नर्सरी का पानी साफ रखें'],
      vegetative:['पहले 30–40 दिन खेत खरपतवार मुक्त रखें','यूरिया 3 भागों में बाँटकर दें'],
      flowering:['तना छेदक और झोंका के लिए हफ्ते में दो बार देखें','बाली निकलते समय पानी न सूखने दें'],
      harvest:['जब 80% दाने सख्त हो जाएँ तब काटें','काटने से 10 दिन पहले पानी बंद कर दें'],
    },
    wheat: {
      sowing:['नवंबर के पहले पखवाड़े तक बुवाई कर लें','बीज उपचार से कंडुआ रुकता है'],
      vegetative:['पहली सिंचाई बुवाई के 21 दिन बाद (CRI) — यह सबसे ज़रूरी है','खरपतवार 30–35 दिन में निकाल दें'],
      flowering:['जनवरी-फरवरी में रतुआ के लिए रोज़ निगरानी','बाली आते समय पानी न चूकें'],
      harvest:['दाना सख्त और भूसा पीला होने पर काटें','ओस सूखने के बाद ही कटाई करें'],
    },
    sugarcane: {
      sowing:['स्वस्थ खेत से ही बीज गन्ना लें','सेट उपचार करके बोएँ — लाल सड़न रुकता है'],
      vegetative:['मिट्टी चढ़ाएँ ताकि गन्ना गिरे नहीं','जल निकास ठीक रखें'],
      flowering:['सूखी निचली पत्तियाँ हटाते रहें','तना छेदक की निगरानी'],
      harvest:['पकने पर ही काटें, जल्दबाज़ी में नहीं','कटाई के 24 घंटे में मिल पहुँचाएँ'],
    },
    cotton: {
      sowing:['बीज उपचार ज़रूरी','कतार की दूरी सही रखें'],
      vegetative:['गुलाबी सुंडी के लिए फेरोमोन ट्रैप लगाएँ','ज़्यादा यूरिया न दें'],
      flowering:['प्रभावित टिंडे तोड़कर नष्ट करें','हफ्ते में एक बार खेत घूमें'],
      harvest:['सूखे मौसम में चुनाई करें','साफ जगह पर रखें ताकि दाग न लगे'],
    },
    onion: {
      sowing:['नर्सरी ऊँची क्यारी पर बनाएँ','रोपाई से पहले जड़ उपचार'],
      vegetative:['खरपतवार जल्दी निकालें','पानी बहुत ज़्यादा न दें'],
      flowering:['थ्रिप्स के लिए नीली चिपचिपी ट्रैप','बैंगनी धब्बा दिखे तो तुरंत जाँचें'],
      harvest:['50% गर्दन झुक जाने पर खोदें','छाँव में 3 दिन सुखाएँ, धूप में नहीं'],
    },
    maize: {
      sowing:['बीज उपचार करके बोएँ','कतार में बुवाई करें'],
      vegetative:['फॉल आर्मीवर्म के लिए पत्तों की गोल में देखें','यूरिया बाँटकर दें'],
      flowering:['भुट्टा बनते समय पानी ज़रूरी','तना छेदक की निगरानी'],
      harvest:['भुट्टे के छिलके सूखने पर तोड़ें','नमी 15% से कम करके भंडारण'],
    },
    potato: {
      sowing:['अंकुरित, रोग-मुक्त बीज कंद लें','मिट्टी भुरभुरी होनी चाहिए'],
      vegetative:['मिट्टी चढ़ाना (earthing) ज़रूरी','पछेती झुलसा के लिए मौसम पर नज़र'],
      flowering:['बादल-कोहरे में झुलसा तेज़ी से फैलता है','ज़रूरत पर ही छिड़काव'],
      harvest:['खोदने से 10 दिन पहले पानी बंद','छिलका सख्त होने पर ही खोदें'],
    },
    tomato: {
      sowing:['नर्सरी में जड़ गलन से बचाव','रोपाई शाम को करें'],
      vegetative:['सहारा (staking) दें','सफेद मक्खी के लिए पीली ट्रैप'],
      flowering:['फल छेदक की निगरानी','कैल्शियम की कमी से फल फटते हैं'],
      harvest:['हल्का लाल होने पर तोड़ें','सुबह की तुड़ाई सबसे अच्छी'],
    },
    mango: {
      sowing:['नई कलम रोग-मुक्त पेड़ से लें','गड्ढे में गोबर खाद मिलाएँ'],
      vegetative:['छँटाई के औज़ार हर पेड़ के बाद साफ करें','थाला बनाकर खाद दें'],
      flowering:['भुनगा (hopper) के लिए निगरानी','फूल आते समय सिंचाई न करें'],
      harvest:['टपका गिरने से पहले तोड़ें','डंठल के साथ तोड़ें ताकि रस न बहे'],
    },
    apple: {
      sowing:['रोग-मुक्त पौधा नर्सरी से लें','गड्ढा पहले से तैयार रखें'],
      vegetative:['छँटाई सर्दियों में करें','स्कैब के लिए मौसम पर नज़र'],
      flowering:['परागण के लिए मधुमक्खी ज़रूरी','फूल पर कीटनाशक न छिड़कें'],
      harvest:['रंग और डंठल ढीला होने पर तोड़ें','ठंडी जगह पर रखें'],
    },
  };

  /* ---------------------------------------------------------------------
   * 3. VISHESHAGYA — abhi ye seed data hai (asli directory aane tak).
   *    Sarkari numbers asli hain aur MUFT hain.
   * ------------------------------------------------------------------- */
  const EXPERTS = [
    { hi:'किसान कॉल सेंटर (सरकारी)', en:'Kisan Call Centre', fee:'नि:शुल्क',
      note:'सुबह 6 से रात 10 बजे, 22 भाषाओं में', tel:'18001801551', official:true },
    { hi:'कृषि विज्ञान केंद्र (KVK)', en:'Krishi Vigyan Kendra', fee:'नि:शुल्क',
      note:'अपने ज़िले का KVK — मिट्टी जाँच और दवा की पुष्टि', tel:'', official:true },
    { hi:'पौध संरक्षण विशेषज्ञ', en:'Plant Protection Expert', fee:'₹200 – ₹500',
      note:'रोग-कीट की पक्की पहचान और दवा की मात्रा', tel:'', official:false },
    { hi:'मृदा वैज्ञानिक', en:'Soil Scientist', fee:'₹300 – ₹700',
      note:'मिट्टी जाँच रिपोर्ट पढ़वाने और खाद तय करने के लिए', tel:'', official:false },
    { hi:'बागवानी विशेषज्ञ', en:'Horticulture Expert', fee:'₹300 – ₹800',
      note:'आम, सेब, टमाटर, प्याज जैसी फसलों के लिए', tel:'', official:false },
  ];

  /* ==================================================================== */
  const esc = (t) => (typeof escapeHtml === 'function' ? escapeHtml(t) : String(t == null ? '' : t));
  const ico = (n, c) => (typeof icon === 'function' ? icon(n, c) : '');
  const $   = (s) => document.querySelector(s);
  const appState = () => (typeof state !== 'undefined') ? state : null;
  const appCrops = () => (typeof CROPS !== 'undefined') ? CROPS : {};

  /**
   * KHAAD KA HISAAB.
   * Pehle DAP se phosphorus poora karte hain (usme thoda nitrogen bhi aata
   * hai), phir bachi hui nitrogen Urea se, aur potash MOP se. Yahi tarika
   * krishi vibhag bhi batata hai.
   */
  function calcFertilizer(cropId, size, unit) {
    const t = TARGETS[cropId] || TARGETS.rice;
    const u = UNITS[unit] || UNITS.acre;
    const acres = Number(size) * u.toAcre;
    if (!isFinite(acres) || acres <= 0) return null;

    const needN = t.n * acres, needP = t.p * acres, needK = t.k * acres;

    const dap = needP / SOURCES.dap.p;                 // phosphorus DAP se
    const nFromDap = dap * SOURCES.dap.n;              // DAP me nitrogen bhi hai
    const urea = Math.max(0, needN - nFromDap) / SOURCES.urea.n;
    const mop = needK / SOURCES.mop.k;

    const bags = (kg) => Math.round((kg / BAG_KG) * 10) / 10;
    return {
      acres: Math.round(acres * 100) / 100,
      need: { n: Math.round(needN), p: Math.round(needP), k: Math.round(needK) },
      urea: { kg: Math.round(urea), bags: bags(urea) },
      dap:  { kg: Math.round(dap),  bags: bags(dap)  },
      mop:  { kg: Math.round(mop),  bags: bags(mop)  },
    };
  }

  /* ---------------------------------------------------------------------
   * DIKHANA
   * ------------------------------------------------------------------- */
  const el = {};

  /* ---------------------------------------------------------------------
   * FASAL KA CALENDAR (js/calendar.js se)
   *
   * Pehle kisan khud avastha chunta tha. Ab buvai ki tareekh bharne par
   * avastha khud nikalti hai aur agla kaam apni tareekh ke saath dikhta hai.
   * Tareekh na bhari ho to sirf poochte hain — baki salah phir bhi chalti
   * rehti hai, kuch band nahi hota.
   * ------------------------------------------------------------------- */
  function calendarHtml(cropId) {
    if (!window.kmCalendar) return '';
    const p = window.kmCalendar.plan(cropId);
    if (!p) return '';

    /* Ped — buvai ki tareekh ka sawal hi nahi */
    if (p.perennial) {
      return '<div class="ft-block ft-cal">' +
        '<h3>' + ico('sprout', 'ic ic--xs') + ' साल भर के काम</h3>' +
        '<p class="ft-cal-note">' + esc(p.hi + ' पेड़ है — इसमें बुवाई की तारीख़ नहीं चलती, ' +
          'महीने से काम तय होते हैं।') + '</p>' +
        taskListHtml(cropId, p) + '</div>';
    }

    if (p.needsSowing) {
      return '<div class="ft-block ft-cal">' +
        '<h3>' + ico('sprout', 'ic ic--xs') + ' फसल का कैलेंडर</h3>' +
        '<p class="ft-cal-note">' + esc('बुवाई की तारीख़ लिखें — फिर हर काम अपनी ' +
          'तारीख़ के साथ यहाँ दिखेगा और समय पर याद भी आएगा।') + '</p>' +
        sowInputHtml(cropId, '') + '</div>';
    }

    const late = p.late.length;
    return '<div class="ft-block ft-cal">' +
      '<h3>' + ico('sprout', 'ic ic--xs') + ' फसल का कैलेंडर</h3>' +

      '<div class="ft-cal-top">' +
        '<div><b>' + p.das + '</b><span>' + esc('दिन की फसल') + '</span></div>' +
        '<div><b>' + esc(p.stageHi) + '</b><span>' + esc('अवस्था') + '</span></div>' +
      '</div>' +
      '<div class="ft-cal-bar"><i style="width:' + p.progress + '%"></i></div>' +

      (p.next
        ? '<p class="ft-cal-next">' + ico('clock', 'ic ic--xs') + ' <span>' +
            esc('अगला काम: ' + p.next.hi) + ' — <b>' +
            (p.next.inDays <= 0 ? 'आज' : p.next.inDays + ' दिन में') + '</b> (' +
            esc(p.next.dueText) + ')</span></p>'
        : '<p class="ft-cal-next">' + esc('इस फसल के सारे काम निपट गए।') + '</p>') +

      (late
        ? '<p class="ft-cal-late">' + ico('alert', 'ic ic--xs') + ' ' +
            esc(late + ' ज़रूरी काम छूट गया' + (late > 1 ? 'े' : '') +
                ' — अभी भी कर सकें तो कर लें।') + '</p>'
        : '') +

      taskListHtml(cropId, p) +
      sowInputHtml(cropId, p.sowing) +
    '</div>';
  }

  function taskListHtml(cropId, p) {
    return '<ul class="ft-cal-tasks">' + p.tasks.map((x) =>
      '<li class="ft-cal-task' + (x.done ? ' is-done' : '') +
          ' ft-cal-task--' + x.when + '">' +
        '<button type="button" class="ft-cal-tick" data-cal-task="' + esc(x.id) + '" ' +
          'aria-pressed="' + (x.done ? 'true' : 'false') + '" ' +
          'title="' + esc(x.done ? 'हो गया' : 'निशान लगाएँ') + '">' +
          (x.done ? '✓' : '') + '</button>' +
        '<span class="ft-cal-task__txt">' + esc(x.hi) +
          (x.must ? '<em class="ft-cal-must">' + esc('ज़रूरी') + '</em>' : '') + '</span>' +
        '<span class="ft-cal-task__when">' + esc(x.dueText) + '</span>' +
      '</li>').join('') + '</ul>';
  }

  function sowInputHtml(cropId, value) {
    return '<div class="ft-cal-sow">' +
      '<label>' + esc('बुवाई की तारीख़') +
        '<input type="date" id="ftSowDate" value="' + esc(value || '') + '"></label>' +
      (value ? '<button type="button" class="ft-cal-clear" id="ftSowClear">' +
                 esc('हटाएँ') + '</button>' : '') +
      '<p class="ft-cal-err" id="ftSowErr" hidden></p>' +
    '</div>';
  }

  function render() {
    if (!el.body) return;
    const st = appState();
    const cropId = st && st.cropId;

    if (!cropId) {
      el.body.innerHTML = '<p class="ft-empty">' + esc('पहले अपनी फसल चुनें — फिर उसी फसल का हिसाब यहाँ दिखेगा।') + '</p>';
      return;
    }

    const crop = appCrops()[cropId] || {};
    const size = Number(el.size && el.size.value) || 1;
    const unit = (el.unit && el.unit.value) || 'acre';
    const f = calcFertilizer(cropId, size, unit);
    const tips = TIPS[cropId] || TIPS.rice;

    /* Avastha ab andaaze se nahi. Kisan ne buvai ki tareekh bhar di ho to
       calendar se aati hai; usne khud koi avastha dabayi ho to wahi chalti
       hai (uska khet hai, uski baat upar). */
    let stage = el.stage && el.stage.value;
    if (!stagePicked && window.kmCalendar) {
      const cp = window.kmCalendar.plan(cropId);
      if (cp && cp.stage) stage = cp.stage;
    }
    if (!stage) stage = 'vegetative';
    if (el.stage) el.stage.value = stage;

    el.body.innerHTML = [
      /* ---- fasal ka calendar ---- */
      calendarHtml(cropId),

      /* ---- khaad ---- */
      '<div class="ft-block">',
        '<h3>', ico('leaf','ic ic--xs'), ' खाद कितनी डालें</h3>',
        f ? [
          '<div class="ft-bags">',
            ['urea','dap','mop'].map((k) => [
              '<div class="ft-bag">',
                '<b>', f[k].bags, '</b><span>बोरी</span>',
                '<small>', esc(SOURCES[k].hi), '</small>',
                '<em>', f[k].kg, ' kg</em>',
              '</div>',
            ].join('')).join(''),
          '</div>',
          '<p class="ft-need">', esc(crop.nameHi || cropId), ' · ', f.acres,
            ' एकड़ के लिए — नाइट्रोजन ', f.need.n, ' kg, फ़ॉस्फ़ोरस ', f.need.p,
            ' kg, पोटाश ', f.need.k, ' kg</p>',
        ].join('') : '<p class="ft-empty">ज़मीन का नाप सही लिखें।</p>',
        '<p class="ft-warn">', ico('alert','ic ic--xs'),
          ' यह एक सामान्य अंदाज़ा है। <strong>मिट्टी जाँच</strong> कराकर और अपने ',
          'कृषि विज्ञान केंद्र से पुष्टि करके ही मात्रा तय करें। ',
          'यूरिया एक साथ नहीं, 2–3 बार में दें।</p>',
      '</div>',

      /* ---- kheti ki salah ---- */
      '<div class="ft-block">',
        '<h3>', ico('bulb','ic ic--xs'), ' इस अवस्था में क्या करें</h3>',
        '<div class="ft-stages">',
          STAGES.map((s) =>
            '<button type="button" class="ft-stage' + (s.id === stage ? ' is-on' : '') +
            '" data-stage="' + s.id + '">' + esc(s.hi) + '</button>').join(''),
        '</div>',
        '<ul class="ft-tips">',
          (tips[stage] || []).map((t) => '<li>' + ico('check','ic ic--xs') + '<span>' + esc(t) + '</span></li>').join(''),
        '</ul>',
      '</div>',

      /* ---- visheshagya ---- */
      '<details class="ft-block ft-experts">',
        '<summary>', ico('user','ic ic--xs'), ' किससे सलाह लें — और कितना खर्च</summary>',
        '<ul class="ft-exp-list">',
          EXPERTS.map((e) => [
            '<li>',
              '<div><p class="ft-exp-name">', esc(e.hi),
                (e.official ? '<span class="ft-badge">सरकारी</span>' : ''), '</p>',
              '<p class="ft-exp-note">', esc(e.note), '</p></div>',
              '<div class="ft-exp-fee">', esc(e.fee),
                (e.tel ? '<a href="tel:' + esc(e.tel) + '">फ़ोन करें</a>' : ''), '</div>',
            '</li>',
          ].join('')).join(''),
        '</ul>',
        '<p class="ft-warn">फ़ीस अनुमानित है और जगह के हिसाब से बदलती है। ',
          'सरकारी सेवाएँ नि:शुल्क हैं — पहले वही आज़माएँ।</p>',
      '</details>',
    ].join('');

    el.body.querySelectorAll('.ft-stage').forEach((b) => {
      b.addEventListener('click', () => {
        el.stage.value = b.dataset.stage;
        stagePicked = true;              // ab calendar iske upar na chale
        render();
      });
    });

    /* ---- calendar ke buttons ---- */
    const sow = el.body.querySelector('#ftSowDate');
    if (sow) sow.addEventListener('change', () => {
      const r = window.kmCalendar.setSowing(cropId, sow.value);
      const err = el.body.querySelector('#ftSowErr');
      if (!r.ok) {
        if (err) { err.textContent = sowErrHi(r.reason); err.hidden = false; }
        return;
      }
      stagePicked = false;               // nayi tareekh par avastha phir calendar se
      render();
    });

    const clr = el.body.querySelector('#ftSowClear');
    if (clr) clr.addEventListener('click', () => {
      window.kmCalendar.clearSowing(cropId);
      stagePicked = false;
      render();
    });

    el.body.querySelectorAll('[data-cal-task]').forEach((b) =>
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') === 'true';
        window.kmCalendar.markDone(cropId, b.dataset.calTask, !on);
        render();
      }));
  }

  function init() {
    el.card  = $('#farmToolsCard');
    el.body  = $('#farmToolsBody');
    el.size  = $('#ftSize');
    el.unit  = $('#ftUnit');
    el.stage = $('#ftStage');
    if (!el.card || !el.body) return;

    if (el.size) el.size.addEventListener('input', render);
    if (el.unit) el.unit.addEventListener('change', render);
    render();
  }

  window.kmFarmTools = { render: render, calcFertilizer: calcFertilizer, TARGETS: TARGETS, TIPS: TIPS };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
