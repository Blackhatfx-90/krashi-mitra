/* ============================================================================
 * VRIDHI AI — FASAL KA CALENDAR
 * js/calendar.js
 *
 * KYUN
 *   farm-tools me pehle se "is avastha me kya karein" tha, par avastha kisan
 *   khud chunta tha. Jise pata hai ki uski fasal 'flowering' me hai, use
 *   salah ki zarurat sabse kam hai.
 *
 *   Ab kisan sirf BUVAI KI TAREEKH bharta hai. Uske baad avastha khud nikalti
 *   hai, aur agla kaam apni tareekh ke saath dikhta hai — "pehli sinchai, 4
 *   din baad". Chook jaane par "3 din late ho gaya" bhi.
 *
 * DIN KAHAN SE AAYE
 *   Ye krishi vibhag/KVK ki aam sifarishein hain jo sab jagah chhapti hain
 *   (jaise gehun me CRI sinchai 21 din par). Har khet ka apna haal hota hai —
 *   isliye har jagah "apne KVK se pukka karein" likha jata hai, aur koi bhi
 *   dawa ki matra yahan nahi hai.
 *
 * AAM (mango) AUR SEB (apple) KA MAAMLA
 *   In par "buvai ki tareekh" ka matlab hi nahi — ped saalon purana hota hai.
 *   Inke liye MAHINE ka calendar hai, DAS ka nahi. Jhooth bolne se accha hai
 *   ki do tarah ka calendar rakhein.
 *
 * REMINDER
 *   notify seva ki 'calendar' shreni se. Ek kaam ki yaad ek hi baar aati hai.
 *   Kisan chahe to poori shreni band kar sakta hai.
 *
 * Poora hisaab phone par hi hota hai — koi server nahi, isliye offline bhi
 * bilkul chalta hai.
 * ========================================================================= */

