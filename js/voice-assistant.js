/* ============================================================================
 * voice-assistant.js — Bolkar app chalane wala sahayak  (Feature B)
 *
 * Yeh file app ke UPAR ek alag layer hai. Ismein koi nayi "logic" nahi hai —
 * yeh sirf aapki BAAT SUNTI hai aur app ke PURANE function ko call kar deti hai.
 *
 * ─── TEAM: NAYA VOICE COMMAND KAISE JODEIN ───────────────────────────────
 *   Neeche `COMMANDS` array me ek object add kar dein:
 *
 *     {
 *       id: 'history',
 *       words: ['इतिहास', 'history', 'purani jaanch'],   // in me se koi bhi sunai de
 *       replyHi: 'पुरानी जाँचें खोल रहा हूँ',            // yeh bolkar sunayega
 *       run() { window.switchView('history'); },          // PURANA function call karo
 *     }
 *
 *   Bas. Baaki sab (sunna, milaana, bolna, caption dikhana) apne aap ho jaata hai.
 * ───────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const PERM_KEY = 'km.permissionsAsked';

  /* ==========================================================================
   * 1. Chhote helpers
   * ======================================================================= */

  /** Suna hua vaakya saaf karo — chhote akshar, bina virām chinh, ek space. */
  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[।|,.!?;:"'`~^*()\[\]{}<>\/\\_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** App ka apna speakText use karo; na mile to seedha browser se bolo. */
  function say(text) {
    if (!text) return;
    try {
      if (typeof window.speakText === 'function') { window.speakText(text, null, null); return; }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'hi-IN'; u.rate = 0.92;
        window.speechSynthesis.speak(u);
      }
    } catch (err) { console.warn('[voice] bol nahi paya:', err.message); }
  }

  function hush() {
    try {
      if (typeof window.stopSpeaking === 'function') window.stopSpeaking();
      else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch (_) {}
  }

  /** Element mil jaye aur enabled ho to click kar do. */
  function clickIfUsable(id) {
    const node = document.getElementById(id);
    if (!node || node.disabled || node.hidden) return false;
    node.click();
    return true;
  }

  /* ---------------------------------------------------------------------
   * script.js me `const state` aur `const CROPS` likha hai. Classic script me
   * `const`/`let` window par NAHI aate (sirf `function` aur `var` aate hain) —
   * isliye window.state likhne se undefined milta hai.
   * Lekin dono script ek hi global scope share karte hain, isliye seedha naam
   * likhne par mil jaate hain. `typeof` isliye lagaya hai taaki script.js
   * load na ho paye tab bhi yeh file crash na kare.
   * ------------------------------------------------------------------- */
  function appState() { return (typeof state !== 'undefined') ? state : null; }
  function appCrops() { return (typeof CROPS !== 'undefined') ? CROPS : {}; }

  /** Fasal chuni hui hai ya nahi. */
  function hasCrop() {
    const st = appState();
    return !!(st && st.cropId);
  }


  /* ==========================================================================
   * 2. FASAL ke naam — bolne ke alag-alag tareeke
   *
   * CROPS config se naam apne aap uthaye jaate hain; neeche sirf wo extra
   * shabd hain jo log bolte hain (aur jo speech-to-text likh deta hai).
   * Nayi fasal jodein to yahan uske aliases bhi jod dein.
   * ======================================================================= */
  const CROP_ALIASES = {
    rice:      ['धान', 'चावल', 'राइस', 'rice', 'dhan', 'dhaan', 'chawal'],
    wheat:     ['गेहूँ', 'गेहू', 'गेंहू', 'व्हीट', 'wheat', 'gehu', 'gehun', 'gehoon'],
    sugarcane: ['गन्ना', 'गन्ने', 'ईख', 'शुगरकेन', 'sugarcane', 'ganna', 'ikh'],
    cotton:    ['कपास', 'रुई', 'कॉटन', 'cotton', 'kapas'],
    onion:     ['प्याज', 'प्याज़', 'पियाज', 'अनियन', 'onion', 'pyaz', 'pyaaz'],
    maize:     ['मक्का', 'भुट्टा', 'मकई', 'मेज़', 'maize', 'corn', 'makka', 'bhutta'],
    potato:    ['आलू', 'पोटैटो', 'potato', 'aloo', 'alu'],
    tomato:    ['टमाटर', 'टोमैटो', 'tomato', 'tamatar'],
    mango:     ['आम', 'मैंगो', 'mango', 'aam'],
    apple:     ['सेब', 'एप्पल', 'apple', 'seb'],
  };

  /** Suna hua vaakya kisi fasal ka naam le raha hai? To uski id lauta do. */
  function findCrop(text) {
    const crops = appCrops();
    let best = null;

    Object.keys(crops).forEach((id) => {
      const c = crops[id];
      // CROPS config ke naam + upar wale aliases, sab ek saath
      const words = [id, c.nameHi, c.nameEn, c.altHi]
        .concat(CROP_ALIASES[id] || [])
        .filter(Boolean)
        .map(norm);

      words.forEach((w) => {
        if (!w) return;
        if (text.indexOf(w) !== -1) {
          // Sabse lamba match jeetega ("आम" se pehle "बादाम" jaisi galti na ho)
          if (!best || w.length > best.len) best = { id: id, len: w.length };
        }
      });
    });

    return best ? best.id : null;
  }


  /* ==========================================================================
   * 3. COMMANDS — yahi table team edit karti hai
   *
   * Kram MAAYNE rakhta hai: upar wala pehle jaanchа jaata hai.
   * ("ruko" sabse upar hai taaki aawaz turant band ho sake.)
   * ======================================================================= */
  const COMMANDS = [

    /* ---------- 1. Awaaz band karo ---------- */
    {
      id: 'stop',
      words: ['रुको', 'रुक जाओ', 'चुप', 'चुप हो जाओ', 'बंद करो', 'बस करो',
              'ruko', 'ruk jao', 'chup', 'chup ho jao', 'band karo', 'stop', 'quiet'],
      replyHi: null,                       // isme bolna hi nahi hai
      run() { hush(); return { actionHi: 'आवाज़ बंद कर दी', actionEn: 'Speech stopped' }; },
    },

    /* ---------- 2. Tour / madad ---------- */
    {
      id: 'tour',
      words: ['टूर', 'तरीका', 'मदद', 'सिखाओ', 'समझाओ', 'गाइड', 'कैसे चलाऊँ', 'कैसे चलाएं',
              'tour', 'madad', 'help', 'guide', 'sikhao', 'samjhao', 'tarika'],
      replyHi: 'ठीक है, मैं आपको पूरा तरीका दिखाता हूँ।',
      run() {
        if (window.kmTour && typeof window.kmTour.start === 'function') {
          // Tour khud bolta hai, isliye hamari reply ke baad hi shuru karo
          setTimeout(() => window.kmTour.start(), 1400);
          return { actionHi: 'तरीका दिखा रहा हूँ', actionEn: 'Starting guided tour' };
        }
        return { failHi: 'तरीका अभी तैयार नहीं है।', actionHi: 'टूर नहीं मिला' };
      },
    },

    /* ---------- 3. Mausam ---------- */
    {
      id: 'weather',
      words: ['मौसम', 'बारिश', 'बरसात', 'तापमान', 'गरमी', 'नमी',
              'mausam', 'weather', 'barish', 'baarish', 'temperature', 'rain'],
      replyHi: null,                       // mausam khud bolega
      run() {
        // Maujooda weather ka apna "सुनो" button dabao — dobara fetch nahi karte
        const btn = document.getElementById('weatherSpeakBtn');
        if (btn && !btn.disabled) {
          if (btn.dataset.speaking === 'true') btn.click();   // pehle band karo
          setTimeout(() => btn.click(), 120);
          return { actionHi: 'मौसम सुना रहा हूँ', actionEn: 'Reading the weather' };
        }
        return {
          failHi: 'मौसम की जानकारी अभी नहीं मिली है। मौसम के लिए इंटरनेट और लोकेशन चाहिए। ' +
                  'ऊपर मौसम वाले कार्ड में ताज़ा करने का बटन दबाइए।',
          actionHi: 'मौसम का डेटा अभी नहीं है',
          actionEn: 'No weather data yet',
        };
      },
    },

    /* ---------- 4. Advisory / dawa padho ---------- */
    {
      id: 'advisory',
      words: ['सलाह', 'एडवाइजरी', 'एडवाइज़री', 'दवा', 'इलाज', 'उपचार', 'पढ़ो', 'पढ़ कर',
              'salah', 'advisory', 'dawa', 'dawai', 'ilaj', 'upchar', 'padho', 'treatment'],
      replyHi: null,                       // advisory khud bolegi
      run() {
        // Result wali advisory, warna "Smart Advisory" screen wali
        const btn = document.getElementById('speakResult') || document.getElementById('speakMirror');
        if (btn && !btn.disabled) {
          if (btn.dataset.speaking === 'true') btn.click();
          setTimeout(() => btn.click(), 120);
          return { actionHi: 'सलाह पढ़ रहा हूँ', actionEn: 'Reading the advisory' };
        }
        return {
          failHi: 'अभी कोई सलाह तैयार नहीं है। पहले पत्ती की फोटो जाँच लीजिए, फिर सलाह सुनाई जाएगी।',
          actionHi: 'अभी कोई जाँच नहीं हुई',
          actionEn: 'No advisory yet — scan a photo first',
        };
      },
    },

    /* ---------- 5. Fasal badlo (naam ke bina) ---------- */
    {
      id: 'crop-screen',
      words: ['फसल बदलो', 'फसल बदल', 'दूसरी फसल', 'फसल चुनो', 'फसल चुनें',
              'fasal badlo', 'fasal chuno', 'change crop', 'crop badlo'],
      replyHi: 'फसल चुनने वाली स्क्रीन खोल रहा हूँ।',
      run() {
        window.switchView('crops');
        return { actionHi: 'फसल की स्क्रीन खोली', actionEn: 'Opened crop selector' };
      },
    },

    /* ---------- 6. Camera ---------- */
    {
      id: 'camera',
      words: ['कैमरा', 'फोटो खींचो', 'फोटो खींच', 'तस्वीर खींचो', 'फोटो लो',
              'camera', 'kamera', 'photo kheecho', 'photo khicho', 'photo lo', 'take photo'],
      replyHi: 'कैमरा खोल रहा हूँ। पत्ती की साफ फोटो लीजिए।',
      run() {
        if (!hasCrop()) return needCrop();
        window.switchView('scan');
        return clickIfUsable('cameraBtn')
          ? { actionHi: 'कैमरा खोला', actionEn: 'Opened camera' }
          : { failHi: 'कैमरा बटन अभी नहीं मिला।', actionHi: 'कैमरा बटन नहीं मिला' };
      },
    },

    /* ---------- 7. Gallery ---------- */
    {
      id: 'gallery',
      words: ['गैलरी', 'फोटो चुनो', 'फोटो चुन', 'अपलोड', 'फोटो डालो',
              'gallery', 'photo chuno', 'upload', 'photo dalo'],
      replyHi: 'गैलरी खोल रहा हूँ, फोटो चुन लीजिए।',
      run() {
        if (!hasCrop()) return needCrop();
        window.switchView('scan');
        return clickIfUsable('galleryBtn')
          ? { actionHi: 'गैलरी खोली', actionEn: 'Opened gallery' }
          : { failHi: 'गैलरी बटन अभी नहीं मिला।', actionHi: 'गैलरी बटन नहीं मिला' };
      },
    },

    /* ---------- 8. Jaanch shuru karo ---------- */
    {
      id: 'scan',
      words: ['जाँच', 'जांच', 'जाँचो', 'जांचो', 'स्कैन', 'रोग बताओ', 'रोग पहचानो', 'शुरू करो',
              'jaanch', 'janch', 'scan', 'rog batao', 'shuru karo', 'detect'],
      replyHi: 'जाँच शुरू कर रहा हूँ।',
      run() {
        if (!hasCrop()) return needCrop();
        window.switchView('scan');
        const btn = document.getElementById('batchScanBtn');
        if (btn && !btn.disabled) { btn.click(); return { actionHi: 'जाँच चालू', actionEn: 'Scanning' }; }
        return {
          failHi: 'पहले पत्ती की फोटो चुन लीजिए, फिर जाँच शुरू होगी।',
          actionHi: 'पहले फोटो चाहिए', actionEn: 'Add a photo first',
        };
      },
    },

    /* ---------- 9. Purani jaanchein ---------- */
    {
      id: 'history',
      words: ['इतिहास', 'पुरानी जाँच', 'पुरानी जांच', 'हिस्ट्री', 'history', 'itihas', 'purani jaanch'],
      replyHi: 'पुरानी जाँचें दिखा रहा हूँ।',
      run() {
        window.switchView('history');
        return { actionHi: 'इतिहास खोला', actionEn: 'Opened history' };
      },
    },
  ];

  /** Fasal chune bina kuch nahi ho sakta — sab jagah wahi jawab. */
  function needCrop() {
    window.switchView('crops');
    return {
      failHi: 'पहले अपनी फसल चुन लीजिए। मैं फसल वाली स्क्रीन खोल रहा हूँ।',
      actionHi: 'पहले फसल चुनें', actionEn: 'Choose a crop first',
    };
  }

  /**
   * Suna hua vaakya -> kaunsa command?
   * Pehle fasal ka naam dekhte hain (jaise "गेहूँ चुनो"), phir table.
   */
  function matchCommand(text) {
    /* --- Fasal ka naam bola hai? ---
     * Teen shartein, taaki galat matlab na nikle:
     *   a) "धान चुनो" / "गेहूँ सेलेक्ट करो"  -> chunne wala shabd saaf hai
     *   b) sirf "गेहूँ"                      -> chhota vaakya (3 shabd tak)
     *   c) "गेहूँ का मौसम बताओ"              -> 'मौसम' jaisa pakka keyword hai,
     *                                          isliye fasal WALA matlab nahi lete
     * Isse "आलू के पकौड़े बनाओ" jaisi baat galti se aaloo select nahi karti.
     * -------------------------------------------------------------------- */
    const cropId = findCrop(text);
    const saysSelect = /(चुन|लगाओ|सेलेक्ट|select|chuno|karo|kar do|पर जाओ|kholo|खोलो)/.test(text);
    const wordCount  = text ? text.split(' ').length : 0;
    const otherStrong = COMMANDS.some((c) =>
      c.id !== 'crop-screen' && c.words.some((w) => text.indexOf(norm(w)) !== -1));

    if (cropId && !otherStrong && (saysSelect || wordCount <= 3)) {
      return {
        id: 'select-crop',
        replyHi: null,
        run() { return selectCropByVoice(cropId); },
      };
    }

    /* --- Table se milaao --- */
    for (let i = 0; i < COMMANDS.length; i++) {
      const c = COMMANDS[i];
      for (let j = 0; j < c.words.length; j++) {
        if (text.indexOf(norm(c.words[j])) !== -1) return c;
      }
    }
    return null;
  }

  /** App ka apna selectCrop() call karta hai — koi nayi logic nahi. */
  function selectCropByVoice(cropId) {
    const crop = appCrops()[cropId];
    const nameHi = crop ? crop.nameHi : cropId;
    const st = appState();

    if (st && st.cropAvailable && st.cropAvailable[cropId] === false) {
      return {
        failHi: nameHi + ' का मॉडल अभी तैयार नहीं है। कृपया दूसरी फसल चुनिए।',
        actionHi: nameHi + ' — अभी उपलब्ध नहीं', actionEn: 'Model not ready',
      };
    }
    if (typeof window.selectCrop !== 'function') {
      return { failHi: 'फसल नहीं चुन पाया।', actionHi: 'selectCrop नहीं मिला' };
    }
    window.selectCrop(cropId);
    return {
      speakHi: nameHi + ' चुन लिया। अब पत्ती की फोटो लीजिए।',
      actionHi: nameHi + ' चुना गया', actionEn: 'Selected ' + (crop ? crop.nameEn : cropId),
    };
  }


  /* ==========================================================================
   * 4. KMVoice — mic button + sunna + jawab dena
   * ======================================================================= */
  class KMVoice {
    constructor() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.SR        = SR;
      this.supported = !!SR;
      this.rec       = null;
      this.listening = false;
      this.hideTimer = null;
      this.speakTimer= null;
      this._mount();
    }

    /* ---------- UI ------------------------------------------------------- */
    _mount() {
      const fab = document.createElement('button');
      fab.type = 'button';
      fab.id = 'kmVoiceFab';
      fab.className = 'km-voice-fab';
      fab.dataset.state = this.supported ? 'idle' : 'off';
      fab.setAttribute('aria-label', 'बोलकर ऐप चलाएँ / Voice assistant');
      fab.textContent = '🎤';
      fab.addEventListener('click', () => this.toggle());
      document.body.appendChild(fab);
      this.fab = fab;

      const cap = document.createElement('div');
      cap.className = 'km-voice-cap';
      cap.id = 'kmVoiceCaption';
      cap.setAttribute('role', 'status');
      cap.setAttribute('aria-live', 'polite');
      cap.innerHTML = [
        '<div class="km-voice-cap__row">',
          '<span class="km-voice-cap__dot"></span>',
          '<div style="flex:1;min-width:0">',
            '<p class="km-voice-cap__heard" id="kmVoiceHeard"></p>',
            '<p class="km-voice-cap__act" id="kmVoiceAct"></p>',
          '</div>',
          '<button type="button" class="km-voice-cap__close" id="kmVoiceClose" ',
            'aria-label="बंद करें">✕</button>',
        '</div>',
        '<ul class="km-voice-cap__tips" id="kmVoiceTips"></ul>',
        '<p class="km-voice-cap__note" id="kmVoiceNote" hidden></p>',
      ].join('');
      document.body.appendChild(cap);
      this.cap    = cap;
      this.$heard = cap.querySelector('#kmVoiceHeard');
      this.$act   = cap.querySelector('#kmVoiceAct');
      this.$tips  = cap.querySelector('#kmVoiceTips');
      this.$note  = cap.querySelector('#kmVoiceNote');
      cap.querySelector('#kmVoiceClose').addEventListener('click', () => this._hideCap());
    }

    _setState(s) { this.fab.dataset.state = s; }

    /**
     * Caption patti dikhao.
     * @param {object} o {heard, action, kind:'listening'|'speaking'|'ok'|'error', tips:[], note, sticky}
     */
    _cap(o) {
      clearTimeout(this.hideTimer);
      this.$heard.textContent = o.heard || '';
      this.$act.textContent   = o.action || '';
      this.cap.className = 'km-voice-cap is-on' + (o.kind ? ' is-' + o.kind : '');

      this.$tips.innerHTML = (o.tips || [])
        .map((t) => '<li>' + t.replace(/</g, '&lt;') + '</li>').join('');

      if (o.note) { this.$note.textContent = o.note; this.$note.hidden = false; }
      else this.$note.hidden = true;

      if (!o.sticky) this.hideTimer = setTimeout(() => this._hideCap(), o.hold || 6000);
    }

    _hideCap() { this.cap.classList.remove('is-on'); }

    /** Jab tak app bol raha hai, mic button neela rahe. */
    _watchSpeaking() {
      clearInterval(this.speakTimer);
      let ticks = 0;
      this.speakTimer = setInterval(() => {
        const talking = ('speechSynthesis' in window) && window.speechSynthesis.speaking;
        if (talking) { this._setState('speaking'); ticks = 0; }
        else if (++ticks > 3) {              // ~1 sec chup raha to khatam maan lo
          clearInterval(this.speakTimer);
          if (!this.listening) this._setState('idle');
        }
      }, 300);
    }

    /** Jawab bolo + caption dikhao. */
    _respond(text, capOpts) {
      if (text) { say(text); this._watchSpeaking(); }
      if (capOpts) this._cap(capOpts);
    }

    /* ---------- sunna shuru / band ---------------------------------------- */
    toggle() { this.listening ? this.stop() : this.start(); }

    start() {
      /* Support hi nahi hai */
      if (!this.supported) {
        this._setState('off');
        this._respond(
          'माफ़ कीजिए, इस ब्राउज़र में आवाज़ पहचानने की सुविधा नहीं है। कृपया क्रोम ब्राउज़र इस्तेमाल कीजिए।',
          {
            heard: '🎤 आवाज़ पहचान उपलब्ध नहीं',
            action: 'Voice recognition is not supported in this browser.',
            kind: 'error',
            note: 'Chrome (Android/Desktop) me yeh feature chalta hai. Safari/Firefox me abhi nahi.',
            hold: 9000,
          }
        );
        return;
      }

      hush();                                  // bolna band, warna khud ko sun lega

      let rec;
      try { rec = new this.SR(); }
      catch (err) {
        this._respond('आवाज़ चालू नहीं हो पाई।', { heard: '⚠️ ' + err.message, kind: 'error' });
        return;
      }

      rec.lang            = 'hi-IN';
      rec.interimResults  = true;              // bolte-bolte caption me dikhe
      rec.continuous      = false;             // ek baar me ek hukm
      rec.maxAlternatives = 3;                 // teen anumaan — match ka mauka badhta hai

      let finalText = '';

      rec.onstart = () => {
        this.listening = true;
        this._setState('listening');
        this._cap({
          heard: 'सुन रहा हूँ… बोलिए',
          action: 'Listening… speak now',
          kind: 'listening',
          sticky: true,
          tips: ['कैमरा खोलो', 'मौसम बताओ', 'सलाह पढ़ो', 'धान चुनो', 'जाँच करो', 'रुको'],
          note: navigator.onLine
            ? null
            : '⚠️ आवाज़ पहचान के लिए इंटरनेट चाहिए (Chrome). रोग पहचान बिना इंटरनेट के चलती रहेगी।',
        });
        // 10 sec me kuch na bole to apne aap band
        this._timeout = setTimeout(() => { try { rec.stop(); } catch (_) {} }, 10000);
      };

      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) {
            // Saare anumaan jod lo — kisi ek me sahi shabd mil sakta hai
            for (let k = 0; k < res.length; k++) finalText += ' ' + res[k].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        if (interim) {
          this._cap({
            heard: interim, action: 'सुन रहा हूँ…', kind: 'listening', sticky: true,
          });
        }
      };

      rec.onerror = (e) => {
        clearTimeout(this._timeout);
        this.listening = false;
        this._setState('idle');
        this._handleError(e.error);
      };

      rec.onend = () => {
        clearTimeout(this._timeout);
        this.listening = false;
        if (this.fab.dataset.state === 'listening') this._setState('idle');
        const heard = norm(finalText);
        if (heard) this._handle(heard, finalText.trim());
        else if (!this._errored) {
          this._respond('कुछ सुनाई नहीं दिया। कृपया दोबारा बोलिए।', {
            heard: '🤔 कुछ सुनाई नहीं दिया', action: 'Nothing heard — tap the mic and try again',
            kind: 'error',
          });
        }
        this._errored = false;
      };

      this._errored = false;
      try { rec.start(); this.rec = rec; }
      catch (err) {
        // Do baar jaldi-jaldi dabane par aata hai — koi nuksan nahi
        console.warn('[voice] start:', err.message);
      }
    }

    stop() {
      try { if (this.rec) this.rec.stop(); } catch (_) {}
      this.listening = false;
      this._setState('idle');
      this._hideCap();
    }

    /* ---------- error ko aasan bhasha me badlo ---------------------------- */
    _handleError(code) {
      this._errored = true;
      let speak, heard, note = null;

      switch (code) {
        case 'not-allowed':
        case 'service-not-allowed':
          heard = '🚫 माइक की अनुमति नहीं मिली';
          speak = 'माइक की अनुमति नहीं मिली। कृपया ब्राउज़र में माइक को अनुमति दीजिए।';
          note  = 'Address bar me 🔒 par tap karke Microphone ko "Allow" karein, phir dobara try karein.';
          break;
        case 'no-speech':
          heard = '🤔 कुछ सुनाई नहीं दिया';
          speak = 'कुछ सुनाई नहीं दिया। कृपया दोबारा बोलिए।';
          break;
        case 'audio-capture':
          heard = '🎙️ माइक नहीं मिला';
          speak = 'फ़ोन का माइक नहीं मिला। कृपया जाँच लीजिए।';
          break;
        case 'network':
          heard = '📴 इंटरनेट नहीं है';
          speak = 'आवाज़ पहचानने के लिए इंटरनेट चाहिए। रोग पहचान बिना इंटरनेट के चलती रहेगी।';
          note  = '⚠️ Browser ki speech-to-text service internet se chalti hai. ' +
                  'Baaki app (rog pehchan, salah, awaaz) offline kaam karti hai.';
          break;
        case 'aborted':
          return;                                   // user ne khud roka — chup raho
        default:
          heard = '⚠️ आवाज़ नहीं समझ पाया';
          speak = 'कुछ गड़बड़ हुई। कृपया दोबारा कोशिश कीजिए।';
      }
      this._respond(speak, { heard: heard, action: code, kind: 'error', note: note, hold: 9000 });
    }

    /* ---------- suna hua vaakya -> kaam ----------------------------------- */
    _handle(normalized, raw) {
      const cmd = matchCommand(normalized);

      /* Samajh nahi aaya */
      if (!cmd) {
        this._respond('समझ नहीं आया, दोबारा बोलिए।', {
          heard: '“' + raw + '”',
          action: 'समझ नहीं आया / Not understood',
          kind: 'error',
          tips: ['कैमरा खोलो', 'मौसम बताओ', 'सलाह पढ़ो', 'धान चुनो', 'जाँच करो', 'टूर दिखाओ', 'रुको'],
          hold: 9000,
        });
        return;
      }

      this._setState('working');

      let out = {};
      try { out = cmd.run() || {}; }
      catch (err) {
        console.warn('[voice] command fail:', err);
        out = { failHi: 'यह काम अभी नहीं हो पाया।', actionHi: 'Error: ' + err.message };
      }

      /* Kya bolna hai:  fail > command ka apna > table ka default */
      const speakText = out.failHi || out.speakHi || cmd.replyHi || null;

      this._respond(speakText, {
        heard: '“' + raw + '”',
        action: (out.actionHi || '') + (out.actionEn ? ' · ' + out.actionEn : ''),
        kind: out.failHi ? 'error' : 'ok',
        hold: 7000,
      });

      if (!speakText) this._setState('idle');
    }
  }


  /* ==========================================================================
   * 5. PEHLI BAAR — permission maangne se pehle ek dostana modal
   *
   * Browser ka apna prompt achanak aata hai aur kisan ghabra kar "Block" daba
   * deta hai. Isliye pehle hum saral bhasha me batate hain ki kyun chahiye.
   * ======================================================================= */
  function askPermissionsFirstRun() {
    return new Promise((resolve) => {
      let asked = null;
      try { asked = localStorage.getItem(PERM_KEY); } catch (_) {}
      if (asked === '1') { resolve(false); return; }      // pehle poochh chuke hain

      const wrap = document.createElement('div');
      wrap.className = 'km-perm';
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-modal', 'true');
      wrap.innerHTML = [
        '<div class="km-perm__box">',
          '<div class="km-perm__icon" aria-hidden="true">🌾</div>',
          '<h2>नमस्ते! एक छोटी सी अनुमति चाहिए</h2>',
          '<p>यह ऐप आपकी <b>आवाज़</b> और <b>लोकेशन</b> का उपयोग करके आपकी मदद करेगा।</p>',
          '<p class="km-perm__en">This app uses your voice and location to help you.</p>',
          '<ul class="km-perm__list">',
            '<li><span class="km-perm__emoji">🎤</span><div>',
              '<b>माइक / Microphone</b>',
              'ताकि आप बोलकर ऐप चला सकें — “कैमरा खोलो”, “मौसम बताओ”।',
            '</div></li>',
            '<li><span class="km-perm__emoji">📍</span><div>',
              '<b>लोकेशन / Location</b>',
              'ताकि आपके खेत का मौसम और बारिश की चेतावनी दिखा सकें।',
            '</div></li>',
          '</ul>',
          '<div class="km-perm__btns">',
            '<button type="button" class="km-perm__btn km-perm__btn--yes" id="kmPermYes">',
              'ठीक है, अनुमति दें / Allow</button>',
            '<button type="button" class="km-perm__btn km-perm__btn--no" id="kmPermNo">',
              'अभी नहीं / Not now</button>',
          '</div>',
          '<p class="km-perm__foot">',
            'आपकी फोटो और आवाज़ कहीं नहीं भेजी जाती — रोग की जाँच आपके फ़ोन में ही होती है। ',
            'अनुमति बाद में भी दे सकते हैं।',
          '</p>',
        '</div>',
      ].join('');
      document.body.appendChild(wrap);

      const finish = () => {
        try { localStorage.setItem(PERM_KEY, '1'); } catch (_) {}
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        resolve(true);
      };

      wrap.querySelector('#kmPermNo').addEventListener('click', finish);

      wrap.querySelector('#kmPermYes').addEventListener('click', async () => {
        const btn = wrap.querySelector('#kmPermYes');
        btn.disabled = true;
        btn.textContent = 'अनुमति माँगी जा रही है…';

        /* 1) MAAIK — ek chhota sa stream lekar turant band kar dete hain.
              Iska maksad sirf browser ka permission prompt dikhana hai. */
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((t) => t.stop());
          }
        } catch (err) {
          console.warn('[voice] mic permission:', err.name);   // mana kar diya — koi baat nahi
        }

        /* 2) LOCATION — app ka apna refreshWeather() call karte hain.
              Wahi getPosition() chalata hai, isliye prompt bhi aata hai aur
              mausam ka card bhi bhar jaata hai. Koi duplicate logic nahi. */
        try {
          if (typeof window.refreshWeather === 'function') {
            window.refreshWeather({ force: true });
          } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function () {}, function () {});
          }
        } catch (err) {
          console.warn('[voice] location permission:', err.message);
        }

        finish();
      });
    });
  }


  /* ==========================================================================
   * 6. Boot — app ke interactive hone ke BAAD
   * ======================================================================= */
  async function boot() {
    window.KMVoice  = KMVoice;
    window.kmVoice  = new KMVoice();
    window.KM_VOICE_COMMANDS = COMMANDS;      // console se dekhne/test karne ke liye

    // Console se test: kmVoiceTest('mausam batao')
    window.kmVoiceTest = (phrase) => window.kmVoice._handle(norm(phrase), phrase);

    // Pehli baar: permission poochho, PHIR tour ko chalne do
    await askPermissionsFirstRun();
    window.__kmFirstRunReady = true;          // tour.js is flag ko bhi dekhta hai
    window.dispatchEvent(new CustomEvent('km:first-run-ready'));
  }

  function lazyBoot() {
    if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1500 });
    else setTimeout(boot, 400);
  }
  if (document.readyState === 'complete') lazyBoot();
  else window.addEventListener('load', lazyBoot);

})();
