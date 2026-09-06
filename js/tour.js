/* ============================================================================
 * tour.js — First-time Guided Tour  (Feature A)
 *
 * Yeh file app ke UPAR ek alag layer hai. App ka koi bhi purana function,
 * HTML ya CSS yeh NAHI badalti — sirf padhti hai aur uske upar overlay dikhati hai.
 *
 * ─── TEAM: TOUR KE STEP KAISE BADLEIN ────────────────────────────────────
 *   Neeche `TOUR_STEPS` array me har step ek object hai:
 *
 *     {
 *       selector: '#dropzone',        // kis element par spotlight ho
 *       view:     'scan',             // (optional) pehle is screen par jao
 *       titleHi:  'फोटो यहाँ डालें',
 *       descHi:   'हिंदी me samjhaish — YAHI aawaz me bhi bola jaata hai',
 *       descEn:   'English line (sirf padhne ke liye, boli nahi jaati)',
 *     }
 *
 *   Naya step jodna ho to bas is array me ek object daal dein — logic
 *   chhune ki zaroorat nahi. Jis step ka element us waqt screen par nahi
 *   hai, wo apne aap SKIP ho jaata hai (app kabhi nahi tootegi).
 * ───────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ==========================================================================
   * 1. TOUR STEPS — team yahi edit karti hai
   * ======================================================================= */
  const TOUR_STEPS = [
    {
      selector: '#cropGrid',
      view: 'crops',
      titleHi: 'पहले अपनी फसल चुनें',
      titleEn: 'Choose your crop',
      descHi: 'यहाँ अपनी फसल पर टैप करें — जैसे धान, गेहूँ या गन्ना। ' +
              'जो फसल चुनेंगे, सिर्फ उसी का ए आई मॉडल फ़ोन में लोड होगा, इसलिए ऐप हल्का और तेज़ रहता है।',
      descEn: 'Tap your crop here. Only that crop\'s AI model loads, keeping the app light and fast.',
    },
    {
      selector: '#statusChip',
      titleHi: 'ऊपर स्थिति दिखती है',
      titleEn: 'Status indicator',
      descHi: 'यहाँ दिखता है कि मॉडल तैयार है या अभी लोड हो रहा है। ' +
              'जब यहाँ हरा निशान आ जाए, तभी फोटो जाँच सकते हैं।',
      descEn: 'Shows whether the AI model is ready. Wait for the green dot before scanning.',
    },
    {
      selector: '#weatherCard',
      view: 'scan',
      titleHi: 'आज का मौसम और छिड़काव की चेतावनी',
      titleEn: 'Weather & spray warning',
      descHi: 'यह कार्ड आपके इलाके का मौसम दिखाता है। अगर अगले कुछ घंटों में बारिश हो सकती है, ' +
              'तो यहाँ चेतावनी आएगी कि अभी दवा मत छिड़किए, वरना दवा बह जाएगी और पैसा बर्बाद होगा।',
      descEn: 'Live weather for your area. Warns you not to spray before rain.',
    },
    {
      selector: '#weatherSpeakBtn',
      view: 'scan',
      titleHi: 'मौसम सुनने का बटन',
      titleEn: 'Listen to the weather',
      descHi: 'पढ़ना न आता हो तो कोई बात नहीं। इस बटन को दबाइए और पूरा मौसम तथा चेतावनी ' +
              'हिंदी में ज़ोर से सुनाई देगी।',
      descEn: 'Tap to hear the weather and warnings read aloud in Hindi.',
    },
    {
      selector: '#dropzone',
      view: 'scan',
      titleHi: 'पत्ती की फोटो यहाँ लगाइए',
      titleEn: 'Add your leaf photo here',
      descHi: 'इस खाने पर टैप करके फोटो चुनें। एक ही पत्ती की साफ फोटो लें, ' +
              'अच्छी रोशनी में और सादे बैकग्राउंड पर। धुंधली फोटो से नतीजा सही नहीं आता।',
      descEn: 'Tap here to add a photo. One clear leaf, good light, plain background.',
    },
    {
      selector: '#cameraBtn',
      view: 'scan',
      titleHi: 'कैमरा बटन',
      titleEn: 'Camera button',
      descHi: 'यह बटन सीधे आपके फ़ोन का कैमरा खोल देता है। खेत में खड़े होकर पत्ती की ' +
              'फोटो यहीं से खींच सकते हैं।',
      descEn: 'Opens your phone camera so you can shoot the leaf right in the field.',
    },
    {
      selector: '#batchScanBtn',
      view: 'scan',
      titleHi: 'जाँच शुरू करने का बटन',
      titleEn: 'Start the scan',
      descHi: 'फोटो चुनने के बाद यह बटन दबाइए। जाँच आपके फ़ोन के अंदर ही होती है, ' +
              'इसलिए इंटरनेट न हो तब भी काम करती है और आपकी फोटो कहीं नहीं जाती।',
      descEn: 'Runs the scan on your phone. Works offline; your photo never leaves the device.',
    },
    {
      selector: '#scoresList',
      view: 'scan',
      titleHi: 'भरोसे का प्रतिशत',
      titleEn: 'Confidence scores',
      descHi: 'यहाँ हर रोग की संभावना प्रतिशत में दिखती है। अगर सबसे ऊपर वाला ' +
              'पचहत्तर प्रतिशत से कम है, तो ऐप कोई रोग नहीं बताता और साफ फोटो दोबारा माँगता है।',
      descEn: 'Probability for each disease. Below 75% the app asks for a clearer photo instead of guessing.',
      optional: true,
    },
    {
      selector: '#advisoryCard',
      view: 'scan',
      titleHi: 'रोग की पूरी सलाह',
      titleEn: 'Full advisory',
      descHi: 'रोग पहचानने के बाद यहाँ पूरी सलाह आती है — क्या करना है, कौन सी जैविक दवा, ' +
              'कौन सी रासायनिक दवा और कितनी मात्रा। छिड़काव से पहले अपने कृषि विज्ञान केंद्र से पुष्टि ज़रूर करें।',
      descEn: 'Actions, organic and chemical treatment with approximate dosage. Confirm with your local KVK.',
      optional: true,
    },
    {
      selector: '#speakResult',
      view: 'scan',
      titleHi: 'सलाह सुनने का बटन',
      titleEn: 'Listen to the advisory',
      descHi: 'यह "सुनें" बटन पूरी सलाह हिंदी में ज़ोर से पढ़कर सुनाता है। ' +
              'खेत में काम करते हुए भी आप सुन सकते हैं।',
      descEn: 'Reads the whole advisory aloud in Hindi.',
      optional: true,
    },
    {
      selector: '#kmVoiceFab',
      titleHi: 'बोलकर ऐप चलाइए',
      titleEn: 'Voice assistant',
      descHi: 'यह हरा माइक बटन दबाकर आप बोलकर ऐप चला सकते हैं। जैसे कहिए — ' +
              '"कैमरा खोलो", "मौसम बताओ", या "सलाह पढ़ो"। ऐप आपकी बात समझकर वही काम करेगा।',
      descEn: 'Tap the mic and speak, e.g. "camera kholo", "mausam batao", "advisory padho".',
      optional: true,
    },
    {
      selector: '#kmTourHelp',
      titleHi: 'यह मदद वाला बटन याद रखिए',
      titleEn: 'The help button',
      descHi: 'कभी भी भूल जाएँ तो इस प्रश्नचिह्न वाले बटन को दबाइए — यह पूरा तरीका ' +
              'फिर से दिखा देगा। अब आप ऐप चलाने के लिए तैयार हैं। शुभकामनाएँ!',
      descEn: 'Tap this any time to replay the tour. You are ready to go!',
      optional: true,
    },
  ];


  /* ==========================================================================
   * 2. Chhote helpers
   * ======================================================================= */

  const STORAGE_KEY = 'hasSeenTour';
  const MUTE_KEY    = 'km.tourMuted';
  const PART2_KEY   = 'km.tourPart2';   // fasal chunne ke baad bacha hua tarika

  /** Element screen par sach me dikh raha hai ya nahi. */
  function isVisible(node) {
    if (!node || !node.isConnected) return false;
    if (node.hidden) return false;
    const cs = getComputedStyle(node);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    const r = node.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    // koi bhi parent [hidden] to nahi hai?
    let p = node.parentElement;
    while (p) {
      if (p.hidden) return false;
      p = p.parentElement;
    }
    return true;
  }

  /** App ka apna speakText use karo; na mile to seedha browser se bolo. */
  function say(text) {
    if (!text) return;
    try {
      if (typeof window.speakText === 'function') {
        // (text, button, hostForNote) — dono null safe hain
        window.speakText(text, null, null);
        return;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'hi-IN';
        u.rate = 0.92;
        window.speechSynthesis.speak(u);
      }
    } catch (err) {
      console.warn('[tour] awaaz nahi chal payi:', err.message);   // kabhi crash nahi
    }
  }

  function hush() {
    try {
      if (typeof window.stopSpeaking === 'function') window.stopSpeaking();
      else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch (_) {}
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }


  /* ==========================================================================
   * 3. KMTour — khud-mukhtaar overlay component
   *
   * Use:  const t = new KMTour(steps);  t.start();  t.stop();
   * ======================================================================= */
  class KMTour {
    constructor(steps, options) {
      this.allSteps = Array.isArray(steps) ? steps : [];
      this.opts     = options || {};
      this.steps    = [];        // is baar chalne wale (visible) steps
      this.index    = 0;
      this.running  = false;
      this.root     = null;
      this.muted    = localStorage.getItem(MUTE_KEY) === '1';

      // event handlers ko bind kar lo taaki baad me hata sakein
      this._onKey    = this._onKey.bind(this);
      this._onLayout = this._onLayout.bind(this);
    }

    /* ---------- kaunse step is waqt chal sakte hain ----------------------
     * Jis step ka element abhi screen par nahi hai, wo apne aap chhoot jaata
     * hai — isliye tour kabhi khaali ya toota hua nahi dikhta.
     * @param {string} [only] 'scan' do to sirf scan-screen wale step lo
     * -------------------------------------------------------------------- */
    _resolveSteps(only) {
      const out = [];
      this.allSteps.forEach((step) => {
        if (only && step.view !== only) return;
        // Step apni screen maang raha hai to pehle wahan jaane ki koshish karo
        if (step.view) this._gotoView(step.view);
        const node = document.querySelector(step.selector);
        if (isVisible(node)) out.push(step);
      });
      return out;
    }

    /** Kitne step scan-screen ke hain (fasal chunne ke baad hi dikhte hain). */
    _scanStepCount() {
      return this.allSteps.filter((st) => st.view === 'scan').length;
    }

    /** App ka apna switchView use karta hai — koi nayi logic nahi. */
    _gotoView(name) {
      try {
        if (typeof window.switchView === 'function') window.switchView(name);
      } catch (_) { /* view na badle to bhi tour chalta rahega */ }
    }

    /* ---------- start / stop --------------------------------------------- */
    /**
     * @param {object} [opts] { only:'scan' } — sirf scan-screen wale step chalao
     */
    start(opts) {
      if (this.running) return;
      const o = opts || {};

      const viewBefore = document.querySelector('.view.is-active');
      this._viewBefore = viewBefore ? viewBefore.id.replace('view-', '') : null;
      this._only = o.only || null;

      this.steps = this._resolveSteps(this._only);
      if (!this.steps.length) {
        console.warn('[tour] koi bhi step screen par nahi mila — tour nahi chalega');
        return;
      }

      this.index   = 0;
      this.running = true;
      this._build();
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('resize', this._onLayout);
      window.addEventListener('scroll', this._onLayout, true);
      this._render();
    }

    /** Tour band karo. done=true matlab poora dekh liya. */
    stop(done) {
      if (!this.running) return;
      this.running = false;
      hush();
      window.removeEventListener('keydown', this._onKey);
      window.removeEventListener('resize', this._onLayout);
      window.removeEventListener('scroll', this._onLayout, true);
      if (this.root && this.root.parentNode) this.root.parentNode.removeChild(this.root);
      this.root = null;

      try { localStorage.setItem(STORAGE_KEY, 'true'); } catch (_) {}

      /* Pehli baar fasal chuni hi nahi hoti, isliye camera / result / salah
       * wale step us waqt screen par hote hi nahi aur chhoot jaate hain.
       * Unhe yaad rakh lete hain — jaise hi kisan fasal chunkar scan screen
       * par pahunchega, bacha hua tarika apne aap dikha denge. */
      try {
        if (this._only) {
          localStorage.removeItem(PART2_KEY);            // part-2 ho gaya
        } else {
          const sawScanStep = this.steps.some((st) => st.view === 'scan');
          if (!sawScanStep && this._scanStepCount() > 0) localStorage.setItem(PART2_KEY, '1');
          else localStorage.removeItem(PART2_KEY);
        }
      } catch (_) {}

      // Jahan se shuru kiya tha wahin wapas le jao
      if (this._viewBefore) this._gotoView(this._viewBefore);

      // Skip kiya ho ya poora dekha ho — dono me baad wala intezaam chalu ho
      if (typeof this.opts.onFinish === 'function') this.opts.onFinish(!!done);
    }

    next() { if (this.index >= this.steps.length - 1) this.stop(true); else { this.index++; this._render(); } }
    back() { if (this.index > 0) { this.index--; this._render(); } }

    /* ---------- overlay ka dhancha ek baar banta hai --------------------- */
    _build() {
      const root = document.createElement('div');
      root.className = 'km-tour-root';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', 'ऐप का तरीका / App guided tour');
      root.innerHTML = [
        '<div class="km-tour-blocker"></div>',
        '<div class="km-tour-ring" id="kmTourRing"></div>',
        '<div class="km-tour-pointer" id="kmTourPointer" aria-hidden="true">👉</div>',
        '<div class="km-tour-arrow" id="kmTourArrow" aria-hidden="true"></div>',
        '<div class="km-tour-tip" id="kmTourTip">',
          '<div class="km-tour-tip__head">',
            '<span class="km-tour-tip__step" id="kmTourStepNo"></span>',
            '<div class="km-tour-tip__tools">',
              '<button type="button" class="km-tour-btn km-tour-btn--icon" id="kmTourMute" ',
                'aria-label="आवाज़ बंद/चालू"></button>',
              '<button type="button" class="km-tour-btn km-tour-btn--ghost" id="kmTourSkip">',
                'छोड़ें / Skip</button>',
            '</div>',
          '</div>',
          '<h3 id="kmTourTitle"></h3>',
          '<p class="km-tour-tip__hi" id="kmTourDescHi"></p>',
          '<p class="km-tour-tip__en" id="kmTourDescEn"></p>',
          '<div class="km-tour-tip__bar">',
            '<div class="km-tour-dots" id="kmTourDots"></div>',
            '<div class="km-tour-tip__btns">',
              '<button type="button" class="km-tour-btn km-tour-btn--back" id="kmTourBack">← पीछे</button>',
              '<button type="button" class="km-tour-btn km-tour-btn--next" id="kmTourNext">आगे →</button>',
            '</div>',
          '</div>',
        '</div>',
      ].join('');
      document.body.appendChild(root);
      this.root = root;

      this.$ring    = root.querySelector('#kmTourRing');
      this.$arrow   = root.querySelector('#kmTourArrow');
      this.$pointer = root.querySelector('#kmTourPointer');
      this.$tip     = root.querySelector('#kmTourTip');
      this.$stepNo  = root.querySelector('#kmTourStepNo');
      this.$title   = root.querySelector('#kmTourTitle');
      this.$descHi  = root.querySelector('#kmTourDescHi');
      this.$descEn  = root.querySelector('#kmTourDescEn');
      this.$dots    = root.querySelector('#kmTourDots');
      this.$back    = root.querySelector('#kmTourBack');
      this.$next    = root.querySelector('#kmTourNext');
      this.$mute    = root.querySelector('#kmTourMute');

      this.$next.addEventListener('click', () => this.next());
      this.$back.addEventListener('click', () => this.back());
      root.querySelector('#kmTourSkip').addEventListener('click', () => this.stop(false));
      this.$mute.addEventListener('click', () => {
        this.muted = !this.muted;
        try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch (_) {}
        this._paintMute();
        if (this.muted) hush(); else this._speakCurrent();
      });
      this._paintMute();
    }

    _paintMute() {
      this.$mute.textContent = this.muted ? '🔇' : '🔊';
      this.$mute.title = this.muted ? 'आवाज़ चालू करें' : 'आवाज़ बंद करें';
    }

    /* ---------- ek step dikhao ------------------------------------------- */
    _render() {
      const step  = this.steps[this.index];
      const total = this.steps.length;

      if (step.view) this._gotoView(step.view);

      // Text bharo
      this.$stepNo.textContent = 'चरण ' + (this.index + 1) + ' / ' + total +
                                 '  ·  Step ' + (this.index + 1) + ' of ' + total;
      this.$title.innerHTML  = esc(step.titleHi) +
        (step.titleEn ? ' <span style="font-weight:600;opacity:.6">/ ' + esc(step.titleEn) + '</span>' : '');
      this.$descHi.textContent = step.descHi || '';
      this.$descEn.textContent = step.descEn || '';
      this.$descEn.style.display = step.descEn ? '' : 'none';

      this.$back.disabled   = this.index === 0;
      this.$next.textContent = (this.index === total - 1) ? 'हो गया ✓' : 'आगे →';

      this.$dots.innerHTML = this.steps
        .map((_, i) => '<span class="km-tour-dot' + (i === this.index ? ' is-on' : '') + '"></span>')
        .join('');

      // Target ko screen par laao, phir naapo
      const node = document.querySelector(step.selector);
      if (node && node.scrollIntoView) {
        try { node.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (_) {}
      }
      clearTimeout(this._layoutTimer);
      this._layoutTimer = setTimeout(() => this._position(node), 340);
      this._position(node);   // turant ek baar, taaki jhatka na lage

      this._speakCurrent();
    }

    _speakCurrent() {
      if (this.muted) return;
      const step = this.steps[this.index];
      if (!step) return;
      // Sirf Hindi bolte hain — English line padhne ke liye hai
      say(step.titleHi + '। ' + step.descHi);
    }

    /* ---------- spotlight + tooltip ko sahi jagah rakho ------------------ */
    _position(node) {
      if (!this.running || !this.root) return;

      const vw = window.innerWidth, vh = window.innerHeight;
      const PAD = 8;

      // Target hi na mile to beech me dikha do (tour rukega nahi)
      if (!isVisible(node)) {
        this.root.classList.add('is-centered');
        this.$ring.style.display = 'none';
        this.$arrow.classList.add('is-hidden');
        this.$pointer.classList.add('is-hidden');
        this.$tip.classList.remove('is-sheet', 'is-sheet-top', 'is-sheet-bottom');
        const tr = this.$tip.getBoundingClientRect();
        this.$tip.style.top  = Math.max(12, (vh - tr.height) / 2) + 'px';
        this.$tip.style.left = Math.max(12, (vw - tr.width) / 2) + 'px';
        return;
      }

      this.root.classList.remove('is-centered');
      this.$ring.style.display = '';

      const r = node.getBoundingClientRect();
      const top  = Math.max(4, r.top - PAD);
      const left = Math.max(4, r.left - PAD);
      const w = Math.min(vw - left - 4, r.width  + PAD * 2);
      const h = Math.min(vh - top  - 4, r.height + PAD * 2);

      this.$ring.style.top    = top + 'px';
      this.$ring.style.left   = left + 'px';
      this.$ring.style.width  = w + 'px';
      this.$ring.style.height = h + 'px';

      /* --- tooltip --- */
      const isSmall = vw < 560;
      const tipRect = this.$tip.getBoundingClientRect();
      const tipH = tipRect.height || 190;
      const tipW = Math.min(360, vw - 24);

      const spaceBelow = vh - (top + h);
      const placeBelow = spaceBelow > tipH + 28 || (top < tipH + 28);

      if (isSmall) {
        /* Chhoti screen: tooltip ko upar ya niche chipka do — kabhi bahar nahi jayega */
        this.$tip.classList.add('is-sheet');
        const targetInBottomHalf = (top + h / 2) > vh / 2;
        this.$tip.classList.toggle('is-sheet-top', targetInBottomHalf);
        this.$tip.classList.toggle('is-sheet-bottom', !targetInBottomHalf);
        this.$tip.style.top = targetInBottomHalf ? '' : 'auto';
        this.$arrow.classList.add('is-hidden');
      } else {
        this.$tip.classList.remove('is-sheet', 'is-sheet-top', 'is-sheet-bottom');
        const tTop  = placeBelow ? (top + h + 14) : (top - tipH - 14);
        let   tLeft = r.left + r.width / 2 - tipW / 2;
        tLeft = Math.max(12, Math.min(tLeft, vw - tipW - 12));

        this.$tip.style.top  = Math.max(12, Math.min(tTop, vh - tipH - 12)) + 'px';
        this.$tip.style.left = tLeft + 'px';

        // teer (arrow) tooltip se target ki taraf
        const ax = Math.max(tLeft + 16, Math.min(r.left + r.width / 2 - 11, tLeft + tipW - 38));
        this.$arrow.className = 'km-tour-arrow ' + (placeBelow ? 'is-up' : 'is-down');
        this.$arrow.style.left = ax + 'px';
        this.$arrow.style.top  = (placeBelow ? (top + h + 2) : (top - 14)) + 'px';
      }

      /* --- chalta hua 👉 pointer, hamesha target ke kinare par --- */
      this.$pointer.classList.remove('is-hidden');
      const px = Math.min(vw - 34, left + w + 6);
      const py = Math.max(4, top + h / 2 - 14);
      this.$pointer.style.left = px + 'px';
      this.$pointer.style.top  = py + 'px';
      // Agar daayein jagah na ho to baayein taraf le jao (aur ulta kar do)
      if (left + w + 40 > vw) {
        this.$pointer.style.left = Math.max(4, left - 32) + 'px';
        this.$pointer.textContent = '👈';
      } else {
        this.$pointer.textContent = '👉';
      }
    }

    _onLayout() {
      const step = this.steps[this.index];
      if (step) this._position(document.querySelector(step.selector));
    }

    _onKey(e) {
      if (e.key === 'Escape')      { e.preventDefault(); this.stop(false); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); this.next(); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); this.back(); }
    }
  }


  /* ==========================================================================
   * 4. "❓ मदद" button — kabhi bhi tour dobara chalane ke liye
   * ======================================================================= */
  function mountHelpButton() {
    if (document.getElementById('kmTourHelp')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'kmTourHelp';
    btn.className = 'km-tour-help';
    btn.setAttribute('aria-label', 'मदद — तरीका दोबारा देखें / Replay tour');
    btn.innerHTML = '<span aria-hidden="true">❓</span><span class="km-tour-help__txt">मदद / Help</span>';
    btn.addEventListener('click', () => window.kmTour.start());
    document.body.appendChild(btn);
  }


  /* ==========================================================================
   * 5. Boot — app ke interactive hone ke BAAD (page load slow na ho)
   * ======================================================================= */
  let autoStarted = false;

  function maybeAutoStart() {
    if (autoStarted) return;

    /* Permission wala modal abhi khula hai to ruk jao — warna tour uske
     * peeche chalne lagta hai aur dono ki aawaz ek saath sunai deti hai. */
    if (document.querySelector('.km-perm')) {
      setTimeout(maybeAutoStart, 700);
      return;
    }

    autoStarted = true;
    let seen = null;
    try { seen = localStorage.getItem(STORAGE_KEY); } catch (_) {}
    if (seen === 'true') { watchForPart2(); return; }   // pehle dekh chuke hain
    setTimeout(() => window.kmTour.start(), 600);
  }

  /**
   * PART-2 — pehli baar fasal na chuni hone ke kaaran jo step chhoot gaye the,
   * wo tab dikhate hain jab kisan pehli baar scan screen par pahunchta hai.
   * App ka koi code chhue bina — bas view ki class par nazar rakhte hain.
   */
  function watchForPart2() {
    let pending = null;
    try { pending = localStorage.getItem(PART2_KEY); } catch (_) {}
    if (pending !== '1') return;

    const scanView = document.getElementById('view-scan');
    if (!scanView) return;

    const obs = new MutationObserver(() => {
      if (!scanView.classList.contains('is-active')) return;
      if (window.kmTour.running) return;
      obs.disconnect();
      setTimeout(() => window.kmTour.start({ only: 'scan' }), 900);
    });
    obs.observe(scanView, { attributes: true, attributeFilter: ['class'] });

    // Agar kisan pehle se hi scan screen par hai
    if (scanView.classList.contains('is-active') && !window.kmTour.running) {
      obs.disconnect();
      setTimeout(() => window.kmTour.start({ only: 'scan' }), 900);
    }
  }

  function boot() {
    window.KMTour        = KMTour;            // team chahe to apna tour bana sake
    window.KM_TOUR_STEPS = TOUR_STEPS;        // console se steps dekh/badal sakte hain
    window.kmTour        = new KMTour(TOUR_STEPS);

    mountHelpButton();

    // Tour khatam / skip hote hi part-2 ka intezaam kar do
    window.kmTour.opts.onFinish = watchForPart2;

    /* Pehli baar: pehle voice-assistant.js permission wala modal dikhata hai,
     * uske baad hi tour shuru hota hai (warna browser ka native prompt beech
     * me aa jaata). Agar voice-assistant.js hai hi nahi, to 3.5 sec baad
     * hum khud shuru kar dete hain. */
    window.addEventListener('km:first-run-ready', maybeAutoStart);
    // Ho sakta hai voice-assistant.js hamse PEHLE boot ho gaya ho aur event
    // nikal chuka ho — is flag se wo case bhi pakad lete hain.
    if (window.__kmFirstRunReady) maybeAutoStart();
    setTimeout(maybeAutoStart, 3500);
  }

  // Main app pehle interactive ho jaye, tab hum aayein
  function lazyBoot() {
    if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1500 });
    else setTimeout(boot, 400);
  }
  if (document.readyState === 'complete') lazyBoot();
  else window.addEventListener('load', lazyBoot);

})();