(function () {
  'use strict';

  const SOW_KEY  = 'km.calendar.sowing.v1';   // { cropId: 'YYYY-MM-DD' }
  const DONE_KEY = 'km.calendar.done.v1';     // { 'crop|sow|taskId': 1 }
  const REM_KEY  = 'km.calendar.reminded.v1';

  const REMIND_BEFORE_DAYS = 3;      // itne din pehle yaad dila do

  /* Chook gaye kaam ki yaad kab tak dilana hai.
     "74 din pehle pehli sinchai karni thi" batane ka koi fayda nahi — us par
     ab kuch nahi ho sakta, aur aisi baat kisan ka bharosa todti hai. 3 hafte
     ke andar wala kaam abhi bhi sambhal sakta hai, usi ki yaad dilate hain. */
  const LATE_WINDOW_DAYS = 21;
  const DAY = 24 * 60 * 60 * 1000;

  /* ---------------------------------------------------------------------
   * Har fasal ka kaam — 'das' = buvai ke kitne din baad
   * 'must' wale kaam chookne par fasal ko seedha nuksan hota hai
   * ------------------------------------------------------------------- */
  const PLANS = {
    wheat: { days: 130, hi: 'गेहूँ', tasks: [
      { id:'seed',    das:0,   hi:'बीज उपचार करके बुवाई',            must:true  },
      { id:'cri',     das:21,  hi:'पहली सिंचाई (CRI) — सबसे ज़रूरी',  must:true  },
      { id:'weed',    das:32,  hi:'खरपतवार निकालें',                 must:false },
      { id:'irr2',    das:45,  hi:'दूसरी सिंचाई (कल्ले फूटते समय)',   must:false },
      { id:'irr3',    das:65,  hi:'तीसरी सिंचाई (गाँठ बनते समय)',     must:false },
      { id:'rust',    das:85,  hi:'रतुआ के लिए खेत देखें',           must:true  },
      { id:'milk',    das:100, hi:'दाना भरते समय पानी न चूकें',       must:true  },
      { id:'harvest', das:125, hi:'कटाई का समय — दाना सख्त हो तो काटें', must:false },
    ]},
    rice: { days: 140, hi: 'धान', tasks: [
      { id:'nursery', das:0,   hi:'नर्सरी — बीज उपचार करके डालें',    must:true  },
      { id:'trans',   das:25,  hi:'रोपाई का समय',                    must:true  },
      { id:'weed1',   das:35,  hi:'पहली निराई — 40 दिन तक खेत साफ',   must:true  },
      { id:'urea2',   das:45,  hi:'यूरिया की दूसरी मात्रा',           must:false },
      { id:'borer',   das:60,  hi:'तना छेदक/झोंका के लिए निगरानी',    must:true  },
      { id:'boot',    das:80,  hi:'बाली निकलते समय पानी न सूखने दें',  must:true  },
      { id:'water',   das:125, hi:'कटाई से 10 दिन पहले पानी बंद करें', must:false },
      { id:'harvest', das:135, hi:'80% दाने सख्त — कटाई करें',        must:false },
    ]},
    maize: { days: 100, hi: 'मक्का', tasks: [
      { id:'seed',    das:0,  hi:'बीज उपचार करके कतार में बुवाई',      must:true  },
      { id:'thin',    das:15, hi:'अतिरिक्त पौधे निकालें',             must:false },
      { id:'faw',     das:25, hi:'फॉल आर्मीवर्म — पत्तों की गोल देखें', must:true  },
      { id:'urea2',   das:35, hi:'यूरिया की दूसरी मात्रा + मिट्टी चढ़ाएँ', must:false },
      { id:'tassel',  das:55, hi:'भुट्टा बनते समय पानी ज़रूरी',        must:true  },
      { id:'harvest', das:95, hi:'छिलके सूखने पर तोड़ें',             must:false },
    ]},
    cotton: { days: 170, hi: 'कपास', tasks: [
      { id:'seed',    das:0,   hi:'बीज उपचार करके बुवाई',             must:true  },
      { id:'trap',    das:35,  hi:'गुलाबी सुंडी के लिए फेरोमोन ट्रैप लगाएँ', must:true  },
      { id:'weed',    das:40,  hi:'निराई-गुड़ाई',                     must:false },
      { id:'square',  das:60,  hi:'फूल-डोडी बनना शुरू — हफ़्ते में खेत घूमें', must:true  },
      { id:'boll',    das:90,  hi:'प्रभावित टिंडे तोड़कर नष्ट करें',   must:true  },
      { id:'pick1',   das:140, hi:'पहली चुनाई — सूखे मौसम में',        must:false },
      { id:'pick2',   das:165, hi:'दूसरी चुनाई',                     must:false },
    ]},
    sugarcane: { days: 330, hi: 'गन्ना', tasks: [
      { id:'sett',    das:0,   hi:'सेट उपचार करके बोएँ — लाल सड़न रुकता है', must:true  },
      { id:'gap',     das:35,  hi:'खाली जगह भरें',                   must:false },
      { id:'weed',    das:50,  hi:'निराई — शुरू के 90 दिन सबसे ज़रूरी', must:true  },
      { id:'earth',   das:110, hi:'मिट्टी चढ़ाएँ ताकि गन्ना गिरे नहीं',  must:false },
      { id:'borer',   das:150, hi:'तना छेदक की निगरानी',             must:true  },
      { id:'strip',   das:210, hi:'सूखी निचली पत्तियाँ हटाएँ',        must:false },
      { id:'harvest', das:320, hi:'पकने पर कटाई — 24 घंटे में मिल पहुँचाएँ', must:false },
    ]},
    potato: { days: 100, hi: 'आलू', tasks: [
      { id:'seed',    das:0,  hi:'अंकुरित, रोग-मुक्त बीज कंद बोएँ',    must:true  },
      { id:'earth',   das:25, hi:'मिट्टी चढ़ाएँ',                     must:true  },
      { id:'blight',  das:40, hi:'झुलसा (blight) के लिए रोज़ देखें — कोहरे में ज़्यादा', must:true  },
      { id:'irr',     das:55, hi:'सिंचाई — मिट्टी सूखने न दें',       must:false },
      { id:'haulm',   das:85, hi:'खुदाई से 10 दिन पहले बेल काट दें',   must:false },
      { id:'dig',     das:95, hi:'खुदाई — छिलका सख्त होने पर',        must:false },
    ]},
    tomato: { days: 130, hi: 'टमाटर', tasks: [
      { id:'nursery', das:0,  hi:'नर्सरी — बीज उपचार करके',           must:true  },
      { id:'trans',   das:25, hi:'रोपाई',                            must:true  },
      { id:'stake',   das:40, hi:'सहारा (स्टेकिंग) लगाएँ',            must:false },
      { id:'mite',    das:55, hi:'मकड़ी/सफ़ेद मक्खी के लिए पत्तों की नीचे देखें', must:true  },
      { id:'flower',  das:65, hi:'फूल आते समय पानी नियमित रखें',      must:true  },
      { id:'pick',    das:100, hi:'तुड़ाई शुरू — हर 3-4 दिन में',      must:false },
    ]},
    onion: { days: 140, hi: 'प्याज़', tasks: [
      { id:'nursery', das:0,   hi:'ऊँची क्यारी पर नर्सरी',            must:true  },
      { id:'trans',   das:40,  hi:'रोपाई — जड़ उपचार करके',           must:true  },
      { id:'weed',    das:55,  hi:'खरपतवार जल्दी निकालें',            must:true  },
      { id:'thrips',  das:70,  hi:'थ्रिप्स के लिए नीली चिपचिपी ट्रैप',  must:true  },
      { id:'purple',  das:85,  hi:'बैंगनी धब्बा दिखे तो तुरंत जाँचें',  must:true  },
      { id:'stop',    das:120, hi:'खुदाई से 15 दिन पहले पानी बंद',     must:false },
      { id:'dig',     das:135, hi:'50% गर्दन झुके — खोदें, छाँव में सुखाएँ', must:false },
    ]},
  };

  /* Ped — inme buvai ki tareekh nahi, mahina chalta hai (1 = January) */
  const PERENNIAL = {
    mango: { hi: 'आम', tasks: [
      { id:'prune',   month:8,  hi:'तुड़ाई के बाद छँटाई और खाद',       must:false },
      { id:'hopper',  month:1,  hi:'मंजर आने पर भुनगा (hopper) की निगरानी', must:true  },
      { id:'mildew',  month:2,  hi:'खर्रा (powdery mildew) — मंजर सूखे तो जाँचें', must:true  },
      { id:'fruitset',month:3,  hi:'फल बनते समय सिंचाई ज़रूरी',        must:true  },
      { id:'drop',    month:4,  hi:'फल गिरना — सिंचाई नियमित रखें',    must:false },
      { id:'harvest', month:6,  hi:'तुड़ाई — डंठल के साथ तोड़ें',       must:false },
    ]},
    apple: { hi: 'सेब', tasks: [
      { id:'prune',   month:1,  hi:'शीत ऋतु की छँटाई',                must:false },
      { id:'scab',    month:4,  hi:'स्केब के लिए निगरानी — बारिश के बाद ज़्यादा', must:true  },
      { id:'thin',    month:5,  hi:'फल की छँटाई (thinning)',          must:false },
      { id:'mite',    month:6,  hi:'मकड़ी के लिए पत्तों की नीचे देखें',  must:true  },
      { id:'harvest', month:9,  hi:'तुड़ाई — रंग और डंठल देखकर',        must:false },
      { id:'manure',  month:11, hi:'गोबर की खाद और बेसिन बनाएँ',       must:false },
    ]},
  };

  /* Avastha — kaam se alag, sirf dikhane ke liye (farm-tools isi ko chunta hai) */
  const STAGE_BY_FRACTION = [
    { max:0.15, id:'sowing',     hi:'बुवाई'      },
    { max:0.50, id:'vegetative', hi:'बढ़वार'      },
    { max:0.80, id:'flowering',  hi:'फूल व बाली' },
    { max:99,   id:'harvest',    hi:'कटाई'       },
  ];

  /* ---------- chhote helpers ---------- */
  function read(k, d) {
    try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; }
    catch (_) { return d; }
  }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }

  function today0() { const d = new Date(); d.setHours(0,0,0,0); return d; }
  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    d.setHours(0,0,0,0);
    return isFinite(d.getTime()) ? d : null;
  }
  function fmt(d) {
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  }
  function isPerennial(cropId) { return Boolean(PERENNIAL[cropId]); }

  /* ---------- buvai ki tareekh ---------- */
  function sowingDates() { return read(SOW_KEY, {}); }

  function getSowing(cropId) {
    const d = sowingDates()[cropId];
    return d || '';
  }

  /**
   * Tareekh rakho. Aane wali tareekh mana kar dete hain — kisan aksar saal
   * galat likh deta hai (2025 ki jagah 2026), aur us par poora calendar
   * ulta chal jata.
   */
  function setSowing(cropId, dateStr) {
    if (isPerennial(cropId)) return { ok:false, reason:'ped par buvai ki tareekh nahi chalti' };
    if (!PLANS[cropId]) return { ok:false, reason:'is fasal ka calendar nahi hai' };
    const d = parseDate(dateStr);
    if (!d) return { ok:false, reason:'tareekh theek nahi (YYYY-MM-DD)' };

    const t = today0();
    if (d.getTime() > t.getTime()) return { ok:false, reason:'aane wali tareekh nahi chalegi' };
    if ((t - d) / DAY > 400) return { ok:false, reason:'tareekh bahut purani hai — saal dekh lein' };

    const all = sowingDates();
    all[cropId] = dateStr;
    write(SOW_KEY, all);
    emit();
    setTimeout(() => remind(cropId), 100);
    return { ok:true };
  }

  function clearSowing(cropId) {
    const all = sowingDates();
    delete all[cropId];
    write(SOW_KEY, all);
    emit();
  }

  /* ---------- kaam ki suchi ---------- */
  function doneKey(cropId, taskId) {
    return cropId + '|' + (getSowing(cropId) || 'x') + '|' + taskId;
  }
  function isDone(cropId, taskId) { return Boolean(read(DONE_KEY, {})[doneKey(cropId, taskId)]); }
  function markDone(cropId, taskId, on) {
    const m = read(DONE_KEY, {});
    if (on === false) delete m[doneKey(cropId, taskId)];
    else m[doneKey(cropId, taskId)] = 1;
    write(DONE_KEY, m);
    emit();
  }

  /**
   * Fasal ka poora calendar — har kaam apni tareekh ke saath.
   * Ped ke liye mahine se, baki ke liye buvai se gina jata hai.
   */
  function plan(cropId) {
    if (isPerennial(cropId)) return perennialPlan(cropId);

    const p = PLANS[cropId];
    if (!p) return null;
    const sow = parseDate(getSowing(cropId));
    if (!sow) return { cropId, hi:p.hi, needsSowing:true, tasks:[] };

    const t = today0();
    const das = Math.round((t - sow) / DAY);

    const tasks = p.tasks.map((task) => {
      const due = new Date(sow.getTime() + task.das * DAY);
      const inDays = Math.round((due - t) / DAY);
      return {
        id: task.id, hi: task.hi, must: task.must, das: task.das,
        due: due, dueText: fmt(due), inDays: inDays,
        done: isDone(cropId, task.id),
        /* 'ab' = aaj-kal ka kaam, 'aage' = baad me, 'chooka' = nikal gaya */
        when: inDays > REMIND_BEFORE_DAYS ? 'aage' : inDays >= -2 ? 'ab' : 'chooka',
      };
    });

    const frac = p.days ? das / p.days : 0;
    let stage = STAGE_BY_FRACTION[STAGE_BY_FRACTION.length - 1];
    for (let i = 0; i < STAGE_BY_FRACTION.length; i++) {
      if (frac <= STAGE_BY_FRACTION[i].max) { stage = STAGE_BY_FRACTION[i]; break; }
    }

    return {
      cropId: cropId, hi: p.hi, perennial: false, needsSowing: false,
      sowing: getSowing(cropId), das: das, totalDays: p.days,
      /* 100% se aage nahi dikhate — fasal kat chuki hogi */
      progress: Math.max(0, Math.min(100, Math.round(frac * 100))),
      stage: stage.id, stageHi: stage.hi,
      tasks: tasks,
      next: tasks.filter((x) => !x.done && x.when !== 'chooka')
                 .sort((a, b) => a.inDays - b.inDays)[0] || null,
      /* Buvai (das 0) khud chook nahi sakti — fasal khadi hai to buvai hui hi
         hai. Use 'chooka' me dikhana bewakoofi lagta hai. */
      late: tasks.filter((x) => !x.done && x.when === 'chooka' && x.must &&
                                x.das > 0 && Math.abs(x.inDays) <= LATE_WINDOW_DAYS),
    };
  }

  function perennialPlan(cropId) {
    const p = PERENNIAL[cropId];
    const t = today0();
    const m = t.getMonth() + 1;

    const tasks = p.tasks.map((task) => {
      /* Agla mahina — is saal nahi to agle saal */
      let year = t.getFullYear();
      if (task.month < m) year += 1;
      const due = new Date(year, task.month - 1, 1);
      const inDays = Math.round((due - t) / DAY);
      return {
        id: task.id, hi: task.hi, must: task.must, month: task.month,
        due: due, dueText: due.toLocaleDateString('en-IN', { month:'long' }),
        inDays: inDays, done: isDone(cropId, task.id),
        when: task.month === m ? 'ab' : 'aage',
      };
    }).sort((a, b) => a.inDays - b.inDays);

    return {
      cropId: cropId, hi: p.hi, perennial: true, needsSowing: false,
      tasks: tasks,
      next: tasks.filter((x) => !x.done)[0] || null,
      late: [],
      stage: null, stageHi: null,
    };
  }

  /* ---------------------------------------------------------------------
   * Reminder — sirf wo kaam jo aaj-kal ka hai, aur ek hi baar
   * ------------------------------------------------------------------- */
  function remind(cropId) {
    if (!window.kmNotify) return { sent: 0 };
    const p = plan(cropId);
    if (!p || p.needsSowing) return { sent: 0 };

    const seen = read(REM_KEY, {});
    let sent = 0;

    const due = p.tasks.filter((x) => {
      if (x.done) return false;
      if (x.when === 'ab') return true;
      /* Chooke hue me sirf zaroori kaam, aur wo bhi jab tak sambhala ja sake */
      return x.when === 'chooka' && x.must && (x.das === undefined || x.das > 0) &&
             Math.abs(x.inDays) <= LATE_WINDOW_DAYS;
    });
    due.forEach((task) => {
      const k = doneKey(cropId, task.id);
      if (seen[k]) return;

      const late = task.when === 'chooka';
      const kab = p.perennial ? task.dueText
        : late ? Math.abs(task.inDays) + ' दिन पहले का काम'
        : task.inDays <= 0 ? 'आज' : task.inDays + ' दिन में';

      const r = window.kmNotify.push({
        id: 'cal:' + k,
        category: 'calendar',
        severity: late && task.must ? 'warning' : 'info',
        title: p.hi + ' — ' + task.hi,
        body: kab + (late ? '. अभी भी कर सकें तो कर लें.' : '.'),
      });
      if (r.queued) { seen[k] = 1; sent += 1; }
    });

    if (sent) write(REM_KEY, seen);
    return { sent: sent };
  }

  /** Jitni fasalon ki tareekh bhari hai, sabki yaad dila do */
  function remindAll() {
    let n = 0;
    Object.keys(sowingDates()).forEach((c) => { n += remind(c).sent; });
    return { sent: n };
  }

  function emit() {
    try { window.dispatchEvent(new CustomEvent('km:calendar')); } catch (_) {}
  }

  window.kmCalendar = {
    plan, getSowing, setSowing, clearSowing, markDone, isDone,
    remind, remindAll, isPerennial,
    PLANS: PLANS, PERENNIAL: PERENNIAL,
  };

  /* App khulne par ek baar — outbreak ke baad, taaki dono ek saath na bajein */
  function boot() { setTimeout(remindAll, 9000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
