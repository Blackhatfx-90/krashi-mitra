/* ============================================================================
 * VRIDHI AI — AI/ML Crop Disease & Pest Detection + Smart Advisory System
 * js/script.js
 *
 * Sab kuch device par chalta hai (TensorFlow.js) — sirf WEATHER ke liye
 * internet chahiye. Disease detection 100% OFFLINE hai.
 *
 * TEAM GUIDE (beginners padhein):
 *  Section 1  CONFIG          -> thresholds, paths, WEATHER API KEY
 *  Section 2  CROPS           -> 8 fasal + unke 93 rog/keet ki poori salah
 *                                (dhaan 6, gehu 14, ganna 5, sarson 5)
 *                                >>> NAYI FASAL sirf yahin add karni hai <<<
 *  Section 3  DOM + state     -> element references aur app ki state
 *  Section 4  Views + drawer  -> screen switching
 *  Section 5  Model loading   -> TF.js + chuni hui fasal ka model (lazy)
 *  Section 6  Image handling  -> camera / gallery / drag-drop
 *  Section 7  Predict         -> 224x224, [-1,1] normalize, inference
 *  Section 8  Rendering       -> advisory card, score bars, crop guide
 *  Section 9  History         -> localStorage
 *  Section 10 Crop selection  -> "Coming Soon" logic + crop switching
 *  Section 11 Weather         -> geolocation + OpenWeatherMap + warnings  (ONLINE)
 *  Section 12 Speech          -> Hindi awaaz (Web Speech API)
 *  Section 13 Init            -> events + service worker
 * ========================================================================= */

'use strict';

/* ============================================================================
 * SECTION 1 — CONFIG
 * ========================================================================= */

/* ┌──────────────────────────────────────────────────────────────────────┐
   │  APNI OpenWeatherMap API KEY YAHAN PASTE KAREIN                       │
   │                                                                      │
   │  Free key lene ke liye: https://openweathermap.org/api               │
   │  → Sign up → API keys tab → key copy karke neeche paste kar dein.    │
   │  (Nayi key ko active hone me ~10-60 minute lagte hain.)              │
   └──────────────────────────────────────────────────────────────────────┘ */
/* ---------------------------------------------------------------------------
 * Mausam ki API key YAHAN NAHI HAI — aur nahi honi chahiye.
 *
 * Pehle wo seedhe is file me likhi thi. Yeh file har browser me jaati hai
 * (View Source me dikh jaati hai) aur GitHub par bhi padi rehti hai. Yani
 * key kisi ki bhi ho jaati — bill hamara, aur quota khatam hone par KISAN
 * ko mausam milna band.
 *
 * Ab wo sirf server par rehti hai (Vercel me OPENWEATHER_API_KEY), aur
 * yeh file api/weather.js se poochti hai.
 * ------------------------------------------------------------------------- */
const WEATHER_API_KEY = '520c40d9ec23d08f1445a7bd44b14f06';
const WEATHER_PROXY = 'api/weather';


const CONFIG = {
  /** Models ka base folder — models/<crop>/model.json */
  MODELS_BASE: 'models',

  /** MobileNet input size — Teachable Machine image models 224x224 use karte hain. */
  IMAGE_SIZE: 224,

  /**
   * Confidence threshold. Top prediction isse kam hui to hum koi
   * diagnosis NAHI dikhate — sirf "dobara clear photo lein" wala message.
   */
  CONFIDENCE_THRESHOLD: 0.75,

  /**
   * LEAF GATE — "yeh photo patti ki hai ya nahi?"
   *
   * Teachable Machine ka model closed-set hai: wo HAR photo ko kisi na kisi rog
   * me daal deta hai (selfie par bhi "रतुआ 82%"). Isliye model chalane se pehle
   * hum photo ka rang aur texture jaanchte hain.
   *
   * Kisan ko ROKA nahi jata — chetavni ke saath "फिर भी जाँचें" ka button milta
   * hai. Agar aapke khet ki asli photos galat reject ho rahi hon to MIN_SCORE
   * ghata dein (jaise 0.10), aur bilkul band karna ho to ENABLED: false.
   */
  LEAF_GATE: {
    ENABLED: true,
    MIN_SCORE: 0.16,     // isse kam plant-score = shayad patti nahi hai
    MAX_SKIN: 0.30,      // itni chamdi dikhi to selfie maan lo
    MAX_SKY: 0.45,       // itna aasman dikha to patti nahi hai
    MAX_DULL: 0.72,      // itna feeka rang = deewar / kaagaz / screenshot
    MAX_DARK: 0.55,      // itna andhera = kuch dikh hi nahi raha
    /* Bilkul chapti satah (kapda/deewar/aasman) me edges 0.00 aate hain, jabki
       ek-samaan hari SEHATMAND patti me bhi ~0.04 aa jate hain. Pehle yeh 0.045
       tha aur sehatmand patti hi reject ho rahi thi — isliye ab 0.02, jisme
       dono ke beech achha faasla hai. */
    MIN_EDGES: 0.02,     // isse kam bunawat = bilkul saadi satah (kapda/deewar)
    LEAF_TEXTURE: 0.22,  // isse zyada bunawat ho to garm rang = patti, chamdi nahi
  },

  /**
   * HEALTH CHECK — "sahi fasal ko sahi batao".
   *
   * SAMASYA: Teachable Machine ka model over-confident hota hai. Bilkul
   * sehatmand patti par bhi wo 80% par koi rog bata deta hai, kyunki uske
   * paas "kuch nahi mila" kehne ka koi rasta hi nahi hai.
   *
   * HAL: model ke jawab ko photo ke SUBOOT se milaate hain. Agar patti poori
   * ek-samaan hari hai, uspar na daag hain na peelapan (damage bahut kam),
   * to hum rog ka faisla nahi maante — fasal ko SWASTH batate hain aur usse
   * behtar rakhne ki salah dete hain.
   */
  OOD: {
    ENABLED: true,
    MIN_TOP_CONFIDENCE: 0.68,
    MAX_NORMALIZED_ENTROPY: 0.78,
  },

  HEALTH: {
    ENABLED: true,
    /** Isse kam nuksan dikhe to patti sehatmand maani jayegi. */
    HEALTHY_MAX_DAMAGE: 0.14,
    /** Utna hi pakka rog tabhi maanenge jab model ka bharosa isse zyada ho. */
    DISEASE_OVERRIDE_CONF: 0.92,
    /** healthy class top se itne ke andar ho to healthy ko chunenge. */
    HEALTHY_MARGIN: 0.22,
    /** Nuksan itna zyada dikhe to "sehatmand" ka daawa nahi karenge. */
    CLEAR_DAMAGE: 0.30,
  },

  /**
   * CROP MATCH — "ganne me sirf ganna".
   * Patti ki banawat se fasal-parivaar ka andaza: ghaas-kul (dhaan/gehu/ganna/
   * makka) ki pattiyan lambi-patli aur ek disha me hoti hain; chaudi pattiyan
   * (tamatar/aalu/sarson) har taraf faili hoti hain.
   *
   * NOTE: yeh sirf PARIVAAR alag karta hai. Gehu aur dhaan ki patti me farq
   * karna is tarike se sambhav nahi — uske liye online AI (wrong_crop) hai.
   */
  /**
   * CROP MATCH — "jo fasal chuni hai, uski hi photo par jaanch ho".
   *
   * SAMASYA: har fasal ka model CLOSED-SET hai. Seb chunkar ganne ki photo
   * daalo to seb ka model use bhi kisi seb ke rog me daal dega — 90% bharose
   * ke saath. Kisan ko bilkul galat salah milegi.
   *
   * HAL: model chalane se PEHLE patti ki BANAWAT se fasal-parivaar pehchante
   * hain (grassScore = nason ki disha ka zor + coherence):
   *
   *     ghaas-kul  : dhaan, gehu, ganna, makka, pyaz  — nasein samanantar
   *     chaudi     : seb, aam, tamatar, aalu, kapas   — beech ki nas se shaakhaein
   *
   * Naape gaye asli number: ghaas 0.39–0.55 | chaudi patti 0.19–0.20.
   * Beech ka hissa (0.24–0.32) "pakka nahi" maana jata hai — wahan hum rokte
   * NAHI, kyunki jhoothi rukawat bhi utni hi buri hai.
   *
   * SEEMA: yeh sirf PARIVAAR alag karta hai. Seb aur aam (dono chaudi) me
   * farq karna is tarike se sambhav NAHI. Uske liye online AI (wrong_crop) hai.
   */
  CROP_MATCH: {
    ENABLED: true,
    BLOCK: true,           // mismatch par jaanch rok do (kisan "फिर भी जाँचें" daba sakta hai)
    GRASS_MIN: 0.32,       // isse zyada = ghaas-kul ki patti
    BROAD_MAX: 0.24,       // isse kam  = chaudi patti
    SKIP_IF_DAMAGE: 0.55,  // patti itni kharab ho ki shakal hi na bache to chup raho
  },

  /**
   * KRISHI VIBHAG se judaav — apne hi server ke do raste.
   * Dono me se kuch bhi na chale to app par koi asar nahi padta.
   */
  REPORT: {
    SCANS: 'api/scans',            // kisan -> vibhag (sirf opt-in par)
    ADVISORIES: 'api/advisories',  // vibhag -> kisan (padhna hamesha chalu)
  },

  /** Upload ke liye max file size (10 MB). */
  MAX_FILE_BYTES: 10 * 1024 * 1024,

  /** Agar local js/tf.min.js na mile to yahan se try karega (sirf online). */
  TFJS_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/tensorflow/4.20.0/tf.min.js',

  /**
   * TFLite runtime — Teachable Machine ke "Tensorflow Lite" export (model.tflite)
   * ko browser me chalane ke liye. Ye tabhi load hota hai jab kisi fasal ka
   * model .tflite format me ho; TFJS (model.json) wale model ise chhute bhi nahi.
   * Pehle local copy dhoondhte hain (offline chalne ke liye), na mile to CDN.
   */
  TFLITE_LOCAL_JS: 'js/tflite/tf-tflite.min.js',
  TFLITE_LOCAL_WASM_DIR: 'js/tflite/wasm/',
  TFLITE_CDN_JS: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/tf-tflite.min.js',
  TFLITE_CDN_WASM_DIR: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/wasm/',

  /**
   * APK ka link — "ऐप डाउनलोड करें" par seedha .apk download hoga.
   *
   * Khali chhod dein to app PWA install (home screen par icon) offer karti hai,
   * jo Android par bilkul app jaisa hi chalta hai.
   *
   * ASLI APK kaise banayein (5 minute, bina Android Studio ke):
   *   1. App ko Vercel par deploy karein (https zaroori hai)
   *   2. https://pwabuilder.com kholein -> apna URL daalein -> Android package
   *   3. Jo .apk / .aab mile use GitHub Release par chadha dein
   *   4. Us file ka direct link neeche paste kar dein, jaise:
   *      'https://github.com/Blackhatfx-90/krashi-mitra/releases/download/v1/agriai.apk'
   */
  APK_URL: '',

  /** Hindi awaaz. */
  SPEECH_LANG: 'hi-IN',
  SPEECH_RATE: 0.9,
};


/* ---------------------------------------------------------------------------
 * WEATHER settings — yeh app ka EK-MAATRA feature hai jise internet chahiye.
 * ------------------------------------------------------------------------- */
const WEATHER_CONFIG = {
  CURRENT_URL:  'https://api.openweathermap.org/data/2.5/weather',
  FORECAST_URL: 'https://api.openweathermap.org/data/2.5/forecast',

  /** Baarish ki sambhavna (pop) isse zyada ho to spray-warning dikhega. */
  RAIN_POP_THRESHOLD: 0.5,       // 50%

  /** Aage kitne ghante tak ka forecast dekhein. */
  RAIN_LOOKAHEAD_HOURS: 12,

  /** Isse zyada humidity par fungal-warning dikhega. */
  HUMIDITY_THRESHOLD: 85,        // %

  /* Hawa itni tez ho to chhidkav bah jata hai — dawa padosi ke khet me
     ya kisan ke apne upar. Krishi vibhag aam taur par 10-15 km/h se upar
     mana karte hain; hum 15 par chetavni dete hain. */
  WIND_SPRAY_KMH: 15,

  /* Paala. 4 degree par zameen ke paas 0 ho sakta hai, isliye 4 par hi
     chetavni — 0 par batane ka koi fayda nahi, tab tak fasal jal chuki. */
  FROST_TEMP_C: 4,

  /* Garmi ka tanav — itne upar par sinchai aur dopahar me chhidkav se
     bachne ki salah. */
  HEAT_TEMP_C: 40,

  /** Kitni der tak purana weather data dobara use kar sakte hain (minute). */
  CACHE_MINUTES: 30,

  /** Geolocation ke liye max wait (ms). */
  GEO_TIMEOUT_MS: 12000,

  /**
   * Manual jagah dhoondhne ke liye — OpenWeather Geocoding API.
   * Yeh tab kaam aata hai jab GPS/location na mile. Phone par LAN IP
   * (192.168.x.x) khola ho to browser location HAMESHA block karta hai,
   * isliye gaon/shahar ya PIN code likhne ka rasta zaroori hai.
   */
  GEOCODE_URL: 'https://api.openweathermap.org/geo/1.0/direct',
  ZIP_URL:     'https://api.openweathermap.org/geo/1.0/zip',

  /** PIN code / shahar dhoondhte waqt kaunsa desh maana jaye. */
  COUNTRY: 'IN',

  /**
   * DEMO MODE — bina asli baarish ke warnings test karne ke liye.
   * Values: null (asli data) | 'rain' | 'humid' | 'clear'
   * Browser console me bhi chala sakte hain:  demoWeather('rain')
   */
  DEMO_SCENARIO: null,
};


/* ---------------------------------------------------------------------------
 * ONLINE AI settings — "online mode" ka double-check.
 *
 * Yahan koi API KEY NAHI hai aur na hi kabhi honi chahiye. Browser ka code
 * sabko dikhta hai. Key server par rehti hai (api/diagnose.js -> Vercel env var
 * OPENROUTER_API_KEY). App sirf apne hi server ke /api/diagnose ko call karta hai.
 * ------------------------------------------------------------------------- */
const AI_CONFIG = {
  /** Apne hi server ka endpoint (Vercel serverless function). */
  ENDPOINT: 'api/diagnose',

  /** Itni der me jawab na aaye to chhod do — kisan ko intezaar nahi karana. */
  TIMEOUT_MS: 45000,

  /** Photo API ko bhejne se pehle itni chhoti kar dete hain (data bachta hai). */
  IMAGE_MAX_SIDE: 640,
  IMAGE_QUALITY: 0.82,

  /** localStorage key — kisan ne kaunsa mode chuna tha. */
  MODE_KEY: 'agriai.netmode.v1',

  /** 'auto' = network accha ho to online, warna offline. */
  DEFAULT_MODE: 'auto',
};


/* ============================================================================
 * SECTION 2 — CROPS CONFIG  (sabse zaroori file-block)
 *
 * Har fasal ke liye:
 *   id        : folder ka naam — models/<id>/model.json
 *   nameHi/En : UI par dikhne wala naam
 *   icon      : emoji
 *   labels    : Teachable Machine ke output index (0,1,2…) ke EXACT order me
 *   classes   : har label ke liye poori salah
 *
 * ── NAYI FASAL (9th crop) KAISE JODEIN ────────────────────────────────────
 *   1. models/<nayi-fasal>/ folder me model.json + weights.bin + metadata.json daalein
 *   2. Neeche CROPS me ek naya block copy-paste karke bhar dein
 *   3. Bas. Core logic (script.js ka baaki hissa) chhune ki zaroorat NAHI hai.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * DOSAGE NOTE: saari matra "lagbhag / approx" hai aur sirf saamanya margdarshan
 * ke liye hai — chhidkav se pehle apne Krishi Vigyan Kendra (KVK) se pushti karein.
 * ========================================================================= */

const CROPS = {

  /* ##################### 1. RICE / धान ##################### */
  /* Labels ka order metadata.json se aata hai — neeche wali list us se
     BILKUL match karni chahiye (17 classes, index 0 se 16).
     NOTE: model me 'rice_brownspot' (0) aur 'rice_brown_spot' (5) — ek hi rog
     ki DO class hain. Yeh training data ki galti hai; dono ki salah same rakhi
     hai taaki kisan ko farak na pade. Agli baar model banate waqt inhe mila dein. */
  rice: {
    id: 'rice',
    nameHi: 'धान',
    nameEn: 'Rice',
    altHi: 'चावल',
    icon: 'crop-rice',
    seasonHi: 'खरीफ',
    labels: [
      'rice_brownspot',           // 0
      'rice_blast',               // 1
      'rice_Bacterialblight',     // 2
      'rice_tungro',              // 3
      'rice_leaf_smut',           // 4
      'rice_brown_spot',          // 5  (0 ka duplicate)
      'rice_healthy_leafs',       // 6
      'rice_bakanae',             // 7
      'rice_ragged_virus',        // 8
      'rice_sheath_rot',          // 9
      'rice_stem_rot',            // 10
      'rice_sheath_blight',       // 11
      'rice_green_leafhopper',    // 12
      'rice_bug',                 // 13
      'rice_planthopper',         // 14
      'rice_leaf_roller',         // 15
      'Rice_stem_borer',          // 16
    ],
    classes: {

      /* ------------------------------------------------------------------ */
      rice_brownspot: {
        nameHi: 'भूरा धब्बा रोग',
        nameEn: 'Brown Spot',
        pathogen: 'कवक / Fungus — Bipolaris oryzae',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'मैंकोज़ेब 75 WP लगभग 2 ग्राम प्रति लीटर पानी में छिड़कें',
          'खेत में पोटाश की कमी पूरी करें — यह रोग भूखी मिट्टी में ज़्यादा आता है',
          '10–12 दिन बाद ज़रूरत हो तो दूसरा छिड़काव करें',
        ],
        symptoms:
          'पत्तियों पर तिल जैसे छोटे भूरे धब्बे बनते हैं, जिनका बीच हल्का भूरा या राख जैसा और किनारा गहरा भूरा होता है। ' +
          'धब्बे गोल या अंडाकार होते हैं और पूरी पत्ती पर बिखरे रहते हैं। ज़्यादा रोग में दाने भी दागी हो जाते हैं। ' +
          'यह रोग कमज़ोर, कम उपजाऊ या पोटाश की कमी वाली मिट्टी में सबसे ज़्यादा दिखता है।',
        symptomsEn:
          'Small oval brown spots like sesame seeds, with a light grey centre and darker brown margin, scattered ' +
          'over the leaf. Severe infection also stains the grain. Most common on poor soils low in potash.',
        organic: [
          'बीज को 52°C गर्म पानी में 10 मिनट डुबोकर बोएँ',
          'ट्राइकोडर्मा से बीज उपचार — लगभग 5–10 ग्राम प्रति किलो बीज',
          'गोबर की सड़ी खाद और पोटाश देकर मिट्टी की ताकत बढ़ाएँ',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2 ग्राम प्रति लीटर पानी',
          'या प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'बीज उपचार: कार्बेन्डाजिम लगभग 2 ग्राम प्रति किलो बीज',
        ],
        prevention: [
          'संतुलित खाद दें — खासकर पोटाश की कमी न होने दें',
          'स्वस्थ और प्रमाणित बीज ही बोएँ',
          'खेत में पानी की कमी न होने दें, सूखा तनाव इस रोग को बढ़ाता है',
          'कटाई के बाद रोगग्रस्त पुआल खेत में न छोड़ें',
        ],
        speech:
          'पहचाना गया रोग है भूरा धब्बा, जिसे ब्राउन स्पॉट कहते हैं। ' +
          'इसमें पत्तियों पर तिल जैसे छोटे भूरे धब्बे बनते हैं, जिनका बीच हल्का और किनारा गहरा होता है। ' +
          'यह रोग अक्सर कमज़ोर मिट्टी और पोटाश की कमी से आता है। ' +
          'अभी करने वाला काम यह है कि मैंकोज़ेब लगभग दो ग्राम प्रति लीटर पानी में मिलाकर छिड़काव करें, ' +
          'और खेत में पोटाश की कमी पूरी करें। दस से बारह दिन बाद ज़रूरत हो तो दूसरा छिड़काव करें। ' +
          'अगली बार बीज को गर्म पानी में या ट्राइकोडर्मा से उपचारित करके ही बोएँ। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_blast: {
        nameHi: 'झोंका रोग (ब्लास्ट)',
        nameEn: 'Rice Blast',
        pathogen: 'कवक / Fungus — Magnaporthe oryzae',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'गर्दन पर आया ब्लास्ट (neck blast) सबसे खतरनाक है — बाली की गर्दन काली पड़कर टूट जाती है ' +
          'और दाने बिल्कुल नहीं बनते। बाली निकलने के समय छिड़काव ज़रूर करें।',
        actions: [
          'ट्राइसाइक्लाज़ोल 75 WP लगभग 0.6 ग्राम प्रति लीटर पानी में छिड़कें',
          'नाइट्रोजन खाद तुरंत रोक दें — यूरिया इस रोग को भड़काता है',
          'बाली निकलने के समय एक छिड़काव ज़रूर करें (गर्दन ब्लास्ट से बचाव)',
        ],
        symptoms:
          'पत्तियों पर आँख या नाव जैसे धब्बे बनते हैं — बीच में राख जैसा सफेद-स्लेटी और किनारा गहरा भूरा या लाल। ' +
          'धब्बे बढ़कर आपस में मिल जाते हैं और पत्ती झुलसी हुई दिखती है। ' +
          'बाली की गर्दन पर काला घेरा बन जाए तो बाली टूट जाती है और दाने खोखले रह जाते हैं। ' +
          'ठंडी रातें, सुबह की ओस और ज़्यादा यूरिया इसे तेज़ी से फैलाते हैं।',
        symptomsEn:
          'Spindle or eye-shaped lesions with ash-grey centres and dark brown margins that merge and scorch the leaf. ' +
          'On the panicle neck a black girdle forms, the neck breaks and grains stay empty. Cool nights, heavy dew ' +
          'and excess nitrogen make it spread fast.',
        organic: [
          'रोग-रोधी किस्में लगाएँ',
          'बीज उपचार स्यूडोमोनास फ्लोरेसेंस से — लगभग 10 ग्राम प्रति किलो बीज',
          'नीम की खली खेत में डालें',
        ],
        chemical: [
          'ट्राइसाइक्लाज़ोल 75 WP — लगभग 0.6 ग्राम प्रति लीटर पानी',
          'या आइसोप्रोथियोलेन 40 EC — लगभग 1.5 मि.ली. प्रति लीटर पानी',
          'बाली निकलने पर दूसरा छिड़काव — गर्दन ब्लास्ट रोकने के लिए',
        ],
        prevention: [
          'यूरिया एक साथ न डालें, दो-तीन बार में बाँटकर दें',
          'बहुत घनी रोपाई न करें, हवा चलने दें',
          'खेत में लगातार पानी खड़ा न रखें',
          'रोगग्रस्त पुआल और ठूँठ जला दें या खेत से हटा दें',
        ],
        speech:
          'पहचाना गया रोग है झोंका रोग, जिसे ब्लास्ट कहते हैं। यह धान का सबसे नुकसानदेह रोग है। ' +
          'इसमें पत्तियों पर आँख या नाव जैसे धब्बे बनते हैं, बीच में राख जैसा रंग और किनारा गहरा भूरा। ' +
          'सबसे खतरनाक है बाली की गर्दन पर काला घेरा, क्योंकि उससे बाली टूट जाती है और दाने खाली रह जाते हैं। ' +
          'अभी करने वाला काम यह है कि ट्राइसाइक्लाज़ोल लगभग शून्य दशमलव छह ग्राम प्रति लीटर पानी में छिड़कें। ' +
          'यूरिया डालना तुरंत बंद कर दीजिए, क्योंकि ज़्यादा यूरिया इस रोग को और भड़काता है। ' +
          'बाली निकलने के समय एक छिड़काव ज़रूर करें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_Bacterialblight: {
        nameHi: 'जीवाणु झुलसा',
        nameEn: 'Bacterial Leaf Blight (BLB)',
        pathogen: 'जीवाणु / Bacteria — Xanthomonas oryzae pv. oryzae',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह जीवाणु रोग है, फफूंदनाशक (मैंकोज़ेब आदि) इस पर काम नहीं करते। ' +
          'पैसा बचाइए — फफूंदनाशक मत छिड़किए।',
        actions: [
          'खेत का पानी निकाल दें, कुछ दिन खेत सुखाएँ',
          'यूरिया देना तुरंत बंद करें',
          'स्ट्रेप्टोसाइक्लिन + कॉपर ऑक्सीक्लोराइड का घोल छिड़कें',
        ],
        symptoms:
          'पत्ती के सिरे या किनारे से पीली-सी लहरदार धारी शुरू होकर नीचे की ओर बढ़ती है, फिर पत्ती सूखकर भूसे जैसी हो जाती है। ' +
          'सुबह-सुबह कटी हुई पत्ती को पानी में डालें तो दूधिया धुँआ जैसा जीवाणु का रिसाव दिखता है — यही पक्की पहचान है। ' +
          'नए पौधों में पूरा पौधा मुरझा जाए तो उसे क्रेसेक कहते हैं। बाढ़, तेज़ हवा और ज़्यादा यूरिया इसे फैलाते हैं।',
        symptomsEn:
          'Wavy yellow streaks start at the leaf tip or margin and move down until the leaf dries straw-coloured. ' +
          'A cut leaf dipped in water shows milky bacterial ooze — the confirming test. Flooding, strong wind and ' +
          'excess nitrogen spread it.',
        organic: [
          'रोग-रोधी किस्में लगाएँ',
          'बीज को 52–54°C गर्म पानी में 30 मिनट डुबोकर बोएँ',
          'खेत में पोटाश दें, नाइट्रोजन कम रखें',
        ],
        chemical: [
          'स्ट्रेप्टोसाइक्लिन लगभग 0.15 ग्राम + कॉपर ऑक्सीक्लोराइड लगभग 2.5 ग्राम प्रति लीटर पानी',
          'ज़रूरत हो तो 10 दिन बाद दोहराएँ',
          'फफूंदनाशक बेकार हैं — इन पर पैसा न लगाएँ',
        ],
        prevention: [
          'रोपाई के समय पत्तियों की नोक न काटें, घाव से जीवाणु घुसता है',
          'खेत का पानी दूसरे खेत में न जाने दें',
          'यूरिया बाँटकर दें, एक साथ ज़्यादा नहीं',
          'रोगग्रस्त खेत का बीज अगली बार न लें',
        ],
        speech:
          'पहचाना गया रोग है जीवाणु झुलसा, जिसे बी एल बी कहते हैं। ' +
          'इसमें पत्ती के सिरे या किनारे से पीली लहरदार धारी शुरू होकर नीचे बढ़ती है और पत्ती भूसे जैसी सूख जाती है। ' +
          'ध्यान से सुनिए — यह जीवाणु का रोग है, इसलिए मैंकोज़ेब जैसे फफूंदनाशक इस पर बिल्कुल काम नहीं करते, उन पर पैसा मत लगाइए। ' +
          'अभी करने वाला काम यह है कि खेत का पानी निकालकर कुछ दिन खेत सुखा दें, यूरिया देना तुरंत बंद करें, ' +
          'और स्ट्रेप्टोसाइक्लिन लगभग शून्य दशमलव एक पाँच ग्राम के साथ कॉपर ऑक्सीक्लोराइड लगभग ढाई ग्राम प्रति लीटर पानी में मिलाकर छिड़कें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_tungro: {
        nameHi: 'टुंग्रो रोग',
        nameEn: 'Tungro Virus',
        pathogen: 'विषाणु / Virus — RTBV + RTSV, हरे फुदके से फैलता है',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'विषाणु रोग का कोई इलाज नहीं है। बचाव सिर्फ एक है — फैलाने वाले हरे फुदके को रोकना ' +
          'और रोगी पौधे उखाड़ देना।',
        actions: [
          'रोगग्रस्त पौधे जड़ सहित उखाड़कर खेत से बाहर गाड़ या जला दें',
          'हरे फुदके के लिए इमिडाक्लोप्रिड लगभग 0.3 मि.ली. प्रति लीटर पानी छिड़कें',
          'आसपास के खेतों वालों को भी बताएँ — यह खेत से खेत फैलता है',
        ],
        symptoms:
          'पौधा बौना रह जाता है और पत्तियाँ पीली से नारंगी-पीली हो जाती हैं, खासकर नई पत्तियाँ। ' +
          'पीलापन पत्ती की नोक से शुरू होकर नीचे आता है। कल्ले कम बनते हैं और बालियाँ छोटी, खाली रह जाती हैं। ' +
          'खेत में रोग अक्सर धब्बों (patches) में दिखता है, पूरे खेत में एक साथ नहीं।',
        symptomsEn:
          'Plants stay stunted with yellow to orange-yellow leaves, discolouring from the tip downward. Tillering is ' +
          'poor and panicles stay small and unfilled. Usually appears in patches across the field.',
        organic: [
          'रोग-रोधी किस्में लगाएँ',
          'खेत के किनारे गेंदा या तुलसी लगाएँ, मित्र कीट बढ़ते हैं',
          'रोपाई का समय एक साथ रखें, ताकि फुदके को लगातार फसल न मिले',
        ],
        chemical: [
          'इमिडाक्लोप्रिड 17.8 SL — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'या थायामेथोक्सम 25 WG — लगभग 0.2 ग्राम प्रति लीटर पानी',
          'सीधे विषाणु की कोई दवा नहीं है — सिर्फ फुदका मारना है',
        ],
        prevention: [
          'नर्सरी में ही फुदके का नियंत्रण कर लें',
          'रोगग्रस्त खेत के आसपास से पौध न लें',
          'खेत और मेड़ की घास-फूस साफ रखें',
          'लगातार धान न लें, बीच में दूसरी फसल लें',
        ],
        speech:
          'पहचाना गया रोग है टुंग्रो, जो एक विषाणु रोग है और हरे फुदके नाम के कीट से फैलता है। ' +
          'इसमें पौधा बौना रह जाता है और पत्तियाँ पीली से नारंगी पीली हो जाती हैं, कल्ले कम बनते हैं और बालियाँ खाली रहती हैं। ' +
          'ध्यान रखिए, विषाणु रोग का कोई सीधा इलाज नहीं होता। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त पौधों को जड़ सहित उखाड़कर खेत से बाहर गाड़ दें या जला दें, ' +
          'और हरे फुदके को रोकने के लिए इमिडाक्लोप्रिड लगभग शून्य दशमलव तीन मिलीलीटर प्रति लीटर पानी में छिड़कें। ' +
          'आसपास के किसानों को भी बता दीजिए, क्योंकि यह एक खेत से दूसरे खेत फैलता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_leaf_smut: {
        nameHi: 'पत्ती कण्ड',
        nameEn: 'Leaf Smut',
        pathogen: 'कवक / Fungus — Entyloma oryzae',
        severity: 'low', severityHi: 'कम नुकसान',
        risk: 'low', riskHi: 'कम जोखिम / Low Risk',
        note:
          'यह रोग आमतौर पर उपज को ज़्यादा नुकसान नहीं पहुँचाता। घबराने और महँगी दवा छिड़कने की ज़रूरत नहीं — ' +
          'बहुत ज़्यादा फैला हो तभी छिड़काव करें।',
        actions: [
          'हल्का रोग हो तो कोई छिड़काव न करें, सिर्फ निगरानी रखें',
          'ज़्यादा फैले तो प्रोपिकोनाज़ोल लगभग 1 मि.ली. प्रति लीटर पानी',
          'नाइट्रोजन ज़्यादा न दें',
        ],
        symptoms:
          'पत्तियों की दोनों सतहों पर छोटे, काले, आयताकार या कोणीय दाग बनते हैं जो पत्ती की नसों के समानांतर होते हैं। ' +
          'दाग उभरे हुए लगते हैं और उँगली से रगड़ने पर काला चूर्ण निकलता है। ' +
          'पत्तियाँ ज़्यादा प्रभावित हों तो सिरे से सूखने लगती हैं। रोग अक्सर फसल पकने के आसपास दिखता है।',
        symptomsEn:
          'Small black angular spots on both leaf surfaces, running parallel to the veins and slightly raised; ' +
          'rubbing releases black powder. Tips may dry when severe. Usually appears late in the season.',
        organic: [
          'बीज उपचार ट्राइकोडर्मा से — लगभग 5–10 ग्राम प्रति किलो बीज',
          'खेत की सफाई और संतुलित खाद',
          'कटाई के बाद ठूँठ और पुआल खेत से हटा दें',
        ],
        chemical: [
          'प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी (सिर्फ ज़्यादा रोग में)',
          'या मैंकोज़ेब 75 WP — लगभग 2 ग्राम प्रति लीटर पानी',
        ],
        prevention: [
          'नाइट्रोजन संतुलित रखें',
          'स्वस्थ बीज बोएँ',
          'खेत में पानी का सही निकास रखें',
          'रोगग्रस्त अवशेष खेत में न छोड़ें',
        ],
        speech:
          'पहचाना गया रोग है पत्ती कण्ड, जिसे लीफ स्मट कहते हैं। ' +
          'इसमें पत्तियों पर छोटे काले आयताकार दाग बनते हैं जो नसों के साथ-साथ होते हैं, और रगड़ने पर काला चूर्ण निकलता है। ' +
          'अच्छी बात यह है कि इससे उपज को आमतौर पर ज़्यादा नुकसान नहीं होता, इसलिए घबराने की ज़रूरत नहीं है। ' +
          'हल्का रोग हो तो कोई दवा मत छिड़किए, सिर्फ निगरानी रखिए। ' +
          'अगर बहुत ज़्यादा फैल गया हो तभी प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी में छिड़कें। ' +
          'नाइट्रोजन ज़्यादा मत दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      /* NOTE: model me yeh 'rice_brownspot' (index 0) ka duplicate hai.     */
      rice_brown_spot: {
        nameHi: 'भूरा धब्बा रोग',
        nameEn: 'Brown Spot',
        pathogen: 'कवक / Fungus — Bipolaris oryzae',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'मैंकोज़ेब 75 WP लगभग 2 ग्राम प्रति लीटर पानी में छिड़कें',
          'खेत में पोटाश की कमी पूरी करें',
          '10–12 दिन बाद ज़रूरत हो तो दूसरा छिड़काव करें',
        ],
        symptoms:
          'पत्तियों पर तिल जैसे छोटे भूरे धब्बे, बीच हल्का भूरा और किनारा गहरा भूरा। ' +
          'धब्बे पूरी पत्ती पर बिखरे रहते हैं और ज़्यादा रोग में दाने भी दागी हो जाते हैं। ' +
          'कमज़ोर और पोटाश की कमी वाली मिट्टी में सबसे ज़्यादा आता है।',
        symptomsEn:
          'Small oval brown sesame-like spots with light centres and dark margins scattered over the leaf; ' +
          'grains get stained when severe. Most common on poor, potash-deficient soils.',
        organic: [
          'बीज को 52°C गर्म पानी में 10 मिनट डुबोकर बोएँ',
          'ट्राइकोडर्मा से बीज उपचार — लगभग 5–10 ग्राम प्रति किलो बीज',
          'गोबर की सड़ी खाद और पोटाश दें',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2 ग्राम प्रति लीटर पानी',
          'या प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
        ],
        prevention: [
          'संतुलित खाद, खासकर पोटाश',
          'स्वस्थ प्रमाणित बीज',
          'सूखा तनाव न आने दें',
          'रोगग्रस्त पुआल खेत में न छोड़ें',
        ],
        speech:
          'पहचाना गया रोग है भूरा धब्बा, जिसे ब्राउन स्पॉट कहते हैं। ' +
          'इसमें पत्तियों पर तिल जैसे छोटे भूरे धब्बे बनते हैं और यह अक्सर कमज़ोर मिट्टी में आता है। ' +
          'अभी करने वाला काम यह है कि मैंकोज़ेब लगभग दो ग्राम प्रति लीटर पानी में छिड़कें और खेत में पोटाश की कमी पूरी करें। ' +
          'दस से बारह दिन बाद ज़रूरत हो तो दूसरा छिड़काव कर लें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_healthy_leafs: {
        nameHi: 'स्वस्थ पत्ती',
        nameEn: 'Healthy Leaf',
        pathogen: '—',
        severity: 'none', severityHi: 'कोई नुकसान नहीं',
        risk: 'none', riskHi: 'कोई जोखिम नहीं / No Risk',
        actions: [
          'कोई दवा छिड़कने की ज़रूरत नहीं',
          'हर 7–10 दिन पर खेत घूमकर जाँच करते रहें',
          'खाद और पानी समय पर देते रहें',
        ],
        symptoms:
          'पत्ती एक-समान हरी है, उस पर कोई धब्बा, धारी, पीलापन या झुलसन नहीं दिख रही। ' +
          'फसल स्वस्थ लग रही है — अभी किसी उपचार की ज़रूरत नहीं है।',
        symptomsEn:
          'The leaf is uniformly green with no spots, streaks, yellowing or scorching. The crop looks healthy and ' +
          'needs no treatment right now.',
        organic: [
          'गोबर की सड़ी खाद और हरी खाद देते रहें',
          'खेत के किनारे गेंदा लगाएँ, मित्र कीट बढ़ते हैं',
        ],
        chemical: [
          'अभी किसी रासायनिक दवा की ज़रूरत नहीं',
        ],
        prevention: [
          'संतुलित खाद दें, यूरिया एक साथ न डालें',
          'खेत में पानी का सही निकास रखें',
          'हर हफ्ते खेत में 10 जगह घूमकर पत्तियाँ देखें',
        ],
        speech:
          'खुशखबरी! पत्ती स्वस्थ दिख रही है, इस पर कोई रोग नहीं मिला। ' +
          'अभी कोई दवा छिड़कने की ज़रूरत नहीं है, बेकार में पैसा मत लगाइए। ' +
          'बस हर सात से दस दिन पर खेत में घूमकर पत्तियाँ देखते रहिए, ' +
          'खाद और पानी समय पर देते रहिए, और यूरिया एक साथ डालने से बचिए। ' +
          'कुछ भी बदला हुआ दिखे तो इस ऐप से दोबारा जाँच कर लीजिए।',
      },

      /* ------------------------------------------------------------------ */
      rice_bakanae: {
        nameHi: 'बकाने रोग',
        nameEn: 'Bakanae / Foolish Seedling',
        pathogen: 'कवक / Fungus — Fusarium fujikuroi',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह बीज से आने वाला रोग है। खड़ी फसल में इलाज लगभग नहीं है — ' +
          'असली बचाव अगली बार बीज उपचार करना है।',
        actions: [
          'असामान्य रूप से लंबे, पीले पौधे जड़ सहित उखाड़कर खेत से बाहर करें',
          'खड़ी फसल में छिड़काव से खास फायदा नहीं — पौधे हटाना ही मुख्य उपाय है',
          'अगली बुवाई के लिए इसी खेत का बीज बिल्कुल न रखें',
        ],
        symptoms:
          'रोगी पौधे बाकी पौधों से बहुत ज़्यादा लंबे और पतले हो जाते हैं, पत्तियाँ हल्की पीली-हरी दिखती हैं। ' +
          'ऐसे पौधे कमज़ोर होकर सूख जाते हैं और उनमें दाने नहीं बनते। तने की गाँठों से कभी-कभी सफेद फफूंद और जड़ें निकलती दिखती हैं। ' +
          'रोग नर्सरी से ही साथ आता है और रोपाई के बाद खेत में साफ दिखने लगता है।',
        symptomsEn:
          'Affected plants grow abnormally tall and thin with pale yellow-green leaves, then weaken and die without ' +
          'setting grain. White fungal growth and adventitious roots may appear at the nodes. The disease is ' +
          'seed-borne and shows up after transplanting.',
        organic: [
          'बीज को नमक के पानी में डालकर तैरते हल्के बीज हटा दें',
          'बीज को 52–54°C गर्म पानी में 15 मिनट डुबोएँ',
          'ट्राइकोडर्मा से बीज उपचार — लगभग 10 ग्राम प्रति किलो बीज',
        ],
        chemical: [
          'बीज उपचार: कार्बेन्डाजिम लगभग 2 ग्राम प्रति किलो बीज (8–10 घंटे भिगोएँ)',
          'या थायरम + कार्बोक्सिन मिश्रण — लगभग 2 ग्राम प्रति किलो बीज',
          'खड़ी फसल में छिड़काव का फायदा बहुत कम है',
        ],
        prevention: [
          'हमेशा प्रमाणित और उपचारित बीज ही बोएँ',
          'रोगग्रस्त खेत का बीज अगली बार न रखें',
          'नर्सरी में ही लंबे-पीले पौधे निकाल दें',
          'नर्सरी की मिट्टी बदलते रहें',
        ],
        speech:
          'पहचाना गया रोग है बकाने रोग, जिसे फूलिश सीडलिंग भी कहते हैं। ' +
          'इसमें रोगी पौधे बाकी पौधों से बहुत ज़्यादा लंबे और पतले हो जाते हैं और पत्तियाँ हल्की पीली दिखती हैं, ' +
          'फिर ऐसे पौधे सूख जाते हैं और उनमें दाने नहीं बनते। ' +
          'ध्यान रखिए, यह रोग बीज से आता है और खड़ी फसल में इसका इलाज लगभग नहीं है। ' +
          'अभी करने वाला काम यह है कि ऐसे लंबे पीले पौधों को जड़ सहित उखाड़कर खेत से बाहर कर दें। ' +
          'सबसे ज़रूरी बात, इस खेत का बीज अगली बार बिल्कुल मत रखिए, ' +
          'और अगली बार बीज को गर्म पानी या कार्बेन्डाजिम लगभग दो ग्राम प्रति किलो से उपचारित करके ही बोइए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_ragged_virus: {
        nameHi: 'रैग्ड स्टंट विषाणु',
        nameEn: 'Ragged Stunt Virus',
        pathogen: 'विषाणु / Virus — RRSV, भूरे फुदके से फैलता है',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'विषाणु रोग का सीधा इलाज नहीं है। बचाव सिर्फ भूरे फुदके को रोकने और ' +
          'रोगी पौधे हटाने से होता है।',
        actions: [
          'रोगग्रस्त पौधे जड़ सहित उखाड़कर खेत से बाहर करें',
          'भूरे फुदके के लिए पाइमेट्रोज़िन लगभग 0.6 ग्राम प्रति लीटर पानी छिड़कें',
          'खेत का पानी निकालकर 2–3 दिन सुखाएँ, इससे फुदका घटता है',
        ],
        symptoms:
          'पौधा बौना रह जाता है और पत्तियों के किनारे फटे-कटे (ragged) दिखते हैं, जैसे किसी ने कतर दिया हो। ' +
          'पत्तियाँ मुड़ी और टेढ़ी होती हैं, नसों पर छोटी-छोटी गाँठें (vein swellings) उभर आती हैं। ' +
          'बालियाँ ठीक से बाहर नहीं निकलतीं और दाने खाली रह जाते हैं। यह भूरे फुदके के प्रकोप वाले खेतों में आता है।',
        symptomsEn:
          'Plants stay stunted with ragged, notched and twisted leaf margins and small swellings along the veins. ' +
          'Panicles fail to emerge properly and grains stay unfilled. Seen where brown planthopper is heavy.',
        organic: [
          'रोग-रोधी किस्में लगाएँ',
          'खेत में मकड़ी और मित्र कीट बचाएँ — बेवजह कीटनाशक न छिड़कें',
          'रोपाई एक साथ करें',
        ],
        chemical: [
          'पाइमेट्रोज़िन 50 WG — लगभग 0.6 ग्राम प्रति लीटर पानी',
          'या डाइनोटेफ्यूरान 20 SG — लगभग 0.4 ग्राम प्रति लीटर पानी',
          'विषाणु की कोई सीधी दवा नहीं है',
        ],
        prevention: [
          'भूरे फुदके पर शुरू से नज़र रखें, तने के पास जड़ के ऊपर देखें',
          'बहुत घनी रोपाई न करें',
          'नाइट्रोजन ज़्यादा न दें, इससे फुदका बढ़ता है',
          'खेत की मेड़ साफ रखें',
        ],
        speech:
          'पहचाना गया रोग है रैग्ड स्टंट विषाणु। यह भूरे फुदके नाम के कीट से फैलता है। ' +
          'इसमें पौधा बौना रह जाता है, पत्तियों के किनारे फटे-कटे दिखते हैं और नसों पर छोटी गाँठें उभर आती हैं, ' +
          'और बालियाँ ठीक से बाहर नहीं निकलतीं। ' +
          'ध्यान रखिए, विषाणु रोग की कोई सीधी दवा नहीं होती। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त पौधे जड़ सहित उखाड़कर खेत से बाहर कर दें, ' +
          'भूरे फुदके के लिए पाइमेट्रोज़िन लगभग शून्य दशमलव छह ग्राम प्रति लीटर पानी में छिड़कें, ' +
          'और खेत का पानी निकालकर दो तीन दिन खेत सुखा दें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_sheath_rot: {
        nameHi: 'आवरण सड़न (शीथ रॉट)',
        nameEn: 'Sheath Rot',
        pathogen: 'कवक / Fungus — Sarocladium oryzae',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'प्रोपिकोनाज़ोल लगभग 1 मि.ली. प्रति लीटर पानी में छिड़कें',
          'बाली निकलने से ठीक पहले छिड़काव करें — तभी सबसे ज़्यादा फायदा है',
          'खेत में पानी खड़ा न रखें, नाइट्रोजन घटाएँ',
        ],
        symptoms:
          'सबसे ऊपर वाली पत्ती के आवरण (जिसमें बाली बंद रहती है) पर भूरे या गहरे लाल-भूरे अनियमित धब्बे बनते हैं। ' +
          'आवरण खोलने पर अंदर सफेद पाउडर जैसी फफूंद दिखती है और बाली पूरी बाहर नहीं निकल पाती — आधी अंदर ही फँसी रह जाती है। ' +
          'दाने काले-भूरे और खाली रह जाते हैं। घनी फसल, ज़्यादा नमी और तना छेदक के घाव इसे बढ़ाते हैं।',
        symptomsEn:
          'Irregular brown to reddish-brown lesions on the flag leaf sheath enclosing the panicle. Opening the sheath ' +
          'shows white powdery fungal growth and the panicle stays partly trapped inside. Grains turn dark and remain ' +
          'unfilled. Dense stands, high humidity and borer injury worsen it.',
        organic: [
          'स्यूडोमोनास फ्लोरेसेंस से बीज उपचार — लगभग 10 ग्राम प्रति किलो बीज',
          'खेत के किनारे हवा चलने की जगह छोड़ें',
          'संतुलित पोटाश दें',
        ],
        chemical: [
          'प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'या कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी',
          'बाली निकलने के समय ही छिड़काव सबसे असरदार है',
        ],
        prevention: [
          'बहुत घनी रोपाई न करें',
          'नाइट्रोजन बाँटकर दें',
          'तना छेदक नियंत्रित करें, घाव से फफूंद घुसता है',
          'रोगग्रस्त पुआल खेत में न छोड़ें',
        ],
        speech:
          'पहचाना गया रोग है आवरण सड़न, जिसे शीथ रॉट कहते हैं। ' +
          'इसमें सबसे ऊपर वाली पत्ती के आवरण पर भूरे या लाल भूरे धब्बे बनते हैं, अंदर सफेद पाउडर जैसी फफूंद दिखती है, ' +
          'और बाली पूरी बाहर नहीं निकल पाती, आधी अंदर ही फँसी रह जाती है। ' +
          'अभी करने वाला काम यह है कि प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी में मिलाकर छिड़कें, ' +
          'और यह छिड़काव बाली निकलने से ठीक पहले करें, तभी सबसे ज़्यादा फायदा होता है। ' +
          'खेत में पानी खड़ा मत रखिए और नाइट्रोजन कम कर दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_stem_rot: {
        nameHi: 'तना सड़न',
        nameEn: 'Stem Rot',
        pathogen: 'कवक / Fungus — Sclerotium oryzae',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'खेत का पानी निकालकर कुछ दिन सुखाएँ — यही सबसे असरदार उपाय है',
          'हेक्साकोनाज़ोल लगभग 2 मि.ली. प्रति लीटर पानी, तने के निचले हिस्से पर',
          'पोटाश डालें, नाइट्रोजन घटाएँ',
        ],
        symptoms:
          'पानी की सतह के पास तने पर काले-भूरे धब्बे बनते हैं जो बढ़कर तने को घेर लेते हैं। ' +
          'तना अंदर से गल जाता है और पौधा गिर जाता है (lodging)। ' +
          'तने को चीरकर देखें तो अंदर सरसों के दाने जैसी बहुत छोटी काली गोलियाँ (sclerotia) दिखती हैं — यही पक्की पहचान है। ' +
          'लगातार पानी भरा रहना और ज़्यादा नाइट्रोजन इसे बढ़ाते हैं।',
        symptomsEn:
          'Black-brown lesions at the waterline girdle the stem, which rots inside and the plant lodges. Splitting ' +
          'the stem reveals tiny black mustard-seed-like sclerotia — the confirming sign. Continuous flooding and ' +
          'high nitrogen worsen it.',
        organic: [
          'ट्राइकोडर्मा गोबर की खाद में मिलाकर खेत में डालें',
          'खेत को बीच-बीच में सुखाएँ (alternate wetting and drying)',
          'पोटाश और सिलिकॉन (धान की भूसी की राख) दें',
        ],
        chemical: [
          'हेक्साकोनाज़ोल 5 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'या वैलिडामाइसिन 3 L — लगभग 2 मि.ली. प्रति लीटर पानी',
          'छिड़काव तने के निचले हिस्से पर करें, सिर्फ पत्तियों पर नहीं',
        ],
        prevention: [
          'कटाई के बाद ठूँठ जला दें या गहरी जुताई कर दें — sclerotia वहीं बचते हैं',
          'लगातार पानी न भरे रखें',
          'नाइट्रोजन कम, पोटाश ज़्यादा',
          'फसल चक्र अपनाएँ',
        ],
        speech:
          'पहचाना गया रोग है तना सड़न, जिसे स्टेम रॉट कहते हैं। ' +
          'इसमें पानी की सतह के पास तने पर काले भूरे धब्बे बनते हैं, तना अंदर से गल जाता है और पौधा गिर जाता है। ' +
          'तने को चीरकर देखिए, अंदर सरसों के दाने जैसी छोटी काली गोलियाँ दिखेंगी, यही पक्की पहचान है। ' +
          'अभी करने वाला काम यह है कि खेत का पानी निकालकर कुछ दिन खेत सुखा दें, यही सबसे असरदार उपाय है। ' +
          'साथ में हेक्साकोनाज़ोल लगभग दो मिलीलीटर प्रति लीटर पानी में मिलाकर तने के निचले हिस्से पर छिड़कें। ' +
          'पोटाश डालिए और नाइट्रोजन घटा दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_sheath_blight: {
        nameHi: 'आवरण झुलसा (शीथ ब्लाइट)',
        nameEn: 'Sheath Blight',
        pathogen: 'कवक / Fungus — Rhizoctonia solani',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'वैलिडामाइसिन लगभग 2 मि.ली. या हेक्साकोनाज़ोल लगभग 2 मि.ली. प्रति लीटर पानी',
          'छिड़काव तने के निचले हिस्से और आवरण पर करें, सिर्फ ऊपर की पत्तियों पर नहीं',
          'यूरिया रोक दें, खेत का पानी घटाएँ',
        ],
        symptoms:
          'पानी की सतह के पास पत्ती के आवरण पर हरे-भूरे, अंडाकार धब्बे बनते हैं जिनका बीच राख जैसा सफेद और किनारा गहरा भूरा होता है — ' +
          'धब्बे साँप की केंचुल जैसे लगते हैं। धब्बे ऊपर की ओर चढ़ते जाते हैं और पत्तियाँ सूख जाती हैं। ' +
          'नमी में आवरण पर सफेद रुई जैसी फफूंद और बाद में सरसों जैसे भूरे दाने (sclerotia) दिखते हैं। ' +
          'घनी फसल और ज़्यादा यूरिया इसे तेज़ी से बढ़ाते हैं।',
        symptomsEn:
          'Oval greenish-grey lesions with ash-white centres and dark brown borders on the sheath near the waterline, ' +
          'looking like snake skin, climbing upward until leaves dry. White mycelium and brown mustard-like sclerotia ' +
          'appear in humid weather. Dense planting and excess urea accelerate it.',
        organic: [
          'ट्राइकोडर्मा या स्यूडोमोनास का छिड़काव और मिट्टी में प्रयोग',
          'बहुत घनी रोपाई से बचें, कतार में रोपाई करें',
          'पोटाश और सिलिकॉन दें',
        ],
        chemical: [
          'वैलिडामाइसिन 3 L — लगभग 2 मि.ली. प्रति लीटर पानी',
          'या हेक्साकोनाज़ोल 5 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'ज़रूरत हो तो 12–15 दिन बाद दोहराएँ',
        ],
        prevention: [
          'यूरिया बाँटकर दें, एक साथ ज़्यादा नहीं',
          'कतार में रोपाई करें ताकि हवा चले',
          'खेत की मेड़ की घास साफ रखें',
          'कटाई के बाद ठूँठ और पुआल हटाएँ या गहरी जुताई करें',
        ],
        speech:
          'पहचाना गया रोग है आवरण झुलसा, जिसे शीथ ब्लाइट कहते हैं। ' +
          'इसमें पानी की सतह के पास आवरण पर अंडाकार धब्बे बनते हैं, जिनका बीच राख जैसा और किनारा गहरा भूरा होता है, ' +
          'देखने में साँप की केंचुल जैसे लगते हैं, और ये धब्बे ऊपर की ओर चढ़ते जाते हैं। ' +
          'अभी करने वाला काम यह है कि वैलिडामाइसिन लगभग दो मिलीलीटर या हेक्साकोनाज़ोल लगभग दो मिलीलीटर प्रति लीटर पानी में मिलाकर छिड़कें, ' +
          'और छिड़काव तने के निचले हिस्से और आवरण पर करें, सिर्फ ऊपर की पत्तियों पर नहीं। ' +
          'यूरिया देना रोक दीजिए और खेत का पानी घटा दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_green_leafhopper: {
        nameHi: 'हरा फुदका',
        nameEn: 'Green Leafhopper',
        pathogen: 'कीट / Insect — Nephotettix spp.',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह कीट खुद से जितना नुकसान करता है, उससे कहीं ज़्यादा खतरनाक है इसका टुंग्रो विषाणु फैलाना। ' +
          'इसे रोकना यानी टुंग्रो से बचना।',
        actions: [
          'इमिडाक्लोप्रिड लगभग 0.3 मि.ली. प्रति लीटर पानी में छिड़कें',
          'खेत में पीले चिपचिपे कार्ड (yellow sticky trap) लगाएँ',
          'टुंग्रो के लक्षण (पीले-नारंगी बौने पौधे) भी साथ में देखते रहें',
        ],
        symptoms:
          'हल्के हरे रंग के छोटे फुदकने वाले कीट पत्तियों पर बैठे दिखते हैं और छूने पर तेज़ी से कूदते हैं। ' +
          'ये पत्तियों का रस चूसते हैं जिससे पत्तियाँ पीली पड़ने लगती हैं और पौधे की बढ़त रुक जाती है। ' +
          'ज़्यादा प्रकोप में पत्तियाँ सिरे से सूखने लगती हैं। सबसे बड़ा खतरा यह है कि यही कीट टुंग्रो विषाणु फैलाता है।',
        symptomsEn:
          'Small pale-green hoppers rest on the leaves and jump away when disturbed. Their sap-sucking yellows the ' +
          'leaves and stunts growth, with tip drying when severe. Most importantly, this insect transmits tungro virus.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी में छिड़कें',
          'खेत के किनारे गेंदा लगाएँ, मित्र कीट बढ़ते हैं',
          'मकड़ियों को बचाएँ — ये फुदके की सबसे बड़ी दुश्मन हैं',
          'शाम को रोशनी वाला जाल (light trap) लगाएँ',
        ],
        chemical: [
          'इमिडाक्लोप्रिड 17.8 SL — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'या थायामेथोक्सम 25 WG — लगभग 0.2 ग्राम प्रति लीटर पानी',
          'एक ही दवा बार-बार न दोहराएँ, बदल-बदल कर लगाएँ',
        ],
        prevention: [
          'रोपाई एक साथ करें, ताकि कीट को लगातार फसल न मिले',
          'नाइट्रोजन ज़्यादा न दें — मुलायम पत्ती कीट को बुलाती है',
          'खेत और मेड़ की घास साफ रखें',
          'नर्सरी में ही नियंत्रण कर लें',
        ],
        speech:
          'पहचाना गया है हरा फुदका, जिसे ग्रीन लीफहॉपर कहते हैं। यह एक कीट है, रोग नहीं। ' +
          'ये हल्के हरे छोटे कीट पत्तियों का रस चूसते हैं जिससे पत्तियाँ पीली पड़ती हैं और पौधे की बढ़त रुक जाती है। ' +
          'सबसे बड़ी बात यह है कि यही कीट टुंग्रो विषाणु फैलाता है, इसलिए इसे रोकना बहुत ज़रूरी है। ' +
          'अभी करने वाला काम यह है कि इमिडाक्लोप्रिड लगभग शून्य दशमलव तीन मिलीलीटर प्रति लीटर पानी में छिड़कें, ' +
          'खेत में पीले चिपचिपे कार्ड लगाएँ, और नीम का तेल लगभग पाँच मिलीलीटर प्रति लीटर भी काम आता है। ' +
          'नाइट्रोजन ज़्यादा मत दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_bug: {
        nameHi: 'गंधी बग',
        nameEn: 'Rice Ear Bug / Gundhi Bug',
        pathogen: 'कीट / Insect — Leptocorisa spp.',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'दूधिया दाने की अवस्था में मैलाथियान 5% धूल सुबह ओस पर बुरकें',
          'या लैम्ब्डा-साइहैलोथ्रिन लगभग 1 मि.ली. प्रति लीटर पानी छिड़कें',
          'पूरे इलाके में एक साथ नियंत्रण करें — यह उड़कर खेत बदलता है',
        ],
        symptoms:
          'खेत में घुसते ही तेज़, बदबूदार गंध आती है — यही सबसे पहली पहचान है, इसीलिए इसे गंधी बग कहते हैं। ' +
          'पतले, लंबे हरे-भूरे कीट बालियों पर बैठे दिखते हैं और दूधिया दानों का रस चूसते हैं। ' +
          'चूसे हुए दाने खाली, सिकुड़े और दागी रह जाते हैं, और बाली खड़ी की खड़ी रह जाती है। ' +
          'नुकसान सबसे ज़्यादा दूधिया अवस्था में होता है।',
        symptomsEn:
          'A strong foul smell on entering the field is the first clue. Slender green-brown bugs sit on the panicles ' +
          'and suck the milky grains, leaving them empty, shrivelled and discoloured. Damage peaks at the milk stage.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'खेत के किनारे मरी हुई मछली या केकड़े की गंध वाला जाल (traditional trap) लगाएँ',
          'खेत और मेड़ की घास साफ रखें — यहीं इनका ठिकाना है',
        ],
        chemical: [
          'मैलाथियान 5% धूल — लगभग 8–10 किलो प्रति एकड़, सुबह ओस पर',
          'या लैम्ब्डा-साइहैलोथ्रिन 5 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'दाना पकने के करीब हो तो प्रतीक्षा अवधि (waiting period) ज़रूर देखें',
        ],
        prevention: [
          'रोपाई एक साथ करें ताकि सब खेतों में बाली एक ही समय आए',
          'खेत की मेड़ और आसपास की घास काटते रहें',
          'खेत में नियमित घूमकर गंध और कीट देखें',
          'बालियाँ निकलते ही निगरानी शुरू कर दें',
        ],
        speech:
          'पहचाना गया है गंधी बग, जिसे राइस ईयर बग कहते हैं। यह एक कीट है। ' +
          'इसकी पहचान आसान है, खेत में घुसते ही तेज़ बदबू आती है, इसीलिए इसे गंधी बग कहते हैं। ' +
          'ये पतले लंबे हरे भूरे कीट बालियों पर बैठकर दूधिया दानों का रस चूस लेते हैं, जिससे दाने खाली और सिकुड़े रह जाते हैं। ' +
          'अभी करने वाला काम यह है कि दूधिया दाने की अवस्था में सुबह ओस के समय मैलाथियान पाँच प्रतिशत धूल बुरकें, ' +
          'या लैम्ब्डा साइहैलोथ्रिन लगभग एक मिलीलीटर प्रति लीटर पानी में छिड़कें। ' +
          'कोशिश कीजिए कि पूरे इलाके में एक साथ नियंत्रण हो, क्योंकि यह कीट उड़कर खेत बदलता रहता है। ' +
          'खेत की मेड़ की घास भी साफ रखिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_planthopper: {
        nameHi: 'भूरा फुदका',
        nameEn: 'Brown Planthopper (BPH)',
        pathogen: 'कीट / Insect — Nilaparvata lugens',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'ज़रूरी: सिंथेटिक पायरेथ्रॉइड (साइपरमेथ्रिन जैसी दवाएँ) इस कीट पर मत छिड़कें — ' +
          'ये इसके दुश्मन कीट मार देती हैं और फुदका और तेज़ी से बढ़ जाता है।',
        actions: [
          'खेत का पानी तुरंत निकाल दें और 3–4 दिन सुखाएँ',
          'पाइमेट्रोज़िन लगभग 0.6 ग्राम प्रति लीटर पानी, तने के निचले हिस्से पर छिड़कें',
          'यूरिया देना तुरंत बंद करें',
        ],
        symptoms:
          'भूरे रंग के छोटे कीट पानी की सतह के पास तने पर झुंड में चिपके रहते हैं — पत्तियाँ हटाकर नीचे देखिए। ' +
          'ये रस चूसते हैं जिससे पौधे गोल घेरे में पीले पड़कर सूख जाते हैं, इसे हॉपर बर्न कहते हैं। ' +
          'खेत में जगह-जगह जले हुए गोल धब्बे बन जाते हैं जो तेज़ी से फैलते हैं। ' +
          'घनी फसल, ज़्यादा यूरिया और लगातार भरा पानी इसे बढ़ाते हैं।',
        symptomsEn:
          'Brown hoppers cluster on the stem near the waterline. Their sap-sucking causes circular patches of ' +
          'yellowing and drying known as hopper burn, which spread rapidly. Dense stands, excess urea and continuous ' +
          'flooding favour it.',
        organic: [
          'खेत सुखाना सबसे असरदार गैर-रासायनिक उपाय है',
          'मकड़ी और मिरिड बग जैसे मित्र कीट बचाएँ',
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'हर 2–3 मीटर पर पैदल गली (alley) छोड़ें ताकि हवा चले',
        ],
        chemical: [
          'पाइमेट्रोज़िन 50 WG — लगभग 0.6 ग्राम प्रति लीटर पानी',
          'या डाइनोटेफ्यूरान 20 SG — लगभग 0.4 ग्राम प्रति लीटर पानी',
          'छिड़काव तने के निचले हिस्से पर करें, वहीं कीट बैठता है',
          'पायरेथ्रॉइड बिल्कुल न लगाएँ',
        ],
        prevention: [
          'यूरिया कम और बाँटकर दें',
          'घनी रोपाई न करें, बीच में गली छोड़ें',
          'हर हफ्ते तने के निचले हिस्से की जाँच करें',
          'रोग-रोधी किस्में लगाएँ',
        ],
        speech:
          'पहचाना गया है भूरा फुदका, जिसे ब्राउन प्लांटहॉपर या बी पी एच कहते हैं। यह धान का बहुत खतरनाक कीट है। ' +
          'ये भूरे छोटे कीट पानी की सतह के पास तने पर झुंड में चिपके रहते हैं, इसलिए पत्तियाँ हटाकर नीचे देखिए। ' +
          'इनके रस चूसने से पौधे गोल घेरे में पीले पड़कर सूख जाते हैं, इसे हॉपर बर्न कहते हैं। ' +
          'बहुत ज़रूरी बात, साइपरमेथ्रिन जैसी पायरेथ्रॉइड दवाएँ बिल्कुल मत छिड़किए, ' +
          'क्योंकि वे इसके दुश्मन कीट मार देती हैं और फुदका और बढ़ जाता है। ' +
          'अभी करने वाला काम यह है कि खेत का पानी तुरंत निकालकर तीन चार दिन खेत सुखा दें, ' +
          'पाइमेट्रोज़िन लगभग शून्य दशमलव छह ग्राम प्रति लीटर पानी में मिलाकर तने के निचले हिस्से पर छिड़कें, ' +
          'और यूरिया देना तुरंत बंद कर दें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      rice_leaf_roller: {
        nameHi: 'पत्ती लपेटक',
        nameEn: 'Leaf Folder',
        pathogen: 'कीट / Insect — Cnaphalocrocis medinalis',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'लपेटी हुई पत्तियाँ तोड़कर इल्ली सहित नष्ट करें',
          'ज़्यादा प्रकोप हो तो क्लोरएंट्रानिलिप्रोल लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'खेत में रस्सी घुमाकर (rope dragging) इल्लियाँ गिराएँ, फिर पानी निकाल दें',
        ],
        symptoms:
          'पत्तियाँ लंबाई में मुड़कर नली जैसी लिपट जाती हैं और किनारे रेशम के धागे से सिले दिखते हैं। ' +
          'लपेटी हुई पत्ती खोलने पर अंदर हरी-सी छोटी इल्ली मिलती है। ' +
          'इल्ली अंदर से पत्ती का हरा भाग खुरच देती है, इसलिए पत्ती पर सफेद-पारदर्शी धारियाँ बन जाती हैं और खेत सफेद-सा दिखने लगता है।',
        symptomsEn:
          'Leaves fold lengthwise into tubes stitched with silk; opening one reveals a small green caterpillar. ' +
          'It scrapes the green tissue from inside, leaving white transparent streaks that make the field look whitish.',
        organic: [
          'ट्राइकोग्रामा कार्ड खेत में लगाएँ',
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'बी.टी. (Bacillus thuringiensis) का छिड़काव',
          'खेत के किनारे गेंदा लगाएँ',
        ],
        chemical: [
          'क्लोरएंट्रानिलिप्रोल 18.5 SC — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'या फ्लूबेंडियामाइड 20 WG — लगभग 0.25 ग्राम प्रति लीटर पानी',
          'छिड़काव शाम को करें, तब इल्ली बाहर निकलती है',
        ],
        prevention: [
          'नाइट्रोजन ज़्यादा न दें',
          'घनी रोपाई से बचें',
          'खेत की मेड़ की घास साफ रखें',
          'रोशनी वाला जाल लगाकर पतंगे पकड़ें',
        ],
        speech:
          'पहचाना गया है पत्ती लपेटक, जिसे लीफ फोल्डर कहते हैं। यह एक कीट है। ' +
          'इसमें पत्तियाँ लंबाई में मुड़कर नली जैसी लिपट जाती हैं और किनारे रेशम के धागे से सिले दिखते हैं, ' +
          'और अंदर हरी छोटी इल्ली मिलती है जो पत्ती का हरा भाग खुरच देती है। ' +
          'अभी करने वाला काम यह है कि लपेटी हुई पत्तियाँ तोड़कर इल्ली सहित नष्ट कर दें, ' +
          'और खेत में रस्सी घुमाकर इल्लियाँ गिरा दें, फिर पानी निकाल दें। ' +
          'ज़्यादा प्रकोप हो तो क्लोरएंट्रानिलिप्रोल लगभग शून्य दशमलव तीन मिलीलीटर प्रति लीटर पानी में शाम को छिड़कें। ' +
          'नीम का तेल और ट्राइकोग्रामा कार्ड भी अच्छा काम करते हैं। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Rice_stem_borer: {
        nameHi: 'तना छेदक',
        nameEn: 'Stem Borer',
        pathogen: 'कीट / Insect — Scirpophaga incertulas',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'सूखे बीच वाले कल्ले (dead heart) खींचकर निकालें और नष्ट करें',
          'कार्टाप हाइड्रोक्लोराइड लगभग 2 ग्राम प्रति लीटर पानी छिड़कें',
          'खेत में अंडे के गुच्छे (पत्ती की नोक पर भूरे रोएँदार) देखकर हटाएँ',
        ],
        symptoms:
          'नए पौधों में बीच वाला कल्ला सूखकर पीला पड़ जाता है और खींचने पर आसानी से निकल आता है — इसे डेड हार्ट कहते हैं। ' +
          'बाली आने के बाद पूरी बाली सफेद, खाली और सीधी खड़ी रह जाती है — इसे व्हाइट ईयरहेड कहते हैं, और खींचने पर वह भी निकल आती है। ' +
          'तने को चीरकर देखें तो अंदर सुरंग और सफेद-पीली इल्ली मिलती है। पत्ती की नोक पर भूरे रोएँ से ढके अंडे के गुच्छे दिखते हैं।',
        symptomsEn:
          'The central shoot dries and yellows and pulls out easily — dead heart. After heading, whole panicles turn ' +
          'white, empty and erect — white earhead — and also pull out easily. Splitting the stem shows tunnels and a ' +
          'pale caterpillar. Brown hairy egg masses sit on leaf tips.',
        organic: [
          'ट्राइकोग्रामा जैपोनिकम कार्ड — 4–5 कार्ड प्रति एकड़, 15 दिन के अंतर पर',
          'खेत में पक्षियों के बैठने के लिए डंडे (bird perch) लगाएँ',
          'रोशनी वाला जाल लगाकर पतंगे पकड़ें',
          'कटाई के बाद ठूँठ गहरी जुताई से नष्ट करें',
        ],
        chemical: [
          'कार्टाप हाइड्रोक्लोराइड 50 SP — लगभग 2 ग्राम प्रति लीटर पानी',
          'या क्लोरएंट्रानिलिप्रोल 18.5 SC — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'दानेदार दवा खड़े पानी में डालने से भी अच्छा असर होता है',
        ],
        prevention: [
          'रोपाई से पहले पौध की नोक काट दें, उसी पर अंडे होते हैं',
          'कटाई ज़मीन के पास से करें, ठूँठ ऊँचा न छोड़ें',
          'कटाई के बाद खेत में पानी भरकर ठूँठ सड़ा दें',
          'रोपाई एक साथ करें',
        ],
        speech:
          'पहचाना गया है तना छेदक, जिसे स्टेम बोरर कहते हैं। यह एक कीट है। ' +
          'इसमें नए पौधों का बीच वाला कल्ला सूखकर पीला पड़ जाता है और खींचने पर आसानी से निकल आता है, इसे डेड हार्ट कहते हैं। ' +
          'बाली आने के बाद पूरी बाली सफेद और खाली खड़ी रह जाती है, इसे व्हाइट ईयरहेड कहते हैं। ' +
          'अभी करने वाला काम यह है कि ऐसे सूखे कल्ले और सफेद बालियाँ खींचकर निकाल दें और नष्ट कर दें, ' +
          'पत्ती की नोक पर भूरे रोएँदार अंडे के गुच्छे दिखें तो उन्हें भी हटा दें, ' +
          'और कार्टाप हाइड्रोक्लोराइड लगभग दो ग्राम प्रति लीटर पानी में मिलाकर छिड़कें। ' +
          'ट्राइकोग्रामा कार्ड लगाना भी बहुत असरदार है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },
    },
  },

  /* ##################### 2. WHEAT / गेहूँ ##################### */
  /* Model: Teachable Machine (TFJS) — models/wheat/model.json
     Labels ka order metadata.json se aata hai — neeche wali list us se
     BILKUL match karni chahiye (14 classes, index 0 se 13).            */
  wheat: {
    id: 'wheat',
    nameHi: 'गेहूँ',
    nameEn: 'Wheat',
    altHi: 'गेहू',
    icon: 'crop-wheat',
    seasonHi: 'रबी',
    labels: [
      'wheat_smut',          // 0
      'wheat_mite',          // 1
      'wheat_mildew',        // 2
      'wheat_leaf_blight',   // 3
      'wheat_fusarium',      // 4
      'wheat_brown_brust',   // 5  (brown rust — model ki spelling wahi rakhi hai)
      'wheat_blast',         // 6
      'wheat_healthy',       // 7
      'wheat_septoria',      // 8
      'wheat_aphid',         // 9
      'wheat_black_rust',    // 10
      'wheat_tan_spot',      // 11
      'wheat_stem_fly',      // 12
      'wheat_stripe_rust',   // 13
    ],
    classes: {

      /* ------------------------------------------------------------------ */
      wheat_smut: {
        nameHi: 'कंडुआ (काली बाली)',
        nameEn: 'Loose Smut',
        pathogen: 'कवक / Fungus — Ustilago segetum var. tritici (बीज-जनित)',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'खड़ी फसल में छिड़काव बेकार है — रोग बीज के अंदर था',
          'रोगग्रस्त बालियाँ थैली से ढककर काटें और जला दें',
          'इस खेत का बीज अगली बार न बोएँ',
          'अगली बुवाई में कार्बोक्सिन ~2 ग्राम/किलो बीज उपचार',
        ],
        symptoms:
          'बाली निकलते ही दानों की जगह काला पाउडर भरा दिखता है। हल्की हवा में यह पाउडर उड़ जाता है और ' +
          'सिर्फ नंगी डंडी (rachis) खड़ी रह जाती है। रोगग्रस्त बालियाँ स्वस्थ बालियों से 2–3 दिन पहले निकलती हैं, ' +
          'इसलिए खेत में दूर से ही काली बालियाँ अलग दिखने लगती हैं। कवक बीज के भ्रूण के अंदर छिपा रहता है, ' +
          'इसीलिए खड़ी फसल पर दवा छिड़कने से कोई फायदा नहीं होता।',
        symptomsEn:
          'Ears emerge filled with black powdery spores instead of grain; the powder blows away leaving a bare ' +
          'rachis. Infected ears emerge 2–3 days earlier than healthy ones. The fungus is seed-borne inside the ' +
          'embryo, so foliar sprays on the standing crop are useless.',
        organic: [
          'सूर्य-ताप बीज उपचार: बीज को 4 घंटे पानी में भिगोकर तेज़ धूप में 4 घंटे सुखाएँ (मई-जून)',
          'रोगग्रस्त बालियों को पॉलिथीन थैली से ढककर काटें, ताकि बीजाणु न उड़ें — फिर जला दें',
          'ट्राइकोडर्मा विरिडी ~4 ग्राम प्रति किलो बीज से उपचार',
          'हमेशा प्रमाणित बीज खरीदें, अपने रोगग्रस्त खेत का बीज दोबारा न बोएँ',
        ],
        chemical: [
          'बीज उपचार: कार्बोक्सिन 75 WP — लगभग 2 ग्राम प्रति किलो बीज',
          'विकल्प: टेबुकोनाज़ोल 2 DS — लगभग 1 से 1.25 ग्राम प्रति किलो बीज',
          'विकल्प: कार्बेन्डाजिम 50 WP — लगभग 2 ग्राम प्रति किलो बीज',
          'खड़ी फसल पर छिड़काव बेकार है — पैसा बर्बाद न करें',
        ],
        prevention: [
          'हर साल प्रमाणित / उपचारित बीज ही बोएँ — यही 100% बचाव है',
          'बीज बनाने वाले खेत से रोगग्रस्त बालियाँ पहले ही निकाल दें',
          'बीज बदलते रहें (seed replacement), हर 3 साल में नया प्रमाणित बीज',
          'फूल आने के समय रोगग्रस्त पौधों की निगरानी करें',
        ],
        speech:
          'पहचाना गया रोग है कंडुआ, जिसे काली बाली या लूज़ स्मट भी कहते हैं। ' +
          'इसमें बाली निकलते ही दानों की जगह काला पाउडर भरा दिखता है, जो हवा में उड़ जाता है और सिर्फ नंगी डंडी बचती है। ' +
          'ध्यान रखें, यह रोग बीज के अंदर छिपा रहता है, इसलिए खड़ी फसल में दवा छिड़कने से कोई फायदा नहीं होता। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त बालियों को थैली से ढककर काटें और जला दें, ताकि बीजाणु न उड़ें। ' +
          'इस खेत का बीज अगली बार मत बोइए। ' +
          'अगली बुवाई से पहले कार्बोक्सिन लगभग दो ग्राम प्रति किलो बीज से बीज उपचार ज़रूर करें। ' +
          'सस्ता उपाय यह है कि बीज को चार घंटे पानी में भिगोकर तेज़ धूप में चार घंटे सुखा लें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_mite: {
        nameHi: 'भूरा गेहूँ माइट (चेंपा जूँ)',
        nameEn: 'Brown Wheat Mite',
        pathogen: 'कीट / Mite — Petrobia latens (सूखे-गर्म मौसम का कीट)',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'तुरंत हल्की सिंचाई करें — माइट पानी से गिर जाते हैं',
          'घुलनशील सल्फर ~3 ग्राम/लीटर पानी छिड़कें',
          'तेज़ प्रकोप में डाइकोफॉल ~2.5 मि.ली./लीटर',
          'छिड़काव पत्ती की निचली सतह पर भी करें',
        ],
        symptoms:
          'पत्तियों पर बहुत महीन सफेद-पीले बिंदु (stippling) बनते हैं, जिससे पत्ती दूर से धूल भरी, ' +
          'कांसे जैसी (bronze) या सूखी हुई लगती है — किसान अक्सर इसे पानी की कमी समझ लेते हैं। ' +
          'माइट बहुत छोटे, गहरे भूरे-लाल रंग के होते हैं और सुबह-दोपहर पत्तियों पर चलते दिखते हैं; ' +
          'सफेद कागज़ पर पत्ती झाड़ने से साफ दिखाई देते हैं। जाला (web) नहीं बनाते। ' +
          'सूखा, गर्म और बिना बारिश वाला फरवरी-मार्च इनके लिए सबसे अनुकूल होता है।',
        symptomsEn:
          'Fine white-yellow stippling gives leaves a dusty, bronzed, drought-stressed look. Tiny dark reddish-brown ' +
          'mites (no webbing) can be seen by tapping a leaf over white paper. Favoured by dry, warm, rain-free spells ' +
          'in February–March; often mistaken for moisture stress.',
        organic: [
          'हल्की सिंचाई या ऊपर से पानी का छिड़काव — माइट की संख्या तेज़ी से घटती है',
          'घुलनशील सल्फर (wettable sulphur) 80 WP ~3 ग्राम प्रति लीटर पानी',
          'नीम तेल 3% (30 मि.ली. प्रति लीटर) + थोड़ा साबुन घोल, शाम को छिड़काव',
          'मित्र कीट (लेडीबर्ड, प्रिडेटरी माइट) बचाएँ — बेवजह कीटनाशक न डालें',
        ],
        chemical: [
          'डाइकोफॉल 18.5 EC — लगभग 2.5 मि.ली. प्रति लीटर पानी',
          'विकल्प: प्रोपरगाइट 57 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'विकल्प: स्पाइरोमेसीफेन 22.9 SC — लगभग 0.6 मि.ली. प्रति लीटर पानी',
          'ज़रूरत हो तो 12–15 दिन बाद दवा बदलकर दूसरा छिड़काव; कटाई से 30 दिन पहले रोक दें',
        ],
        prevention: [
          'सूखे मौसम में सिंचाई का अंतराल न बढ़ाएँ — नमी बनी रहे',
          'फरवरी-मार्च में हर हफ्ते पत्तियों की जाँच करें, खासकर खेत के किनारों पर',
          'गेहूँ के बाद गेहूँ लगातार न लगाएँ, फसल चक्र अपनाएँ',
          'खेत और मेड़ के खरपतवार साफ रखें — ये माइट को शरण देते हैं',
        ],
        speech:
          'पहचाना गया है भूरा गेहूँ माइट, यानी एक बहुत छोटा चूसक कीट। ' +
          'यह पत्तियों का रस चूसता है जिससे पत्ती पर महीन सफेद बिंदु बनते हैं और फसल दूर से सूखी या धूल भरी दिखती है। ' +
          'कई किसान इसे पानी की कमी समझ लेते हैं, इसलिए पत्ती को सफेद कागज़ पर झाड़कर देखिए, छोटे लाल-भूरे कीट चलते दिखेंगे। ' +
          'सबसे पहले हल्की सिंचाई कर दीजिए, क्योंकि पानी से माइट झड़ जाते हैं और संख्या तेज़ी से घटती है। ' +
          'इसके बाद घुलनशील सल्फर लगभग तीन ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'ज़्यादा प्रकोप होने पर डाइकोफॉल लगभग ढाई मिलीलीटर प्रति लीटर पानी छिड़कें, और पत्ती की निचली सतह भी भिगोएँ। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_mildew: {
        nameHi: 'चूर्णिल आसिता (सफेद पाउडर रोग)',
        nameEn: 'Powdery Mildew',
        pathogen: 'कवक / Fungus — Blumeria (Erysiphe) graminis f.sp. tritici',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'घुलनशील सल्फर ~2–3 ग्राम/लीटर पानी छिड़कें',
          'ज़्यादा फैलाव पर प्रोपिकोनाज़ोल ~1 मि.ली./लीटर',
          'यूरिया की अतिरिक्त मात्रा रोक दें',
          'खेत में हवा चले — घनी बुवाई और ज़्यादा सिंचाई से बचें',
        ],
        symptoms:
          'निचली पत्तियों और तने पर सफेद, रुई या आटे जैसी पाउडर की परत जम जाती है, जो उंगली से रगड़ने पर मिट जाती है। ' +
          'बाद में यह परत भूरी-स्लेटी हो जाती है और उसमें छोटे काले बिंदु (cleistothecia) दिखते हैं। ' +
          'नीचे की पत्तियाँ पीली पड़कर सूख जाती हैं। ठंडा, बादल वाला मौसम, घनी फसल और ज़्यादा यूरिया इसे बढ़ाते हैं।',
        symptomsEn:
          'White, flour-like powdery growth on lower leaves and stems that rubs off; later turns greyish-brown with ' +
          'tiny black fruiting bodies. Lower leaves yellow and dry. Favoured by cool cloudy weather, dense stands and ' +
          'excess nitrogen.',
        organic: [
          'घुलनशील सल्फर 80 WP — लगभग 2 से 3 ग्राम प्रति लीटर पानी (धूप तेज़ हो तो न छिड़कें)',
          'दूध का घोल: 1 भाग कच्चा दूध + 9 भाग पानी, हफ्ते में एक बार',
          'नीम तेल 3% (30 मि.ली. प्रति लीटर पानी) — 10 दिन के अंतर पर',
          'बीज दर संतुलित रखें, कतार से कतार 20–22 सें.मी. — हवा चलती रहे',
        ],
        chemical: [
          'प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: हेक्साकोनाज़ोल 5 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'विकल्प: कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी',
          '15 दिन के अंतर पर अधिकतम 2 छिड़काव; कटाई से 30 दिन पहले रोक दें',
        ],
        prevention: [
          'नाइट्रोजन ज़रूरत से ज़्यादा न दें — 3 भागों में बाँटकर दें',
          'रोग-रोधी किस्में और प्रमाणित बीज',
          'ज़्यादा सिंचाई और जल-जमाव से बचें',
          'कटाई के बाद फसल अवशेष खेत में सड़ने न दें',
        ],
        speech:
          'पहचाना गया रोग है चूर्णिल आसिता, जिसे सफेद पाउडर रोग या पाउडरी मिल्ड्यू कहते हैं। ' +
          'इसमें पत्तियों और तने पर आटे जैसी सफेद परत जम जाती है, जो उंगली से रगड़ने पर मिट जाती है, और नीचे की पत्तियाँ पीली पड़ने लगती हैं। ' +
          'ठंडा और बादल वाला मौसम, घनी फसल और ज़्यादा यूरिया इस रोग को बढ़ाते हैं। ' +
          'उपचार के लिए घुलनशील सल्फर लगभग दो से तीन ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'ज़्यादा फैलाव हो तो प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी छिड़कें। ' +
          'यूरिया की अतिरिक्त मात्रा अभी रोक दें और खेत में हवा चलने दें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_leaf_blight: {
        nameHi: 'पत्ती झुलसा (स्पॉट ब्लॉच)',
        nameEn: 'Leaf Blight / Spot Blotch',
        pathogen: 'कवक / Fungus — Bipolaris sorokiniana (Helminthosporium)',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'प्रोपिकोनाज़ोल ~1 मि.ली./लीटर पानी तुरंत छिड़कें',
          'या मैंकोजेब ~2.5 ग्राम/लीटर पानी',
          '15 दिन बाद ज़रूरत हो तो दूसरा छिड़काव',
          'खेत में जल-जमाव न होने दें',
        ],
        symptoms:
          'पत्तियों पर पहले छोटे भूरे धब्बे बनते हैं जो बढ़कर अंडाकार या नाव जैसे गहरे भूरे धब्बों में बदल जाते हैं, ' +
          'और उनके चारों ओर पीला घेरा (halo) दिखता है। धब्बे आपस में मिलकर पूरी पत्ती को झुलसा देते हैं और ' +
          'पत्ती समय से पहले सूख जाती है। गर्म (25–30°C) और नम मौसम, देर से बुवाई तथा पूर्वी भारत की ' +
          'धान-गेहूँ पट्टी में यह सबसे ज़्यादा नुकसान करता है — दाने हल्के और सिकुड़े रह जाते हैं।',
        symptomsEn:
          'Small brown specks enlarge into oval, dark-brown blotches with a yellow halo; they coalesce and scorch the ' +
          'whole leaf, causing premature drying. Severe in warm (25–30°C), humid conditions and late-sown crops of the ' +
          'rice-wheat belt; grains remain shrivelled.',
        organic: [
          'बीज उपचार: ट्राइकोडर्मा विरिडी ~4 ग्राम प्रति किलो बीज',
          'स्यूडोमोनास फ्लोरेसेंस 0.2% (2 ग्राम/लीटर) का पर्णीय छिड़काव, 10 दिन के अंतर पर',
          'नीम तेल 3% (30 मि.ली. प्रति लीटर पानी) का छिड़काव',
          'समय पर बुवाई करें — नवंबर के पहले पखवाड़े तक; देर की फसल में रोग ज़्यादा',
        ],
        chemical: [
          'बीज उपचार: थीरम + कार्बेन्डाजिम (2:1) ~3 ग्राम प्रति किलो बीज',
          'छिड़काव: प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          '15 दिन के अंतर पर अधिकतम 2 छिड़काव; कटाई से 30 दिन पहले रोक दें',
        ],
        prevention: [
          'समय पर बुवाई और रोग-रोधी किस्में (जैसे DBW 187, HD 2967 क्षेत्र अनुसार)',
          'संतुलित खाद — पोटाश और ज़िंक की कमी न होने दें',
          'फसल अवशेष जल्दी सड़ाएँ या हटाएँ, गेहूँ के बाद गेहूँ न लगाएँ',
          'खेत में पानी न रुके, अच्छी जल-निकासी रखें',
        ],
        speech:
          'पहचाना गया रोग है पत्ती झुलसा, जिसे स्पॉट ब्लॉच या लीफ ब्लाइट भी कहते हैं। ' +
          'इसमें पत्तियों पर भूरे अंडाकार धब्बे बनते हैं जिनके चारों ओर पीला घेरा होता है, और ये धब्बे मिलकर पूरी पत्ती को सुखा देते हैं। ' +
          'गर्म और नम मौसम तथा देर से बुवाई में यह रोग ज़्यादा नुकसान करता है, और दाने सिकुड़ जाते हैं। ' +
          'उपचार के लिए प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी, या मैंकोजेब लगभग ढाई ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'ज़रूरत पड़े तो पंद्रह दिन बाद दूसरा छिड़काव करें और खेत में पानी जमा न होने दें। ' +
          'अगली बार समय पर बुवाई करें और बीज उपचार ज़रूर करें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_fusarium: {
        nameHi: 'बाली झुलसा / करनाल-टाइप फ्यूजेरियम',
        nameEn: 'Fusarium Head Blight (Scab)',
        pathogen: 'कवक / Fungus — Fusarium graminearum',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'फूल आने की अवस्था में टेबुकोनाज़ोल ~1 मि.ली./लीटर छिड़कें',
          'रोगग्रस्त बालियाँ अलग काटें — बीज के लिए न रखें',
          'सिकुड़े/गुलाबी दाने पशु-आहार में न दें (विषाक्तता)',
          'कटाई के बाद अवशेष खेत में न छोड़ें',
        ],
        symptoms:
          'बाली के कुछ स्पाइकलेट समय से पहले सफेद/भूसे जैसे पड़ जाते हैं जबकि बाकी बाली हरी रहती है — ' +
          'यही सबसे पक्की पहचान है। नमी में स्पाइकलेट के जोड़ पर गुलाबी-नारंगी (salmon) फफूंद दिखती है। ' +
          'दाने छोटे, सिकुड़े, हल्के और सफेद-गुलाबी (tombstone) हो जाते हैं। फूल आने के समय बारिश या ' +
          'लगातार नमी और मक्का/गेहूँ के पुराने अवशेष इस रोग को बढ़ाते हैं। ' +
          'ऐसे दानों में विष (mycotoxin/DON) बन सकता है, इसलिए इन्हें खाने या पशु-आहार में इस्तेमाल न करें।',
        symptomsEn:
          'Premature bleaching of some spikelets while the rest of the head stays green; salmon-pink fungal growth at ' +
          'spikelet bases in humid weather; shrivelled chalky-pink tombstone kernels. Favoured by rain at flowering and ' +
          'maize/wheat residue. Grain may carry mycotoxins (DON) — do not use for food or feed.',
        organic: [
          'ट्राइकोडर्मा हार्जिएनम से बीज उपचार ~5 ग्राम प्रति किलो बीज',
          'मक्का/गेहूँ के अवशेष गहरी जुताई से दबाएँ या कम्पोस्ट बनाएँ',
          'फसल चक्र — गेहूँ के बाद मक्का न लगाएँ, दलहन/तिलहन लें',
          'फूल आने के समय शाम की सिंचाई से बचें, ताकि बाली ज़्यादा देर गीली न रहे',
        ],
        chemical: [
          'टेबुकोनाज़ोल 25.9 EC — लगभग 1 मि.ली. प्रति लीटर पानी, बाली में फूल आते ही (सबसे सही समय)',
          'विकल्प: प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'बीज उपचार: कार्बेन्डाजिम 50 WP ~2 ग्राम प्रति किलो बीज',
          'छिड़काव बाली पर सीधा पड़े — नोज़ल को आगे-पीछे झुकाकर चलाएँ',
        ],
        prevention: [
          'फूल आने के समय बारिश की संभावना हो तो पहले से फफूंदनाशी की योजना बनाएँ',
          'सहनशील किस्में और प्रमाणित, उपचारित बीज',
          'खेत से फसल अवशेष हटाएँ या पूरी तरह सड़ाएँ',
          'कटाई के बाद हल्के/सिकुड़े दाने पंखे या ग्रेडर से अलग कर दें',
          'अनाज 12% से कम नमी पर सुखाकर भंडारण करें',
        ],
        speech:
          'पहचाना गया रोग है फ्यूजेरियम बाली झुलसा, जिसे हेड ब्लाइट या स्कैब भी कहते हैं। ' +
          'इसमें बाली के कुछ हिस्से समय से पहले सफेद पड़ जाते हैं जबकि बाकी बाली हरी रहती है, और नमी में गुलाबी फफूंद दिखती है। ' +
          'दाने सिकुड़े और हल्के रह जाते हैं। ' +
          'ध्यान दीजिए, ऐसे दानों में विष बन सकता है, इसलिए इन्हें न खुद खाएँ और न पशुओं को खिलाएँ। ' +
          'उपचार के लिए बाली में फूल आते समय टेबुकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी का छिड़काव करें, यही सबसे सही समय है। ' +
          'रोगग्रस्त बालियों को अलग काटें और उनका बीज अगली बार मत बोइए। ' +
          'कटाई के बाद खेत में फसल अवशेष न छोड़ें और गेहूँ के बाद मक्का लगाने से बचें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_brown_brust: {
        nameHi: 'भूरा रतुआ (पत्ती गेरुई)',
        nameEn: 'Brown Rust / Leaf Rust',
        pathogen: 'कवक / Fungus — Puccinia triticina',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'लक्षण दिखते ही प्रोपिकोनाज़ोल ~1 मि.ली./लीटर छिड़कें',
          'पत्ती की दोनों सतहें भिगोएँ, सुबह या शाम को छिड़काव',
          '15 दिन बाद ज़रूरत हो तो दूसरा छिड़काव',
          'यूरिया की अतिरिक्त मात्रा रोक दें',
        ],
        symptoms:
          'पत्ती की ऊपरी सतह पर बिखरे हुए, गोल से अंडाकार, नारंगी-भूरे रंग के फफोले (pustules) बनते हैं। ' +
          'ये धारियों में नहीं, इधर-उधर बिखरे रहते हैं — इसी से यह पीले रतुआ से अलग पहचाना जाता है। ' +
          'हाथ या कपड़ा रगड़ने पर भूरा पाउडर लग जाता है। बाद में पत्ती पीली पड़कर सूख जाती है। ' +
          '15–25°C तापमान और ओस/नमी इसे तेज़ी से फैलाते हैं; प्रकाश-संश्लेषण घटने से दाने हल्के रह जाते हैं।',
        symptomsEn:
          'Scattered round to oval orange-brown pustules mainly on the upper leaf surface (not in stripes), leaving brown ' +
          'powder on hands or cloth. Leaves later yellow and dry. Spreads fast at 15–25°C with dew; grain filling suffers.',
        organic: [
          'रोग-रोधी किस्में लगाएँ — सबसे सस्ता और असरदार उपाय',
          'समय पर बुवाई करें; देर से बोई फसल में रतुआ ज़्यादा लगता है',
          'खेत की मेड़ और आसपास उगे स्वयंजात (volunteer) गेहूँ उखाड़ दें',
          'संतुलित खाद — यूरिया कम, पोटाश पूरा; हफ्ते में एक बार निगरानी',
        ],
        chemical: [
          'प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी, पहला फफोला दिखते ही',
          'विकल्प: टेबुकोनाज़ोल 25.9 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर (शुरुआती अवस्था में)',
          '15 दिन के अंतर पर दूसरा छिड़काव; कटाई से कम-से-कम 30 दिन पहले रोक दें',
        ],
        prevention: [
          'रोग-रोधी किस्में और प्रमाणित बीज',
          'समय पर बुवाई (नवंबर के पहले पखवाड़े तक)',
          'नाइट्रोजन 3 भागों में बाँटकर दें, एक साथ नहीं',
          'जनवरी-फरवरी में हर हफ्ते खेत घूमकर पत्तियाँ जाँचें',
        ],
        speech:
          'पहचाना गया रोग है भूरा रतुआ, जिसे पत्ती गेरुई या ब्राउन रस्ट कहते हैं। ' +
          'इसमें पत्ती की ऊपरी सतह पर बिखरे हुए गोल नारंगी-भूरे फफोले बनते हैं, जिनका पाउडर हाथ या कपड़े पर लग जाता है। ' +
          'ये फफोले धारियों में नहीं होते, इसी से यह पीले रतुआ से अलग पहचाना जाता है। ' +
          'उपचार के लिए लक्षण दिखते ही प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी का छिड़काव करें। ' +
          'ज़रूरत पड़े तो पंद्रह दिन बाद दूसरा छिड़काव करें, और पत्ती की दोनों सतहें अच्छी तरह भिगोएँ। ' +
          'यूरिया की अतिरिक्त मात्रा अभी न डालें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_blast: {
        nameHi: 'गेहूँ ब्लास्ट (झुलसा)',
        nameEn: 'Wheat Blast',
        pathogen: 'कवक / Fungus — Magnaporthe oryzae Triticum pathotype',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'बहुत ज़्यादा जोखिम / Very High Risk',
        actions: [
          'तुरंत कृषि विभाग / KVK को सूचना दें — यह अधिसूचित (quarantine) रोग है',
          'ट्राइसाइक्लाज़ोल ~0.6 ग्राम/लीटर या टेबुकोनाज़ोल ~1 मि.ली./लीटर',
          'रोगग्रस्त पौधे उखाड़कर जला दें, बीज के लिए बिल्कुल न रखें',
          'खेत का बीज/भूसा दूसरे गाँव न भेजें',
        ],
        symptoms:
          'बाली का ऊपरी हिस्सा या पूरी बाली अचानक सफेद/भूसे जैसी हो जाती है, जबकि तना और पत्तियाँ हरी रहती हैं। ' +
          'बाली के आधार पर एक गहरा भूरा-काला घेरा (black node) दिखता है — वहीं से बाली सूखती है और दाने बनते ही नहीं ' +
          'या पूरी तरह सिकुड़ जाते हैं। पत्तियों पर आँख जैसे (eye-shaped) भूरे धब्बे भी बन सकते हैं। ' +
          'फूल आने के समय गर्म (25–30°C) और नम मौसम इसे बहुत तेज़ी से फैलाता है — 7 दिन में पूरा खेत चौपट हो सकता है। ' +
          'भारत में यह पश्चिम बंगाल के सीमावर्ती ज़िलों में देखा गया है और इसकी सूचना देना ज़रूरी है।',
        symptomsEn:
          'Sudden bleaching of part or all of the head while stem and leaves stay green, with a dark brown-black band at ' +
          'the spike base; grains fail to form. Eye-shaped brown lesions may appear on leaves. Warm (25–30°C) humid weather ' +
          'at flowering causes explosive spread. A notifiable/quarantine concern in India — report it.',
        organic: [
          'रोगग्रस्त पौधे उखाड़कर मौके पर ही जला दें — खेत में न छोड़ें',
          'सहनशील किस्में और प्रमाणित बीज; अपने खेत का संक्रमित बीज बिल्कुल न बोएँ',
          'गेहूँ के बाद गेहूँ न लगाएँ; धान/मक्का के अवशेष गहराई में दबाएँ',
          'देर से बुवाई से बचें — फूल आने का समय गर्म-नम दौर में न पड़े',
        ],
        chemical: [
          'ट्राइसाइक्लाज़ोल 75 WP — लगभग 0.6 ग्राम प्रति लीटर पानी, बाली निकलते समय',
          'विकल्प: टेबुकोनाज़ोल 25.9 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: एजॉक्सिस्ट्रोबिन + टेबुकोनाज़ोल संयुक्त उत्पाद, लेबल के अनुसार',
          'दो छिड़काव — पहला बाली निकलते ही, दूसरा 7 दिन बाद; कटाई से 30 दिन पहले रोक दें',
        ],
        prevention: [
          'यह रोग दिखे तो सबसे पहले कृषि विभाग/KVK को सूचित करना अनिवार्य समझें',
          'समय पर बुवाई ताकि बाली ठंडे मौसम में निकले',
          'बीज हमेशा प्रमाणित स्रोत से; संक्रमित क्षेत्र से बीज न लाएँ',
          'खेत के औज़ार और थ्रेशर दूसरे खेत में ले जाने से पहले साफ करें',
          'कटाई के बाद अवशेष जलाएँ नहीं, गहरी जुताई से दबा दें',
        ],
        speech:
          'सावधान! पहचाना गया रोग है गेहूँ ब्लास्ट, जो गेहूँ का सबसे खतरनाक रोग माना जाता है। ' +
          'इसमें बाली अचानक सफेद पड़ जाती है जबकि तना और पत्तियाँ हरी रहती हैं, और बाली के आधार पर काला घेरा दिखता है। ' +
          'दाने बनते ही नहीं या पूरी तरह सिकुड़ जाते हैं, और गर्म-नम मौसम में यह सात दिन में पूरा खेत चौपट कर सकता है। ' +
          'सबसे ज़रूरी काम यह है कि तुरंत अपने कृषि विभाग या कृषि विज्ञान केंद्र को सूचना दें, क्योंकि यह अधिसूचित रोग है। ' +
          'रोगग्रस्त पौधे उखाड़कर वहीं जला दें और इस खेत का बीज या भूसा दूसरे गाँव मत भेजिए। ' +
          'दवा के लिए ट्राइसाइक्लाज़ोल लगभग शून्य दशमलव छह ग्राम प्रति लीटर पानी, या टेबुकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी का छिड़काव करें, बाली निकलते समय। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_healthy: {
        nameHi: 'स्वस्थ गेहूँ',
        nameEn: 'Healthy Wheat',
        pathogen: 'कोई रोग नहीं मिला / No disease detected',
        severity: 'none', severityHi: 'सब ठीक है',
        risk: 'ok', riskHi: 'स्वस्थ / Healthy',
        actions: [
          'कोई दवा न छिड़कें — अभी ज़रूरत नहीं है',
          'नाइट्रोजन को 3 भागों में बाँटकर दें',
          'सिंचाई के 4 नाज़ुक समय (CRI, कल्ले, बाली, दाना) न चूकें',
          '10–15 दिन बाद फिर से स्कैन करें',
        ],
        symptoms:
          'बहुत बढ़िया! इस पत्ती में किसी रोग के लक्षण नहीं मिले। पत्ती का रंग एक-सा हरा है, न कोई फफोला, ' +
          'न पाउडर जैसी परत और न ही सूखे धब्बे। आपकी फसल प्रबंधन अच्छा चल रहा है।',
        symptomsEn:
          'No disease symptoms detected — uniform green colour, no pustules, no powdery coating, no blotches. ' +
          'Keep up the current management.',
        organic: [
          'हर हफ्ते खेत में 10 जगह घूमकर ऊपर की पत्तियाँ जाँचें',
          'गोबर की खाद / वर्मीकम्पोस्ट से मिट्टी की सेहत बनाए रखें',
          'बिना ज़रूरत छिड़काव न करें — मित्र कीट बचे रहेंगे',
          'खरपतवार बुवाई के 30–35 दिन के भीतर निकाल दें',
        ],
        chemical: [
          'अभी किसी दवा की ज़रूरत नहीं है',
          'मिट्टी जाँच के अनुसार ही NPK और सल्फर दें',
        ],
        prevention: [
          'समय पर बुवाई और रोग-रोधी किस्में',
          'सिंचाई के 4 नाज़ुक समय पर पानी ज़रूर दें',
          'नाइट्रोजन 3 भागों में — एक साथ नहीं',
          'जनवरी-फरवरी में रतुआ के लिए खास निगरानी रखें',
        ],
        speech:
          'बहुत बढ़िया! इस पत्ती में किसी रोग के लक्षण नहीं मिले। आपकी गेहूँ की फसल स्वस्थ लग रही है। ' +
          'इसे ऐसे ही बनाए रखने के लिए, कोई दवा न छिड़कें, क्योंकि अभी उसकी ज़रूरत नहीं है। ' +
          'नाइट्रोजन यानी यूरिया को तीन भागों में बाँटकर दें। ' +
          'सिंचाई के चार नाज़ुक समय मत चूकिए — पहली सिंचाई बुवाई के इक्कीस दिन बाद, फिर कल्ले फूटते समय, ' +
          'बाली निकलते समय और दाना भरते समय। ' +
          'जनवरी और फरवरी में रतुआ के लिए हर हफ्ते खेत की निगरानी करते रहें। ' +
          'दस से पंद्रह दिन बाद इस ऐप से दोबारा जाँच कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_septoria: {
        nameHi: 'सेप्टोरिया धब्बा रोग',
        nameEn: 'Septoria Leaf Blotch',
        pathogen: 'कवक / Fungus — Zymoseptoria (Septoria) tritici',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'प्रोपिकोनाज़ोल ~1 मि.ली./लीटर पानी छिड़कें',
          'या मैंकोजेब ~2.5 ग्राम/लीटर पानी',
          'ऊपर की 2 पत्तियाँ (flag leaf) ज़रूर बचाएँ',
          'खेत में जल-जमाव और घनी बुवाई से बचें',
        ],
        symptoms:
          'पहले निचली पत्तियों पर हल्के हरे-पीले धब्बे बनते हैं, जो बढ़कर नसों के बीच लंबे, ' +
          'स्लेटी-भूरे आयताकार धब्बों में बदल जाते हैं। पक्की पहचान यह है कि इन धब्बों के अंदर ' +
          'बहुत छोटे काले बिंदु (pycnidia) दिखते हैं — पानी की बूँद या लेंस से साफ नज़र आते हैं। ' +
          'ठंडा (15–20°C), नम और बारिश वाला मौसम इसे नीचे से ऊपर की पत्तियों तक फैलाता है; ' +
          'फ्लैग लीफ तक पहुँचने पर उपज का असली नुकसान होता है।',
        symptomsEn:
          'Pale green-yellow flecks on lower leaves enlarge into elongated grey-brown blotches between the veins, with ' +
          'tiny black pycnidia visible inside the lesions — the key diagnostic. Cool (15–20°C), wet weather splashes it ' +
          'upward; damage matters most when it reaches the flag leaf.',
        organic: [
          'बीज उपचार: ट्राइकोडर्मा विरिडी ~4 ग्राम प्रति किलो बीज',
          'स्यूडोमोनास फ्लोरेसेंस 0.2% (2 ग्राम/लीटर) का छिड़काव, 10–12 दिन के अंतर पर',
          'निचली रोगग्रस्त पत्तियाँ हटाकर खेत से बाहर करें',
          'बीज दर संतुलित रखें ताकि फसल घनी न हो और पत्तियाँ जल्दी सूखें',
        ],
        chemical: [
          'प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'विकल्प: एजॉक्सिस्ट्रोबिन 23 SC — लगभग 1 मि.ली. प्रति लीटर पानी',
          '15 दिन के अंतर पर अधिकतम 2 छिड़काव; हर बार एक ही दवा न दोहराएँ',
        ],
        prevention: [
          'फसल अवशेष हटाएँ या गहरी जुताई से दबाएँ — रोग पुआल में बचा रहता है',
          'गेहूँ के बाद गेहूँ न लगाएँ, फसल चक्र अपनाएँ',
          'रोग-रोधी किस्में और समय पर बुवाई',
          'नाइट्रोजन संतुलित मात्रा में, ज़्यादा सिंचाई से बचें',
        ],
        speech:
          'पहचाना गया रोग है सेप्टोरिया धब्बा रोग, जिसे सेप्टोरिया लीफ ब्लॉच कहते हैं। ' +
          'इसमें पत्तियों पर नसों के बीच लंबे स्लेटी-भूरे धब्बे बनते हैं, और इन धब्बों के अंदर बहुत छोटे काले बिंदु दिखाई देते हैं। ' +
          'यही काले बिंदु इसकी पक्की पहचान हैं। ठंडा और नम मौसम इसे नीचे की पत्तियों से ऊपर की ओर फैलाता है। ' +
          'उपचार के लिए प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी, या मैंकोजेब लगभग ढाई ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'ध्यान रखें कि ऊपर वाली दो पत्तियाँ बची रहें, क्योंकि दाना उन्हीं से भरता है। ' +
          'कटाई के बाद फसल अवशेष खेत में न छोड़ें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_aphid: {
        nameHi: 'माहू / चेपा (एफिड)',
        nameEn: 'Wheat Aphid',
        pathogen: 'कीट / Insect — Rhopalosiphum padi, Sitobion avenae (रस चूसक)',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'पहले गिनें — 5–10 माहू प्रति बाली/पौधा हो तभी दवा डालें',
          'नीम तेल 3% (30 मि.ली./लीटर) का शाम को छिड़काव',
          'ज़्यादा प्रकोप में इमिडाक्लोप्रिड ~0.3 मि.ली./लीटर',
          'लेडीबर्ड बीटल दिखें तो छिड़काव टाल दें',
        ],
        symptoms:
          'पत्तियों की निचली सतह, तने और खासकर बाली पर हरे-काले छोटे कीटों का झुंड चिपका दिखता है। ' +
          'ये रस चूसते हैं जिससे पत्तियाँ पीली पड़कर मुड़ जाती हैं और पौधा कमज़ोर हो जाता है। ' +
          'इनका मीठा स्राव (honeydew) पत्तियों को चिपचिपा कर देता है, जिस पर काली फफूंद (sooty mould) जम जाती है ' +
          'और चींटियाँ चढ़ी दिखती हैं। बाली पर प्रकोप हो तो दाने हल्के रह जाते हैं। ' +
          'बादल वाला, हल्का गर्म मौसम (जनवरी-फरवरी) और ज़्यादा यूरिया इनकी संख्या तेज़ी से बढ़ाते हैं।',
        symptomsEn:
          'Clusters of small green-black sap-sucking insects on leaf undersides, stems and ears; leaves yellow and curl. ' +
          'Sticky honeydew leads to black sooty mould and ant activity; grains stay light. Cloudy mild weather and excess ' +
          'nitrogen build populations quickly.',
        organic: [
          'नीम तेल 3% या नीम बीज गिरी अर्क 5% — शाम के समय छिड़काव, 10 दिन बाद दोहराएँ',
          'मित्र कीट बचाएँ — लेडीबर्ड बीटल, सिरफिड मक्खी, क्राइसोपा; ये अकेले ही प्रकोप रोक देते हैं',
          'खेत में पीले चिपचिपे ट्रैप (yellow sticky trap) 8–10 प्रति एकड़ लगाएँ',
          'यूरिया की ज़्यादा मात्रा न दें — मुलायम पत्तियों पर माहू ज़्यादा आता है',
        ],
        chemical: [
          'इमिडाक्लोप्रिड 17.8 SL — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'विकल्प: थायामेथोक्सम 25 WG — लगभग 0.2 ग्राम प्रति लीटर पानी',
          'विकल्प: डाइमेथोएट 30 EC — लगभग 1.5 मि.ली. प्रति लीटर पानी',
          'आर्थिक हानि स्तर (5–10 माहू प्रति बाली) पार होने पर ही छिड़काव; कटाई से 30 दिन पहले रोक दें',
        ],
        prevention: [
          'समय पर बुवाई — देर की फसल में माहू ज़्यादा लगता है',
          'नाइट्रोजन 3 भागों में बाँटकर, संतुलित मात्रा में',
          'हर हफ्ते 10 जगह पौधे/बालियाँ गिनकर निगरानी करें',
          'बेवजह कीटनाशक न छिड़कें — मित्र कीट मरने से प्रकोप और बढ़ता है',
        ],
        speech:
          'पहचाना गया है माहू, जिसे चेपा या एफिड भी कहते हैं। यह एक रस चूसक कीट है। ' +
          'ये छोटे हरे-काले कीट पत्तियों और बाली पर झुंड में चिपके रहते हैं, जिससे पत्तियाँ पीली पड़ती हैं और दाने हल्के रह जाते हैं। ' +
          'इनका चिपचिपा स्राव पत्तियों पर काली फफूंद जमा देता है और चींटियाँ चढ़ी दिखती हैं। ' +
          'पहले गिनती कीजिए — अगर एक बाली या पौधे पर पाँच से दस माहू से ज़्यादा हों, तभी दवा की ज़रूरत है। ' +
          'शुरुआत में नीम तेल तीन प्रतिशत यानी तीस मिलीलीटर प्रति लीटर पानी का शाम को छिड़काव करें। ' +
          'ज़्यादा प्रकोप होने पर इमिडाक्लोप्रिड लगभग शून्य दशमलव तीन मिलीलीटर प्रति लीटर पानी छिड़कें। ' +
          'अगर खेत में लेडीबर्ड बीटल दिख रही हैं तो छिड़काव टाल दीजिए, वे खुद माहू खा जाती हैं। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_black_rust: {
        nameHi: 'काला रतुआ (तना गेरुई)',
        nameEn: 'Black Rust / Stem Rust',
        pathogen: 'कवक / Fungus — Puccinia graminis f.sp. tritici',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'बहुत ज़्यादा जोखिम / Very High Risk',
        actions: [
          'तुरंत टेबुकोनाज़ोल या प्रोपिकोनाज़ोल ~1 मि.ली./लीटर छिड़कें',
          'तने और पत्ती-आवरण पर भी दवा पड़नी चाहिए',
          '15 दिन बाद दूसरा छिड़काव करें',
          'आसपास के किसानों को भी सूचित करें — बहुत तेज़ी से फैलता है',
        ],
        symptoms:
          'तने, पत्ती-आवरण (sheath) और कभी-कभी बाली पर गहरे भूरे-लाल, लंबे और उभरे हुए फफोले बनते हैं। ' +
          'हाथ फेरने पर तना खुरदरा लगता है, क्योंकि फफोले तने की ऊपरी परत फाड़कर निकलते हैं — यही सबसे पक्की पहचान है। ' +
          'बाद में ये फफोले काले पड़ जाते हैं, इसीलिए इसे काला रतुआ कहते हैं। ' +
          'तना कमज़ोर होकर टूट जाता है और फसल गिर (lodge) सकती है; दाने पूरी तरह सिकुड़ जाते हैं। ' +
          'गर्म (20–30°C) और नम मौसम, यानी फरवरी-मार्च का उत्तरार्ध, इसे बहुत तेज़ी से फैलाता है।',
        symptomsEn:
          'Dark reddish-brown, elongated, raised pustules on stems, sheaths and sometimes ears; they rupture the epidermis, ' +
          'so the stem feels rough. Pustules turn black later. Stems weaken and lodge, grains shrivel badly. Spreads ' +
          'explosively in warm (20–30°C), humid late-season weather.',
        organic: [
          'रोग-रोधी किस्में ही असली बचाव हैं — क्षेत्र के लिए संस्तुत किस्म लगाएँ',
          'समय पर बुवाई ताकि फसल गर्मी आने से पहले पक जाए',
          'स्वयंजात (volunteer) गेहूँ और आसपास की घास-खरपतवार हटाएँ',
          'संतुलित खाद, पोटाश पूरा — तना मज़बूत रहेगा',
        ],
        chemical: [
          'टेबुकोनाज़ोल 25.9 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: एजॉक्सिस्ट्रोबिन + टेबुकोनाज़ोल संयुक्त उत्पाद, लेबल अनुसार',
          '15 दिन के अंतर पर दूसरा छिड़काव; कटाई से कम-से-कम 30 दिन पहले रोक दें',
        ],
        prevention: [
          'क्षेत्र के लिए संस्तुत रोग-रोधी किस्में और प्रमाणित बीज',
          'समय पर बुवाई (नवंबर के पहले पखवाड़े तक)',
          'नाइट्रोजन ज़्यादा न दें; पोटाश और सल्फर संतुलित रखें',
          'फरवरी-मार्च में हर हफ्ते तनों की जाँच करें',
          'रतुआ दिखे तो तुरंत कृषि विभाग/KVK को जानकारी दें',
        ],
        speech:
          'पहचाना गया रोग है काला रतुआ, जिसे तना गेरुई या स्टेम रस्ट भी कहते हैं। यह गेहूँ का सबसे विनाशकारी रतुआ है। ' +
          'इसमें तने और पत्ती के आवरण पर गहरे भूरे-लाल लंबे फफोले बनते हैं, और हाथ फेरने पर तना खुरदरा लगता है, क्योंकि फफोले तने की परत फाड़कर निकलते हैं। ' +
          'बाद में ये फफोले काले पड़ जाते हैं, तना कमज़ोर होकर फसल गिर सकती है और दाने पूरी तरह सिकुड़ जाते हैं। ' +
          'उपचार के लिए तुरंत टेबुकोनाज़ोल या प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी का छिड़काव करें, और दवा तने पर भी पड़नी चाहिए। ' +
          'पंद्रह दिन बाद दूसरा छिड़काव करें। ' +
          'यह बहुत तेज़ी से फैलता है, इसलिए आसपास के किसानों और कृषि विज्ञान केंद्र को भी ज़रूर बताइए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_tan_spot: {
        nameHi: 'टैन स्पॉट (पीला धब्बा रोग)',
        nameEn: 'Tan Spot',
        pathogen: 'कवक / Fungus — Pyrenophora tritici-repentis (अवशेष-जनित)',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'प्रोपिकोनाज़ोल ~1 मि.ली./लीटर पानी छिड़कें',
          'या मैंकोजेब ~2.5 ग्राम/लीटर पानी',
          'फ्लैग लीफ आने से पहले छिड़काव कर लें',
          'खेत के पुराने गेहूँ अवशेष हटाएँ/दबाएँ',
        ],
        symptoms:
          'पत्तियों पर हल्के भूरे (tan) रंग के अंडाकार धब्बे बनते हैं जिनके बीच में गहरा भूरा-काला बिंदु ' +
          'और चारों ओर चौड़ा पीला घेरा होता है — दूर से यह "आँख" जैसा दिखता है, यही पहचान है। ' +
          'धब्बे मिलकर पत्ती को झुलसा देते हैं और पत्ती समय से पहले सूख जाती है। ' +
          'रोग खेत में पड़े पुराने गेहूँ के ठूँठ-पुआल से शुरू होता है, इसीलिए ज़ीरो-टिल या ' +
          'लगातार गेहूँ वाले खेतों में सबसे ज़्यादा दिखता है। नमी और 18–28°C तापमान इसे बढ़ाते हैं।',
        symptomsEn:
          'Tan-coloured oval lesions with a dark brown centre and a broad yellow halo — the classic eye-spot look. ' +
          'Lesions coalesce and prematurely dry the leaf. Inoculum survives on wheat stubble, so it is worst in zero-till ' +
          'or continuous-wheat fields at 18–28°C with humidity.',
        organic: [
          'फसल अवशेष हटाएँ, गहरी जुताई से दबाएँ या डीकम्पोज़र से जल्दी सड़ाएँ',
          'फसल चक्र — गेहूँ के बाद दलहन/तिलहन/मक्का लें, लगातार गेहूँ नहीं',
          'ट्राइकोडर्मा विरिडी ~4 ग्राम प्रति किलो बीज से बीज उपचार',
          'स्यूडोमोनास फ्लोरेसेंस 0.2% का छिड़काव, 10–12 दिन के अंतर पर',
        ],
        chemical: [
          'प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'विकल्प: टेबुकोनाज़ोल 25.9 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'फ्लैग लीफ अवस्था के आसपास एक छिड़काव सबसे फायदेमंद; ज़रूरत हो तो 15 दिन बाद दूसरा',
        ],
        prevention: [
          'लगातार गेहूँ-गेहूँ न बोएँ — फसल चक्र सबसे असरदार उपाय',
          'ज़ीरो-टिल में अवशेष अच्छी तरह कटे/फैले हों, ढेर न लगे',
          'सहनशील किस्में और प्रमाणित बीज',
          'संतुलित नाइट्रोजन; खेत की निगरानी जनवरी से शुरू करें',
        ],
        speech:
          'पहचाना गया रोग है टैन स्पॉट, यानी पीला धब्बा रोग। ' +
          'इसमें पत्तियों पर हल्के भूरे अंडाकार धब्बे बनते हैं, जिनके बीच में गहरा बिंदु और चारों ओर चौड़ा पीला घेरा होता है, जो देखने में आँख जैसा लगता है। ' +
          'यह रोग खेत में पड़े पुराने गेहूँ के ठूँठ और पुआल से शुरू होता है, इसलिए लगातार गेहूँ बोने वाले खेतों में ज़्यादा मिलता है। ' +
          'उपचार के लिए प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी, या मैंकोजेब लगभग ढाई ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'सबसे फायदेमंद समय है जब ऊपर वाली पत्ती यानी फ्लैग लीफ निकल रही हो। ' +
          'अगली फसल से पहले खेत के पुराने अवशेष हटा दें या गहरी जुताई से दबा दें, और फसल चक्र अपनाएँ। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_stem_fly: {
        nameHi: 'तना मक्खी (डेड हार्ट)',
        nameEn: 'Wheat Stem Fly / Shoot Fly',
        pathogen: 'कीट / Insect — Atherigona spp. (तने में सुरंग बनाने वाली मक्खी)',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'सूखे केंद्रीय अंकुर वाले पौधे उखाड़कर नष्ट करें',
          'क्लोरपायरीफॉस 20 EC ~2 मि.ली./लीटर पानी छिड़कें',
          'हल्की सिंचाई + थोड़ा यूरिया — नए कल्ले निकलेंगे',
          'अगली बार बीज उपचार (इमिडाक्लोप्रिड) ज़रूर करें',
        ],
        symptoms:
          'शुरुआती अवस्था (बुवाई के 20–35 दिन) में बीच का अंकुर सूखकर पीला पड़ जाता है, जबकि बाहर की पत्तियाँ हरी रहती हैं — ' +
          'इसे "डेड हार्ट" कहते हैं। सूखे अंकुर को हल्का खींचने पर वह आसानी से बाहर निकल आता है और उसमें से ' +
          'सड़ी-सी गंध आती है; तने के अंदर मक्खी का सफेद मैगट या सुरंग मिल सकती है। ' +
          'बाद की अवस्था में प्रकोप हो तो बाली सफेद और खाली (whitehead) निकल आती है। ' +
          'देर से बुवाई, कम नमी और ढीली/हल्की मिट्टी में प्रकोप ज़्यादा होता है।',
        symptomsEn:
          'Central shoot dries and yellows while outer leaves stay green (dead heart) at 20–35 days; the dead shoot pulls ' +
          'out easily and smells rotten, often with a white maggot or tunnel inside. Later attack produces empty whiteheads. ' +
          'Worse in late-sown, moisture-stressed crops.',
        organic: [
          'प्रभावित पौधे उखाड़कर खेत से बाहर नष्ट करें — मैगट अंदर ही मर जाएगा',
          'नीम बीज गिरी अर्क 5% या नीम तेल 3% का छिड़काव, 10 दिन के अंतर पर',
          'समय पर बुवाई और थोड़ी ज़्यादा बीज दर — कुछ पौधे मरें तो भी खेत भरा रहे',
          'खेत में नमी बनाए रखें; प्रभावित खेत में हल्की सिंचाई से नए कल्ले निकलते हैं',
        ],
        chemical: [
          'बीज उपचार: इमिडाक्लोप्रिड 600 FS — लगभग 5 मि.ली. प्रति किलो बीज (सबसे असरदार, बुवाई के समय)',
          'विकल्प बीज उपचार: थायामेथोक्सम 30 FS — लगभग 3 मि.ली. प्रति किलो बीज',
          'खड़ी फसल: क्लोरपायरीफॉस 20 EC — लगभग 2 मि.ली. प्रति लीटर पानी, जड़ के पास पड़े',
          'विकल्प: थायामेथोक्सम 25 WG — लगभग 0.2 ग्राम प्रति लीटर पानी; कटाई से 30 दिन पहले रोक दें',
        ],
        prevention: [
          'समय पर बुवाई — देर की फसल में तना मक्खी सबसे ज़्यादा लगती है',
          'बुवाई के समय बीज उपचार करें, यह छिड़काव से सस्ता और असरदार है',
          'पहली सिंचाई (CRI, 20–21 दिन) समय पर दें',
          'पिछली फसल के ठूँठ और स्वयंजात पौधे हटाएँ',
        ],
        speech:
          'पहचाना गया है तना मक्खी का प्रकोप, जिसे शूट फ्लाई या डेड हार्ट भी कहते हैं। ' +
          'इसमें बीच का अंकुर सूखकर पीला पड़ जाता है जबकि बाहर की पत्तियाँ हरी रहती हैं। ' +
          'सूखे अंकुर को हल्का खींचिए, वह आसानी से निकल आएगा और उसमें से सड़ी गंध आएगी, अंदर सफेद मैगट भी मिल सकता है। ' +
          'सबसे पहले ऐसे पौधे उखाड़कर खेत से बाहर नष्ट कर दें। ' +
          'फिर क्लोरपायरीफॉस बीस ई सी लगभग दो मिलीलीटर प्रति लीटर पानी का छिड़काव करें, दवा जड़ के पास पड़नी चाहिए। ' +
          'हल्की सिंचाई और थोड़ी यूरिया देने से पौधे नए कल्ले निकाल लेते हैं और नुकसान की भरपाई हो जाती है। ' +
          'अगली बार बुवाई के समय इमिडाक्लोप्रिड से बीज उपचार ज़रूर करें, यही सबसे सस्ता बचाव है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      wheat_stripe_rust: {
        nameHi: 'पीला रतुआ (धारीदार गेरुई)',
        nameEn: 'Yellow / Stripe Rust',
        pathogen: 'कवक / Fungus — Puccinia striiformis f.sp. tritici',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'बहुत ज़्यादा जोखिम / Very High Risk',
        actions: [
          'लक्षण दिखते ही प्रोपिकोनाज़ोल ~1 मि.ली./लीटर छिड़कें — देर न करें',
          'सिर्फ रोग वाले धब्बे (foci) नहीं, पूरा खेत छिड़कें',
          '15 दिन बाद दूसरा छिड़काव करें',
          'कृषि विभाग/KVK और पड़ोसी किसानों को सूचित करें',
        ],
        symptoms:
          'पत्ती की नसों के बीच पीले-नारंगी पाउडर वाले फफोले लंबी सीधी धारियों (stripes) में बनते हैं — ' +
          'यही पीले रतुआ की पक्की पहचान है (भूरा रतुआ बिखरा हुआ होता है, धारी में नहीं)। ' +
          'पत्ती पर उंगली या कपड़ा रगड़ने से हल्दी जैसा पीला पाउडर लग जाता है। ' +
          'खेत में यह पहले गोल-गोल धब्बों (foci) के रूप में दिखता है, फिर तेज़ी से पूरे खेत में फैल जाता है। ' +
          'ठंडा मौसम (10–20°C), ओस और नमी इसे बहुत बढ़ाते हैं — उत्तर भारत में पंजाब, हरियाणा, ' +
          'हिमाचल और उत्तराखंड की तराई में जनवरी-फरवरी में यह सबसे बड़ा खतरा है। दाने सिकुड़कर हल्के रह जाते हैं।',
        symptomsEn:
          'Yellow-orange powdery pustules arranged in long stripes between the veins (brown rust is scattered, not striped); ' +
          'turmeric-like powder rubs off on cloth. Starts as circular foci in the field, then spreads fast. Cool (10–20°C), ' +
          'dewy weather favours it — the main February threat in north-west India; grains shrivel badly.',
        organic: [
          'रोग-रोधी किस्में (क्षेत्र के लिए संस्तुत, जैसे DBW 187, HD 3086, PBW 725) — सबसे सस्ता बचाव',
          'समय पर बुवाई करें; देर से बोई फसल में पीला रतुआ ज़्यादा लगता है',
          'स्वयंजात (volunteer) गेहूँ और आसपास की घास हटाएँ — यहीं से रोग शुरू होता है',
          'यूरिया की ज़्यादा मात्रा न दें, पोटाश पूरा दें; जनवरी से हर हफ्ते निगरानी',
        ],
        chemical: [
          'प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी, पहला लक्षण दिखते ही',
          'विकल्प: टेबुकोनाज़ोल 25.9 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: एजॉक्सिस्ट्रोबिन + प्रोपिकोनाज़ोल संयुक्त उत्पाद, लेबल अनुसार',
          '15 दिन के अंतर पर दूसरा छिड़काव; कटाई से कम-से-कम 30 दिन पहले रोक दें',
        ],
        prevention: [
          'रोग-रोधी किस्में और प्रमाणित बीज — हर 3 साल में बीज बदलें',
          'समय पर बुवाई (नवंबर के पहले पखवाड़े तक)',
          'नाइट्रोजन 3 भागों में बाँटकर दें',
          'जनवरी-फरवरी में हर हफ्ते खेत के अंदर जाकर पत्तियाँ जाँचें, सिर्फ मेड़ से न देखें',
          'रतुआ दिखते ही तुरंत कृषि विभाग/KVK को सूचना दें',
        ],
        speech:
          'पहचाना गया रोग है पीला रतुआ, जिसे धारीदार गेरुई या स्ट्राइप रस्ट कहते हैं। ' +
          'इसमें पत्ती की नसों के बीच पीले-नारंगी फफोले लंबी सीधी धारियों में बनते हैं, और रगड़ने पर हल्दी जैसा पीला पाउडर हाथ या कपड़े पर लग जाता है। ' +
          'ठंडे और ओस वाले मौसम में यह बहुत तेज़ी से फैलता है और दाने सिकुड़ जाते हैं। ' +
          'उपचार के लिए लक्षण दिखते ही प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी का छिड़काव करें, देर बिल्कुल न करें। ' +
          'सिर्फ रोग वाले हिस्से पर नहीं, पूरे खेत में छिड़काव करें, और ज़रूरत हो तो पंद्रह दिन बाद दूसरा छिड़काव करें। ' +
          'यह रोग हवा से दूर तक फैलता है, इसलिए अपने कृषि विज्ञान केंद्र और पड़ोसी किसानों को भी ज़रूर बताइए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },
    },
  },

  /* ##################### 3. SUGARCANE / गन्ना ##################### */
  /* Labels ka order metadata.json se aata hai — neeche wali list us se
     BILKUL match karni chahiye (16 classes, index 0 se 15).
     NOTE: index 11 ka naam model me 'surgarcane_viral_disease' hai (spelling
     galat hai, 'sugarcane' nahi). Yahan wahi galat spelling rakhni ZAROORI hai,
     warna advisory match nahi karegi. */
  sugarcane: {
    id: 'sugarcane',
    nameHi: 'गन्ना',
    nameEn: 'Sugarcane',
    altHi: 'ईख',
    icon: 'crop-sugarcane',
    seasonHi: 'वार्षिक',
    labels: [
      'sugarcane_green_leafhopper',  // 0
      'sugarcane_red_rot',           // 1
      'sugarcane_eyespot',           // 2
      'sugarcane_redleafspot',       // 3
      'sugarcane_healthy',           // 4
      'sugarcane_ringspot',          // 5
      'sugarcane_banded_chlorosis',  // 6
      'sugarcane_grassy_shoot',      // 7
      'sugarcane_yellow_leaf',       // 8
      'sugarcane_smut',              // 9
      'sugarcane_dried_leaves',      // 10
      'surgarcane_viral_disease',    // 11  (model ki spelling — mat badlein)
      'sugarcane_sett_rot',          // 12
      'sugarcane_pokkah_boeng',      // 13
      'sugarcane_brownrust',         // 14
      'sugarcane_brown_spot',        // 15
    ],
    classes: {

      /* ------------------------------------------------------------------ */
      sugarcane_green_leafhopper: {
        nameHi: 'हरा फुदका',
        nameEn: 'Green Leafhopper',
        pathogen: 'कीट / Insect — रस चूसने वाला फुदका',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'इमिडाक्लोप्रिड लगभग 0.3 मि.ली. प्रति लीटर पानी में छिड़कें',
          'सूखी नीचे वाली पत्तियाँ छीलकर हटा दें, वहीं कीट छिपता है',
          'खेत में पीले चिपचिपे कार्ड लगाएँ',
        ],
        symptoms:
          'हरे रंग के छोटे फुदकने वाले कीट पत्तियों की निचली सतह पर बैठे मिलते हैं और छूने पर कूद जाते हैं। ' +
          'ये रस चूसते हैं जिससे पत्तियाँ पीली पड़ने लगती हैं और बढ़त रुक जाती है। ' +
          'इनका मीठा स्राव (हनीड्यू) पत्तियों पर गिरता है जिस पर काली फफूंद जम जाती है और पत्ती काली-सी दिखने लगती है।',
        symptomsEn:
          'Small green hoppers rest on the lower leaf surface and jump when disturbed. Sap-sucking yellows the leaves ' +
          'and checks growth, and their honeydew invites black sooty mould on the foliage.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'सूखी पत्तियों की छिलाई (detrashing) करते रहें',
          'मित्र कीट और मकड़ियाँ बचाएँ — बेवजह छिड़काव न करें',
        ],
        chemical: [
          'इमिडाक्लोप्रिड 17.8 SL — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'या थायामेथोक्सम 25 WG — लगभग 0.2 ग्राम प्रति लीटर पानी',
        ],
        prevention: [
          'नाइट्रोजन ज़्यादा न दें',
          'खेत में जल-जमाव न होने दें',
          'नियमित छिलाई करें',
          'खेत और मेड़ की घास साफ रखें',
        ],
        speech:
          'पहचाना गया है हरा फुदका, जो गन्ने का रस चूसने वाला कीट है। ' +
          'ये हरे छोटे कीट पत्तियों की निचली सतह पर बैठते हैं और रस चूसकर पत्तियाँ पीली कर देते हैं, ' +
          'और इनके मीठे स्राव पर काली फफूंद जम जाती है। ' +
          'अभी करने वाला काम यह है कि इमिडाक्लोप्रिड लगभग शून्य दशमलव तीन मिलीलीटर प्रति लीटर पानी में छिड़कें, ' +
          'नीचे की सूखी पत्तियाँ छीलकर हटा दें क्योंकि वहीं कीट छिपता है, और खेत में पीले चिपचिपे कार्ड लगाएँ। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_red_rot: {
        nameHi: 'लाल सड़न',
        nameEn: 'Red Rot',
        pathogen: 'कवक / Fungus — Colletotrichum falcatum ("गन्ने का कैंसर")',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'ज़रूरी: यह गन्ने का सबसे खतरनाक रोग है और खड़ी फसल में इसका पक्का इलाज नहीं है। ' +
          'रोगग्रस्त झुंड उखाड़कर जलाना और अगली बार स्वस्थ बीज + रोग-रोधी किस्म ही असली बचाव है।',
        actions: [
          'रोगग्रस्त झुंड जड़ सहित उखाड़कर खेत से बाहर जला दें',
          'उस जगह चूना डालें और खेत का पानी दूसरे खेत में न जाने दें',
          'इस खेत की पेड़ी (ratoon) न रखें',
        ],
        symptoms:
          'सबसे पहले ऊपर से तीसरी-चौथी पत्ती पीली पड़कर सूखने लगती है, फिर पूरा पौधा सूख जाता है। ' +
          'पक्की पहचान: गन्ने को लंबाई में चीरने पर अंदर का गूदा लाल दिखता है और उसमें आड़ी सफेद धारियाँ होती हैं। ' +
          'चीरे हुए गन्ने से सिरके या खट्टी शराब जैसी गंध आती है। जल-जमाव और रोगग्रस्त बीज गन्ना इसे फैलाते हैं।',
        symptomsEn:
          'Third or fourth leaf from the top yellows and dries first, then the whole clump withers. Splitting the cane ' +
          'reveals reddened tissue crossed by white transverse bands with a sour alcohol-like smell.',
        organic: [
          'रोग-रोधी किस्में लगाएँ (जैसे CoLk 14201, Co 15023) — Co 0238 अब संवेदनशील हो चुकी है',
          'सेट को ट्राइकोडर्मा हार्ज़ियानम के घोल में 15–20 मिनट डुबोकर बोएँ',
          'ट्राइकोडर्मा लगभग 5 किलो प्रति एकड़ सड़ी गोबर खाद में मिलाकर डालें',
        ],
        chemical: [
          'सेट उपचार: कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी में 15 मिनट',
          'जड़ के पास कार्बेन्डाजिम की ड्रेंचिंग (सीमित असर)',
          'नोट: पत्तियों पर छिड़काव से यह रोग नहीं रुकता',
        ],
        prevention: [
          'रोगग्रस्त खेत से कभी बीज गन्ना न लें',
          'रोगग्रस्त खेत की पेड़ी न रखें',
          'खेत का जल निकास ठीक रखें',
          'तना छेदक नियंत्रित करें — घाव से फफूंद अंदर घुसता है',
        ],
        speech:
          'पहचाना गया रोग है लाल सड़न, जिसे रेड रॉट कहते हैं। यह गन्ने का सबसे खतरनाक रोग है। ' +
          'इसमें ऊपर से तीसरी चौथी पत्ती पहले पीली होकर सूखती है, फिर पूरा पौधा सूख जाता है। ' +
          'गन्ने को चीरकर देखने पर अंदर लाल रंग और आड़ी सफेद धारियाँ दिखती हैं, और खट्टी गंध आती है। ' +
          'ध्यान रखें, खड़ी फसल में इसका पक्का इलाज नहीं है। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त झुंड जड़ सहित उखाड़कर खेत से बाहर जला दें, उस जगह चूना डाल दें, ' +
          'और इस खेत का पानी दूसरे खेत में न जाने दें। इस खेत की पेड़ी मत रखिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_eyespot: {
        nameHi: 'आँख धब्बा',
        nameEn: 'Eyespot',
        pathogen: 'कवक / Fungus — Bipolaris sacchari',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'मैंकोज़ेब लगभग 2 ग्राम प्रति लीटर पानी में छिड़कें',
          'सूखी और रोगग्रस्त पत्तियाँ छीलकर हटा दें',
          'खेत में जल-जमाव न होने दें',
        ],
        symptoms:
          'पत्तियों पर छोटे अंडाकार धब्बे बनते हैं जिनका बीच भूसे जैसा हल्का और किनारा गहरा भूरा-लाल होता है — ' +
          'देखने में आँख जैसे लगते हैं, इसीलिए इसे आँख धब्बा कहते हैं। ' +
          'हर धब्बे से पत्ती की नोक की ओर एक लंबी हल्की धारी (runner streak) निकलती है, यही इसकी पक्की पहचान है। ' +
          'ठंडा, नम और बादल वाला मौसम इसे बढ़ाता है।',
        symptomsEn:
          'Small oval lesions with straw-coloured centres and dark reddish-brown borders that look like eyes, each ' +
          'with a long pale runner streak extending toward the leaf tip — the confirming sign. Cool humid cloudy ' +
          'weather favours it.',
        organic: [
          'रोग-रोधी किस्में लगाएँ',
          'नियमित छिलाई (detrashing) करें',
          'खेत में हवा चलने की जगह रखें',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2 ग्राम प्रति लीटर पानी',
          'या कॉपर ऑक्सीक्लोराइड — लगभग 3 ग्राम प्रति लीटर पानी',
        ],
        prevention: [
          'स्वस्थ बीज गन्ना लें',
          'जल निकास ठीक रखें',
          'नाइट्रोजन संतुलित रखें',
          'रोगग्रस्त पत्तियाँ खेत में न छोड़ें',
        ],
        speech:
          'पहचाना गया रोग है आँख धब्बा, जिसे आईस्पॉट कहते हैं। ' +
          'इसमें पत्तियों पर आँख जैसे अंडाकार धब्बे बनते हैं, बीच हल्का और किनारा गहरा भूरा लाल, ' +
          'और हर धब्बे से पत्ती की नोक की तरफ एक लंबी हल्की धारी निकलती है, यही पक्की पहचान है। ' +
          'अभी करने वाला काम यह है कि मैंकोज़ेब लगभग दो ग्राम प्रति लीटर पानी में छिड़कें, ' +
          'सूखी और रोगग्रस्त पत्तियाँ छीलकर हटा दें, और खेत में पानी जमा न होने दें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_redleafspot: {
        nameHi: 'लाल पत्ती धब्बा',
        nameEn: 'Red Leaf Spot / Purple Spot',
        pathogen: 'कवक / Fungus — Dimeriella sacchari',
        severity: 'low', severityHi: 'कम नुकसान',
        risk: 'low', riskHi: 'कम जोखिम / Low Risk',
        actions: [
          'हल्का हो तो छिड़काव की ज़रूरत नहीं, निगरानी रखें',
          'ज़्यादा फैले तो मैंकोज़ेब लगभग 2 ग्राम प्रति लीटर पानी',
          'सूखी पत्तियाँ हटाकर खेत साफ रखें',
        ],
        symptoms:
          'पत्तियों पर छोटे लाल या बैंगनी-लाल धब्बे बनते हैं जो बाद में बढ़कर आपस में मिल जाते हैं। ' +
          'धब्बों का रंग गहरा लाल रहता है और उनके बीच में कोई राख जैसा हिस्सा नहीं होता — इसी से यह आँख धब्बे से अलग है। ' +
          'ज़्यादा नमी और घनी फसल में यह बढ़ता है, पर उपज पर असर आमतौर पर कम होता है।',
        symptomsEn:
          'Small red to purplish-red spots that later enlarge and merge, staying uniformly dark red without an ashy ' +
          'centre — which separates it from eyespot. Favoured by humidity and dense stands; yield impact is usually low.',
        organic: [
          'नियमित छिलाई करके हवा चलने दें',
          'नीम आधारित छिड़काव',
          'संतुलित खाद',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2 ग्राम प्रति लीटर पानी (सिर्फ ज़्यादा रोग में)',
        ],
        prevention: [
          'घनी बुवाई से बचें',
          'जल निकास ठीक रखें',
          'रोगग्रस्त अवशेष हटाएँ',
        ],
        speech:
          'पहचाना गया रोग है लाल पत्ती धब्बा, जिसे रेड लीफ स्पॉट कहते हैं। ' +
          'इसमें पत्तियों पर छोटे लाल या बैंगनी लाल धब्बे बनते हैं जो बाद में आपस में मिल जाते हैं। ' +
          'अच्छी बात यह है कि इससे उपज पर आमतौर पर ज़्यादा असर नहीं पड़ता। ' +
          'हल्का रोग हो तो कोई दवा मत छिड़किए, सिर्फ निगरानी रखिए। ' +
          'ज़्यादा फैल जाए तो मैंकोज़ेब लगभग दो ग्राम प्रति लीटर पानी में छिड़कें और सूखी पत्तियाँ हटाकर खेत साफ रखें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_healthy: {
        nameHi: 'स्वस्थ गन्ना',
        nameEn: 'Healthy',
        pathogen: '—',
        severity: 'none', severityHi: 'कोई नुकसान नहीं',
        risk: 'none', riskHi: 'कोई जोखिम नहीं / No Risk',
        actions: [
          'कोई दवा छिड़कने की ज़रूरत नहीं',
          'समय पर सिंचाई और मिट्टी चढ़ाना जारी रखें',
          'हर 10–15 दिन पर खेत घूमकर जाँच करें',
        ],
        symptoms:
          'पत्तियाँ एक-समान हरी हैं, उन पर कोई धब्बा, धारी, पीलापन या सूखन नहीं दिख रही। ' +
          'फसल स्वस्थ लग रही है — अभी किसी उपचार की ज़रूरत नहीं है।',
        symptomsEn:
          'Leaves are uniformly green with no spots, streaks, yellowing or drying. The crop looks healthy and needs ' +
          'no treatment right now.',
        organic: [
          'सड़ी गोबर खाद और प्रेसमड देते रहें',
          'ट्राइकोडर्मा मिट्टी में मिलाते रहें',
        ],
        chemical: [
          'अभी किसी रासायनिक दवा की ज़रूरत नहीं',
        ],
        prevention: [
          'सूखी पत्तियों की छिलाई करते रहें',
          'जल निकास ठीक रखें',
          'तना छेदक और फुदके पर नज़र रखें',
        ],
        speech:
          'खुशखबरी! गन्ना स्वस्थ दिख रहा है, इस पर कोई रोग नहीं मिला। ' +
          'अभी कोई दवा छिड़कने की ज़रूरत नहीं है, बेकार में पैसा मत लगाइए। ' +
          'बस समय पर सिंचाई और मिट्टी चढ़ाना जारी रखिए, सूखी पत्तियों की छिलाई करते रहिए, ' +
          'और हर दस पंद्रह दिन पर खेत घूमकर पत्तियाँ देखते रहिए।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_ringspot: {
        nameHi: 'छल्ला धब्बा',
        nameEn: 'Ring Spot',
        pathogen: 'कवक / Fungus — Leptosphaeria sacchari',
        severity: 'low', severityHi: 'कम नुकसान',
        risk: 'low', riskHi: 'कम जोखिम / Low Risk',
        actions: [
          'आमतौर पर छिड़काव की ज़रूरत नहीं होती',
          'सूखी और रोगग्रस्त पत्तियाँ हटा दें',
          'बहुत ज़्यादा फैले तो मैंकोज़ेब लगभग 2 ग्राम प्रति लीटर पानी',
        ],
        symptoms:
          'पत्तियों पर हरे-भूरे धब्बे बनते हैं जिनके चारों ओर हल्के पीले-भूरे रंग का छल्ला (halo) साफ दिखता है। ' +
          'धब्बे बढ़कर अनियमित आकार ले लेते हैं और पुरानी, नीचे वाली पत्तियों पर ज़्यादा मिलते हैं। ' +
          'यह रोग ज़्यादातर कमज़ोर या पुरानी पत्तियों पर ही रहता है, उपज पर असर कम होता है।',
        symptomsEn:
          'Greenish-brown lesions surrounded by a distinct pale yellow-brown ring or halo, enlarging irregularly and ' +
          'mostly on older lower leaves. Yield impact is generally low.',
        organic: [
          'नियमित छिलाई',
          'संतुलित खाद, खासकर पोटाश',
          'खेत की सफाई',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2 ग्राम प्रति लीटर पानी (सिर्फ ज़्यादा रोग में)',
        ],
        prevention: [
          'पोटाश की कमी न होने दें',
          'जल-जमाव से बचें',
          'रोगग्रस्त पत्तियाँ खेत में न छोड़ें',
        ],
        speech:
          'पहचाना गया रोग है छल्ला धब्बा, जिसे रिंग स्पॉट कहते हैं। ' +
          'इसमें पत्तियों पर हरे भूरे धब्बे बनते हैं जिनके चारों ओर हल्के पीले भूरे रंग का छल्ला साफ दिखता है, ' +
          'और ये ज़्यादातर पुरानी नीचे वाली पत्तियों पर मिलते हैं। ' +
          'इससे उपज पर असर कम होता है, इसलिए आमतौर पर छिड़काव की ज़रूरत नहीं पड़ती। ' +
          'सूखी और रोगग्रस्त पत्तियाँ हटा दीजिए और पोटाश की कमी पूरी कर दीजिए। ' +
          'बहुत ज़्यादा फैल जाए तभी मैंकोज़ेब लगभग दो ग्राम प्रति लीटर पानी में छिड़कें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_banded_chlorosis: {
        nameHi: 'पट्टीदार पीलापन',
        nameEn: 'Banded Chlorosis',
        pathogen: 'रोग नहीं — ठंड / पोषक तत्व की कमी (abiotic)',
        severity: 'low', severityHi: 'कम नुकसान',
        risk: 'low', riskHi: 'कम जोखिम / Low Risk',
        note:
          'यह कोई फफूंद या जीवाणु रोग नहीं है — यह ठंड लगने या पोषण की कमी से होता है। ' +
          'इस पर फफूंदनाशक छिड़कना पैसे की बर्बादी है।',
        actions: [
          'कोई फफूंदनाशक न छिड़कें — यह रोग नहीं है',
          'ठंड के बाद हल्की सिंचाई करें, पौधा अपने आप सुधरता है',
          'सूक्ष्म पोषक तत्व (ज़िंक, आयरन) का छिड़काव करें',
        ],
        symptoms:
          'पत्ती पर आड़ी सफेद या पीली पट्टियाँ बन जाती हैं जो पत्ती की चौड़ाई में एक बैंड जैसी दिखती हैं, ' +
          'बाकी पत्ती हरी रहती है। ये पट्टियाँ अक्सर एक ही ऊँचाई पर सभी पत्तियों में मिलती हैं। ' +
          'यह ठंडी रात, पाला या पोषण की कमी के बाद दिखता है, और मौसम सुधरने पर नई पत्तियाँ सामान्य आती हैं।',
        symptomsEn:
          'Transverse white or yellow bands across the leaf blade while the rest stays green, usually at the same ' +
          'height on several leaves. Follows cold nights, frost or nutrient stress; new leaves emerge normal as ' +
          'conditions improve.',
        organic: [
          'सड़ी गोबर खाद और वर्मीकम्पोस्ट दें',
          'ठंड में खेत में हल्की सिंचाई रखें, इससे पाले का असर घटता है',
          'ज़िंक और आयरन की कमी पूरी करें',
        ],
        chemical: [
          'ज़िंक सल्फेट लगभग 5 ग्राम प्रति लीटर पानी का छिड़काव',
          'फेरस सल्फेट लगभग 5 ग्राम प्रति लीटर पानी (आयरन की कमी में)',
          'फफूंदनाशक की कोई ज़रूरत नहीं',
        ],
        prevention: [
          'ठंड आने से पहले सिंचाई कर दें',
          'संतुलित खाद और सूक्ष्म पोषक तत्व दें',
          'मिट्टी की जाँच करवाकर कमी पूरी करें',
        ],
        speech:
          'पहचाना गया है पट्टीदार पीलापन, जिसे बैंडेड क्लोरोसिस कहते हैं। ' +
          'ध्यान से सुनिए, यह कोई फफूंद या जीवाणु का रोग नहीं है, यह ठंड लगने या पोषण की कमी से होता है। ' +
          'इसमें पत्ती पर आड़ी सफेद या पीली पट्टियाँ बन जाती हैं और बाकी पत्ती हरी रहती है। ' +
          'इसलिए इस पर फफूंदनाशक छिड़कना पैसे की बर्बादी है, मत छिड़किए। ' +
          'अभी करने वाला काम यह है कि ठंड के बाद हल्की सिंचाई कर दें, ' +
          'और ज़िंक सल्फेट लगभग पाँच ग्राम प्रति लीटर पानी का छिड़काव कर दें। ' +
          'मौसम सुधरने पर नई पत्तियाँ सामान्य आने लगेंगी। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_grassy_shoot: {
        nameHi: 'घसैला अंकुर रोग',
        nameEn: 'Grassy Shoot Disease',
        pathogen: 'फाइटोप्लाज़्मा / Phytoplasma — बीज गन्ने और फुदके से फैलता है',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'इसका कोई छिड़काव वाला इलाज नहीं है। रोगी झुंड उखाड़ना और अगली बार ' +
          'गर्म पानी से उपचारित स्वस्थ बीज लेना ही बचाव है।',
        actions: [
          'रोगग्रस्त झुंड जड़ सहित उखाड़कर खेत से बाहर नष्ट करें',
          'इस खेत की पेड़ी न रखें',
          'अगली बुवाई के लिए इस खेत का बीज गन्ना बिल्कुल न लें',
        ],
        symptoms:
          'एक ही ठूँठ से बहुत सारे पतले, कमज़ोर कल्ले निकल आते हैं जिससे पौधा घास के गुच्छे जैसा दिखता है। ' +
          'पत्तियाँ छोटी, संकरी और सफेद या हल्की पीली हो जाती हैं। ' +
          'ऐसे पौधों में गन्ना बनता ही नहीं या बहुत पतला रह जाता है। रोग बीज गन्ने से और चूसने वाले कीटों से फैलता है।',
        symptomsEn:
          'A single stool throws many thin weak tillers so the plant looks like a tuft of grass, with small narrow ' +
          'white or pale yellow leaves. Such plants form no millable cane. Spread through infected seed cane and ' +
          'sucking insects.',
        organic: [
          'बीज गन्ने का गर्म पानी उपचार — 50°C पर 2 घंटे',
          'रोग-मुक्त बीज नर्सरी से ही बीज लें',
          'रोगी झुंड लगातार निकालते रहें (roguing)',
        ],
        chemical: [
          'फैलाने वाले चूसने वाले कीटों के लिए इमिडाक्लोप्रिड लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'फाइटोप्लाज़्मा की कोई सीधी दवा नहीं है',
        ],
        prevention: [
          'हमेशा प्रमाणित, रोग-मुक्त बीज गन्ना लें',
          'रोगग्रस्त खेत की पेड़ी न रखें',
          'हर 15 दिन में खेत घूमकर रोगी झुंड निकालें',
          'बीज काटने का औज़ार बदलते समय साफ करें',
        ],
        speech:
          'पहचाना गया रोग है घसैला अंकुर रोग, जिसे ग्रासी शूट कहते हैं। ' +
          'इसमें एक ही ठूँठ से बहुत सारे पतले कमज़ोर कल्ले निकल आते हैं और पौधा घास के गुच्छे जैसा दिखने लगता है, ' +
          'पत्तियाँ छोटी संकरी और सफेद या हल्की पीली हो जाती हैं, और गन्ना बनता ही नहीं। ' +
          'ध्यान रखिए, इसका कोई छिड़काव वाला इलाज नहीं है। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त झुंड जड़ सहित उखाड़कर खेत से बाहर नष्ट कर दें, ' +
          'और इस खेत की पेड़ी मत रखिए। ' +
          'सबसे ज़रूरी बात, अगली बार इस खेत का बीज गन्ना बिल्कुल मत लीजिए, ' +
          'बल्कि गर्म पानी से उपचारित स्वस्थ बीज ही लीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_yellow_leaf: {
        nameHi: 'पीली पत्ती रोग',
        nameEn: 'Yellow Leaf Disease',
        pathogen: 'विषाणु / Virus — SCYLV, माहू (एफिड) से फैलता है',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'विषाणु रोग है, इसका सीधा इलाज नहीं है। माहू रोकना और स्वस्थ बीज लेना ही बचाव है।',
        actions: [
          'माहू (एफिड) के लिए इमिडाक्लोप्रिड लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'रोगग्रस्त झुंड निकालते रहें',
          'इस खेत का बीज गन्ना अगली बार न लें',
        ],
        symptoms:
          'पत्ती की पीठ (नीचे की सतह) पर बीच वाली नस पीली या गुलाबी-पीली पड़ जाती है, जबकि पत्ती का बाकी हिस्सा हरा रहता है — ' +
          'यही सबसे पक्की पहचान है, इसलिए पत्ती पलटकर ज़रूर देखें। ' +
          'बाद में पीलापन पूरी पत्ती में फैलता है, पत्ती की नोक सूखने लगती है और पौधे की बढ़त रुक जाती है। ' +
          'गन्ना छोटा और पतला रह जाता है, चीनी की मात्रा भी घट जाती है।',
        symptomsEn:
          'The midrib on the underside of the leaf turns yellow or pinkish-yellow while the blade stays green — the ' +
          'confirming sign, so always turn the leaf over. Yellowing later spreads, tips dry and growth is checked, ' +
          'giving thin short canes with reduced sugar.',
        organic: [
          'गर्म पानी से बीज उपचार — 50°C पर 2 घंटे',
          'ऊतक संवर्धन (tissue culture) से बना रोग-मुक्त बीज लें',
          'खेत में मित्र कीट बचाएँ ताकि माहू कम रहे',
        ],
        chemical: [
          'इमिडाक्लोप्रिड 17.8 SL — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'या थायामेथोक्सम 25 WG — लगभग 0.2 ग्राम प्रति लीटर पानी',
          'विषाणु की कोई सीधी दवा नहीं है',
        ],
        prevention: [
          'रोग-मुक्त प्रमाणित बीज गन्ना ही लें',
          'रोगग्रस्त खेत की पेड़ी न रखें',
          'माहू पर शुरू से नज़र रखें, पत्ती की पीठ देखें',
          'संतुलित खाद दें',
        ],
        speech:
          'पहचाना गया रोग है पीली पत्ती रोग, जिसे येलो लीफ डिज़ीज़ कहते हैं। यह एक विषाणु रोग है जो माहू से फैलता है। ' +
          'इसकी पक्की पहचान यह है कि पत्ती को पलटकर देखिए, नीचे की तरफ बीच वाली नस पीली या गुलाबी पीली पड़ जाती है ' +
          'जबकि बाकी पत्ती हरी रहती है। ' +
          'ध्यान रखिए, विषाणु रोग का सीधा इलाज नहीं होता। ' +
          'अभी करने वाला काम यह है कि माहू रोकने के लिए इमिडाक्लोप्रिड लगभग शून्य दशमलव तीन मिलीलीटर प्रति लीटर पानी में छिड़कें, ' +
          'रोगग्रस्त झुंड निकालते रहें, और इस खेत का बीज गन्ना अगली बार मत लीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_smut: {
        nameHi: 'कंडुआ (कोड़ा रोग)',
        nameEn: 'Whip Smut',
        pathogen: 'कवक / Fungus — Sporisorium scitamineum',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'कोड़े को खुले में मत तोड़िए — उसमें अरबों बीजाणु होते हैं जो हवा में उड़कर ' +
          'पूरे खेत में फैल जाते हैं। पहले थैली से ढकिए, फिर काटिए।',
        actions: [
          'कोड़ा फटने से पहले उसे पॉलीथिन थैली से ढककर पौधा उखाड़ें',
          'उखाड़े हुए पौधे को खेत से दूर ले जाकर जला दें',
          'इस खेत की पेड़ी न रखें',
        ],
        symptoms:
          'पौधे के सिरे से लंबा, काला, चाबुक जैसा कोड़ा निकल आता है जो चाँदी जैसी झिल्ली से ढका रहता है। ' +
          'झिल्ली फटते ही उसमें से काला चूर्ण (बीजाणु) उड़ने लगता है। ' +
          'रोगी पौधा पतला, घास जैसा और छोटा रह जाता है, उसमें से गन्ना नहीं बनता। ' +
          'यह रोगग्रस्त बीज गन्ने और हवा दोनों से फैलता है।',
        symptomsEn:
          'A long black whip-like structure emerges from the shoot tip, covered by a silvery membrane that ruptures ' +
          'to release black spore dust. Affected plants stay thin and grassy and give no millable cane. Spread by ' +
          'infected seed cane and wind.',
        organic: [
          'रोग-रोधी किस्में लगाएँ',
          'बीज गन्ने का गर्म पानी उपचार — 52°C पर 30 मिनट',
          'ट्राइकोडर्मा से सेट उपचार',
        ],
        chemical: [
          'सेट उपचार: कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी में 15 मिनट',
          'या प्रोपिकोनाज़ोल से सेट उपचार',
          'खड़ी फसल में छिड़काव का असर बहुत कम है',
        ],
        prevention: [
          'रोगग्रस्त खेत से बीज गन्ना कभी न लें',
          'हर 15 दिन में खेत घूमकर कोड़े वाले पौधे निकालें',
          'रोगग्रस्त खेत की पेड़ी न रखें',
          'फसल चक्र अपनाएँ',
        ],
        speech:
          'पहचाना गया रोग है कंडुआ, जिसे कोड़ा रोग या व्हिप स्मट कहते हैं। ' +
          'इसमें पौधे के सिरे से लंबा काला चाबुक जैसा कोड़ा निकल आता है जो चाँदी जैसी झिल्ली से ढका रहता है, ' +
          'और झिल्ली फटते ही उसमें से काला चूर्ण उड़ने लगता है। ' +
          'बहुत ज़रूरी बात, कोड़े को खुले में मत तोड़िए, क्योंकि उसमें अरबों बीजाणु होते हैं जो हवा में उड़कर पूरे खेत में फैल जाते हैं। ' +
          'अभी करने वाला काम यह है कि कोड़े को पहले पॉलीथिन थैली से ढक दीजिए, फिर पूरा पौधा उखाड़कर खेत से दूर ले जाकर जला दीजिए। ' +
          'इस खेत की पेड़ी मत रखिए, और अगली बार बीज गन्ने को गर्म पानी या कार्बेन्डाजिम से उपचारित करके ही बोइए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_dried_leaves: {
        nameHi: 'सूखी पत्तियाँ',
        nameEn: 'Dried Leaves',
        pathogen: 'रोग नहीं — सामान्य सूखना / पानी की कमी',
        severity: 'low', severityHi: 'कम नुकसान',
        risk: 'low', riskHi: 'कम जोखिम / Low Risk',
        note:
          'नीचे की पुरानी पत्तियों का सूखना गन्ने में सामान्य बात है। ' +
          'अगर ऊपर की नई पत्तियाँ भी सूख रही हों, तो पानी की कमी या कोई रोग हो सकता है — दोबारा जाँच करें।',
        actions: [
          'कोई दवा छिड़कने की ज़रूरत नहीं',
          'सूखी पत्तियाँ छीलकर (detrashing) खेत में बिछा दें, यह अच्छी मल्च बनती है',
          'ऊपर की नई पत्तियाँ भी सूख रही हों तो सिंचाई करें और दोबारा जाँच करें',
        ],
        symptoms:
          'नीचे की पुरानी पत्तियाँ सूखकर भूरी और भुरभुरी हो गई हैं, जबकि ऊपर की नई पत्तियाँ हरी और स्वस्थ हैं। ' +
          'यह गन्ने की बढ़त के साथ होने वाली सामान्य प्रक्रिया है। ' +
          'लेकिन अगर ऊपर वाली पत्तियाँ भी किनारे से सूख रही हों, तो यह पानी की कमी, जड़ की सड़न या तना छेदक का संकेत हो सकता है।',
        symptomsEn:
          'Older lower leaves have dried brown and brittle while the upper leaves stay green — normal senescence in ' +
          'sugarcane. If upper leaves are also drying from the margins, suspect water stress, root rot or borer damage.',
        organic: [
          'छिली हुई सूखी पत्तियाँ कतारों के बीच बिछा दें — नमी बचती है और खरपतवार घटते हैं',
          'सूखी पत्तियाँ जलाएँ नहीं, यह मिट्टी के लिए अच्छी खाद है',
        ],
        chemical: [
          'किसी दवा की ज़रूरत नहीं',
        ],
        prevention: [
          'समय पर सिंचाई करें, खासकर गर्मी में',
          'नियमित छिलाई करें ताकि हवा चले और कीट न छिपें',
          'जड़ के पास मिट्टी चढ़ाते रहें',
        ],
        speech:
          'पहचाना गया है सूखी पत्तियाँ। ध्यान से सुनिए, यह कोई रोग नहीं है। ' +
          'गन्ने में नीचे की पुरानी पत्तियों का सूखना बिल्कुल सामान्य बात है, इसमें घबराने की ज़रूरत नहीं। ' +
          'कोई दवा छिड़कने की ज़रूरत नहीं है। ' +
          'सूखी पत्तियाँ छीलकर कतारों के बीच बिछा दीजिए, इससे नमी बचती है और खरपतवार भी कम होते हैं। ' +
          'इन्हें जलाइए मत, ये मिट्टी के लिए अच्छी खाद हैं। ' +
          'हाँ, अगर ऊपर की नई पत्तियाँ भी सूख रही हों तो सिंचाई कर दीजिए और इस ऐप से दोबारा जाँच कर लीजिए।',
      },

      /* ------------------------------------------------------------------ */
      /* NOTE: label ki spelling model me 'surgarcane_...' hai — mat badlein. */
      surgarcane_viral_disease: {
        nameHi: 'विषाणु रोग (मोज़ेक)',
        nameEn: 'Viral Disease / Mosaic',
        pathogen: 'विषाणु / Virus — SCMV आदि, माहू और बीज गन्ने से फैलता है',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        note:
          'विषाणु रोग का कोई सीधा इलाज नहीं है। रोगी पौधे हटाना, माहू रोकना और ' +
          'स्वस्थ बीज लेना — यही तीन उपाय हैं।',
        actions: [
          'रोगग्रस्त झुंड जड़ सहित उखाड़कर खेत से बाहर नष्ट करें',
          'माहू के लिए इमिडाक्लोप्रिड लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'इस खेत का बीज गन्ना अगली बार न लें',
        ],
        symptoms:
          'नई पत्तियों पर हल्के हरे या पीले और गहरे हरे रंग के धब्बे मिलकर चितकबरा (मोज़ेक) पैटर्न बना देते हैं। ' +
          'यह पैटर्न पत्ती के आधार की ओर सबसे साफ दिखता है, इसलिए नई खुलती पत्ती को रोशनी की तरफ करके देखें। ' +
          'पौधे की बढ़त कम हो जाती है, गन्ना पतला रह जाता है और उपज तथा चीनी दोनों घटती हैं।',
        symptomsEn:
          'Light green or yellow patches alternate with normal green on young leaves, forming a mottled mosaic that is ' +
          'clearest near the leaf base — hold an unfurling leaf up to the light. Growth is reduced and canes stay thin, ' +
          'lowering both yield and sugar.',
        organic: [
          'गर्म पानी से बीज उपचार — 50°C पर 2 घंटे',
          'रोग-मुक्त, ऊतक संवर्धन से बना बीज लें',
          'मित्र कीट बचाएँ ताकि माहू कम रहे',
        ],
        chemical: [
          'इमिडाक्लोप्रिड 17.8 SL — लगभग 0.3 मि.ली. प्रति लीटर पानी (माहू के लिए)',
          'विषाणु की कोई सीधी दवा नहीं है',
        ],
        prevention: [
          'रोग-मुक्त प्रमाणित बीज गन्ना ही लें',
          'रोगी झुंड लगातार निकालते रहें',
          'रोगग्रस्त खेत की पेड़ी न रखें',
          'औज़ार साफ रखें',
        ],
        speech:
          'पहचाना गया रोग है विषाणु रोग, जिसे मोज़ेक भी कहते हैं। ' +
          'इसमें नई पत्तियों पर हल्के हरे या पीले और गहरे हरे धब्बे मिलकर चितकबरा पैटर्न बना देते हैं। ' +
          'इसे देखने के लिए नई खुलती पत्ती को रोशनी की तरफ करके देखिए, पत्ती के आधार के पास यह सबसे साफ दिखता है। ' +
          'ध्यान रखिए, विषाणु रोग का कोई सीधा इलाज नहीं होता। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त झुंड जड़ सहित उखाड़कर खेत से बाहर नष्ट कर दें, ' +
          'माहू रोकने के लिए इमिडाक्लोप्रिड लगभग शून्य दशमलव तीन मिलीलीटर प्रति लीटर पानी में छिड़कें, ' +
          'और इस खेत का बीज गन्ना अगली बार मत लीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_sett_rot: {
        nameHi: 'सेट सड़न (अनानास रोग)',
        nameEn: 'Sett Rot / Pineapple Disease',
        pathogen: 'कवक / Fungus — Ceratocystis paradoxa',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह रोग बुवाई के तुरंत बाद लगता है और अंकुरण ही नहीं होने देता। ' +
          'खेत में खाली जगहें (gaps) इसी की निशानी होती हैं।',
        actions: [
          'खेत का पानी निकालें — जल-जमाव इसका सबसे बड़ा कारण है',
          'खाली जगहों पर उपचारित सेट से दोबारा बुवाई करें',
          'अगली बुवाई में सेट उपचार ज़रूर करें',
        ],
        symptoms:
          'बोए हुए सेट अंकुरित नहीं होते और खेत में जगह-जगह खाली जगहें रह जाती हैं। ' +
          'सेट को उखाड़कर चीरने पर अंदर का भाग लाल-भूरा होकर काला पड़ जाता है। ' +
          'सबसे पक्की पहचान इसकी गंध है — कटे हुए सेट से पके अनानास जैसी मीठी गंध आती है, इसीलिए इसे अनानास रोग कहते हैं। ' +
          'जल-जमाव, ठंडी मिट्टी और चोट खाए सेट इसे बढ़ाते हैं।',
        symptomsEn:
          'Setts fail to germinate leaving gaps in the field. Splitting a rotted sett shows reddish-brown to blackened ' +
          'tissue with a sweet ripe-pineapple smell — the confirming sign. Waterlogging, cold soil and bruised setts ' +
          'favour it.',
        organic: [
          'सेट को ट्राइकोडर्मा के घोल में 15–20 मिनट डुबोकर बोएँ',
          'जल निकास ठीक करें, ऊँची मेड़ पर बुवाई करें',
          'ताज़े, बिना चोट वाले सेट काटकर तुरंत बोएँ',
        ],
        chemical: [
          'सेट उपचार: कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी में 15 मिनट',
          'या थायोफिनेट मिथाइल से सेट उपचार',
        ],
        prevention: [
          'सेट काटने के बाद ज़्यादा देर न रखें, तुरंत बोएँ',
          'सेट काटते समय आँख (bud) को चोट न लगने दें',
          'खेत में जल-जमाव न होने दें',
          'ठंडी और बहुत गीली मिट्टी में बुवाई से बचें',
        ],
        speech:
          'पहचाना गया रोग है सेट सड़न, जिसे अनानास रोग या पाइनएप्पल डिज़ीज़ कहते हैं। ' +
          'इसमें बोए हुए सेट अंकुरित नहीं होते और खेत में जगह जगह खाली जगहें रह जाती हैं। ' +
          'सेट को चीरकर देखिए, अंदर का भाग लाल भूरा होकर काला पड़ा मिलेगा, ' +
          'और सबसे पक्की पहचान यह है कि उससे पके अनानास जैसी मीठी गंध आती है। ' +
          'अभी करने वाला काम यह है कि खेत का पानी निकाल दें, क्योंकि जल जमाव ही इसका सबसे बड़ा कारण है, ' +
          'और खाली जगहों पर उपचारित सेट से दोबारा बुवाई कर दें। ' +
          'अगली बार सेट को कार्बेन्डाजिम लगभग एक ग्राम प्रति लीटर पानी के घोल में पंद्रह मिनट डुबोकर ही बोइए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_pokkah_boeng: {
        nameHi: 'पोक्का बोइंग',
        nameEn: 'Pokkah Boeng',
        pathogen: 'कवक / Fungus — Fusarium moniliforme',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        note:
          'हल्का पोक्का बोइंग मौसम बदलते ही अपने आप ठीक हो जाता है। ' +
          'पर अगर ऊपर का हिस्सा सड़ने लगे (top rot), तो वह पौधा नहीं बचता — उसे निकाल दें।',
        actions: [
          'कार्बेन्डाजिम लगभग 1 ग्राम प्रति लीटर पानी में ऊपरी हिस्से पर छिड़कें',
          'सड़े हुए ऊपरी भाग वाले पौधे काटकर हटा दें',
          'खेत का जल निकास ठीक करें',
        ],
        symptoms:
          'ऊपर की नई पत्तियाँ आधार के पास पीली-सफेद पड़ जाती हैं और सिकुड़कर मुड़ जाती हैं। ' +
          'पत्तियाँ आपस में उलझकर एक गुच्छा-सा बना लेती हैं जो ठीक से खुल नहीं पाता। ' +
          'ज़्यादा रोग में तने का ऊपरी हिस्सा सड़ जाता है (top rot) और उसमें से बदबू आती है, तब वह पौधा मर जाता है। ' +
          'लंबे सूखे के बाद अचानक तेज़ बारिश होने पर यह रोग सबसे ज़्यादा दिखता है।',
        symptomsEn:
          'Young top leaves turn pale yellow-white at the base, become wrinkled and twisted, and tangle into a bunch ' +
          'that cannot unfurl. In severe cases the top of the stalk rots with a foul smell and the plant dies. Most ' +
          'common when heavy rain follows a long dry spell.',
        organic: [
          'संतुलित खाद और सही जल निकास',
          'रोग-रोधी किस्में लगाएँ',
          'प्रभावित ऊपरी भाग काटकर खेत से बाहर करें',
        ],
        chemical: [
          'कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी',
          'या कॉपर ऑक्सीक्लोराइड — लगभग 3 ग्राम प्रति लीटर पानी',
          'छिड़काव पौधे के ऊपरी हिस्से (गोफ) पर करें',
        ],
        prevention: [
          'जल निकास ठीक रखें',
          'नाइट्रोजन एक साथ ज़्यादा न दें',
          'लंबे सूखे के बाद अचानक भारी सिंचाई से बचें',
          'रोगग्रस्त अवशेष हटाएँ',
        ],
        speech:
          'पहचाना गया रोग है पोक्का बोइंग। ' +
          'इसमें ऊपर की नई पत्तियाँ आधार के पास पीली सफेद पड़ जाती हैं, सिकुड़कर मुड़ जाती हैं ' +
          'और आपस में उलझकर एक गुच्छा बना लेती हैं जो ठीक से खुल नहीं पाता। ' +
          'अच्छी बात यह है कि हल्का पोक्का बोइंग मौसम बदलते ही अपने आप ठीक हो जाता है। ' +
          'अभी करने वाला काम यह है कि कार्बेन्डाजिम लगभग एक ग्राम प्रति लीटर पानी में मिलाकर पौधे के ऊपरी हिस्से पर छिड़कें, ' +
          'और खेत का जल निकास ठीक कर दें। ' +
          'अगर किसी पौधे का ऊपरी हिस्सा सड़कर बदबू दे रहा हो तो वह पौधा नहीं बचेगा, उसे काटकर हटा दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_brownrust: {
        nameHi: 'भूरा रतुआ (गेरुई)',
        nameEn: 'Brown Rust',
        pathogen: 'कवक / Fungus — Puccinia melanocephala',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'प्रोपिकोनाज़ोल लगभग 1 मि.ली. प्रति लीटर पानी में छिड़कें',
          'पत्ती की दोनों सतहें भिगोएँ, सुबह या शाम को छिड़काव करें',
          '15 दिन बाद ज़रूरत हो तो दोहराएँ',
        ],
        symptoms:
          'पत्ती की निचली सतह पर छोटे-छोटे नारंगी-भूरे उभरे हुए फफोले बनते हैं जो फटकर जंग जैसा चूर्ण छोड़ते हैं — ' +
          'उँगली फेरने पर उँगली पर भूरा-नारंगी रंग लग जाता है, यही पक्की पहचान है। ' +
          'ज़्यादा रोग में पत्तियाँ पीली पड़कर समय से पहले सूख जाती हैं और पौधा कमज़ोर हो जाता है। ' +
          'नम, गर्म मौसम और घनी फसल इसे बढ़ाते हैं।',
        symptomsEn:
          'Small raised orange-brown pustules on the lower leaf surface burst into rusty powder that rubs off on the ' +
          'finger — the confirming test. Heavy infection yellows and prematurely dries the leaves. Warm humid weather ' +
          'and dense stands favour it.',
        organic: [
          'रोग-रोधी किस्में लगाएँ',
          'नियमित छिलाई करें ताकि हवा चले',
          'पोटाश दें, नाइट्रोजन संतुलित रखें',
        ],
        chemical: [
          'प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'या मैंकोज़ेब 75 WP — लगभग 2 ग्राम प्रति लीटर पानी',
        ],
        prevention: [
          'घनी बुवाई से बचें',
          'जल निकास ठीक रखें',
          'रोगग्रस्त पत्तियाँ खेत में न छोड़ें',
          'संतुलित खाद दें',
        ],
        speech:
          'पहचाना गया रोग है भूरा रतुआ, जिसे ब्राउन रस्ट या गेरुई कहते हैं। ' +
          'इसकी पहचान आसान है, पत्ती की निचली सतह पर छोटे नारंगी भूरे उभरे फफोले बनते हैं, ' +
          'और उन पर उँगली फेरने से उँगली पर जंग जैसा भूरा नारंगी रंग लग जाता है। ' +
          'अभी करने वाला काम यह है कि प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी में मिलाकर छिड़कें, ' +
          'और छिड़काव करते समय पत्ती की दोनों सतहें अच्छी तरह भिगोएँ, सुबह या शाम का समय चुनें। ' +
          'पंद्रह दिन बाद ज़रूरत हो तो दोहरा दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      sugarcane_brown_spot: {
        nameHi: 'भूरा धब्बा',
        nameEn: 'Brown Spot',
        pathogen: 'कवक / Fungus — Cercospora longipes',
        severity: 'low', severityHi: 'कम नुकसान',
        risk: 'low', riskHi: 'कम जोखिम / Low Risk',
        actions: [
          'हल्का रोग हो तो छिड़काव की ज़रूरत नहीं',
          'ज़्यादा फैले तो मैंकोज़ेब लगभग 2 ग्राम प्रति लीटर पानी',
          'सूखी पत्तियाँ छीलकर हटा दें',
        ],
        symptoms:
          'पत्तियों पर लाल-भूरे रंग के लंबे-गोल धब्बे बनते हैं जिनके चारों ओर हल्का पीला घेरा होता है। ' +
          'धब्बे पत्ती की लंबाई के साथ-साथ फैलते हैं और पुरानी पत्तियों पर ज़्यादा मिलते हैं। ' +
          'रतुआ से फर्क यह है कि इसमें कोई उभरा हुआ फफोला या जंग जैसा चूर्ण नहीं निकलता। ' +
          'उपज पर असर आमतौर पर कम होता है।',
        symptomsEn:
          'Reddish-brown elongated spots with a pale yellow halo, spreading along the leaf and mostly on older leaves. ' +
          'Unlike rust there are no raised pustules or rusty powder. Yield impact is usually low.',
        organic: [
          'नियमित छिलाई',
          'संतुलित खाद, खासकर पोटाश',
          'खेत की सफाई',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2 ग्राम प्रति लीटर पानी (सिर्फ ज़्यादा रोग में)',
        ],
        prevention: [
          'जल निकास ठीक रखें',
          'घनी बुवाई से बचें',
          'रोगग्रस्त पत्तियाँ हटाएँ',
        ],
        speech:
          'पहचाना गया रोग है भूरा धब्बा, जिसे ब्राउन स्पॉट कहते हैं। ' +
          'इसमें पत्तियों पर लाल भूरे लंबे गोल धब्बे बनते हैं जिनके चारों ओर हल्का पीला घेरा होता है। ' +
          'रतुआ से इसका फर्क यह है कि इसमें कोई उभरा हुआ फफोला या जंग जैसा चूर्ण नहीं निकलता। ' +
          'इससे उपज पर आमतौर पर कम असर पड़ता है, इसलिए हल्का रोग हो तो दवा की ज़रूरत नहीं। ' +
          'ज़्यादा फैल जाए तो मैंकोज़ेब लगभग दो ग्राम प्रति लीटर पानी में छिड़कें और सूखी पत्तियाँ छीलकर हटा दें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },
    },
  },

  /* ##################### 4. COTTON / कपास ##################### */
  /* Model: Teachable Machine (TFJS) — models/cotton/model.json
     NOTE: Kuch labels me extra space hai (jaise 'Cotton_bollrot ') — wo model ki
        apni spelling hai, isliye yahan HU-BA-HU wahi rakhi gayi hai. Badalne
        par advisory milna band ho jayega.                                    */
  cotton: {
    id: 'cotton',
    nameHi: 'कपास',
    nameEn: 'Cotton',
    altHi: 'रुई / नरमा',
    icon: 'crop-cotton',
    seasonHi: 'खरीफ',
    labels: [
      'Cotton_American_Bollworm',   // 0
      'Cotton_Anthracnose',         // 1
      'Cotton_Aphid',               // 2
      'Cotton_Bacterial_Blight',    // 3
      'Cotton_bollrot ',            // 4  (model me aage space hai)
      'Cotton_Bollworm ',           // 5  (model me aage space hai)
      'Cotton_Healthy',             // 6
      'Cotton_Mealy _Bug',          // 7  (model me beech me space hai)
      'Cotton_Pink_Bollworm',       // 8
      'Cotton_Red_Bug',             // 9
      'Cotton_Thirps ',             // 10 (model ki spelling "Thirps" + space)
      'Cotton_Whitefly',            // 11
    ],
    classes: {

      /* ------------------------------------------------------------------ */
      Cotton_American_Bollworm: {
        nameHi: 'अमेरिकन सुंडी',
        nameEn: 'American Bollworm',
        pathogen: 'कीट / Insect — Helicoverpa armigera',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'खेत में 5 जगह 10 पौधे देखें — 1 सुंडी/पौधा मिले तो दवा डालें',
          'बड़ी सुंडियाँ हाथ से चुनकर नष्ट करें',
          'इमामेक्टिन बेंज़ोएट ~0.4 ग्राम/लीटर पानी छिड़कें',
          'फेरोमोन ट्रैप 8–10 प्रति एकड़ लगाएँ',
        ],
        symptoms:
          'हरी-भूरी धारीदार सुंडी कली (square), फूल और डोडे (boll) में गोल छेद करके अंदर घुस जाती है — ' +
          'सिर अंदर और शरीर बाहर, यही इसकी पक्की पहचान है। छेद के पास काली बीट (मल) दिखती है। ' +
          'हमला हुई कलियाँ और डोडे पीले पड़कर गिर जाते हैं, और बचे डोडे में रुई दागी व कम निकलती है। ' +
          'एक ही सुंडी कई डोडे खराब कर देती है, इसलिए संख्या कम होने पर भी नुकसान बड़ा होता है।',
        symptomsEn:
          'Greenish-brown striped caterpillar bores a round hole into squares, flowers and bolls with its head inside ' +
          'and body outside; black frass near the hole. Attacked squares and bolls yellow and shed. One larva damages ' +
          'several bolls, so even low counts cause heavy loss.',
        organic: [
          'फेरोमोन ट्रैप 8–10 प्रति एकड़ — नर पतंगे पकड़कर अंडे देना घटता है',
          'HaNPV 250 LE प्रति एकड़ शाम को छिड़कें (धूप में असर घट जाता है)',
          'बेसिलस थुरिंजिएंसिस (Bt) 1 ग्राम प्रति लीटर पानी',
          'खेत में 10 पक्षी-बैठक (bird perch) प्रति एकड़ लगाएँ — पक्षी सुंडी खा जाते हैं',
          'मेड़ पर गेंदा (trap crop) लगाएँ — पतंगा वहीं अंडे देता है',
        ],
        chemical: [
          'इमामेक्टिन बेंज़ोएट 5 SG — लगभग 0.4 ग्राम प्रति लीटर पानी',
          'विकल्प: क्लोरएन्ट्रानिलिप्रोल 18.5 SC — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'विकल्प: स्पाइनोसैड 45 SC — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'हर बार दवा बदलें (रोटेशन) — एक ही दवा से सुंडी में प्रतिरोध बन जाता है',
        ],
        prevention: [
          'समय पर बुवाई करें, फसल का मौसम लंबा न खींचें',
          'गहरी गर्मी की जुताई — ज़मीन में छिपे प्यूपा धूप से मर जाते हैं',
          'नाइट्रोजन ज़्यादा न दें — मुलायम बढ़वार पर सुंडी ज़्यादा आती है',
          'हर हफ्ते खेत की निगरानी, ट्रैप में पतंगे गिनते रहें',
        ],
        speech:
          'पहचानी गई है अमेरिकन सुंडी, जिसे हेलिकोवर्पा भी कहते हैं। ' +
          'यह हरी-भूरी धारीदार सुंडी कली, फूल और डोडे में गोल छेद करके अंदर घुस जाती है — सिर अंदर और शरीर बाहर रहता है। ' +
          'छेद के पास काली बीट दिखती है और हमला हुए डोडे पीले पड़कर गिर जाते हैं। ' +
          'पहले खेत में पाँच जगह दस-दस पौधे देखिए। अगर एक पौधे पर एक सुंडी मिले तो दवा डालने का समय हो गया है। ' +
          'इमामेक्टिन बेंज़ोएट लगभग शून्य दशमलव चार ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'साथ में आठ से दस फेरोमोन ट्रैप प्रति एकड़ लगाइए और खेत में पक्षियों के बैठने के लिए डंडे गाड़ दीजिए। ' +
          'हर बार दवा बदलते रहें, वरना सुंडी में प्रतिरोध बन जाता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Cotton_Pink_Bollworm: {
        nameHi: 'गुलाबी सुंडी',
        nameEn: 'Pink Bollworm',
        pathogen: 'कीट / Insect — Pectinophora gossypiella',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'बहुत ज़्यादा जोखिम / Very High Risk',
        actions: [
          'डोडा तोड़कर अंदर देखें — गुलाबी सुंडी और कटे बीज दिखेंगे',
          '"गुलाब जैसे" बंद फूल (rosette) तोड़कर जला दें',
          'गुलाबी सुंडी वाले फेरोमोन ट्रैप 8–10 प्रति एकड़',
          'प्रोफेनोफॉस ~2 मि.ली./लीटर या इमामेक्टिन ~0.4 ग्राम/लीटर',
        ],
        symptoms:
          'यह भारत में कपास का सबसे बड़ा दुश्मन है और बाहर से लगभग कुछ नहीं दिखता — यही इसे खतरनाक बनाता है। ' +
          'पक्की पहचान: फूल की पंखुड़ियाँ पूरी खुलती नहीं, गुलाब की कली जैसी उलझी बंद रह जाती हैं (rosette flower)। ' +
          'डोडा तोड़कर देखने पर अंदर गुलाबी रंग की छोटी सुंडी मिलती है, बीज कटे-जुड़े हुए और रुई दागी-पीली होती है। ' +
          'डोडे बाहर से हरे दिखते हैं पर अंदर से खोखले होते हैं, समय से पहले खुल जाते हैं और रुई की गुणवत्ता गिर जाती है। ' +
          'Bt कपास पर भी यह अब लगती है, इसलिए "Bt है तो चिंता नहीं" वाली सोच खतरनाक है।',
        symptomsEn:
          'The most damaging cotton pest in India and almost invisible from outside. Key sign: flowers fail to open ' +
          'properly and stay twisted like a rosebud (rosette flower). Opening a boll reveals a small pink larva, cut ' +
          'and webbed seeds and stained lint. Bolls look green outside but are hollow inside and open prematurely. ' +
          'It now attacks Bt cotton too.',
        organic: [
          'गुलाबी सुंडी वाले (Gossyplure) फेरोमोन ट्रैप 8–10 प्रति एकड़ — फूल आते ही लगाएँ',
          'रोज़ खेत घूमकर rosette फूल तोड़ें और जला दें — यही सबसे असरदार सस्ता उपाय है',
          'ट्राइकोग्रामा कार्ड 1.5 लाख अंडे प्रति एकड़, 15 दिन के अंतर पर',
          'कटाई के बाद बचे डोडे और लकड़ी खेत में न छोड़ें — सुंडी उसी में सर्दी काटती है',
          'फसल दिसंबर के बाद न खींचें — लंबा मौसम इसी कीट को पालता है',
        ],
        chemical: [
          'प्रोफेनोफॉस 50 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'विकल्प: इमामेक्टिन बेंज़ोएट 5 SG — लगभग 0.4 ग्राम प्रति लीटर पानी',
          'विकल्प: थायोडिकार्ब 75 WP — लगभग 1 ग्राम प्रति लीटर पानी',
          'ट्रैप में लगातार 3 रात 8 से ज़्यादा पतंगे मिलें तभी छिड़काव करें',
        ],
        prevention: [
          'समय पर बुवाई और समय पर फसल खत्म करना — यही सबसे बड़ा बचाव है',
          'हर साल एक ही खेत में कपास न लगाएँ, फसल चक्र अपनाएँ',
          'प्रमाणित बीज; पिछली फसल का बीज कभी न बोएँ',
          'कटाई के बाद खेत में पशु चराएँ या गहरी जुताई करें',
          'गाँव में सब मिलकर एक ही समय बुवाई करें — अकेले करने से फायदा कम है',
        ],
        speech:
          'सावधान! पहचानी गई है गुलाबी सुंडी, जो भारत में कपास का सबसे बड़ा दुश्मन है। ' +
          'यह बाहर से लगभग दिखती नहीं, इसीलिए खतरनाक है। पहचान यह है कि फूल पूरा खुलता नहीं और गुलाब की कली जैसा बंद रह जाता है। ' +
          'एक डोडा तोड़कर देखिए — अंदर गुलाबी रंग की छोटी सुंडी, कटे हुए बीज और दागी रुई मिलेगी। ' +
          'सबसे पहले ऐसे बंद फूल तोड़कर जला दीजिए, यही सबसे सस्ता और असरदार उपाय है। ' +
          'गुलाबी सुंडी वाले फेरोमोन ट्रैप आठ से दस प्रति एकड़ लगाइए। ' +
          'ट्रैप में लगातार तीन रात आठ से ज़्यादा पतंगे मिलें तो प्रोफेनोफॉस लगभग दो मिलीलीटर प्रति लीटर पानी का छिड़काव करें। ' +
          'ध्यान रखिए, बी टी कपास पर भी यह अब लगती है। और कटाई के बाद बचे डोडे व लकड़ी खेत में मत छोड़िए, सुंडी उसी में सर्दी काटती है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      'Cotton_Bollworm ': {
        nameHi: 'डोडा सुंडी (सामान्य)',
        nameEn: 'Bollworm',
        pathogen: 'कीट / Insect — डोडे में छेद करने वाली सुंडियाँ (Earias, Helicoverpa)',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'गिरी हुई कलियाँ और डोडे रोज़ बीनकर नष्ट करें',
          'इमामेक्टिन बेंज़ोएट ~0.4 ग्राम/लीटर पानी छिड़कें',
          'फेरोमोन ट्रैप 8–10 प्रति एकड़',
          'बड़ी सुंडियाँ हाथ से चुनें — शाम के समय आसानी से मिलती हैं',
        ],
        symptoms:
          'कली, फूल और डोडे में छेद और उनका गिरना इस समूह की आम पहचान है। ' +
          'चित्तीदार सुंडी (Earias) पहले तने की नई कोंपल में घुसकर उसे मुरझा देती है — ऊपर की टहनी झुककर सूख जाती है, ' +
          'बाद में वही सुंडी डोडों में चली जाती है। छेद के पास हरी-काली बीट जमा दिखती है। ' +
          'हमला हुए डोडे टेढ़े-मेढ़े बढ़ते हैं और रुई कम व दागी निकलती है।',
        symptomsEn:
          'Holes in squares, flowers and bolls with shedding. Spotted bollworm (Earias) first bores into the growing ' +
          'shoot tip, making it droop and dry, then moves to bolls. Green-black frass near the holes; damaged bolls ' +
          'grow misshapen with poor stained lint.',
        organic: [
          'HaNPV / Bt (बेसिलस थुरिंजिएंसिस) 1 ग्राम प्रति लीटर पानी, शाम को',
          'नीम बीज गिरी अर्क 5% — अंडे देने से रोकता है',
          'ट्राइकोग्रामा कार्ड 1.5 लाख अंडे प्रति एकड़',
          'मुरझाई कोंपलें तोड़कर नष्ट करें — अंदर की सुंडी वहीं मर जाएगी',
        ],
        chemical: [
          'इमामेक्टिन बेंज़ोएट 5 SG — लगभग 0.4 ग्राम प्रति लीटर पानी',
          'विकल्प: क्विनालफॉस 25 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'विकल्प: क्लोरएन्ट्रानिलिप्रोल 18.5 SC — लगभग 0.3 मि.ली. प्रति लीटर',
          'दवा बदल-बदल कर दें; कटाई से 20 दिन पहले छिड़काव रोक दें',
        ],
        prevention: [
          'समय पर बुवाई, संतुलित नाइट्रोजन',
          'गहरी गर्मी की जुताई से छिपे प्यूपा नष्ट करें',
          'गिरी हुई कलियाँ/डोडे खेत में सड़ने न दें',
          'हर हफ्ते निगरानी — शुरुआत में ही रोकना सस्ता पड़ता है',
        ],
        speech:
          'पहचानी गई है डोडा सुंडी। यह कली, फूल और डोडे में छेद करती है, जिससे वे गिर जाते हैं। ' +
          'चित्तीदार सुंडी पहले ऊपर की नई कोंपल में घुसती है, जिससे टहनी झुककर सूख जाती है, और बाद में डोडों में चली जाती है। ' +
          'सबसे पहले गिरी हुई कलियाँ और डोडे रोज़ बीनकर नष्ट कीजिए, और मुरझाई हुई कोंपलें तोड़ दीजिए। ' +
          'इमामेक्टिन बेंज़ोएट लगभग शून्य दशमलव चार ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'फेरोमोन ट्रैप आठ से दस प्रति एकड़ लगाइए और हर बार दवा बदलते रहिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Cotton_Whitefly: {
        nameHi: 'सफेद मक्खी',
        nameEn: 'Whitefly',
        pathogen: 'कीट / Insect — Bemisia tabaci (पत्ती मरोड़ विषाणु फैलाती है)',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'पीले चिपचिपे ट्रैप 10–12 प्रति एकड़ तुरंत लगाएँ',
          'नीम तेल 5 मि.ली./लीटर शाम को — पत्ती की निचली सतह पर',
          'ज़्यादा प्रकोप में डायफेनथीयूरोन ~1.2 ग्राम/लीटर',
          'यूरिया की अतिरिक्त मात्रा तुरंत रोक दें',
        ],
        symptoms:
          'पत्ती हिलाने पर सफेद, बहुत छोटी मक्खियाँ बादल की तरह उड़ती हैं और वापस निचली सतह पर बैठ जाती हैं — यही पक्की पहचान है। ' +
          'ये रस चूसती हैं जिससे पत्तियाँ पीली पड़कर नीचे की ओर मुड़ जाती हैं। ' +
          'इनका मीठा स्राव (हनीड्यू) पत्तियों को चिपचिपा कर देता है, जिस पर काली फफूंद जम जाती है और पत्ती काली दिखने लगती है — ' +
          'इससे रुई भी दागी हो जाती है। सबसे बड़ा खतरा यह है कि यह पत्ती मरोड़ विषाणु (CLCuV) फैलाती है, जिसका कोई इलाज नहीं। ' +
          'सूखा-गर्म मौसम और ज़्यादा यूरिया इसे तेज़ी से बढ़ाते हैं।',
        symptomsEn:
          'Shaking a plant sends up a cloud of tiny white flies that settle back under the leaves. Sap sucking turns ' +
          'leaves yellow and curls them downward; sticky honeydew leads to black sooty mould that also stains lint. ' +
          'Critically, it transmits Cotton Leaf Curl Virus, for which there is no cure. Worse in hot dry weather and ' +
          'with excess nitrogen.',
        organic: [
          'पीले चिपचिपे ट्रैप 10–12 प्रति एकड़ — शुरुआत में ही लगाएँ',
          'नीम तेल 5 मि.ली. प्रति लीटर पानी + थोड़ा साबुन, शाम को, निचली सतह पर',
          'वर्टिसिलियम लेकानी 5 ग्राम प्रति लीटर पानी (नम मौसम में असरदार)',
          'खेत और मेड़ के खरपतवार साफ रखें — कांग्रेस घास व भिंडी इसे पालते हैं',
          'मित्र कीट (क्राइसोपा, एनकार्सिया) बचाएँ — बेवजह कीटनाशक न डालें',
        ],
        chemical: [
          'डायफेनथीयूरोन 50 WP — लगभग 1.2 ग्राम प्रति लीटर पानी',
          'विकल्प: फ्लोनिकामिड 50 WG — लगभग 0.3 ग्राम प्रति लीटर पानी',
          'विकल्प: स्पाइरोमेसीफेन 22.9 SC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'सिंथेटिक पायरेथ्रॉइड बिल्कुल न डालें — इससे सफेद मक्खी और भड़कती है',
        ],
        prevention: [
          'रोग-रोधी / सहनशील किस्में लगाएँ',
          'समय पर बुवाई; बहुत घनी बुवाई न करें, हवा चलती रहे',
          'नाइट्रोजन संतुलित — ज़्यादा यूरिया सफेद मक्खी को न्योता है',
          'खरपतवार नियंत्रण, खासकर मेड़ और नाली के किनारे',
          'हर हफ्ते ऊपर से तीसरी पत्ती की निचली सतह पर गिनती करें',
        ],
        speech:
          'पहचानी गई है सफेद मक्खी। पौधा हिलाने पर बहुत छोटी सफेद मक्खियाँ बादल की तरह उड़ती हैं और फिर पत्ती की निचली सतह पर बैठ जाती हैं। ' +
          'ये रस चूसती हैं जिससे पत्तियाँ पीली पड़कर नीचे मुड़ जाती हैं, और इनके चिपचिपे स्राव पर काली फफूंद जम जाती है। ' +
          'सबसे बड़ा खतरा यह है कि यह पत्ती मरोड़ विषाणु फैलाती है, जिसका कोई इलाज नहीं है। इसीलिए इसे शुरू में ही रोकना ज़रूरी है। ' +
          'तुरंत पीले चिपचिपे ट्रैप दस से बारह प्रति एकड़ लगाइए, और नीम तेल पाँच मिलीलीटर प्रति लीटर पानी का शाम को छिड़काव करें, पत्ती की निचली सतह पर। ' +
          'ज़्यादा प्रकोप हो तो डायफेनथीयूरोन लगभग एक दशमलव दो ग्राम प्रति लीटर पानी डालें। ' +
          'एक ज़रूरी चेतावनी — सिंथेटिक पायरेथ्रॉइड दवा बिल्कुल मत डालिए, उससे सफेद मक्खी और भड़क जाती है। ' +
          'यूरिया की अतिरिक्त मात्रा भी तुरंत रोक दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      'Cotton_Mealy _Bug': {
        nameHi: 'मिलीबग (सफेद जूँ)',
        nameEn: 'Mealybug',
        pathogen: 'कीट / Insect — Phenacoccus solenopsis',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'ग्रस्त टहनियाँ थैली में काटकर खेत से बाहर जलाएँ',
          'बुप्रोफेज़िन 25 SC ~2 मि.ली./लीटर — मोम तोड़ने के लिए साबुन मिलाएँ',
          'खेत व मेड़ की गाजर घास (कांग्रेस घास) उखाड़ें',
          'ग्रस्त खेत के औज़ार/जूते दूसरे खेत में न ले जाएँ',
        ],
        symptoms:
          'तने, टहनियों और पत्ती के जोड़ों पर सफेद रुई जैसे मोम से ढके छोटे कीटों का गुच्छा जमा दिखता है — ' +
          'ऐसा लगता है जैसे पौधे पर रुई चिपका दी गई हो। ये रस चूसते हैं जिससे पौधा ठिगना रह जाता है, ' +
          'पत्तियाँ मुड़कर पीली पड़ जाती हैं और गंभीर हालत में पूरा पौधा सूख जाता है। ' +
          'इनके मीठे स्राव पर काली फफूंद जमती है और चींटियाँ चढ़ी रहती हैं — चींटियाँ इन्हें एक पौधे से दूसरे पर ले जाती हैं। ' +
          'यह खेत में धब्बों (patches) में फैलता है, इसलिए शुरुआत में ही रोकना बहुत ज़रूरी है।',
        symptomsEn:
          'Clusters of small insects covered in white cottony wax on stems, branches and leaf axils, as if cotton wool ' +
          'were stuck to the plant. Sap sucking stunts the plant, curls and yellows leaves, and can kill it. Honeydew ' +
          'brings sooty mould and ants, which carry the bugs to new plants. Spreads in patches — stop it early.',
        organic: [
          'शुरुआती धब्बे वाले पौधे थैली में काटकर खेत से बाहर जलाएँ',
          'गाजर घास (Parthenium), भिंडी व अन्य पोषक खरपतवार हटाएँ — यहीं से आता है',
          'क्रिप्टोलेमस बीटल 100 प्रति एकड़ छोड़ें (मित्र कीट, मिलीबग खाता है)',
          'नीम तेल 5 मि.ली. + 1 ग्राम साबुन प्रति लीटर — मोम की परत टूटती है',
          'चींटियों की कतार रोकें — तने पर चिपचिपा बैंड लगाएँ',
        ],
        chemical: [
          'बुप्रोफेज़िन 25 SC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'विकल्प: प्रोफेनोफॉस 50 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'हर छिड़काव में थोड़ा साबुन/स्टिकर मिलाएँ, वरना मोम पर दवा टिकती ही नहीं',
          'सिर्फ ग्रस्त धब्बों पर छिड़काव करें (spot spray) — पूरा खेत नहीं',
        ],
        prevention: [
          'खेत, मेड़, नाली — सब जगह खरपतवार साफ रखें',
          'ग्रस्त खेत से औज़ार, मज़दूर के कपड़े व बैलगाड़ी दूसरे खेत में न जाएँ',
          'कटाई के बाद कपास की लकड़ी खेत में न छोड़ें',
          'हर हफ्ते खेत में घूमकर सफेद रुई जैसे धब्बे खोजें',
        ],
        speech:
          'पहचाना गया है मिलीबग, जिसे सफेद जूँ भी कहते हैं। ' +
          'तने और पत्ती के जोड़ों पर सफेद रुई जैसे मोम से ढके कीटों का गुच्छा दिखता है, जैसे पौधे पर रुई चिपका दी हो। ' +
          'ये रस चूसते हैं जिससे पौधा ठिगना रह जाता है और गंभीर हालत में सूख जाता है। ' +
          'यह खेत में धब्बों में फैलता है, इसलिए शुरुआत में ही रोकना ज़रूरी है। ' +
          'सबसे पहले ग्रस्त टहनियाँ थैली में काटकर खेत से बाहर जला दीजिए। ' +
          'फिर बुप्रोफेज़िन लगभग दो मिलीलीटर प्रति लीटर पानी का छिड़काव करें, और उसमें थोड़ा साबुन ज़रूर मिलाएँ, वरना मोम की परत पर दवा टिकती ही नहीं। ' +
          'खेत और मेड़ की गाजर घास उखाड़ दीजिए, यहीं से यह कीट आता है। ' +
          'और ग्रस्त खेत के औज़ार दूसरे खेत में मत ले जाइए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Cotton_Aphid: {
        nameHi: 'माहू / चेपा',
        nameEn: 'Aphid',
        pathogen: 'कीट / Insect — Aphis gossypii (रस चूसक)',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'पहले गिनें — 10–15 माहू प्रति पत्ती हो तभी दवा डालें',
          'नीम तेल 5 मि.ली./लीटर शाम को छिड़कें',
          'ज़्यादा प्रकोप में इमिडाक्लोप्रिड ~0.3 मि.ली./लीटर',
          'लेडीबर्ड बीटल दिखें तो छिड़काव टाल दें',
        ],
        symptoms:
          'नई कोंपलों और पत्तियों की निचली सतह पर हरे-काले छोटे कीटों का झुंड चिपका दिखता है। ' +
          'रस चूसने से पत्तियाँ नीचे की ओर मुड़ जाती हैं और पौधा ठिगना रह जाता है। ' +
          'इनका मीठा स्राव पत्तियों को चिपचिपा कर देता है, जिस पर काली फफूंद जम जाती है — ' +
          'यही स्राव खुली रुई पर गिरे तो रुई चिपचिपी और दागी हो जाती है, जिससे भाव गिर जाता है। ' +
          'चींटियाँ चढ़ी दिखना इसका आसान इशारा है।',
        symptomsEn:
          'Clusters of small green-black insects on tender shoots and leaf undersides; leaves curl downward and plants ' +
          'stay stunted. Sticky honeydew brings black sooty mould, and if it falls on open bolls the lint becomes ' +
          'sticky and stained, lowering the price. Ants on the plant are an easy clue.',
        organic: [
          'नीम तेल 5 मि.ली. प्रति लीटर पानी — शाम को, निचली सतह पर',
          'मित्र कीट बचाएँ — लेडीबर्ड बीटल, सिरफिड मक्खी, क्राइसोपा',
          'पीले चिपचिपे ट्रैप 8–10 प्रति एकड़',
          'यूरिया की मात्रा घटाएँ — मुलायम कोंपलों पर माहू ज़्यादा आता है',
        ],
        chemical: [
          'इमिडाक्लोप्रिड 17.8 SL — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'विकल्प: थायामेथोक्सम 25 WG — लगभग 0.2 ग्राम प्रति लीटर पानी',
          'विकल्प: फ्लोनिकामिड 50 WG — लगभग 0.3 ग्राम प्रति लीटर पानी',
          'बीज उपचार पहले से हो तो 40–45 दिन तक अलग छिड़काव की ज़रूरत नहीं',
        ],
        prevention: [
          'बुवाई के समय बीज उपचार (इमिडाक्लोप्रिड) कर लें',
          'नाइट्रोजन 3 भागों में बाँटकर, संतुलित मात्रा में',
          'खरपतवार साफ रखें; हर हफ्ते निगरानी',
          'बेवजह कीटनाशक न छिड़कें — मित्र कीट मरने से प्रकोप बढ़ता है',
        ],
        speech:
          'पहचाना गया है माहू, जिसे चेपा भी कहते हैं। यह एक रस चूसक कीट है। ' +
          'नई कोंपलों और पत्तियों की निचली सतह पर हरे-काले छोटे कीट झुंड में चिपके रहते हैं, जिससे पत्तियाँ नीचे की ओर मुड़ जाती हैं। ' +
          'इनका चिपचिपा स्राव अगर खुली रुई पर गिर जाए तो रुई दागी हो जाती है और भाव गिर जाता है। ' +
          'पहले गिनती कीजिए — एक पत्ती पर दस से पंद्रह माहू से ज़्यादा हों, तभी दवा की ज़रूरत है। ' +
          'शुरुआत में नीम तेल पाँच मिलीलीटर प्रति लीटर पानी का शाम को छिड़काव करें। ' +
          'ज़्यादा प्रकोप हो तो इमिडाक्लोप्रिड लगभग शून्य दशमलव तीन मिलीलीटर प्रति लीटर पानी डालें। ' +
          'अगर खेत में लेडीबर्ड बीटल दिख रही हैं तो छिड़काव टाल दीजिए, वे खुद माहू खा जाती हैं। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      'Cotton_Thirps ': {
        nameHi: 'थ्रिप्स',
        nameEn: 'Thrips',
        pathogen: 'कीट / Insect — Thrips tabaci / Scirtothrips dorsalis',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'नीली चिपचिपी ट्रैप 8–10 प्रति एकड़ लगाएँ',
          'नीम तेल 5 मि.ली./लीटर — पत्ती की निचली सतह पर',
          'ज़्यादा प्रकोप में फिप्रोनिल 5 SC ~2 मि.ली./लीटर',
          'सूखे मौसम में सिंचाई न टालें — सूखे में थ्रिप्स बढ़ता है',
        ],
        symptoms:
          'पत्तियों की निचली सतह पर चाँदी जैसी चमकदार धारियाँ या खरोंच जैसे निशान बनते हैं — यही पक्की पहचान है। ' +
          'पत्ती के किनारे ऊपर की ओर मुड़ जाते हैं (कप जैसी शक्ल) और पत्ती खुरदरी, चमड़े जैसी हो जाती है। ' +
          'कीट बहुत छोटे, पीले-भूरे और लंबे होते हैं — सफेद कागज़ पर पत्ती झाड़ने से दिखते हैं। ' +
          'नए पौधों में बढ़वार रुक जाती है और कलियाँ गिर सकती हैं। सूखा-गर्म मौसम इन्हें बढ़ाता है।',
        symptomsEn:
          'Silvery streaks or scratch-like marks on leaf undersides — the key sign. Leaf margins curl upward into a cup ' +
          'shape and the leaf turns rough and leathery. The insects are tiny, slender and yellow-brown; tap a leaf over ' +
          'white paper to see them. Seedlings stop growing and squares may shed. Worse in hot dry weather.',
        organic: [
          'नीली चिपचिपी ट्रैप 8–10 प्रति एकड़ (थ्रिप्स नीले रंग की ओर आता है)',
          'नीम तेल 5 मि.ली. प्रति लीटर पानी, 10 दिन के अंतर पर',
          'वर्टिसिलियम लेकानी 5 ग्राम प्रति लीटर पानी',
          'सिंचाई समय पर करें — नमी बनी रहे तो थ्रिप्स घटता है',
        ],
        chemical: [
          'फिप्रोनिल 5 SC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'विकल्प: इमिडाक्लोप्रिड 17.8 SL — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'विकल्प: स्पाइनोसैड 45 SC — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'छिड़काव पत्ती की निचली सतह पर पहुँचना ज़रूरी है, वरना असर नहीं होगा',
        ],
        prevention: [
          'बुवाई के समय बीज उपचार (इमिडाक्लोप्रिड 5 मि.ली./किलो बीज)',
          'खरपतवार साफ रखें — थ्रिप्स उन्हीं पर पलता है',
          'सूखे दौर में सिंचाई का अंतराल न बढ़ाएँ',
          'हर हफ्ते ऊपर से तीसरी पत्ती की निचली सतह जाँचें',
        ],
        speech:
          'पहचाना गया है थ्रिप्स। यह बहुत छोटा रस चूसक कीट है। ' +
          'पत्तियों की निचली सतह पर चाँदी जैसी चमकदार धारियाँ बनती हैं और पत्ती के किनारे ऊपर की ओर मुड़कर कप जैसी शक्ल ले लेते हैं। ' +
          'पत्ती को सफेद कागज़ पर झाड़कर देखिए, छोटे पीले-भूरे लंबे कीट दिखेंगे। ' +
          'नीली चिपचिपी ट्रैप आठ से दस प्रति एकड़ लगाइए, क्योंकि थ्रिप्स नीले रंग की ओर आता है। ' +
          'नीम तेल पाँच मिलीलीटर प्रति लीटर पानी का छिड़काव करें, और दवा पत्ती की निचली सतह पर ज़रूर पहुँचनी चाहिए। ' +
          'ज़्यादा प्रकोप हो तो फिप्रोनिल लगभग दो मिलीलीटर प्रति लीटर पानी डालें। ' +
          'एक ज़रूरी बात — सूखे मौसम में सिंचाई मत टालिए, सूखे में थ्रिप्स तेज़ी से बढ़ता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Cotton_Red_Bug: {
        nameHi: 'लाल बग (लाल मत्कुण)',
        nameEn: 'Red Cotton Bug',
        pathogen: 'कीट / Insect — Dysdercus koenigii',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'सुबह झुंड में बैठे बग हाथ/जाली से इकट्ठा कर नष्ट करें',
          'खेत में गिरे डोडे और बीज तुरंत उठा लें',
          'ज़्यादा प्रकोप में क्विनालफॉस ~2 मि.ली./लीटर',
          'खुली रुई जल्दी चुनें — देर करने पर दाग बढ़ते हैं',
        ],
        symptoms:
          'चमकीले लाल रंग के बग, बीच में काली पट्टी के साथ, खुले डोडों और गिरे बीजों पर झुंड में बैठे दिखते हैं। ' +
          'ये बीज का रस चूसते हैं जिससे बीज सिकुड़ जाते हैं और अंकुरण क्षमता घट जाती है। ' +
          'सबसे बड़ा नुकसान यह है कि इनके मल और रस से रुई पर पीले-भूरे दाग पड़ जाते हैं — ' +
          'दागी रुई का भाव मंडी में साफ रुई से काफी कम मिलता है। ' +
          'ये कवक भी फैलाते हैं जिससे डोडे सड़ते हैं। कटाई के आसपास और खुले डोडों पर सबसे ज़्यादा दिखते हैं।',
        symptomsEn:
          'Bright red bugs with a black band cluster on open bolls and fallen seeds. They suck seed sap, shrivelling the ' +
          'seed and lowering germination. The worst damage is yellow-brown staining of the lint from their excreta, ' +
          'which fetches a much lower market price. They also spread boll-rotting fungi.',
        organic: [
          'सुबह-सुबह झुंड में बैठे बग हाथ से या जाली से इकट्ठा करके नष्ट करें',
          'खेत की सफाई — गिरे डोडे, बीज और कपास की लकड़ी हटा दें',
          'नीम तेल 5 मि.ली. प्रति लीटर पानी',
          'खुली रुई समय पर चुन लें, खेत में ज़्यादा दिन न छोड़ें',
        ],
        chemical: [
          'क्विनालफॉस 25 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'विकल्प: मैलाथियान 50 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'सिर्फ जहाँ झुंड दिखे वहीं छिड़काव करें — पूरा खेत नहीं',
          'कटाई के समय छिड़काव से बचें; ज़रूरी हो तो चुनाई से 15 दिन पहले',
        ],
        prevention: [
          'कटाई के बाद खेत से कपास की लकड़ी और बचे डोडे हटा दें',
          'भंडारण की जगह और खलिहान साफ रखें — वहीं से दोबारा आते हैं',
          'फसल चक्र अपनाएँ',
          'खुली रुई की चुनाई समय पर करें',
        ],
        speech:
          'पहचाना गया है लाल बग, जिसे लाल मत्कुण भी कहते हैं। ' +
          'चमकीले लाल रंग के ये कीट खुले डोडों और गिरे बीजों पर झुंड में बैठे दिखते हैं। ' +
          'ये बीज का रस चूसते हैं, पर सबसे बड़ा नुकसान यह है कि इनके मल से रुई पर पीले-भूरे दाग पड़ जाते हैं, और दागी रुई का भाव मंडी में काफी कम मिलता है। ' +
          'सुबह के समय झुंड में बैठे बग हाथ या जाली से इकट्ठा करके नष्ट कर दीजिए, यह सबसे आसान उपाय है। ' +
          'खेत में गिरे डोडे और बीज तुरंत उठा लीजिए, क्योंकि वहीं से ये बढ़ते हैं। ' +
          'ज़्यादा प्रकोप हो तो क्विनालफॉस लगभग दो मिलीलीटर प्रति लीटर पानी का छिड़काव करें, सिर्फ जहाँ झुंड दिखे वहीं। ' +
          'खुली रुई की चुनाई समय पर कर लीजिए, देर करने से दाग बढ़ते हैं। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Cotton_Bacterial_Blight: {
        nameHi: 'जीवाणु झुलसा (कोणीय धब्बा)',
        nameEn: 'Bacterial Blight / Angular Leaf Spot',
        pathogen: 'जीवाणु / Bacteria — Xanthomonas citri pv. malvacearum',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'स्ट्रेप्टोसाइक्लिन 0.1 ग्राम + कॉपर ऑक्सीक्लोराइड 3 ग्राम प्रति लीटर',
          'रोगग्रस्त पत्तियाँ/टहनियाँ हटाकर खेत से बाहर जलाएँ',
          'खेत में पानी का जमाव न होने दें',
          'इस खेत का बीज अगली बार न बोएँ',
        ],
        symptoms:
          'पत्ती पर पहले पानी से भीगे हुए जैसे छोटे धब्बे बनते हैं जो नसों के बीच फँसकर ' +
          'कोणीय (angular) आकार ले लेते हैं — गोल नहीं, किनारे सीधे-टेढ़े होते हैं, यही पहचान है। ' +
          'पत्ती को रोशनी के सामने रखने पर ये धब्बे साफ दिखते हैं। बाद में ये काले-भूरे हो जाते हैं। ' +
          'तने और टहनी पर लंबे काले घाव बनते हैं (black arm), जिससे टहनी टूट जाती है। ' +
          'डोडे पर गोल, धँसे हुए काले धब्बे बनते हैं और डोडा समय से पहले खुलकर रुई सड़ जाती है। ' +
          'बारिश, तेज़ हवा और ज़्यादा नमी इसे तेज़ी से फैलाते हैं; यह बीज से भी आता है।',
        symptomsEn:
          'Small water-soaked spots that become angular because they are bounded by veins — hold the leaf to the light ' +
          'to see them clearly. They later turn black-brown. Long black lesions on stems ("black arm") snap the branch. ' +
          'Round sunken black spots on bolls cause premature opening and rotten lint. Spread by rain, wind and seed.',
        organic: [
          'बीज उपचार: स्यूडोमोनास फ्लोरेसेंस 10 ग्राम प्रति किलो बीज',
          'गर्म पानी से बीज उपचार — 52°C पर 10 मिनट (सावधानी से)',
          'रोग-रोधी किस्में लगाएँ; एसिड-डीलिंटेड प्रमाणित बीज ही बोएँ',
          'रोगग्रस्त पौधों के अवशेष खेत से हटाकर जला दें',
          'गीली फसल में घूमने से बचें — जीवाणु कपड़ों से भी फैलता है',
        ],
        chemical: [
          'स्ट्रेप्टोसाइक्लिन 0.1 ग्राम + कॉपर ऑक्सीक्लोराइड 50 WP 3 ग्राम प्रति लीटर पानी',
          'बीज उपचार: कार्बोक्सिन 37.5 + थीरम 37.5 — लगभग 3 ग्राम प्रति किलो बीज',
          '10–12 दिन के अंतर पर 2 छिड़काव; कटाई से 20 दिन पहले रोक दें',
          'छिड़काव बारिश रुकने के बाद करें, वरना धुल जाएगा',
        ],
        prevention: [
          'प्रमाणित, एसिड-डीलिंटेड बीज — यही सबसे बड़ा बचाव है',
          'फसल चक्र; लगातार कपास के बाद कपास न लगाएँ',
          'खेत में जल-निकासी ठीक रखें',
          'संतुलित खाद — पोटाश पूरा दें, पौधा मज़बूत रहेगा',
          'कटाई के बाद अवशेष गहरी जुताई से दबाएँ',
        ],
        speech:
          'पहचाना गया रोग है जीवाणु झुलसा, जिसे कोणीय पत्ती धब्बा भी कहते हैं। ' +
          'पत्ती पर पानी से भीगे जैसे धब्बे बनते हैं जो नसों के बीच फँसकर कोणीय आकार ले लेते हैं। पत्ती को रोशनी के सामने रखिए, ये साफ दिखेंगे। ' +
          'तने पर लंबे काले घाव बनते हैं जिससे टहनी टूट जाती है, और डोडे पर धँसे काले धब्बे पड़कर रुई सड़ जाती है। ' +
          'उपचार के लिए स्ट्रेप्टोसाइक्लिन शून्य दशमलव एक ग्राम और कॉपर ऑक्सीक्लोराइड तीन ग्राम प्रति लीटर पानी मिलाकर छिड़काव करें। ' +
          'रोगग्रस्त पत्तियाँ और टहनियाँ हटाकर खेत से बाहर जला दीजिए, और खेत में पानी जमा न होने दें। ' +
          'ध्यान रखिए, यह रोग बीज से भी आता है, इसलिए इस खेत का बीज अगली बार मत बोइए और हमेशा प्रमाणित बीज ही लीजिए। ' +
          'गीली फसल में घूमने से बचें, क्योंकि जीवाणु कपड़ों से भी फैलता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Cotton_Anthracnose: {
        nameHi: 'एन्थ्रेक्नोज',
        nameEn: 'Anthracnose',
        pathogen: 'कवक / Fungus — Colletotrichum gossypii',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'मैंकोजेब 75 WP ~2.5 ग्राम/लीटर पानी छिड़कें',
          'ग्रस्त डोडे तोड़कर खेत से बाहर नष्ट करें',
          'खेत में हवा चले — घनी बुवाई और जल-जमाव से बचें',
          'अगली बुवाई में बीज उपचार ज़रूर करें',
        ],
        symptoms:
          'डोडे पर छोटे, गोल, धँसे हुए लाल-भूरे धब्बे बनते हैं जो बड़े होकर काले पड़ जाते हैं। ' +
          'नम मौसम में इन धब्बों के बीच गुलाबी-नारंगी चिपचिपा जमाव दिखता है — यही इसकी पक्की पहचान है। ' +
          'डोडा समय से पहले फट जाता है और अंदर की रुई भूरी, गुठली जैसी जमी हुई मिलती है। ' +
          'नए पौधों में तने के आधार पर लाल-भूरे घाव बनते हैं जिससे पौधा गिर सकता है (seedling blight)। ' +
          'लगातार बारिश और ज़्यादा नमी इसे बढ़ाते हैं।',
        symptomsEn:
          'Small round sunken reddish-brown spots on bolls that enlarge and blacken. In humid weather a pink-orange ' +
          'sticky spore mass appears in the centre — the key sign. Bolls crack early and the lint inside is brown and ' +
          'matted. In seedlings, reddish lesions at the stem base can topple the plant.',
        organic: [
          'बीज उपचार: ट्राइकोडर्मा विरिडी 4 ग्राम प्रति किलो बीज',
          'स्यूडोमोनास फ्लोरेसेंस 0.2% का छिड़काव, 10 दिन के अंतर पर',
          'ग्रस्त डोडे और अवशेष खेत से बाहर करके जलाएँ',
          'बीज दर संतुलित रखें ताकि फसल में हवा चलती रहे',
        ],
        chemical: [
          'मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'विकल्प: कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी',
          'बीज उपचार: कार्बेन्डाजिम — लगभग 2 ग्राम प्रति किलो बीज',
          '12–15 दिन के अंतर पर 2 छिड़काव; कटाई से 20 दिन पहले रोक दें',
        ],
        prevention: [
          'प्रमाणित, उपचारित बीज ही बोएँ',
          'फसल चक्र; कपास के अवशेष खेत में न छोड़ें',
          'जल-निकासी ठीक रखें, जल-जमाव से बचें',
          'संतुलित खाद, पोटाश पूरा',
        ],
        speech:
          'पहचाना गया रोग है एन्थ्रेक्नोज। ' +
          'डोडे पर छोटे, गोल, धँसे हुए लाल-भूरे धब्बे बनते हैं जो बाद में काले पड़ जाते हैं। ' +
          'नम मौसम में इन धब्बों के बीच गुलाबी-नारंगी चिपचिपा जमाव दिखता है, यही इसकी पक्की पहचान है। ' +
          'डोडा समय से पहले फट जाता है और अंदर की रुई भूरी और जमी हुई मिलती है। ' +
          'उपचार के लिए मैंकोजेब लगभग ढाई ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'ग्रस्त डोडे तोड़कर खेत से बाहर नष्ट कर दीजिए और खेत में जल-जमाव न होने दें। ' +
          'अगली बुवाई में बीज उपचार ज़रूर कीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      'Cotton_bollrot ': {
        nameHi: 'डोडा सड़न',
        nameEn: 'Boll Rot',
        pathogen: 'कवक + जीवाणु मिलकर — कीट के छेद से अंदर घुसते हैं',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'सड़े डोडे तोड़कर खेत से बाहर निकालें — खेत में न गिराएँ',
          'कॉपर ऑक्सीक्लोराइड 3 ग्राम/लीटर पानी छिड़कें',
          'साथ में सुंडी की दवा भी दें — छेद उसी ने किया है',
          'जल-निकासी ठीक करें, खेत में पानी न रुके',
        ],
        symptoms:
          'डोडा बाहर से भूरा-काला पड़ जाता है, दबाने पर नरम लगता है और उसमें से बदबू आती है। ' +
          'खोलने पर अंदर की रुई भूरी-काली, गीली और गुठली जैसी जमी हुई मिलती है — बिल्कुल बेकार। ' +
          'नम मौसम में डोडे की सतह पर सफेद, गुलाबी या काली फफूंद जम जाती है। ' +
          'यह ज़्यादातर वहीं होता है जहाँ पहले सुंडी ने छेद किया हो — छेद से बारिश का पानी और कीटाणु अंदर चले जाते हैं। ' +
          'लगातार बारिश, घनी बुवाई और नीचे के डोडों में यह सबसे ज़्यादा लगता है।',
        symptomsEn:
          'Bolls turn brown-black, feel soft and smell foul; inside, the lint is brown, wet and matted — a total loss. ' +
          'White, pink or black mould appears on the surface in humid weather. It usually starts where a bollworm has ' +
          'already bored a hole, letting water and pathogens in. Worst in continuous rain, dense stands and lower bolls.',
        organic: [
          'सड़े डोडे रोज़ तोड़कर खेत से बाहर गाड़ें या जलाएँ',
          'ट्राइकोडर्मा विरिडी का छिड़काव 5 ग्राम प्रति लीटर पानी',
          'बीज दर संतुलित रखें, कतार की दूरी सही रखें — हवा और धूप अंदर तक पहुँचे',
          'सुंडी को शुरू में ही रोकें — छेद नहीं होगा तो सड़न भी नहीं होगी',
        ],
        chemical: [
          'कॉपर ऑक्सीक्लोराइड 50 WP — लगभग 3 ग्राम प्रति लीटर पानी',
          'विकल्प: कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी',
          'साथ में सुंडी की दवा (इमामेक्टिन ~0.4 ग्राम/लीटर) — जड़ वहीं है',
          'बारिश रुकने पर छिड़काव करें; कटाई से 20 दिन पहले बंद कर दें',
        ],
        prevention: [
          'सुंडी का समय पर नियंत्रण — यही असली बचाव है',
          'खेत में जल-निकासी की नाली बनाएँ',
          'नाइट्रोजन ज़्यादा न दें — घनी पत्तियों में नमी रुकती है',
          'नीचे की पुरानी पत्तियाँ हटाकर हवा का रास्ता बनाएँ',
          'खुले डोडे समय पर चुन लें',
        ],
        speech:
          'पहचाना गया है डोडा सड़न। ' +
          'डोडा बाहर से भूरा-काला पड़ जाता है, दबाने पर नरम लगता है और उसमें से बदबू आती है। खोलने पर अंदर की रुई भूरी और गीली मिलती है, जो बिल्कुल बेकार हो जाती है। ' +
          'ध्यान देने वाली बात यह है कि यह ज़्यादातर वहीं होता है जहाँ पहले सुंडी ने छेद किया हो, क्योंकि छेद से पानी और कीटाणु अंदर चले जाते हैं। ' +
          'इसलिए सिर्फ फफूंद की दवा काफी नहीं — साथ में सुंडी की दवा भी दीजिए। ' +
          'सबसे पहले सड़े डोडे तोड़कर खेत से बाहर निकाल दीजिए, खेत में मत गिराइए। ' +
          'फिर कॉपर ऑक्सीक्लोराइड तीन ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'खेत में जल-निकासी ठीक कीजिए और नीचे की पुरानी पत्तियाँ हटाकर हवा का रास्ता बनाइए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Cotton_Healthy: {
        nameHi: 'स्वस्थ कपास',
        nameEn: 'Healthy Cotton',
        pathogen: 'कोई रोग नहीं मिला / No disease detected',
        severity: 'none', severityHi: 'सब ठीक है',
        risk: 'ok', riskHi: 'स्वस्थ / Healthy',
        actions: [
          'कोई दवा न छिड़कें — अभी ज़रूरत नहीं है',
          'फेरोमोन ट्रैप लगाकर गुलाबी सुंडी की निगरानी रखें',
          'नाइट्रोजन 3 भागों में बाँटकर दें',
          '10–15 दिन बाद फिर से स्कैन करें',
        ],
        symptoms:
          'बहुत बढ़िया! इस पत्ती में किसी रोग या कीट के लक्षण नहीं मिले। पत्ती का रंग एक-सा हरा है, ' +
          'न कोणीय धब्बे, न चिपचिपाहट, न चाँदी जैसी धारियाँ और न ही रुई जैसा सफेद जमाव। ' +
          'आपकी फसल प्रबंधन अच्छा चल रहा है।',
        symptomsEn:
          'No disease or pest symptoms detected — uniform green colour, no angular spots, no stickiness, no silvery ' +
          'streaking and no white waxy clusters. Keep up the current management.',
        organic: [
          'हर हफ्ते खेत में 5 जगह 10 पौधे देखें — कली, फूल और डोडे खोलकर जाँचें',
          'गुलाबी सुंडी के फेरोमोन ट्रैप 8–10 प्रति एकड़ पहले से लगा दें',
          'पीले और नीले चिपचिपे ट्रैप लगाकर रस चूसक कीटों पर नज़र रखें',
          'गोबर की खाद / वर्मीकम्पोस्ट से मिट्टी की सेहत बनाए रखें',
          'बिना ज़रूरत छिड़काव न करें — मित्र कीट बचे रहेंगे',
        ],
        chemical: [
          'अभी किसी दवा की ज़रूरत नहीं है',
          'मिट्टी जाँच के अनुसार ही NPK, सल्फर और मैग्नीशियम दें',
        ],
        prevention: [
          'समय पर बुवाई और समय पर फसल खत्म करना',
          'नाइट्रोजन 3 भागों में — एक साथ नहीं',
          'फूल और डोडे बनते समय पानी की कमी न होने दें',
          'खरपतवार (खासकर गाजर घास) साफ रखें',
          'कटाई के बाद कपास की लकड़ी खेत में न छोड़ें',
        ],
        speech:
          'बहुत बढ़िया! इस पत्ती में किसी रोग या कीट के लक्षण नहीं मिले। आपकी कपास की फसल स्वस्थ लग रही है। ' +
          'इसे ऐसे ही बनाए रखने के लिए, अभी कोई दवा मत छिड़कें, क्योंकि उसकी ज़रूरत नहीं है। ' +
          'गुलाबी सुंडी के फेरोमोन ट्रैप आठ से दस प्रति एकड़ अभी से लगा दीजिए, क्योंकि वह बाहर से दिखती नहीं। ' +
          'हर हफ्ते खेत में पाँच जगह दस-दस पौधे देखिए, और कुछ कली व डोडे खोलकर अंदर से भी जाँचिए। ' +
          'नाइट्रोजन यानी यूरिया को तीन भागों में बाँटकर दीजिए। ' +
          'फूल और डोडे बनते समय पानी की कमी मत होने दीजिए। ' +
          'दस से पंद्रह दिन बाद इस ऐप से दोबारा जाँच कर लीजिए।',
      },
    },
  },

  /* ##################### 5. ONION / प्याज ##################### */
  /* Labels ka order metadata.json se aata hai — neeche wali list us se
     BILKUL match karni chahiye (14 classes, index 0 se 13).
     NOTE: index 12 ka naam model me 'onion_botrytis_leaf_light' hai
     ('blight' nahi, 'light'). Model ki spelling hi rakhni ZAROORI hai. */
  onion: {
    id: 'onion',
    nameHi: 'प्याज',
    nameEn: 'Onion',
    altHi: 'कांदा',
    icon: 'crop-onion',
    seasonHi: 'रबी',
    labels: [
      'onion_bulb_blight',                // 0
      'onion_virosis',                    // 1
      'onion_xanthomonas_leaf_blight',    // 2
      'onion_purple_blotch',              // 3
      'onion_rust',                       // 4
      'onion_fusarium',                   // 5
      'onion_stemphylium_leaf_blight',    // 6
      'onion_iris_yellow_virus_augment',  // 7
      'onion_healthy_leaves',             // 8
      'onion_downy_mildew',               // 9
      'onion_caterpillar',                // 10
      'onion_bulb_rot',                   // 11
      'onion_botrytis_leaf_light',        // 12  (model ki spelling — mat badlein)
      'onion_alternaria',                 // 13
    ],
    classes: {

      /* ------------------------------------------------------------------ */
      onion_bulb_blight: {
        nameHi: 'कंद झुलसा',
        nameEn: 'Bulb Blight',
        pathogen: 'कवक / Fungus — कंद पर हमला करने वाली फफूंद',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'कंद का रोग भंडारण में सबसे ज़्यादा नुकसान करता है। रोगी कंद अच्छे कंदों के साथ ' +
          'बिल्कुल न रखें, वरना पूरा भंडार सड़ सकता है।',
        actions: [
          'रोगग्रस्त पौधे कंद सहित उखाड़कर खेत से बाहर करें',
          'खेत का पानी निकालें, जल-जमाव बिल्कुल न होने दें',
          'कार्बेन्डाजिम लगभग 1 ग्राम प्रति लीटर पानी की जड़ के पास ड्रेंचिंग करें',
        ],
        symptoms:
          'कंद के ऊपरी हिस्से (गर्दन) या बाहरी परतों पर भूरे-काले धब्बे बनते हैं और वह हिस्सा नरम पड़ जाता है। ' +
          'कंद को काटकर देखने पर अंदर की परतें भूरी और गली हुई मिलती हैं। ' +
          'ऊपर की पत्तियाँ पीली पड़कर गिरने लगती हैं और पौधा आसानी से उखड़ जाता है। ' +
          'ज़्यादा नमी, जल-जमाव और कटाई के समय लगी चोट इसे बढ़ाते हैं।',
        symptomsEn:
          'Brown to black lesions on the neck or outer scales of the bulb, which turn soft; cutting the bulb shows ' +
          'browned rotted scales. Leaves yellow and collapse and the plant lifts out easily. Excess moisture, ' +
          'waterlogging and harvest bruising worsen it.',
        organic: [
          'ट्राइकोडर्मा लगभग 5 किलो प्रति एकड़ सड़ी गोबर खाद में मिलाकर डालें',
          'ऊँची क्यारी (raised bed) पर बुवाई करें',
          'कटाई के बाद कंद को छाया में 10–15 दिन अच्छी तरह सुखाएँ (curing)',
        ],
        chemical: [
          'कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी, जड़ के पास ड्रेंचिंग',
          'या मैंकोज़ेब 75 WP — लगभग 2 ग्राम प्रति लीटर पानी',
          'भंडारण से पहले कंद को अच्छी तरह सुखाना सबसे ज़रूरी है',
        ],
        prevention: [
          'जल निकास ठीक रखें, खेत में पानी न ठहरने दें',
          'कटाई से 2–3 हफ्ते पहले सिंचाई बंद कर दें',
          'कंद को चोट लगने से बचाएँ',
          'भंडार में हवा आने-जाने की जगह रखें',
        ],
        speech:
          'पहचाना गया रोग है कंद झुलसा, जिसे बल्ब ब्लाइट कहते हैं। ' +
          'इसमें कंद की गर्दन या बाहरी परतों पर भूरे काले धब्बे बनते हैं और वह हिस्सा नरम पड़ जाता है, ' +
          'ऊपर की पत्तियाँ पीली पड़कर गिरने लगती हैं। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त पौधे कंद सहित उखाड़कर खेत से बाहर कर दें, ' +
          'खेत का पानी निकाल दें, और कार्बेन्डाजिम लगभग एक ग्राम प्रति लीटर पानी की जड़ के पास ड्रेंचिंग करें। ' +
          'बहुत ज़रूरी बात, रोगी कंद अच्छे कंदों के साथ भंडार में बिल्कुल मत रखिए, वरना पूरा भंडार सड़ सकता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      onion_virosis: {
        nameHi: 'विषाणु रोग',
        nameEn: 'Virosis / Virus Disease',
        pathogen: 'विषाणु / Virus — माहू और थ्रिप्स से फैलता है',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        note:
          'विषाणु रोग का सीधा इलाज नहीं है। फैलाने वाले कीट (थ्रिप्स, माहू) रोकना ' +
          'और रोगी पौधे निकालना ही उपाय है।',
        actions: [
          'रोगग्रस्त पौधे उखाड़कर खेत से बाहर नष्ट करें',
          'थ्रिप्स/माहू के लिए फिप्रोनिल लगभग 1.5 मि.ली. प्रति लीटर पानी छिड़कें',
          'खेत में नीले चिपचिपे कार्ड लगाएँ',
        ],
        symptoms:
          'पत्तियों पर हल्की पीली धारियाँ या चितकबरे (mosaic) निशान बनते हैं और पत्तियाँ टेढ़ी-मेढ़ी हो जाती हैं। ' +
          'पौधे की बढ़त रुक जाती है और कंद छोटा रह जाता है। ' +
          'रोग खेत में धब्बों (patches) में दिखता है और उन्हीं जगहों पर थ्रिप्स या माहू भी मिलते हैं।',
        symptomsEn:
          'Pale yellow streaks or mosaic mottling on the leaves, which become distorted. Growth is stunted and bulbs ' +
          'stay small. Appears in patches where thrips or aphids are also present.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'खेत के किनारे गेंदा लगाएँ, थ्रिप्स उसकी तरफ खिंचते हैं',
          'रोगी पौधे लगातार निकालते रहें',
        ],
        chemical: [
          'फिप्रोनिल 5 SC — लगभग 1.5 मि.ली. प्रति लीटर पानी',
          'या इमिडाक्लोप्रिड 17.8 SL — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'विषाणु की कोई सीधी दवा नहीं है',
        ],
        prevention: [
          'स्वस्थ, प्रमाणित बीज या पौध लें',
          'खेत और मेड़ की खरपतवार साफ रखें',
          'थ्रिप्स पर शुरू से नज़र रखें',
          'लगातार प्याज न लगाएँ, फसल बदलें',
        ],
        speech:
          'पहचाना गया रोग है विषाणु रोग, जिसे वायरोसिस कहते हैं। यह थ्रिप्स और माहू जैसे कीटों से फैलता है। ' +
          'इसमें पत्तियों पर हल्की पीली धारियाँ या चितकबरे निशान बनते हैं, पत्तियाँ टेढ़ी हो जाती हैं ' +
          'और कंद छोटा रह जाता है। ' +
          'ध्यान रखिए, विषाणु रोग का कोई सीधा इलाज नहीं होता। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त पौधे उखाड़कर खेत से बाहर नष्ट कर दें, ' +
          'और फैलाने वाले कीटों के लिए फिप्रोनिल लगभग डेढ़ मिलीलीटर प्रति लीटर पानी में छिड़कें। ' +
          'खेत में नीले चिपचिपे कार्ड लगा दीजिए, इससे थ्रिप्स पकड़े जाते हैं। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      onion_xanthomonas_leaf_blight: {
        nameHi: 'जीवाणु पत्ती झुलसा',
        nameEn: 'Xanthomonas Leaf Blight',
        pathogen: 'जीवाणु / Bacteria — Xanthomonas axonopodis pv. allii',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह जीवाणु रोग है — मैंकोज़ेब जैसे साधारण फफूंदनाशक इस पर काम नहीं करते। ' +
          'कॉपर वाली दवा ही असर करती है।',
        actions: [
          'कॉपर ऑक्सीक्लोराइड लगभग 3 ग्राम + स्ट्रेप्टोसाइक्लिन लगभग 0.15 ग्राम प्रति लीटर पानी',
          'ऊपर से सिंचाई (छिड़काव वाली) बंद करें, नाली से पानी दें',
          'खेत गीला हो तब उसमें काम न करें, इससे जीवाणु फैलता है',
        ],
        symptoms:
          'पत्तियों पर पहले पानी से भीगे हुए जैसे छोटे धब्बे बनते हैं, जो बाद में सफेद-भूरे होकर लंबी धारियों में बदल जाते हैं। ' +
          'धब्बों के चारों ओर हल्का पीला घेरा दिखता है। पत्तियाँ सिरे से नीचे की ओर सूखने लगती हैं। ' +
          'गर्म और नम मौसम, खासकर ऊपर से सिंचाई करने पर, यह तेज़ी से फैलता है। कंद छोटा रह जाता है।',
        symptomsEn:
          'Water-soaked spots on the leaves turn whitish-brown and elongate into streaks with a pale yellow halo. ' +
          'Leaves die back from the tip. Warm humid weather and overhead irrigation spread it fast, and bulbs stay small.',
        organic: [
          'कॉपर आधारित जैविक दवा का छिड़काव',
          'बीज को गर्म पानी में उपचारित करें',
          'फसल चक्र — लगातार प्याज या लहसुन न लगाएँ',
        ],
        chemical: [
          'कॉपर ऑक्सीक्लोराइड 50 WP — लगभग 3 ग्राम प्रति लीटर पानी',
          'साथ में स्ट्रेप्टोसाइक्लिन लगभग 0.15 ग्राम प्रति लीटर पानी',
          'ज़रूरत हो तो 10 दिन बाद दोहराएँ',
        ],
        prevention: [
          'ऊपर से सिंचाई न करें, नाली या ड्रिप से पानी दें',
          'रोगग्रस्त अवशेष खेत से हटा दें',
          'स्वस्थ पौध लगाएँ',
          'खेत में हवा चलने की जगह रखें',
        ],
        speech:
          'पहचाना गया रोग है जीवाणु पत्ती झुलसा, जिसे जैंथोमोनास लीफ ब्लाइट कहते हैं। ' +
          'इसमें पत्तियों पर पहले पानी से भीगे जैसे धब्बे बनते हैं जो बाद में सफेद भूरे होकर लंबी धारियों में बदल जाते हैं, ' +
          'और उनके चारों ओर हल्का पीला घेरा दिखता है। ' +
          'ध्यान से सुनिए, यह जीवाणु का रोग है, इसलिए साधारण फफूंदनाशक इस पर काम नहीं करते। ' +
          'अभी करने वाला काम यह है कि कॉपर ऑक्सीक्लोराइड लगभग तीन ग्राम के साथ स्ट्रेप्टोसाइक्लिन लगभग शून्य दशमलव एक पाँच ग्राम ' +
          'प्रति लीटर पानी में मिलाकर छिड़कें। ' +
          'ऊपर से सिंचाई करना बंद कर दीजिए, नाली से पानी दीजिए, और खेत गीला हो तब उसमें काम मत कीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      onion_purple_blotch: {
        nameHi: 'बैंगनी धब्बा',
        nameEn: 'Purple Blotch',
        pathogen: 'कवक / Fungus — Alternaria porri',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह प्याज का सबसे आम और सबसे नुकसानदेह पत्ती रोग है। छिड़काव में चिपकने वाला ' +
          '(स्टिकर) ज़रूर मिलाएँ, वरना दवा प्याज की चिकनी पत्ती पर टिकती ही नहीं।',
        actions: [
          'मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी + स्टिकर मिलाकर छिड़कें',
          '10–12 दिन के अंतर पर 2–3 छिड़काव करें',
          'बीज वाली फसल में डंठल टूटने से बचाने के लिए समय पर छिड़काव ज़रूरी है',
        ],
        symptoms:
          'पत्तियों पर पहले छोटे सफेद धँसे हुए धब्बे बनते हैं, जो बढ़कर बीच से बैंगनी-भूरे हो जाते हैं। ' +
          'धब्बे के चारों ओर पीला घेरा रहता है और बीच में गहरे रंग के छल्ले (concentric rings) साफ दिखते हैं — यही पक्की पहचान है। ' +
          'धब्बे बड़े होकर पत्ती को घेर लेते हैं और पत्ती वहीं से टूटकर गिर जाती है। ' +
          'बीज वाली फसल में डंठल टूटने से पूरा नुकसान हो जाता है। नमी और ओस इसे बहुत बढ़ाते हैं।',
        symptomsEn:
          'Small sunken white spots enlarge into purplish-brown lesions with a yellow halo and dark concentric rings ' +
          'in the centre — the confirming sign. Lesions girdle the leaf, which then breaks and falls. In seed crops ' +
          'the stalk snaps. Humidity and dew greatly increase severity.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'ट्राइकोडर्मा से बीज और पौध उपचार',
          'फसल चक्र — 2–3 साल तक उसी खेत में प्याज न लगाएँ',
          'कतारों के बीच दूरी रखें ताकि हवा चले',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या हेक्साकोनाज़ोल 5 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'हर छिड़काव में चिपकने वाला (स्टिकर) लगभग 0.5 मि.ली. प्रति लीटर ज़रूर मिलाएँ',
        ],
        prevention: [
          'रोगग्रस्त अवशेष खेत से हटाकर नष्ट करें',
          'ऊपर से सिंचाई न करें',
          'नाइट्रोजन ज़्यादा न दें',
          'रोपाई में पौधे से पौधे की दूरी सही रखें',
        ],
        speech:
          'पहचाना गया रोग है बैंगनी धब्बा, जिसे पर्पल ब्लॉच कहते हैं। यह प्याज का सबसे आम और सबसे नुकसानदेह पत्ती रोग है। ' +
          'इसमें पत्तियों पर पहले छोटे सफेद धँसे धब्बे बनते हैं जो बढ़कर बीच से बैंगनी भूरे हो जाते हैं, ' +
          'उनके चारों ओर पीला घेरा और बीच में गहरे छल्ले दिखते हैं, यही पक्की पहचान है। ' +
          'ये धब्बे बड़े होकर पत्ती को घेर लेते हैं और पत्ती वहीं से टूटकर गिर जाती है। ' +
          'अभी करने वाला काम यह है कि मैंकोज़ेब लगभग ढाई ग्राम प्रति लीटर पानी में मिलाकर छिड़कें, ' +
          'और दस से बारह दिन के अंतर पर दो तीन छिड़काव करें। ' +
          'बहुत ज़रूरी बात, दवा में चिपकने वाला यानी स्टिकर ज़रूर मिलाइए, ' +
          'वरना दवा प्याज की चिकनी पत्ती पर टिकेगी ही नहीं और पैसा बेकार जाएगा। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      onion_rust: {
        nameHi: 'रतुआ (गेरुई)',
        nameEn: 'Rust',
        pathogen: 'कवक / Fungus — Puccinia allii',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'प्रोपिकोनाज़ोल लगभग 1 मि.ली. प्रति लीटर पानी + स्टिकर मिलाकर छिड़कें',
          '12–15 दिन बाद ज़रूरत हो तो दोहराएँ',
          'खेत में हवा चलने दें, घनी फसल न रखें',
        ],
        symptoms:
          'पत्तियों पर छोटे-छोटे नारंगी या जंग जैसे उभरे हुए फफोले बनते हैं जो कतार में लगे दिखते हैं। ' +
          'फफोले फटकर नारंगी चूर्ण छोड़ते हैं — उँगली फेरने पर उँगली नारंगी हो जाती है, यही पक्की पहचान है। ' +
          'ज़्यादा रोग में पत्तियाँ पीली पड़कर सूख जाती हैं और कंद छोटा रह जाता है। ' +
          'ठंडा-नम मौसम और ओस इसे बढ़ाते हैं।',
        symptomsEn:
          'Small orange raised pustules in rows on the leaves burst into rusty powder that rubs off orange on the ' +
          'finger — the confirming test. Severe infection yellows and dries the leaves and reduces bulb size. ' +
          'Cool humid dewy weather favours it.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'सल्फर (गंधक) का छिड़काव',
          'फसल चक्र अपनाएँ, लहसुन-प्याज लगातार न लगाएँ',
        ],
        chemical: [
          'प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'या मैंकोज़ेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'स्टिकर ज़रूर मिलाएँ',
        ],
        prevention: [
          'घनी रोपाई से बचें',
          'ऊपर से सिंचाई न करें',
          'रोगग्रस्त अवशेष हटाएँ',
          'नाइट्रोजन संतुलित रखें',
        ],
        speech:
          'पहचाना गया रोग है रतुआ, जिसे रस्ट या गेरुई कहते हैं। ' +
          'इसमें पत्तियों पर छोटे नारंगी जंग जैसे उभरे फफोले कतार में बनते हैं, ' +
          'और उन पर उँगली फेरने से उँगली नारंगी हो जाती है, यही पक्की पहचान है। ' +
          'अभी करने वाला काम यह है कि प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी में स्टिकर मिलाकर छिड़कें, ' +
          'और बारह से पंद्रह दिन बाद ज़रूरत हो तो दोहरा दें। ' +
          'खेत में हवा चलने दीजिए और घनी फसल मत रखिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      onion_fusarium: {
        nameHi: 'फ्यूजेरियम मूल सड़न',
        nameEn: 'Fusarium Basal Rot',
        pathogen: 'कवक / Fungus — Fusarium oxysporum f.sp. cepae',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह मिट्टी में सालों रहने वाली फफूंद है। एक बार खेत में आ जाए तो ' +
          'फसल चक्र (2–3 साल प्याज न लगाना) ही असली इलाज है।',
        actions: [
          'रोगग्रस्त पौधे कंद सहित उखाड़कर खेत से बाहर नष्ट करें',
          'कार्बेन्डाजिम लगभग 1 ग्राम प्रति लीटर पानी की जड़ के पास ड्रेंचिंग करें',
          'खेत का पानी निकालें, जल-जमाव न होने दें',
        ],
        symptoms:
          'पत्तियाँ सिरे से पीली पड़कर नीचे की ओर सूखती हैं और पौधा मुरझा जाता है। ' +
          'पक्की पहचान: पौधा उखाड़कर कंद को नीचे से देखें — जड़ वाली तश्तरी (basal plate) भूरी और गली हुई मिलती है, ' +
          'और उस पर सफेद रुई जैसी फफूंद दिखती है। जड़ें सड़कर कम हो जाती हैं इसलिए पौधा हल्का उखड़ जाता है। ' +
          'गर्म मिट्टी और जल-जमाव इसे बढ़ाते हैं।',
        symptomsEn:
          'Leaves yellow from the tip downward and the plant wilts. Lifting the plant shows a browned rotted basal ' +
          'plate with white cottony fungal growth and few roots, so the plant pulls out easily. Warm soil and ' +
          'waterlogging favour it.',
        organic: [
          'ट्राइकोडर्मा विरिडी लगभग 5 किलो प्रति एकड़ सड़ी गोबर खाद में मिलाकर डालें',
          'पौध की जड़ों को ट्राइकोडर्मा के घोल में डुबोकर रोपें',
          'गर्मी में खेत की गहरी जुताई करके मिट्टी को धूप दिखाएँ (soil solarization)',
        ],
        chemical: [
          'कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी, जड़ के पास ड्रेंचिंग',
          'या थायोफिनेट मिथाइल — लगभग 1 ग्राम प्रति लीटर पानी',
          'पौध रोपने से पहले जड़ उपचार करें',
        ],
        prevention: [
          'फसल चक्र — 2–3 साल तक उसी खेत में प्याज या लहसुन न लगाएँ',
          'ऊँची क्यारी पर रोपाई करें',
          'जल निकास ठीक रखें',
          'रोग-रोधी किस्में लगाएँ',
        ],
        speech:
          'पहचाना गया रोग है फ्यूजेरियम मूल सड़न, जिसे बेसल रॉट कहते हैं। ' +
          'इसमें पत्तियाँ सिरे से पीली पड़कर नीचे की ओर सूखती हैं और पौधा मुरझा जाता है। ' +
          'पक्की पहचान के लिए पौधा उखाड़कर कंद को नीचे से देखिए, जड़ वाली तश्तरी भूरी और गली हुई मिलेगी ' +
          'और उस पर सफेद रुई जैसी फफूंद दिखेगी। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त पौधे कंद सहित उखाड़कर खेत से बाहर नष्ट कर दें, ' +
          'कार्बेन्डाजिम लगभग एक ग्राम प्रति लीटर पानी की जड़ के पास ड्रेंचिंग करें, और खेत का पानी निकाल दें। ' +
          'ध्यान रखिए, यह फफूंद मिट्टी में सालों रहती है, इसलिए दो तीन साल तक इस खेत में प्याज या लहसुन मत लगाइए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      onion_stemphylium_leaf_blight: {
        nameHi: 'स्टेम्फीलियम पत्ती झुलसा',
        nameEn: 'Stemphylium Leaf Blight',
        pathogen: 'कवक / Fungus — Stemphylium vesicarium',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह अक्सर बैंगनी धब्बे के साथ-साथ आता है और दोनों मिलकर पत्तियाँ जल्दी सुखा देते हैं। ' +
          'दोनों के लिए एक ही छिड़काव कार्यक्रम काम करता है।',
        actions: [
          'मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी + स्टिकर मिलाकर छिड़कें',
          '10 दिन के अंतर पर 2–3 छिड़काव करें',
          'ऊपर से सिंचाई बंद करें',
        ],
        symptoms:
          'पत्ती के बीच वाले हिस्से पर छोटे हल्के पीले-भूरे धब्बे बनते हैं जो बढ़कर लंबे और गहरे भूरे-काले हो जाते हैं। ' +
          'धब्बे अक्सर पत्ती की नोक से नीचे की ओर फैलते हैं और पत्ती ऊपर से सूखती जाती है। ' +
          'बैंगनी धब्बे से फर्क यह है कि इसमें बैंगनी रंग और गोल छल्ले नहीं बनते, रंग ज़्यादा भूरा-काला रहता है। ' +
          'ज़्यादा नमी, ओस और घनी फसल इसे बढ़ाते हैं।',
        symptomsEn:
          'Small pale yellow-brown spots in the middle of the leaf enlarge into elongated dark brown-black lesions, ' +
          'usually spreading downward from the tip so the leaf dies back. Unlike purple blotch there is no purple ' +
          'colour or concentric ringing. Humidity, dew and dense stands worsen it.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'फसल चक्र अपनाएँ',
          'कतारों के बीच दूरी रखें ताकि हवा चले',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या टेबुकोनाज़ोल — लगभग 1 मि.ली. प्रति लीटर पानी',
          'स्टिकर ज़रूर मिलाएँ',
        ],
        prevention: [
          'रोगग्रस्त अवशेष हटाकर नष्ट करें',
          'ऊपर से सिंचाई न करें',
          'नाइट्रोजन संतुलित रखें',
          'स्वस्थ पौध लगाएँ',
        ],
        speech:
          'पहचाना गया रोग है स्टेम्फीलियम पत्ती झुलसा। ' +
          'इसमें पत्ती के बीच वाले हिस्से पर छोटे हल्के पीले भूरे धब्बे बनते हैं जो बढ़कर लंबे और गहरे भूरे काले हो जाते हैं, ' +
          'और पत्ती नोक से नीचे की ओर सूखती जाती है। ' +
          'बैंगनी धब्बे से इसका फर्क यह है कि इसमें बैंगनी रंग और गोल छल्ले नहीं बनते। ' +
          'अभी करने वाला काम यह है कि मैंकोज़ेब लगभग ढाई ग्राम प्रति लीटर पानी में स्टिकर मिलाकर छिड़कें, ' +
          'और दस दिन के अंतर पर दो तीन छिड़काव करें। ' +
          'ऊपर से सिंचाई करना बंद कर दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      onion_iris_yellow_virus_augment: {
        nameHi: 'आइरिस पीला धब्बा विषाणु',
        nameEn: 'Iris Yellow Spot Virus (IYSV)',
        pathogen: 'विषाणु / Virus — IYSV, थ्रिप्स से फैलता है',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'विषाणु रोग है, इसकी कोई दवा नहीं है। पूरा बचाव थ्रिप्स रोकने पर टिका है — ' +
          'थ्रिप्स रुका तो यह रोग भी रुकेगा।',
        actions: [
          'थ्रिप्स के लिए फिप्रोनिल लगभग 1.5 मि.ली. प्रति लीटर पानी + स्टिकर छिड़कें',
          'रोगग्रस्त पौधे उखाड़कर खेत से बाहर नष्ट करें',
          'खेत में नीले चिपचिपे कार्ड लगाएँ',
        ],
        symptoms:
          'पत्तियों और बीज वाले डंठल पर हीरे या नाव के आकार के पीले-सफेद धब्बे बनते हैं, ' +
          'जिनके बीच में अक्सर हरा हिस्सा बचा रहता है — यह "आँख जैसा" निशान इसकी पक्की पहचान है। ' +
          'धब्बे बढ़कर मिल जाते हैं और पत्ती या डंठल वहीं से टूट जाता है। ' +
          'पौधे की बढ़त रुक जाती है और कंद छोटा रह जाता है। यह थ्रिप्स के प्रकोप वाले खेतों में मिलता है।',
        symptomsEn:
          'Diamond or spindle-shaped straw-yellow lesions on leaves and seed stalks, often with green tissue retained ' +
          'in the centre giving an eye-like mark — the confirming sign. Lesions merge and the leaf or stalk breaks. ' +
          'Growth is checked and bulbs stay small. Seen where thrips pressure is high.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'खेत के किनारे मक्का या गेंदा की बाड़ लगाएँ',
          'नीले चिपचिपे कार्ड — 8–10 प्रति एकड़',
        ],
        chemical: [
          'फिप्रोनिल 5 SC — लगभग 1.5 मि.ली. प्रति लीटर पानी',
          'या स्पाइनोसैड 45 SC — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'दवा बदल-बदल कर लगाएँ, थ्रिप्स जल्दी प्रतिरोधी हो जाता है',
        ],
        prevention: [
          'थ्रिप्स पर शुरू से ही नज़र रखें — पत्तियों की खाँच में देखें',
          'खेत और मेड़ की खरपतवार साफ रखें',
          'लगातार प्याज न लगाएँ',
          'स्वस्थ पौध ही रोपें',
        ],
        speech:
          'पहचाना गया रोग है आइरिस पीला धब्बा विषाणु, जिसे आई वाई एस वी कहते हैं। यह थ्रिप्स नाम के कीट से फैलता है। ' +
          'इसमें पत्तियों और बीज वाले डंठल पर हीरे या नाव के आकार के पीले सफेद धब्बे बनते हैं, ' +
          'जिनके बीच में अक्सर हरा हिस्सा बचा रहता है, यह आँख जैसा निशान इसकी पक्की पहचान है। ' +
          'ध्यान रखिए, विषाणु रोग की कोई दवा नहीं होती, पूरा बचाव थ्रिप्स रोकने पर टिका है। ' +
          'अभी करने वाला काम यह है कि थ्रिप्स के लिए फिप्रोनिल लगभग डेढ़ मिलीलीटर प्रति लीटर पानी में स्टिकर मिलाकर छिड़कें, ' +
          'रोगग्रस्त पौधे उखाड़कर नष्ट कर दें, और खेत में नीले चिपचिपे कार्ड लगा दें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      onion_healthy_leaves: {
        nameHi: 'स्वस्थ पत्ती',
        nameEn: 'Healthy Leaves',
        pathogen: '—',
        severity: 'none', severityHi: 'कोई नुकसान नहीं',
        risk: 'none', riskHi: 'कोई जोखिम नहीं / No Risk',
        actions: [
          'कोई दवा छिड़कने की ज़रूरत नहीं',
          'हर 7–10 दिन पर खेत घूमकर जाँच करें',
          'थ्रिप्स के लिए पत्तियों की खाँच में ज़रूर देखें',
        ],
        symptoms:
          'पत्तियाँ एक-समान हरी हैं, उन पर कोई धब्बा, धारी, पीलापन या सूखन नहीं दिख रही। ' +
          'फसल स्वस्थ लग रही है — अभी किसी उपचार की ज़रूरत नहीं है।',
        symptomsEn:
          'Leaves are uniformly green with no spots, streaks, yellowing or drying. The crop looks healthy and needs ' +
          'no treatment right now.',
        organic: [
          'सड़ी गोबर खाद और वर्मीकम्पोस्ट देते रहें',
          'खेत के किनारे गेंदा लगाएँ',
          'नीले चिपचिपे कार्ड लगाकर थ्रिप्स पर नज़र रखें',
        ],
        chemical: [
          'अभी किसी रासायनिक दवा की ज़रूरत नहीं',
        ],
        prevention: [
          'ऊपर से सिंचाई न करें, नाली या ड्रिप से पानी दें',
          'जल निकास ठीक रखें',
          'नाइट्रोजन संतुलित रखें',
          'फसल चक्र अपनाएँ',
        ],
        speech:
          'खुशखबरी! प्याज की पत्ती स्वस्थ दिख रही है, इस पर कोई रोग नहीं मिला। ' +
          'अभी कोई दवा छिड़कने की ज़रूरत नहीं है, बेकार में पैसा मत लगाइए। ' +
          'बस हर सात से दस दिन पर खेत घूमकर पत्तियाँ देखते रहिए, ' +
          'और थ्रिप्स के लिए पत्तियों की खाँच में ज़रूर झाँक लीजिए, क्योंकि प्याज में सबसे ज़्यादा नुकसान वही करता है। ' +
          'ऊपर से सिंचाई करने से बचिए, नाली से पानी दीजिए।',
      },

      /* ------------------------------------------------------------------ */
      onion_downy_mildew: {
        nameHi: 'मृदुरोमिल आसिता',
        nameEn: 'Downy Mildew',
        pathogen: 'कवक / Fungus — Peronospora destructor',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह ठंडे, कोहरे वाले और ओस भरे मौसम में तेज़ी से फैलता है। ' +
          'ऐसा मौसम आते ही बचाव का छिड़काव कर देना सबसे समझदारी है।',
        actions: [
          'मेटालैक्सिल + मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी + स्टिकर छिड़कें',
          '10 दिन बाद दोहराएँ',
          'ऊपर से सिंचाई तुरंत बंद करें',
        ],
        symptoms:
          'पत्तियों पर हल्के हरे या पीले लंबे धब्बे बनते हैं, और नम मौसम में उन पर बैंगनी-भूरे रंग की मखमली रुईदार परत जम जाती है — ' +
          'यह सुबह ओस के समय सबसे साफ दिखती है, यही पक्की पहचान है। ' +
          'बाद में पत्तियाँ पीली पड़कर मुड़ जाती हैं और सिरे से सूखने लगती हैं। ' +
          'कंद छोटा और नरम रह जाता है तथा भंडारण में जल्दी खराब होता है।',
        symptomsEn:
          'Pale green to yellow elongated patches on the leaves carry a violet-brown velvety growth in humid weather, ' +
          'best seen in early morning dew — the confirming sign. Leaves later yellow, bend and die back from the tip, ' +
          'and bulbs stay small, soft and poor in storage.',
        organic: [
          'फसल चक्र — 2–3 साल तक प्याज-लहसुन न लगाएँ',
          'कतार की दूरी बढ़ाएँ ताकि हवा चले और पत्तियाँ जल्दी सूखें',
          'सुबह की जगह दोपहर में सिंचाई करें',
        ],
        chemical: [
          'मेटालैक्सिल + मैंकोज़ेब — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या साइमोक्सानिल + मैंकोज़ेब — लगभग 2 ग्राम प्रति लीटर पानी',
          'स्टिकर ज़रूर मिलाएँ',
        ],
        prevention: [
          'ऊपर से सिंचाई बिल्कुल न करें',
          'ठंडे-कोहरे वाले मौसम में बचाव का छिड़काव पहले ही कर दें',
          'रोगग्रस्त अवशेष खेत से हटाएँ',
          'स्वस्थ, रोग-मुक्त पौध लगाएँ',
        ],
        speech:
          'पहचाना गया रोग है मृदुरोमिल आसिता, जिसे डाउनी मिल्ड्यू कहते हैं। ' +
          'इसमें पत्तियों पर हल्के हरे या पीले लंबे धब्बे बनते हैं, और नम मौसम में उन पर बैंगनी भूरे रंग की मखमली रुईदार परत जम जाती है। ' +
          'इसे सुबह ओस के समय देखिए, तब सबसे साफ दिखती है। ' +
          'अभी करने वाला काम यह है कि मेटालैक्सिल और मैंकोज़ेब का मिश्रण लगभग ढाई ग्राम प्रति लीटर पानी में स्टिकर मिलाकर छिड़कें, ' +
          'और दस दिन बाद दोहरा दें। ' +
          'ऊपर से सिंचाई तुरंत बंद कर दीजिए। ' +
          'ठंडा और कोहरे वाला मौसम आते ही बचाव का छिड़काव पहले ही कर देना सबसे समझदारी है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      onion_caterpillar: {
        nameHi: 'इल्ली (सूँडी)',
        nameEn: 'Caterpillar',
        pathogen: 'कीट / Insect — पत्ती और कंद खाने वाली इल्ली',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'शाम को खेत घूमकर इल्लियाँ हाथ से बीनकर नष्ट करें',
          'ज़्यादा प्रकोप हो तो क्लोरएंट्रानिलिप्रोल लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'खेत में फेरोमोन ट्रैप और पक्षियों के बैठने के डंडे लगाएँ',
        ],
        symptoms:
          'पत्तियों में छेद और कटे हुए किनारे दिखते हैं, कुछ पत्तियाँ बीच से कटकर गिर जाती हैं। ' +
          'पत्ती के पास या मिट्टी की दरारों में हरी या भूरी इल्ली मिलती है, और आसपास काली गोल बीट (मल) पड़ी दिखती है। ' +
          'इल्ली अक्सर खोखली पत्ती के अंदर घुसकर खाती है, इसलिए बाहर से पत्ती पीली और मुरझाई लगती है। ' +
          'नुकसान ज़्यादातर रात में होता है, इसलिए शाम या सुबह जल्दी देखें।',
        symptomsEn:
          'Holes and chewed edges on the leaves, some cut off midway. Green or brown caterpillars hide near the leaf ' +
          'base or in soil cracks with black round droppings nearby. They often feed inside the hollow leaf so it ' +
          'looks yellow and wilted from outside. Feeding is mostly at night.',
        organic: [
          'बी.टी. (Bacillus thuringiensis) का छिड़काव',
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'फेरोमोन ट्रैप — 4–5 प्रति एकड़',
          'खेत में पक्षियों के बैठने के लिए डंडे लगाएँ',
        ],
        chemical: [
          'क्लोरएंट्रानिलिप्रोल 18.5 SC — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'या इमामेक्टिन बेंजोएट 5 SG — लगभग 0.4 ग्राम प्रति लीटर पानी',
          'छिड़काव शाम को करें, तब इल्ली बाहर निकलती है',
        ],
        prevention: [
          'खेत और मेड़ की खरपतवार साफ रखें',
          'गर्मी में गहरी जुताई करें ताकि प्यूपा धूप में मर जाएँ',
          'फेरोमोन ट्रैप से पतंगों पर नज़र रखें',
          'फसल चक्र अपनाएँ',
        ],
        speech:
          'पहचानी गई है इल्ली, जिसे सूँडी या कैटरपिलर कहते हैं। यह एक कीट है, रोग नहीं। ' +
          'इसमें पत्तियों में छेद और कटे किनारे दिखते हैं, और आसपास काली गोल बीट पड़ी मिलती है। ' +
          'यह अक्सर खोखली पत्ती के अंदर घुसकर खाती है, इसलिए बाहर से पत्ती पीली और मुरझाई लगती है। ' +
          'अभी करने वाला काम यह है कि शाम को खेत घूमकर इल्लियाँ हाथ से बीनकर नष्ट कर दें, ' +
          'क्योंकि ये रात में ही ज़्यादा खाती हैं। ' +
          'ज़्यादा प्रकोप हो तो क्लोरएंट्रानिलिप्रोल लगभग शून्य दशमलव तीन मिलीलीटर प्रति लीटर पानी में शाम को छिड़कें। ' +
          'खेत में फेरोमोन ट्रैप और पक्षियों के बैठने के डंडे भी लगा दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      onion_bulb_rot: {
        nameHi: 'कंद सड़न',
        nameEn: 'Bulb Rot',
        pathogen: 'कवक + जीवाणु / Fungal & bacterial rot',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'भंडारण का सबसे बड़ा नुकसान यही करता है। एक सड़ा कंद पूरे बोरे को ' +
          'खराब कर सकता है — छाँटकर अलग करना सबसे ज़रूरी काम है।',
        actions: [
          'सड़े और नरम कंद तुरंत छाँटकर अलग करें, अच्छे कंदों के साथ न रखें',
          'खेत में हो तो पानी देना बंद करें और जल निकास ठीक करें',
          'कटाई के बाद कंद को छाया में 10–15 दिन अच्छी तरह सुखाएँ',
        ],
        symptoms:
          'कंद दबाने पर नरम और पिलपिला लगता है, और उसमें से बदबूदार रस निकलता है। ' +
          'काटकर देखने पर अंदर की एक या दो परतें भूरी, गली हुई और चिपचिपी मिलती हैं जबकि बाहर से कंद ठीक दिख सकता है। ' +
          'गर्दन (ऊपरी हिस्सा) सबसे पहले नरम होती है और वहीं से सड़न शुरू होती है। ' +
          'ज़्यादा सिंचाई, कच्ची कटाई और चोट लगे कंद इसे बढ़ाते हैं।',
        symptomsEn:
          'Bulbs feel soft and spongy and ooze a foul-smelling liquid. Cutting shows one or two browned, slimy inner ' +
          'scales even when the outside looks sound. Softening usually starts at the neck. Over-irrigation, immature ' +
          'harvest and bruising increase it.',
        organic: [
          'कटाई के बाद अच्छी तरह क्योरिंग (सुखाना) करें — यही सबसे बड़ा बचाव है',
          'ट्राइकोडर्मा मिट्टी में मिलाएँ',
          'भंडार में हवादार जालीदार बोरे या रैक इस्तेमाल करें',
        ],
        chemical: [
          'कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी, जड़ के पास ड्रेंचिंग',
          'जीवाणु सड़न के लिए कॉपर ऑक्सीक्लोराइड लगभग 3 ग्राम प्रति लीटर पानी',
          'भंडारित कंदों पर कोई दवा न छिड़कें',
        ],
        prevention: [
          'कटाई से 2–3 हफ्ते पहले सिंचाई पूरी तरह बंद कर दें',
          'गर्दन मुरझाने (neck fall) के बाद ही कटाई करें',
          'कंद को पटकें नहीं, चोट से सड़न शुरू होती है',
          'भंडार में हवा चलती रहे, ढेर ऊँचा न लगाएँ',
        ],
        speech:
          'पहचाना गया रोग है कंद सड़न, जिसे बल्ब रॉट कहते हैं। ' +
          'इसमें कंद दबाने पर नरम और पिलपिला लगता है और उसमें से बदबूदार रस निकलता है, ' +
          'और काटकर देखने पर अंदर की परतें भूरी और गली हुई मिलती हैं, जबकि बाहर से कंद ठीक दिख सकता है। ' +
          'अभी करने वाला काम यह है कि सड़े और नरम कंद तुरंत छाँटकर अलग कर दें, ' +
          'क्योंकि एक सड़ा कंद पूरे बोरे को खराब कर सकता है। ' +
          'खेत में हो तो पानी देना बंद कर दें और जल निकास ठीक कर दें। ' +
          'सबसे ज़रूरी बात, कटाई के बाद कंद को छाया में दस पंद्रह दिन अच्छी तरह सुखाइए, यही सबसे बड़ा बचाव है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      /* NOTE: label ki spelling model me '..._leaf_light' hai — mat badlein. */
      onion_botrytis_leaf_light: {
        nameHi: 'बोट्रीटिस पत्ती धब्बा',
        nameEn: 'Botrytis Leaf Blight',
        pathogen: 'कवक / Fungus — Botrytis squamosa',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी + स्टिकर मिलाकर छिड़कें',
          'ऊपर से सिंचाई बंद करें',
          'भंडारण से पहले कंद अच्छी तरह सुखाएँ — यही फफूंद गर्दन सड़न भी करती है',
        ],
        symptoms:
          'पत्तियों पर बहुत छोटे, सफेद या हल्के भूरे गोल धब्बे बिखरे हुए दिखते हैं, जैसे किसी ने छींटे मारे हों। ' +
          'हर धब्बे के चारों ओर हल्का पानी जैसा घेरा (halo) रहता है। ' +
          'धब्बे बहुत ज़्यादा हो जाएँ तो पत्ती की नोक सूखने लगती है और पूरी पत्ती झुलसी दिखती है। ' +
          'ठंडा, नम और ओस वाला मौसम इसे बढ़ाता है। यही फफूंद भंडारण में गर्दन सड़न भी करती है।',
        symptomsEn:
          'Numerous tiny white to pale brown round spots scattered over the leaf like splashes, each with a watery ' +
          'halo. Heavy spotting causes tip dieback and overall scorching. Cool humid dewy weather favours it, and the ' +
          'same fungus causes neck rot in storage.',
        organic: [
          'फसल चक्र अपनाएँ',
          'कतार की दूरी बढ़ाएँ ताकि पत्तियाँ जल्दी सूखें',
          'रोगग्रस्त पत्तियाँ और अवशेष हटाएँ',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या आइप्रोडायोन — लगभग 2 ग्राम प्रति लीटर पानी',
          'स्टिकर ज़रूर मिलाएँ',
        ],
        prevention: [
          'ऊपर से सिंचाई न करें',
          'गर्दन मुरझाने के बाद ही कटाई करें',
          'कटाई के बाद अच्छी क्योरिंग करें',
          'भंडार में हवा चलती रहे',
        ],
        speech:
          'पहचाना गया रोग है बोट्रीटिस पत्ती धब्बा। ' +
          'इसमें पत्तियों पर बहुत छोटे सफेद या हल्के भूरे गोल धब्बे बिखरे दिखते हैं, जैसे किसी ने छींटे मारे हों, ' +
          'और हर धब्बे के चारों ओर हल्का पानी जैसा घेरा रहता है। ' +
          'अभी करने वाला काम यह है कि मैंकोज़ेब लगभग ढाई ग्राम प्रति लीटर पानी में स्टिकर मिलाकर छिड़कें, ' +
          'और ऊपर से सिंचाई करना बंद कर दें। ' +
          'एक ज़रूरी बात, यही फफूंद भंडारण में गर्दन सड़न भी करती है, ' +
          'इसलिए कटाई के बाद कंद को अच्छी तरह सुखाकर ही भंडार में रखिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      onion_alternaria: {
        nameHi: 'अल्टरनेरिया पत्ती धब्बा',
        nameEn: 'Alternaria Leaf Spot',
        pathogen: 'कवक / Fungus — Alternaria spp.',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        note:
          'यह बैंगनी धब्बे की ही बिरादरी का रोग है। दोनों का इलाज एक जैसा है, ' +
          'इसलिए एक ही छिड़काव कार्यक्रम दोनों पर काम करता है।',
        actions: [
          'मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी + स्टिकर मिलाकर छिड़कें',
          '10–12 दिन के अंतर पर 2–3 छिड़काव करें',
          'ऊपर से सिंचाई बंद करें',
        ],
        symptoms:
          'पत्तियों पर भूरे रंग के गोल या अंडाकार धब्बे बनते हैं जिनके अंदर गहरे रंग के छल्ले (target-like rings) दिखते हैं। ' +
          'धब्बे के चारों ओर पीला घेरा रहता है। ' +
          'धब्बे बढ़कर मिल जाते हैं और पत्ती वहीं से टूटकर झुक जाती है। ' +
          'नमी, ओस और घनी फसल इसे बढ़ाते हैं। कंद का आकार घट जाता है।',
        symptomsEn:
          'Brown round to oval leaf spots with dark concentric target-like rings and a yellow halo. Spots merge and ' +
          'the leaf breaks and bends over. Humidity, dew and dense stands worsen it, reducing bulb size.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'ट्राइकोडर्मा से पौध उपचार',
          'फसल चक्र — 2–3 साल तक प्याज न लगाएँ',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या हेक्साकोनाज़ोल 5 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'स्टिकर ज़रूर मिलाएँ',
        ],
        prevention: [
          'रोगग्रस्त अवशेष हटाकर नष्ट करें',
          'ऊपर से सिंचाई न करें',
          'पौधे से पौधे की दूरी सही रखें',
          'नाइट्रोजन संतुलित रखें',
        ],
        speech:
          'पहचाना गया रोग है अल्टरनेरिया पत्ती धब्बा। ' +
          'इसमें पत्तियों पर भूरे गोल या अंडाकार धब्बे बनते हैं जिनके अंदर गहरे रंग के छल्ले दिखते हैं, ' +
          'और चारों ओर पीला घेरा रहता है। ये धब्बे बढ़कर मिल जाते हैं और पत्ती वहीं से टूटकर झुक जाती है। ' +
          'यह बैंगनी धब्बे की ही बिरादरी का रोग है, इसलिए दोनों का इलाज एक जैसा है। ' +
          'अभी करने वाला काम यह है कि मैंकोज़ेब लगभग ढाई ग्राम प्रति लीटर पानी में स्टिकर मिलाकर छिड़कें, ' +
          'और दस से बारह दिन के अंतर पर दो तीन छिड़काव करें। ' +
          'ऊपर से सिंचाई करना बंद कर दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },
    },
  },

  /* ##################### 6. MAIZE / मक्का ##################### */
  /* Labels ka order metadata.json se aata hai — neeche wali list us se
     BILKUL match karni chahiye (7 classes, index 0 se 6). */
  maize: {
    id: 'maize',
    nameHi: 'मक्का',
    nameEn: 'Maize',
    altHi: 'भुट्टा / कॉर्न',
    icon: 'crop-maize',
    seasonHi: 'खरीफ',
    photoHintHi: 'मक्का की पत्ती या भुट्टे की साफ फोटो अपलोड करें',
    photoHintKey: 'ui.hint.maize',
    labels: [
      'Maize_Blight',          // 0
      'Maize_Common_Rust',     // 1
      'Maize_Ear_Rot',         // 2
      'Maize_Healthy',         // 3
      'Maize_Gray_Leaf_Spot',  // 4
      'Maize_Fall_Armyworm',   // 5
      'Maize_Stem_Borer',      // 6
    ],
    classes: {

      /* ------------------------------------------------------------------ */
      Maize_Blight: {
        nameHi: 'पत्ती झुलसा',
        nameEn: 'Northern Leaf Blight',
        pathogen: 'कवक / Fungus — Exserohilum turcicum',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी में छिड़कें',
          'भुट्टा बनने से पहले छिड़काव कर लें — बाद में फायदा कम है',
          '10–12 दिन बाद ज़रूरत हो तो दोहराएँ',
        ],
        symptoms:
          'पत्तियों पर लंबे, नाव या सिगार जैसे भूरे-स्लेटी धब्बे बनते हैं जो 3 से 15 सेंटीमीटर तक लंबे हो सकते हैं। ' +
          'धब्बे पहले नीचे की पत्तियों पर आते हैं और ऊपर की ओर चढ़ते हैं। ' +
          'ज़्यादा रोग में धब्बे आपस में मिलकर पूरी पत्ती को झुलसा देते हैं और पत्ती जली हुई दिखती है। ' +
          'ठंडा-नम मौसम, ओस और घनी बुवाई इसे बढ़ाते हैं।',
        symptomsEn:
          'Long cigar or boat-shaped grey-brown lesions, 3 to 15 cm long, appearing first on the lower leaves and ' +
          'moving upward. Lesions merge and scorch the whole leaf when severe. Cool humid dewy weather and dense ' +
          'planting favour it.',
        organic: [
          'रोग-रोधी किस्में लगाएँ',
          'ट्राइकोडर्मा से बीज उपचार — लगभग 5–10 ग्राम प्रति किलो बीज',
          'फसल चक्र अपनाएँ, लगातार मक्का न लगाएँ',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
        ],
        prevention: [
          'कटाई के बाद फसल अवशेष खेत से हटाएँ या गहरी जुताई करें',
          'घनी बुवाई से बचें, कतार की दूरी सही रखें',
          'संतुलित खाद दें, नाइट्रोजन ज़्यादा नहीं',
          'खेत का जल निकास ठीक रखें',
        ],
        speech:
          'पहचाना गया रोग है पत्ती झुलसा, जिसे नॉर्दर्न लीफ ब्लाइट कहते हैं। ' +
          'इसमें पत्तियों पर लंबे नाव या सिगार जैसे भूरे स्लेटी धब्बे बनते हैं, ' +
          'जो पहले नीचे की पत्तियों पर आते हैं और फिर ऊपर की ओर चढ़ते हैं। ' +
          'अभी करने वाला काम यह है कि मैंकोज़ेब लगभग ढाई ग्राम प्रति लीटर पानी में मिलाकर छिड़कें, ' +
          'और यह छिड़काव भुट्टा बनने से पहले कर लें, क्योंकि बाद में फायदा कम होता है। ' +
          'दस से बारह दिन बाद ज़रूरत हो तो दोहरा दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Maize_Common_Rust: {
        nameHi: 'सामान्य रतुआ (गेरुई)',
        nameEn: 'Common Rust',
        pathogen: 'कवक / Fungus — Puccinia sorghi',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'प्रोपिकोनाज़ोल लगभग 1 मि.ली. प्रति लीटर पानी में छिड़कें',
          'पत्ती की दोनों सतहें भिगोएँ',
          '15 दिन बाद ज़रूरत हो तो दोहराएँ',
        ],
        symptoms:
          'पत्ती की दोनों सतहों पर छोटे, गोल या लंबे, दालचीनी जैसे भूरे-लाल उभरे फफोले बिखरे हुए बनते हैं। ' +
          'फफोले फटकर जंग जैसा चूर्ण छोड़ते हैं — उँगली फेरने पर उँगली भूरी-लाल हो जाती है, यही पक्की पहचान है। ' +
          'ज़्यादा रोग में पत्तियाँ पीली पड़कर समय से पहले सूख जाती हैं और दाने हल्के रह जाते हैं। ' +
          'ठंडा-नम मौसम इसे बढ़ाता है।',
        symptomsEn:
          'Small round to elongated cinnamon-brown pustules scattered on both leaf surfaces, bursting into rusty ' +
          'powder that rubs off on the finger — the confirming test. Heavy infection yellows and dries leaves early ' +
          'and grains stay light. Cool humid weather favours it.',
        organic: [
          'रोग-रोधी किस्में लगाएँ',
          'सल्फर (गंधक) का छिड़काव',
          'खेत में हवा चलने की जगह रखें',
        ],
        chemical: [
          'प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'या मैंकोज़ेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
        ],
        prevention: [
          'घनी बुवाई से बचें',
          'फसल अवशेष खेत से हटाएँ',
          'संतुलित खाद दें',
          'बुवाई का समय सही रखें',
        ],
        speech:
          'पहचाना गया रोग है सामान्य रतुआ, जिसे कॉमन रस्ट या गेरुई कहते हैं। ' +
          'इसकी पहचान आसान है, पत्ती की दोनों सतहों पर दालचीनी जैसे भूरे लाल उभरे फफोले बनते हैं, ' +
          'और उन पर उँगली फेरने से उँगली पर जंग जैसा रंग लग जाता है। ' +
          'अभी करने वाला काम यह है कि प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी में मिलाकर छिड़कें, ' +
          'और छिड़काव करते समय पत्ती की दोनों सतहें अच्छी तरह भिगोएँ। ' +
          'पंद्रह दिन बाद ज़रूरत हो तो दोहरा दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Maize_Ear_Rot: {
        nameHi: 'भुट्टा सड़न',
        nameEn: 'Ear Rot',
        pathogen: 'कवक / Fungus — Fusarium / Aspergillus',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'बहुत ज़रूरी: ऐसे सड़े या फफूंद लगे दानों में विष (mycotoxin) बन जाता है। ' +
          'इन्हें न खुद खाएँ, न पशुओं को खिलाएँ, और न बीज के लिए रखें।',
        actions: [
          'रोगग्रस्त भुट्टे अलग तोड़कर खेत से बाहर करें',
          'कटाई के बाद दाने 14% से कम नमी पर सुखाकर ही भंडारण करें',
          'सड़े दाने ग्रेडर या पंखे से अलग कर दें',
        ],
        symptoms:
          'भुट्टे के दानों पर सफेद, गुलाबी या हरे-नीले रंग की फफूंद जम जाती है। ' +
          'फ्यूजेरियम में अक्सर बिखरे हुए दानों पर सफेद-गुलाबी रुई जैसी फफूंद और दानों पर सफेद धारियाँ दिखती हैं। ' +
          'एस्परजिलस में हरी-पीली या काली चूर्ण जैसी फफूंद दिखती है। ' +
          'दाने हल्के, सिकुड़े और बदरंग हो जाते हैं। तना छेदक के घाव और कटाई के समय बारिश इसे बढ़ाते हैं।',
        symptomsEn:
          'White, pink or blue-green mould on the kernels. Fusarium shows cottony white-pink growth on scattered ' +
          'kernels with white streaking; Aspergillus shows greenish-yellow to black powdery growth. Kernels turn ' +
          'light, shrivelled and discoloured. Borer wounds and rain near harvest increase it.',
        organic: [
          'रोग-रोधी और मज़बूत आवरण (husk cover) वाली किस्में लगाएँ',
          'तना छेदक नियंत्रित करें — उसके घाव से फफूंद घुसती है',
          'फसल चक्र अपनाएँ',
        ],
        chemical: [
          'तना छेदक के लिए क्लोरएंट्रानिलिप्रोल लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'भुट्टे पर सीधे फफूंदनाशक का असर बहुत कम है — बचाव ही मुख्य उपाय है',
        ],
        prevention: [
          'समय पर कटाई करें, भुट्टे खेत में ज़्यादा दिन न छोड़ें',
          'दाने अच्छी तरह सुखाकर ही भंडारण करें',
          'भंडार सूखा और हवादार रखें',
          'रोगग्रस्त दाने बीज के लिए न रखें',
        ],
        speech:
          'पहचाना गया रोग है भुट्टा सड़न, जिसे ईयर रॉट कहते हैं। ' +
          'इसमें भुट्टे के दानों पर सफेद, गुलाबी या हरी नीली फफूंद जम जाती है और दाने हल्के तथा बदरंग हो जाते हैं। ' +
          'बहुत ध्यान से सुनिए, यह सिर्फ उपज का नुकसान नहीं है। ' +
          'ऐसे सड़े और फफूंद लगे दानों में विष बन जाता है, ' +
          'इसलिए इन्हें न खुद खाइए, न पशुओं को खिलाइए, और न ही बीज के लिए रखिए। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त भुट्टे अलग तोड़कर खेत से बाहर कर दें, ' +
          'और कटाई के बाद दानों को अच्छी तरह सुखाकर, चौदह प्रतिशत से कम नमी पर ही भंडारण करें। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Maize_Healthy: {
        nameHi: 'स्वस्थ मक्का',
        nameEn: 'Healthy',
        pathogen: '—',
        severity: 'none', severityHi: 'कोई नुकसान नहीं',
        risk: 'none', riskHi: 'कोई जोखिम नहीं / No Risk',
        actions: [
          'कोई दवा छिड़कने की ज़रूरत नहीं',
          'हर 7–10 दिन पर खेत घूमकर जाँच करें',
          'गोफ (whorl) में फॉल आर्मीवर्म ज़रूर देखें',
        ],
        symptoms:
          'पत्तियाँ एक-समान हरी हैं, उन पर कोई धब्बा, धारी, फफोला या कटाव नहीं दिख रहा। ' +
          'फसल स्वस्थ लग रही है — अभी किसी उपचार की ज़रूरत नहीं है।',
        symptomsEn:
          'Leaves are uniformly green with no lesions, streaks, pustules or feeding damage. The crop looks healthy ' +
          'and needs no treatment right now.',
        organic: [
          'सड़ी गोबर खाद देते रहें',
          'खेत में पक्षियों के बैठने के डंडे लगाएँ',
          'फेरोमोन ट्रैप से आर्मीवर्म पर नज़र रखें',
        ],
        chemical: [
          'अभी किसी रासायनिक दवा की ज़रूरत नहीं',
        ],
        prevention: [
          'संतुलित खाद दें',
          'जल निकास ठीक रखें',
          'हर हफ्ते गोफ के अंदर झाँककर देखें',
        ],
        speech:
          'खुशखबरी! मक्का स्वस्थ दिख रहा है, इस पर कोई रोग नहीं मिला। ' +
          'अभी कोई दवा छिड़कने की ज़रूरत नहीं है, बेकार में पैसा मत लगाइए। ' +
          'बस हर सात से दस दिन पर खेत घूमकर जाँच करते रहिए, ' +
          'और गोफ यानी बीच वाली मुड़ी हुई पत्तियों के अंदर ज़रूर झाँक लीजिए, ' +
          'क्योंकि फॉल आर्मीवर्म वहीं छिपकर नुकसान करता है।',
      },

      /* ------------------------------------------------------------------ */
      Maize_Gray_Leaf_Spot: {
        nameHi: 'धूसर पत्ती धब्बा',
        nameEn: 'Gray Leaf Spot',
        pathogen: 'कवक / Fungus — Cercospora zeae-maydis',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'प्रोपिकोनाज़ोल लगभग 1 मि.ली. प्रति लीटर पानी में छिड़कें',
          'भुट्टा बनने से पहले छिड़काव करें',
          'फसल अवशेष खेत से हटाएँ',
        ],
        symptoms:
          'पत्तियों पर लंबे, सीधे किनारों वाले आयताकार धूसर या भूरे धब्बे बनते हैं जो पत्ती की नसों के बीच फँसे रहते हैं — ' +
          'इसीलिए इनके किनारे बिल्कुल सीधे और चौकोर दिखते हैं, यही पत्ती झुलसा से इसका फर्क है। ' +
          'धब्बे नीचे की पत्तियों से शुरू होकर ऊपर चढ़ते हैं और मिलकर पूरी पत्ती सुखा देते हैं। ' +
          'गर्म-नम मौसम और खेत में पड़े पुराने फसल अवशेष इसे बढ़ाते हैं।',
        symptomsEn:
          'Long rectangular grey-brown lesions with straight parallel edges confined between the leaf veins — the ' +
          'square-edged shape separates it from northern leaf blight. Lesions start on lower leaves and climb up, ' +
          'merging to kill the leaf. Warm humid weather and old crop residue increase it.',
        organic: [
          'रोग-रोधी किस्में लगाएँ',
          'फसल चक्र — लगातार मक्का न लगाएँ',
          'खेत की गहरी जुताई करके अवशेष दबाएँ',
        ],
        chemical: [
          'प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'या एज़ोक्सीस्ट्रोबिन — लगभग 1 मि.ली. प्रति लीटर पानी',
        ],
        prevention: [
          'कटाई के बाद अवशेष खेत में न छोड़ें',
          'घनी बुवाई से बचें',
          'फसल चक्र अपनाएँ',
          'संतुलित खाद दें',
        ],
        speech:
          'पहचाना गया रोग है धूसर पत्ती धब्बा, जिसे ग्रे लीफ स्पॉट कहते हैं। ' +
          'इसमें पत्तियों पर लंबे आयताकार धूसर भूरे धब्बे बनते हैं जिनके किनारे बिल्कुल सीधे और चौकोर दिखते हैं, ' +
          'क्योंकि ये धब्बे पत्ती की नसों के बीच फँसे रहते हैं। यही इसकी पत्ती झुलसा से पहचान का फर्क है। ' +
          'अभी करने वाला काम यह है कि प्रोपिकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी में मिलाकर छिड़कें, ' +
          'और यह छिड़काव भुट्टा बनने से पहले कर लें। ' +
          'कटाई के बाद फसल अवशेष खेत में मत छोड़िए, क्योंकि यह फफूंद उन्हीं में बचकर अगली फसल पर आती है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Maize_Fall_Armyworm: {
        nameHi: 'फॉल आर्मीवर्म',
        nameEn: 'Fall Armyworm',
        pathogen: 'कीट / Insect — Spodoptera frugiperda',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'छिड़काव सीधे गोफ (whorl) के अंदर पड़ना चाहिए, क्योंकि इल्ली वहीं छिपकर खाती है। ' +
          'सिर्फ पत्तियों के ऊपर छिड़कने से कोई फायदा नहीं होता।',
        actions: [
          'इमामेक्टिन बेंजोएट लगभग 0.4 ग्राम प्रति लीटर पानी सीधे गोफ में डालें',
          'शाम को छिड़काव करें, तब इल्ली बाहर निकलती है',
          'छोटी अवस्था में हो तो रेत + राख का मिश्रण गोफ में डालना भी कारगर है',
        ],
        symptoms:
          'गोफ यानी बीच की मुड़ी हुई पत्तियों में गोल-गोल छेद और कटे-फटे किनारे दिखते हैं, जैसे किसी ने कागज़ काटा हो। ' +
          'गोफ में झाँकने पर बुरादे जैसी गीली बीट (frass) भरी मिलती है और अंदर इल्ली छिपी रहती है। ' +
          'इल्ली के सिर पर उल्टा अंग्रेज़ी का Y जैसा सफेद निशान और पीठ के आखिरी हिस्से पर चार काले बिंदु चौकोर में होते हैं — यही पक्की पहचान है। ' +
          'बड़ी अवस्था में यह भुट्टे में भी घुस जाती है।',
        symptomsEn:
          'Ragged round holes and torn edges in the whorl leaves, with wet sawdust-like frass packed inside where the ' +
          'larva hides. The larva has an inverted white Y on the head and four black dots in a square on the second ' +
          'last segment — the confirming marks. Older larvae also bore into the cob.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी सीधे गोफ में',
          'ट्राइकोग्रामा कार्ड लगाएँ',
          'फेरोमोन ट्रैप — 4–5 प्रति एकड़',
          'बड़ी इल्लियाँ हाथ से बीनकर नष्ट करें',
          'खेत के चारों ओर नेपियर घास की बाड़ लगाएँ (trap crop)',
        ],
        chemical: [
          'इमामेक्टिन बेंजोएट 5 SG — लगभग 0.4 ग्राम प्रति लीटर पानी',
          'या क्लोरएंट्रानिलिप्रोल 18.5 SC — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'या स्पाइनेटोरम 11.7 SC — लगभग 0.5 मि.ली. प्रति लीटर पानी',
          'दवा बदल-बदल कर लगाएँ, यह कीट जल्दी प्रतिरोधी हो जाता है',
        ],
        prevention: [
          'बुवाई एक साथ करें, देर से बोई फसल ज़्यादा पिटती है',
          'फेरोमोन ट्रैप लगाकर पतंगों पर नज़र रखें',
          'गहरी जुताई करें ताकि प्यूपा धूप में मर जाएँ',
          'खेत में पक्षियों के बैठने के डंडे लगाएँ',
          'बुवाई के 15 दिन बाद से हर हफ्ते गोफ की जाँच करें',
        ],
        speech:
          'पहचाना गया है फॉल आर्मीवर्म। यह मक्का का सबसे खतरनाक कीट है। ' +
          'इसकी पहचान यह है कि गोफ यानी बीच की मुड़ी पत्तियों में गोल छेद और कटे फटे किनारे दिखते हैं, ' +
          'और गोफ में झाँकने पर बुरादे जैसी गीली बीट भरी मिलती है। ' +
          'इल्ली के सिर पर उल्टा अंग्रेज़ी का वाय जैसा सफेद निशान होता है, यही पक्की पहचान है। ' +
          'अभी करने वाला काम यह है कि इमामेक्टिन बेंजोएट लगभग शून्य दशमलव चार ग्राम प्रति लीटर पानी में मिलाकर छिड़कें। ' +
          'बहुत ज़रूरी बात, छिड़काव सीधे गोफ के अंदर पड़ना चाहिए, क्योंकि इल्ली वहीं छिपकर खाती है। ' +
          'सिर्फ पत्तियों के ऊपर छिड़कने से कोई फायदा नहीं होगा और पैसा बेकार जाएगा। ' +
          'छिड़काव शाम को कीजिए, तब इल्ली बाहर निकलती है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Maize_Stem_Borer: {
        nameHi: 'तना छेदक',
        nameEn: 'Stem Borer',
        pathogen: 'कीट / Insect — Chilo partellus',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'सूखे बीच वाले कल्ले (dead heart) खींचकर निकालें और नष्ट करें',
          'कार्बोफ्यूरान/दानेदार दवा गोफ में डालें या क्लोरएंट्रानिलिप्रोल लगभग 0.3 मि.ली. प्रति लीटर छिड़कें',
          'ट्राइकोग्रामा कार्ड लगाएँ',
        ],
        symptoms:
          'नई पत्तियों पर कतार में छोटे-छोटे छेद (shot holes) दिखते हैं, जो गोफ में इल्ली के खाने से बनते हैं। ' +
          'बाद में बीच वाला कल्ला सूखकर पीला पड़ जाता है और खींचने पर आसानी से निकल आता है — इसे डेड हार्ट कहते हैं। ' +
          'तने को चीरकर देखें तो अंदर सुरंग और गुलाबी-सफेद इल्ली मिलती है, और तने पर बाहर से छेद तथा बुरादा दिखता है। ' +
          'ज़्यादा प्रकोप में पौधा हवा से टूट जाता है।',
        symptomsEn:
          'Rows of small shot holes on the young leaves from feeding in the whorl. The central shoot later dries and ' +
          'pulls out easily — dead heart. Splitting the stem shows tunnels and a pinkish larva, with entry holes and ' +
          'frass outside. Heavily bored plants snap in wind.',
        organic: [
          'ट्राइकोग्रामा किलोनिस कार्ड — 4–5 प्रति एकड़',
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'कटाई के बाद ठूँठ नष्ट करें, इल्ली उसी में सर्दी काटती है',
          'रोशनी वाला जाल लगाकर पतंगे पकड़ें',
        ],
        chemical: [
          'क्लोरएंट्रानिलिप्रोल 18.5 SC — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'या कार्टाप हाइड्रोक्लोराइड 4G दानेदार — गोफ में लगभग 8–10 किलो प्रति एकड़',
          'दवा गोफ में पड़नी चाहिए, सिर्फ ऊपर छिड़कने से नहीं',
        ],
        prevention: [
          'बुवाई समय पर और एक साथ करें',
          'कटाई के बाद ठूँठ उखाड़कर नष्ट करें',
          'गहरी जुताई करें',
          'खेत के किनारे नेपियर घास लगाएँ (trap crop)',
        ],
        speech:
          'पहचाना गया है तना छेदक, जिसे स्टेम बोरर कहते हैं। यह एक कीट है। ' +
          'शुरू में नई पत्तियों पर कतार में छोटे छेद दिखते हैं, ' +
          'फिर बीच वाला कल्ला सूखकर पीला पड़ जाता है और खींचने पर आसानी से निकल आता है, इसे डेड हार्ट कहते हैं। ' +
          'तने को चीरकर देखिए, अंदर सुरंग और गुलाबी सफेद इल्ली मिलेगी। ' +
          'अभी करने वाला काम यह है कि ऐसे सूखे कल्ले खींचकर निकाल दें और नष्ट कर दें, ' +
          'और क्लोरएंट्रानिलिप्रोल लगभग शून्य दशमलव तीन मिलीलीटर प्रति लीटर पानी सीधे गोफ में पड़े, ऐसे छिड़कें। ' +
          'ट्राइकोग्रामा कार्ड लगाना भी बहुत असरदार है। ' +
          'कटाई के बाद ठूँठ ज़रूर नष्ट कीजिए, क्योंकि इल्ली उसी में सर्दी काटती है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },
    },
  },

  /* ##################### 7. POTATO / आलू ##################### */
  /* Labels ka order metadata.json se aata hai — neeche wali list us se
     BILKUL match karni chahiye (10 classes, index 0 se 9).
     NOTE: index 2 aur 7 ke naam Teachable Machine me 20 akshar par KAT gaye the
     aur wahi katey hue naam export me chale gaye — 'Potato_Blackspot_B...' aur
     'Potato_Miscellaneo...' (teen bindu samet). Model wahi string deta hai,
     isliye yahan bhi hu-ba-hu wahi rakhna ZAROORI hai. Inhe "theek" mat kijiye.
     Yeh model zyadatar KAND (tuber) ke rog ka hai, patti ka nahi. */
  potato: {
    id: 'potato',
    nameHi: 'आलू',
    nameEn: 'Potato',
    altHi: 'बटाटा',
    icon: 'crop-potato',
    seasonHi: 'रबी',
    photoHintHi: 'आलू (कंद) की साफ फोटो अपलोड करें — कटा हुआ आलू हो तो और अच्छा',
    photoHintKey: 'ui.hint.potato',
    labels: [
      'Potato_Black_Scurf',      // 0
      'Potato_Blackleg',         // 1
      'Potato_Blackspot_B...',   // 2  (TM ne naam kaat diya — mat badlein)
      'Potato_Brown_Rot',        // 3
      'Potato_Common_Scab',      // 4
      'Potato_Dry_Rot',          // 5
      'Potato_Healthy',          // 6
      'Potato_Miscellaneo...',   // 7  (TM ne naam kaat diya — mat badlein)
      'Potato_Pink_Rot',         // 8
      'Potato_Soft_Rot',         // 9
    ],
    classes: {

      /* ------------------------------------------------------------------ */
      Potato_Black_Scurf: {
        nameHi: 'काली पपड़ी',
        nameEn: 'Black Scurf',
        pathogen: 'कवक / Fungus — Rhizoctonia solani',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        note:
          'काली पपड़ी सिर्फ छिलके पर चिपकी होती है, आलू अंदर से ठीक रहता है — खाने लायक है। ' +
          'असली नुकसान यह है कि ऐसा आलू बीज के लिए रखने पर अगली फसल में रोग फैल जाता है।',
        actions: [
          'ऐसे कंद बीज के लिए बिल्कुल न रखें',
          'अगली बुवाई में बीज उपचार ज़रूर करें',
          'खेत में जल-जमाव न होने दें',
        ],
        symptoms:
          'कंद के छिलके पर मिट्टी जैसे दिखने वाले काले-भूरे कड़े धब्बे चिपके रहते हैं, जो धोने पर भी नहीं जाते — ' +
          'नाखून से खुरचने पर निकल जाते हैं और नीचे का छिलका साफ मिलता है, यही पक्की पहचान है। ' +
          'खेत में रोग हो तो अंकुर निकलने से पहले ही सड़ जाते हैं, पौधे कम उगते हैं और तने पर भूरे धँसे घाव बनते हैं। ' +
          'ठंडी, गीली मिट्टी और देर से अंकुरण इसे बढ़ाते हैं।',
        symptomsEn:
          'Hard black-brown crusty specks stuck on the tuber skin that look like soil but do not wash off; scraping ' +
          'with a nail removes them leaving clean skin — the confirming test. In the field sprouts rot before emerging, ' +
          'stands are patchy and brown sunken lesions appear on the stem. Cold wet soil and slow emergence favour it.',
        organic: [
          'ट्राइकोडर्मा से बीज कंद का उपचार',
          'फसल चक्र — 3 साल तक उसी खेत में आलू न लगाएँ',
          'मिट्टी का तापमान ठीक होने पर ही बुवाई करें',
        ],
        chemical: [
          'बीज उपचार: मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी में 10 मिनट डुबोएँ',
          'या पेन्सीक्यूरॉन से बीज कंद उपचार',
        ],
        prevention: [
          'प्रमाणित, रोग-मुक्त बीज कंद ही लें',
          'बहुत ठंडी-गीली मिट्टी में बुवाई न करें',
          'खेत का जल निकास ठीक रखें',
          'कटाई समय पर करें, कंद ज़्यादा दिन मिट्टी में न छोड़ें',
        ],
        speech:
          'पहचाना गया रोग है काली पपड़ी, जिसे ब्लैक स्कर्फ कहते हैं। ' +
          'इसमें कंद के छिलके पर मिट्टी जैसे दिखने वाले काले भूरे कड़े धब्बे चिपके रहते हैं जो धोने पर नहीं जाते, ' +
          'पर नाखून से खुरचने पर निकल जाते हैं और नीचे का छिलका साफ मिलता है। ' +
          'एक राहत की बात है, यह पपड़ी सिर्फ छिलके पर होती है, आलू अंदर से ठीक रहता है और खाने लायक है। ' +
          'असली नुकसान यह है कि ऐसा आलू बीज के लिए रखने पर अगली फसल में रोग फैल जाता है। ' +
          'इसलिए अभी करने वाला काम यह है कि ऐसे कंद बीज के लिए बिल्कुल मत रखिए, ' +
          'और अगली बुवाई में बीज कंद का उपचार ज़रूर कीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Potato_Blackleg: {
        nameHi: 'काली टाँग (ब्लैकलेग)',
        nameEn: 'Blackleg',
        pathogen: 'जीवाणु / Bacteria — Pectobacterium atrosepticum',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह जीवाणु रोग है — फफूंदनाशक इस पर काम नहीं करते। ' +
          'रोगी पौधे उखाड़ना और स्वस्थ बीज लेना ही उपाय है।',
        actions: [
          'रोगग्रस्त पौधे कंद सहित उखाड़कर खेत से बाहर नष्ट करें',
          'खेत का पानी निकालें, जल-जमाव बिल्कुल न होने दें',
          'सिंचाई कम कर दें',
        ],
        symptoms:
          'पौधे के तने का ज़मीन के पास वाला हिस्सा काला और गीला-सा होकर गल जाता है — इसीलिए इसे काली टाँग कहते हैं। ' +
          'ऊपर की पत्तियाँ पीली पड़कर ऊपर की ओर मुड़ जाती हैं और पौधा मुरझा जाता है। ' +
          'गला हुआ तना दबाने पर नरम लगता है और उसमें से बदबू आती है — यही जीवाणु रोग की पहचान है। ' +
          'रोग रोगग्रस्त बीज कंद से आता है और गीली मिट्टी में तेज़ी से फैलता है।',
        symptomsEn:
          'The stem base blackens and rots wetly — hence blackleg. Upper leaves yellow, roll upward and the plant ' +
          'wilts. The rotted stem feels soft and smells foul, confirming a bacterial rot. Comes from infected seed ' +
          'tubers and spreads fast in wet soil.',
        organic: [
          'स्वस्थ, प्रमाणित बीज कंद लें',
          'बीज काटने के बजाय पूरा छोटा कंद बोएँ',
          'फसल चक्र अपनाएँ',
        ],
        chemical: [
          'कॉपर ऑक्सीक्लोराइड लगभग 3 ग्राम प्रति लीटर पानी की ड्रेंचिंग',
          'स्ट्रेप्टोसाइक्लिन लगभग 0.15 ग्राम प्रति लीटर पानी',
          'फफूंदनाशक बेकार हैं — इन पर पैसा न लगाएँ',
        ],
        prevention: [
          'रोग-मुक्त प्रमाणित बीज ही लें',
          'बीज कंद काटने का चाकू बार-बार साफ करें',
          'जल निकास ठीक रखें, ज़्यादा सिंचाई न करें',
          'कटाई के समय कंद को चोट न लगने दें',
        ],
        speech:
          'पहचाना गया रोग है काली टाँग, जिसे ब्लैकलेग कहते हैं। ' +
          'इसमें पौधे के तने का ज़मीन के पास वाला हिस्सा काला और गीला होकर गल जाता है, ' +
          'ऊपर की पत्तियाँ पीली पड़कर मुड़ जाती हैं और पौधा मुरझा जाता है। ' +
          'गले हुए तने से बदबू आती है, यही जीवाणु रोग की पहचान है। ' +
          'ध्यान से सुनिए, यह जीवाणु का रोग है, इसलिए फफूंदनाशक इस पर काम नहीं करते, उन पर पैसा मत लगाइए। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त पौधे कंद सहित उखाड़कर खेत से बाहर नष्ट कर दें, ' +
          'खेत का पानी निकाल दें और सिंचाई कम कर दें। ' +
          'अगली बार रोग मुक्त प्रमाणित बीज ही लीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      'Potato_Blackspot_B...': {
        nameHi: 'काला धब्बा (चोट का निशान)',
        nameEn: 'Blackspot Bruising',
        pathogen: 'रोग नहीं — चोट लगने से बना अंदरूनी दाग (abiotic)',
        severity: 'low', severityHi: 'कम नुकसान',
        risk: 'low', riskHi: 'कम जोखिम / Low Risk',
        note:
          'यह कोई रोग नहीं है — यह कंद को चोट लगने से बना दाग है, और यह फैलता नहीं। ' +
          'कोई दवा छिड़कने की ज़रूरत बिल्कुल नहीं है।',
        actions: [
          'कोई दवा न छिड़कें — यह रोग नहीं, चोट है',
          'कटाई और ढुलाई में कंद को पटकने से बचाएँ',
          'दागी हिस्सा काटकर बाकी आलू इस्तेमाल किया जा सकता है',
        ],
        symptoms:
          'बाहर से कंद बिल्कुल ठीक दिखता है, पर छीलने या काटने पर छिलके के ठीक नीचे स्लेटी-नीले या काले धब्बे मिलते हैं। ' +
          'ये धब्बे सख्त होते हैं, गीले या बदबूदार नहीं — यही सड़न से इनका फर्क है। ' +
          'ऐसा तब होता है जब कंद को कटाई, ढुलाई या भंडारण में चोट लगे, खासकर ठंडे कंद को पटकने पर। ' +
          'पोटाश की कमी वाले खेत के आलू में यह ज़्यादा होता है।',
        symptomsEn:
          'The tuber looks sound outside but peeling or cutting reveals grey-blue to black patches just under the ' +
          'skin. The patches are firm, not wet or smelly — which separates them from rot. Caused by impact during ' +
          'harvest, handling or storage, especially with cold tubers, and worse where potash is low.',
        organic: [
          'खेत में पोटाश की कमी पूरी करें — इससे चोट का दाग कम बनता है',
          'कटाई से पहले कंद का छिलका पक जाने दें (haulm cutting के 15 दिन बाद खुदाई)',
          'बोरे धीरे से रखें, ऊँचाई से न गिराएँ',
        ],
        chemical: [
          'किसी दवा की ज़रूरत नहीं — यह रोग नहीं है',
        ],
        prevention: [
          'ठंडे आलू को तुरंत न पटकें, पहले सामान्य तापमान पर आने दें',
          'खुदाई, ढुलाई और भंडारण में कंद को धीरे से संभालें',
          'पोटाश संतुलित रखें',
          'भंडार में ढेर बहुत ऊँचा न लगाएँ',
        ],
        speech:
          'पहचाना गया है काला धब्बा, जिसे ब्लैकस्पॉट ब्रूज़िंग कहते हैं। ' +
          'ध्यान से सुनिए, यह कोई रोग नहीं है, यह कंद को चोट लगने से बना अंदरूनी दाग है, और यह फैलता भी नहीं। ' +
          'इसमें आलू बाहर से ठीक दिखता है, पर छीलने पर छिलके के नीचे स्लेटी नीले या काले धब्बे मिलते हैं, ' +
          'जो सख्त होते हैं, गीले या बदबूदार नहीं। ' +
          'इसलिए कोई दवा छिड़कने की ज़रूरत बिल्कुल नहीं है, पैसा मत लगाइए। ' +
          'बस कटाई और ढुलाई में आलू को पटकने से बचाइए, ' +
          'और खेत में पोटाश की कमी पूरी कीजिए, क्योंकि पोटाश कम होने पर यह दाग ज़्यादा बनता है। ' +
          'दागी हिस्सा काटकर बाकी आलू इस्तेमाल किया जा सकता है।',
      },

      /* ------------------------------------------------------------------ */
      Potato_Brown_Rot: {
        nameHi: 'भूरी सड़न (जीवाणु उकठा)',
        nameEn: 'Brown Rot / Bacterial Wilt',
        pathogen: 'जीवाणु / Bacteria — Ralstonia solanacearum',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह बहुत गंभीर जीवाणु रोग है और मिट्टी में सालों रहता है। इसका कोई दवा वाला इलाज नहीं है। ' +
          'ऐसे खेत में 3–4 साल तक आलू, टमाटर, बैंगन या मिर्च बिल्कुल न लगाएँ।',
        actions: [
          'रोगग्रस्त पौधे कंद सहित उखाड़कर खेत से दूर गाड़ दें या जला दें',
          'इस खेत का पानी दूसरे खेत में न जाने दें',
          'इस खेत का बीज कंद बिल्कुल न रखें',
        ],
        symptoms:
          'पौधा दिन में मुरझाता है और रात में कुछ सुधर जाता है, फिर कुछ दिनों में पूरा सूख जाता है, जबकि पत्तियाँ हरी ही रहती हैं। ' +
          'पक्की पहचान का तरीका: तने को काटकर साफ पानी के गिलास में लटकाएँ — कटे सिरे से दूधिया-सफेद धुँआ जैसा रिसाव नीचे उतरता दिखेगा। ' +
          'कंद को काटने पर गूदे में भूरा घेरा (vascular ring) दिखता है और दबाने पर उसमें से गंदा सफेद रस निकलता है। ' +
          'कंद की आँखों से भी चिपचिपा रस निकलकर मिट्टी चिपक जाती है।',
        symptomsEn:
          'Plants wilt by day and partly recover at night, then die while leaves stay green. Confirming test: hang a ' +
          'cut stem in clear water and milky bacterial ooze streams down. Cut tubers show a browned vascular ring ' +
          'that exudes greyish ooze on pressing, and ooze from the eyes makes soil stick.',
        organic: [
          'फसल चक्र — 3–4 साल तक आलू, टमाटर, बैंगन, मिर्च न लगाएँ',
          'धान या मक्का जैसी फसल बीच में लें',
          'खेत में ब्लीचिंग पाउडर लगभग 12 किलो प्रति एकड़ मिलाएँ',
          'गर्मी में गहरी जुताई करके मिट्टी को धूप दिखाएँ',
        ],
        chemical: [
          'कोई असरदार रासायनिक इलाज उपलब्ध नहीं है',
          'स्ट्रेप्टोसाइक्लिन का सीमित असर होता है, भरोसा न करें',
          'बचाव और फसल चक्र ही असली उपाय है',
        ],
        prevention: [
          'प्रमाणित, रोग-मुक्त बीज कंद ही लें',
          'रोगग्रस्त खेत के औज़ार दूसरे खेत में न ले जाएँ',
          'खेत का पानी अलग रखें',
          'खरपतवार (मकोय आदि) साफ रखें, ये भी रोग पालते हैं',
        ],
        speech:
          'पहचाना गया रोग है भूरी सड़न, जिसे जीवाणु उकठा या ब्राउन रॉट कहते हैं। यह बहुत गंभीर रोग है। ' +
          'इसमें पौधा दिन में मुरझाता है और रात में कुछ सुधर जाता है, फिर सूख जाता है, जबकि पत्तियाँ हरी ही रहती हैं। ' +
          'पक्की जाँच के लिए तने को काटकर साफ पानी के गिलास में लटकाइए, ' +
          'कटे सिरे से दूधिया सफेद धुँआ जैसा रिसाव नीचे उतरता दिखेगा। ' +
          'कंद काटने पर गूदे में भूरा घेरा दिखता है और दबाने पर गंदा सफेद रस निकलता है। ' +
          'ध्यान से सुनिए, इसका कोई दवा वाला इलाज नहीं है और यह जीवाणु मिट्टी में सालों रहता है। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त पौधे कंद सहित उखाड़कर खेत से दूर गाड़ दें या जला दें, ' +
          'इस खेत का पानी दूसरे खेत में मत जाने दीजिए, और इस खेत का बीज कंद बिल्कुल मत रखिए। ' +
          'सबसे ज़रूरी बात, इस खेत में तीन से चार साल तक आलू, टमाटर, बैंगन या मिर्च मत लगाइए। ' +
          'दवा और उपाय की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Potato_Common_Scab: {
        nameHi: 'सामान्य पपड़ी',
        nameEn: 'Common Scab',
        pathogen: 'जीवाणु / Bacteria — Streptomyces scabies',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        note:
          'पपड़ी सिर्फ छिलके तक रहती है — आलू अंदर से ठीक और खाने लायक है। ' +
          'नुकसान ज़्यादातर बाज़ार भाव का होता है, क्योंकि ऐसा आलू दिखने में खराब लगता है।',
        actions: [
          'कंद बनने के समय (बुवाई के ~30–50 दिन बाद) खेत में नमी बनाए रखें — यह सबसे असरदार उपाय है',
          'खेत में चूना या राख न डालें, इससे रोग बढ़ता है',
          'ऐसे कंद बीज के लिए न रखें',
        ],
        symptoms:
          'कंद के छिलके पर खुरदरी, उभरी हुई या धँसी हुई भूरी पपड़ी जैसे धब्बे बनते हैं, जो फटे-फटे और खुरदरे लगते हैं। ' +
          'ये धब्बे सिर्फ छिलके तक होते हैं, अंदर का गूदा साफ रहता है — यही पहचान है। ' +
          'सूखी मिट्टी, ज़्यादा क्षारीय (अधिक pH वाली) मिट्टी और कच्ची गोबर खाद इसे बढ़ाते हैं। ' +
          'कंद बनने के समय मिट्टी सूखी रहे तो रोग सबसे ज़्यादा आता है।',
        symptomsEn:
          'Rough raised or pitted corky brown scabs on the tuber skin, cracked and coarse to touch, confined to the ' +
          'skin with clean flesh underneath. Dry soil, high pH and fresh manure increase it, and infection is worst ' +
          'when the soil is dry during tuber formation.',
        organic: [
          'हरी खाद (ढैंचा) या सड़ी गोबर खाद दें, कच्ची गोबर खाद न डालें',
          'फसल चक्र — बीच में धान या ज्वार लें',
          'मिट्टी को हल्का अम्लीय रखें, चूना न डालें',
        ],
        chemical: [
          'कोई सीधा असरदार छिड़काव नहीं है',
          'बीज उपचार से थोड़ी मदद मिलती है',
          'असली उपाय सिंचाई का सही समय है',
        ],
        prevention: [
          'कंद बनने के 4–6 हफ्ते तक खेत में नमी बनाए रखें',
          'प्रमाणित बीज कंद लें',
          'क्षारीय मिट्टी में आलू लगाने से बचें',
          'फसल चक्र अपनाएँ',
        ],
        speech:
          'पहचाना गया रोग है सामान्य पपड़ी, जिसे कॉमन स्कैब कहते हैं। ' +
          'इसमें कंद के छिलके पर खुरदरी, उभरी या धँसी हुई भूरी पपड़ी जैसे धब्बे बनते हैं। ' +
          'राहत की बात यह है कि ये सिर्फ छिलके तक रहते हैं, आलू अंदर से ठीक और खाने लायक है, ' +
          'नुकसान ज़्यादातर बाज़ार भाव का होता है। ' +
          'सबसे असरदार उपाय दवा नहीं, पानी है। ' +
          'कंद बनने के समय, यानी बुवाई के करीब तीस से पचास दिन बाद, खेत में नमी बनाए रखिए, सूखने मत दीजिए। ' +
          'खेत में चूना या राख मत डालिए, इससे यह रोग और बढ़ता है। ' +
          'और ऐसे कंद बीज के लिए मत रखिए। ' +
          'उपाय की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Potato_Dry_Rot: {
        nameHi: 'शुष्क सड़न',
        nameEn: 'Dry Rot',
        pathogen: 'कवक / Fungus — Fusarium spp.',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह भंडारण का रोग है और चोट लगे कंद से ही शुरू होता है। ' +
          'सड़े कंद तुरंत छाँटकर निकालें, वरना पूरा भंडार खराब होता है।',
        actions: [
          'सड़े और धँसे हुए कंद तुरंत छाँटकर अलग करें',
          'भंडार को सूखा और हवादार रखें',
          'अगली बुवाई में बीज कंद का उपचार करें',
        ],
        symptoms:
          'कंद पर पहले भूरे धँसे हुए गड्ढे बनते हैं, जिनके ऊपर छिलका सिकुड़कर छल्लेदार झुर्रियाँ (concentric rings) बना लेता है। ' +
          'काटने पर अंदर का गूदा भूरा से काला, सूखा और भुरभुरा मिलता है, और उसमें खाली जगहें बन जाती हैं। ' +
          'उन खाली जगहों में सफेद, गुलाबी या पीली फफूंद उगी दिखती है। ' +
          'गीली सड़न से फर्क यह है कि यह सूखा रहता है और इसमें बदबू नहीं आती।',
        symptomsEn:
          'Brown sunken depressions on the tuber with wrinkled concentric rings on the skin. Cutting shows dry, ' +
          'crumbly brown to black flesh with internal cavities lined by white, pink or yellow mould. Unlike soft rot ' +
          'it stays dry and does not smell.',
        organic: [
          'कटाई के बाद कंद को 10–15 दिन क्योर करें (छाया में सुखाएँ) ताकि घाव भर जाएँ',
          'ट्राइकोडर्मा से बीज कंद उपचार',
          'भंडार में हवा चलती रहे',
        ],
        chemical: [
          'बीज उपचार: मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या थायोफिनेट मिथाइल से बीज कंद उपचार',
          'भंडारित खाने वाले आलू पर दवा न छिड़कें',
        ],
        prevention: [
          'खुदाई और ढुलाई में कंद को चोट न लगने दें — घाव से ही फफूंद घुसती है',
          'कटाई के बाद अच्छी क्योरिंग करें',
          'भंडार ठंडा, सूखा और हवादार रखें',
          'बीज कंद काटने का चाकू साफ रखें',
        ],
        speech:
          'पहचाना गया रोग है शुष्क सड़न, जिसे ड्राई रॉट कहते हैं। ' +
          'इसमें कंद पर भूरे धँसे गड्ढे बनते हैं और उनके ऊपर छिलका सिकुड़कर छल्लेदार झुर्रियाँ बना लेता है। ' +
          'काटने पर अंदर का गूदा सूखा, भुरभुरा और भूरा काला मिलता है, और उसमें सफेद या गुलाबी फफूंद उगी दिखती है। ' +
          'गीली सड़न से इसका फर्क यह है कि यह सूखा रहता है और इसमें बदबू नहीं आती। ' +
          'अभी करने वाला काम यह है कि सड़े और धँसे हुए कंद तुरंत छाँटकर अलग कर दें, वरना पूरा भंडार खराब हो जाएगा, ' +
          'और भंडार को सूखा तथा हवादार रखें। ' +
          'ध्यान रखिए, यह फफूंद कंद के घाव से ही अंदर घुसती है, ' +
          'इसलिए खुदाई और ढुलाई में आलू को चोट लगने से बचाइए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Potato_Healthy: {
        nameHi: 'स्वस्थ आलू',
        nameEn: 'Healthy',
        pathogen: '—',
        severity: 'none', severityHi: 'कोई नुकसान नहीं',
        risk: 'none', riskHi: 'कोई जोखिम नहीं / No Risk',
        actions: [
          'कोई दवा छिड़कने की ज़रूरत नहीं',
          'भंडारण से पहले कंद अच्छी तरह सुखा लें',
          'हर 10–15 दिन पर भंडार की जाँच करें',
        ],
        symptoms:
          'कंद का छिलका साफ और एक-समान है, उस पर कोई पपड़ी, धब्बा, गड्ढा या फफूंद नहीं दिख रही, ' +
          'और कंद दबाने पर सख्त लगता है। अभी किसी उपचार की ज़रूरत नहीं है।',
        symptomsEn:
          'The skin is clean and even with no scab, spots, pits or mould, and the tuber feels firm. No treatment is ' +
          'needed right now.',
        organic: [
          'सड़ी गोबर खाद और हरी खाद देते रहें',
          'फसल चक्र अपनाएँ',
        ],
        chemical: [
          'अभी किसी रासायनिक दवा की ज़रूरत नहीं',
        ],
        prevention: [
          'खुदाई और ढुलाई में कंद को चोट न लगने दें',
          'भंडार ठंडा, सूखा और हवादार रखें',
          'सड़े कंद तुरंत छाँटकर निकालते रहें',
        ],
        speech:
          'खुशखबरी! आलू स्वस्थ दिख रहा है, इस पर कोई रोग नहीं मिला। ' +
          'अभी कोई दवा छिड़कने की ज़रूरत नहीं है, बेकार में पैसा मत लगाइए। ' +
          'बस भंडारण से पहले कंद को अच्छी तरह सुखा लीजिए, ' +
          'खुदाई और ढुलाई में उसे चोट लगने से बचाइए, ' +
          'और हर दस पंद्रह दिन पर भंडार की जाँच करके सड़े कंद निकालते रहिए।',
      },

      /* ------------------------------------------------------------------ */
      'Potato_Miscellaneo...': {
        nameHi: 'अन्य / पहचान स्पष्ट नहीं',
        nameEn: 'Miscellaneous / Unclear',
        pathogen: 'निश्चित नहीं — मिली-जुली या अज्ञात श्रेणी',
        severity: 'low', severityHi: 'तय नहीं',
        risk: 'unknown', riskHi: 'अज्ञात / Unknown',
        note:
          'यह model की "बाकी सब" वाली श्रेणी है, कोई एक रोग नहीं। ' +
          'यह आने का मतलब है कि तस्वीर किसी भी रोग से साफ नहीं मिली — बेहतर फोटो से दोबारा जाँचें।',
        actions: [
          'इस नतीजे पर कोई दवा न छिड़कें',
          'साफ रोशनी में, सादे बैकग्राउंड पर एक ही आलू की नई फोटो लेकर दोबारा जाँचें',
          'शक बना रहे तो नमूना लेकर कृषि विज्ञान केंद्र (KVK) को दिखाएँ',
        ],
        symptoms:
          'इस श्रेणी का कोई तय लक्षण नहीं है — यह model की "बाकी सब" वाली श्रेणी है। ' +
          'ऐसा नतीजा तब आता है जब फोटो धुँधली हो, रोशनी कम हो, बैकग्राउंड भरा हुआ हो, ' +
          'या कंद पर एक साथ कई तरह के निशान हों। ' +
          'भरोसेमंद पहचान के लिए एक ही आलू की साफ, नज़दीक से ली गई फोटो दोबारा लें।',
        symptomsEn:
          'This is the model catch-all class with no fixed symptoms. It usually means the photo was blurred, poorly ' +
          'lit, cluttered, or showed several kinds of damage at once. Retake a clear close-up of a single tuber.',
        organic: [
          'फसल की सामान्य देखभाल जारी रखें',
          'खेत और भंडार की सफाई बनाए रखें',
        ],
        chemical: [
          'बिना पक्की पहचान के कोई दवा न छिड़कें',
        ],
        prevention: [
          'फोटो साफ रोशनी में, सादे बैकग्राउंड पर लें',
          'एक बार में एक ही आलू की फोटो लें',
          'शक हो तो KVK से पुष्टि कराएँ',
        ],
        speech:
          'इस तस्वीर से पक्की पहचान नहीं हो पाई। ' +
          'यह model की बाकी सब वाली श्रेणी है, कोई एक रोग नहीं। ' +
          'ऐसा तब होता है जब फोटो धुँधली हो, रोशनी कम हो, या कंद पर एक साथ कई तरह के निशान हों। ' +
          'इसलिए इस नतीजे पर कोई दवा मत छिड़किए। ' +
          'साफ रोशनी में, सादे बैकग्राउंड पर, एक ही आलू की नज़दीक से फोटो लेकर दोबारा जाँच कीजिए। ' +
          'फिर भी शक बना रहे तो नमूना लेकर अपने कृषि विज्ञान केंद्र को दिखा दीजिए।',
      },

      /* ------------------------------------------------------------------ */
      Potato_Pink_Rot: {
        nameHi: 'गुलाबी सड़न',
        nameEn: 'Pink Rot',
        pathogen: 'कवक / Fungus — Phytophthora erythroseptica',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'पहचान का पक्का तरीका: कंद काटकर 20–30 मिनट हवा में रखें — कटा हुआ गूदा ' +
          'सामन जैसा गुलाबी हो जाएगा, फिर भूरा और काला। यही इसका नाम है।',
        actions: [
          'खेत का पानी तुरंत निकालें — जल-जमाव ही इसका मुख्य कारण है',
          'रोगग्रस्त कंद खेत और भंडार दोनों से हटाएँ',
          'नीची, पानी भरने वाली जगह के आलू अलग रखें',
        ],
        symptoms:
          'कंद दबाने पर रबर जैसा नरम लगता है पर टूटता नहीं, और उसका छिलका भूरा-स्लेटी पड़ जाता है। ' +
          'काटकर हवा में रखने पर कटा हुआ गूदा पहले सामन जैसा गुलाबी होता है, फिर भूरा और अंत में काला पड़ जाता है — यही पक्की पहचान है। ' +
          'सड़े कंद से सिरके जैसी हल्की खट्टी गंध आती है और दबाने पर साफ रस निकलता है। ' +
          'खेत की नीची, पानी भरने वाली जगहों में यह सबसे ज़्यादा मिलता है।',
        symptomsEn:
          'Tubers feel rubbery but do not break, with brownish-grey skin. Cut flesh exposed to air turns salmon-pink, ' +
          'then brown and finally black — the confirming test. There is a faint vinegary smell and clear fluid on ' +
          'pressing. Worst in low waterlogged patches of the field.',
        organic: [
          'ऊँची मेड़ पर बुवाई करें',
          'खेत का जल निकास ठीक करें',
          'फसल चक्र — 3 साल तक आलू न लगाएँ',
        ],
        chemical: [
          'मेटालैक्सिल + मैंकोज़ेब — लगभग 2.5 ग्राम प्रति लीटर पानी की ड्रेंचिंग',
          'बीज कंद उपचार से भी मदद मिलती है',
        ],
        prevention: [
          'खेत में पानी न ठहरने दें, खासकर कटाई के पास',
          'कटाई गीली मिट्टी में न करें',
          'कंद अच्छी तरह सुखाकर भंडारण करें',
          'भंडार ठंडा और हवादार रखें',
        ],
        speech:
          'पहचाना गया रोग है गुलाबी सड़न, जिसे पिंक रॉट कहते हैं। ' +
          'इसमें कंद दबाने पर रबर जैसा नरम लगता है पर टूटता नहीं, और छिलका भूरा स्लेटी पड़ जाता है। ' +
          'पक्की पहचान का तरीका यह है कि कंद को काटकर बीस तीस मिनट हवा में रख दीजिए, ' +
          'कटा हुआ गूदा पहले सामन जैसा गुलाबी होगा, फिर भूरा और अंत में काला पड़ जाएगा। ' +
          'अभी करने वाला काम यह है कि खेत का पानी तुरंत निकाल दें, क्योंकि जल जमाव ही इसका मुख्य कारण है, ' +
          'और रोगग्रस्त कंद खेत तथा भंडार दोनों से हटा दें। ' +
          'खेत की नीची, पानी भरने वाली जगह के आलू अलग रखिए, उन्हें अच्छे आलू में मत मिलाइए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Potato_Soft_Rot: {
        nameHi: 'गीली सड़न',
        nameEn: 'Soft Rot',
        pathogen: 'जीवाणु / Bacteria — Pectobacterium carotovorum',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह भंडार में सबसे तेज़ी से फैलता है — एक गीला सड़ा कंद कुछ ही दिनों में ' +
          'पूरे बोरे को घोल में बदल सकता है। तुरंत छाँटना सबसे ज़रूरी काम है।',
        actions: [
          'गीले, बदबूदार कंद तुरंत छाँटकर दूर फेंकें — देर मत कीजिए',
          'भंडार में हवा चलाएँ और नमी घटाएँ',
          'बचे हुए कंद फैलाकर सुखाएँ',
        ],
        symptoms:
          'कंद का हिस्सा गीला, मुलायम और घोल जैसा हो जाता है, और उँगली दबाने पर अंदर धँस जाती है। ' +
          'गला हुआ हिस्सा क्रीम या हल्का भूरा होता है और उसकी सीमा साफ, गहरे रंग की लकीर से बनी दिखती है। ' +
          'सबसे पक्की पहचान इसकी तेज़, सड़ी हुई बदबू है — यही इसे शुष्क सड़न से अलग करती है। ' +
          'भंडार में नमी, गर्मी और चोट लगे कंद इसे बहुत तेज़ी से फैलाते हैं।',
        symptomsEn:
          'Tissue turns wet, soft and mushy so a finger sinks in, cream to tan in colour with a sharp dark boundary. ' +
          'The strong foul smell is the confirming sign and separates it from dry rot. Moisture, warmth and bruising ' +
          'in storage spread it very fast.',
        organic: [
          'कटाई के बाद कंद अच्छी तरह क्योर (सुखा) करें',
          'भंडार में जालीदार बोरे या रैक इस्तेमाल करें, ढेर ऊँचा न लगाएँ',
          'भंडार का तापमान कम और हवा चलती रखें',
        ],
        chemical: [
          'भंडारित कंदों पर कोई दवा न छिड़कें — इससे नमी बढ़ेगी और सड़न और तेज़ होगी',
          'खेत में कॉपर ऑक्सीक्लोराइड लगभग 3 ग्राम प्रति लीटर पानी की ड्रेंचिंग',
          'फफूंदनाशक बेकार हैं — यह जीवाणु रोग है',
        ],
        prevention: [
          'गीली मिट्टी में खुदाई न करें',
          'कंद को चोट लगने से बचाएँ',
          'भंडार सूखा, ठंडा और हवादार रखें',
          'सड़े कंद रोज़ छाँटकर निकालते रहें',
        ],
        speech:
          'पहचाना गया रोग है गीली सड़न, जिसे सॉफ्ट रॉट कहते हैं। ' +
          'इसमें कंद का हिस्सा गीला, मुलायम और घोल जैसा हो जाता है और उँगली दबाने पर अंदर धँस जाती है, ' +
          'और उसमें से तेज़ सड़ी हुई बदबू आती है, यही सबसे पक्की पहचान है। ' +
          'ध्यान से सुनिए, यह भंडार में बहुत तेज़ी से फैलता है, ' +
          'एक गीला सड़ा कंद कुछ ही दिनों में पूरे बोरे को घोल में बदल सकता है। ' +
          'इसलिए अभी सबसे ज़रूरी काम यह है कि गीले और बदबूदार कंद तुरंत छाँटकर दूर फेंक दीजिए, देर मत कीजिए। ' +
          'भंडार में हवा चलाइए और नमी घटाइए, बचे हुए कंद फैलाकर सुखा दीजिए। ' +
          'भंडारित आलू पर कोई दवा मत छिड़किए, इससे नमी बढ़ेगी और सड़न और तेज़ हो जाएगी। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },
    },
  },

  /* ##################### 8. TOMATO / टमाटर ##################### */
  /* Labels ka order metadata.json se aata hai — neeche wali list us se
     BILKUL match karni chahiye (10 classes, index 0 se 9).
     NOTE: index 7 ke naam me SPACE hai —
     'Tomato_Spider_mites Two-spotted_spider_mite'. Isliye uski key quotes me
     likhni padti hai. Naam bilkul waisa hi rakhein jaisa model me hai. */
  tomato: {
    id: 'tomato',
    nameHi: 'टमाटर',
    nameEn: 'Tomato',
    altHi: 'टमाटर',
    icon: 'crop-tomato',
    seasonHi: 'रबी / खरीफ',
    labels: [
      'Tomato_healthy',                               // 0
      'Tomato_Early_blight',                          // 1
      'Tomato_Late_blight',                           // 2
      'Tomato_Bacterial_spot',                        // 3
      'Tomato_Target_Spot',                           // 4
      'Tomato_Leaf_Mold',                             // 5
      'Tomato_Septoria_leaf_spot',                    // 6
      'Tomato_Spider_mites Two-spotted_spider_mite',  // 7  (naam me space hai)
      'Tomato_mosaic_virus',                          // 8
      'Tomato_Yellow_Leaf_Curl_Virus',                // 9
    ],
    classes: {

      /* ------------------------------------------------------------------ */
      Tomato_healthy: {
        nameHi: 'स्वस्थ पत्ती',
        nameEn: 'Healthy',
        pathogen: '—',
        severity: 'none', severityHi: 'कोई नुकसान नहीं',
        risk: 'none', riskHi: 'कोई जोखिम नहीं / No Risk',
        actions: [
          'कोई दवा छिड़कने की ज़रूरत नहीं',
          'हर 5–7 दिन पर खेत घूमकर जाँच करें',
          'पत्ती की निचली सतह ज़रूर पलटकर देखें (सफेद मक्खी और माइट वहीं बैठते हैं)',
        ],
        symptoms:
          'पत्तियाँ एक-समान हरी हैं, उन पर कोई धब्बा, छल्ला, पीलापन, मुरझान या मरोड़ नहीं दिख रही। ' +
          'फसल स्वस्थ लग रही है — अभी किसी उपचार की ज़रूरत नहीं है।',
        symptomsEn:
          'Leaves are uniformly green with no spots, rings, yellowing, wilting or curling. The crop looks healthy ' +
          'and needs no treatment right now.',
        organic: [
          'सड़ी गोबर खाद और वर्मीकम्पोस्ट देते रहें',
          'खेत के किनारे गेंदा लगाएँ',
          'पीले चिपचिपे कार्ड लगाकर सफेद मक्खी पर नज़र रखें',
        ],
        chemical: [
          'अभी किसी रासायनिक दवा की ज़रूरत नहीं',
        ],
        prevention: [
          'पौधों को सहारा (staking) दें ताकि पत्तियाँ मिट्टी से दूर रहें',
          'ऊपर से सिंचाई न करें, नाली या ड्रिप से पानी दें',
          'नीचे की पुरानी पत्तियाँ हटाते रहें',
          'फसल चक्र अपनाएँ',
        ],
        speech:
          'खुशखबरी! टमाटर की पत्ती स्वस्थ दिख रही है, इस पर कोई रोग नहीं मिला। ' +
          'अभी कोई दवा छिड़कने की ज़रूरत नहीं है, बेकार में पैसा मत लगाइए। ' +
          'बस हर पाँच से सात दिन पर खेत घूमकर जाँच करते रहिए, ' +
          'और पत्ती को पलटकर उसकी निचली सतह ज़रूर देखिए, ' +
          'क्योंकि सफेद मक्खी और लाल मकड़ी वहीं बैठकर नुकसान शुरू करती हैं। ' +
          'ऊपर से सिंचाई करने से बचिए, नाली से पानी दीजिए।',
      },

      /* ------------------------------------------------------------------ */
      Tomato_Early_blight: {
        nameHi: 'अगेती झुलसा',
        nameEn: 'Early Blight',
        pathogen: 'कवक / Fungus — Alternaria solani',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी में छिड़कें',
          'नीचे की रोगग्रस्त पत्तियाँ तोड़कर खेत से बाहर करें',
          '10 दिन के अंतर पर 2–3 छिड़काव करें',
        ],
        symptoms:
          'नीचे की पुरानी पत्तियों पर पहले भूरे धब्बे बनते हैं जिनके अंदर निशाने जैसे गोल छल्ले (target rings) साफ दिखते हैं — यही पक्की पहचान है। ' +
          'धब्बे के चारों ओर पीला घेरा रहता है, और रोग नीचे से ऊपर की ओर चढ़ता है। ' +
          'ज़्यादा रोग में पत्तियाँ पीली पड़कर गिर जाती हैं और फल धूप से झुलस जाते हैं। ' +
          'तने और फल के डंठल के पास भी काले धँसे धब्बे बन सकते हैं।',
        symptomsEn:
          'Brown lesions with distinct concentric target-like rings appear first on older lower leaves — the ' +
          'confirming sign — surrounded by a yellow halo, progressing upward. Severe infection defoliates the plant ' +
          'and exposes fruit to sunscald. Dark sunken lesions may also form on the stem and fruit stalk.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'ट्राइकोडर्मा से पौध और मिट्टी उपचार',
          'फसल चक्र — 2 साल तक टमाटर, आलू, बैंगन न लगाएँ',
          'पौधों को सहारा दें ताकि पत्तियाँ मिट्टी को न छुएँ',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या क्लोरोथैलोनिल — लगभग 2 ग्राम प्रति लीटर पानी',
          'या एज़ोक्सीस्ट्रोबिन — लगभग 1 मि.ली. प्रति लीटर पानी',
        ],
        prevention: [
          'नीचे की पत्तियाँ मिट्टी से दूर रखें, सहारा दें',
          'ऊपर से सिंचाई न करें',
          'रोगग्रस्त अवशेष खेत से हटाएँ',
          'कतार की दूरी सही रखें ताकि हवा चले',
        ],
        speech:
          'पहचाना गया रोग है अगेती झुलसा, जिसे अर्ली ब्लाइट कहते हैं। ' +
          'इसमें नीचे की पुरानी पत्तियों पर भूरे धब्बे बनते हैं जिनके अंदर निशाने जैसे गोल छल्ले साफ दिखते हैं, ' +
          'और चारों ओर पीला घेरा रहता है। यह रोग नीचे से ऊपर की ओर चढ़ता है। ' +
          'अभी करने वाला काम यह है कि मैंकोज़ेब लगभग ढाई ग्राम प्रति लीटर पानी में मिलाकर छिड़कें, ' +
          'और नीचे की रोगग्रस्त पत्तियाँ तोड़कर खेत से बाहर कर दें। ' +
          'दस दिन के अंतर पर दो तीन छिड़काव कीजिए। ' +
          'पौधों को सहारा दे दीजिए ताकि पत्तियाँ मिट्टी को न छुएँ, इससे रोग बहुत कम होता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Tomato_Late_blight: {
        nameHi: 'पछेती झुलसा',
        nameEn: 'Late Blight',
        pathogen: 'कवक / Oomycete — Phytophthora infestans',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह सबसे तेज़ फैलने वाला रोग है — ठंडे, नम और बादल वाले मौसम में 3–4 दिन में ' +
          'पूरा खेत खत्म कर सकता है। इंतज़ार मत कीजिए, आज ही छिड़काव कीजिए।',
        actions: [
          'आज ही मेटालैक्सिल + मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी छिड़कें',
          'रोगग्रस्त पत्तियाँ और फल तोड़कर खेत से दूर गाड़ दें',
          'आसपास के किसानों को भी बताएँ — यह हवा से खेत-दर-खेत फैलता है',
        ],
        symptoms:
          'पत्तियों पर पानी से भीगे हुए जैसे बड़े, अनियमित हरे-भूरे धब्बे बनते हैं जो तेज़ी से फैलकर काले पड़ जाते हैं। ' +
          'नम मौसम में सुबह पत्ती की निचली सतह पर धब्बे के किनारे सफेद रुई जैसी परत दिखती है — यही पक्की पहचान है। ' +
          'तने पर भी काले-भूरे घाव बनते हैं और फल पर कड़े, भूरे, ऊबड़-खाबड़ धब्बे आ जाते हैं। ' +
          'ठंडा (10–20°C), नम, बादल वाला मौसम इसे बिजली की तरह फैलाता है।',
        symptomsEn:
          'Large irregular water-soaked greyish-green patches spread fast and blacken. In humid mornings a white ' +
          'downy ring shows on the underside at the lesion margin — the confirming sign. Stems develop dark lesions ' +
          'and fruit gets firm brown greasy blotches. Cool humid cloudy weather spreads it extremely fast.',
        organic: [
          'कॉपर आधारित दवा का बचाव छिड़काव (बारिश-बादल से पहले)',
          'रोग-रोधी किस्में लगाएँ',
          'रोगग्रस्त पौधे तुरंत हटाएँ',
          'खेत में हवा चलने की जगह रखें',
        ],
        chemical: [
          'मेटालैक्सिल + मैंकोज़ेब — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या साइमोक्सानिल + मैंकोज़ेब — लगभग 2 ग्राम प्रति लीटर पानी',
          'या डाइमेथोमॉर्फ — लगभग 1 ग्राम प्रति लीटर पानी',
          '7 दिन के अंतर पर दोहराएँ, दवा बदल-बदल कर लगाएँ',
        ],
        prevention: [
          'बादल-कोहरे का मौसम आते ही बचाव का छिड़काव पहले कर दें',
          'ऊपर से सिंचाई बिल्कुल न करें',
          'रोगग्रस्त अवशेष और आलू के बचे कंद खेत से हटाएँ',
          'टमाटर के पास आलू न लगाएँ — दोनों को यही रोग लगता है',
        ],
        speech:
          'पहचाना गया रोग है पछेती झुलसा, जिसे लेट ब्लाइट कहते हैं। ' +
          'ध्यान से सुनिए, यह टमाटर का सबसे तेज़ फैलने वाला रोग है, ' +
          'ठंडे, नम और बादल वाले मौसम में यह तीन चार दिन में पूरा खेत खत्म कर सकता है। ' +
          'इसमें पत्तियों पर पानी से भीगे जैसे बड़े हरे भूरे धब्बे बनते हैं जो तेज़ी से काले पड़ जाते हैं, ' +
          'और सुबह पत्ती की निचली सतह पर धब्बे के किनारे सफेद रुई जैसी परत दिखती है, यही पक्की पहचान है। ' +
          'इंतज़ार मत कीजिए, आज ही मेटालैक्सिल और मैंकोज़ेब का मिश्रण लगभग ढाई ग्राम प्रति लीटर पानी में छिड़क दीजिए। ' +
          'रोगग्रस्त पत्तियाँ और फल तोड़कर खेत से दूर गाड़ दीजिए। ' +
          'आसपास के किसानों को भी बता दीजिए, क्योंकि यह हवा से एक खेत से दूसरे खेत फैलता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Tomato_Bacterial_spot: {
        nameHi: 'जीवाणु धब्बा',
        nameEn: 'Bacterial Spot',
        pathogen: 'जीवाणु / Bacteria — Xanthomonas spp.',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह जीवाणु रोग है — साधारण फफूंदनाशक बेकार हैं। कॉपर वाली दवा ही असर करती है, ' +
          'और वह भी सिर्फ फैलाव रोकती है, ठीक नहीं करती।',
        actions: [
          'कॉपर ऑक्सीक्लोराइड लगभग 3 ग्राम + स्ट्रेप्टोसाइक्लिन लगभग 0.15 ग्राम प्रति लीटर पानी',
          'ऊपर से सिंचाई तुरंत बंद करें',
          'खेत गीला हो तब उसमें काम न करें — छूने से रोग फैलता है',
        ],
        symptoms:
          'पत्तियों पर छोटे, गोल, पानी से भीगे जैसे धब्बे बनते हैं जो बाद में गहरे भूरे-काले और कोणीय हो जाते हैं, ' +
          'और उनके चारों ओर पीला घेरा रहता है। धब्बे सूखकर बीच से फट जाते हैं, जिससे पत्ती छलनी जैसी दिखती है। ' +
          'फल पर छोटे उभरे, खुरदरे, पपड़ीदार धब्बे बनते हैं जो देखने में खुरंट जैसे लगते हैं — इससे फल बिकाऊ नहीं रहता। ' +
          'गर्म, नम मौसम और ऊपर से सिंचाई इसे तेज़ी से फैलाते हैं।',
        symptomsEn:
          'Small round water-soaked leaf spots turn dark brown-black and angular with a yellow halo, later drying and ' +
          'cracking so the leaf looks shot-holed. Fruit develops small raised rough scabby spots that ruin market ' +
          'value. Warm humid weather and overhead irrigation spread it fast.',
        organic: [
          'बीज को गर्म पानी में उपचारित करें (50°C पर 25 मिनट)',
          'कॉपर आधारित जैविक दवा का छिड़काव',
          'फसल चक्र — 2 साल तक टमाटर-मिर्च न लगाएँ',
        ],
        chemical: [
          'कॉपर ऑक्सीक्लोराइड 50 WP — लगभग 3 ग्राम प्रति लीटर पानी',
          'साथ में स्ट्रेप्टोसाइक्लिन लगभग 0.15 ग्राम प्रति लीटर पानी',
          '10 दिन के अंतर पर दोहराएँ',
          'साधारण फफूंदनाशक पर पैसा न लगाएँ',
        ],
        prevention: [
          'स्वस्थ, उपचारित बीज और पौध लें',
          'ऊपर से सिंचाई न करें',
          'गीले खेत में काम न करें, हाथ और औज़ार साफ रखें',
          'रोगग्रस्त अवशेष खेत से हटाएँ',
        ],
        speech:
          'पहचाना गया रोग है जीवाणु धब्बा, जिसे बैक्टीरियल स्पॉट कहते हैं। ' +
          'इसमें पत्तियों पर छोटे गोल पानी से भीगे जैसे धब्बे बनते हैं जो बाद में गहरे भूरे काले हो जाते हैं ' +
          'और उनके चारों ओर पीला घेरा रहता है, बाद में धब्बे फटकर पत्ती छलनी जैसी दिखने लगती है। ' +
          'फल पर खुरदरे पपड़ीदार धब्बे बनते हैं जिससे फल बिकाऊ नहीं रहता। ' +
          'ध्यान से सुनिए, यह जीवाणु का रोग है, साधारण फफूंदनाशक इस पर बेकार हैं। ' +
          'अभी करने वाला काम यह है कि कॉपर ऑक्सीक्लोराइड लगभग तीन ग्राम के साथ स्ट्रेप्टोसाइक्लिन लगभग शून्य दशमलव एक पाँच ग्राम ' +
          'प्रति लीटर पानी में मिलाकर छिड़कें। ' +
          'ऊपर से सिंचाई तुरंत बंद कर दीजिए, और खेत गीला हो तब उसमें काम मत कीजिए, क्योंकि छूने से रोग फैलता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Tomato_Target_Spot: {
        nameHi: 'लक्ष्य धब्बा',
        nameEn: 'Target Spot',
        pathogen: 'कवक / Fungus — Corynespora cassiicola',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी में छिड़कें',
          'नीचे की रोगग्रस्त पत्तियाँ हटाएँ',
          'खेत में हवा चलने दें, ऊपर से सिंचाई बंद करें',
        ],
        symptoms:
          'पत्तियों पर छोटे भूरे धब्बे बनते हैं जो बढ़कर हल्के भूरे बीच और गहरे किनारे वाले छल्लेदार निशान बना लेते हैं। ' +
          'अगेती झुलसा से फर्क यह है कि इसके धब्बे ज़्यादा गोल, हल्के रंग के और पत्ती में बिखरे हुए होते हैं, ' +
          'और अक्सर बीच से फटकर छेद बन जाता है। ' +
          'फल पर भी गोल, धँसे हुए, छल्लेदार भूरे धब्बे आ जाते हैं। नम और गर्म मौसम इसे बढ़ाता है।',
        symptomsEn:
          'Small brown leaf spots enlarge into ringed lesions with light brown centres and darker borders, rounder ' +
          'and paler than early blight and often cracking into a hole. Fruit shows round sunken ringed brown ' +
          'lesions. Warm humid conditions favour it.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'फसल चक्र अपनाएँ',
          'नीचे की पत्तियाँ हटाकर हवा चलने दें',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या एज़ोक्सीस्ट्रोबिन — लगभग 1 मि.ली. प्रति लीटर पानी',
          '10–12 दिन के अंतर पर दोहराएँ',
        ],
        prevention: [
          'पौधों को सहारा दें',
          'ऊपर से सिंचाई न करें',
          'रोगग्रस्त अवशेष हटाएँ',
          'कतार की दूरी सही रखें',
        ],
        speech:
          'पहचाना गया रोग है लक्ष्य धब्बा, जिसे टारगेट स्पॉट कहते हैं। ' +
          'इसमें पत्तियों पर छोटे भूरे धब्बे बनते हैं जो बढ़कर छल्लेदार निशान बना लेते हैं, ' +
          'जिनका बीच हल्का भूरा और किनारा गहरा होता है, और अक्सर बीच से फटकर छेद बन जाता है। ' +
          'अभी करने वाला काम यह है कि मैंकोज़ेब लगभग ढाई ग्राम प्रति लीटर पानी में मिलाकर छिड़कें, ' +
          'नीचे की रोगग्रस्त पत्तियाँ हटा दें, और ऊपर से सिंचाई बंद कर दें। ' +
          'खेत में हवा चलने की जगह रखिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Tomato_Leaf_Mold: {
        nameHi: 'पत्ती फफूंद',
        nameEn: 'Leaf Mold',
        pathogen: 'कवक / Fungus — Passalora fulva',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        note:
          'यह रोग खासकर पॉलीहाउस और ढके हुए खेतों में आता है, जहाँ नमी ज़्यादा और हवा कम होती है। ' +
          'हवा चलाना दवा से भी ज़्यादा असरदार है।',
        actions: [
          'हवा चलने दें — पॉलीहाउस हो तो पर्दे खोलें',
          'मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी में छिड़कें',
          'नीचे की घनी पत्तियाँ छाँट दें',
        ],
        symptoms:
          'पत्ती की ऊपरी सतह पर हल्के पीले, धुँधले किनारों वाले धब्बे बनते हैं जिनकी सीमा साफ नहीं होती। ' +
          'उसी धब्बे के ठीक नीचे, पत्ती पलटकर देखें तो जैतूनी-हरी या भूरी मखमली फफूंद जमी मिलती है — यही पक्की पहचान है। ' +
          'बाद में पत्तियाँ पीली पड़कर मुड़ जाती हैं और सूखकर गिर जाती हैं। ' +
          'ज़्यादा नमी और कम हवा वाली जगह में यह सबसे ज़्यादा होता है।',
        symptomsEn:
          'Pale yellow diffuse patches on the upper leaf surface with an olive-green to brown velvety mould directly ' +
          'beneath them — turn the leaf over to confirm. Leaves later yellow, curl and drop. Worst in humid, ' +
          'poorly ventilated conditions.',
        organic: [
          'हवा चलने की व्यवस्था करें, पौधों की छँटाई करें',
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'रोग-रोधी किस्में लगाएँ',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या क्लोरोथैलोनिल — लगभग 2 ग्राम प्रति लीटर पानी',
        ],
        prevention: [
          'पॉलीहाउस में नमी 85% से नीचे रखें',
          'ऊपर से सिंचाई न करें',
          'पौधों के बीच दूरी रखें और छँटाई करते रहें',
          'रोगग्रस्त पत्तियाँ हटा दें',
        ],
        speech:
          'पहचाना गया रोग है पत्ती फफूंद, जिसे लीफ मोल्ड कहते हैं। ' +
          'इसमें पत्ती की ऊपरी सतह पर हल्के पीले धुँधले धब्बे बनते हैं, ' +
          'और उसी धब्बे के ठीक नीचे, पत्ती पलटकर देखने पर जैतूनी हरी या भूरी मखमली फफूंद जमी मिलती है, यही पक्की पहचान है। ' +
          'यह रोग खासकर पॉलीहाउस और ढके खेतों में आता है जहाँ नमी ज़्यादा और हवा कम होती है। ' +
          'इसलिए सबसे पहले हवा चलने दीजिए, पॉलीहाउस हो तो पर्दे खोल दीजिए, यह दवा से भी ज़्यादा असरदार है। ' +
          'साथ में मैंकोज़ेब लगभग ढाई ग्राम प्रति लीटर पानी में मिलाकर छिड़कें, ' +
          'और नीचे की घनी पत्तियाँ छाँट दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Tomato_Septoria_leaf_spot: {
        nameHi: 'सेप्टोरिया पत्ती धब्बा',
        nameEn: 'Septoria Leaf Spot',
        pathogen: 'कवक / Fungus — Septoria lycopersici',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'मैंकोज़ेब लगभग 2.5 ग्राम प्रति लीटर पानी में छिड़कें',
          'नीचे की रोगग्रस्त पत्तियाँ तोड़कर खेत से बाहर करें',
          '7–10 दिन के अंतर पर दोहराएँ',
        ],
        symptoms:
          'नीचे की पत्तियों पर बहुत सारे छोटे, गोल धब्बे बनते हैं जिनका बीच भूरा-सफेद और किनारा गहरा भूरा होता है। ' +
          'ध्यान से देखने पर धब्बे के सफेद बीच में बहुत छोटे काले बिंदु (pycnidia) दिखते हैं — यही पक्की पहचान है। ' +
          'अगेती झुलसा से फर्क यह है कि इसमें धब्बे छोटे और बहुत ज़्यादा संख्या में होते हैं, और उनमें छल्ले नहीं बनते। ' +
          'रोग नीचे से ऊपर चढ़ता है और पत्तियाँ पीली होकर गिर जाती हैं।',
        symptomsEn:
          'Numerous small round spots on lower leaves with greyish-white centres and dark brown margins; tiny black ' +
          'pycnidia dot the pale centres — the confirming sign. Unlike early blight the spots are small, very ' +
          'numerous and lack concentric rings. Defoliation moves upward.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'फसल चक्र — 2 साल तक टमाटर न लगाएँ',
          'मिट्टी पर पुआल की मल्च बिछाएँ ताकि छींटे पत्ती पर न पड़ें',
        ],
        chemical: [
          'मैंकोज़ेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'या क्लोरोथैलोनिल — लगभग 2 ग्राम प्रति लीटर पानी',
        ],
        prevention: [
          'ऊपर से सिंचाई न करें — छींटों से यह सबसे ज़्यादा फैलता है',
          'पौधों को सहारा दें, नीचे की पत्तियाँ मिट्टी से दूर रखें',
          'रोगग्रस्त अवशेष खेत से हटाएँ',
          'खरपतवार (मकोय आदि) साफ रखें',
        ],
        speech:
          'पहचाना गया रोग है सेप्टोरिया पत्ती धब्बा। ' +
          'इसमें नीचे की पत्तियों पर बहुत सारे छोटे गोल धब्बे बनते हैं जिनका बीच भूरा सफेद और किनारा गहरा भूरा होता है। ' +
          'ध्यान से देखिए, धब्बे के सफेद बीच में बहुत छोटे काले बिंदु दिखेंगे, यही पक्की पहचान है। ' +
          'अगेती झुलसा से इसका फर्क यह है कि इसमें धब्बे छोटे और बहुत ज़्यादा संख्या में होते हैं, और उनमें छल्ले नहीं बनते। ' +
          'अभी करने वाला काम यह है कि मैंकोज़ेब लगभग ढाई ग्राम प्रति लीटर पानी में मिलाकर छिड़कें, ' +
          'और नीचे की रोगग्रस्त पत्तियाँ तोड़कर खेत से बाहर कर दें। ' +
          'ऊपर से सिंचाई मत कीजिए, क्योंकि पानी के छींटों से ही यह सबसे ज़्यादा फैलता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      'Tomato_Spider_mites Two-spotted_spider_mite': {
        nameHi: 'लाल मकड़ी (माइट)',
        nameEn: 'Two-spotted Spider Mite',
        pathogen: 'कीट / Mite — Tetranychus urticae',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह कीड़ा नहीं, मकड़ी की जाति का है — इसलिए साधारण कीटनाशक इस पर काम नहीं करते। ' +
          'माइटीसाइड (माइट मारने वाली दवा) ही लगती है। गलत दवा से यह और बढ़ जाता है।',
        actions: [
          'स्पाइरोमेसिफेन लगभग 1 मि.ली. या प्रोपरगाइट लगभग 2 मि.ली. प्रति लीटर पानी छिड़कें',
          'छिड़काव पत्ती की निचली सतह पर करें — माइट वहीं बैठता है',
          'साधारण कीटनाशक (पायरेथ्रॉइड) बिल्कुल न लगाएँ',
        ],
        symptoms:
          'पत्तियों पर बहुत महीन पीले-सफेद बिंदु (stippling) बन जाते हैं, जैसे किसी ने सुई से छेद किए हों, ' +
          'और पत्ती धीरे-धीरे कांसे जैसी भूरी होकर सूख जाती है। ' +
          'पत्ती पलटकर देखें तो निचली सतह पर बहुत छोटे लाल-हरे रेंगते जीव और महीन जाला (web) दिखता है — यही पक्की पहचान है। ' +
          'गर्म और सूखा मौसम इसे बहुत तेज़ी से बढ़ाता है, और धूल भरे खेत में यह सबसे ज़्यादा होता है।',
        symptomsEn:
          'Fine yellow-white stippling on the leaves as if pricked with a needle, turning bronze and drying. Turning ' +
          'the leaf over reveals tiny red-green crawling mites and fine webbing — the confirming sign. Hot dry dusty ' +
          'conditions cause rapid build-up.',
        organic: [
          'पानी की तेज़ बौछार से पत्तियाँ धोएँ, इससे माइट गिरते हैं',
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'घुलनशील सल्फर लगभग 2 ग्राम प्रति लीटर पानी',
          'शिकारी माइट और लेडीबर्ड बीटल बचाएँ',
        ],
        chemical: [
          'स्पाइरोमेसिफेन 22.9 SC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'या प्रोपरगाइट 57 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'या फेनाज़ाक्विन 10 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'दवा बदल-बदल कर लगाएँ, माइट बहुत जल्दी प्रतिरोधी हो जाता है',
        ],
        prevention: [
          'खेत में धूल न जमने दें, रास्ते के किनारे पानी छिड़कें',
          'सूखा तनाव न आने दें, समय पर सिंचाई करें',
          'बेवजह कीटनाशक न छिड़कें — मित्र कीट मरने से माइट बढ़ता है',
          'हर हफ्ते पत्ती पलटकर जाँच करें',
        ],
        speech:
          'पहचानी गई है लाल मकड़ी, जिसे स्पाइडर माइट कहते हैं। ' +
          'इसमें पत्तियों पर बहुत महीन पीले सफेद बिंदु बन जाते हैं, जैसे किसी ने सुई से छेद किए हों, ' +
          'और पत्ती धीरे धीरे कांसे जैसी भूरी होकर सूख जाती है। ' +
          'पत्ती को पलटकर देखिए, निचली सतह पर बहुत छोटे लाल हरे रेंगते जीव और महीन जाला दिखेगा, यही पक्की पहचान है। ' +
          'बहुत ज़रूरी बात, यह कीड़ा नहीं, मकड़ी की जाति का है, ' +
          'इसलिए साधारण कीटनाशक इस पर काम नहीं करते, बल्कि गलत दवा से यह और बढ़ जाता है। ' +
          'अभी करने वाला काम यह है कि स्पाइरोमेसिफेन लगभग एक मिलीलीटर या प्रोपरगाइट लगभग दो मिलीलीटर प्रति लीटर पानी में छिड़कें, ' +
          'और छिड़काव पत्ती की निचली सतह पर कीजिए, क्योंकि माइट वहीं बैठता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Tomato_mosaic_virus: {
        nameHi: 'मोज़ेक विषाणु',
        nameEn: 'Tomato Mosaic Virus',
        pathogen: 'विषाणु / Virus — ToMV, छूने और औज़ार से फैलता है',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'यह विषाणु हाथ, कपड़े और औज़ार से फैलता है — कीट से नहीं। इसलिए रोगी पौधे छूने के बाद ' +
          'बिना हाथ धोए स्वस्थ पौधे मत छुइए। तंबाकू/बीड़ी के बाद हाथ ज़रूर धोएँ।',
        actions: [
          'रोगग्रस्त पौधे उखाड़कर खेत से बाहर नष्ट करें',
          'रोगी पौधे छूने के बाद हाथ साबुन से धोएँ, औज़ार साफ करें',
          'खेत में बीड़ी-तंबाकू का इस्तेमाल न करें, और करें तो पहले हाथ धोएँ',
        ],
        symptoms:
          'नई पत्तियों पर हल्के और गहरे हरे रंग के धब्बे मिलकर चितकबरा (मोज़ेक) पैटर्न बना देते हैं। ' +
          'पत्तियाँ छोटी, सिकुड़ी, और कभी-कभी फर्न या धागे जैसी पतली हो जाती हैं। ' +
          'पौधे की बढ़त रुक जाती है, फल कम और छोटे लगते हैं और उन पर भूरे धब्बे या अंदर भूरापन आ सकता है। ' +
          'पत्ती मरोड़ विषाणु से फर्क यह है कि इसमें पत्ती पीली नहीं होती और ऊपर की ओर कटोरी जैसी नहीं मुड़ती।',
        symptomsEn:
          'Light and dark green mottling forms a mosaic on young leaves, which become small, puckered and sometimes ' +
          'fern-like or thread-like. Growth is stunted with fewer, smaller fruit that may show brown internal marks. ' +
          'Unlike leaf curl virus the leaves do not yellow or cup upward.',
        organic: [
          'रोग-रोधी किस्में लगाएँ',
          'बीज को 10% ट्राइसोडियम फॉस्फेट के घोल में 15 मिनट डुबोएँ',
          'रोगी पौधे लगातार निकालते रहें',
          'खेत में दूध का घोल हाथ धोने के लिए रखें (परंपरागत तरीका)',
        ],
        chemical: [
          'विषाणु की कोई दवा नहीं है',
          'औज़ार को 1% सोडियम हाइपोक्लोराइट (ब्लीच) से साफ करें',
          'बिना ज़रूरत कीटनाशक न छिड़कें — यह कीट से नहीं फैलता',
        ],
        prevention: [
          'स्वस्थ, प्रमाणित बीज और पौध लें',
          'खेत में काम करने से पहले और रोगी पौधे छूने के बाद हाथ धोएँ',
          'औज़ार और सहारे की डंडियाँ साफ रखें',
          'खरपतवार साफ रखें',
        ],
        speech:
          'पहचाना गया रोग है मोज़ेक विषाणु, जिसे टमाटर मोज़ेक वायरस कहते हैं। ' +
          'इसमें नई पत्तियों पर हल्के और गहरे हरे धब्बे मिलकर चितकबरा पैटर्न बना देते हैं, ' +
          'पत्तियाँ छोटी और सिकुड़ी हो जाती हैं, और पौधे की बढ़त रुक जाती है। ' +
          'ध्यान से सुनिए, यह विषाणु कीट से नहीं, बल्कि हाथ, कपड़े और औज़ार से फैलता है। ' +
          'इसलिए रोगी पौधे छूने के बाद बिना हाथ धोए स्वस्थ पौधे मत छुइए, ' +
          'और खेत में बीड़ी या तंबाकू इस्तेमाल करने के बाद हाथ ज़रूर धोइए। ' +
          'अभी करने वाला काम यह है कि रोगग्रस्त पौधे उखाड़कर खेत से बाहर नष्ट कर दें, ' +
          'हाथ साबुन से धोएँ और औज़ार साफ करें। ' +
          'विषाणु की कोई दवा नहीं है, इसलिए बेवजह छिड़काव पर पैसा मत लगाइए। ' +
          'उपाय की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Tomato_Yellow_Leaf_Curl_Virus: {
        nameHi: 'पत्ती मरोड़ विषाणु',
        nameEn: 'Yellow Leaf Curl Virus (TYLCV)',
        pathogen: 'विषाणु / Virus — TYLCV, सफेद मक्खी से फैलता है',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        note:
          'विषाणु का कोई इलाज नहीं है — पूरा बचाव सफेद मक्खी रोकने पर टिका है। ' +
          'रोगी पौधा जितनी देर खेत में रहेगा, सफेद मक्खी उससे रोग उठाकर बाकी पौधों में फैलाती रहेगी।',
        actions: [
          'रोगग्रस्त पौधे आज ही उखाड़कर खेत से बाहर नष्ट करें',
          'सफेद मक्खी के लिए डाइफेनथाययूरॉन लगभग 1.5 ग्राम प्रति लीटर पानी छिड़कें',
          'खेत में पीले चिपचिपे कार्ड लगाएँ — 8–10 प्रति एकड़',
        ],
        symptoms:
          'ऊपर की नई पत्तियाँ छोटी रह जाती हैं और किनारों से ऊपर की ओर मुड़कर कटोरी जैसी हो जाती हैं। ' +
          'पत्तियों के किनारे और नसों के बीच का हिस्सा पीला पड़ जाता है, जबकि नसें हरी रहती हैं। ' +
          'पौधा बौना और झाड़ीनुमा हो जाता है, फूल झड़ जाते हैं और फल लगते ही नहीं या बहुत कम लगते हैं। ' +
          'पत्ती पलटकर देखें तो निचली सतह पर छोटी सफेद मक्खियाँ बैठी मिलेंगी — यही रोग फैलाती हैं।',
        symptomsEn:
          'New leaves stay small and cup upward from the margins, with yellowing between the veins while veins stay ' +
          'green. Plants become stunted and bushy, flowers drop and little or no fruit sets. Small whiteflies rest ' +
          'on the underside — the vector.',
        organic: [
          'नीम का तेल लगभग 5 मि.ली. प्रति लीटर पानी',
          'खेत के चारों ओर मक्का या बाजरा की बाड़ लगाएँ',
          'पौध को 30 दिन तक नायलॉन नेट के नीचे रखें',
          'पीले चिपचिपे कार्ड लगाएँ',
        ],
        chemical: [
          'डाइफेनथाययूरॉन 50 WP — लगभग 1.5 ग्राम प्रति लीटर पानी',
          'या स्पाइरोमेसिफेन 22.9 SC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'या पाइरीप्रोक्सीफेन — लगभग 1 मि.ली. प्रति लीटर पानी',
          'दवा बदल-बदल कर लगाएँ; विषाणु की कोई सीधी दवा नहीं है',
        ],
        prevention: [
          'रोग-रोधी किस्में लगाएँ',
          'नर्सरी में ही सफेद मक्खी रोकें, स्वस्थ पौध ही रोपें',
          'खरपतवार साफ रखें — इन्हीं में विषाणु और मक्खी बचती है',
          'रोगी पौधे तुरंत निकालते रहें, इंतज़ार न करें',
        ],
        speech:
          'पहचाना गया रोग है पत्ती मरोड़ विषाणु, जिसे टी वाई एल सी वी कहते हैं। यह सफेद मक्खी से फैलता है। ' +
          'इसमें ऊपर की नई पत्तियाँ छोटी रह जाती हैं और किनारों से ऊपर की ओर मुड़कर कटोरी जैसी हो जाती हैं, ' +
          'किनारे पीले पड़ जाते हैं, पौधा बौना और झाड़ीनुमा हो जाता है और फल लगते ही नहीं। ' +
          'ध्यान से सुनिए, विषाणु का कोई इलाज नहीं है, पूरा बचाव सफेद मक्खी रोकने पर टिका है। ' +
          'रोगी पौधा जितनी देर खेत में रहेगा, सफेद मक्खी उससे रोग उठाकर बाकी पौधों में फैलाती रहेगी। ' +
          'इसलिए अभी करने वाला काम यह है कि रोगग्रस्त पौधे आज ही उखाड़कर खेत से बाहर नष्ट कर दें, देर मत कीजिए। ' +
          'सफेद मक्खी के लिए डाइफेनथाययूरॉन लगभग डेढ़ ग्राम प्रति लीटर पानी में छिड़कें, ' +
          'और खेत में पीले चिपचिपे कार्ड लगा दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },
    },
  },
  /* ##################### 9. MANGO / आम ##################### */
  /* Model: Teachable Machine (TFJS) — models/mango/model.json
     Aam ek PED hai, saalana fasal nahi — isliye salah me chhataai (pruning),
     bagiche ki safai aur phool-phal ki avastha ka khaas dhyaan rakha gaya hai. */
  mango: {
    id: 'mango',
    nameHi: 'आम',
    nameEn: 'Mango',
    altHi: 'आम का पेड़',
    icon: 'crop-mango',
    seasonHi: 'बागवानी (बारहमासी पेड़)',
    photoHintHi: 'आम की पत्ती या रोगग्रस्त टहनी की साफ फोटो अपलोड करें',
    photoHintKey: 'ui.hint.mango',
    labels: [
      'Mango_Anthracnose',       // 0
      'Mango_Bacterial_Canker',  // 1
      'Mango_Cutting_Weevil',    // 2
      'Mango_Die_Back',          // 3
      'Mango_Gall_Midge',        // 4
      'Mango_Healthy',           // 5
      'Mango_Powdery_Mildew',    // 6
      'Mango_Sooty_Mould',       // 7
    ],
    classes: {

      /* ------------------------------------------------------------------ */
      Mango_Anthracnose: {
        nameHi: 'एन्थ्रेक्नोज (श्यामवर्ण)',
        nameEn: 'Anthracnose',
        pathogen: 'कवक / Fungus — Colletotrichum gloeosporioides',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'कार्बेन्डाजिम ~1 ग्राम/लीटर पानी छिड़कें',
          'रोगग्रस्त टहनियाँ, पत्तियाँ और गिरे फल हटाकर जलाएँ',
          'बौर (फूल) आने से पहले और फल मटर के आकार पर छिड़काव दोहराएँ',
          'तोड़े हुए फल 52°C गर्म पानी में 5 मिनट डुबोएँ',
        ],
        symptoms:
          'पत्तियों पर अनियमित आकार के गहरे भूरे-काले धब्बे बनते हैं, जो बढ़कर आपस में मिल जाते हैं और ' +
          'बीच का हिस्सा सूखकर गिर जाता है — पत्ती छेद वाली (shot-hole) दिखने लगती है। ' +
          'बौर (फूल) पर काले धब्बे पड़कर वह झुलस जाता है और झड़ जाता है, जिससे फल बनते ही नहीं। ' +
          'फल पर काले, धँसे हुए गोल धब्बे बनते हैं — ये अक्सर तोड़ने के बाद, पकते समय उभरते हैं और ' +
          'पूरा फल सड़ जाता है। यही सबसे बड़ा नुकसान है, क्योंकि मंडी तक पहुँचते-पहुँचते माल खराब हो जाता है। ' +
          'बारिश, ज़्यादा नमी और बौर के समय बादल इसे तेज़ी से बढ़ाते हैं।',
        symptomsEn:
          'Irregular dark brown-black spots on leaves that merge; the centre dries and drops out, giving a shot-hole ' +
          'look. Black spots blight the panicle so flowers drop and no fruit sets. On fruit, black sunken round spots ' +
          'appear mostly after harvest during ripening, rotting the whole fruit. Worse in rain, high humidity and ' +
          'cloudy weather at flowering.',
        organic: [
          'बगीचे की सफाई — गिरे पत्ते, टहनियाँ और सड़े फल हटाकर जला दें',
          'सूखी और रोगग्रस्त टहनियाँ काटकर कटे हिस्से पर बोर्डो पेस्ट लगाएँ',
          'ट्राइकोडर्मा हार्जिएनम मिली गोबर खाद पेड़ के थाले में डालें',
          'पेड़ के बीच हवा और धूप जाए — घनी शाखाएँ छाँट दें',
          'तोड़ने के बाद फल 52°C गर्म पानी में 5 मिनट डुबोएँ — सड़न बहुत घट जाती है',
        ],
        chemical: [
          'कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी',
          'विकल्प: कॉपर ऑक्सीक्लोराइड 50 WP — लगभग 3 ग्राम प्रति लीटर पानी',
          'विकल्प: मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'तीन छिड़काव: बौर आने से पहले, बौर खिलते समय (मधुमक्खी बचाकर), और फल मटर के आकार पर',
        ],
        prevention: [
          'हर साल कटाई के बाद चढ़ाई-छँटाई (pruning) करें',
          'बगीचे में जल-जमाव न होने दें',
          'रोग-रोधी किस्में लगाएँ; नया पौधा स्वस्थ नर्सरी से ही लें',
          'संतुलित खाद — पोटाश और सूक्ष्म तत्व पूरे दें',
          'फल तोड़ते समय डंठल 1 सें.मी. रखें, चोट न लगने दें',
        ],
        speech:
          'पहचाना गया रोग है एन्थ्रेक्नोज, जिसे श्यामवर्ण भी कहते हैं। यह आम का सबसे नुकसानदायक रोग है। ' +
          'पत्तियों पर गहरे भूरे-काले धब्बे बनते हैं और बीच का हिस्सा सूखकर गिर जाता है, जिससे पत्ती में छेद जैसे दिखते हैं। ' +
          'बौर पर काले धब्बे पड़कर वह झुलस जाता है और फल बनते ही नहीं। ' +
          'सबसे बड़ा नुकसान यह है कि फल पर काले धँसे धब्बे तोड़ने के बाद पकते समय उभरते हैं और पूरा फल सड़ जाता है। ' +
          'उपचार के लिए कार्बेन्डाजिम लगभग एक ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'तीन बार छिड़कें — बौर आने से पहले, बौर खिलते समय, और फल मटर के आकार का होने पर। ' +
          'रोगग्रस्त टहनियाँ और गिरे फल हटाकर जला दीजिए। ' +
          'एक बढ़िया सस्ता उपाय — तोड़े हुए आम को बावन डिग्री गर्म पानी में पाँच मिनट डुबो दीजिए, इससे सड़न बहुत घट जाती है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Mango_Bacterial_Canker: {
        nameHi: 'जीवाणु कैंकर',
        nameEn: 'Bacterial Canker',
        pathogen: 'जीवाणु / Bacteria — Xanthomonas campestris pv. mangiferae',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'स्ट्रेप्टोसाइक्लिन 0.1 ग्राम + कॉपर ऑक्सीक्लोराइड 3 ग्राम प्रति लीटर',
          'रोगग्रस्त टहनियाँ काटकर जलाएँ, औज़ार हर कट के बाद साफ करें',
          'गिरे रोगग्रस्त फल बगीचे से बाहर करें',
          'आँधी-बारिश के बाद छिड़काव ज़रूर करें',
        ],
        symptoms:
          'पत्ती पर पहले पानी से भीगे जैसे छोटे धब्बे बनते हैं जो बाद में काले, कोणीय और उभरे हुए हो जाते हैं, ' +
          'और उनके चारों ओर पीला घेरा होता है। ' +
          'फल पर काले, उभरे हुए, फटे हुए घाव (कैंकर) बनते हैं जिनमें से चिपचिपा गोंद जैसा रस निकलता है — ' +
          'यही इसकी पक्की पहचान है और यहीं यह एन्थ्रेक्नोज से अलग होता है (उसमें धब्बे धँसे हुए होते हैं, उभरे नहीं)। ' +
          'टहनियों पर भी लंबे घाव बनते हैं और छाल फट जाती है। ' +
          'फल फटकर गिर जाते हैं। आँधी, बारिश और ओले इसे तेज़ी से फैलाते हैं क्योंकि घावों से जीवाणु अंदर घुसता है।',
        symptomsEn:
          'Water-soaked spots on leaves turn black, angular and raised with a yellow halo. On fruit, black raised ' +
          'cracked cankers ooze a sticky gum — the key sign, and what separates it from anthracnose (whose spots are ' +
          'sunken, not raised). Twigs develop long lesions with split bark; fruits crack and drop. Storms, rain and ' +
          'hail spread it through wounds.',
        organic: [
          'रोगग्रस्त टहनियाँ स्वस्थ हिस्से से 10 सें.मी. नीचे से काटकर जला दें',
          'हर कट के बाद औज़ार को ब्लीच/स्पिरिट से साफ करें — वरना आप खुद रोग फैलाएँगे',
          'कटे हिस्से पर बोर्डो पेस्ट लगाएँ',
          'बगीचे में हवा चले — घनी शाखाएँ छाँटें; गिरे फल-पत्ते हटाएँ',
          'नया पौधा हमेशा प्रमाणित, रोग-मुक्त नर्सरी से लें',
        ],
        chemical: [
          'स्ट्रेप्टोसाइक्लिन 0.1 ग्राम + कॉपर ऑक्सीक्लोराइड 50 WP 3 ग्राम प्रति लीटर पानी',
          'विकल्प: कॉपर हाइड्रॉक्साइड 53.8 DF — लगभग 2 ग्राम प्रति लीटर पानी',
          '10–15 दिन के अंतर पर 3 छिड़काव; आँधी-ओले के तुरंत बाद एक छिड़काव ज़रूरी',
          'फूल खिलने के समय छिड़काव से बचें — मधुमक्खियों को नुकसान होता है',
        ],
        prevention: [
          'रोग-मुक्त कलम/पौधा ही लगाएँ',
          'बगीचे के चारों ओर हवा-रोक (windbreak) पेड़ लगाएँ — घाव कम होंगे',
          'हर साल छँटाई और बगीचे की सफाई',
          'संतुलित खाद; नाइट्रोजन ज़्यादा न दें',
          'सिंचाई ऊपर से न करें, थाले में दें',
        ],
        speech:
          'पहचाना गया रोग है जीवाणु कैंकर। ' +
          'पत्तियों पर काले कोणीय उभरे धब्बे बनते हैं जिनके चारों ओर पीला घेरा होता है। ' +
          'फल पर काले, उभरे और फटे हुए घाव बनते हैं जिनसे चिपचिपा गोंद जैसा रस निकलता है — यही इसकी पक्की पहचान है। ' +
          'ध्यान दीजिए, एन्थ्रेक्नोज में धब्बे धँसे हुए होते हैं, जबकि इसमें उभरे हुए। ' +
          'उपचार के लिए स्ट्रेप्टोसाइक्लिन शून्य दशमलव एक ग्राम और कॉपर ऑक्सीक्लोराइड तीन ग्राम प्रति लीटर पानी मिलाकर छिड़काव करें। ' +
          'रोगग्रस्त टहनियाँ स्वस्थ हिस्से से दस सेंटीमीटर नीचे से काटकर जला दीजिए। ' +
          'बहुत ज़रूरी बात — हर कटाई के बाद औज़ार को साफ कीजिए, वरना आप खुद ही रोग एक पेड़ से दूसरे पर ले जाएँगे। ' +
          'आँधी, बारिश या ओले पड़ने के तुरंत बाद एक छिड़काव ज़रूर कीजिए, क्योंकि घावों से जीवाणु अंदर घुसता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Mango_Die_Back: {
        nameHi: 'डाई-बैक (टहनी सूखना)',
        nameEn: 'Die Back',
        pathogen: 'कवक / Fungus — Botryodiplodia theobromae',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'सूखी टहनी हरे हिस्से से 15 सें.मी. नीचे से काटें',
          'कटे हिस्से पर तुरंत बोर्डो पेस्ट या कॉपर पेस्ट लगाएँ',
          'कॉपर ऑक्सीक्लोराइड 3 ग्राम/लीटर पानी छिड़कें',
          'कटी टहनियाँ बगीचे से बाहर ले जाकर जलाएँ',
        ],
        symptoms:
          'टहनी का सिरा ऊपर से नीचे की ओर सूखना शुरू होता है — यही नाम का मतलब है। ' +
          'पहले ऊपर की पत्तियाँ भूरी होकर मुरझाती हैं और लटक जाती हैं, पर पेड़ से गिरती नहीं (सूखी पत्तियाँ लटकी रहती हैं) — ' +
          'यह पक्की पहचान है। सूखने की रेखा नीचे की ओर बढ़ती जाती है। ' +
          'सूखे और हरे हिस्से के जोड़ पर छाल चीरकर देखें तो अंदर की लकड़ी भूरी-काली दिखती है, जबकि स्वस्थ लकड़ी हरी-सफेद होती है। ' +
          'टहनी से गोंद भी रिस सकता है। कमज़ोर, प्यासे और बिना खाद वाले पेड़ इसकी चपेट में जल्दी आते हैं।',
        symptomsEn:
          'Twigs dry from the tip downward. Upper leaves turn brown, wilt and hang on the tree without falling — the ' +
          'key sign. The drying line moves downward. Cut the bark at the junction of dead and green wood: the inner ' +
          'wood is brown-black instead of healthy greenish-white. Gum may ooze. Weak, water-stressed and underfed ' +
          'trees are attacked first.',
        organic: [
          'सूखी टहनी हरे हिस्से से 15 सें.मी. नीचे से काटें — कम काटने से रोग बचा रह जाता है',
          'कटे हिस्से पर तुरंत बोर्डो पेस्ट लगाएँ (खुला न छोड़ें)',
          'ट्राइकोडर्मा मिली गोबर खाद थाले में डालें',
          'पेड़ को नियमित पानी और संतुलित खाद दें — कमज़ोर पेड़ पर ही यह रोग आता है',
          'कटी टहनियाँ बगीचे में न छोड़ें, जला दें',
        ],
        chemical: [
          'कॉपर ऑक्सीक्लोराइड 50 WP — लगभग 3 ग्राम प्रति लीटर पानी',
          'विकल्प: कार्बेन्डाजिम 50 WP — लगभग 1 ग्राम प्रति लीटर पानी',
          'कटाई के बाद पूरे पेड़ पर छिड़काव करें, 15 दिन बाद दोहराएँ',
          'तने पर बोर्डो पेंट (जमीन से 1 मीटर तक) साल में एक बार',
        ],
        prevention: [
          'हर साल छँटाई और कटे हिस्सों पर पेस्ट',
          'गर्मी में सिंचाई न रोकें — पानी की कमी सबसे बड़ा कारण है',
          'संतुलित खाद, ज़िंक और बोरॉन की कमी न होने दें',
          'तने या जड़ पर चोट न लगने दें (जुताई के समय ध्यान)',
          'दीमक का नियंत्रण करें — घायल जड़ से रोग घुसता है',
        ],
        speech:
          'पहचाना गया रोग है डाई-बैक, यानी टहनी का ऊपर से नीचे की ओर सूखना। ' +
          'पहले ऊपर की पत्तियाँ भूरी होकर मुरझाती हैं और लटक जाती हैं, पर पेड़ से गिरती नहीं — यही इसकी पक्की पहचान है। ' +
          'सूखे और हरे हिस्से के जोड़ पर छाल चीरकर देखिए, अंदर की लकड़ी भूरी-काली मिलेगी, जबकि स्वस्थ लकड़ी हरी-सफेद होती है। ' +
          'सबसे ज़रूरी काम यह है कि सूखी टहनी को हरे हिस्से से पंद्रह सेंटीमीटर नीचे से काटिए। कम काटेंगे तो रोग अंदर बचा रह जाएगा। ' +
          'कटे हिस्से पर तुरंत बोर्डो पेस्ट लगाइए, खुला मत छोड़िए। ' +
          'फिर कॉपर ऑक्सीक्लोराइड तीन ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'याद रखिए, यह रोग कमज़ोर और प्यासे पेड़ों पर ही आता है — इसलिए गर्मी में सिंचाई मत रोकिए और खाद पूरी दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Mango_Powdery_Mildew: {
        nameHi: 'चूर्णिल आसिता (सफेद पाउडर)',
        nameEn: 'Powdery Mildew',
        pathogen: 'कवक / Fungus — Oidium mangiferae',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'घुलनशील सल्फर ~2 ग्राम/लीटर पानी — बौर आते ही',
          'या हेक्साकोनाज़ोल ~1 मि.ली./लीटर पानी',
          '10–15 दिन के अंतर पर 2–3 छिड़काव',
          'फूल पूरे खिलने पर छिड़काव न करें — मधुमक्खी बचाएँ',
        ],
        symptoms:
          'बौर (फूल की डंडी), नई पत्तियों और छोटे फलों पर सफेद, आटे जैसी पाउडर की परत जम जाती है — ' +
          'ऐसा लगता है जैसे किसी ने आटा छिड़क दिया हो। उंगली से रगड़ने पर यह परत मिट जाती है। ' +
          'ग्रस्त बौर सूखकर काला पड़ जाता है और पूरा झड़ जाता है, जिससे फल बनते ही नहीं — ' +
          'यही सबसे बड़ा नुकसान है, क्योंकि एक ही हफ्ते में पूरी फसल जा सकती है। ' +
          'छोटे फल पर परत जमे तो वे टेढ़े होकर गिर जाते हैं। ' +
          'बौर के समय ठंडी रातें, दिन में गर्मी, ओस और बादल — यही मौसम इसे भड़काता है।',
        symptomsEn:
          'A white flour-like powdery coating on panicles, young leaves and small fruits that rubs off with a finger. ' +
          'Affected panicles dry, blacken and shed completely so no fruit sets — an entire crop can be lost in a week. ' +
          'Small fruits become misshapen and drop. Triggered by cool nights, warm days, dew and cloud at flowering.',
        organic: [
          'घुलनशील सल्फर 80 WP — लगभग 2 ग्राम प्रति लीटर पानी (तेज़ धूप में न छिड़कें)',
          'नीम तेल 3% (30 मि.ली. प्रति लीटर पानी)',
          'दूध का घोल: 1 भाग कच्चा दूध + 9 भाग पानी, हफ्ते में एक बार',
          'बगीचे में हवा चले — घनी शाखाएँ छाँट दें',
          'गिरे बौर और पत्ते हटाकर जला दें',
        ],
        chemical: [
          'हेक्साकोनाज़ोल 5 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: डाइनोकैप 48 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: ट्राइडेमॉर्फ 80 EC — लगभग 0.5 मि.ली. प्रति लीटर पानी',
          'पहला छिड़काव बौर निकलते ही, फिर 10–15 दिन के अंतर पर 2 और',
        ],
        prevention: [
          'हर साल छँटाई — घने पेड़ में नमी रुकती है',
          'बौर के मौसम में रोज़ बगीचा देखें, पहला सफेद निशान दिखते ही छिड़काव',
          'संतुलित खाद; नाइट्रोजन ज़्यादा न दें',
          'बगीचे में जल-जमाव न होने दें',
        ],
        speech:
          'पहचाना गया रोग है चूर्णिल आसिता, जिसे सफेद पाउडर रोग भी कहते हैं। ' +
          'बौर, नई पत्तियों और छोटे फलों पर आटे जैसी सफेद परत जम जाती है, जो उंगली से रगड़ने पर मिट जाती है। ' +
          'ग्रस्त बौर सूखकर काला पड़ जाता है और पूरा झड़ जाता है, जिससे फल बनते ही नहीं। ' +
          'यह बहुत तेज़ी से फैलता है — एक ही हफ्ते में पूरी फसल जा सकती है, इसलिए देर मत कीजिए। ' +
          'बौर निकलते ही घुलनशील सल्फर लगभग दो ग्राम प्रति लीटर पानी, या हेक्साकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी का छिड़काव करें। ' +
          'दस से पंद्रह दिन के अंतर पर दो-तीन छिड़काव कीजिए। ' +
          'एक ज़रूरी बात — जब फूल पूरे खिले हों तब छिड़काव मत कीजिए, वरना मधुमक्खियाँ मर जाएँगी और परागण ही नहीं होगा। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Mango_Sooty_Mould: {
        nameHi: 'काली फफूंद (सूटी मोल्ड)',
        nameEn: 'Sooty Mould',
        pathogen: 'कवक / Fungus — Capnodium spp. (कीट के मीठे स्राव पर उगती है)',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'असली जड़ पकड़ें — भुनगा/माहू/स्केल कीट को पहले मारें',
          'इमिडाक्लोप्रिड ~0.3 मि.ली./लीटर से चूसक कीट का नियंत्रण',
          'स्टार्च घोल (1 किलो मैदा/स्टार्च 20 लीटर पानी में) छिड़ककर परत उतारें',
          'सिर्फ फफूंदनाशी छिड़कना बेकार है — काली परत लौट आएगी',
        ],
        symptoms:
          'पत्तियों, टहनियों और फलों पर काली, कालिख जैसी परत जम जाती है — पूरा पेड़ काला दिखने लगता है। ' +
          'यह परत हाथ या गीले कपड़े से रगड़ने पर उतर जाती है और नीचे की पत्ती हरी मिलती है — यही पहचान है। ' +
          'ध्यान देने वाली बात यह है कि यह फफूंद पत्ती को खाती नहीं। यह भुनगा (hopper), माहू या स्केल कीट के ' +
          'मीठे चिपचिपे स्राव (हनीड्यू) पर उगती है। ' +
          'नुकसान यह है कि काली परत धूप रोक देती है, जिससे पत्ती भोजन नहीं बना पाती, पेड़ कमज़ोर होता है और ' +
          'फल काले-गंदे दिखने से मंडी में भाव नहीं मिलता। ' +
          'इसलिए इलाज फफूंद का नहीं, उन कीटों का करना है जिनका स्राव इसे पाल रहा है।',
        symptomsEn:
          'A black soot-like coating on leaves, twigs and fruit that wipes off with a wet cloth, leaving a green leaf ' +
          'underneath. The fungus does not feed on the plant — it grows on the honeydew of hoppers, aphids or scale ' +
          'insects. The black layer blocks sunlight, weakening the tree, and blackened fruit fetches a poor price. ' +
          'So the real treatment is controlling those sap-sucking insects, not the mould.',
        organic: [
          'भुनगा/माहू के लिए नीम तेल 5 मि.ली. प्रति लीटर पानी',
          'स्टार्च/मैदा घोल छिड़कें — सूखने पर परत पपड़ी बनकर झड़ जाती है',
          'पेड़ की छँटाई करके धूप और हवा अंदर तक पहुँचाएँ',
          'चींटियों की कतार रोकें — वे चूसक कीटों को पालती और फैलाती हैं',
          'मित्र कीट (लेडीबर्ड, क्राइसोपा) बचाएँ',
        ],
        chemical: [
          'चूसक कीट पर: इमिडाक्लोप्रिड 17.8 SL — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'विकल्प: थायामेथोक्सम 25 WG — लगभग 0.2 ग्राम प्रति लीटर पानी',
          'परत बहुत मोटी हो तो कॉपर ऑक्सीक्लोराइड 3 ग्राम/लीटर साथ में',
          'फल तोड़ने से 20 दिन पहले सारा छिड़काव बंद कर दें',
        ],
        prevention: [
          'भुनगे का समय पर नियंत्रण — बौर के समय खास ध्यान',
          'हर साल छँटाई; घना पेड़ कीट का घर बनता है',
          'बगीचे की सफाई और खरपतवार नियंत्रण',
          'नाइट्रोजन संतुलित — मुलायम कोंपलों पर चूसक कीट ज़्यादा आते हैं',
        ],
        speech:
          'पहचानी गई है काली फफूंद, जिसे सूटी मोल्ड कहते हैं। पत्तियों और फलों पर कालिख जैसी काली परत जम जाती है। ' +
          'यह परत गीले कपड़े से रगड़ने पर उतर जाती है और नीचे पत्ती हरी मिलती है। ' +
          'सबसे ज़रूरी बात समझिए — यह फफूंद पत्ती को खाती नहीं है। यह भुनगा, माहू या स्केल कीट के मीठे चिपचिपे स्राव पर उगती है। ' +
          'इसलिए सिर्फ फफूंद की दवा छिड़कना बेकार है, परत फिर लौट आएगी। ' +
          'असली इलाज उन चूसक कीटों को मारना है। इसके लिए इमिडाक्लोप्रिड लगभग शून्य दशमलव तीन मिलीलीटर प्रति लीटर पानी का छिड़काव करें। ' +
          'जमी हुई काली परत उतारने के लिए एक किलो मैदा या स्टार्च बीस लीटर पानी में घोलकर छिड़क दीजिए — सूखने पर परत पपड़ी बनकर झड़ जाती है। ' +
          'चींटियों की कतार भी रोकिए, क्योंकि वे इन कीटों को पालती हैं। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Mango_Gall_Midge: {
        nameHi: 'गॉल मिज (गाँठ मक्खी)',
        nameEn: 'Gall Midge',
        pathogen: 'कीट / Insect — Procontarinia matteiana',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'गाँठ वाली पत्तियाँ और बौर तोड़कर जला दें',
          'डाइमेथोएट ~1.5 मि.ली./लीटर पानी छिड़कें',
          'पेड़ के थाले की मिट्टी गोड़ें — अंदर के प्यूपा धूप से मरेंगे',
          'बौर निकलते समय खास निगरानी रखें',
        ],
        symptoms:
          'पत्तियों पर छोटे, गोल, मटर जैसे उभार (गाँठ / gall) बन जाते हैं — पत्ती फफोलेदार दिखती है। ' +
          'हर गाँठ के अंदर एक छोटा सफेद-नारंगी कीड़ा (मैगट) रहता है; गाँठ चीरकर देखने पर वह मिल जाता है। ' +
          'ज़्यादा गाँठें बनने पर पत्ती टेढ़ी होकर सूख जाती है और गिर जाती है। ' +
          'बौर (फूल की डंडी) पर गाँठ बने तो वह हिस्सा सूख जाता है और फल नहीं बनता — यही असली नुकसान है। ' +
          'नई कोंपल और बौर निकलने के समय यह सबसे ज़्यादा हमला करता है।',
        symptomsEn:
          'Small round pea-like swellings (galls) on leaves give a blistered look. Each gall holds a tiny white-orange ' +
          'maggot inside — cut one open to confirm. Heavy galling distorts and dries the leaf. Galls on the flower ' +
          'panicle dry that portion so no fruit sets, which is the real loss. Worst during new flush and flowering.',
        organic: [
          'गाँठ वाली पत्तियाँ और बौर तोड़कर बगीचे से बाहर जलाएँ — अंदर का कीड़ा वहीं मर जाएगा',
          'पेड़ के थाले की मिट्टी गोड़ें/पलटें — ज़मीन में छिपे प्यूपा धूप में मर जाते हैं',
          'नीम तेल 5 मि.ली. प्रति लीटर पानी, नई कोंपल आते ही',
          'गिरी हुई पत्तियाँ बगीचे में न सड़ने दें',
        ],
        chemical: [
          'डाइमेथोएट 30 EC — लगभग 1.5 मि.ली. प्रति लीटर पानी',
          'विकल्प: इमिडाक्लोप्रिड 17.8 SL — लगभग 0.3 मि.ली. प्रति लीटर पानी',
          'थाले में कार्बोफ्यूरान 3G — प्रति पेड़ लगभग 30 ग्राम, मिट्टी में मिलाकर',
          'बौर निकलते समय पहला छिड़काव; 15 दिन बाद ज़रूरत हो तो दूसरा',
        ],
        prevention: [
          'हर साल कटाई के बाद छँटाई और बगीचे की सफाई',
          'सर्दी में थाले की गहरी गुड़ाई — प्यूपा नष्ट होते हैं',
          'गिरी पत्तियाँ इकट्ठा करके जलाएँ या कम्पोस्ट करें',
          'नई कोंपल के समय हर हफ्ते पत्तियाँ जाँचें',
        ],
        speech:
          'पहचाना गया है गॉल मिज, यानी गाँठ बनाने वाली मक्खी। ' +
          'पत्तियों पर छोटे गोल मटर जैसे उभार बन जाते हैं और पत्ती फफोलेदार दिखती है। ' +
          'एक गाँठ चीरकर देखिए, अंदर छोटा सफेद-नारंगी कीड़ा मिलेगा। ' +
          'असली नुकसान तब होता है जब ये गाँठें बौर पर बनती हैं — वह हिस्सा सूख जाता है और फल बनता ही नहीं। ' +
          'सबसे पहले गाँठ वाली पत्तियाँ और बौर तोड़कर बगीचे से बाहर जला दीजिए, अंदर का कीड़ा वहीं मर जाएगा। ' +
          'फिर डाइमेथोएट लगभग डेढ़ मिलीलीटर प्रति लीटर पानी का छिड़काव करें। ' +
          'पेड़ के थाले की मिट्टी गोड़ दीजिए, क्योंकि ज़मीन में छिपे प्यूपा धूप लगने से मर जाते हैं। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Mango_Cutting_Weevil: {
        nameHi: 'कटुआ घुन (कटिंग वीविल)',
        nameEn: 'Cutting Weevil',
        pathogen: 'कीट / Insect — Deporaus marginatus (पत्ती काटने वाला घुन)',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'नीचे गिरी कटी पत्तियाँ रोज़ बीनकर जला दें',
          'क्विनालफॉस ~2 मि.ली./लीटर पानी — नई कोंपल पर',
          'थाले की मिट्टी गोड़ें — अंदर के प्यूपा मर जाएँगे',
          'नर्सरी और छोटे पौधों पर खास नज़र रखें',
        ],
        symptoms:
          'नई कोंपल की मुलायम पत्तियाँ बीच से कटकर नीचे गिरी मिलती हैं — जैसे किसी ने कैंची से काट दी हों। ' +
          'यही पक्की पहचान है: पेड़ के नीचे कटी हुई ताज़ी हरी पत्तियों का ढेर। ' +
          'मादा घुन पत्ती में अंडा देती है और फिर डंठल के पास से पत्ती काट देती है, ताकि गिरी पत्ती में ' +
          'उसका बच्चा (ग्रब) आराम से पले। ' +
          'छोटा भूरा-काला घुन पत्तियों पर दिखता है और छूने पर नीचे गिर जाता है। ' +
          'नए पौधों और नर्सरी में यह ज़्यादा नुकसान करता है, क्योंकि पूरी नई बढ़वार ही कट जाती है।',
        symptomsEn:
          'Fresh tender leaves of the new flush are found cut and lying under the tree as if snipped with scissors — ' +
          'the key sign. The female lays an egg in the leaf and then cuts it near the petiole so the grub can develop ' +
          'in the fallen leaf. A small brown-black weevil can be seen on the leaves and drops when touched. Worst in ' +
          'nurseries and young plants, where the entire new growth is destroyed.',
        organic: [
          'नीचे गिरी कटी पत्तियाँ रोज़ बीनकर जला दें — इसी में अंडे और ग्रब होते हैं',
          'यही सबसे असरदार उपाय है; बिना दवा के भी संख्या बहुत घट जाती है',
          'नीम तेल 5 मि.ली. प्रति लीटर पानी, नई कोंपल आते ही',
          'थाले की मिट्टी गोड़ें/पलटें',
          'सुबह पेड़ हिलाकर गिरे घुन इकट्ठा करके नष्ट करें',
        ],
        chemical: [
          'क्विनालफॉस 25 EC — लगभग 2 मि.ली. प्रति लीटर पानी',
          'विकल्प: लैम्ब्डा-साइहेलोथ्रिन 5 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'छिड़काव सिर्फ नई कोंपल निकलते समय — तभी नुकसान होता है',
          '15 दिन के अंतर पर ज़रूरत हो तो दूसरा छिड़काव',
        ],
        prevention: [
          'नई कोंपल के समय हर हफ्ते पेड़ के नीचे देखें — कटी पत्तियाँ पहली चेतावनी हैं',
          'बगीचे की सफाई; गिरी पत्तियाँ जमा न होने दें',
          'सर्दी में थाले की गहरी गुड़ाई',
          'नर्सरी के पौधों की खास निगरानी',
        ],
        speech:
          'पहचाना गया है कटुआ घुन, जिसे कटिंग वीविल कहते हैं। ' +
          'इसकी पहचान बहुत आसान है — पेड़ के नीचे ताज़ी हरी पत्तियाँ कटी हुई गिरी मिलती हैं, जैसे किसी ने कैंची से काट दी हों। ' +
          'दरअसल मादा घुन पत्ती में अंडा देकर उसे डंठल के पास से काट देती है, ताकि गिरी पत्ती में उसका बच्चा पल सके। ' +
          'इसीलिए सबसे असरदार उपाय यह है कि नीचे गिरी कटी पत्तियाँ रोज़ बीनकर जला दीजिए — इन्हीं में अंडे और बच्चे होते हैं। ' +
          'सिर्फ इतना करने से ही संख्या बहुत घट जाती है। ' +
          'ज़्यादा प्रकोप हो तो क्विनालफॉस लगभग दो मिलीलीटर प्रति लीटर पानी का छिड़काव करें, वो भी सिर्फ नई कोंपल निकलते समय। ' +
          'थाले की मिट्टी गोड़ दीजिए, इससे अंदर छिपे प्यूपा मर जाते हैं। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Mango_Healthy: {
        nameHi: 'स्वस्थ आम',
        nameEn: 'Healthy Mango',
        pathogen: 'कोई रोग नहीं मिला / No disease detected',
        severity: 'none', severityHi: 'सब ठीक है',
        risk: 'ok', riskHi: 'स्वस्थ / Healthy',
        actions: [
          'कोई दवा न छिड़कें — अभी ज़रूरत नहीं है',
          'कटाई के बाद छँटाई और बगीचे की सफाई करें',
          'बौर आने से पहले एक बचाव छिड़काव की योजना बनाएँ',
          '10–15 दिन बाद फिर से जाँचें',
        ],
        symptoms:
          'बहुत बढ़िया! इस पत्ती में किसी रोग या कीट के लक्षण नहीं मिले। पत्ती का रंग एक-सा गहरा हरा है, ' +
          'न काले धब्बे, न सफेद पाउडर, न काली परत और न ही गाँठें। आपके बगीचे का प्रबंधन अच्छा चल रहा है।',
        symptomsEn:
          'No disease or pest symptoms detected — uniform deep green colour, no black spots, no powdery coating, ' +
          'no sooty layer and no galls. Keep up the current orchard management.',
        organic: [
          'हर साल कटाई के बाद छँटाई — सूखी, रोगग्रस्त और आपस में रगड़ खाती टहनियाँ हटाएँ',
          'थाले में गोबर की खाद + ट्राइकोडर्मा डालें',
          'तने पर बोर्डो पेंट (जमीन से 1 मीटर तक) साल में एक बार',
          'बगीचे की सफाई — गिरे पत्ते, फल और टहनियाँ हटाएँ',
          'बिना ज़रूरत छिड़काव न करें — मधुमक्खी और मित्र कीट बचे रहेंगे',
        ],
        chemical: [
          'अभी किसी दवा की ज़रूरत नहीं है',
          'मिट्टी जाँच के अनुसार ही NPK, ज़िंक और बोरॉन दें',
        ],
        prevention: [
          'गर्मी में सिंचाई न रोकें — प्यासा पेड़ ही बीमार पड़ता है',
          'बौर आने से पहले एक बचाव छिड़काव (सल्फर या कॉपर)',
          'फूल खिलते समय कोई कीटनाशक न डालें — मधुमक्खी से ही फल बनता है',
          'हर हफ्ते बगीचा घूमकर नई कोंपल और बौर जाँचें',
          'फल तोड़ते समय डंठल 1 सें.मी. रखें, चोट न लगने दें',
        ],
        speech:
          'बहुत बढ़िया! इस पत्ती में किसी रोग या कीट के लक्षण नहीं मिले। आपका आम का पेड़ स्वस्थ लग रहा है। ' +
          'इसे ऐसे ही बनाए रखने के लिए, अभी कोई दवा मत छिड़कें, क्योंकि उसकी ज़रूरत नहीं है। ' +
          'कटाई के बाद छँटाई ज़रूर कीजिए — सूखी और आपस में रगड़ खाती टहनियाँ हटा दीजिए, ताकि हवा और धूप अंदर तक पहुँचे। ' +
          'तने पर ज़मीन से एक मीटर तक बोर्डो पेंट साल में एक बार लगाइए। ' +
          'गर्मी में सिंचाई मत रोकिए, क्योंकि प्यासा पेड़ ही जल्दी बीमार पड़ता है। ' +
          'बौर आने से पहले एक बचाव छिड़काव की योजना बना लीजिए। ' +
          'और एक ज़रूरी बात — जब फूल पूरे खिले हों तब कोई कीटनाशक मत डालिए, क्योंकि मधुमक्खी से ही फल बनता है। ' +
          'दस से पंद्रह दिन बाद इस ऐप से दोबारा जाँच कर लीजिए।',
      },
    },
  },

  /* ##################### 10. APPLE / सेब ##################### */
  /* Model: Teachable Machine (TFJS) — models/apple/model.json
     Seb pahadi bagwani ki fasal hai (HP, J&K, Uttarakhand) — isliye salah me
     chhataai, bagiche ki safai aur pati-girne ke baad wala chhidkav zaroori hai. */
  apple: {
    id: 'apple',
    nameHi: 'सेब',
    nameEn: 'Apple',
    altHi: 'सेब का पेड़',
    icon: 'crop-apple',
    seasonHi: 'बागवानी (पहाड़ी क्षेत्र)',
    photoHintHi: 'सेब की पत्ती या रोगग्रस्त फल की साफ फोटो अपलोड करें',
    photoHintKey: 'ui.hint.apple',
    labels: [
      'Apple_Alternaria_Leaf_Spot',  // 0
      'Apple_Brown_Spot',           // 1
      'Apple_Frogeye_Leaf_Spot',    // 2
      'Apple_Grey_Spot',            // 3
      'Apple_Healthy',              // 4
      'Apple_Mosaic',               // 5
      'Apple_Powdery_Mildew',       // 6
      'Apple_Rust',                 // 7
      'Apple_Scab',                 // 8
    ],
    classes: {

      /* ------------------------------------------------------------------ */
      Apple_Scab: {
        nameHi: 'स्कैब (खुरंट / चित्ती रोग)',
        nameEn: 'Apple Scab',
        pathogen: 'कवक / Fungus — Venturia inaequalis',
        severity: 'high', severityHi: 'बहुत ज़्यादा नुकसान',
        risk: 'high', riskHi: 'बहुत ज़्यादा जोखिम / Very High Risk',
        actions: [
          'मैंकोजेब ~2.5 ग्राम/लीटर या डोडीन ~0.75 ग्राम/लीटर छिड़कें',
          'बारिश के बाद 24–48 घंटे के अंदर छिड़काव करें',
          'पतझड़ में गिरी पत्तियाँ इकट्ठा करके जलाएँ — यहीं से अगले साल आता है',
          'हरी नोक (green tip) अवस्था से छिड़काव शुरू करें',
        ],
        symptoms:
          'यह सेब का सबसे विनाशकारी रोग है। पत्ती पर पहले जैतून-हरे (olive green), मखमली से धब्बे बनते हैं ' +
          'जिनके किनारे धुँधले होते हैं — जैसे धब्बा पत्ती में घुल रहा हो। बाद में ये काले-भूरे और खुरदरे हो जाते हैं। ' +
          'फल पर काले-भूरे, खुरदरे, पपड़ीदार (खुरंट जैसे) धब्बे बनते हैं जो बाद में फट जाते हैं और फल टेढ़ा हो जाता है। ' +
          'ऐसे फल का मंडी में भाव लगभग खत्म हो जाता है। ' +
          'लंबी बारिश, ठंडा मौसम और पत्ती का देर तक गीला रहना — यही इसे भड़काते हैं। ' +
          'कवक गिरी हुई पत्तियों में सर्दी काटता है और वसंत में बीजाणु उड़कर नई पत्तियों पर आते हैं।',
        symptomsEn:
          'The most destructive apple disease. Olive-green velvety spots with feathery, indistinct margins appear on ' +
          'leaves, later turning black-brown and rough. On fruit, black-brown scabby corky lesions crack and deform ' +
          'the apple, destroying its market value. Driven by prolonged rain, cool weather and long leaf wetness. The ' +
          'fungus overwinters in fallen leaves and releases spores in spring.',
        organic: [
          'पतझड़ में गिरी सारी पत्तियाँ इकट्ठा करके जला दें या गहरा गाड़ दें — यही सबसे बड़ा उपाय है',
          'गिरी पत्तियों पर 5% यूरिया का छिड़काव — पत्तियाँ जल्दी गलती हैं और बीजाणु नहीं बनते',
          'छँटाई करके पेड़ के बीच हवा और धूप जाने दें — पत्ती जल्दी सूखेगी',
          'रोग-रोधी किस्में लगाएँ',
          'ऊपर से (sprinkler) सिंचाई न करें, थाले में दें',
        ],
        chemical: [
          'मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'विकल्प: डोडीन 65 WP — लगभग 0.75 ग्राम प्रति लीटर पानी',
          'विकल्प: कार्बेन्डाजिम 50 WP — लगभग 0.5 ग्राम प्रति लीटर पानी',
          'बारिश के बाद 24–48 घंटे के अंदर छिड़काव सबसे असरदार; दवा बदल-बदल कर दें',
        ],
        prevention: [
          'पतझड़ की पत्तियाँ हर साल हटाएँ — यह अकेला काम आधा रोग रोक देता है',
          'हरी नोक (green tip), गुलाबी कली (pink bud) और पंखुड़ी गिरने के बाद — तय छिड़काव कार्यक्रम',
          'रोग-रोधी किस्में और सही दूरी पर रोपाई',
          'हर साल छँटाई; घना पेड़ नमी रोकता है',
          'बगीचे में जल-निकासी ठीक रखें',
        ],
        speech:
          'पहचाना गया रोग है स्कैब, जिसे खुरंट या चित्ती रोग भी कहते हैं। यह सेब का सबसे विनाशकारी रोग है। ' +
          'पत्ती पर जैतून जैसे हरे, मखमली धब्बे बनते हैं जिनके किनारे धुँधले होते हैं, और बाद में ये काले-भूरे व खुरदरे हो जाते हैं। ' +
          'फल पर खुरदरे पपड़ीदार धब्बे बनते हैं जो फट जाते हैं और फल टेढ़ा हो जाता है, जिससे मंडी में भाव लगभग खत्म हो जाता है। ' +
          'उपचार के लिए मैंकोजेब लगभग ढाई ग्राम प्रति लीटर पानी, या डोडीन लगभग शून्य दशमलव सात पाँच ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'सबसे ज़रूरी बात — बारिश के बाद चौबीस से अड़तालीस घंटे के अंदर छिड़काव कीजिए, तभी सबसे ज़्यादा असर होता है। ' +
          'और एक काम ज़रूर कीजिए — पतझड़ में गिरी सारी पत्तियाँ इकट्ठा करके जला दीजिए, क्योंकि यह कवक उन्हीं में सर्दी काटता है और अगले साल वहीं से फैलता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Apple_Powdery_Mildew: {
        nameHi: 'चूर्णिल आसिता (सफेद पाउडर)',
        nameEn: 'Powdery Mildew',
        pathogen: 'कवक / Fungus — Podosphaera leucotricha',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'घुलनशील सल्फर ~2 ग्राम/लीटर या हेक्साकोनाज़ोल ~1 मि.ली./लीटर',
          'सफेद परत वाली कोंपलें काटकर जला दें',
          '10–15 दिन के अंतर पर 2–3 छिड़काव',
          'सर्दी की छँटाई में ग्रस्त कलियाँ हटा दें',
        ],
        symptoms:
          'नई पत्तियों, कोंपलों और कलियों पर सफेद, आटे जैसी पाउडर की परत जम जाती है — दोनों सतहों पर। ' +
          'ग्रस्त पत्तियाँ लंबी-सँकरी होकर किनारों से ऊपर की ओर मुड़ जाती हैं (नाव जैसी) और भुरभुरी हो जाती हैं। ' +
          'कोंपल की बढ़वार रुक जाती है और वह सफेद-चाँदी जैसी दिखती है। ' +
          'फूल ग्रस्त हों तो वे फल नहीं बनाते। फल पर जाल जैसे भूरे निशान (russeting) पड़ जाते हैं, जिससे भाव गिरता है। ' +
          'यह कवक कली के अंदर सर्दी काटता है — इसलिए सर्दी की छँटाई में ग्रस्त कलियाँ हटाना बहुत असरदार है। ' +
          'स्कैब के उलट, इसे फैलने के लिए बारिश की ज़रूरत नहीं — सूखे-गर्म मौसम में भी फैलता है।',
        symptomsEn:
          'White flour-like powdery coating on both surfaces of young leaves, shoots and buds. Affected leaves become ' +
          'narrow, curl upward at the margins and turn brittle; shoots stop growing and look silvery-white. Infected ' +
          'blossoms set no fruit, and fruits develop a brown net-like russeting that lowers the price. The fungus ' +
          'overwinters inside buds, so removing infected buds during winter pruning is very effective. Unlike scab, ' +
          'it does not need rain to spread.',
        organic: [
          'सर्दी की छँटाई में सफेद, सिकुड़ी हुई कलियाँ और कोंपलें काटकर जला दें',
          'घुलनशील सल्फर 80 WP — लगभग 2 ग्राम प्रति लीटर पानी (तेज़ धूप/गर्मी में न छिड़कें)',
          'नीम तेल 3% (30 मि.ली. प्रति लीटर पानी)',
          'बगीचे में हवा चले — घनी शाखाएँ छाँटें',
          'नाइट्रोजन ज़्यादा न दें — मुलायम कोंपलों पर यह ज़्यादा लगता है',
        ],
        chemical: [
          'हेक्साकोनाज़ोल 5 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: डाइनोकैप 48 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'विकल्प: माइक्लोब्यूटानिल 10 WP — लगभग 0.4 ग्राम प्रति लीटर पानी',
          'गुलाबी कली अवस्था से शुरू, 10–15 दिन के अंतर पर 2–3 छिड़काव',
        ],
        prevention: [
          'हर साल सर्दी की छँटाई में ग्रस्त कलियाँ निकालें — यही सबसे सस्ता बचाव है',
          'रोग-रोधी किस्में; सही दूरी पर रोपाई',
          'संतुलित खाद, नाइट्रोजन नियंत्रित',
          'वसंत में हर हफ्ते नई कोंपलें जाँचें',
        ],
        speech:
          'पहचाना गया रोग है चूर्णिल आसिता, यानी सफेद पाउडर रोग। ' +
          'नई पत्तियों, कोंपलों और कलियों पर आटे जैसी सफेद परत जम जाती है, और पत्तियाँ लंबी-सँकरी होकर किनारों से ऊपर मुड़ जाती हैं। ' +
          'ग्रस्त कोंपल की बढ़वार रुक जाती है और वह सफेद-चाँदी जैसी दिखती है। फल पर जाल जैसे भूरे निशान पड़ जाते हैं जिससे भाव गिरता है। ' +
          'उपचार के लिए घुलनशील सल्फर लगभग दो ग्राम प्रति लीटर पानी, या हेक्साकोनाज़ोल लगभग एक मिलीलीटर प्रति लीटर पानी का छिड़काव करें। ' +
          'दस से पंद्रह दिन के अंतर पर दो-तीन छिड़काव कीजिए। ' +
          'एक बहुत असरदार बात — यह कवक कली के अंदर सर्दी काटता है, इसलिए सर्दी की छँटाई में सफेद और सिकुड़ी हुई कलियाँ काटकर जला दीजिए। ' +
          'ध्यान रखिए, स्कैब के उलट इसे फैलने के लिए बारिश की ज़रूरत नहीं, यह सूखे मौसम में भी फैलता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Apple_Rust: {
        nameHi: 'रतुआ (गेरुई)',
        nameEn: 'Apple Rust',
        pathogen: 'कवक / Fungus — Gymnosporangium spp. (सेब + चीड़/जुनिपर दोनों चाहिए)',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'बगीचे के पास के जुनिपर/चीड़ के पेड़ों की गाँठें हटाएँ',
          'मैंकोजेब ~2.5 ग्राम/लीटर या माइक्लोब्यूटानिल ~0.4 ग्राम/लीटर',
          'पंखुड़ी गिरने के बाद छिड़काव शुरू करें',
          'बारिश के बाद छिड़काव दोहराएँ',
        ],
        symptoms:
          'पत्ती की ऊपरी सतह पर चमकीले नारंगी-पीले गोल धब्बे बनते हैं, जिनके बीच में छोटे काले बिंदु होते हैं — ' +
          'यह धब्बा दूर से ही चमकता हुआ दिखता है, यही पक्की पहचान है। ' +
          'बाद में पत्ती की निचली सतह पर उसी जगह छोटे-छोटे रोएँदार, नली जैसे उभार निकल आते हैं। ' +
          'ज़्यादा प्रकोप में पत्तियाँ पीली होकर समय से पहले गिर जाती हैं, जिससे पेड़ कमज़ोर पड़ता है और अगले साल फल कम आते हैं। ' +
          'फल पर भी नारंगी धब्बे और विकृति आ सकती है। ' +
          'खास बात: यह कवक अकेले सेब पर पूरा नहीं होता — इसे पास में जुनिपर/चीड़ का पेड़ भी चाहिए, ' +
          'जहाँ यह गाँठ (gall) बनाकर सर्दी काटता है।',
        symptomsEn:
          'Bright orange-yellow round spots with tiny black dots on the upper leaf surface — they almost glow, the key ' +
          'sign. Later, small tube-like hairy outgrowths appear underneath at the same spots. Heavy infection yellows ' +
          'and drops leaves early, weakening the tree and reducing next year’s crop. Fruit may show orange spots and ' +
          'deformity. Note: the fungus needs a nearby juniper/cedar host, where it overwinters as galls.',
        organic: [
          'बगीचे के 300–500 मीटर के भीतर जुनिपर/चीड़ की गाँठें (galls) काटकर जला दें — यही असली जड़ है',
          'हो सके तो बगीचे के पास जुनिपर लगाएँ ही नहीं',
          'रोग-रोधी किस्में लगाएँ',
          'गिरी पत्तियाँ इकट्ठा करके नष्ट करें',
          'छँटाई करके हवा का आना-जाना बनाएँ',
        ],
        chemical: [
          'मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'विकल्प: माइक्लोब्यूटानिल 10 WP — लगभग 0.4 ग्राम प्रति लीटर पानी',
          'विकल्प: प्रोपिकोनाज़ोल 25 EC — लगभग 1 मि.ली. प्रति लीटर पानी',
          'पंखुड़ी गिरने के बाद पहला छिड़काव, फिर 12–15 दिन के अंतर पर 2 और',
        ],
        prevention: [
          'बगीचे के आसपास जुनिपर/चीड़ न रखें — बिना उनके यह रोग चल ही नहीं सकता',
          'रोग-रोधी किस्में',
          'वसंत में बारिश के बाद बगीचा जाँचें',
          'संतुलित खाद और सिंचाई से पेड़ मज़बूत रखें',
        ],
        speech:
          'पहचाना गया रोग है रतुआ, जिसे गेरुई भी कहते हैं। ' +
          'पत्ती की ऊपरी सतह पर चमकीले नारंगी-पीले गोल धब्बे बनते हैं जिनके बीच में छोटे काले बिंदु होते हैं। ये धब्बे दूर से ही चमकते हुए दिखते हैं। ' +
          'बाद में पत्ती की निचली सतह पर उसी जगह रोएँदार नली जैसे उभार निकल आते हैं, और ज़्यादा प्रकोप में पत्तियाँ समय से पहले गिर जाती हैं। ' +
          'एक बहुत खास बात समझिए — यह कवक अकेले सेब पर पूरा नहीं होता। इसे पास में जुनिपर या चीड़ का पेड़ भी चाहिए, जहाँ यह गाँठ बनाकर सर्दी काटता है। ' +
          'इसलिए सबसे असरदार उपाय यह है कि बगीचे के आसपास जुनिपर या चीड़ के पेड़ों पर बनी गाँठें काटकर जला दीजिए। ' +
          'दवा के लिए मैंकोजेब लगभग ढाई ग्राम प्रति लीटर पानी का छिड़काव करें, पंखुड़ी गिरने के बाद से शुरू करके। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Apple_Alternaria_Leaf_Spot: {
        nameHi: 'अल्टरनेरिया पत्ती धब्बा',
        nameEn: 'Alternaria Leaf Spot',
        pathogen: 'कवक / Fungus — Alternaria mali / A. alternata',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'मैंकोजेब ~2.5 ग्राम/लीटर पानी छिड़कें',
          'रोगग्रस्त और गिरी पत्तियाँ हटाकर जलाएँ',
          'पेड़ को पानी और खाद पूरी दें — कमज़ोर पेड़ पर ज़्यादा लगता है',
          '12–15 दिन के अंतर पर दोहराएँ',
        ],
        symptoms:
          'पत्ती पर छोटे गोल भूरे धब्बे बनते हैं जिनके चारों ओर बैंगनी-लाल घेरा होता है। ' +
          'धब्बे बड़े होकर उनमें गहरे रंग के छल्ले (concentric rings) दिखने लगते हैं — निशाना (target) जैसा — यही पहचान है। ' +
          'बीच का हिस्सा सूखकर गिर सकता है। ज़्यादा प्रकोप में पत्तियाँ पीली होकर समय से पहले झड़ जाती हैं, ' +
          'जिससे पेड़ कमज़ोर होता है और अगले साल की फसल घट जाती है। ' +
          'फल पर भी छोटे धँसे काले धब्बे बन सकते हैं। ' +
          'गर्म, नम मौसम और कमज़ोर/प्यासे पेड़ इसे बढ़ाते हैं।',
        symptomsEn:
          'Small round brown spots with a purple-red border. As they enlarge, dark concentric rings appear giving a ' +
          'target-like look — the key sign. Centres may drop out. Heavy infection yellows and sheds leaves early, ' +
          'weakening the tree and cutting next season’s crop. Fruit can show small sunken black spots. Favoured by ' +
          'warm humid weather and by stressed, under-watered trees.',
        organic: [
          'रोगग्रस्त और गिरी पत्तियाँ इकट्ठा करके जला दें',
          'ट्राइकोडर्मा मिली गोबर खाद थाले में डालें',
          'छँटाई से हवा और धूप का रास्ता बनाएँ',
          'सिंचाई और खाद नियमित — तनाव में आया पेड़ जल्दी पकड़ता है',
          'ऊपर से सिंचाई न करें',
        ],
        chemical: [
          'मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'विकल्प: कॉपर ऑक्सीक्लोराइड 50 WP — लगभग 3 ग्राम प्रति लीटर पानी',
          'विकल्प: कार्बेन्डाजिम 50 WP — लगभग 0.5 ग्राम प्रति लीटर पानी',
          '12–15 दिन के अंतर पर 2–3 छिड़काव',
        ],
        prevention: [
          'बगीचे की सफाई और हर साल छँटाई',
          'संतुलित खाद — पोटाश और सूक्ष्म तत्व पूरे',
          'सूखे में सिंचाई न रोकें',
          'जल-निकासी ठीक रखें',
        ],
        speech:
          'पहचाना गया रोग है अल्टरनेरिया पत्ती धब्बा। ' +
          'पत्ती पर छोटे गोल भूरे धब्बे बनते हैं जिनके चारों ओर बैंगनी-लाल घेरा होता है। ' +
          'धब्बे बड़े होने पर उनमें गहरे छल्ले दिखने लगते हैं, जैसे निशाना बना हो — यही इसकी पक्की पहचान है। ' +
          'ज़्यादा प्रकोप में पत्तियाँ समय से पहले झड़ जाती हैं, जिससे पेड़ कमज़ोर होता है और अगले साल फल कम आते हैं। ' +
          'उपचार के लिए मैंकोजेब लगभग ढाई ग्राम प्रति लीटर पानी का छिड़काव करें, और बारह से पंद्रह दिन बाद दोहराएँ। ' +
          'रोगग्रस्त और गिरी हुई पत्तियाँ हटाकर जला दीजिए। ' +
          'एक ज़रूरी बात — यह रोग कमज़ोर और प्यासे पेड़ों पर ज़्यादा लगता है, इसलिए सिंचाई और खाद पूरी दीजिए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Apple_Frogeye_Leaf_Spot: {
        nameHi: 'फ्रॉग-आई धब्बा (मेंढक-आँख)',
        nameEn: 'Frogeye Leaf Spot',
        pathogen: 'कवक / Fungus — Botryosphaeria obtusa (यही black rot भी करता है)',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'सूखी/मरी हुई टहनियाँ और ममी फल (सूखे लटके फल) हटाकर जलाएँ',
          'कैप्टान ~2 ग्राम/लीटर या मैंकोजेब ~2.5 ग्राम/लीटर',
          'तने-टहनी के कैंकर वाले हिस्से काटकर बोर्डो पेस्ट लगाएँ',
          'पंखुड़ी गिरने के बाद छिड़काव शुरू करें',
        ],
        symptoms:
          'पत्ती पर गोल धब्बे बनते हैं जिनका बीच का हिस्सा हल्का भूरा-राख जैसा और किनारा गहरा बैंगनी-भूरा होता है — ' +
          'बिल्कुल मेंढक की आँख जैसा दिखता है, इसीलिए इसे फ्रॉग-आई कहते हैं। यही पक्की पहचान है। ' +
          'धब्बे का बीच सूखकर भुरभुरा हो जाता है पर आमतौर पर गिरता नहीं (अल्टरनेरिया में गिर सकता है)। ' +
          'यही कवक फल पर काली सड़न (black rot) करता है — फल पर भूरा धब्बा बनकर उसमें गहरे छल्ले दिखते हैं और फल ' +
          'सूखकर पेड़ पर ही लटका रह जाता है (ममी फल)। ' +
          'टहनियों पर धँसे हुए कैंकर बनते हैं जहाँ से कवक हर साल फैलता है — इसलिए सिर्फ पत्ती की दवा काफी नहीं।',
        symptomsEn:
          'Round leaf spots with a light tan-grey centre and a dark purple-brown margin, looking like a frog’s eye — ' +
          'the key sign. The centre dries but usually does not drop out. The same fungus causes black rot on fruit: a ' +
          'brown lesion with dark concentric rings, and the fruit dries and hangs on the tree as a mummy. Sunken ' +
          'cankers on branches are the yearly source, so spraying leaves alone is not enough.',
        organic: [
          'सूखी, मरी हुई टहनियाँ और ममी फल हटाकर जला दें — यही असली जड़ है',
          'कैंकर वाला हिस्सा स्वस्थ लकड़ी तक काटकर बोर्डो पेस्ट लगाएँ',
          'हर कट के बाद औज़ार साफ करें',
          'गिरी पत्तियाँ और फल बगीचे से बाहर करें',
          'छँटाई से हवा-धूप का रास्ता बनाएँ',
        ],
        chemical: [
          'कैप्टान 50 WP — लगभग 2 ग्राम प्रति लीटर पानी',
          'विकल्प: मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'विकल्प: थायोफेनेट-मिथाइल 70 WP — लगभग 1 ग्राम प्रति लीटर पानी',
          'पंखुड़ी गिरने के बाद से 12–15 दिन के अंतर पर छिड़काव',
        ],
        prevention: [
          'हर साल छँटाई में मरी हुई लकड़ी पूरी तरह निकालें',
          'पेड़ पर एक भी ममी फल न छोड़ें',
          'चोट और ओले के घावों पर तुरंत पेस्ट लगाएँ',
          'संतुलित खाद और सिंचाई — कमज़ोर पेड़ जल्दी पकड़ता है',
        ],
        speech:
          'पहचाना गया रोग है फ्रॉग-आई धब्बा, यानी मेंढक-आँख जैसा धब्बा। ' +
          'पत्ती पर गोल धब्बे बनते हैं जिनका बीच हल्का भूरा-राख जैसा और किनारा गहरा बैंगनी-भूरा होता है — बिल्कुल मेंढक की आँख जैसा। ' +
          'ध्यान रखिए, यही कवक फल पर काली सड़न भी करता है, जिससे फल सूखकर पेड़ पर ही लटका रह जाता है। इन्हें ममी फल कहते हैं। ' +
          'सबसे ज़रूरी काम यह है कि सूखी मरी हुई टहनियाँ और सारे ममी फल हटाकर जला दीजिए, क्योंकि कवक हर साल वहीं से फैलता है। ' +
          'टहनी पर कैंकर हो तो उसे स्वस्थ लकड़ी तक काटकर बोर्डो पेस्ट लगाइए। ' +
          'दवा के लिए कैप्टान लगभग दो ग्राम, या मैंकोजेब लगभग ढाई ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'सिर्फ पत्तियों पर दवा छिड़कना काफी नहीं है, लकड़ी की सफाई ज़रूरी है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Apple_Grey_Spot: {
        nameHi: 'धूसर धब्बा (ग्रे स्पॉट)',
        nameEn: 'Grey Spot',
        pathogen: 'कवक / Fungus — Phyllosticta / Mycosphaerella spp.',
        severity: 'medium', severityHi: 'मध्यम नुकसान',
        risk: 'medium', riskHi: 'मध्यम जोखिम / Medium Risk',
        actions: [
          'मैंकोजेब ~2.5 ग्राम/लीटर पानी छिड़कें',
          'गिरी और रोगग्रस्त पत्तियाँ हटाकर जलाएँ',
          'छँटाई करके पेड़ में हवा-धूप जाने दें',
          '12–15 दिन के अंतर पर दोहराएँ',
        ],
        symptoms:
          'पत्ती पर गोल से अनियमित धब्बे बनते हैं जिनका बीच का हिस्सा राख जैसा धूसर-सफेद होता है और ' +
          'किनारा भूरा या गहरा होता है। ' +
          'धब्बे के धूसर बीच में बहुत छोटे काले बिंदु (pycnidia) दिखते हैं — लेंस या पानी की बूँद से साफ नज़र आते हैं, ' +
          'यही इसे दूसरे धब्बा रोगों से अलग करता है। ' +
          'धब्बे मिलकर बड़े हो जाते हैं, पत्ती पीली पड़कर समय से पहले गिर जाती है। ' +
          'ज़्यादा पत्तियाँ गिरने से पेड़ कमज़ोर होता है, फल छोटे रह जाते हैं और अगले साल की कलियाँ कम बनती हैं। ' +
          'नम, गर्म मौसम और घना बगीचा इसे बढ़ाते हैं।',
        symptomsEn:
          'Round to irregular spots with an ashy grey-white centre and a brown or dark margin. Tiny black dots ' +
          '(pycnidia) are visible in the grey centre under a lens or a water drop — this separates it from other leaf ' +
          'spots. Spots merge, leaves yellow and drop early, weakening the tree, shrinking fruit and reducing next ' +
          'year’s buds. Favoured by warm humid weather and dense canopies.',
        organic: [
          'गिरी पत्तियाँ इकट्ठा करके जला दें या गहरा गाड़ दें',
          'छँटाई करके घनापन कम करें — पत्ती जल्दी सूखेगी',
          'ऊपर से सिंचाई न करें, थाले में दें',
          'ट्राइकोडर्मा मिली खाद थाले में डालें',
          'बगीचे में जल-निकासी ठीक रखें',
        ],
        chemical: [
          'मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'विकल्प: कॉपर ऑक्सीक्लोराइड 50 WP — लगभग 3 ग्राम प्रति लीटर पानी',
          'विकल्प: कार्बेन्डाजिम 50 WP — लगभग 0.5 ग्राम प्रति लीटर पानी',
          '12–15 दिन के अंतर पर 2–3 छिड़काव; दवा बदलते रहें',
        ],
        prevention: [
          'हर साल छँटाई और बगीचे की सफाई',
          'पतझड़ की पत्तियाँ हटाना न भूलें',
          'संतुलित खाद और नियमित सिंचाई',
          'बरसात के मौसम में हर हफ्ते पत्तियाँ जाँचें',
        ],
        speech:
          'पहचाना गया रोग है धूसर धब्बा, जिसे ग्रे स्पॉट कहते हैं। ' +
          'पत्ती पर ऐसे धब्बे बनते हैं जिनका बीच राख जैसा धूसर-सफेद और किनारा भूरा होता है। ' +
          'धब्बे के धूसर बीच में बहुत छोटे काले बिंदु दिखते हैं — पानी की बूँद डालकर देखिए, साफ नज़र आएँगे। यही इसे दूसरे धब्बा रोगों से अलग करता है। ' +
          'ज़्यादा प्रकोप में पत्तियाँ समय से पहले गिर जाती हैं, जिससे पेड़ कमज़ोर होता है और फल छोटे रह जाते हैं। ' +
          'उपचार के लिए मैंकोजेब लगभग ढाई ग्राम प्रति लीटर पानी का छिड़काव करें, और बारह से पंद्रह दिन बाद दोहराएँ। ' +
          'गिरी हुई और रोगग्रस्त पत्तियाँ हटाकर जला दीजिए, और छँटाई करके पेड़ में हवा-धूप का रास्ता बनाइए। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Apple_Brown_Spot: {
        nameHi: 'भूरा धब्बा',
        nameEn: 'Brown Spot',
        pathogen: 'कवक / Fungus — Marssonina coronaria (भूरा पत्ती धब्बा)',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'मैंकोजेब ~2.5 ग्राम/लीटर या कैप्टान ~2 ग्राम/लीटर छिड़कें',
          'गिरी पत्तियाँ हर हाल में हटाकर जलाएँ',
          'बरसात शुरू होते ही छिड़काव कार्यक्रम शुरू करें',
          'बारिश के बाद छिड़काव दोहराएँ',
        ],
        symptoms:
          'पत्ती पर गहरे भूरे, गोल धब्बे बनते हैं जिनके किनारे बिखरे-से (धुँधले) होते हैं। ' +
          'धब्बों के आसपास पत्ती चमकीली पीली पड़ जाती है, और धीरे-धीरे पूरी पत्ती पीली होकर गिर जाती है। ' +
          'सबसे बड़ा नुकसान यही है — जुलाई-अगस्त की बारिश के बाद पेड़ की ज़्यादातर पत्तियाँ झड़ जाती हैं ' +
          '(premature defoliation)। नंगा पेड़ भोजन नहीं बना पाता, फल छोटे और बेस्वाद रह जाते हैं, ' +
          'और अगले साल की फसल बहुत घट जाती है। ' +
          'यह हिमाचल और उत्तराखंड के बगीचों में बरसात के बाद सबसे बड़ी समस्या है। ' +
          'कवक गिरी हुई पत्तियों में सर्दी काटता है।',
        symptomsEn:
          'Dark brown round spots with diffuse margins; the surrounding leaf turns bright yellow and the whole leaf ' +
          'eventually drops. The big damage is premature defoliation after the monsoon — a bare tree cannot feed ' +
          'itself, fruits stay small and tasteless, and next year’s crop falls sharply. A major post-monsoon problem ' +
          'in Himachal and Uttarakhand orchards. The fungus overwinters in fallen leaves.',
        organic: [
          'गिरी हुई पत्तियाँ पूरी तरह इकट्ठा करके जला दें या गहरा गाड़ दें — यही सबसे बड़ा उपाय है',
          'गिरी पत्तियों पर 5% यूरिया छिड़कें ताकि वे जल्दी गल जाएँ',
          'छँटाई से हवा और धूप का रास्ता बनाएँ',
          'ऊपर से सिंचाई बिल्कुल न करें',
          'बगीचे में जल-निकासी ठीक रखें',
        ],
        chemical: [
          'मैंकोजेब 75 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'विकल्प: कैप्टान 50 WP — लगभग 2 ग्राम प्रति लीटर पानी',
          'विकल्प: प्रोपिनेब 70 WP — लगभग 2.5 ग्राम प्रति लीटर पानी',
          'बरसात शुरू होते ही पहला छिड़काव; 15 दिन के अंतर पर 3–4 छिड़काव',
        ],
        prevention: [
          'पतझड़ की पत्तियाँ हर साल हटाएँ — अगले साल का रोग यहीं से आता है',
          'बरसात से पहले बचाव छिड़काव का कार्यक्रम बनाएँ',
          'रोग-रोधी किस्में; सही दूरी पर रोपाई',
          'संतुलित खाद — पोटाश पूरा दें',
          'हर हफ्ते बगीचा जाँचें, खासकर बारिश के बाद',
        ],
        speech:
          'पहचाना गया रोग है भूरा धब्बा। ' +
          'पत्ती पर गहरे भूरे गोल धब्बे बनते हैं जिनके किनारे धुँधले होते हैं, और धब्बों के आसपास पत्ती चमकीली पीली पड़ जाती है। ' +
          'सबसे बड़ा नुकसान यह है कि बरसात के बाद पेड़ की ज़्यादातर पत्तियाँ झड़ जाती हैं। ' +
          'नंगा पेड़ भोजन नहीं बना पाता, फल छोटे और बेस्वाद रह जाते हैं, और अगले साल की फसल बहुत घट जाती है। ' +
          'हिमाचल और उत्तराखंड के बगीचों में बरसात के बाद यह सबसे बड़ी समस्या है। ' +
          'उपचार के लिए मैंकोजेब लगभग ढाई ग्राम, या कैप्टान लगभग दो ग्राम प्रति लीटर पानी का छिड़काव करें। ' +
          'बरसात शुरू होते ही पहला छिड़काव कीजिए और पंद्रह दिन के अंतर पर तीन-चार बार दोहराइए। ' +
          'और सबसे ज़रूरी — गिरी हुई पत्तियाँ हर हाल में इकट्ठा करके जला दीजिए, क्योंकि यह कवक उन्हीं में सर्दी काटता है। ' +
          'मात्रा और दवा की पुष्टि अपने कृषि विज्ञान केंद्र से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Apple_Mosaic: {
        nameHi: 'मोज़ेक (चितकबरा विषाणु)',
        nameEn: 'Apple Mosaic Virus',
        pathogen: 'विषाणु / Virus — Apple mosaic virus (ApMV) — कोई दवा नहीं',
        severity: 'high', severityHi: 'ज़्यादा नुकसान',
        risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
        actions: [
          'ज़रूरी: विषाणु रोग है, किसी भी दवा या फफूंदनाशी से ठीक नहीं होगा',
          'ग्रस्त पेड़ से कलम (scion) कभी न लें',
          'बहुत ज़्यादा ग्रस्त पेड़ हटाकर स्वस्थ पौधा लगाएँ',
          'छँटाई के औज़ार हर पेड़ के बाद साफ करें',
        ],
        symptoms:
          'पत्तियों पर हल्के पीले या मलाई (क्रीम) रंग के अनियमित धब्बे, धारियाँ और चकत्ते बनते हैं — ' +
          'पत्ती चितकबरी (mosaic) दिखती है। ये निशान नसों के साथ-साथ भी चल सकते हैं। ' +
          'यह किसी फफूंद के धब्बे जैसा नहीं होता — इसमें कोई सड़न, फफूंद या पाउडर नहीं दिखता, सिर्फ रंग का बदलाव होता है। ' +
          'तेज़ धूप में ये पीले हिस्से झुलसकर भूरे पड़ सकते हैं। ' +
          'पेड़ की बढ़वार धीमी हो जाती है, फल छोटे और कम बनते हैं, और उपज 30–50% तक घट सकती है। ' +
          'यह मुख्य रूप से ग्रस्त कलम (grafting) से फैलता है — इसीलिए नर्सरी का चुनाव सबसे ज़रूरी है।',
        symptomsEn:
          'Irregular pale yellow or cream blotches, stripes and flecks give leaves a mottled mosaic look, sometimes ' +
          'following the veins. Unlike fungal diseases there is no rot, mould or powder — only colour change. In ' +
          'strong sun the yellow areas may scorch brown. Growth slows, fruits are fewer and smaller, and yield can ' +
          'drop 30–50%. It spreads mainly through infected graft wood, so nursery choice matters most.',
        organic: [
          'सिर्फ प्रमाणित, विषाणु-मुक्त नर्सरी से ही पौधा/कलम लें — यही असली बचाव है',
          'ग्रस्त पेड़ से कलम कभी न लें, चाहे बाकी पेड़ अच्छा दिखे',
          'छँटाई के औज़ार हर पेड़ के बाद ब्लीच/स्पिरिट से साफ करें',
          'बहुत ज़्यादा ग्रस्त पेड़ उखाड़कर हटा दें (rogueing)',
          'बचे पेड़ को खाद-पानी अच्छा दें ताकि वह फल देता रहे',
        ],
        chemical: [
          'ज़रूरी: विषाणु रोग का कोई रासायनिक इलाज नहीं है',
          'फफूंदनाशी या एंटीबायोटिक छिड़कना पैसे की बर्बादी है',
          'सिर्फ पेड़ की सेहत बनाए रखें — संतुलित NPK, ज़िंक और बोरॉन',
        ],
        prevention: [
          'प्रमाणित विषाणु-मुक्त रोपण सामग्री — सबसे बड़ा और अकेला असली बचाव',
          'अपने बगीचे से कलम लेते समय सिर्फ पूरी तरह स्वस्थ पेड़ चुनें',
          'औज़ारों की सफाई का नियम बनाएँ',
          'नया बगीचा लगाते समय पौधे का स्रोत लिखकर रखें',
        ],
        speech:
          'पहचाना गया रोग है मोज़ेक, यानी चितकबरा विषाणु रोग। ' +
          'पत्तियों पर हल्के पीले या मलाई रंग के अनियमित धब्बे और धारियाँ बनती हैं, जिससे पत्ती चितकबरी दिखती है। ' +
          'ध्यान दीजिए, इसमें कोई सड़न, फफूंद या पाउडर नहीं होता, सिर्फ रंग बदलता है। ' +
          'एक बहुत ज़रूरी बात — यह विषाणु रोग है, इसका कोई इलाज नहीं है। ' +
          'फफूंदनाशी या कोई भी दवा छिड़कना पैसे की बर्बादी है, इसलिए दुकानदार के कहने पर बेकार दवा मत खरीदिए। ' +
          'यह मुख्य रूप से ग्रस्त कलम से फैलता है। इसलिए सबसे ज़रूरी काम यह है कि इस पेड़ से कलम कभी मत लीजिए, ' +
          'और नया पौधा हमेशा प्रमाणित विषाणु-मुक्त नर्सरी से ही लीजिए। ' +
          'छँटाई के औज़ार हर पेड़ के बाद साफ कीजिए। ' +
          'जो पेड़ बहुत ज़्यादा ग्रस्त हों उन्हें हटाकर स्वस्थ पौधा लगा दीजिए। ' +
          'बाकी पेड़ों को खाद-पानी अच्छा दीजिए ताकि वे फल देते रहें। ' +
          'सलाह की पुष्टि अपने कृषि विज्ञान केंद्र या बागवानी विभाग से ज़रूर कर लें।',
      },

      /* ------------------------------------------------------------------ */
      Apple_Healthy: {
        nameHi: 'स्वस्थ सेब',
        nameEn: 'Healthy Apple',
        pathogen: 'कोई रोग नहीं मिला / No disease detected',
        severity: 'none', severityHi: 'सब ठीक है',
        risk: 'ok', riskHi: 'स्वस्थ / Healthy',
        actions: [
          'कोई दवा न छिड़कें — अभी ज़रूरत नहीं है',
          'पतझड़ में गिरी पत्तियाँ हटाना न भूलें',
          'सर्दी की छँटाई में सूखी/ग्रस्त लकड़ी निकालें',
          '10–15 दिन बाद फिर से जाँचें',
        ],
        symptoms:
          'बहुत बढ़िया! इस पत्ती में किसी रोग के लक्षण नहीं मिले। पत्ती का रंग एक-सा हरा है — ' +
          'न जैतून जैसे मखमली धब्बे, न सफेद पाउडर, न नारंगी चमकते धब्बे और न ही चितकबरापन। ' +
          'आपके बगीचे का प्रबंधन अच्छा चल रहा है।',
        symptomsEn:
          'No disease symptoms detected — uniform green colour, no olive velvety spots, no powdery coating, no bright ' +
          'orange pustules and no mottling. Keep up the current orchard management.',
        organic: [
          'पतझड़ की गिरी पत्तियाँ इकट्ठा करके जलाएँ या गाड़ें — स्कैब और भूरे धब्बे का आधा बचाव यहीं है',
          'सर्दी की छँटाई — सूखी, मरी हुई और आपस में रगड़ खाती टहनियाँ निकालें',
          'तने पर बोर्डो पेंट साल में एक बार',
          'थाले में गोबर की खाद + ट्राइकोडर्मा',
          'बिना ज़रूरत छिड़काव न करें — मधुमक्खी और मित्र कीट बचे रहेंगे',
        ],
        chemical: [
          'अभी किसी दवा की ज़रूरत नहीं है',
          'मिट्टी जाँच के अनुसार ही NPK, कैल्शियम और बोरॉन दें',
        ],
        prevention: [
          'तय छिड़काव कार्यक्रम अपनाएँ: हरी नोक → गुलाबी कली → पंखुड़ी गिरने के बाद',
          'बारिश के बाद बगीचा ज़रूर जाँचें — स्कैब वहीं से शुरू होता है',
          'फूल खिलते समय कोई कीटनाशक न डालें — मधुमक्खी से ही फल बनता है',
          'ऊपर से सिंचाई न करें; जल-निकासी ठीक रखें',
          'पौधा हमेशा प्रमाणित, विषाणु-मुक्त नर्सरी से लें',
        ],
        speech:
          'बहुत बढ़िया! इस पत्ती में किसी रोग के लक्षण नहीं मिले। आपका सेब का पेड़ स्वस्थ लग रहा है। ' +
          'इसे ऐसे ही बनाए रखने के लिए, अभी कोई दवा मत छिड़कें, क्योंकि उसकी ज़रूरत नहीं है। ' +
          'सबसे ज़रूरी काम यह है कि पतझड़ में गिरी हुई पत्तियाँ इकट्ठा करके जला दीजिए या गाड़ दीजिए। ' +
          'स्कैब और भूरे धब्बे जैसे बड़े रोगों का आधा बचाव अकेले इसी काम से हो जाता है। ' +
          'सर्दी की छँटाई में सूखी, मरी हुई और आपस में रगड़ खाती टहनियाँ निकाल दीजिए। ' +
          'तने पर साल में एक बार बोर्डो पेंट लगाइए। ' +
          'बारिश के बाद बगीचा ज़रूर जाँचिए, क्योंकि स्कैब वहीं से शुरू होता है। ' +
          'और जब फूल खिले हों तब कोई कीटनाशक मत डालिए, क्योंकि मधुमक्खी से ही फल बनता है। ' +
          'दस से पंद्रह दिन बाद इस ऐप से दोबारा जाँच कर लीजिए।',
      },
    },
  },

};


/* ---------------------------------------------------------------------------
 * LABEL_INDEX — har disease label ko seedha uski advisory se jodta hai.
 * Isse purani history (kisi aur fasal ki) bhi sahi naam dikhati hai.
 * CROPS badalte hi yeh apne aap update ho jaata hai.
 * ------------------------------------------------------------------------- */
const LABEL_INDEX = {};
Object.keys(CROPS).forEach((cropId) => {
  Object.keys(CROPS[cropId].classes).forEach((label) => {
    LABEL_INDEX[label] = Object.assign({ cropId: cropId }, CROPS[cropId].classes[label]);
  });
});
/* ============================================================================
 * SECTION 3 — DOM REFERENCES, STATE + SMALL HELPERS
 * ========================================================================= */

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const el = {
  /* shell */
  sidebar:     $('#sidebar'),
  scrim:       $('#scrim'),
  drawerOpen:  $('#drawerOpen'),
  drawerClose: $('#drawerClose'),
  viewTitle:   $('#viewTitle'),
  viewSubtitle:$('#viewSubtitle'),

  statusChip:     $('#statusChip'),
  statusChipText: $('#statusChipText'),

  /* alerts */
  errorBanner:  $('#errorBanner'),
  errorTitle:   $('#errorTitle'),
  errorMessage: $('#errorMessage'),
  errorMessageEn: $('#errorMessageEn'),
  errorClose:   $('#errorClose'),
  infoBanner:   $('#infoBanner'),
  infoMessage:  $('#infoMessage'),
  infoMessageEn: $('#infoMessageEn'),
  infoClose:    $('#infoClose'),

  /* scan */
  cameraInput:  $('#cameraInput'),
  galleryInput: $('#galleryInput'),
  cameraBtn:    $('#cameraBtn'),
  galleryBtn:   $('#galleryBtn'),
  dropzone:     $('#dropzone'),
  dropzoneEmpty:$('#dropzoneEmpty'),
  previewWrap:  $('#previewWrap'),
  previewImg:   $('#previewImg'),
  clearBtn:     $('#clearBtn'),
  againBtn:     $('#againBtn'),
  loadingBox:   $('#loadingBox'),
  loadingText:  $('#loadingText'),

  /* result */
  resultWrap:       $('#resultWrap'),
  advisoryAlert:    $('#advisoryAlert'),
  reportToggle:     $('#reportToggle'),
  reportNote:       $('#reportNote'),
  /* batch scan */
  batchGrid:        $('#batchGrid'),
  batchCount:       $('#batchCount'),
  batchHint:        $('#batchHint'),
  batchScanBtn:     $('#batchScanBtn'),
  batchClearBtn:    $('#batchClearBtn'),
  batchProgress:    $('#batchProgress'),
  batchBarFill:     $('#batchBarFill'),
  batchProgressText:$('#batchProgressText'),
  batchProgressSub: $('#batchProgressSub'),
  batchSummaryCard: $('#batchSummaryCard'),
  batchSummary:     $('#batchSummary'),

  resultNotes:      $('#resultNotes'),
  notPlantBox:      $('#notPlantBox'),
  notPlantReason:   $('#notPlantReason'),
  notPlantTips:     $('#notPlantTips'),
  forceScanBtn:     $('#forceScanBtn'),
  retakeBtn:        $('#retakeBtn'),
  lowConfidenceBox: $('#lowConfidenceBox'),
  lowConfBest:      $('#lowConfBest'),
  advisoryCard:     $('#advisoryCard'),
  advisoryHost:     $('#advisoryHost'),
  advisoryMirror:   $('#advisoryMirror'),
  scoresList:       $('#scoresList'),
  scoresSub:        $('#scoresSub'),

  /* online AI */
  netModeGroup: $('#netMode'),
  netModeNote:  $('#netModeNote'),
  aiCard:       $('#aiCard'),
  aiHost:       $('#aiHost'),

  /* offline model manager + install */
  downloadList:  $('#downloadList'),
  downloadAllBtn:$('#downloadAllBtn'),
  storageLine:   $('#storageLine'),
  aiStatusLine:  $('#aiStatusLine'),
  gateStatusLine:$('#gateStatusLine'),
  voiceStatusLine: $('#voiceStatusLine'),
  voiceTestBtn:    $('#voiceTestBtn'),
  voiceSteps:      $('#voiceSteps'),
  installCard:   $('#installCard'),
  installBtn:    $('#installBtn'),
  apkBtn:        $('#apkBtn'),
  installNote:   $('#installNote'),
  installSteps:  $('#installSteps'),
  getAppBtn:     $('#getAppBtn'),
  getAppBadge:   $('#getAppBadge'),

  /* history */
  recentList:      $('#recentList'),
  historyList:     $('#historyList'),
  historyBadge:    $('#historyBadge'),
  clearHistoryBtn: $('#clearHistoryBtn'),

  /* handbook */
  libraryHost: $('#libraryHost'),
  handbookCropName: $('#handbookCropName'),

  /* crop selection */
  cropGrid:      $('#cropGrid'),
  cropChip:      $('#cropChip'),
  scanCropHint:  $('#scanCropHint'),
  changeCropBtn: $('#changeCropBtn'),

  /* weather */
  weatherCard:       $('#weatherCard'),
  weatherBody:       $('#weatherBody'),
  weatherPlace:      $('#weatherPlace'),
  weatherSpeakBtn:   $('#weatherSpeakBtn'),
  weatherRefreshBtn: $('#weatherRefreshBtn'),
};

/** Poori app state ek hi jagah — debugging aasan ho jaati hai. */
const state = {
  /* --- fasal (crop) --- */
  cropId: null,          // 'rice' | 'wheat' | ... — abhi chuni hui fasal
  cropAvailable: {},     // { rice: true, wheat: false, ... } — model file mili ya nahi
  cropModelKind: {},     // { rice: 'tflite', wheat: null, ... } — kaunsa format mila
  probing: false,

  /* --- model --- */
  model: null,
  modelKind: null,       // 'tfjs' (model.json) | 'tflite' (model.tflite)
  labels: [],            // active crop ke labels
  inputSize: CONFIG.IMAGE_SIZE,
  inputDType: 'float32', // quantized .tflite ka input 'int32' (uint8) hota hai

  /* --- image / prediction --- */
  imageEl: null,
  objectUrl: null,
  isPredicting: false,
  lastResult: null,      // { label, prob, confident }
  forceScan: false,      // kisan ne "फिर भी जाँचें" dabaya — leaf-gate ek baar chhodo
  imageFeatures: null,   // photo ka rang/banawat vishleshan (gate + health dono use karte hain)

  /* --- batch scan (2 se 40 photo) --- */
  batch: [],             // [{ id, name, url, img, status, result, reasonHi }]
  batchSeq: 0,
  batchSummary: null,    // sab milakar nateeja

  /* --- krishi vibhag se judaav --- */
  reportOptIn: false,    // kisan ne jaanch bhejna chalu kiya ya nahi (default BAND)
  advisories: [],        // vibhag ki chetavniyan
  lastPos: null,         // { lat, lon } — sirf tab jab mausam ke liye jagah mili ho
  healthNote: null,      // agar model ka rog-faisla badla gaya ho

  /* --- history --- */
  history: [],           // localStorage se aata hai

  /* --- weather --- */
  weather: null,         // { current, forecast, warnings, summary, fetchedAt, stale }
  weatherBusy: false,

  /* --- online AI (double-check) --- */
  /* Aakhri jaanch ka SAMAAN jawab (SECTION 7A). Offline ho ya online — dono
     ka natija bilkul ek hi shakl me yahan milta hai. */
  unified: null,

  netMode: 'auto',       // 'auto' | 'online' | 'offline' — kisan ka chuna hua tarika
  aiConfigured: null,    // true = server par key lagi hai | false = nahi | null = pata nahi
  aiReason: null,        // 'no_api' (local server) | 'no_key' | 'error'
  aiEngines: 0,          // server par kitne online engine lage hain (naam nahi)
  aiBusy: false,
  aiResult: null,        // aakhri online jawab
};

/**
 * Fasal ka naam KISAN KI CHUNI HUI BHASHA me.
 *
 * Pehle har jagah "धान · Rice · चावल" jaisa dono/teenon naam ek saath dikhte
 * the, chahe kisan ne koi bhi bhasha chuni ho. Tamil chunne wale ko bhi Hindi
 * dikhta tha. Ab sirf uski bhasha ka naam jaata hai.
 * Us bhasha me naam na ho to i18n khud Hindi par gir jaata hai.
 */
function cropName(cropId) {
  const c = CROPS[cropId];
  if (window.kmI18n) {
    const v = window.kmI18n.t('crop.' + cropId);
    if (v && v !== 'crop.' + cropId) return v;
  }
  return c ? c.nameHi : cropId;
}

/** Abhi chuni hui fasal ka poora config (na chuni ho to null). */
function activeCrop() {
  return state.cropId ? CROPS[state.cropId] : null;
}

/** Views ki heading — nav badalne par topbar bhi update hota hai. */
const VIEW_META = {
  home:     { title: 'वृद्धि AI',
              sub: 'आपका खेती सहायक — जाँच, सलाह, मंडी भाव और मौसम' },
  crops:    { title: 'फसल चुनें',
              sub: 'Which is your crop? — चुनते ही उसी का मॉडल लोड होगा' },
  scan:     { title: 'नमस्ते, किसान भाई',
              sub: 'पत्ती की फोटो से रोग पहचानें — बिना इंटरनेट के' },
  history:  { title: 'Detection History', sub: 'आपकी पिछली सभी जाँचें' },
  advisory: { title: 'Smart Advisory',    sub: 'आख़िरी जाँच पर आधारित सलाह' },
  handbook: { title: 'Crop Guide',        sub: 'चुनी हुई फसल के रोग — पूरी जानकारी' },
  about:    { title: 'Offline &amp; Help', sub: 'ऐप कैसे काम करता है और सावधानियाँ' },
};

/** XSS se bachne ke liye — innerHTML me daalne se pehle hamesha. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function show(node) { if (node) node.hidden = false; }
function hide(node) { if (node) node.hidden = true; }

/** Chhota helper: <svg class="ic"><use href="#i-…"/></svg> */
function icon(name, cls) {
  return '<svg class="' + (cls || 'ic') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
}

function setStatus(text, kind /* loading | ready | error */) {
  el.statusChipText.textContent = text;
  el.statusChip.className = 'chip chip--' + kind;
}

/**
 * Har error do bhashaon me: pehli line Hindi, doosri line English.
 * messageEn na do to sirf Hindi line dikhegi.
 */
function showError(messageHi, messageEn, title) {
  el.errorTitle.textContent = title || 'त्रुटि / Error';
  el.errorMessage.textContent = messageHi;
  el.errorMessageEn.textContent = messageEn || '';
  el.errorMessageEn.hidden = !messageEn;
  show(el.errorBanner);
  el.errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showInfo(messageHi, messageEn) {
  el.infoMessage.textContent = messageHi;
  el.infoMessageEn.textContent = messageEn || '';
  el.infoMessageEn.hidden = !messageEn;
  show(el.infoBanner);
}

/** 0.8123 -> "81.2%" */
function pct(x, decimals) {
  return (x * 100).toFixed(decimals === undefined ? 1 : decimals) + '%';
}

/** Label na mile to app crash na ho. */
function getAdvisory(label) {
  // LABEL_INDEX me saari 4 fasalon ke labels hain, isliye purani history
  // (dusri fasal ki) bhi sahi naam dikhati hai.
  return LABEL_INDEX[label] || {
    severity: 'low', severityHi: '—', risk: 'unknown', riskHi: 'अज्ञात / Unknown',
    symptoms: 'इस श्रेणी के लिए सलाह उपलब्ध नहीं है। script.js के CROPS config में जोड़ें।',
    symptomsEn: 'No advisory found for this class.',
    actions: [], organic: [], chemical: [], prevention: [],
    speech: 'इस श्रेणी के लिए सलाह उपलब्ध नहीं है।',
  };
}

/** "24 May, 2025" jaisa readable date. */
function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch (_) { return ''; }
}


/* ============================================================================
 * SECTION 4 — VIEW SWITCHING + MOBILE DRAWER
 * ========================================================================= */

function switchView(name) {
  if (!VIEW_META[name]) name = 'home';

  /* Fasal chune bina detection/handbook ka koi matlab nahi. Par dashboard,
     madad aur fasal-chunav khud hamesha khule rehne chahiye. */
  const noCropNeeded = ['home', 'crops', 'about'];
  if (!state.cropId && noCropNeeded.indexOf(name) === -1) name = 'crops';

  $$('.view').forEach((v) => v.classList.toggle('is-active', v.id === 'view-' + name));
  $$('.nav__item').forEach((b) => b.classList.toggle('is-active', b.dataset.view === name));

  /* Topbar ki heading bhi chuni hui bhasha me. js/i18n.js me key na ho to
     wahi purana Hindi text dikhta hai — kuch tootta nahi. */
  const T = (key, fallback) =>
    (window.kmI18n && window.kmI18n.t(key) !== key) ? window.kmI18n.t(key) : fallback;

  const TITLE_KEY = { home:'nav.home', crops:'head.chooseCrop', scan:'nav.scan', history:'head.history',
                      advisory:'head.advisory', handbook:'head.guide', about:'nav.about' };
  const SUB_KEY   = { home:'sub.home', crops:'sub.crops', scan:'sub.scan', history:'sub.history',
                      advisory:'sub.advisory', handbook:'sub.handbook', about:'sub.about' };

  el.viewTitle.innerHTML    = TITLE_KEY[name]
    ? escapeHtml(T(TITLE_KEY[name], VIEW_META[name].title))
    : VIEW_META[name].title;
  /* Subtitle bhi kisan ki bhasha me. Pehle yahan seedha VIEW_META ka Hindi
     text jata tha — Tamil chunne wale kisan ko har screen ke upar Hindi
     dikhti thi, chahe baaki poori app Tamil me ho. Title pehle se i18n me
     tha, subtitle reh gaya tha. */
  el.viewSubtitle.innerHTML = escapeHtml(T(SUB_KEY[name], VIEW_META[name].sub));

  // scan / handbook par chuni hui fasal ka naam bhi dikha do
  const crop = activeCrop();
  if (crop && (name === 'scan' || name === 'handbook')) {
    el.viewSubtitle.innerHTML =
      icon(crop.icon, 'cropart cropart--sm') + ' ' + escapeHtml(cropName(crop.id)) +
      /* Yahan bhi i18n — upar wali line theek kar dene ke baad bhi yeh
         shaakha raw Hindi wapas laga deti thi. Nateeja: fasal ka naam
         Tamil me aur uske baad ka vaakya Hindi me — sabse bhadda mel. */
      ' · ' + escapeHtml(T(SUB_KEY[name], VIEW_META[name].sub));
  }

  if (name === 'history')  renderHistory();
  if (name === 'advisory') renderAdvisoryMirror();
  if (name === 'about')  { renderOfflineManager(); renderInstallCard(); }

  closeDrawer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openDrawer()  { el.sidebar.classList.add('is-open'); show(el.scrim); }
function closeDrawer() { el.sidebar.classList.remove('is-open'); hide(el.scrim); }


/* ============================================================================
 * SECTION 5 — TENSORFLOW.JS + MODEL LOADING
 * ========================================================================= */

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Script load failed: ' + src));
    document.head.appendChild(s);
  });
}

/** Pehle local js/tf.min.js; na mile to CDN (tab app offline nahi chalega). */
async function ensureTensorflow() {
  if (typeof window.tf !== 'undefined') return true;

  console.warn('[tfjs] local js/tf.min.js not found, trying CDN…');
  try {
    await loadScript(CONFIG.TFJS_CDN);
    showInfo(
      'TensorFlow.js इंटरनेट (CDN) से लोड हुआ क्योंकि js/tf.min.js नहीं मिली। ' +
      'पूरी तरह ऑफ़लाइन चलाने के लिए README में दी गई फ़ाइल js/ फ़ोल्डर में रखें।',
      'TensorFlow.js was loaded from the internet (CDN) because js/tf.min.js is missing. ' +
      'To run fully offline, place that file in the js/ folder (see README).'
    );
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

/** File maujood hai ya nahi — sirf HEAD, download nahi hoti. */
async function headOk(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok;
  } catch (_) {
    return false;
  }
}

/**
 * TFLite runtime (WASM) — sirf pehli baar load hota hai, phir cache.
 * Pehle local js/tflite/, na mile to CDN (tab pehli baar internet chahiye).
 */
let tflitePromise = null;
function ensureTflite() {
  if (tflitePromise) return tflitePromise;

  tflitePromise = (async () => {
    if (typeof window.tflite !== 'undefined') return true;

    const local = await headOk(CONFIG.TFLITE_LOCAL_JS);
    try {
      await loadScript(local ? CONFIG.TFLITE_LOCAL_JS : CONFIG.TFLITE_CDN_JS);
    } catch (err) {
      console.error('[tflite] runtime load failed:', err);
      return false;
    }
    if (typeof window.tflite === 'undefined') return false;

    // WASM files kahan se aayein — JS ke saath hi wahi jagah.
    window.tflite.setWasmPath(local ? CONFIG.TFLITE_LOCAL_WASM_DIR : CONFIG.TFLITE_CDN_WASM_DIR);
    console.info('[tflite] runtime loaded from', local ? 'local js/tflite/' : 'CDN');

    if (!local) {
      showInfo(
        'TFLite runtime इंटरनेट (CDN) से लोड हुआ, क्योंकि js/tflite/ फ़ोल्डर नहीं मिला। ' +
        'बिना इंटरनेट चलाने के लिए README के अनुसार वे फ़ाइलें रखें।',
        'The TFLite runtime was loaded from the internet (CDN) because the js/tflite/ folder ' +
        'is missing. To run without internet, add those files as described in the README.'
      );
    }
    return true;
  })();

  return tflitePromise;
}

/** metadata.json (TFJS) ya labels.txt (TFLite) se labels; na mile to CROPS config. */
/** models/<crop>/ ka poora path. */
function cropModelDir(cropId) {
  return CONFIG.MODELS_BASE + '/' + cropId + '/';
}

async function loadLabels(cropId) {
  const dir = cropModelDir(cropId);

  /* 1) TFJS export — metadata.json me { labels: [...] } */
  try {
    const res = await fetch(dir + 'metadata.json', { cache: 'no-cache' });
    if (res.ok) {
      const meta = await res.json();
      if (Array.isArray(meta.labels) && meta.labels.length) {
        state.labels = meta.labels;
        console.info('[model] labels from metadata.json:', state.labels);
        return;
      }
    }
  } catch (err) {
    console.warn('[model] metadata.json nahi padha:', err.message);
  }

  /* 2) TFLite export — labels.txt, har line "0 Rice_LeafSmut" jaisi */
  try {
    const res = await fetch(dir + 'labels.txt', { cache: 'no-cache' });
    if (res.ok) {
      const lines = (await res.text())
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.replace(/^\d+[\s.:-]+/, ''));   // aage ka index number hata do
      if (lines.length) {
        state.labels = lines;
        console.info('[model] labels from labels.txt:', state.labels);
        return;
      }
    }
  } catch (err) {
    console.warn('[model] labels.txt nahi padha:', err.message);
  }

  /* 3) Kuch bhi na mile to CROPS config wale labels */
  console.warn('[model] fallback labels (CROPS config) use kiye');
  state.labels = CROPS[cropId].labels.slice();
}

/**
 * Chuni hui fasal ka model load karta hai (LAZY — sirf yahi ek model RAM me aata hai).
 * @param {string} cropId 'rice' | 'wheat' | 'sugarcane' | 'cotton' | ...
 */
/* Har model-load ko apna number milta hai. Kisan ne ek fasal dabakar turant
   doosri daba di, to dono load saath me chalte hain — aur jo BAAD me khatam
   hota hai wahi state.model me bacha reh jata hai.
   Asli me pakda gaya: seb (9 class) dabaya, phir turant aam (8 class) —
   state.labels aam ke aur state.model SEB ka reh gaya. Nateeja: aam ki patti
   par seb ke rog ke naam, aur ek bekaar "Class 8" bar. Kisan ko bilkul galat
   salah milti. Isliye ab purana load apne aap radd ho jata hai.              */
let modelLoadSeq = 0;

async function loadModelForCrop(cropId) {
  const mySeq = ++modelLoadSeq;
  const stale = () => mySeq !== modelLoadSeq;

  setStatus('मॉडल लोड / Loading…', 'loading');

  // Purana model RAM se hata do — low-end phone par yeh zaroori hai
  if (state.model) {
    try { state.model.dispose(); } catch (_) {}
    state.model = null;
  }

  if (stale()) return;                    // beech me doosri fasal chun li gayi

  if (!(await ensureTensorflow())) {
    if (stale()) return;
    setStatus('लाइब्रेरी विफल / Library failed', 'error');
    showError(
      'TensorFlow.js लाइब्रेरी लोड नहीं हो पाई। js/tf.min.js फ़ाइल मौजूद है या नहीं जाँचें ' +
      '(README में डाउनलोड कमांड दी गई है)।',
      'The TensorFlow.js library could not be loaded. Check whether the file js/tf.min.js ' +
      'exists (the download command is given in the README).',
      'लाइब्रेरी लोड नहीं हुई / Library failed'
    );
    return;
  }

  await loadLabels(cropId);
  if (stale()) return;                    // labels bhi mat likho, warna mix ho jayega
  renderLibrary();      // labels final hone ke baad handbook dobara banao

  const kind = state.cropModelKind[cropId] || 'tfjs';

  try {
    let model;

    if (kind === 'tflite') {
      /* Teachable Machine ka "Tensorflow Lite" export — model.tflite */
      if (!(await ensureTflite())) throw new Error('TFLite runtime load nahi ho paya');
      model = await window.tflite.loadTFLiteModel(cropModelDir(cropId) + 'model.tflite');
      console.info('[model]', cropId, 'loaded as TFLiteModel');
    } else {
      /* Teachable Machine ka "Tensorflow.js" export — model.json + weights.bin */
      const modelUrl = cropModelDir(cropId) + 'model.json';
      try {
        model = await tf.loadLayersModel(modelUrl);
        console.info('[model]', cropId, 'loaded as LayersModel');
      } catch (layersErr) {
        console.warn('[model] loadLayersModel fail, trying loadGraphModel:', layersErr.message);
        model = await tf.loadGraphModel(modelUrl);
        console.info('[model]', cropId, 'loaded as GraphModel');
      }
    }
    /* Yahi wo jagah hai jahan bug tha: purana (dheema) load bhi yahan pahunchkar
       nayi fasal ka model overwrite kar deta tha. Ab purana khud ko hata deta hai. */
    if (stale()) {
      try { model.dispose(); } catch (_) {}   // RAM/GPU khali karo
      console.info('[model]', cropId, 'ka load radd — kisan ne doosri fasal chun li');
      return;
    }

    state.model = model;
    state.modelKind = kind;
    setTimeout(renderBatchTray, 0);        // "सब जाँचें" ab dabaya ja sakta hai

    // Model ke input se asli size aur dtype lo — [1, H, W, 3]
    state.inputDType = 'float32';
    try {
      const inp = (model.inputs && model.inputs[0]) || null;
      const shape = inp && inp.shape;
      if (shape && shape.length === 4 && shape[1] > 0) state.inputSize = shape[1];
      // Quantized .tflite ka input uint8 hota hai — TFJS use 'int32' kehta hai,
      // aur us par float tensor bhejne se predict() error deta hai.
      if (inp && inp.dtype) state.inputDType = inp.dtype;
    } catch (_) {}
    console.info('[model] kind =', kind, '| input size =', state.inputSize,
                 '| dtype =', state.inputDType);

    // Warm-up — pehli prediction slow hoti hai (shaders/WASM taiyar hote hain)
    tf.tidy(() => {
      const dummy = tf.zeros([1, state.inputSize, state.inputSize, 3], state.inputDType);
      const out = state.model.predict(dummy);
      if (out && typeof out.dataSync === 'function') out.dataSync();
    });

    setStatus('तैयार / Model ready', 'ready');
    // Purana single-photo #predictBtn ab HTML me hai hi nahi — batch tray
    // khud tay karti hai ki "सब जाँचें" dabaya ja sakta hai ya nahi.
    renderBatchTray();
  } catch (err) {
    console.error('[model] load error:', err);
    setStatus('मॉडल विफल / Model failed', 'error');
    showError(
      'मॉडल लोड नहीं हो पाया। जाँचें कि models/' + cropId + '/ फ़ोल्डर में model.json + weights.bin ' +
      '(या model.tflite) मौजूद है, और ऐप लोकल सर्वर (http://localhost) से चल रहा है — file:// से नहीं। ' +
      'तकनीकी विवरण: ' + err.message,
      'The model could not be loaded. Check that the folder models/' + cropId + '/ contains ' +
      'model.json + weights.bin (or model.tflite), and that the app is opened from a local ' +
      'server (http://localhost) — not from file://. Technical detail: ' + err.message,
      'मॉडल लोड विफल / Model load failed'
    );
  }
}


/* ============================================================================
 * SECTION 6 — IMAGE HANDLING (camera / gallery / drag-drop)
 * ========================================================================= */

/** Kisi bhi source se aayi file ko validate karke preview me lagata hai. */
async function acceptFile(file) {
  if (!file) {
    showInfo(
      'कोई फोटो नहीं मिली। अगर कैमरा नहीं खुला तो फ़ोन की Settings → Apps → Browser → ' +
      'Permissions में Camera को Allow करें, या "Choose Image" से गैलरी इस्तेमाल करें।',
      'No photo was received. If the camera did not open, allow Camera under your phone\'s ' +
      'Settings → Apps → Browser → Permissions, or use "Choose Image" to pick from the gallery.'
    );
    return;
  }

  // 1) type
  const typeOk = file.type ? file.type.startsWith('image/') : /\.(jpe?g|png|webp|bmp)$/i.test(file.name);
  if (!typeOk) {
    showError(
      'यह फ़ाइल इमेज नहीं है। कृपया JPG / PNG फोटो चुनें।',
      'This file is not an image. Please choose a JPG or PNG photo.'
    );
    return;
  }

  // 2) size
  if (file.size > CONFIG.MAX_FILE_BYTES) {
    showError(
      'फोटो बहुत बड़ी है (' + (file.size / 1048576).toFixed(1) + ' MB)। ' +
      'कृपया 10 MB से छोटी फोटो चुनें या कैमरा की quality कम करें।',
      'This photo is too large (' + (file.size / 1048576).toFixed(1) + ' MB). ' +
      'Please choose a photo smaller than 10 MB, or lower the camera quality.'
    );
    return;
  }

  hide(el.errorBanner);
  hide(el.infoBanner);

  // 3) decode + preview
  try {
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state.objectUrl = URL.createObjectURL(file);

    state.imageEl = await loadImageElement(state.objectUrl);

    if (el.previewImg) el.previewImg.src = state.objectUrl;
    show(el.previewWrap);
    hide(el.dropzoneEmpty);
    hide(el.resultWrap);
    stopSpeaking();
  } catch (err) {
    console.error('[image] decode error:', err);
    showError(
      'यह फोटो खोली नहीं जा सकी — फ़ाइल खराब हो सकती है या फ़ॉर्मैट सपोर्ट नहीं है ' +
      '(जैसे iPhone की HEIC)। कृपया JPG/PNG में फोटो लें।',
      'This photo could not be opened — the file may be corrupt, or the format is not ' +
      'supported (for example iPhone HEIC). Please take the photo as JPG or PNG.'
    );
    clearImage();
  }
}

/* Ab ek nahi, kai photo aati hain — camera se ek-ek karke, gallery se sab ek saath. */
function handleFileSelected(evt) {
  const files = evt.target.files;
  addFilesToBatch(files).finally(() => { evt.target.value = ''; });  // same file dobara chun sakein
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => (img.naturalWidth && img.naturalHeight)
      ? resolve(img)
      : reject(new Error('Image ka size 0 hai'));
    img.onerror = () => reject(new Error('Image decode fail'));
    img.src = src;
  });
}

function clearImage() {
  if (state.objectUrl) { URL.revokeObjectURL(state.objectUrl); state.objectUrl = null; }
  state.imageEl = null;
  if (el.previewImg) el.previewImg.removeAttribute('src');
  hide(el.previewWrap);
  show(el.dropzoneEmpty);
  hide(el.resultWrap);
  stopSpeaking();
}


/* ============================================================================
 * SECTION 6C — BATCH SCAN (2 se 40 photo ek saath)
 *
 * KYUN: ek patti se poore khet ka haal pata nahi chalta. Ho sakta hai kisan ne
 * galti se sabse kharab patti chun li ho, ya sabse achhi. Isliye ab kam se kam
 * 5 aur zyada se zyada 40 photo li jaati hain, har ek alag se jaanchi jaati hai,
 * aur aakhir me SAB milakar ek nateeja banta hai:
 *
 *   - kaun sa rog mila
 *   - kitni photo me mila (yani khet me kitna faila hua hai)
 *   - kitni photo swasth thi
 *   - kaun si photo jaanch hi nahi paayi (dhundhli / galat fasal) aur kyun
 *
 * "Kitni photo me mila" hi asli kaam ki cheez hai — 20 me se 2 me rog matlab
 * shuruaat, aur 20 me se 15 matlab poora khet chapet me hai. Salah bhi isi ke
 * hisaab se badalti hai.
 *
 * Memory ka dhyan: 40 photo ek saath GPU par nahi chadhate — ek-ek karke
 * (sequentially) chalate hain aur har baar tensor turant dispose karte hain,
 * warna sasta phone atak jayega.
 * ========================================================================= */

const BATCH = {
  /* Kam se kam kitni photo chahiye. 5 se ghata kar 2 kiya gaya — chhote
     kisan ke paas har baar 5 alag-alag pattiyan nahi hoti, aur 2 photo se
     bhi ek theek-thaak andaza mil jaata hai. */
  MIN: 2,
  MAX: 40,
};

/** Nayi file(en) batch me jodo — limit aur validation ke saath. */
async function addFilesToBatch(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  hide(el.errorBanner);
  hide(el.infoBanner);

  const jagah = BATCH.MAX - state.batch.length;
  if (jagah <= 0) {
    showInfo(
      'ज़्यादा से ज़्यादा ' + BATCH.MAX + ' फोटो ही जाँची जा सकती हैं। ' +
      'कुछ हटाकर नई जोड़ें।',
      'At most ' + BATCH.MAX + ' photos can be checked. Remove some to add more.'
    );
    return;
  }

  const lene = files.slice(0, jagah);
  const chhoot = files.length - lene.length;

  let skipped = 0;
  for (const file of lene) {
    const typeOk = file.type ? file.type.startsWith('image/')
                             : /\.(jpe?g|png|webp|bmp)$/i.test(file.name);
    if (!typeOk || file.size > CONFIG.MAX_FILE_BYTES) { skipped++; continue; }

    try {
      const url = URL.createObjectURL(file);
      const img = await loadImageElement(url);
      state.batch.push({
        id: 'P' + (++state.batchSeq),
        name: file.name || 'photo',
        url: url,
        img: img,
        status: 'ready',      // ready | ok | skipped | error
        result: null,
        reasonHi: '',
      });
    } catch (err) {
      console.warn('[batch] photo nahi khuli:', file.name, err.message);
      skipped++;
    }
  }

  if (skipped) {
    showInfo(
      skipped + ' फोटो नहीं जोड़ी जा सकीं (इमेज नहीं है, 10 MB से बड़ी है, ' +
      'या फ़ॉर्मैट सपोर्ट नहीं — जैसे iPhone की HEIC)।',
      skipped + ' photo(s) could not be added (not an image, larger than 10 MB, ' +
      'or an unsupported format such as iPhone HEIC).'
    );
  }
  if (chhoot) {
    showInfo(
      'सिर्फ पहली ' + lene.length + ' फोटो जोड़ी गईं — एक बार में ज़्यादा से ज़्यादा ' +
      BATCH.MAX + ' फोटो जाँची जा सकती हैं।',
      'Only the first ' + lene.length + ' photos were added — at most ' + BATCH.MAX +
      ' photos can be checked at once.'
    );
  }

  renderBatchTray();
}

function removeFromBatch(id) {
  const i = state.batch.findIndex((p) => p.id === id);
  if (i === -1) return;
  try { URL.revokeObjectURL(state.batch[i].url); } catch (_) {}
  state.batch.splice(i, 1);
  renderBatchTray();
}

function clearBatch() {
  state.batch.forEach((p) => { try { URL.revokeObjectURL(p.url); } catch (_) {} });
  state.batch = [];
  state.batchSummary = null;
  hide(el.resultWrap);
  hide(el.batchProgress);
  renderBatchTray();
  stopSpeaking();
}

/* ---------------------------------------------------------------------------
 * Tray — chuni hui photo, ginti, aur "jaanch shuru karein" ki halat
 * ------------------------------------------------------------------------- */
function renderBatchTray() {
  const n = state.batch.length;

  if (el.batchCount) {
    el.batchCount.textContent = n + ' / ' + BATCH.MAX;
  }

  if (el.batchHint) {
    if (n === 0) {
      el.batchHint.textContent =
        'कम से कम ' + BATCH.MIN + ' फोटो चाहिए। खेत की अलग-अलग जगहों से पत्तियों की ' +
        'फोटो लें — तभी पता चलेगा कि रोग कितना फैला है।';
    } else if (n < BATCH.MIN) {
      el.batchHint.textContent =
        'अभी ' + n + ' फोटो हैं। ' + (BATCH.MIN - n) + ' और चाहिए ' +
        '(कम से कम ' + BATCH.MIN + ')।';
    } else {
      el.batchHint.textContent =
        n + ' फोटो तैयार हैं। "सब जाँचें" दबाइए — हर फोटो अलग से जाँची जाएगी।';
    }
  }

  if (el.batchGrid) {
    el.batchGrid.innerHTML = state.batch.map((p) => {
      const badge = p.status === 'ok' ? icon('check', 'ic ic--xs')
                  : p.status === 'skipped' ? icon('alert', 'ic ic--xs')
                  : p.status === 'error' ? icon('close', 'ic ic--xs') : '';
      return [
        '<li class="bthumb bthumb--', escapeHtml(p.status), '" data-id="', escapeHtml(p.id), '">',
          '<img src="', escapeHtml(p.url), '" alt="" loading="lazy" />',
          badge ? '<span class="bthumb__badge">' + badge + '</span>' : '',
          '<button type="button" class="bthumb__x" data-remove="', escapeHtml(p.id),
            '" aria-label="यह फोटो हटाएँ">' + icon('close', 'ic ic--xs') + '</button>',
        '</li>',
      ].join('');
    }).join('');
  }

  if (el.batchScanBtn) {
    el.batchScanBtn.disabled = !(n >= BATCH.MIN && state.model && !state.isPredicting);
    const span = el.batchScanBtn.querySelector('span');
    if (span) {
      span.textContent = n >= BATCH.MIN
        ? 'सब जाँचें (' + n + ' फोटो)'
        : 'कम से कम ' + BATCH.MIN + ' फोटो चाहिए';
    }
  }
  if (el.batchClearBtn) el.batchClearBtn.hidden = n === 0;
}

/* ---------------------------------------------------------------------------
 * Ek-ek karke sab photo jaancho — beech me progress dikhate hue
 * ------------------------------------------------------------------------- */
async function runBatchScan() {
  if (state.isPredicting) return;
  if (!state.model) {
    showError('मॉडल अभी तैयार नहीं है, कृपया कुछ सेकंड रुकें।',
              'The model is not ready yet. Please wait a few seconds.');
    return;
  }
  if (state.batch.length < BATCH.MIN) {
    showInfo('कम से कम ' + BATCH.MIN + ' फोटो चाहिए।',
             'At least ' + BATCH.MIN + ' photos are needed.');
    return;
  }

  state.isPredicting = true;
  state.batchSummary = null;
  hide(el.resultWrap);
  hide(el.errorBanner);
  stopSpeaking();
  renderBatchTray();
  show(el.batchProgress);

  const total = state.batch.length;
  const good = [];

  for (let i = 0; i < total; i++) {
    const p = state.batch[i];
    setBatchProgress(i, total, p);

    // UI ko saans lene do — warna 40 photo par screen jam ho jati hai
    await new Promise((r) => setTimeout(r, 30));

    let inputTensor = null, output = null;
    try {
      const canvas = cropToSquareCanvas(p.img, state.inputSize);
      const feat = analyzeImageContent(canvas);

      /* Wahi do jaanchein jo single photo par lagti hain */
      const gate = checkIsPlantPhoto(canvas, feat);
      if (!gate.ok) {
        p.status = 'skipped';
        p.reasonHi = gate.reasonHi || 'पत्ती की फोटो नहीं लगी';
        p.result = null;
        continue;
      }
      if (CONFIG.CROP_MATCH.BLOCK) {
        const cropGate = checkCropFamily(feat);
        if (cropGate) {
          p.status = 'skipped';
          p.reasonHi = cropGate.reasonHi;
          p.result = null;
          continue;
        }
      }

      inputTensor = preprocess(canvas);
      output = state.model.predict(inputTensor);
      const outTensor = Array.isArray(output) ? output[0] : output;
      const probs = toProbabilities(await outTensor.data());

      const results = probs
        .map((prob, idx) => ({ label: state.labels[idx] || ('Class ' + idx), prob: prob, index: idx }))
        .sort((a, b) => b.prob - a.prob);

      const recognition = recognitionGate(results);
      if (!recognition.ok) {
        p.status = 'skipped';
        p.reasonHi = 'फोटो की पहचान का भरोसा कम है — साफ फोटो लें';
        p.result = null;
        continue;
      }

      // Health check yahan bhi lagta hai — swasth patti ko rogi nahi batana
      const checked = applyHealthCheck(results, feat);
      const top = checked.switchedToHealthy
        ? { label: checked.healthyLabel,
            prob: Math.min(0.92, Math.max(1 - feat.damage, 0.80)) }
        : results[0];

      p.status = 'ok';
      p.reasonHi = '';
      p.result = {
        label: top.label,
        prob: top.prob,
        confident: checked.switchedToHealthy || top.prob >= CONFIG.CONFIDENCE_THRESHOLD,
        damage: feat.damage,
        switched: !!checked.switchedToHealthy,
      };

      /* Har photo ka SAMAAN jawab bhi bana lete hain (SECTION 7A). Single-photo
         path me yeh pehle se hota hai — batch me bhi hona chahiye, warna
         "aakhri jaanch" ka contract batch scan ke baad khali reh jaata tha. */
      p.unified = unifyFromDevice(top, results);
      state.unified = p.unified;               // aakhri jaanchi gayi photo

      good.push(p.result);

    } catch (err) {
      console.error('[batch] photo', p.id, 'fail:', err);
      p.status = 'error';
      p.reasonHi = 'जाँच नहीं हो पाई (' + err.message + ')';
      p.result = null;
    } finally {
      if (inputTensor) inputTensor.dispose();
      if (output) Array.isArray(output) ? output.forEach((t) => t.dispose()) : output.dispose();
    }

    renderBatchTray();     // har photo ke baad tick/cross dikha do
  }

  setBatchProgress(total, total, null);
  hide(el.batchProgress);

  state.isPredicting = false;
  renderBatchTray();

  const summary = summariseBatch();
  state.batchSummary = summary;
  renderBatchSummary(summary);
}

function setBatchProgress(done, total, current) {
  if (el.batchBarFill) el.batchBarFill.style.width = Math.round((done / total) * 100) + '%';
  if (el.batchProgressText) {
    el.batchProgressText.textContent = done >= total
      ? 'सभी ' + total + ' फोटो जाँची जा चुकी हैं — नतीजा बन रहा है…'
      : 'फोटो ' + (done + 1) + ' / ' + total + ' जाँची जा रही है…';
  }
  if (el.batchProgressSub && current) {
    el.batchProgressSub.textContent = current.name.slice(0, 40);
  }
}

/* ---------------------------------------------------------------------------
 * Sab milakar ek nateeja
 * ------------------------------------------------------------------------- */
function summariseBatch() {
  const healthy = healthyLabelOf(state.labels);
  const scanned = state.batch.filter((p) => p.status === 'ok' && p.result);
  const skipped = state.batch.filter((p) => p.status === 'skipped');
  const errored = state.batch.filter((p) => p.status === 'error');

  // Har rog ke liye: kitni photo, aur unka औसत bharosa
  const tally = {};
  scanned.forEach((p) => {
    const l = p.result.label;
    if (!tally[l]) tally[l] = { label: l, count: 0, probSum: 0 };
    tally[l].count++;
    tally[l].probSum += p.result.prob;
  });

  const rows = Object.keys(tally).map((l) => ({
    label: l,
    count: tally[l].count,
    share: tally[l].count / Math.max(1, scanned.length),
    avgProb: tally[l].probSum / tally[l].count,
    isHealthy: l === healthy,
  })).sort((a, b) => b.count - a.count || b.avgProb - a.avgProb);

  const diseased = rows.filter((r) => !r.isHealthy);
  const healthyRow = rows.find((r) => r.isHealthy);

  const diseasedCount = diseased.reduce((s, r) => s + r.count, 0);
  const spread = scanned.length ? diseasedCount / scanned.length : 0;

  /* Failav ke hisaab se halat — yahi asli kaam ki baat hai */
  let level, levelHi, adviceHi;
  if (!scanned.length) {
    level = 'none'; levelHi = 'कुछ जाँचा नहीं जा सका';
    adviceHi = 'एक भी फोटो जाँच के लायक नहीं मिली। नीचे कारण देखकर दोबारा फोटो लें।';
  } else if (spread === 0) {
    level = 'ok'; levelHi = 'खेत स्वस्थ लग रहा है';
    adviceHi = 'जाँची गई सभी फोटो में कोई रोग नहीं मिला। अभी दवा की ज़रूरत नहीं है — ' +
               'निगरानी जारी रखें और 10–15 दिन बाद दोबारा जाँचें।';
  } else if (spread <= 0.20) {
    level = 'low'; levelHi = 'शुरुआती अवस्था — अभी रोका जा सकता है';
    adviceHi = 'रोग अभी कुछ ही जगह है। तुरंत उन्हीं हिस्सों पर ध्यान दें — इसी समय ' +
               'रोकना सबसे सस्ता और असरदार होता है।';
  } else if (spread <= 0.50) {
    level = 'medium'; levelHi = 'फैल रहा है — देर न करें';
    adviceHi = 'खेत के अच्छे-खासे हिस्से में रोग पहुँच चुका है। पूरे खेत में छिड़काव की ' +
               'योजना बनाएँ और 10–15 दिन बाद दोबारा जाँचें।';
  } else {
    level = 'high'; levelHi = 'पूरे खेत में फैला है — तुरंत कार्रवाई करें';
    adviceHi = 'ज़्यादातर फोटो में रोग मिला है। पूरे खेत में तुरंत छिड़काव करें और ' +
               'अपने कृषि विज्ञान केंद्र (KVK) से भी संपर्क करें।';
  }

  return {
    total: state.batch.length,
    scanned: scanned.length,
    skipped: skipped.length,
    errored: errored.length,
    healthyCount: healthyRow ? healthyRow.count : 0,
    diseasedCount: diseasedCount,
    spread: spread,
    level: level,
    levelHi: levelHi,
    adviceHi: adviceHi,
    rows: rows,
    main: diseased[0] || healthyRow || null,   // sabse zyada mila hua
    skippedList: skipped.concat(errored).map((p) => ({ id: p.id, reasonHi: p.reasonHi })),
  };
}

/* ---------------------------------------------------------------------------
 * Nateeja dikhana — pehle poore khet ka haal, phir sabse bade rog ki salah
 * ------------------------------------------------------------------------- */
function renderBatchSummary(s) {
  if (!el.batchSummary) return;

  hide(el.notPlantBox);
  hide(el.lowConfidenceBox);
  renderAiCard(null);
  if (el.resultNotes) { el.resultNotes.innerHTML = ''; el.resultNotes.hidden = true; }

  const pct0 = (x) => Math.round(x * 100) + '%';

  /* --- 1. Upar: poore khet ka haal --- */
  const head = [
    '<div class="bsum__head bsum__head--', escapeHtml(s.level), '">',
      '<div class="bsum__level">',
        '<span class="bsum__icon" aria-hidden="true">',
          s.level === 'ok' ? icon('check')
          : s.level === 'unknown' ? icon('help') : icon('alert'),
        '</span>',
        '<div>',
          '<p class="bsum__title">', escapeHtml(s.levelHi), '</p>',
          '<p class="bsum__sub">', escapeHtml(s.adviceHi), '</p>',
        '</div>',
      '</div>',
      '<div class="bsum__stats">',
        '<div class="bsum__stat"><b>', s.scanned, '</b><span>जाँची गईं</span></div>',
        '<div class="bsum__stat"><b>', s.diseasedCount, '</b><span>में रोग</span></div>',
        '<div class="bsum__stat"><b>', s.healthyCount, '</b><span>स्वस्थ</span></div>',
        s.skipped + s.errored > 0
          ? '<div class="bsum__stat bsum__stat--muted"><b>' + (s.skipped + s.errored) +
            '</b><span>छोड़ी गईं</span></div>'
          : '',
      '</div>',
      s.scanned > 0
        ? '<div class="bsum__bar"><div class="bsum__bar-fill" style="width:' +
          pct0(s.spread) + '"></div></div>' +
          '<p class="bsum__spread">' + s.diseasedCount + ' / ' + s.scanned +
          ' फोटो में रोग मिला (' + pct0(s.spread) + ' फैलाव)</p>'
        : '',
    '</div>',
  ].join('');

  /* --- 2. Kis rog ki kitni photo --- */
  const list = s.rows.length ? [
    '<div class="bsum__block">',
      '<p class="bsum__label">क्या-क्या मिला</p>',
      '<ul class="bsum__rows">',
      s.rows.map((r) => {
        const a = getAdvisory(r.label);
        return [
          '<li class="bsum__row', r.isHealthy ? ' bsum__row--ok' : '', '">',
            '<span class="bsum__row-name">', escapeHtml(a.nameHi),
              ' <small>', escapeHtml(a.nameEn), '</small></span>',
            '<span class="bsum__row-count">', r.count, ' फोटो · ', pct0(r.share), '</span>',
            '<span class="bsum__row-track"><i style="width:', pct0(r.share), '"></i></span>',
          '</li>',
        ].join('');
      }).join(''),
      '</ul>',
    '</div>',
  ].join('') : '';

  /* --- 3. Jo photo chhod di gayi, kyun --- */
  const skippedBlock = s.skippedList.length ? [
    '<details class="bsum__skipped">',
      '<summary>', s.skippedList.length, ' फोटो जाँची नहीं जा सकीं — क्यों?</summary>',
      '<ul>',
      s.skippedList.map((x) => '<li>' + escapeHtml(x.reasonHi || 'कारण नहीं मिला') + '</li>').join(''),
      '</ul>',
    '</details>',
  ].join('') : '';

  el.batchSummary.innerHTML = head + list + skippedBlock;
  show(el.batchSummaryCard);

  /* --- 4. Sabse bade rog ki poori salah (wahi purana advisory card) --- */
  if (s.main && !s.main.isHealthy) {
    state.lastResult = { label: s.main.label, prob: s.main.avgProb,
                         confident: true, source: 'batch' };
    show(el.advisoryCard);
    el.advisoryHost.innerHTML = buildAdvisoryHtml(s.main.label,
      { prob: s.main.avgProb, speakId: 'speakResult' });
    wireSpeakButton($('#speakResult'), el.advisoryHost.querySelector('.adv'));
  } else if (s.main && s.main.isHealthy) {
    state.lastResult = { label: s.main.label, prob: s.main.avgProb,
                         confident: true, source: 'batch' };
    show(el.advisoryCard);
    el.advisoryHost.innerHTML = buildAdvisoryHtml(s.main.label,
      { prob: s.main.avgProb, speakId: 'speakResult' });
    wireSpeakButton($('#speakResult'), el.advisoryHost.querySelector('.adv'));
  } else {
    hide(el.advisoryCard);
    el.advisoryHost.innerHTML = '';
    state.lastResult = null;
  }

  /* Purana single-photo scores card is mode me matlab nahi rakhta */
  const scoresCard = el.scoresList && el.scoresList.closest('.card');
  if (scoresCard) scoresCard.hidden = true;

  show(el.resultWrap);
  el.resultWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /* History me ek hi entry — poore khet ka nateeja */
  if (s.main) {
    saveToHistory({ label: s.main.label, prob: s.main.avgProb, confident: true });
    reportScanToDept({ label: s.main.label, prob: s.main.avgProb, confident: true });
  }

  console.info('[batch] nateeja:', s.level, '| jaanchi', s.scanned, '| rog',
               s.diseasedCount, '| failav', pct0(s.spread));
}


/* ============================================================================
 * SECTION 6B — "YEH PHOTO PATTI KI HAI YA NAHI?"
 *
 * SAMASYA: Teachable Machine ka model CLOSED-SET hota hai — usne sirf 14 rog
 *          dekhe hain, isliye wo HAR photo ko unhi 14 me se kisi ek me daal
 *          deta hai. Selfie daalo to bhi "पीला रतुआ 82%" bata dega. Kisan ko
 *          galat salah mil jayegi.
 *
 * HAL: model chalane se PEHLE photo ko dekhte hain — kya isme sach me
 *      paudha/patti jaisa kuch hai?
 *
 * YEH KAISE KAAM KARTA HAI (bina kisi extra model ke, poori tarah offline):
 *   1. Photo ko 96x96 par chhota karte hain (tez chale)
 *   2. Har pixel ka rang dekhte hain aur ginte hain —
 *        hara paudha        : ExG (Excess Green) index, kheti me maana hua tarika
 *        rogi patti         : peela / narangi / bhoora — kyunki rog wali patti
 *                             hari hoti hi nahi! (yeh bhool sabse badi galti hoti)
 *        aadmi ki chamdi    : selfie sabse aam galat photo hai
 *        aasman             : neela
 *        deewar / screenshot: bilkul feeka (kam saturation)
 *   3. Texture bhi dekhte hain — patti me nasein aur khurdurapan hota hai,
 *      chamdi aur deewar chikni hoti hai
 *   4. Sab milakar ek "plant score" banta hai
 *
 * ZAROORI: yeh kisan ko ROKTA nahi — sirf chetavni deta hai aur
 *          "फिर भी जाँचें" ka button bhi deta hai. Kabhi-kabhi asli patti bhi
 *          reject ho sakti hai (jaise poori sookhi bhoori patti), tab kisan
 *          khud aage badh sakta hai.
 * ========================================================================= */

/** RGB -> HSV (h 0-360, s 0-1, v 0-1) */
function rgbToHsv(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn)      h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * (((bn - rn) / d) + 2);
    else                 h = 60 * (((rn - gn) / d) + 4);
  }
  if (h < 0) h += 360;
  return { h: h, s: max === 0 ? 0 : d / max, v: max };
}

/**
 * Photo ka rang aur texture jaanchta hai.
 * @returns {object} har cheez ka anupaat (0 se 1 ke beech) + plantScore
 */
function analyzeImageContent(sourceCanvas) {
  const N = 96;                                   // itne par jaanch kaafi hai
  const c = document.createElement('canvas');
  c.width = N; c.height = N;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, 0, 0, N, N);

  let data;
  try { data = ctx.getImageData(0, 0, N, N).data; }
  catch (_) { return null; }                      // canvas "tainted" ho to chhod do

  const total = N * N;
  let veg = 0, warmish = 0, skinLike = 0, sky = 0, dull = 0, dark = 0;
  const lum = new Float32Array(total);

  /* Nuksan (lesion) ka naksha — patti ka kitna hissa rang badal chuka hai.
     Har pixel: 1 = daag/peelapan/sadan, 0 = sehatmand hara.               */
  const lesionMap = new Uint8Array(total);
  let lesion = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    lum[p] = 0.299 * r + 0.587 * g + 0.114 * b;

    const sum = r + g + b;
    if (sum < 60) { dark++; lesionMap[p] = 1; lesion++; continue; }   // kaala daag / andhera

    /* --- 1. HARA PAUDHA: Excess Green index (kheti ka maana hua tarika) --- */
    const rn = r / sum, gn = g / sum, bn = b / sum;
    const exg = 2 * gn - rn - bn;
    if (exg > 0.06) {
      veg++;
      // Halka-peela hara bhi shuruaati rog ka ishara hai
      if (exg < 0.10 && r > g * 0.92) { lesionMap[p] = 1; lesion++; }
      continue;
    }

    const hsv = rgbToHsv(r, g, b);

    /* --- 2. GARM RANG: peela / narangi / bhoora --------------------------
     * Yahan DO cheezein ek jaisi dikhti hain:
     *   - rogi ya sookhi PATTI (rust narangi, blight bhoori)
     *   - aadmi ki CHAMDI (selfie)
     * Rang se inhe alag karna namumkin hai. Isliye hum dono ginte hain aur
     * faisla NEECHE texture se karte hain — patti par nasein aur dhabbe hote
     * hain, chamdi chikni hoti hai.
     *
     * (Pehle yahan chamdi ka check pehle tha, isliye SOOKHI BHOORI PATTI
     *  "selfie" maani jaati thi aur kisan ki sahi photo reject ho jaati thi.) */
    if (hsv.h >= 12 && hsv.h <= 78 && hsv.s > 0.18 && hsv.v > 0.16) {
      warmish++;
      lesionMap[p] = 1; lesion++;              // peela/narangi/bhoora = nuksan
      const looksSkin = r > 95 && g > 40 && b > 20 &&
                        (Math.max(r, g, b) - Math.min(r, g, b)) > 15 &&
                        Math.abs(r - g) > 15 && r > g && r > b &&
                        hsv.s > 0.15 && hsv.s < 0.62;
      if (looksSkin) skinLike++;
      continue;
    }

    /* --- 3. AASMAN / PAANI ----------------------------------------------- */
    if (hsv.h >= 175 && hsv.h <= 265 && hsv.s > 0.15) { sky++; continue; }

    /* --- 4. DEEWAR / KAAGAZ / SCREENSHOT (feeka rang) -------------------- */
    if (hsv.s < 0.13) { dull++; continue; }
  }

  /* --- 6. TEXTURE: patti me nasein hoti hain, chamdi/deewar chikni hoti hai */
  let edgeCount = 0, edgeTotal = 0;
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      const p = y * N + x;
      const gx = Math.abs(lum[p - 1] - lum[p + 1]);
      const gy = Math.abs(lum[p - N] - lum[p + N]);
      if (gx + gy > 22) edgeCount++;
      edgeTotal++;
    }
  }

  /* --- Patti ki DISHA (anisotropy) -------------------------------------
   * Ghaas-kul ki pattiyan (dhaan, gehu, ganna, makka) lambi aur patli hoti
   * hain — unke kinare ek hi disha me chalte hain. Chaudi pattiyan (tamatar,
   * aalu) har taraf faili hoti hain. Structure tensor se yeh naapte hain.
   * 1 ke paas = ek hi disha (ghaas), 0 ke paas = har taraf (chaudi patti).  */
  let Jxx = 0, Jyy = 0, Jxy = 0;
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      const q = y * N + x;
      const gx = (lum[q + 1] - lum[q - 1]) * 0.5;
      const gy = (lum[q + N] - lum[q - N]) * 0.5;
      Jxx += gx * gx; Jyy += gy * gy; Jxy += gx * gy;
    }
  }
  const trace = Jxx + Jyy;
  const coherence = trace > 1
    ? Math.sqrt((Jxx - Jyy) * (Jxx - Jyy) + 4 * Jxy * Jxy) / trace
    : 0;

  /* --- Nason ki DISHA ka naksha (orientation histogram) ------------------
   * Ghaas-kul (dhaan, gehu, ganna, makka, pyaz) ki pattiyan lambi-patli hoti
   * hain aur unki saari nasein EK HI disha me samanantar chalti hain.
   * Chaudi patti (seb, aam, tamatar, aalu, kapas) me beech ki mote nas se
   * shaakhaein har taraf nikalti hain — disha bikhri hui hoti hai.
   *
   * Yeh coherence se ZYADA BHAROSEMAND hai: rogi patti par daag pad jayein to
   * coherence gir jaata hai (0.54 -> 0.34), par yeh tikta hai (0.56 -> 0.42).
   * Isi liye faisla iske aadhar par liya jata hai.                          */
  const BINS = 18;
  const oh = new Float64Array(BINS);
  let ohTotal = 0;
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      const q = y * N + x;
      const gx = (lum[q + 1] - lum[q - 1]) * 0.5;
      const gy = (lum[q + N] - lum[q - N]) * 0.5;
      const mag = Math.sqrt(gx * gx + gy * gy);
      if (mag < 8) continue;                       // halke shor ko chhod do
      let ang = Math.atan2(gy, gx) * 180 / Math.PI;
      if (ang < 0) ang += 180;
      if (ang >= 180) ang -= 180;
      oh[Math.min(BINS - 1, Math.floor(ang / (180 / BINS)))] += mag;
      ohTotal += mag;
    }
  }
  let orientConc = 0;
  if (ohTotal > 1) {
    for (let i = 0; i < BINS; i++) oh[i] /= ohTotal;
    // Sabse bhaari 3 lagatar bin — ek hi disha me kitna zor hai
    for (let i = 0; i < BINS; i++) {
      const sum3 = oh[i] + oh[(i + 1) % BINS] + oh[(i + 2) % BINS];
      if (sum3 > orientConc) orientConc = sum3;
    }
  }

  /* --- Daagon ka jamaav: 12x12 khaanon me kitne khaane "rogi" hain -------
   * Bikhre hue daag (blight, spot) aur ek-samaan peelapan me farq karta hai. */
  const CELL = 8, GRID = N / CELL;
  let spotCells = 0;
  for (let cy = 0; cy < GRID; cy++) {
    for (let cx = 0; cx < GRID; cx++) {
      let hit = 0;
      for (let y = 0; y < CELL; y++) {
        const row = (cy * CELL + y) * N + cx * CELL;
        for (let x = 0; x < CELL; x++) if (lesionMap[row + x]) hit++;
      }
      if (hit / (CELL * CELL) > 0.35) spotCells++;
    }
  }

  const edges = edgeTotal ? edgeCount / edgeTotal : 0;

  /* --- 7. TEXTURE se faisla: garm rang wale pixel patti hain ya chamdi? ----
   * Patti par nasein, dhabbe, kinare hote hain -> edges zyada.
   * Chehra chikna hota hai -> edges bahut kam.                               */
  const textured = edges >= CONFIG.LEAF_GATE.LEAF_TEXTURE;
  const warmVeg = textured ? warmish / total : Math.max(0, (warmish - skinLike) / total);
  const skin    = textured ? 0 : skinLike / total;

  const f = {
    vegetation: veg / total,
    warmVeg:    warmVeg,
    warmish:    warmish / total,
    skin:       skin,
    sky:        sky / total,
    dull:       dull / total,
    dark:       dark / total,
    edges:      edges,
    textured:   textured,
  };

  /* --- NUKSAN KA SCORE ---------------------------------------------------
   * Patti ka kitna hissa rang badal chuka hai + daag kitne jamey hue hain.
   * Sehatmand patti: lagbhag poori ek-samaan hari -> damage ~0
   * Rogi patti: peele/bhoore hisse aur daag -> damage zyada                */
  const leafPixels = veg + warmish;
  f.orientConc  = orientConc;
  /* Dono milakar: 0.6 x disha ka zor + 0.4 x coherence.
     Naape gaye: ghaas 0.39–0.55 | chaudi patti 0.19–0.20 — beech me achha faasla. */
  f.grassScore  = 0.6 * orientConc + 0.4 * coherence;

  f.discoloured = leafPixels > 0 ? lesion / Math.max(leafPixels, total * 0.15) : 0;
  f.spotCells   = spotCells / (GRID * GRID);
  f.coherence   = coherence;
  f.damage      = Math.min(1, 0.7 * f.discoloured + 0.3 * f.spotCells);

  f.plantScore = (f.vegetation + 0.8 * f.warmVeg)
               - 1.5 * f.skin
               - 0.9 * f.sky
               - 0.45 * f.dull
               - 0.4 * f.dark;

  /* --- 8. Bilkul saadi satah (kapda, rangi deewar, plain background) -------
   * Rang se yeh patti jaisi lag sakti hai, par patti par HAMESHA kuch na kuch
   * bunawat hoti hai. Bilkul chapti tasveer patti nahi ho sakti.             */
  f.flat = edges < CONFIG.LEAF_GATE.MIN_EDGES;

  return f;
}

/**
 * Faisla: photo aage bhejein ya kisan ko roken.
 * @returns {object} { ok, reasonHi, tipsHi, features }
 */
/* ---------------------------------------------------------------------------
 * DHUNDHLI PHOTO KI JAANCH  (blur gate)
 *
 * KYUN
 *   Kisan ek haath se phone pakadta hai, doosre se patti — aur khet me
 *   hawa chalti hai. Photo hil jaati hai. Model phir bhi ek jawab de deta
 *   hai, aksar 80-90% "bharose" ke saath, kyunki dhundhli photo me wo
 *   dhabbe dhoondhta hai jo hain hi nahi. Kisan us jawab par dawa khareed
 *   leta hai.
 *
 *   Yeh leaf-gate se PEHLE chalti hai — dhundhli photo par leaf-gate bhi
 *   galat faisla deta hai (kinare gayab ho jate hain, sab kuch "flat"
 *   lagta hai).
 *
 * KAISE (bina kisi model ke, poori tarah offline)
 *   Laplacian ka variance. Saaf photo me pixel apne padosi se tez badalta
 *   hai (patti ki nas, dhabbe ka kinara); dhundhli me sab dheere-dheere
 *   badalta hai. Us badlav ka bikhraav (variance) hi teekhepan ka maap hai.
 *   Yeh computer vision ka jaana-mana tarika hai (Pech et-al ka
 *   "variance of Laplacian"), aur ek chhote canvas par milliseconds me
 *   chal jaata hai.
 *
 * DEHLEEZ (threshold) JAAN-BOOJHKAR DHEELI HAI
 *   Galat rokna bhi nuksan hai — kisan ki patti sach me halki dhundhli ho
 *   sakti hai aur wo phir bhi jaanch chahta hai. Isliye hum sirf SAAF-SAAF
 *   dhundhli photo rokte hain, aur wahan bhi "फिर भी जाँचें" ka rasta khula
 *   rehta hai.
 *
 * BAHUT ANDHERI PHOTO
 *   Andheri photo apne aap "dhundhli" nikal aati hai (kuch dikhta hi
 *   nahi), par kisan ko kaaran alag batana chahiye — use light chahiye,
 *   sthir haath nahi. Isliye dono alag-alag batate hain.
 * ------------------------------------------------------------------------- */

/* i18n ka chhota rasta. `T` switchView ke ANDAR bana hai, isliye yahan nahi
   milta — pehle ye code T() bulakar crash kar sakta tha. */
function tr(key, fallback) {
  if (window.kmI18n && typeof window.kmI18n.t === 'function') {
    const v = window.kmI18n.t(key);
    if (v && v !== key) return v;
  }
  return fallback;
}

const BLUR_GATE = {
  ENABLED: true,
  SIZE: 160,          // isi par Laplacian — 160x160 kaafi hai aur tez hai
  MIN_VARIANCE: 45,   // isse neeche = saaf-saaf dhundhli
  MIN_BRIGHTNESS: 32, // 0-255. isse neeche = bahut andhera
};

function measureSharpness(sourceCanvas) {
  try {
    const n = BLUR_GATE.SIZE;
    const c = document.createElement('canvas');
    c.width = n; c.height = n;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(sourceCanvas, 0, 0, n, n);
    const d = ctx.getImageData(0, 0, n, n).data;

    /* Grayscale — aankh ke hisaab se (hara sabse jyada dikhta hai) */
    const g = new Float32Array(n * n);
    let sum = 0;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      g[p] = v; sum += v;
    }
    const brightness = sum / (n * n);

    /* Laplacian kernel:  0 1 0 / 1 -4 1 / 0 1 0 — kinare se pehle wali
       ek pixel ki patti chhod dete hain. */
    let lSum = 0, lSq = 0, count = 0;
    for (let y = 1; y < n - 1; y++) {
      for (let x = 1; x < n - 1; x++) {
        const i = y * n + x;
        const lap = g[i - n] + g[i + n] + g[i - 1] + g[i + 1] - 4 * g[i];
        lSum += lap; lSq += lap * lap; count++;
      }
    }
    if (!count) return null;
    const mean = lSum / count;
    const variance = (lSq / count) - (mean * mean);
    return { variance: variance, brightness: brightness };
  } catch (_) {
    return null;                                  // jaanch na ho paye to rokte nahi
  }
}

/** Photo saaf hai? { ok } ya { ok:false, reason, titleHi, bodyHi } */
function checkPhotoQuality(canvas) {
  if (!BLUR_GATE.ENABLED) return { ok: true, skipped: true };
  const m = measureSharpness(canvas);
  if (!m) return { ok: true, skipped: true };

  console.info('[blur-gate]', { variance: m.variance.toFixed(1), brightness: m.brightness.toFixed(1) });

  if (m.brightness < BLUR_GATE.MIN_BRIGHTNESS) {
    return {
      ok: false, reason: 'dark', measure: m,
      titleHi:  tr('photo.darkTitle', 'फोटो बहुत अँधेरी है'),
      reasonHi: tr('photo.darkBody',  'इतने अँधेरे में पत्ती के धब्बे दिखते ही नहीं।'),
      tipsHi: [
        tr('photo.darkTip1', 'दिन की रोशनी में खींचिए — तेज़ धूप में नहीं, छाँव में।'),
        tr('photo.darkTip2', 'सूरज आपके पीछे हो, पत्ती पर रोशनी पड़े।'),
        tr('photo.darkTip3', 'फ़्लैश से बचिए — वह पत्ती पर सफ़ेद चमक बना देता है।'),
      ],
    };
  }
  if (m.variance < BLUR_GATE.MIN_VARIANCE) {
    return {
      ok: false, reason: 'blur', measure: m,
      titleHi:  tr('photo.blurTitle', 'फोटो धुँधली है'),
      reasonHi: tr('photo.blurBody',  'फोटो हिल गई है, इसलिए धब्बे साफ़ नहीं दिख रहे।'),
      tipsHi: [
        tr('photo.blurTip1', 'पत्ती को एक हाथ से पकड़कर स्थिर कीजिए।'),
        tr('photo.blurTip2', 'फ़ोन को पत्ती से लगभग एक बालिश्त दूर रखिए।'),
        tr('photo.blurTip3', 'खींचने से पहले एक पल रुकिए, फिर बटन दबाइए।'),
      ],
    };
  }
  return { ok: true, measure: m };
}

function checkIsPlantPhoto(canvas, precomputed) {
  if (!CONFIG.LEAF_GATE.ENABLED) return { ok: true, skipped: true };

  const f = precomputed || analyzeImageContent(canvas);
  if (!f) return { ok: true, skipped: true };        // jaanch hi na ho paye to rokna nahi

  console.info('[leaf-gate]', {
    plantScore: f.plantScore.toFixed(3), veg: f.vegetation.toFixed(2),
    warm: f.warmVeg.toFixed(2), skin: f.skin.toFixed(2), sky: f.sky.toFixed(2),
    dull: f.dull.toFixed(2), dark: f.dark.toFixed(2), edges: f.edges.toFixed(2),
    textured: f.textured, flat: f.flat,
    damage: f.damage.toFixed(3), coherence: f.coherence.toFixed(2),
  });

  const G = CONFIG.LEAF_GATE;
  let reasonHi = null, tipsHi = [];

  if (f.dark > G.MAX_DARK) {
    reasonHi = 'फोटो बहुत अँधेरी है — पत्ती साफ़ दिख ही नहीं रही।';
    tipsHi = ['दिन की रोशनी में, छाँव में फोटो लें', 'फ्लैश की जगह प्राकृतिक रोशनी बेहतर है'];
  } else if (f.skin > G.MAX_SKIN && f.edges < 0.30) {
    reasonHi = 'यह किसी व्यक्ति की फोटो लग रही है, पत्ती की नहीं।';
    tipsHi = ['कैमरा पत्ती की तरफ करें', 'पत्ती को हाथ या सादे कागज़ पर रखकर फोटो लें'];
  } else if (f.sky > G.MAX_SKY) {
    reasonHi = 'फोटो में ज़्यादातर आसमान या पानी दिख रहा है।';
    tipsHi = ['कैमरा नीचे करके सीधे पत्ती पर लाएँ', 'पत्ती 15–20 सें.मी. दूर से लें'];
  } else if (f.dull > G.MAX_DULL) {
    reasonHi = 'फोटो में पत्ती जैसा कुछ नहीं मिला (दीवार, कागज़ या स्क्रीनशॉट लग रहा है)।';
    tipsHi = ['असली पत्ती की फोटो लें, स्क्रीन से खींची हुई नहीं', 'बैकग्राउंड सादा रखें पर पत्ती पूरी फ्रेम में हो'];
  } else if (f.flat) {
    reasonHi = 'फोटो में कोई बनावट नहीं दिखी — यह सादी सतह (कपड़ा, दीवार या रंग) लग रही है।';
    tipsHi = ['असली पत्ती की फोटो लें', 'पत्ती की नसें और धब्बे साफ़ दिखने चाहिए', 'फोटो हिली हुई न हो'];
  } else if (f.plantScore < G.MIN_SCORE) {
    reasonHi = 'इस फोटो में पौधे या पत्ती जैसा कुछ नहीं दिखा।';
    tipsHi = [
      'एक ही पत्ती को फ्रेम में भरकर लें',
      'छाँव की साफ़ रोशनी में, कैमरा 15–20 सें.मी. दूर',
      'फोटो हिली हुई न हो',
    ];
  }

  return { ok: !reasonHi, reasonHi: reasonHi, tipsHi: tipsHi, features: f };
}


/* ============================================================================
 * SECTION 7 — PREPROCESSING + PREDICTION
 *
 * Teachable Machine (MobileNet) jo expect karta hai:
 *   1. Image ko center se SQUARE crop karo (TM ka capture bhi yahi karta hai)
 *   2. 224 x 224 par resize karo
 *   3. [0,255] ko [-1,1] par le jao  ->  (px / 127.5) - 1
 *   4. Batch dimension lagao -> [1, 224, 224, 3]
 * ========================================================================= */

function cropToSquareCanvas(img, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const w = img.naturalWidth, h = img.naturalHeight;
  const side = Math.min(w, h);
  ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
  return canvas;
}

function preprocess(canvas) {
  return tf.tidy(() => {
    const pixels = tf.browser.fromPixels(canvas);   // [size,size,3] 0..255
    // Quantized .tflite seedha uint8 (0..255) leta hai; TFJS wala Teachable
    // Machine model [-1, 1] float chahta hai. Galat wala bheja to predict() phatta hai.
    if (state.inputDType === 'int32') return pixels.toInt().expandDims(0);
    return pixels.toFloat().div(127.5).sub(1).expandDims(0);
  });
}

/** TM softmax deta hai; koi custom export raw logits de to hum khud softmax lagate hain. */
function toProbabilities(rawValues) {
  const arr = Array.from(rawValues);
  const sum = arr.reduce((a, b) => a + b, 0);
  const inRange = arr.every((v) => v >= -0.0001 && v <= 1.0001);
  if (inRange && Math.abs(sum - 1) < 0.02) return arr;

  // Quantized .tflite ka softmax output uint8 (0..255) me aata hai aur sum ~255
  // hota hai. Ispar softmax lagana galat hai (har baar 100% confidence dikhega) —
  // sirf sum se divide karna sahi probability deta hai.
  if (sum > 1.02 && arr.every((v) => v >= 0)) return arr.map((v) => v / sum);

  const max = Math.max.apply(null, arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const expSum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / expSum);
}

function recognitionGate(results) {
  const top = results[0];
  if (!top || !results.length) return { ok: false, reason: 'no_prediction' };
  const entropy = -results.reduce((sum, item) => {
    const p = Math.max(item.prob, 1e-12);
    return sum + p * Math.log(p);
  }, 0) / Math.log(results.length);
  const ok = !CONFIG.OOD.ENABLED ||
    (top.prob >= CONFIG.OOD.MIN_TOP_CONFIDENCE && entropy <= CONFIG.OOD.MAX_NORMALIZED_ENTROPY);
  return { ok, top, entropy };
}

async function runPrediction() {
  if (state.isPredicting) return;
  if (!state.model) {
    showError('मॉडल अभी तैयार नहीं है, कृपया कुछ सेकंड रुकें।',
              'The model is not ready yet. Please wait a few seconds.');
    return;
  }
  if (!state.imageEl) {
    showError('पहले फोटो लें या चुनें।',
              'Please take or choose a photo first.');
    return;
  }

  state.isPredicting = true;
  hide(el.resultWrap);
  hide(el.errorBanner);
  show(el.loadingBox);
  stopSpeaking();

  // Spinner ko paint hone ka mauka do.
  // NOTE: requestAnimationFrame use NAHI karte — background tab me wo chalta hi
  // nahi aur prediction hamesha ke liye atak jaati hai.
  await new Promise((r) => setTimeout(r, 60));

  let inputTensor = null, output = null;

  try {
    const canvas = cropToSquareCanvas(state.imageEl, state.inputSize);

    /* Photo ka vishleshan EK HI BAAR — leaf-gate, health-check aur crop-match
       teeno isi ka istemal karte hain. */
    state.imageFeatures = analyzeImageContent(canvas);

    /* ---- PEHLE: kya yeh photo patti/paudhe ki hai? ----------------------
     * Model closed-set hai — bina is jaanch ke wo deewar par bhi "rog" bata
     * dega. Kisan ne "फिर भी जाँचें" dabaya ho to yeh jaanch chhod dete hain. */
    if (!state.forceScan) {
      /* ---- SABSE PEHLE: photo saaf bhi hai? ----------------------------
       * Dhundhli ya andheri photo par leaf-gate bhi galat faisla deta hai
       * (kinare gayab, sab kuch "flat"), aur model to 85% bharose ke saath
       * koi bhi rog bata deta hai. Isliye jaanch yahin, sabse upar. */
      const q = checkPhotoQuality(canvas);
      if (!q.ok) {
        showNotPlant(q);
        /* Kisan aksar padhta nahi — isliye kaaran bola bhi jata hai, usi
           bhasha me jo usne chuni hai. */
        try { speakText(q.reasonHi + ' ' + (q.tipsHi || [])[0], null, null); } catch (_) {}
        return;
      }

      const gate = checkIsPlantPhoto(canvas, state.imageFeatures);
      if (!gate.ok) {
        showNotPlant(gate);
        try { speakText(gate.titleHi + '. ' + (gate.reasonHi || ''), null, null); } catch (_) {}
        return;                                  // finally saaf-safai kar dega
      }

      /* ---- DOOSRI JAANCH: kya yeh USI fasal ki patti hai jo chuni gayi? ----
       * Har model closed-set hai — seb chunkar ganne ki photo daalo to seb ka
       * model use bhi kisi seb ke rog me daal dega, 90% bharose ke saath.
       * Isliye model chalane se PEHLE hi rok dete hain.                     */
      if (CONFIG.CROP_MATCH.BLOCK) {
        const cropGate = checkCropFamily(state.imageFeatures);
        if (cropGate) {
          console.info('[crop-match] roka —', 'grassScore',
                       state.imageFeatures.grassScore.toFixed(3),
                       '| chuni fasal', state.cropId);
          showNotPlant(cropGate);
          return;
        }
      }
    }
    /* "फिर भी जाँचें" ek baar ki chhoot hai. Use yahan padh kar rakh lete hain,
       kyunki neeche recognitionGate() ko bhi yahi chhoot chahiye — warna kisan
       "फिर भी जाँचें" dabata tha, patti-jaanch to bypass ho jaati thi, par OOD
       gate use phir bhi rok deta tha aur nikalne ka koi rasta nahi bachta tha. */
    const scanAnyway = state.forceScan;
    state.forceScan = false;                     // ek baar ka chhoot, agli photo par phir jaanch

    inputTensor = preprocess(canvas);

    output = state.model.predict(inputTensor);
    const outTensor = Array.isArray(output) ? output[0] : output;
    const probs = toProbabilities(await outTensor.data());

    if (probs.length !== state.labels.length) {
      console.warn('[predict] model ne', probs.length, 'classes di, labels', state.labels.length);
    }

    const results = probs
      .map((p, i) => ({ label: state.labels[i] || ('Class ' + i), prob: p, index: i }))
      .sort((a, b) => b.prob - a.prob);

    /* ---- TEESRI JAANCH: model khud kitna pakka hai? --------------------
     * Do cheezein dekhte hain (CONFIG.OOD me):
     *   1. sabse upar wale jawab ka bharosa  >= MIN_TOP_CONFIDENCE
     *   2. normalized entropy               <= MAX_NORMALIZED_ENTROPY
     * Entropy batati hai ki model ka jawab "chapta" to nahi — yaani sab
     * classes lagbhag barabar. Aisa tab hota hai jab photo model ke liye
     * bilkul anjaan (out-of-distribution) ho. Sirf confidence dekhna kaafi
     * nahi, kyunki closed-set model kisi bhi photo par ek class chun hi leta hai. */
    const recognition = recognitionGate(results);
    if (!recognition.ok && !scanAnyway) {
      console.info('[ood] roka — top', (recognition.top && recognition.top.prob || 0).toFixed(3),
                   '| entropy', (recognition.entropy || 0).toFixed(3));
      state.unified = unifyRejected('low_confidence',
        'फसल की पहचान नहीं हो पाई — कृपया पत्ती की साफ, नज़दीक की फोटो लें।',
        'Crop not recognized', 'device');
      showNotPlant({
        reasonHi: 'यह फोटो चुनी हुई फसल की साफ पहचान वाली फोटो नहीं लगती। कृपया पत्ती की नज़दीक और साफ फोटो लें।',
        reasonEn: 'This photo is not a confident match for the selected crop. Please take a clear, close photo of the leaf.'
      });
      return;
    }

    console.table(results.map((r) => ({ label: r.label, confidence: pct(r.prob, 2) })));

    // History me wahi jaye jo kisan ko dikhaya gaya (health-check ke baad wala),
    // warna "swasth" dikhakar history me "रतुआ" likh dena galat hoga.
    const finalTop = renderResults(results);

    /* Phone ke model ka jawab samaan shakl me — baaki features (awaaz,
       notification, report) isi ko padhte hain, kachche results ko nahi. */
    state.unified = unifyFromDevice(finalTop || results[0], results);
    console.info('[unified:device]', state.unified.recognized
      ? state.unified.disease + ' @ ' + pct(state.unified.confidence, 1)
      : 'NOT RECOGNIZED (' + state.unified.reason + ')');

    saveToHistory(finalTop || results[0]);

    // Offline jawab dikh chuka hai. Ab (agar internet hai) bade AI se dobara
    // jaanch karate hain — UI rukti nahi, jawab aate hi card update ho jata hai.
    runOnlineDoubleCheck(results);

    // Kisan ne chalu kiya ho to yeh jaanch krishi vibhag ko bhi bhej do
    // (chup-chaap — fail ho to bhi app par koi asar nahi).
    reportScanToDept(finalTop || results[0]);
  } catch (err) {
    console.error('[predict] error:', err);
    showError(
      'जाँच नहीं हो पाई। कृपया दूसरी फोटो से कोशिश करें। तकनीकी विवरण: ' + err.message,
      'The check could not be completed. Please try another photo. ' +
      'Technical detail: ' + err.message,
      'जाँच विफल / Prediction failed'
    );
  } finally {
    // Tensors free karna zaroori hai warna GPU memory bhar jaati hai
    if (inputTensor) inputTensor.dispose();
    if (output) Array.isArray(output) ? output.forEach((t) => t.dispose()) : output.dispose();
    hide(el.loadingBox);
    state.isPredicting = false;
    renderBatchTray();
  }
}


/* ============================================================================
 * SECTION 7A — SAMAAN JAWAB (unified result shape)
 *
 * SAMASYA: do alag-alag jagah se jawab aata hai —
 *   1. phone ka apna model (offline)   -> { label, prob } ki list
 *   2. bada AI (online)                -> { label, confidence, evidence, ... }
 * Dono ki shakl alag hai. Isse har naya feature (voice, notification, admin
 * report) ko dono ka alag-alag hisaab rakhna padta hai — aur wahin galti hoti hai.
 *
 * HAL: dono ko EK HI shakl me badal dete hain. UI ko isse koi farq nahi padta
 * (wo pehle jaisa hi chalta hai) — yeh bas ek saaf contract hai jise baaki
 * features seedha use kar sakte hain:
 *
 *   {
 *     recognized : true/false     // false = "Crop not recognized"
 *     reason     : 'ok' | 'not_plant' | 'wrong_crop' | 'unclear' | 'low_confidence'
 *     message    : English sandesh   (recognized=false hone par)
 *     messageHi  : wahi Hindi me
 *     disease    : 'Rice_Blast'   (label id — recognized=false par '')
 *     diseaseHi  : 'झोंका रोग'
 *     diseaseEn  : 'Rice Blast'
 *     confidence : 0.0 - 1.0
 *     treatment  : { actions[], organic[], chemical[], prevention[] }
 *     source     : 'device' (phone ka model) | 'cloud' (bada AI)
 *     evidence   : AI ne photo me kya dekha (sirf cloud se aata hai)
 *   }
 *
 * Aakhri jawab hamesha state.unified me milta hai.
 * ========================================================================= */

/** Khali dhancha — har field hamesha maujood rehti hai, undefined kabhi nahi. */
function emptyUnified() {
  return {
    recognized: false, reason: 'unclear',
    message: 'Crop not recognized', messageHi: 'फसल की पहचान नहीं हो पाई',
    disease: '', diseaseHi: '', diseaseEn: '',
    confidence: 0,
    treatment: { actions: [], organic: [], chemical: [], prevention: [] },
    source: 'device', evidence: '',
    /* Model ke top-5 jawab. Cloud path me yeh khali rehta hai, par field
       HAMESHA maujood rehti hai — dono ki shakl bilkul ek jaisi honi chahiye,
       warna baaki code ko har baar `if (u.all)` likhna padta. */
    all: [],
  };
}

/** Label se ilaaj ki jaankari nikaalta hai (wahi ADVISORY jo card me dikhti hai). */
function treatmentFor(label) {
  const a = getAdvisory(label) || {};
  return {
    actions:    Array.isArray(a.actions)    ? a.actions.slice()    : [],
    organic:    Array.isArray(a.organic)    ? a.organic.slice()    : [],
    chemical:   Array.isArray(a.chemical)   ? a.chemical.slice()   : [],
    prevention: Array.isArray(a.prevention) ? a.prevention.slice() : [],
  };
}

/**
 * Jab photo hi pehchani na gayi ho (patti nahi hai / dusri fasal / dhundhli /
 * model ka bharosa kam) — tab yeh banta hai.
 * @param {string} reason  'not_plant' | 'wrong_crop' | 'unclear' | 'low_confidence'
 */
function unifyRejected(reason, messageHi, messageEn, source) {
  const u = emptyUnified();
  u.reason = reason || 'unclear';
  u.source = source || 'device';
  if (messageHi) u.messageHi = messageHi;
  if (messageEn) u.message = messageEn;
  return u;
}

/** Phone ke apne model ka jawab -> samaan shakl. */
function unifyFromDevice(top, allResults) {
  if (!top) return unifyRejected('unclear', null, null, 'device');

  const a = getAdvisory(top.label) || {};
  const conf = Number(top.prob) || 0;
  const u = emptyUnified();

  u.recognized = conf >= CONFIG.CONFIDENCE_THRESHOLD;
  u.reason     = u.recognized ? 'ok' : 'low_confidence';
  u.source     = 'device';
  u.confidence = conf;
  u.disease    = top.label || '';
  u.diseaseHi  = a.nameHi || '';
  u.diseaseEn  = a.nameEn || '';
  u.treatment  = treatmentFor(top.label);

  if (!u.recognized) {
    u.message   = 'Crop not recognized';
    u.messageHi = 'फसल की पहचान नहीं हो पाई';
  }
  u.all = (allResults || []).slice(0, 5).map((r) => ({ label: r.label, prob: r.prob }));
  return u;
}

/** Bade AI ka jawab -> bilkul wahi shakl. */
function unifyFromCloud(ai) {
  if (!ai || !ai.ok || !ai.label) {
    return unifyRejected('unclear', null, null, 'cloud');
  }
  if (ai.label === 'not_plant') {
    return unifyRejected('not_plant',
      'यह फोटो किसी पौधे या पत्ती की नहीं लगती।',
      'Crop not recognized: this photo does not show a plant.', 'cloud');
  }
  if (ai.label === 'wrong_crop') {
    return unifyRejected('wrong_crop',
      'यह चुनी हुई फसल की फोटो नहीं लगती।',
      'Crop not recognized: this is a different crop than the one selected.', 'cloud');
  }
  if (ai.label === 'unclear') {
    return unifyRejected('unclear',
      'फोटो साफ नहीं है — कृपया नज़दीक से दोबारा लें।',
      'Crop not recognized: the photo is not clear enough.', 'cloud');
  }

  const a = getAdvisory(ai.label) || {};
  const u = emptyUnified();
  u.recognized = true;
  u.reason     = 'ok';
  u.source     = 'cloud';
  u.confidence = Number(ai.confidence) || 0;
  u.disease    = ai.label;
  u.diseaseHi  = a.nameHi || '';
  u.diseaseEn  = a.nameEn || '';
  u.treatment  = treatmentFor(ai.label);
  u.evidence   = ai.evidenceHi || ai.evidence || '';
  return u;
}


/* ============================================================================
 * SECTION 7B — ONLINE AI DOUBLE-CHECK
 *
 * SOCH (yeh sabse zaroori hissa hai):
 *   Phone wala offline model chhota hota hai — turant jawab deta hai par galti
 *   bhi karta hai. Internet ho to hum usi photo ko ek bade AI (vision model) se
 *   dobara jaanchte hain aur dono ke jawab milaate hain.
 *
 *   1. OFFLINE model pehle chalta hai  -> jawab TURANT dikh jata hai (0 sec wait)
 *   2. Agar internet hai              -> peeche-peeche /api/diagnose call hota hai
 *   3. AI ka jawab aate hi card update hota hai:
 *        dono same    -> "AI ne bhi yahi bataya" (bharosa badh gaya)
 *        alag         -> AI wali salah dikhati hai, offline wala jawab bhi saath
 *        photo saaf nahi -> dobara photo lene ko kehta hai
 *
 *   Internet na ho, ya kisan "ऑफ़लाइन" mode chune -> step 2-3 hote hi nahi.
 *   Yani app kabhi rukti nahi, sirf accha ho jati hai jab network ho.
 *
 * API KEY YAHAN NAHI HAI — wo server par hai (api/diagnose.js dekhein).
 * ========================================================================= */

const NET_MODES = ['auto', 'online', 'offline'];

function loadNetMode() {
  try {
    const m = localStorage.getItem(AI_CONFIG.MODE_KEY);
    if (NET_MODES.indexOf(m) !== -1) return m;
  } catch (_) {}
  return AI_CONFIG.DEFAULT_MODE;
}

function setNetMode(mode) {
  if (NET_MODES.indexOf(mode) === -1) return;
  state.netMode = mode;
  try { localStorage.setItem(AI_CONFIG.MODE_KEY, mode); } catch (_) {}
  renderNetMode();
}

/** 2G / "data bachao" mode — aise me online call karna kisan ka data barbaad karna hai. */
function connectionIsSlow() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) return false;
  if (c.saveData) return true;
  return ['slow-2g', '2g'].indexOf(c.effectiveType) !== -1;
}

/** Abhi online AI se poochh sakte hain ya nahi. */
function onlineAiUsable() {
  if (state.netMode === 'offline') return false;
  if (!navigator.onLine) return false;
  if (state.aiConfigured === false) return false;      // server par key nahi lagi
  if (state.netMode === 'online') return true;
  return !connectionIsSlow();                          // 'auto'
}

/** Segmented buttons + status line update. */
function renderNetMode() {
  if (el.netModeGroup) {
    Array.from(el.netModeGroup.querySelectorAll('.seg__btn')).forEach((b) => {
      const on = b.dataset.mode === state.netMode;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  if (!el.netModeNote) return;

  let txt;
  if (state.netMode === 'offline') {
    txt = 'सिर्फ फ़ोन का मॉडल। इंटरनेट बिल्कुल नहीं लगेगा।';
  } else if (state.aiReason === 'no_api') {
    txt = 'यह लोकल सर्वर है, यहाँ ऑनलाइन AI नहीं चलता। Vercel वाले लिंक पर चलेगा।';
  } else if (state.aiConfigured === false) {
    // NOTE (team ke liye): yahan jaan-boojhkar kisi service ka naam nahi likha.
    // Kisan ko bas itna pata hona chahiye ki online jaanch abhi band hai.
    // Key kahan lagti hai, wo README aur api/diagnose.js ke comment me likha hai.
    txt = 'ऑनलाइन जाँच अभी उपलब्ध नहीं है। फ़ोन का अपना मॉडल पहले जैसा काम करेगा।';
  } else if (!navigator.onLine) {
    txt = 'इंटरनेट नहीं है, अभी ऑफ़लाइन मॉडल से ही जाँच होगी।';
  } else if (state.netMode === 'online') {
    txt = 'हर जाँच ऑनलाइन AI से दोबारा जाँची जाएगी (सबसे सटीक)।';
  } else {
    txt = 'नेटवर्क अच्छा हो तो ऑनलाइन AI से डबल-चेक, वरना सीधे ऑफ़लाइन मॉडल।';
  }
  el.netModeNote.textContent = txt;
}

/**
 * Photo ko API ke liye chhota JPEG bana do.
 * Poori photo bhejte hain (square crop nahi) — bade AI ko aas-paas ka context
 * dekhne se pehchaan behtar hoti hai. 640px kaafi hai aur data bhi kam lagta hai.
 */
function imageToJpegDataUrl(img, maxSide, quality) {
  const w = img.naturalWidth, h = img.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);              // PNG transparency kaali na ho jaye
  ctx.drawImage(img, 0, 0, cw, ch);
  return c.toDataURL('image/jpeg', quality);
}

/**
 * Server se poochho ki online mode chaalu hai ya nahi (key lagi hai ya nahi).
 * Yeh sirf ek chhota GET hai — photo kahin nahi jaati.
 */
async function checkAiEndpoint() {
  if (!navigator.onLine) { state.aiConfigured = null; return; }
  try {
    const res = await fetch(AI_CONFIG.ENDPOINT, { method: 'GET', cache: 'no-store' });
    if (res.status === 404) {
      // Local server (python http.server) par API function hota hi nahi
      state.aiConfigured = false;
      state.aiReason = 'no_api';
      console.info('[ai] /api/diagnose nahi mila — online mode sirf Vercel par chalega');
    } else if (res.ok) {
      const data = await res.json();
      state.aiConfigured = Boolean(data && data.configured);
      // Server ab engine ke naam nahi bhejta (dekhein api/diagnose.js) —
      // sirf ginti. Client ko isse zyada kuch chahiye bhi nahi.
      state.aiEngines = (data && data.engines) || 0;
      state.aiReason = state.aiConfigured ? null : 'no_key';
      console.info('[ai] online mode:', state.aiConfigured ? 'ON' : 'key missing',
                   state.aiEngines);
    } else {
      state.aiConfigured = false;
      state.aiReason = 'error';
    }
  } catch (err) {
    state.aiConfigured = null;                 // pata nahi — jaanch ke waqt try kar lenge
    console.warn('[ai] health check fail:', err.message);
  }
  renderNetMode();
  renderOfflineManager();
}

/** Asli call — photo + offline model ka top-3 server ko bhejta hai. */
async function askOnlineAI(results) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_CONFIG.TIMEOUT_MS);

  try {
    const image = imageToJpegDataUrl(
      state.imageEl, AI_CONFIG.IMAGE_MAX_SIDE, AI_CONFIG.IMAGE_QUALITY
    );

    const res = await fetch(AI_CONFIG.ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: image,
        crop: state.cropId,
        labels: state.labels,
        localTop: results.slice(0, 3).map((r) => ({ label: r.label, prob: r.prob })),
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.ok) {
      return { ok: false, error: (data && data.error) || ('http_' + res.status),
               messageHi: data && data.messageHi };
    }
    return data;
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    return { ok: false, error: aborted ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------------------------
 * AI verdict card — result ke sabse upar dikhta hai.
 * ------------------------------------------------------------------------- */
function renderAiCard(kind, data) {
  if (!el.aiCard || !el.aiHost) return;

  if (!kind) { hide(el.aiCard); el.aiHost.innerHTML = ''; return; }

  el.aiCard.className = 'card ai-card ai-card--' + kind;
  let html = '';

  if (kind === 'pending') {
    html = [
      '<div class="ai-row">',
        '<span class="spinner spinner--sm" aria-hidden="true"></span>',
        '<div><p class="ai-title">ऑनलाइन AI से दोबारा जाँच हो रही है…</p>',
        '<p class="ai-sub">नीचे दिखा नतीजा फ़ोन के मॉडल का है — कुछ सेकंड में पक्का हो जाएगा।</p></div>',
      '</div>',
    ].join('');

  } else if (kind === 'agree') {
    const a = getAdvisory(data.label);
    html = [
      '<div class="ai-row">',
        '<span class="ai-emoji" aria-hidden="true">', icon('check'), '</span>',
        '<div>',
          '<p class="ai-title">ऑनलाइन AI ने भी यही बताया — ', escapeHtml(a.nameHi), '</p>',
          '<p class="ai-sub">फ़ोन का मॉडल और ऑनलाइन AI दोनों सहमत हैं, इसलिए इस नतीजे पर ज़्यादा भरोसा करें।</p>',
          data.evidenceHi ? '<p class="ai-ev">' + icon('eye', 'ic ic--xs') + ' ' + escapeHtml(data.evidenceHi) + '</p>' : '',
        '</div>',
      '</div>',
      /* Pehle yahan asli model ka naam (jaise 'google/gemma-4-31b-it:free')
         dikhta tha. Kisan ke liye wo bekaar hai aur hamara andaruni intezaam
         bahar nahi jana chahiye — isliye ab sirf itna likhte hain. */
      '<p class="ai-model">उन्नत ऑनलाइन जाँच से पुष्टि</p>',
    ].join('');

  } else if (kind === 'differ') {
    const ai = getAdvisory(data.label);
    const loc = getAdvisory(data.localLabel);
    html = [
      '<div class="ai-row">',
        '<span class="ai-emoji" aria-hidden="true">', icon('globe'), '</span>',
        '<div>',
          '<p class="ai-title">ऑनलाइन AI की राय अलग है — ', escapeHtml(ai.nameHi), '</p>',
          '<p class="ai-sub">नीचे दी गई सलाह अब <strong>ऑनलाइन AI</strong> के नतीजे की है, ',
            'क्योंकि वह फ़ोन के छोटे मॉडल से ज़्यादा सटीक होता है।</p>',
          data.evidenceHi ? '<p class="ai-ev">' + icon('eye', 'ic ic--xs') + ' ' + escapeHtml(data.evidenceHi) + '</p>' : '',
          '<p class="ai-alt">फ़ोन के मॉडल ने कहा था: <strong>', escapeHtml(loc.nameHi),
            '</strong> — दोनों में शक हो तो पत्ती की एक और साफ फोटो लें, या KVK से पूछें।</p>',
        '</div>',
      '</div>',
      /* Pehle yahan asli model ka naam (jaise 'google/gemma-4-31b-it:free')
         dikhta tha. Kisan ke liye wo bekaar hai aur hamara andaruni intezaam
         bahar nahi jana chahiye — isliye ab sirf itna likhte hain. */
      '<p class="ai-model">उन्नत ऑनलाइन जाँच से पुष्टि</p>',
    ].join('');

  } else if (kind === 'wrongcrop') {
    html = [
      '<div class="ai-row">',
        '<span class="ai-emoji" aria-hidden="true">', icon('sprout'), '</span>',
        '<div>',
          '<p class="ai-title">यह ', escapeHtml(data.cropHi || 'चुनी हुई फसल'),
            ' की फोटो नहीं है</p>',
          '<p class="ai-sub">ऑनलाइन AI ने पहचाना कि फोटो में कोई दूसरी फसल है। ',
            'इसलिए ', escapeHtml(data.cropHi || ''), ' का रोग बताना गलत होता — ',
            'सलाह रोक दी गई है।</p>',
          data.evidenceHi ? '<p class="ai-ev">' + icon('eye', 'ic ic--xs') + ' ' + escapeHtml(data.evidenceHi) + '</p>'
            : (data.evidence ? '<p class="ai-ev">' + icon('eye', 'ic ic--xs') + ' ' + escapeHtml(data.evidence) + '</p>' : ''),
          '<p class="ai-alt">साइडबार में <strong>"फसल चुनें"</strong> से सही फसल चुनकर ',
            'दोबारा जाँचें।</p>',
        '</div>',
      '</div>',
      /* Pehle yahan asli model ka naam (jaise 'google/gemma-4-31b-it:free')
         dikhta tha. Kisan ke liye wo bekaar hai aur hamara andaruni intezaam
         bahar nahi jana chahiye — isliye ab sirf itna likhte hain. */
      '<p class="ai-model">उन्नत ऑनलाइन जाँच से पुष्टि</p>',
    ].join('');

  } else if (kind === 'unclear') {
    html = [
      '<div class="ai-row">',
        '<span class="ai-emoji" aria-hidden="true">', icon('search'), '</span>',
        '<div>',
          '<p class="ai-title">ऑनलाइन AI फोटो से पक्का नहीं बता पाया</p>',
          '<p class="ai-sub">कृपया छाँव की साफ रोशनी में, पत्ती को पूरे फ्रेम में लेकर एक और फोटो लें।</p>',
          data.evidenceHi ? '<p class="ai-ev">' + icon('eye', 'ic ic--xs') + ' ' + escapeHtml(data.evidenceHi) + '</p>' : '',
        '</div>',
      '</div>',
    ].join('');

  } else if (kind === 'fail') {
    html = [
      '<div class="ai-row">',
        '<span class="ai-emoji" aria-hidden="true">', icon('wifi-off'), '</span>',
        '<div>',
          '<p class="ai-title">ऑनलाइन जाँच नहीं हो पाई</p>',
          '<p class="ai-sub">', escapeHtml(data && data.messageHi
            ? data.messageHi
            : 'नेटवर्क या फ्री-मॉडल की सीमा की वजह से। नीचे फ़ोन के मॉडल का नतीजा दिखाया गया है।'),
          '</p>',
        '</div>',
      '</div>',
    ].join('');
  }

  el.aiHost.innerHTML = html;
  show(el.aiCard);
}

/** AI ka jawab lekar result card ko update karta hai. */
function applyAiVerdict(ai, results) {
  /* Bade AI ka jawab bhi bilkul usi shakl me — UI pehle jaisa hi chalta hai,
     bas state.unified ab cloud wala (zyada bharosemand) jawab rakhta hai. */
  if (ai && ai.ok) state.unified = unifyFromCloud(ai);
  state.aiResult = ai;

  if (!ai || !ai.ok) { renderAiCard('fail', ai); return; }

  /* Online AI ne kaha yeh paudha hai hi nahi -> offline model ka jawab hata do.
     Yeh leaf-gate ki doosri, zyada pakki parat hai. */
  if (ai.label === 'not_plant') {
    showNotPlant({
      reasonHi: 'ऑनलाइन AI ने भी कहा कि इस फोटो में पौधा या पत्ती नहीं है' +
                (ai.evidenceHi ? ' — ' + ai.evidenceHi : '.'),
      tipsHi: [
        'सिर्फ पत्ती या पौधे की फोटो लें',
        'पत्ती को फ्रेम में पूरा भरें, 15–20 सें.मी. दूर से',
        'छाँव की साफ़ रोशनी में फोटो लें',
      ],
    });
    return;
  }

  /* Online AI ne kaha yeh dusri fasal hai — ganne ki jagah dhaan wagairah.
     Yeh "ganne me sirf ganna" wali maang ka sabse pakka jawab hai, kyunki
     shakal-rang se dhaan aur gehu me farq karna offline sambhav nahi. */
  if (ai.label === 'wrong_crop') {
    const crop = activeCrop();
    renderAiCard('wrongcrop', Object.assign({}, ai, { cropHi: crop ? cropName(crop.id) : '' }));
    hide(el.advisoryCard);
    hide(el.lowConfidenceBox);
    el.advisoryHost.innerHTML = '';
    const sc = el.scoresList && el.scoresList.closest('.card');
    if (sc) sc.hidden = true;
    state.lastResult = null;
    if (state.history.length) {          // galat fasal ki entry history me na rahe
      state.history.shift();
      persistHistory(); renderRecent(); renderHistory(); updateHistoryBadge();
    }
    return;
  }

  if (ai.label === 'unclear') {
    renderAiCard('unclear', ai);
    return;
  }

  const localTop = results[0];

  /* Dono same -> sirf bharosa badhao */
  if (ai.label === localTop.label) {
    renderAiCard('agree', ai);
    // Offline model ka score kam tha par AI sehmat hai -> ab salah dikha do
    if (!state.lastResult || !state.lastResult.confident) {
      showAdvisoryFor(ai.label, Math.max(localTop.prob, ai.confidence), 'ai');
    }
    return;
  }

  /* Alag jawab -> AI ko maano (accuracy hi maqsad hai), par dono dikhao */
  renderAiCard('differ', ai);
  showAdvisoryFor(ai.label, ai.confidence, 'ai');
  updateLastHistoryEntry(ai.label, ai.confidence);
}

/** Advisory card ko kisi bhi label par set karna (offline ya AI, dono ke liye). */
function showAdvisoryFor(label, prob, source) {
  state.lastResult = { label: label, prob: prob, confident: true, source: source || 'local' };
  hide(el.lowConfidenceBox);
  show(el.advisoryCard);
  el.advisoryHost.innerHTML = buildAdvisoryHtml(label, { prob: prob, speakId: 'speakResult' });
  wireSpeakButton($('#speakResult'), el.advisoryHost.querySelector('.adv'));
}

/** History me sabse upar wali entry ko AI ke jawab se sudhar do. */
function updateLastHistoryEntry(label, prob) {
  if (!state.history.length) return;
  state.history[0].label = label;
  state.history[0].prob = prob;
  state.history[0].confident = true;
  state.history[0].source = 'ai';
  persistHistory();
  renderRecent();
  renderHistory();
}

/** runPrediction ke baad chalta hai — UI ko block nahi karta. */
async function runOnlineDoubleCheck(results) {
  if (!onlineAiUsable()) { renderAiCard(null); return; }
  if (!state.imageEl) return;

  state.aiBusy = true;
  renderAiCard('pending');

  const ai = await askOnlineAI(results);

  // Beech me kisan ne nayi photo daal di ho to purana jawab mat lagao
  if (!state.isPredicting && state.imageEl) applyAiVerdict(ai, results);
  state.aiBusy = false;
}


/* ============================================================================
 * SECTION 8 — RENDERING
 * ========================================================================= */

/**
 * Smart Advisory card ka HTML.
 * @param {string} label   class label, e.g. 'Rice_Blast'
 * @param {object} opts    { prob, speakId, compact }
 */
function buildAdvisoryHtml(label, opts) {
  const a = getAdvisory(label);
  const o = opts || {};
  const bullets = (items) =>
    (items && items.length)
      ? '<ul>' + items.map((t) => '<li>' + escapeHtml(t) + '</li>').join('') + '</ul>'
      : '<p class="muted-sm">—</p>';

  return [
    '<div class="adv">',

      '<div class="adv__top">',
        '<span class="adv__icon">', icon('leaf'), '</span>',
        '<div class="adv__titles">',
          '<div class="adv__name">',
            '<h3>', escapeHtml(a.nameHi), '</h3>',
            '<span class="risk risk--', escapeHtml(a.risk || 'unknown'), '">',
              escapeHtml(a.riskHi || ''), '</span>',
          '</div>',
          '<p class="adv__en">', escapeHtml(a.nameEn), ' · ', escapeHtml(a.pathogen), '</p>',
        '</div>',
        (typeof o.prob === 'number'
          ? '<div class="adv__conf"><b>' + pct(o.prob, 0) + '</b><span>CONFIDENCE</span></div>'
          : ''),
      '</div>',

      '<p class="adv__desc">', escapeHtml(a.symptoms), '</p>',

      (a.note ? '<p class="adv__note">' + escapeHtml(a.note) + '</p>' : ''),

      '<div class="adv__cols">',
        '<div class="adv__acts">',
          '<h4>Recommended Actions / तुरंत करें</h4>',
          '<ul class="act-list">',
            (a.actions || []).map((t) =>
              '<li>' + icon('check') + '<span>' + escapeHtml(t) + '</span></li>').join(''),
          '</ul>',
        '</div>',
        '<div class="adv__acts">',
          '<h4>सुनें / Listen in Hindi</h4>',
          '<button type="button" class="speak-btn" id="', escapeHtml(o.speakId || 'speakBtn'), '"',
            ' data-label="', escapeHtml(label), '" data-speaking="false">',
            icon('speaker'), '<span>सुनें / Speak</span></button>',
          '<p class="muted-sm" style="margin-top:8px">पूरी सलाह हिंदी में पढ़कर सुनाई जाएगी।</p>',
        '</div>',
      '</div>',

      '<details class="adv__more">',
        '<summary>पूरी सलाह देखें / Full advisory</summary>',

        '<div class="adv__block">',
          '<h4>लक्षण / Symptoms (English)</h4>',
          '<p style="font-size:13.5px">', escapeHtml(a.symptomsEn), '</p>',
        '</div>',

        '<div class="adv__block">',
          '<h4>जैविक उपचार / Organic</h4>',
          '<span class="tagline tagline--organic">कम लागत, सुरक्षित</span>',
          bullets(a.organic),
        '</div>',

        /* Krishi vibhag ne khud koi matra darj ki ho to wo SABSE UPAR —
           app ki apni built-in matra se pehle. Wo ek zimmedar adhikari ne
           CIBRC label dekh kar likhi hai; hamari built-in list saamanya
           margdarshan hai. Dono me farq ho to adhikari ki chalegi. */
        deptProtocolHtml(a),

        '<div class="adv__block">',
          '<h4>रासायनिक उपचार / Chemical</h4>',
          '<span class="tagline tagline--chemical">मात्रा लगभग / प्रति लीटर पानी</span>',
          bullets(a.chemical),
          '<p class="kvk-note">', icon('alert', 'ic ic--xs'),
          ' यह केवल सामान्य मार्गदर्शन है। छिड़काव से पहले अपने ',
          '<strong>कृषि विज्ञान केंद्र (KVK)</strong> या कृषि अधिकारी से दवा और मात्रा की पुष्टि ज़रूर करें।</p>',
        '</div>',

        '<div class="adv__block">',
          '<h4>बचाव / Prevention</h4>',
          bullets(a.prevention),
        '</div>',

      '</details>',
    '</div>',
  ].join('');
}

/** Sabhi 6 classes ke confidence bars. */
function renderScores(results) {
  // Har fasal ke class ki ginti alag hai (dhaan 6, gehu 14) — heading model se banao.
  if (el.scoresSub) {
    el.scoresSub.textContent = 'सभी ' + results.length + ' श्रेणियों की संभावना';
  }

  el.scoresList.innerHTML = results.map((r, i) => {
    const a = getAdvisory(r.label);
    const width = Math.max(1.5, r.prob * 100);   // 0% bar dikhta hi nahi
    return [
      '<li class="score', (i === 0 ? ' score--top' : ''), '">',
        '<div class="score__top">',
          '<span class="score__name">', escapeHtml(a.nameHi),
            ' <span class="muted-sm">', escapeHtml(a.nameEn), '</span></span>',
          '<span class="score__pct">', pct(r.prob), '</span>',
        '</div>',
        '<div class="score__track"><div class="score__fill" style="width:',
          width.toFixed(1), '%"></div></div>',
      '</li>',
    ].join('');
  }).join('');
}

/** "Yeh patti ki photo nahi lagi" wala card. Model chalaya hi nahi gaya. */
function showNotPlant(gate) {
  state.lastResult = null;
  state.aiResult = null;
  renderAiCard(null);

  hide(el.advisoryCard);
  hide(el.lowConfidenceBox);
  el.advisoryHost.innerHTML = '';
  if (el.scoresList) el.scoresList.innerHTML = '';
  const scoresCard = el.scoresList && el.scoresList.closest('.card');
  if (scoresCard) scoresCard.hidden = true;

  // Title alag ho sakta hai — "patti nahi hai" ya "is fasal ki nahi hai"
  const titleEl = el.notPlantBox && el.notPlantBox.querySelector('h2');
  if (titleEl) titleEl.textContent = gate.titleHi || 'यह पत्ती की फोटो नहीं लग रही';
  if (el.notPlantReason) el.notPlantReason.textContent = gate.reasonHi || '';
  if (el.notPlantTips) {
    el.notPlantTips.innerHTML = (gate.tipsHi || [])
      .map((t) => '<li>' + escapeHtml(t) + '</li>').join('');
  }
  show(el.notPlantBox);
  show(el.resultWrap);
  el.resultWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------------------------------------------------------------------
 * Har fasal ka "healthy" label khud dhoond lo (labels model se aate hain,
 * isliye hardcode karna theek nahi — rice me 'rice_healthy_leafs' hai,
 * wheat me 'wheat_healthy', maize me 'Maize_Healthy'...).
 * ------------------------------------------------------------------------- */
function healthyLabelOf(labels) {
  return (labels || []).find((l) => /healthy/i.test(l)) || null;
}

/* Har fasal kis parivaar ki hai. 'grass' me pyaz bhi rakha hai — uski patti
   bhi lambi-patli aur ek disha wali hoti hai, isliye banawat se wo ghaas jaisi
   hi padhi jaati hai. (Pyaz aur dhaan me farq banawat se nahi ho sakta —
   uske liye online AI hai.) */
const CROP_LEAF_FAMILY = {
  rice: 'grass', wheat: 'grass', sugarcane: 'grass', maize: 'grass',
  onion: 'grass',
  tomato: 'broad', potato: 'broad', cotton: 'broad',
  mango: 'broad', apple: 'broad',
};

const FAMILY_NAME_HI = { grass: 'लंबी-पतली (घास जैसी)', broad: 'चौड़ी' };

/**
 * "Jo fasal chuni hai, uski hi photo par jaanch ho."
 *
 * @returns {object|null} null = sab theek / pakka nahi keh sakte,
 *   warna { ok:false, reasonHi, tipsHi } — jaanch rok di jaye.
 */
function checkCropFamily(features) {
  if (!CONFIG.CROP_MATCH.ENABLED || !features || !state.cropId) return null;

  const want = CROP_LEAF_FAMILY[state.cropId];
  if (!want) return null;

  const M = CONFIG.CROP_MATCH;

  /* Patti itni kharab ho ki uski shakal hi na bache — tab shakal se fasal
     pehchanna bharosemand nahi. Aise me chup rehna behtar hai. */
  if (features.damage > M.SKIP_IF_DAMAGE) return null;

  const g = features.grassScore;
  let dikha = null;
  if (g >= M.GRASS_MIN) dikha = 'grass';
  else if (g <= M.BROAD_MAX) dikha = 'broad';
  // beech ka hissa = pakka nahi -> rokte nahi

  if (!dikha || dikha === want) return null;

  const crop = CROPS[state.cropId];
  const cropHi = crop ? cropName(crop.id) : 'चुनी हुई फसल';

  return {
    ok: false,
    titleHi: 'यह ' + cropHi + ' की फोटो नहीं लग रही',
    reasonHi:
      'आपने ' + cropHi + ' चुना है, जिसकी पत्ती ' + FAMILY_NAME_HI[want] +
      ' होती है — पर इस फोटो में ' + FAMILY_NAME_HI[dikha] + ' पत्ती दिख रही है।',
    tipsHi: [
      'साइडबार में "फसल चुनें" से सही फसल चुनें, फिर दोबारा जाँचें',
      'या ' + cropHi + ' की पत्ती की फोटो लें',
      'पत्ती को फ्रेम में पूरा भरें, 15–20 सें.मी. दूर से',
    ],
  };
}

/**
 * Model ke jawab ko photo ke suboot se milao.
 * @returns {object} { results, switchedToHealthy, reason }
 */
function applyHealthCheck(results, features) {
  if (!CONFIG.HEALTH.ENABLED || !features) return { results: results };

  const H = CONFIG.HEALTH;
  const healthy = healthyLabelOf(state.labels);
  if (!healthy) return { results: results };

  const top = results[0];
  if (top.label === healthy) return { results: results };   // model khud healthy keh raha hai

  const healthyRow = results.find((r) => r.label === healthy);
  const pHealthy = healthyRow ? healthyRow.prob : 0;
  const damage = features.damage;

  let reason = null;

  /* 1. Photo me nuksan dikh hi nahi raha, aur model bhi poori tarah pakka nahi */
  if (damage < H.HEALTHY_MAX_DAMAGE && top.prob < H.DISEASE_OVERRIDE_CONF) {
    reason = 'पत्ती लगभग पूरी एक-सा हरी है — न धब्बे, न पीलापन, न सूखे किनारे।';
  }
  /* 2. healthy bhi lagbhag utna hi paas hai, aur nuksan साफ़ nahi dikh raha */
  else if (pHealthy > 0 && (top.prob - pHealthy) < H.HEALTHY_MARGIN &&
           damage < H.CLEAR_DAMAGE) {
    reason = 'मॉडल खुद दुविधा में है और पत्ती पर नुकसान साफ़ नहीं दिख रहा।';
  }

  if (!reason) return { results: results };

  console.info('[health] rog ka faisla badla ->', healthy,
               '| damage', damage.toFixed(3), '| top', top.label, top.prob.toFixed(2),
               '| pHealthy', pHealthy.toFixed(2));

  /* Score bars ka kram NAHI badalte — wahan model ka asli jawab dikhna chahiye
     (pardarshita). Sirf FAISLA badalte hain, aur note me saaf likh dete hain. */
  return {
    results: results,
    switchedToHealthy: true,
    healthyLabel: healthy,
    modelSaid: top.label,
    modelProb: top.prob,
    reason: reason,
  };
}

/** Threshold logic yahin lagta hai. */
function renderResults(rawResults) {
  hide(el.notPlantBox);
  const scoresCard0 = el.scoresList && el.scoresList.closest('.card');
  if (scoresCard0) scoresCard0.hidden = false;

  /* --- Model ka jawab photo ke suboot se milao ---------------------------
   * Sehatmand patti par bhi model rog bata deta hai — yahan wo theek hota hai. */
  const checked = applyHealthCheck(rawResults, state.imageFeatures);
  const results = checked.results;
  state.healthNote = checked.switchedToHealthy ? checked : null;

  renderResultNotes(checked);

  const modelTop = results[0];

  /* Health-check ne faisla badla ho to WAHI aage chalega. Uska bharosa model ki
     probability se nahi, photo ke suboot se aata hai (patti par nuksan hai hi
     nahi) — isliye use confident maanते hain, warna neeche wala threshold use
     "pehchan nahi hui" bana deta aur kisan ko kuch salah hi na milti. */
  const top = checked.switchedToHealthy
    /* 0.92 par cap — yeh faisla photo ke suboot se aaya hai, model ki
       probability se nahi. "100% CONFIDENCE" dikhana jhootha bharosa dega,
       jabki yeh ek anuman hai. */
    ? { label: checked.healthyLabel,
        prob: Math.min(0.92, Math.max(1 - state.imageFeatures.damage, 0.80)),
        index: -1 }
    : modelTop;
  const a = getAdvisory(top.label);
  const confident = checked.switchedToHealthy || top.prob >= CONFIG.CONFIDENCE_THRESHOLD;

  state.lastResult = { label: top.label, prob: top.prob, confident: confident,
                       source: checked.switchedToHealthy ? 'health' : 'local' };

  // Nayi jaanch shuru — purana online-AI verdict hata do
  state.aiResult = null;
  renderAiCard(null);

  renderScores(results);   // scores hamesha dikhte hain (transparency)

  if (confident) {
    hide(el.lowConfidenceBox);
    show(el.advisoryCard);
    el.advisoryHost.innerHTML = buildAdvisoryHtml(top.label, {
      prob: top.prob, speakId: 'speakResult',
    });
    wireSpeakButton($('#speakResult'), el.advisoryHost.querySelector('.adv'));
  } else {
    /* 75% se kam — koi diagnosis nahi dete */
    hide(el.advisoryCard);
    el.advisoryHost.innerHTML = '';
    show(el.lowConfidenceBox);
    el.lowConfBest.textContent =
      a.nameHi + ' / ' + a.nameEn + ' — ' + pct(top.prob) +
      ' (ज़रूरी ' + pct(CONFIG.CONFIDENCE_THRESHOLD, 0) + ')';
  }

  show(el.resultWrap);
  el.resultWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return { label: top.label, prob: top.prob, confident: confident };
}

/**
 * Result ke upar ki chhoti soochnaayein:
 *   - "fasal swasth hai" (jab model ka rog-faisla badla gaya)
 *   - "shayad galat fasal chuni hai" (patti ka parivaar match nahi kar raha)
 */
function renderResultNotes(checked) {
  if (!el.resultNotes) return;
  const parts = [];

  if (checked && checked.switchedToHealthy) {
    const said = getAdvisory(checked.modelSaid);
    parts.push([
      '<div class="rnote rnote--ok">',
        '<span class="rnote__icon" aria-hidden="true">', icon('check'), '</span>',
        '<div>',
          '<p class="rnote__title">आपकी फसल स्वस्थ लग रही है</p>',
          '<p class="rnote__sub">', escapeHtml(checked.reason),
            ' नीचे दी गई सलाह इसे और बेहतर रखने के लिए है।</p>',
          '<p class="rnote__small">मॉडल का पहला अनुमान <strong>',
            escapeHtml(said.nameHi), '</strong> (', pct(checked.modelProb, 0),
            ') था, पर फोटो में उसका कोई निशान नहीं मिला — इसलिए वह नहीं माना गया। ',
            'अगर आपको पत्ती पर सच में धब्बे दिख रहे हों तो उस हिस्से की नज़दीक से फोटो लें।</p>',
        '</div>',
      '</div>',
    ].join(''));
  }

  /* NOTE: "fasal shayad alag hai" wali halki chetavni yahan se hata di gayi.
     Ab yeh jaanch runPrediction me PEHLE hoti hai aur seedha rok deti hai —
     kyunki galat fasal par rog batana chetavni se nahi, rukawat se hi rukta hai. */

  el.resultNotes.innerHTML = parts.join('');
  el.resultNotes.hidden = parts.length === 0;
}

/** "Smart Advisory" view — aakhri result ka mirror. */
function renderAdvisoryMirror() {
  const r = state.lastResult;

  if (!r) {
    el.advisoryMirror.innerHTML =
      '<p class="detect-empty">अभी कोई जाँच नहीं हुई। पहले "Scan &amp; Detect" से पत्ती की फोटो जाँचें।</p>';
    return;
  }
  if (!r.confident) {
    el.advisoryMirror.innerHTML =
      '<p class="detect-empty">आख़िरी जाँच में भरोसा 75% से कम था, इसलिए कोई सलाह नहीं दी गई। ' +
      'कृपया साफ फोटो के साथ दोबारा जाँचें।</p>';
    return;
  }
  el.advisoryMirror.innerHTML = buildAdvisoryHtml(r.label, {
    prob: r.prob, speakId: 'speakMirror',
  });
  wireSpeakButton($('#speakMirror'), el.advisoryMirror.querySelector('.adv'));
}

/** Crop Guide — sabhi 6 rog, bina photo ke padhne ke liye. */
function renderLibrary() {
  if (!state.cropId || !state.labels.length) {
    el.libraryHost.innerHTML =
      '<p class="detect-empty">पहले अपनी फसल चुनें — उसी फसल के रोगों की जानकारी यहाँ दिखेगी।</p>';
    return;
  }
  el.libraryHost.innerHTML = state.labels.map((label, i) => {
    const a = getAdvisory(label);
    return [
      '<details>',
        '<summary>',
          '<span class="library__thumb">', icon('leaf'), '</span>',
          '<span class="library__name">', escapeHtml(a.nameHi),
            '<small>', escapeHtml(a.nameEn), '</small></span>',
          '<span class="risk risk--', escapeHtml(a.risk || 'unknown'), '">',
            escapeHtml(a.riskHi || ''), '</span>',
          icon('chevron'),
        '</summary>',
        '<div class="library__body">',
          buildAdvisoryHtml(label, { speakId: 'speakLib' + i }),
        '</div>',
      '</details>',
    ].join('');
  }).join('');

  state.labels.forEach((_, i) => {
    const btn = $('#speakLib' + i);
    if (btn) wireSpeakButton(btn, btn.closest('.adv'));
  });
}


/* ============================================================================
 * SECTION 9 — HISTORY (localStorage, poori tarah offline)
 * ========================================================================= */

const HISTORY_KEY = 'agriai.history.v1';
const HISTORY_MAX = 20;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    state.history = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(state.history)) state.history = [];
  } catch (err) {
    console.warn('[history] padhi nahi ja saki:', err.message);
    state.history = [];
  }
}

function persistHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
  } catch (err) {
    // Storage bhar gaya — sabse purani entry hatakar dobara koshish karo
    console.warn('[history] save fail:', err.message);
    if (state.history.length > 1) {
      state.history = state.history.slice(0, Math.floor(state.history.length / 2));
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history)); } catch (_) {}
    }
  }
}

/** Preview image ka chhota thumbnail (data URL) — storage me kam jagah lega. */
function makeThumbnail(img, size) {
  try {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const w = img.naturalWidth, h = img.naturalHeight, side = Math.min(w, h);
    ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
    return c.toDataURL('image/jpeg', 0.6);
  } catch (_) { return ''; }
}

function saveToHistory(top) {
  const confident = (typeof top.confident === 'boolean')
    ? top.confident
    : top.prob >= CONFIG.CONFIDENCE_THRESHOLD;
  state.history.unshift({
    ts: Date.now(),
    cropId: state.cropId,          // kaunsi fasal thi — history me dikhane ke liye
    label: top.label,
    prob: top.prob,
    confident: confident,
    thumb: state.imageEl ? makeThumbnail(state.imageEl, 96) : '',
  });
  if (state.history.length > HISTORY_MAX) state.history.length = HISTORY_MAX;
  persistHistory();
  renderRecent();
  updateHistoryBadge();
}

function updateHistoryBadge() {
  if (!el.historyBadge) return;
  el.historyBadge.textContent = String(state.history.length);
  el.historyBadge.hidden = state.history.length === 0;
}

function detectItemHtml(entry, opts) {
  const a = getAdvisory(entry.label);
  const unknown = !entry.confident;
  const name = unknown ? 'पहचान नहीं हो पाई' : a.nameHi;
  const crop = CROPS[entry.cropId || a.cropId];
  const cropTag = crop ? (cropName(crop.id) + ' · ') : '';
  const sub  = cropTag + (unknown ? ('सबसे करीब: ' + a.nameEn) : a.nameEn);

  return [
    '<div class="detect-item">',
      entry.thumb
        ? '<img class="detect-item__thumb" src="' + escapeHtml(entry.thumb) + '" alt="" />'
        : '<span class="detect-item__thumb"></span>',
      '<div class="detect-item__body">',
        '<p class="detect-item__name">', escapeHtml(name), '</p>',
        '<p class="detect-item__meta">', escapeHtml(sub), ' · ', escapeHtml(formatDate(entry.ts)),
          ' · ', pct(entry.prob, 0), '</p>',
      '</div>',
      '<span class="risk risk--', escapeHtml(unknown ? 'unknown' : (a.risk || 'unknown')), '">',
        escapeHtml(unknown ? 'अनिश्चित' : (a.riskHi || '')), '</span>',
      /* Hataane ka button sirf poori history me — "recent" me teen hi dikhte
         hain, wahan cross lagana jagah kha jata hai aur galti se dab bhi
         sakta hai. */
      (opts && opts.removable)
        ? '<button type="button" class="detect-item__del" data-del-ts="' + entry.ts +
            '" title="इस जाँच को हटाएँ" aria-label="इस जाँच को हटाएँ">&times;</button>'
        : '',
    '</div>',
  ].join('');
}

/* Ek jaanch hamesha ke liye hata do. Kisan ki apni jaanch hai — usse
   poochne ki zarurat nahi ki kyun hata raha hai. */
function deleteHistoryEntry(ts) {
  const n = state.history.length;
  state.history = state.history.filter((h) => String(h.ts) !== String(ts));
  if (state.history.length === n) return false;
  persistHistory();
  renderHistory();
  renderRecent();
  updateHistoryBadge();
  return true;
}

function renderRecent() {
  const items = state.history.slice(0, 3);
  el.recentList.innerHTML = items.length
    ? items.map(detectItemHtml).join('')
    : '<p class="detect-empty">अभी कोई जाँच नहीं हुई।<br />पहली फोटो जाँचने पर यहाँ दिखेगी।</p>';
}

function renderHistory() {
  el.historyList.innerHTML = state.history.length
    ? state.history.map((h) => detectItemHtml(h, { removable: true })).join('')
    : '<p class="detect-empty">कोई पुरानी जाँच नहीं मिली।</p>';

  el.historyList.querySelectorAll('[data-del-ts]').forEach((b) =>
    b.addEventListener('click', () => {
      if (!confirm('यह जाँच हटा दें? वापस नहीं आएगी।')) return;
      deleteHistoryEntry(b.dataset.delTs);
    }));
}


/* ============================================================================
 * SECTION 10 — CROP SELECTION  (lazy model loading + "Coming Soon")
 *
 * App khulte hi 4 fasal ke card dikhte hain. Har card ke liye hum sirf itna
 * check karte hain ki models/<crop>/model.json maujood hai ya nahi —
 * poora model tab tak load NAHI hota jab tak user us fasal par tap na kare.
 * ========================================================================= */

const LAST_CROP_KEY = 'krashimitra.lastCrop';

/**
 * Ek fasal ka model maujood hai ya nahi — aur hai to kis format me.
 * Dono Teachable Machine exports chalte hain:
 *   model.json + weights.bin  -> 'tfjs'    (Tensorflow.js tab)
 *   model.tflite              -> 'tflite'  (Tensorflow Lite tab)
 * @returns {Promise<'tfjs'|'tflite'|null>}
 */
async function probeCropModel(cropId) {
  const dir = cropModelDir(cropId);
  const jsonUrl = dir + 'model.json';

  // 1) HEAD sabse halka tarika hai — file download hi nahi hoti.
  let json404 = false;
  try {
    const r = await fetch(jsonUrl, { method: 'HEAD' });
    if (r.ok) return 'tfjs';
    json404 = (r.status === 404);
  } catch (_) { /* HEAD fail hua — neeche GET try karte hain */ }

  // 2) Kuch servers HEAD support nahi karte, aur offline me service worker
  //    sirf GET requests cache karta hai. Isliye GET se dobara koshish karo.
  if (!json404) {
    try {
      const r = await fetch(jsonUrl);
      if (r.ok) {
        const j = await r.json();
        // Kuch servers missing file par index.html laut dete hain — isliye
        // check karo ki yeh sach me ek TFJS model.json hai.
        if (j && (j.modelTopology || j.weightsManifest)) return 'tfjs';
      }
    } catch (_) { /* TFJS model nahi hai — neeche .tflite dekhte hain */ }
  }

  // 3) TFJS nahi mila to .tflite dekho.
  if (await headOk(dir + 'model.tflite')) return 'tflite';

  return null;
}

/** Saari fasalon ko ek saath check karke cards dobara banata hai. */
async function probeAllCrops() {
  state.probing = true;
  renderCropCards();

  const ids = Object.keys(CROPS);
  const results = await Promise.all(ids.map(probeCropModel));

  ids.forEach((id, i) => {
    state.cropModelKind[id] = results[i];        // 'tfjs' | 'tflite' | null
    state.cropAvailable[id] = !!results[i];
  });
  state.probing = false;
  renderCropCards();

  console.info('[crops] available:', state.cropModelKind);
}

/** Crop selection screen ke cards banata hai. */
function renderCropCards() {
  if (!el.cropGrid) return;
  const lastCrop = localStorage.getItem(LAST_CROP_KEY);

  el.cropGrid.innerHTML = Object.keys(CROPS).map((id) => {
    const c = CROPS[id];
    const ready = state.cropAvailable[id] === true;
    const checking = state.probing && state.cropAvailable[id] === undefined;

    let badge, badgeCls;
    if (checking)   { badge = 'जाँच रहे हैं…';            badgeCls = 'checking'; }
    else if (ready) { badge = 'तैयार / Ready';            badgeCls = 'ready'; }
    else            { badge = 'जल्द आ रहा है / Coming Soon'; badgeCls = 'soon'; }

    return [
      '<button type="button" class="crop-card', (ready ? '' : ' is-disabled'), '"',
        ' data-crop="', escapeHtml(id), '"', (ready ? '' : ' disabled'),
        ' aria-label="', escapeHtml(cropName(id)), '">',

        '<span class="crop-card__icon" aria-hidden="true">', icon(c.icon, 'cropart'), '</span>',
        '<span class="crop-card__text">',
          '<span class="crop-card__name">', escapeHtml(cropName(id)), '</span>',
          '<small>', escapeHtml(c.seasonHi || ''), '</small>',
        '</span>',
        '<span class="crop-card__badge crop-card__badge--', badgeCls, '">',
          escapeHtml(badge), '</span>',
        (ready && lastCrop === id
          ? '<span class="crop-card__last">पिछली बार / Last used</span>' : ''),
      '</button>',
    ].join('');
  }).join('');
}

/**
 * Fasal chunne par: labels set karo, UI update karo, phir SIRF usi ka model load karo.
 */
async function selectCrop(cropId) {
  const crop = CROPS[cropId];
  if (!crop) return;

  state.cropId = cropId;
  state.labels = crop.labels.slice();
  state.lastResult = null;
  try { localStorage.setItem(LAST_CROP_KEY, cropId); } catch (_) {}

  // Purani photo / result saaf karo — dusri fasal ka result confuse karega
  clearImage();
  clearBatch();
  if (el.advisoryHost) el.advisoryHost.innerHTML = '';

  updateCropChip();
  renderLibrary();
  switchView('scan');

  // Weather sirf ek baar shuru karo (fasal badalne par dobara fetch ki zaroorat nahi)
  if (!state.weather) refreshWeather({ silent: true });

  // Mandi bhaav har fasal ke liye alag hota hai, isliye fasal badalte hi dobara laao.
  // (js/mandi.js apne aap cache sambhalta hai — har baar API call nahi hoti.)
  if (window.kmMandi) window.kmMandi.load();

  // Khaad ka hisaab aur salah har fasal ke liye alag hai
  if (window.kmFarmTools) window.kmFarmTools.render();
  if (window.kmDashboard) window.kmDashboard.render();

  // Is fasal ke liye vibhag ki koi chetavni hai kya
  fetchAdvisories();

  await loadModelForCrop(cropId);
}

/** Sidebar / topbar par "abhi ye fasal chuni hai" wala chip. */
function updateCropChip() {
  const crop = activeCrop();
  if (el.cropChip) {
    el.cropChip.innerHTML = crop
      ? icon(crop.icon, 'cropart cropart--sm') + ' ' + escapeHtml(cropName(crop.id))
      : icon('sprout', 'ic ic--inline') + ' फसल चुनें';
  }
  if (el.handbookCropName) {
    el.handbookCropName.textContent = crop ? cropName(crop.id) : '—';
  }
  // Scan card ka hint bhi chuni hui fasal ke hisaab se badle (pehle "धान" fix tha).
  if (el.scanCropHint) {
    /* Yeh line pehle Hindi text SEEDHE likh deti thi, jisse HTML ka
       data-i18n bekaar ho jata tha — Tamil chunne par bhi yahi ek vaakya
       Hindi me chamakta rehta. Ab bhasha ke bundle se aata hai.

       Kuch fasalon ka apna hint hota hai (photoHintKey): aloo me model
       KAND ka hai, patti ka nahi — wahan "patti ki photo" likhna galat
       hoga. Wo bhi ab bundle me hai. */
    el.scanCropHint.textContent = crop
      ? (crop.photoHintKey
          ? tr(crop.photoHintKey, crop.photoHintHi || '')
          : tr('ui.photoHintCrop', '{crop} की पत्ती की साफ फोटो अपलोड करें')
              .replace('{crop}', cropName(crop.id)))
      : tr('ui.a22', 'चुनी हुई फसल की पत्ती की साफ फोटो अपलोड करें');
  }
}


/* ============================================================================
 * SECTION 10B — OFFLINE MODEL MANAGER
 *
 * SAMASYA: app ab GitHub + Vercel par host hai. Har fasal ka model ~2.2 MB ka hai.
 *          Agar app khulte hi saare 7 model utaar le, to kisan ka 15 MB data
 *          ek jhatke me chala jayega — aur shayad wo sirf ek hi fasal boyega.
 *
 * HAL: model tabhi utarta hai jab zaroorat ho —
 *      a) jis fasal ko kisan chunta hai wo apne aap cache ho jaati hai (sw.js)
 *      b) yahan se wo khet jaane se PEHLE, wifi par, model download kar sakta hai
 *
 * Files browser ke Cache Storage me jaati hain (naam: krashi-mitra-models).
 * App update hone par bhi ye cache nahi mitta — download dobara nahi karna padta.
 * ========================================================================= */

const MODELS_CACHE = 'krashi-mitra-models';

/** Ek fasal ke model ki teeno files. */
function cropModelFiles(cropId) {
  const dir = cropModelDir(cropId);
  return [dir + 'model.json', dir + 'weights.bin', dir + 'metadata.json'];
}

function cacheApiAvailable() {
  return typeof caches !== 'undefined' && location.protocol !== 'file:';
}

/** Kya is fasal ka model pehle se utar chuka hai? */
async function isCropDownloaded(cropId) {
  if (!cacheApiAvailable()) return false;
  try {
    const cache = await caches.open(MODELS_CACHE);
    const hits = await Promise.all(
      cropModelFiles(cropId).map((u) => cache.match(u, { ignoreSearch: true }))
    );
    return hits.every(Boolean);
  } catch (_) { return false; }
}

/**
 * Model download karke cache me daal do.
 * weights.bin bada hai, isliye usko stream karke % progress dikhate hain.
 */
async function downloadCropModel(cropId, onProgress) {
  if (!cacheApiAvailable()) throw new Error('cache_unavailable');
  const cache = await caches.open(MODELS_CACHE);
  const files = cropModelFiles(cropId);

  let done = 0;
  for (const url of files) {
    const res = await fetch(url, { cache: 'reload' });
    if (!res.ok) throw new Error('download_failed: ' + url);

    const total = Number(res.headers.get('content-length')) || 0;

    if (total > 300000 && res.body && typeof ReadableStream !== 'undefined') {
      // Badi file — byte-by-byte padhkar sahi progress dikhao
      const reader = res.body.getReader();
      const chunks = [];
      let got = 0;
      for (;;) {
        const r = await reader.read();
        if (r.done) break;
        chunks.push(r.value);
        got += r.value.length;
        if (onProgress) onProgress(Math.min(0.99, (done + got / total) / files.length));
      }
      const blob = new Blob(chunks);
      const headers = new Headers();
      res.headers.forEach((v, k) => headers.set(k, v));
      await cache.put(url, new Response(blob, { status: 200, headers: headers }));
    } else {
      await cache.put(url, res.clone());
    }

    done += 1;
    if (onProgress) onProgress(done / files.length);
  }
  return true;
}

async function deleteCropModel(cropId) {
  if (!cacheApiAvailable()) return;
  const cache = await caches.open(MODELS_CACHE);
  await Promise.all(cropModelFiles(cropId).map((u) => cache.delete(u, { ignoreSearch: true })));
}

/** "12.4 MB" jaisa readable size. */
function humanBytes(n) {
  if (!n && n !== 0) return '—';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

/** Phone me app ne kitni jagah li hai. */
async function renderStorageLine() {
  if (!el.storageLine) return;
  if (!navigator.storage || !navigator.storage.estimate) {
    el.storageLine.textContent = '';
    return;
  }
  try {
    const est = await navigator.storage.estimate();
    el.storageLine.textContent =
      'फ़ोन में ऐप ने अभी लगभग ' + humanBytes(est.usage || 0) + ' जगह ली है।';
  } catch (_) { el.storageLine.textContent = ''; }
}

/* ---------------------------------------------------------------------------
 * List render — har fasal ke saamne "डाउनलोड" / "सेव है" / "हटाएँ".
 * ------------------------------------------------------------------------- */
async function renderOfflineManager() {
  if (!el.downloadList) return;

  if (!cacheApiAvailable()) {
    el.downloadList.innerHTML =
      '<li class="dl-note">यह ब्राउज़र ऑफ़लाइन सेव करना सपोर्ट नहीं करता, ' +
      'या ऐप file:// से खुला है। कृपया https वाले लिंक से खोलें।</li>';
    return;
  }

  const ids = Object.keys(CROPS).filter((id) => state.cropAvailable[id]);
  if (!ids.length) {
    el.downloadList.innerHTML =
      '<li class="dl-note">अभी किसी फसल का मॉडल सर्वर पर नहीं मिला।</li>';
    return;
  }

  const statuses = await Promise.all(ids.map(isCropDownloaded));

  el.downloadList.innerHTML = ids.map((id, i) => {
    const crop = CROPS[id];
    const have = statuses[i];
    const n = (crop.labels || []).length;
    return [
      '<li class="dl-item" data-crop="', escapeHtml(id), '">',
        '<span class="dl-icon" aria-hidden="true">', icon(crop.icon, 'cropart'), '</span>',
        '<span class="dl-body">',
          '<span class="dl-name">', escapeHtml(cropName(id)), '</span>',
          '<span class="dl-meta" data-role="meta">',
            have ? 'फ़ोन में सेव है, बिना इंटरनेट चलेगा'
                 : ('लगभग 2.2 MB · ' + n + ' रोग'),
          '</span>',
          '<span class="dl-bar" data-role="bar" hidden><i></i></span>',
        '</span>',
        have
          ? '<button type="button" class="link-btn link-btn--danger" data-act="del">हटाएँ</button>'
          : '<button type="button" class="btn btn--ghost btn--sm" data-act="get">डाउनलोड</button>',
      '</li>',
    ].join('');
  }).join('');

  /* Online AI ki halat bhi yahin bata dete hain — debugging aasan ho jaati hai */
  if (el.aiStatusLine) {
    if (state.aiConfigured === true) {
      el.aiStatusLine.textContent =
        'ऑनलाइन जाँच चालू है — इंटरनेट होने पर हर फोटो दोबारा जाँची जाएगी।';
    } else if (state.aiReason === 'no_api') {
      el.aiStatusLine.textContent =
        'ऑनलाइन AI यहाँ नहीं चलेगा, लोकल सर्वर पर /api फंक्शन नहीं होता। ' +
        'Vercel वाले लिंक पर चलेगा।';
    } else if (state.aiConfigured === false) {
      el.aiStatusLine.textContent =
        'ऑनलाइन जाँच बंद है। फ़ोन का अपना मॉडल पहले जैसा काम कर रहा है।';
    } else {
      el.aiStatusLine.textContent = 'ऑनलाइन AI: इंटरनेट आने पर जाँचा जाएगा।';
    }
  }

  /* Leaf gate poori tarah offline chalta hai — kisan ko bata dena chahiye ki
     yeh suraksha bina internet bhi lagi hui hai. */
  if (el.gateStatusLine) {
    el.gateStatusLine.textContent = CONFIG.LEAF_GATE.ENABLED
      ? 'पत्ती-जाँच चालू है, बिना इंटरनेट भी काम करती है। पौधे या पत्ती के अलावा किसी फोटो पर रोग नहीं बताया जाएगा।'
      : 'पत्ती-जाँच बंद है, किसी भी फोटो पर रोग बताया जा सकता है (script.js में LEAF_GATE.ENABLED देखें)।';
  }

  renderStorageLine();
  renderVoiceStatus();
}

/** Ek row ka download chalao (progress bar ke saath). */
async function handleDownloadClick(li, action) {
  const cropId = li.dataset.crop;
  const meta = li.querySelector('[data-role="meta"]');
  const bar = li.querySelector('[data-role="bar"]');
  const btn = li.querySelector('button');

  if (action === 'del') {
    await deleteCropModel(cropId);
    renderOfflineManager();
    return;
  }

  btn.disabled = true;
  show(bar);
  meta.textContent = 'डाउनलोड हो रहा है…';

  try {
    await downloadCropModel(cropId, (p) => {
      const fill = bar.querySelector('i');
      if (fill) fill.style.width = Math.round(p * 100) + '%';
      meta.textContent = 'डाउनलोड हो रहा है… ' + Math.round(p * 100) + '%';
    });
    meta.textContent = 'हो गया';
  } catch (err) {
    console.warn('[offline] download fail:', err.message);
    meta.textContent = 'डाउनलोड नहीं हो पाया — इंटरनेट जाँचकर दोबारा कोशिश करें।';
    btn.disabled = false;
    hide(bar);
    return;
  }
  renderOfflineManager();
}

async function downloadAllModels() {
  const ids = Object.keys(CROPS).filter((id) => state.cropAvailable[id]);
  if (!ids.length) return;
  if (el.downloadAllBtn) el.downloadAllBtn.disabled = true;

  for (const id of ids) {
    try {
      if (!(await isCropDownloaded(id))) await downloadCropModel(id);
      await renderOfflineManager();
    } catch (err) {
      console.warn('[offline] all-download fail on', id, err.message);
    }
  }
  if (el.downloadAllBtn) el.downloadAllBtn.disabled = false;
  renderOfflineManager();
}

/* ---------------------------------------------------------------------------
 * APP DOWNLOAD / INSTALL — "ऐप डाउनलोड करें"
 *
 * Sidebar me hamesha ek button rehta hai. Dabane par kya hota hai, teen halat:
 *
 *   1. CONFIG.APK_URL bhara hai   -> seedha .apk download link
 *   2. Chrome/Android/desktop     -> asli install prompt (home screen icon)
 *   3. iPhone / baaki browser     -> haath se jodne ke steps (Share -> Add to Home Screen)
 *
 * Pehle install button tabhi dikhta tha jab browser khud prompt deta tha —
 * isliye kai baar dikhta hi nahi tha. Ab button hamesha rehta hai aur ऐप
 * bata deti hai ki is phone par kya karna hai.
 * ------------------------------------------------------------------------- */
let deferredInstallPrompt = null;

/** Ye phone iPhone/iPad hai? (Chrome iOS bhi Safari engine par chalta hai) */
function isIosDevice() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** App pehle se install hokar khuli hai? */
function isAppInstalled() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
         navigator.standalone === true;
}

function stepsHtml(items) {
  return items.map((t) => '<li>' + escapeHtml(t) + '</li>').join('');
}

/** Install card ko is phone ke hisaab se banao. */
function renderInstallCard() {
  if (!el.installCard) return;

  const apk = (CONFIG.APK_URL || '').trim();

  /* 1) APK link — sabse seedha rasta */
  if (el.apkBtn) {
    if (apk) {
      el.apkBtn.href = apk;
      show(el.apkBtn);
    } else {
      hide(el.apkBtn);
    }
  }

  /* 2) PWA install prompt */
  if (el.installBtn) {
    if (deferredInstallPrompt) show(el.installBtn);
    else hide(el.installBtn);
  }

  if (!el.installNote || !el.installSteps) return;

  /* 3) Note + haath se jodne ke steps */
  if (isAppInstalled()) {
    el.installNote.textContent = 'ऐप पहले से इंस्टॉल है, आप अभी उसी में हैं।';
    hide(el.installSteps);
    return;
  }

  if (deferredInstallPrompt) {
    el.installNote.textContent =
      'ऊपर वाला बटन दबाते ही ऐप फ़ोन में जुड़ जाएगी (कुछ भी अलग से डाउनलोड नहीं करना पड़ेगा)।';
    hide(el.installSteps);
    return;
  }

  if (isIosDevice()) {
    el.installNote.textContent = 'iPhone/iPad पर Safari में ये 3 कदम करें:';
    el.installSteps.innerHTML = stepsHtml([
      'नीचे पट्टी में Share बटन दबाएँ (ऊपर तीर वाला चौकोर निशान)',
      'सूची में नीचे जाकर "Add to Home Screen" चुनें',
      '"Add" दबाएँ — होम स्क्रीन पर Vridhi AI का आइकॉन बन जाएगा',
    ]);
    show(el.installSteps);
    return;
  }

  if (apk) {
    el.installNote.textContent =
      'APK डाउनलोड होने के बाद उसे खोलें। फ़ोन "Unknown sources" की अनुमति माँगे तो ' +
      '"Allow" दबाएँ — यह ऐप आपकी अपनी है।';
    hide(el.installSteps);
    return;
  }

  el.installNote.textContent = 'इस ब्राउज़र में ऐप ऐसे जोड़ें:';
  el.installSteps.innerHTML = stepsHtml([
    'Chrome में ऊपर दाईं ओर ⋮ (तीन बिंदु) दबाएँ',
    '"Install app" या "Add to Home screen" चुनें',
    'पक्का करने के लिए "Install" दबाएँ',
  ]);
  show(el.installSteps);
}

/** Sidebar wala button — seedha install, warna about screen par le jao. */
async function handleGetAppClick() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch (_) {}
    deferredInstallPrompt = null;
    renderInstallCard();
    return;
  }

  const apk = (CONFIG.APK_URL || '').trim();
  if (apk) { window.location.href = apk; return; }

  switchView('about');
  setTimeout(() => {
    if (el.installCard) el.installCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 120);
}

function wireInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    renderInstallCard();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (el.getAppBadge) hide(el.getAppBadge);
    renderInstallCard();
  });

  if (el.installBtn) el.installBtn.addEventListener('click', handleGetAppClick);
  if (el.getAppBtn)  el.getAppBtn.addEventListener('click', handleGetAppClick);

  if (isAppInstalled() && el.getAppBadge) hide(el.getAppBadge);
  renderInstallCard();
}


/* ============================================================================
 * SECTION 11 — WEATHER + SMART SPRAY WARNING
 *
 * ZAROORI: Yeh app ka EK-MAATRA feature hai jise INTERNET chahiye.
 *    Disease detection isse bilkul alag hai aur offline chalti rehti hai —
 *    yahan koi bhi error aaye, baaki app par asar nahi padta.
 * ========================================================================= */

const WEATHER_CACHE_KEY = 'krashimitra.weather.v1';

/** User ne khud jo jagah chuni hai (GPS na mile to) — { lat, lon, label }. */
const WEATHER_PLACE_KEY = 'krashimitra.weather.place.v1';

function readManualPlace() {
  try {
    const raw = localStorage.getItem(WEATHER_PLACE_KEY);
    const p = raw ? JSON.parse(raw) : null;
    return (p && typeof p.lat === 'number' && typeof p.lon === 'number') ? p : null;
  } catch (_) { return null; }
}
function saveManualPlace(p) {
  try { localStorage.setItem(WEATHER_PLACE_KEY, JSON.stringify(p)); } catch (_) {}
}
function clearManualPlace() {
  try { localStorage.removeItem(WEATHER_PLACE_KEY); } catch (_) {}
}

/* Key ab server par hai, isliye yahan se pehle se pata nahi chal sakta ki
   wo lagi hai ya nahi. Server 503 'not_configured' bhejta hai — hum wahi
   yaad rakh lete hain aur mausam ka hissa chhupa dete hain. Baaki app
   chalti rehti hai; wo waise bhi offline chalti hai. */
let weatherNotConfigured = false;
function weatherKeyMissing() { return weatherNotConfigured; }

/** navigator.geolocation ko Promise me badalta hai. */
function getPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('GEO_UNSUPPORTED'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        reject(new Error(err.code === 1 ? 'GEO_DENIED' : 'GEO_FAILED'));
      },
      { enableHighAccuracy: false, timeout: WEATHER_CONFIG.GEO_TIMEOUT_MS, maximumAge: 600000 }
    );
  });
}

/**
 * Gaon / shahar ka naam ya 6-ank ka PIN code -> { lat, lon, label }.
 * Wahi API key use hoti hai jo weather ke liye hai — koi nayi service nahi.
 */
async function geocodePlace(query) {
  const q = String(query || '').trim();
  if (!q) throw new Error('PLACE_EMPTY');

  const isPin = /^[1-9][0-9]{5}$/.test(q);          // Bharat ka PIN 6 ank ka hota hai
  const where = encodeURIComponent(q + ',' + WEATHER_CONFIG.COUNTRY);
  const url = isPin
    ? WEATHER_PROXY + '?op=zip&zip='   + where
    : WEATHER_PROXY + '?op=geocode&q=' + where;

  const res = await fetch(url);
  if (res.status === 503) { weatherNotConfigured = true; throw new Error('BAD_KEY'); }
  if (res.status === 401) throw new Error('BAD_KEY');
  if (res.status === 404) throw new Error('PLACE_NOT_FOUND');
  if (!res.ok) throw new Error('HTTP ' + res.status);

  const data = await res.json();
  // /geo/1.0/zip ek object deta hai, /geo/1.0/direct ek array.
  const hit = isPin ? data : (Array.isArray(data) ? data[0] : null);
  if (!hit || typeof hit.lat !== 'number') throw new Error('PLACE_NOT_FOUND');

  return { lat: hit.lat, lon: hit.lon, label: hit.name || q };
}

/** Form se aayi jagah ko save karke us jagah ka mausam laata hai. */
async function applyManualPlace(query) {
  const typed = String(query || '').trim();
  try {
    const place = await geocodePlace(typed);
    saveManualPlace(place);
    await refreshWeather({ force: true });
  } catch (err) {
    console.warn('[weather:place]', err.message);

    let msg, msgEn;
    switch (err.message) {
      case 'PLACE_EMPTY':
        msg   = 'पहले अपना गाँव/शहर का नाम या 6 अंक का PIN कोड लिखें।';
        msgEn = 'Type your village/city name or a 6-digit PIN code first.';
        break;
      case 'PLACE_NOT_FOUND':
        msg   = 'यह जगह नहीं मिली। पास के बड़े शहर का नाम, या अपना 6 अंक का PIN कोड लिखकर देखें।';
        msgEn = 'That place was not found. Try a nearby larger town, or your 6-digit PIN code.';
        break;
      case 'BAD_KEY':
        msg   = 'API key गलत है या अभी चालू नहीं हुई। नई key को चालू होने में ~1 घंटा लगता है।';
        msgEn = 'The API key is wrong or not active yet. A new key takes about an hour to activate.';
        break;
      default:
        msg   = 'जगह ढूँढने में दिक्कत हुई (इंटरनेट या सर्वर की समस्या)। दोबारा कोशिश करें।';
        msgEn = 'Could not look up that place (an internet or server problem). Please try again.';
    }
    renderWeatherMessage(msg, { icon: 'pin', en: msgEn, form: true, value: typed, retry: false });
  }
}

/** Jagah poochhne wala form dikhata hai (GPS chhodkar). */
function askForPlace() {
  const saved = readManualPlace();
  renderWeatherMessage(
    'अपना गाँव/शहर का नाम या 6 अंक का PIN कोड लिखें — मौसम वहीं का दिखेगा।',
    {
      icon: 'pin', form: true, value: saved ? saved.label : '',
      en: 'Type your village/city name or 6-digit PIN code — the weather will be shown for that place.',
      retryLabel: 'मेरी लोकेशन से / Use my location',
    }
  );
}

/** OpenWeatherMap se current + forecast dono ek saath laata hai. */
async function fetchWeatherData(lat, lon) {
  const q = '&lat=' + lat + '&lon=' + lon;

  const [curRes, foreRes] = await Promise.all([
    fetch(WEATHER_PROXY + '?op=current'  + q),
    fetch(WEATHER_PROXY + '?op=forecast' + q),
  ]);

  if (curRes.status === 503 || foreRes.status === 503) {
    weatherNotConfigured = true; throw new Error('BAD_KEY');
  }
  if (curRes.status === 401 || foreRes.status === 401) throw new Error('BAD_KEY');
  if (!curRes.ok)  throw new Error('HTTP ' + curRes.status);
  if (!foreRes.ok) throw new Error('HTTP ' + foreRes.status);

  return { current: await curRes.json(), forecast: await foreRes.json() };
}

/**
 * API ke kacche JSON se ek saaf model banata hai jise UI seedhe dikha sake.
 * Yahi jagah hai jahan SMART WARNING ka poora logic hai.
 */
function buildWeatherModel(current, forecast) {
  const m = {
    place:    (current.name || 'आपका इलाका'),
    tempC:    Math.round(current.main ? current.main.temp : 0),
    feelsC:   Math.round(current.main ? current.main.feels_like : 0),
    humidity: current.main ? current.main.humidity : 0,
    windKmh:  Math.round(((current.wind && current.wind.speed) || 0) * 3.6),
    desc:     (current.weather && current.weather[0] && current.weather[0].description) || '—',
    condId:   (current.weather && current.weather[0] && current.weather[0].id) || 800,
    fetchedAt: Date.now(),
    stale: false,
  };

  /* ---- Agle 12 ghante ka forecast dekho ---- */
  const now = Date.now();
  const until = now + WEATHER_CONFIG.RAIN_LOOKAHEAD_HOURS * 3600 * 1000;
  const slots = ((forecast && forecast.list) || []).filter(
    (s) => (s.dt * 1000) > now && (s.dt * 1000) <= until
  );

  let maxPop = 0, maxHum = m.humidity, rainAtMs = null;
  let minTemp = m.tempC, maxTemp = m.tempC;

  slots.forEach((s) => {
    const pop = typeof s.pop === 'number' ? s.pop : 0;
    // Weather condition id: 2xx aandhi, 3xx boondabaandi, 5xx baarish
    const id = (s.weather && s.weather[0] && s.weather[0].id) || 800;
    const isRainCode = id < 600;

    if (pop > maxPop) maxPop = pop;
    if (s.main && s.main.humidity > maxHum) maxHum = s.main.humidity;
    if (s.main && typeof s.main.temp_min === 'number') {
      if (s.main.temp_min < minTemp) minTemp = Math.round(s.main.temp_min);
    }
    if (s.main && typeof s.main.temp_max === 'number') {
      if (s.main.temp_max > maxTemp) maxTemp = Math.round(s.main.temp_max);
    }

    if (rainAtMs === null && (pop > WEATHER_CONFIG.RAIN_POP_THRESHOLD || isRainCode)) {
      rainAtMs = s.dt * 1000;
    }
  });

  m.rainPop = maxPop;
  m.maxHumidity = maxHum;
  m.rainSoon = rainAtMs !== null;
  m.rainInHours = rainAtMs ? Math.max(1, Math.round((rainAtMs - now) / 3600000)) : null;
  m.minTempC = minTemp;
  m.maxTempC = maxTemp;

  /* ---- WARNINGS ---- */
  m.warnings = [];

  if (m.rainSoon) {
    m.warnings.push({
      kind: 'rain',
      icon: 'rain',
      titleHi: 'बारिश हो सकती है — अभी स्प्रे/दवा न छिड़कें',
      bodyHi: 'अगले ' + m.rainInHours + ' घंटे में बारिश की संभावना ' +
              Math.round(m.rainPop * 100) + '% है। अभी दवा छिड़केंगे तो पानी के साथ बह जाएगी और पैसा बर्बाद होगा। ' +
              'बारिश रुकने के बाद पत्तियाँ सूख जाएँ, तब छिड़काव करें।',
      bodyEn: 'Rain likely in ~' + m.rainInHours + 'h — do not spray now, it will wash off.',
      speech: 'सावधान! अगले ' + m.rainInHours + ' घंटे में बारिश की संभावना ' +
              Math.round(m.rainPop * 100) + ' प्रतिशत है। अभी दवा का छिड़काव मत कीजिए, ' +
              'वरना दवा पानी के साथ बह जाएगी और आपका पैसा बर्बाद होगा। बारिश रुकने और पत्तियाँ सूखने के बाद ही छिड़काव करें।',
    });
  }

  if (m.maxHumidity > WEATHER_CONFIG.HUMIDITY_THRESHOLD) {
    m.warnings.push({
      kind: 'humid',
      icon: 'drop',
      titleHi: 'फंगल रोग का खतरा बढ़ गया है',
      bodyHi: 'हवा में नमी ' + m.maxHumidity + '% है। इतनी नमी में फफूंद वाले रोग (झुलसा, रतुआ, ब्लास्ट) ' +
              'तेज़ी से फैलते हैं। आज ही खेत में 10 जगह घूमकर पत्तियाँ जाँचें और इस ऐप से स्कैन करें।',
      bodyEn: 'Humidity ' + m.maxHumidity + '% — high fungal disease risk. Scout your field today.',
      speech: 'ध्यान दीजिए! हवा में नमी ' + m.maxHumidity + ' प्रतिशत है। ' +
              'इतनी नमी में फफूंद वाले रोग तेज़ी से फैलते हैं। आज ही खेत में दस जगह घूमकर पत्तियाँ जाँच लीजिए।',
    });
  }

  /* Tez hawa me chhidkav. Yeh baarish jitni hi badi baat hai par kisi app
     me nahi hoti — dawa uda kar padosi ke khet me chali jaati hai, ya
     chhidkav karne wale ke apne upar. */
  if (m.windKmh > WEATHER_CONFIG.WIND_SPRAY_KMH) {
    m.warnings.push({
      kind: 'wind',
      icon: 'wind',
      titleHi: 'हवा तेज़ है — अभी छिड़काव न करें',
      bodyHi: 'हवा की रफ़्तार ' + m.windKmh + ' किमी/घंटा है। इतनी हवा में दवा ' +
              'पत्तों पर टिकती नहीं, उड़कर दूसरे खेत में चली जाती है और छिड़कने वाले ' +
              'के ऊपर पड़ती है। सुबह जल्दी या शाम को, जब हवा थम जाए, तब छिड़कें।',
      bodyEn: 'Wind ' + m.windKmh + ' km/h — too windy to spray. Wait for a calm morning or evening.',
      speech: 'हवा की रफ्तार ' + m.windKmh + ' किलोमीटर प्रति घंटा है। ' +
              'इतनी तेज़ हवा में दवा मत छिड़किए, वो उड़कर बर्बाद हो जाएगी और आप पर भी पड़ेगी। ' +
              'सुबह जल्दी या शाम को हवा थमने पर छिड़काव कीजिए।',
    });
  }

  /* Paala — ise raat bhar pehle batana hi kaam ka hai. Aloo aur sabzi me
     ek raat me poori fasal ja sakti hai. */
  if (m.minTempC <= WEATHER_CONFIG.FROST_TEMP_C) {
    m.warnings.push({
      kind: 'frost',
      icon: 'alert',
      titleHi: 'पाले का खतरा — आज रात खेत में पानी चला दें',
      bodyHi: 'आज रात तापमान ' + m.minTempC + '°C तक जा सकता है। ज़मीन के पास ' +
              'पाला पड़ सकता है, जिससे आलू, टमाटर और सब्ज़ी की फसल एक ही रात में ' +
              'जल जाती है। हल्की सिंचाई कर दें — गीली मिट्टी देर तक गर्म रहती है। ' +
              'खेत के किनारे धुआँ करने से भी बचाव होता है।',
      bodyEn: 'Frost risk tonight (' + m.minTempC + '°C). Light irrigation keeps soil warm.',
      speech: 'सावधान! आज रात तापमान ' + m.minTempC + ' डिग्री तक जा सकता है और पाला पड़ सकता है। ' +
              'आज शाम हल्की सिंचाई कर दीजिए, गीली मिट्टी देर तक गर्म रहती है और फसल बच जाती है।',
    });
  }

  /* Garmi ka tanav */
  if (m.maxTempC >= WEATHER_CONFIG.HEAT_TEMP_C) {
    m.warnings.push({
      kind: 'heat',
      icon: 'alert',
      titleHi: 'गर्मी बहुत ज़्यादा — दोपहर में छिड़काव न करें',
      bodyHi: 'तापमान ' + m.maxTempC + '°C तक जा सकता है। इतनी गर्मी में दोपहर का ' +
              'छिड़काव पत्ती जला देता है और दवा उड़ जाती है। सुबह या शाम को ही छिड़कें। ' +
              'हो सके तो सिंचाई सुबह जल्दी करें ताकि पानी कम भाप बने।',
      bodyEn: 'Up to ' + m.maxTempC + '°C — avoid midday spraying; it scorches leaves.',
      speech: 'तापमान ' + m.maxTempC + ' डिग्री तक जा सकता है। दोपहर में दवा मत छिड़किए, ' +
              'पत्ती जल जाती है। सुबह या शाम का समय ठीक रहेगा।',
    });
  }

  /* Kataai ke waqt baarish. Yeh tabhi bolte hain jab calendar kehta ho ki
     fasal kataai ke aas-paas hai — warna har baarish par "kataai" bolna
     bekaar shor hai. */
  try {
    const cropNow = (typeof state === 'object' && state && state.cropId) || null;
    if (m.rainSoon && cropNow && window.kmCalendar) {
      const cp = window.kmCalendar.plan(cropNow);
      if (cp && !cp.perennial && cp.stage === 'harvest') {
        m.warnings.push({
          kind: 'harvest',
          icon: 'rain',
          titleHi: 'कटाई के समय बारिश — कटी फसल ढक दें',
          bodyHi: 'आपकी फसल कटाई की अवस्था में है और अगले ' + m.rainInHours +
                  ' घंटे में बारिश की संभावना है। कटी हुई फसल खुले में हो तो ढक दें ' +
                  'या भंडार में ले जाएँ। भीगा दाना काला पड़ता है और मंडी में कम दाम मिलता है।',
          bodyEn: 'Rain in ~' + m.rainInHours + 'h while your crop is at harvest — cover the cut crop.',
          speech: 'आपकी फसल कटाई पर है और अगले ' + m.rainInHours + ' घंटे में बारिश आ सकती है। ' +
                  'कटी हुई फसल को ढक दीजिए या भंडार में ले जाइए, वरना दाना काला पड़ जाएगा और दाम गिर जाएगा।',
        });
      }
    }
  } catch (_) { /* calendar na ho to baki chetavni phir bhi chalti rahein */ }

  /* ---- Awaaz ke liye poora Hindi summary ---- */
  let sp = 'आपके इलाके ' + m.place + ' में अभी तापमान ' + m.tempC + ' डिग्री सेल्सियस है। ' +
           'हवा में नमी ' + m.humidity + ' प्रतिशत, और हवा की रफ्तार ' + m.windKmh + ' किलोमीटर प्रति घंटा है। ' +
           'मौसम ' + m.desc + ' है। ';
  if (m.warnings.length) {
    m.warnings.forEach((w) => { sp += w.speech + ' '; });
  } else {
    sp += 'अभी कोई चेतावनी नहीं है। छिड़काव के लिए मौसम ठीक लग रहा है, फिर भी हवा तेज़ हो तो रुक जाइए।';
  }
  m.speech = sp;

  return m;
}

/* ---------- Weather cache (offline / dobara khulne par) ---------------- */
function saveWeatherCache(m) {
  try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(m)); } catch (_) {}
}
function readWeatherCache() {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

/* ---------- Weather rendering ------------------------------------------ */

/** Card ke andar ek friendly message (error / info) dikhata hai. */
function renderWeatherMessage(text, opts) {
  const o = opts || {};
  el.weatherBody.innerHTML = [
    '<div class="weather-msg">',
      '<span class="weather-msg__icon" aria-hidden="true">', icon(o.icon || 'info'), '</span>',
      '<p>', escapeHtml(text), '</p>',
      (o.en ? '<p class="weather-msg__en">' + escapeHtml(o.en) + '</p>' : ''),

      /* Manual jagah ka form — GPS na mile to yahi ekmatra rasta hai */
      (o.form ?
        '<form class="wplace" id="weatherPlaceForm" autocomplete="off">' +
          '<input type="text" id="weatherPlaceInput" class="wplace__input" ' +
                 'placeholder="गाँव / शहर या PIN कोड" ' +
                 'aria-label="गाँव, शहर या PIN कोड / Village, city or PIN code" ' +
                 'value="' + escapeHtml(o.value || '') + '" />' +
          '<button type="submit" class="btn btn--primary btn--sm">देखें / Show</button>' +
        '</form>' +
        '<p class="wplace__hint">जैसे / e.g. — Lucknow · Sitapur · 226001</p>'
        : ''),

      (o.retry === false ? '' :
        '<button type="button" class="btn btn--ghost btn--sm" id="weatherRetryBtn">' +
        escapeHtml(o.retryLabel || 'दोबारा कोशिश करें / Retry') + '</button>'),
    '</div>',
  ].join('');

  const retry = $('#weatherRetryBtn');
  if (retry) retry.addEventListener('click', () => {
    // Form dikh raha hai matlab GPS wala rasta try ho raha hai — tab hi
    // chuni hui jagah hatao. Baaki errors (key/internet) me use rehne do.
    if (o.form) clearManualPlace();
    refreshWeather({ force: true });
  });

  const placeForm = $('#weatherPlaceForm');
  if (placeForm) {
    placeForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const input = $('#weatherPlaceInput');
      renderWeatherLoading();
      applyManualPlace(input ? input.value : '');
    });
    const input = $('#weatherPlaceInput');
    if (input && !o.value) input.focus();
  }

  if (el.weatherSpeakBtn) el.weatherSpeakBtn.disabled = true;
}

/** state.weather ko card me dikhata hai. */
function renderWeather() {
  const m = state.weather;
  if (!m) return;

  const manualPlace = readManualPlace();

  if (el.weatherPlace) {
    el.weatherPlace.textContent = m.place + (m.stale ? ' · पुराना डेटा (offline)' : '');
  }
  if (el.weatherSpeakBtn) el.weatherSpeakBtn.disabled = false;

  const stat = (icName, valueHtml, labelHi) => [
    '<div class="wstat">',
      '<span class="wstat__ic">', icon(icName), '</span>',
      '<div><b>', valueHtml, '</b><small>', labelHi, '</small></div>',
    '</div>',
  ].join('');

  el.weatherBody.innerHTML = [
    '<div class="wnow">',
      '<div class="wnow__temp">', m.tempC, '<span>°C</span></div>',
      '<div class="wnow__desc">',
        '<p>', escapeHtml(m.desc), '</p>',
        '<small>महसूस होता है ', m.feelsC, '°C</small>',
      '</div>',
    '</div>',

    '<div class="wstats">',
      stat('drop',   m.humidity + '%',        'नमी / Humidity'),
      stat('rain',   Math.round(m.rainPop * 100) + '%', 'बारिश / Rain (12h)'),
      stat('wind',   m.windKmh + ' km/h',     'हवा / Wind'),
    '</div>',

    m.warnings.map((w) => [
      '<div class="warn warn--', w.kind, '">',
        '<span class="warn__icon" aria-hidden="true">', icon(w.icon), '</span>',
        '<div>',
          '<strong>', escapeHtml(w.titleHi), '</strong>',
          '<p>', escapeHtml(w.bodyHi), '</p>',
          '<p class="muted-sm">', escapeHtml(w.bodyEn), '</p>',
        '</div>',
      '</div>',
    ].join('')).join(''),

    (m.warnings.length ? '' :
      '<div class="warn warn--ok">' +
        '<span class="warn__icon" aria-hidden="true">' + icon('check') + '</span>' +
        '<div><strong>मौसम ठीक है</strong>' +
        '<p>अभी कोई चेतावनी नहीं। छिड़काव करना हो तो सुबह या शाम का समय चुनें।</p></div>' +
      '</div>'),

    /* Jagah badalne ka rasta HAMESHA dikhna chahiye. GPS fail hone par
       purana (stale) data dikhta hai — tab bhi user ko nikalne ka raasta chahiye. */
    '<div class="wplace-row">' +
      (manualPlace
        ? '<span>' + icon('pin', 'ic ic--xs') + ' ' + escapeHtml(manualPlace.label) +
          ' · आपकी चुनी हुई जगह</span>'
        : '<span>' + icon('pin', 'ic ic--xs') + ' आपकी लोकेशन से / From your location</span>') +
      '<button type="button" class="btn btn--ghost btn--sm" id="weatherChangePlaceBtn">' +
      (manualPlace ? 'जगह बदलें / Change place' : 'जगह खुद चुनें / Set place') +
      '</button>' +
    '</div>',
  ].join('');

  const changeBtn = $('#weatherChangePlaceBtn');
  if (changeBtn) changeBtn.addEventListener('click', askForPlace);
}

/** Loading state. */
function renderWeatherLoading() {
  el.weatherBody.innerHTML =
    '<div class="weather-msg"><span class="spinner spinner--sm"></span>' +
    '<p>मौसम की जानकारी ली जा रही है…</p></div>';
  if (el.weatherSpeakBtn) el.weatherSpeakBtn.disabled = true;
}

/**
 * Poora weather flow. Har failure par ek friendly message dikhta hai —
 * app kabhi crash ya blank nahi hoti.
 */
async function refreshWeather(opts) {
  const o = opts || {};
  if (state.weatherBusy) return;

  /* 0) DEMO MODE — bina asli baarish ke warnings test karne ke liye */
  if (WEATHER_CONFIG.DEMO_SCENARIO) {
    applyDemoWeather(WEATHER_CONFIG.DEMO_SCENARIO);
    return;
  }

  /* 1) Server par key lagi hai ya nahi
     Yeh sandesh KISAN padhta hai, isliye usse code ki baat nahi karte —
     pehle yahan "js/script.js me key paste karein" likha tha, jo kisan ke
     liye bilkul bematlab hai. Ab saaf-saaf itna ki mausam abhi nahi
     dikhega, par app ka baaki kaam chalta rahega.
     (Lagane wale ke liye asli hidayat neeche console me jaati hai.) */
  if (weatherKeyMissing()) {
    console.warn('[weather] Server par OPENWEATHER_API_KEY set nahi hai. ' +
                 'Vercel > Project > Settings > Environment Variables me daalein.');
    renderWeatherMessage(
      'मौसम की सुविधा अभी चालू नहीं है। रोग पहचान, सलाह और पुरानी जाँचें ' +
      'पहले की तरह चलती रहेंगी — उनके लिए इंटरनेट भी ज़रूरी नहीं।',
      {
        icon: 'key', retry: false,
        en: 'Weather is not switched on yet. Disease detection, advice and ' +
            'history keep working — they do not need the internet.',
      }
    );
    return;
  }

  /* 2) Cache — 30 minute se nayi ho to dobara call mat karo */
  const cached = readWeatherCache();
  if (!o.force && cached && (Date.now() - cached.fetchedAt) < WEATHER_CONFIG.CACHE_MINUTES * 60000) {
    state.weather = cached;
    renderWeather();
    return;
  }

  /* 3) Internet hai? */
  if (navigator.onLine === false) {
    if (cached) {
      cached.stale = true;
      state.weather = cached;
      renderWeather();
    } else {
      renderWeatherMessage(
        'मौसम के लिए इंटरनेट चाहिए। बाकी ऐप (रोग पहचान) बिना इंटरनेट के काम करता रहेगा।',
        {
          icon: 'wifi-off',
          en: 'Weather needs an internet connection. The rest of the app (disease detection) ' +
              'keeps working offline.',
        }
      );
    }
    return;
  }

  state.weatherBusy = true;
  renderWeatherLoading();

  try {
    /* 4) Location — pehle user ki chuni hui jagah, warna GPS */
    const manual = readManualPlace();
    const pos = manual || await getPosition();

    /* 5) API call */
    // Jagah yaad rakh lo — agar kisan ne report bhejna chalu kiya ho to
    // scan ke saath yahi coordinates jaate hain (alag se location nahi maangte).
    state.lastPos = { lat: pos.lat, lon: pos.lon };

    const data = await fetchWeatherData(pos.lat, pos.lon);
    const model = buildWeatherModel(data.current, data.forecast);

    state.weather = model;
    saveWeatherCache(model);
    renderWeather();
  } catch (err) {
    console.warn('[weather]', err.message);

    // Purana data ho to wahi dikha do — kuch na dikhane se behtar hai
    if (cached) {
      cached.stale = true;
      state.weather = cached;
      renderWeather();
      showInfo('ताज़ा मौसम नहीं मिला, इसलिए पिछली बार का डेटा दिखा रहे हैं।',
               'Fresh weather could not be fetched, so the last saved data is shown.');
      return;
    }

    let msg, msgEn, ic = 'alert', form = false;
    switch (err.message) {
      case 'GEO_DENIED':
        msg   = 'लोकेशन की अनुमति नहीं मिली। नीचे अपना गाँव/शहर या PIN कोड लिख दें — ' +
                'मौसम वहीं का दिखेगा। (या address bar के ताले पर टैप करके Location को Allow करें।)';
        msgEn = 'Location permission was denied. Type your village/city or PIN code below instead — ' +
                'or allow location from the lock icon in the address bar.';
        ic = 'pin'; form = true; break;
      case 'GEO_UNSUPPORTED':
        msg   = 'इस ब्राउज़र में लोकेशन की सुविधा नहीं है। नीचे अपना गाँव/शहर या PIN कोड लिख दें।';
        msgEn = 'This browser does not support location. Type your village/city or PIN code below.';
        ic = 'pin'; form = true; break;
      case 'GEO_FAILED':
        msg   = 'लोकेशन नहीं मिल पाई। GPS चालू करके दोबारा कोशिश करें, ' +
                'या नीचे अपना गाँव/शहर या PIN कोड लिख दें।';
        msgEn = 'Your location could not be determined. Turn on GPS and try again, ' +
                'or type your village/city or PIN code below.';
        ic = 'pin'; form = true; break;
      case 'BAD_KEY':
        msg   = 'API key गलत है या अभी चालू नहीं हुई। नई key को चालू होने में ~1 घंटा लगता है।';
        msgEn = 'The API key is wrong or not active yet. A new key takes about an hour to activate.';
        ic = 'key'; break;
      default:
        msg   = 'मौसम की जानकारी नहीं मिल पाई (इंटरनेट या सर्वर की दिक्कत)। ' +
                'बाकी ऐप बिना इंटरनेट के काम करता रहेगा।';
        msgEn = 'Weather information could not be fetched (an internet or server problem). ' +
                'The rest of the app keeps working without internet.';
    }
    renderWeatherMessage(msg, {
      icon: ic, en: msgEn, form: form,
      retryLabel: form ? 'मेरी लोकेशन से / Use my location' : undefined,
    });
  } finally {
    state.weatherBusy = false;
  }
}

/**
 * DEMO / TESTING — bina asli baarish ke warnings dikhane ke liye.
 * Browser console me chalayein:  demoWeather('rain') | 'humid' | 'clear' | 'off'
 */
function applyDemoWeather(scenario) {
  const base = {
    place: 'डेमो गाँव (Demo)', tempC: 29, feelsC: 32, humidity: 68,
    windKmh: 11, desc: 'हल्के बादल', condId: 801,
  };
  let current = { name: base.place, main: { temp: base.tempC, feels_like: base.feelsC, humidity: base.humidity },
                  wind: { speed: base.windKmh / 3.6 }, weather: [{ id: base.condId, description: base.desc }] };
  const now = Math.floor(Date.now() / 1000);
  let list = [];

  if (scenario === 'rain') {
    // 6 ghante baad 80% baarish
    list = [
      { dt: now + 3 * 3600, pop: 0.2, main: { humidity: 70 }, weather: [{ id: 801 }] },
      { dt: now + 6 * 3600, pop: 0.8, main: { humidity: 78 }, weather: [{ id: 500 }] },
      { dt: now + 9 * 3600, pop: 0.9, main: { humidity: 82 }, weather: [{ id: 501 }] },
    ];
  } else if (scenario === 'humid') {
    current.main.humidity = 91;
    current.weather[0].description = 'धुंध भरा';
    list = [
      { dt: now + 3 * 3600, pop: 0.1, main: { humidity: 92 }, weather: [{ id: 701 }] },
      { dt: now + 6 * 3600, pop: 0.2, main: { humidity: 89 }, weather: [{ id: 701 }] },
    ];
  } else { // 'clear'
    current.weather[0].description = 'साफ आसमान';
    list = [
      { dt: now + 3 * 3600, pop: 0.05, main: { humidity: 55 }, weather: [{ id: 800 }] },
      { dt: now + 6 * 3600, pop: 0.0,  main: { humidity: 50 }, weather: [{ id: 800 }] },
    ];
  }

  const model = buildWeatherModel(current, { list: list });
  model.place = base.place + ' · DEMO';
  state.weather = model;
  renderWeather();
}

/** Console helper: demoWeather('rain') */
function demoWeather(scenario) {
  if (scenario === 'off' || scenario === null) {
    WEATHER_CONFIG.DEMO_SCENARIO = null;
    refreshWeather({ force: true });
    return 'demo band — asli data laa rahe hain';
  }
  WEATHER_CONFIG.DEMO_SCENARIO = scenario || 'rain';
  applyDemoWeather(WEATHER_CONFIG.DEMO_SCENARIO);
  return 'demo mode: ' + WEATHER_CONFIG.DEMO_SCENARIO;
}
window.demoWeather = demoWeather;   // console se chalane ke liye


/* ============================================================================
 * SECTION 12 — SPEECH (Web Speech API — sab kuch device par)
 *
 * Handle kiye gaye edge cases:
 *   - API hi na ho (purane browsers)
 *   - Hindi voice install na ho -> note dikhate hain, phir bhi bolne ki koshish
 *   - Lamba text -> Chrome ~15 sec baad ruk jaata hai, isliye tukdon me bolte hain
 * ========================================================================= */

const speech = {
  supported: typeof window.speechSynthesis !== 'undefined' &&
             typeof window.SpeechSynthesisUtterance !== 'undefined',
  voices: [], activeBtn: null, keepAlive: null,

  /* current: chal raha utterance — ISKA REFERENCE ZAROORI HAI, warna Chrome ka
     garbage collector use beech me utha leta hai aur awaaz aadhi kat jaati hai.
     advance: watchdog ise bulakar agle tukde par le jaata hai. */
  current: null, advance: null,

  /* Har baar bolne par yeh number badhta hai. Purane utterance ke callbacks
     apna number check karte hain — isse "pehle wala Speak abhi band kiya aur
     turant doosra Speak dabaya" wali race condition nahi hoti. */
  session: 0,
};

function refreshVoices() {
  if (!speech.supported) return;
  try { speech.voices = window.speechSynthesis.getVoices() || []; }
  catch (_) { speech.voices = []; }
}

/**
 * Voice DO tarah ki hoti hai — aur yahi offline ka poora khel hai:
 *
 *   localService === true   -> phone ke andar wali awaaz (Google TTS engine).
 *                              BINA INTERNET chalti hai.
 *   localService === false  -> Google ke server se aane wali awaaz
 *                              (jaise "Google हिन्दी"). Internet ke bina CHUP.
 *
 * Chrome aksar network wali awaaz ko list me PEHLE rakhta hai. Pehle wala code
 * seedha pehli hi-IN awaaz utha leta tha — isliye offline me Speak dabane par
 * kuch sunai hi nahi deta tha. Ab hum offline hone par sirf phone wali awaazein
 * dekhte hain.
 */
function isLocalVoice(v) {
  return !!v && v.localService !== false;      // undefined ho to local maan lo
}

/**
 * @param {object} [opts] { localOnly: true } -> sirf phone ke andar wali awaaz
 * Bhasha ka kram: hi-IN -> koi bhi Hindi -> en-IN -> koi bhi English.
 * Har bhasha ke andar phone wali awaaz ko preference milti hai.
 */
function pickVoice(opts) {
  if (!speech.voices.length) refreshVoices();
  const localOnly = !!(opts && opts.localOnly);
  const pool = localOnly ? speech.voices.filter(isLocalVoice) : speech.voices;

  /* Kisan ne jo bhasha chuni hai wo sabse pehle. Us bhasha ki awaaz phone me
     na ho to hi हिन्दी, aur wo bhi na ho to English — yahi fallback chain
     js/language-picker.js me bhi likhi hai. */
  const want = (CONFIG.SPEECH_LANG || 'hi-IN').toLowerCase();
  const wantBase = want.split('-')[0];

  const tiers = [
    (l) => l === want,
    (l) => l.indexOf(wantBase) === 0,
    (l) => l === 'hi-in',
    (l) => l.indexOf('hi') === 0,
    (l) => l === 'en-in',
    (l) => l.indexOf('en') === 0,
  ];

  for (let i = 0; i < tiers.length; i++) {
    const match = pool.filter((v) => v.lang && tiers[i]((v.lang || '').toLowerCase()));
    if (!match.length) continue;
    return match.find(isLocalVoice) || match[0];   // tier ke andar local pehle
  }
  return null;
}

/** Bina internet ke bhi bol payegi? (Offline & Help screen ispar status dikhati hai) */
function offlineVoiceInfo() {
  if (!speech.supported) return { ok: false, reason: 'unsupported' };
  if (!speech.voices.length) refreshVoices();

  const localHindi = speech.voices.filter(
    (v) => isLocalVoice(v) && (v.lang || '').toLowerCase().indexOf('hi') === 0
  );
  if (localHindi.length) return { ok: true, reason: 'hindi', voice: localHindi[0] };

  const anyLocal = speech.voices.filter(isLocalVoice);
  if (anyLocal.length) return { ok: true, reason: 'other-lang', voice: anyLocal[0] };

  if (speech.voices.length) return { ok: false, reason: 'network-only' };
  return { ok: false, reason: 'none' };
}

/** Lambe text ko chhote tukdon me todo (Chrome ki 15-second bug ka ilaj). */
function chunkText(text, maxLen) {
  const limit = maxLen || 180;
  const chunks = [];
  let current = '';

  text.split(/(?<=[।.!?])\s+/).forEach((s) => {
    if ((current + ' ' + s).trim().length <= limit) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      current = s.trim();

      // Ek hi vaakya limit se bada ho — pehle comma par todo, phir space par.
      // (Pehle yahan seedha slice() tha, jo Hindi shabd ke BEECH me kaat deta tha
      //  aur "गे-हूँ" jaisa tuta hua uchcharan aata tha.)
      while (current.length > limit) {
        let cut = current.lastIndexOf(',', limit);
        if (cut < limit * 0.5) cut = current.lastIndexOf(' ', limit);
        if (cut < limit * 0.5) cut = limit;      // koi jagah hi na mile tabhi
        chunks.push(current.slice(0, cut).trim());
        current = current.slice(cut).trim();
      }
    }
  });
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

function setSpeakBtnState(btn, speaking) {
  if (!btn) return;
  btn.dataset.speaking = speaking ? 'true' : 'false';
  // Kuch button ka apna naam hota hai (jaise "आवाज़ जाँचें") — wo wapas aana chahiye
  const idle = btn.dataset.idleLabel || 'सुनें / Speak';
  btn.innerHTML = speaking
    ? icon('stop') + '<span>रोकें / Stop</span>'
    : icon('speaker') + '<span>' + escapeHtml(idle) + '</span>';
}

function stopSpeaking() {
  if (!speech.supported) return;
  speech.session++;                       // purane callbacks ab invalid ho gaye
  try { window.speechSynthesis.cancel(); } catch (_) {}
  if (speech.keepAlive) { clearInterval(speech.keepAlive); speech.keepAlive = null; }
  speech.current = null;                  // ab GC le jaye to koi harj nahi
  speech.advance = null;
  if (speech.activeBtn) setSpeakBtnState(speech.activeBtn, false);
  speech.activeBtn = null;
}

function speakText(text, btn, hostForNote) {
  if (!speech.supported) {
    showInfo('इस ब्राउज़र में आवाज़ (Text-to-Speech) की सुविधा नहीं है। कृपया Chrome इस्तेमाल करें।',
             'This browser does not support speech (Text-to-Speech). Please use Chrome.');
    return;
  }

  stopSpeaking();
  refreshVoices();

  // Internet nahi hai -> sirf phone ke andar wali awaaz kaam karegi.
  // (Online bhi local awaaz behtar hai — turant shuru hoti hai aur data nahi lagta.)
  const offline = !navigator.onLine;
  let voice = pickVoice({ localOnly: offline });
  if (!voice) voice = pickVoice({});             // kuch bhi na mile to jo mile wahi

  const hindiAvailable = !!(voice && voice.lang && voice.lang.toLowerCase().startsWith('hi'));

  // Offline hain aur phone me koi awaaz hai hi nahi -> saaf-saaf bata do
  if (offline && !isLocalVoice(voice)) {
    showInfo(
      'बिना इंटरनेट आवाज़ के लिए फ़ोन में हिंदी वॉइस डाउनलोड होनी चाहिए। ' +
      'Settings → Language & input → Text-to-speech → हिंदी चुनकर डाउनलोड करें। ' +
      'तब यह सलाह बिना नेटवर्क भी सुनाई देगी।',
      'Offline speech needs an on-device Hindi voice. Go to Settings → Language & input → ' +
      'Text-to-speech and download the Hindi voice.'
    );
  }

  // Hindi voice na ho to ek chhota note (per card sirf ek baar)
  if (!hindiAvailable && hostForNote && !hostForNote.querySelector('.voice-note')) {
    const note = document.createElement('p');
    note.className = 'voice-note';
    note.textContent = voice
      ? 'इस फ़ोन में हिंदी आवाज़ नहीं मिली, इसलिए "' + voice.name + '" आवाज़ से पढ़ा जा रहा है। ' +
        'बेहतर उच्चारण के लिए Settings → Language & input → Text-to-speech में हिंदी वॉइस डाउनलोड करें।'
      : 'इस फ़ोन में हिंदी आवाज़ इंस्टॉल नहीं है। Settings → Language & input → Text-to-speech ' +
        'में जाकर हिंदी वॉइस डाउनलोड करें, तब आवाज़ साफ़ सुनाई देगी।';
    hostForNote.appendChild(note);
  }

  speech.activeBtn = btn;
  setSpeakBtnState(btn, true);

  const mySession = ++speech.session;     // is baar ka apna number
  const chunks = chunkText(text);
  let index = 0;
  let triedLocalFallback = false;         // network voice fail hone par ek retry
  let quietTicks = 0;                     // kitni der se kuch bola hi nahi gaya

  const speakNext = () => {
    if (mySession !== speech.session) return;      // beech me kuch aur shuru ho gaya
    if (index >= chunks.length) { stopSpeaking(); return; }

    const u = new SpeechSynthesisUtterance(chunks[index++]);
    u.lang = CONFIG.SPEECH_LANG;
    if (voice) u.voice = voice;
    u.rate = CONFIG.SPEECH_RATE; u.pitch = 1; u.volume = 1;

    /* Ek tukda sirf EK BAAR aage badhna chahiye — chahe 'end' aaye, 'error'
       aaye, ya watchdog use mara hua ghoshit kare. */
    let moved = false;
    const advance = (reason) => {
      if (moved || mySession !== speech.session) return;
      moved = true;
      quietTicks = 0;
      if (reason) {
        console.warn('[speech] aage badhe kyunki:', reason,
                     '| tukda', index, '/', chunks.length);
      }
      speakNext();
    };
    speech.advance = advance;             // watchdog isi ko bulata hai

    u.onend = () => advance(null);
    u.onerror = (e) => {
      if (mySession !== speech.session) return;    // purana utterance — ignore
      console.warn('[speech] error:', e.error);

      // Network wali awaaz thi aur internet nahi mila -> phone wali awaaz se
      // ek baar dobara koshish karo (yeh offline ka sabse aam case hai).
      if ((e.error === 'network' || e.error === 'synthesis-failed') && !triedLocalFallback) {
        const localVoice = pickVoice({ localOnly: true });
        if (localVoice && localVoice !== voice) {
          triedLocalFallback = true;
          voice = localVoice;
          index = Math.max(0, index - 1);          // wahi tukda dobara bolo
          moved = true;                            // is utterance ka kaam khatam
          console.info('[speech] network voice fail — phone wali awaaz se retry:', localVoice.name);
          setTimeout(speakNext, 60);
          return;
        }
      }

      if (e.error === 'interrupted' || e.error === 'canceled') { moved = true; return; }

      // Baaki galtiyon par bhi RUKTE NAHI — agla tukda bolne ki koshish karte hain,
      // taaki kisan ko aadhi salah na mile.
      if (index < chunks.length) { advance('error: ' + e.error); return; }

      showInfo('आवाज़ चलाने में समस्या आई। कृपया फ़ोन का वॉल्यूम और silent mode जाँचें।',
               'Something went wrong while playing the audio. Please check your phone\'s ' +
               'volume and silent mode.');
      stopSpeaking();
    };

    /* CHROME KA SABSE BADA BUG — YEH LINE HATANA MAT
       Utterance ka reference kahin na kahin rakhna PADTA hai. Agar sirf local
       variable me rahe, to Chrome ka garbage collector use beech me utha leta
       hai aur awaaz chupchaap band ho jaati hai — na 'end' aata hai, na 'error'.
       Kisan ko aadhi salah sunai deti hai. Isi liye hum use yahan pakad kar
       rakhte hain. */
    speech.current = u;

    window.speechSynthesis.speak(u);
  };

  /* ---- WATCHDOG (har 1 sec) ------------------------------------------------
   * Do kaam karta hai:
   *   1. Chrome kabhi khud pause kar deta hai -> use resume kar do.
   *      (Purana code har 9 sec par KHUD pause()+resume() karta tha — wahi
   *       Android par tukda beech me kaat deta tha. Ab hum sirf tab resume
   *       karte hain jab sach me pause hua ho.)
   *   2. Agar utterance chupchaap mar gaya (na bol raha, na queue me kuch) to
   *      2 second baad agle tukde par khud aage badh jao — poori salah sunani hai.
   * ------------------------------------------------------------------------ */
  speech.keepAlive = setInterval(() => {
    if (mySession !== speech.session) return;
    const ss = window.speechSynthesis;

    if (ss.paused) { try { ss.resume(); } catch (_) {} quietTicks = 0; return; }
    if (ss.speaking || ss.pending) { quietTicks = 0; return; }

    quietTicks++;
    if (quietTicks >= 2 && typeof speech.advance === 'function') {
      speech.advance('awaaz chupchaap ruk gayi thi');
    }
  }, 1000);

  // Chrome me cancel() ko settle hone me ek tick lagta hai — turant speak()
  // karne par naya utterance "interrupted" hokar mar jaata hai.
  setTimeout(speakNext, 80);
}

/* ---------------------------------------------------------------------------
 * "Offline & Help" par awaaz ki halat — kisan khet jaane se pehle jaanch le.
 * ------------------------------------------------------------------------- */
function renderVoiceStatus() {
  if (!el.voiceStatusLine) return;
  refreshVoices();
  const info = offlineVoiceInfo();

  const steps = [
    'फ़ोन की Settings खोलें',
    'Language & input → Text-to-speech output में जाएँ',
    'Google Text-to-Speech चुनें → Install voice data → हिंदी डाउनलोड करें',
  ];
  const showSteps = (on) => {
    if (!el.voiceSteps) return;
    if (on) {
      el.voiceSteps.innerHTML = steps.map((t) => '<li>' + escapeHtml(t) + '</li>').join('');
      show(el.voiceSteps);
    } else { hide(el.voiceSteps); }
  };

  if (info.reason === 'unsupported') {
    el.voiceStatusLine.textContent =
      'इस ब्राउज़र में आवाज़ की सुविधा नहीं है। Chrome इस्तेमाल करें।';
    if (el.voiceTestBtn) el.voiceTestBtn.disabled = true;
    showSteps(false);
    return;
  }

  if (info.reason === 'hindi') {
    el.voiceStatusLine.textContent =
      'हिंदी आवाज़ फ़ोन में मौजूद है (' + info.voice.name + ') — बिना इंटरनेट भी बोलेगी।';
    showSteps(false);
  } else if (info.reason === 'other-lang') {
    el.voiceStatusLine.textContent =
      'फ़ोन में आवाज़ तो है (' + info.voice.name + ') पर हिंदी नहीं। बिना इंटरनेट बोलेगी, ' +
      'लेकिन उच्चारण साफ़ नहीं होगा। हिंदी वॉइस ऐसे डाउनलोड करें:';
    showSteps(true);
  } else if (info.reason === 'network-only') {
    el.voiceStatusLine.textContent =
      'इस फ़ोन में सिर्फ़ इंटरनेट वाली आवाज़ मिली — बिना नेटवर्क कुछ सुनाई नहीं देगा। ' +
      'हिंदी वॉइस ऐसे डाउनलोड करें:';
    showSteps(true);
  } else {
    el.voiceStatusLine.textContent =
      'आवाज़ें अभी लोड हो रही हैं… "आवाज़ जाँचें" दबाकर देखें।';
    showSteps(false);
  }
}

function wireSpeakButton(btn, hostForNote) {
  if (!btn) return;
  if (!speech.supported) {
    btn.disabled = true;
    btn.title = 'इस ब्राउज़र में Text-to-Speech उपलब्ध नहीं है';
    return;
  }
  btn.addEventListener('click', () => {
    if (btn.dataset.speaking === 'true') { stopSpeaking(); return; }
    speakText(getAdvisory(btn.dataset.label).speech, btn, hostForNote || btn.closest('.adv'));
  });
}


/* ============================================================================
 * SECTION 14 — कृषि विभाग से जुड़ाव (report + advisory)
 *
 * DO TARAF KA RASTA:
 *
 *   1. KISAN -> VIBHAG  (POST /api/scans)
 *      Jaanch ka nateeja Regional Admin dashboard ke "Field Verification Queue"
 *      me pahunchta hai, taaki adhikari dekh sakein ki kis ilaake me kaunsa rog
 *      failna shuru hua hai.
 *
 *   2. VIBHAG -> KISAN  (GET /api/advisories)
 *      Adhikari koi chetavni bhejein to wo kisan ki app me upar dikh jaati hai.
 *
 * NIJTA — yeh sabse zaroori niyam hai:
 *   - Bhejna DEFAULT ME BAND hai. Kisan "Offline & Help" me khud chालू kare
 *     tabhi kuch jaata hai.
 *   - Naam aur phone number KABHI nahi jaate.
 *   - Location tabhi jaati hai jab kisan pehle se mausam ke liye jagah de chuka ho.
 *   - Offline mode me kuch bhi nahi jaata (bhejne ke liye internet chahiye hi).
 *
 * Chetavni PADHNA hamesha chalu hai — wo sarvajanik soochna hai, usme kisan ka
 * koi data nahi jaata.
 * ========================================================================= */

const REPORT_KEY = 'agriai.report.v1';
const ADVISORY_SEEN_KEY = 'agriai.advisory.seen.v1';

function loadReportOptIn() {
  try { return localStorage.getItem(REPORT_KEY) === 'on'; } catch (_) { return false; }
}

function setReportOptIn(on) {
  state.reportOptIn = !!on;
  try { localStorage.setItem(REPORT_KEY, on ? 'on' : 'off'); } catch (_) {}
  renderReportToggle();
}

function renderReportToggle() {
  if (!el.reportToggle) return;
  const on = state.reportOptIn;
  el.reportToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  el.reportToggle.classList.toggle('is-on', on);
  el.reportToggle.textContent = on ? 'भेजना चालू है' : 'भेजना चालू करें';
  if (el.reportNote) {
    el.reportNote.textContent = on
      ? 'हर जाँच का नतीजा, फसल और पत्ती का छोटा फोटो कृषि विभाग को जाता है। ' +
        'नाम और फ़ोन नंबर नहीं जाते। कभी भी बंद कर सकते हैं।'
      : 'अभी कुछ भी नहीं भेजा जा रहा। चालू करने पर सिर्फ़ जाँच का नतीजा, फसल और ' +
        'पत्ती का छोटा फोटो जाएगा — नाम और फ़ोन नंबर कभी नहीं।';
  }
}

/**
 * Ek jaanch vibhag ko bhejo. Chup-chaap chalta hai — kisan ko intezaar nahi
 * karana, aur fail hone par bhi app par koi asar nahi.
 */
async function reportScanToDept(top) {
  if (!state.reportOptIn) return;                 // kisan ne chalu hi nahi kiya
  if (!navigator.onLine) return;                  // offline — kuch nahi bhejte
  if (!top || !top.confident) return;             // adhoori pehchan bhejne ka fayda nahi

  const crop = activeCrop();
  const a = getAdvisory(top.label);

  const payload = {
    crop: state.cropId,
    cropNameHi: crop ? crop.nameHi : '',
    label: top.label,
    diseaseHi: a.nameHi,
    diseaseEn: a.nameEn,
    confidence: top.prob,
    source: (state.lastResult && state.lastResult.source) || 'local',
    severity: a.severity || '',
    // Chhota thumbnail — adhikari ko patti dekhni hoti hai
    thumb: state.imageEl ? makeThumbnail(state.imageEl, 220) : '',
    appVersion: 'v24',
  };

  // Location SIRF tab jab kisan pehle se jagah de chuka ho (mausam ke liye)
  if (state.lastPos && typeof state.lastPos.lat === 'number') {
    payload.lat = state.lastPos.lat;
    payload.lng = state.lastPos.lon;
  }

  try {
    const res = await fetch(CONFIG.REPORT.SCANS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (data && data.ok) {
      console.info('[report] vibhag ko bhej di:', data.id, '| storage:', data.storage);
      if (el.reportNote) {
        el.reportNote.textContent =
          'पिछली जाँच कृषि विभाग को भेज दी गई (' + data.id + ')।';
      }
    } else {
      console.warn('[report] nahi bheji ja saki:', data && data.error);
    }
  } catch (err) {
    console.warn('[report] network fail:', err.message);   // chup-chaap chhod do
  }
}

/* ---------------------------------------------------------------------------
 * VIBHAG KI CHETAVNI — kisan ki fasal ke hisaab se
 * ------------------------------------------------------------------------- */
function loadSeenAdvisories() {
  try { return JSON.parse(localStorage.getItem(ADVISORY_SEEN_KEY) || '[]'); }
  catch (_) { return []; }
}
function markAdvisorySeen(id) {
  const seen = loadSeenAdvisories();
  if (seen.indexOf(id) === -1) seen.unshift(id);
  seen.length = Math.min(seen.length, 40);
  try { localStorage.setItem(ADVISORY_SEEN_KEY, JSON.stringify(seen)); } catch (_) {}
}

async function fetchAdvisories() {
  if (!navigator.onLine || !state.cropId) return;

  try {
    /* Kisan ki chuni hui bhasha bhi bhej dete hain — server wahin anuvaad
       karke bhejta hai. Anuvaad na ho paye to asli Hindi aata hai. */
    const lang = (window.kmLang && window.kmLang.current) ? window.kmLang.current().code : '';
    const url = CONFIG.REPORT.ADVISORIES + '?crop=' + encodeURIComponent(state.cropId) +
                (lang ? '&lang=' + encodeURIComponent(lang) : '');
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.ok) return;

    state.advisories = data.advisories || [];
    renderAdvisoryAlert();

    /* Card dikhana kaafi nahi — phone jeb me ho to wo kabhi nahi dikhta.
       Isliye nayi chetavni par ghanti + kampan + notification bhi. */
    if (window.kmNotify) window.kmNotify.pushMany(state.advisories, 'broadcast');
    else if (window.kmAlerts) window.kmAlerts.alertMany(state.advisories);

    /* Vibhag ki darj ki hui dawa/matra bhi saath me utaar lete hain. */
    fetchProtocols();
  } catch (err) {
    console.warn('[advisory] nahi mili:', err.message);
  }
}

/* ---------------------------------------------------------------------------
 * KRISHI VIBHAG KI DARJ MATRA (CIBRC protocol)
 *
 * Adhikari dashboard se dawa aur matra darj karta hai (/api/protocols).
 * Wo yahan aakar salah ke upar dikhti hai. Bina iske adhikari ka likha
 * hua kahin nahi pahunchta — wo sirf database me pada rehta.
 *
 * Offline: aakhri baar utari hui list localStorage me rehti hai, isliye
 * khet me net na ho tab bhi wahi matra dikhti hai jo aakhri baar mili thi.
 * ------------------------------------------------------------------------- */
const PROTOCOL_KEY = 'km.protocols.v1';

function loadProtocols() {
  try { return JSON.parse(localStorage.getItem(PROTOCOL_KEY) || '[]'); }
  catch (_) { return []; }
}

async function fetchProtocols() {
  if (!navigator.onLine) return;
  try {
    const res = await fetch('api/protocols', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.ok || !Array.isArray(data.protocols)) return;
    localStorage.setItem(PROTOCOL_KEY, JSON.stringify(data.protocols));
  } catch (_) { /* net gaya — purani list chalti rahegi */ }
}

/* Rog ka naam alag-alag tarike se likha ja sakta hai, isliye dono taraf
   se dhoondhte hain — Hindi naam bhi, angrezi bhi. */
function protocolFor(a) {
  const rows = loadProtocols();
  if (!rows.length || !a) return null;
  const crop = String(state.cropId || '').toLowerCase();
  const hi = String(a.nameHi || '').toLowerCase();
  const en = String(a.nameEn || '').toLowerCase();

  return rows.find((r) => {
    if (crop && String(r.crop || '').toLowerCase() !== crop) return false;
    const rd = String(r.disease || '').toLowerCase();
    const re = String(r.diseaseEn || '').toLowerCase();
    return (rd && (rd === hi || hi.indexOf(rd) !== -1 || rd.indexOf(hi) !== -1)) ||
           (re && en && (re === en || en.indexOf(re) !== -1 || re.indexOf(en) !== -1));
  }) || null;
}

function deptProtocolHtml(a) {
  const p = protocolFor(a);
  if (!p) return '';
  return [
    '<div class="adv__block adv__block--dept">',
      '<h4>', icon('shield', 'ic ic--xs'), ' कृषि विभाग की दर्ज मात्रा</h4>',
      p.chemical ? '<p class="dept-chem">' + escapeHtml(p.chemical) + '</p>' : '',
      '<p class="dept-dose"><strong>', escapeHtml(p.dose), '</strong></p>',
      p.waitingPeriodDays
        ? '<p class="dept-wait">छिड़काव के बाद <strong>' + escapeHtml(String(p.waitingPeriodDays)) +
          ' दिन</strong> तक फसल न तोड़ें।</p>'
        : '',
      p.cibrcRegNo ? '<p class="dept-reg">CIBRC पंजीकरण: ' + escapeHtml(p.cibrcRegNo) + '</p>' : '',
      p.notes ? '<p class="dept-note">' + escapeHtml(p.notes) + '</p>' : '',
      /* Adhikari ki portal ID ab kisan tak nahi aati — wo uska login
         username bhi hai, isliye use sarvajanik nahi bhejte. Par kisan ko
         itna pata hona hi chahiye ki yeh matra APP ne nahi gadhi, vibhag
         ne likhi hai. Wahi likhte hain. */
      '<p class="dept-by">', escapeHtml(p.updatedBy
        ? 'दर्ज करने वाला: ' + p.updatedBy
        : 'कृषि विभाग द्वारा दर्ज — ऐप का अनुमान नहीं'), '</p>',
    '</div>',
  ].join('');
}

function renderAdvisoryAlert() {
  if (!el.advisoryAlert) return;

  const seen = loadSeenAdvisories();
  const list = (state.advisories || []).filter((a) => seen.indexOf(a.id) === -1);

  if (!list.length) { hide(el.advisoryAlert); return; }

  const a = list[0];                                  // sabse nayi
  const cls = a.severity === 'critical' ? 'critical'
            : a.severity === 'warning' ? 'warning' : 'info';
  // NOTE: is variable ka naam `icon` NAHI rakh sakte — wo global icon() helper
  // ko dhak deta hai. Isliye alertIcon.
  const alertIcon = a.severity === 'info' ? 'info' : 'alert';

  el.advisoryAlert.className = 'card dept-alert dept-alert--' + cls;
  el.advisoryAlert.innerHTML = [
    '<div class="dept-alert__row">',
      '<span class="dept-alert__icon" aria-hidden="true">', icon(alertIcon), '</span>',
      '<div class="dept-alert__body">',
        '<p class="dept-alert__tag">कृषि विभाग की चेतावनी',
          a.district && a.district !== 'all' ? ' · ' + escapeHtml(a.district) : '', '</p>',
        '<p class="dept-alert__title">', escapeHtml(a.title || a.titleHi || ''), '</p>',
        '<p class="dept-alert__msg">', escapeHtml(a.message || a.messageHi || ''), '</p>',
        a.chemical ? '<p class="dept-alert__chem">' + icon('pill', 'ic ic--xs') + ' ' +
          escapeHtml(a.chemical) +
          (a.cibrcApproved ? ' <strong>(CIBRC अनुमोदित)</strong>' : '') + '</p>' : '',
        a.issuedBy ? '<p class="dept-alert__by">— ' + escapeHtml(a.issuedBy) + '</p>' : '',
      '</div>',
      '<button type="button" class="dept-alert__close" id="advisoryDismiss" ',
        'aria-label="चेतावनी बंद करें">' + icon('close', 'ic ic--xs') + '</button>',
    '</div>',
  ].join('');

  const close = $('#advisoryDismiss');
  if (close) {
    close.addEventListener('click', () => {
      markAdvisorySeen(a.id);
      renderAdvisoryAlert();          // agli chetavni ho to wo dikha do
    });
  }
  show(el.advisoryAlert);
}


/* ============================================================================
 * SECTION 13 — INIT (events + service worker)
 * ========================================================================= */

/* ---------------------------------------------------------------------------
 * BHASHA BADALNE PAR AWAAZ BHI BADLE
 * js/language-picker.js `km:language` event bhejta hai. Yahan use pakad kar
 * CONFIG.SPEECH_LANG badal dete hain, taaki agli baar bolne par awaaz nayi
 * bhasha me ho. Jis bhasha ki awaaz phone me nahi hai, uske liye picker khud
 * hi Hindi/English par gir jaata hai aur note bhi bhej deta hai.
 * ------------------------------------------------------------------------- */
/* App khulte hi pichhli baar chuni hui bhasha uthao.
   Pehle CONFIG.SPEECH_LANG 'hi-IN' par shuru hota tha aur sirf tab badalta
   tha jab kisan bhasha BADALTA. Yani Tamil chunne wale kisan ko har baar
   app kholne par pehla vaakya Hindi me sunai deta tha. */
/* CONFIG ek top-level const hai, isliye wo window par nahi aata. Doosri
   file (js/tour.js) ko bolne ki bhasha chahiye, isliye ek chhota rasta. */
window.kmSpeechLang = function () { return CONFIG.SPEECH_LANG; };

(function initSpeechLang() {
  try {
    const p = JSON.parse(localStorage.getItem('km.preferences.v1') || '{}');
    if (p.language) CONFIG.SPEECH_LANG = p.language;
  } catch (_) { /* prefs na mile to Hindi hi sahi */ }
})();

window.addEventListener('km:language', (e) => {
  const d = e.detail || {};
  if (!d.code) return;

  // Bolne ke liye wahi code jispar fallback ruka (na ki jo chuna gaya tha) —
  // warna browser un-installed bhasha par chup reh jaata hai.
  const speakCode = (d.voice && d.voice.code) || d.code;
  CONFIG.SPEECH_LANG = speakCode;
  state.langNote = (d.voice && d.voice.note) || '';

  stopSpeaking();                    // purani bhasha ka bacha hua vaakya band
  refreshVoices();

  // Topbar, fasal ke card aur handbook — sab turant nayi bhasha me
  try {
    renderCropCards();
    renderLibrary();
    updateCropChip();
    if (typeof renderOfflineManager === 'function') renderOfflineManager();
    const v = document.querySelector('.view.is-active');
    if (v) switchView(v.id.replace('view-', ''));
  } catch (_) {}
  console.info('[lang] awaaz ab:', speakCode, state.langNote ? '(' + state.langNote + ')' : '');

  if (state.langNote) showInfo(state.langNote, 'Voice for this language is not installed on this phone.');
});

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;   // file:// par nahi

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => console.info('[sw] registered, scope:', reg.scope))
      .catch((err) => console.warn('[sw] registration failed:', err.message));
  });
}

function wireEvents() {
  /* drawer */
  el.drawerOpen.addEventListener('click', openDrawer);
  el.drawerClose.addEventListener('click', closeDrawer);
  el.scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  /* nav (sidebar + "View All" jaise buttons) */
  $$('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  /* ---- CROP SELECTION ----
     Cards JS se bante hain, isliye event delegation use karte hain. */
  if (el.cropGrid) {
    el.cropGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.crop-card');
      if (!card || card.disabled) return;
      selectCrop(card.dataset.crop);
    });
  }

  /* ---- ONLINE / OFFLINE MODE (segmented control) ---- */
  if (el.netModeGroup) {
    el.netModeGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg__btn');
      if (btn && btn.dataset.mode) setNetMode(btn.dataset.mode);
    });
  }

  /* ---- OFFLINE MODEL MANAGER ---- */
  if (el.downloadList) {
    el.downloadList.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const li = btn.closest('.dl-item');
      if (li) handleDownloadClick(li, btn.dataset.act);
    });
  }
  if (el.downloadAllBtn) {
    el.downloadAllBtn.addEventListener('click', downloadAllModels);
  }
  if (el.reportToggle) {
    el.reportToggle.addEventListener('click', () => setReportOptIn(!state.reportOptIn));
  }
  if (el.voiceTestBtn) {
    el.voiceTestBtn.addEventListener('click', () => {
      if (el.voiceTestBtn.dataset.speaking === 'true') { stopSpeaking(); return; }
      renderVoiceStatus();
      speakText(
        'नमस्ते किसान भाई। अगर आपको यह आवाज़ साफ सुनाई दे रही है, ' +
        'तो सलाह बिना इंटरनेट के भी सुनी जा सकेगी।',
        el.voiceTestBtn, null
      );
    });
  }
  wireInstallPrompt();

  /* Net badalte hi mode ki line update ho jaye */
  window.addEventListener('online',  () => { renderNetMode(); checkAiEndpoint(); });
  window.addEventListener('offline', renderNetMode);

  /* ---- WEATHER ---- */
  if (el.weatherRefreshBtn) {
    el.weatherRefreshBtn.addEventListener('click', () => refreshWeather({ force: true }));
  }
  if (el.weatherSpeakBtn) {
    if (!speech.supported) {
      el.weatherSpeakBtn.disabled = true;
    } else {
      el.weatherSpeakBtn.addEventListener('click', () => {
        if (el.weatherSpeakBtn.dataset.speaking === 'true') { stopSpeaking(); return; }
        if (!state.weather) return;
        speakText(state.weather.speech, el.weatherSpeakBtn, el.weatherCard);
      });
    }
  }
  // Internet wapas aate hi weather dobara try karo
  window.addEventListener('online',  () => refreshWeather({ force: true }));
  window.addEventListener('offline', () => {
    if (!state.weather) {
      renderWeatherMessage(
        'इंटरनेट चला गया। मौसम अभी नहीं मिलेगा, पर रोग पहचान बिना इंटरनेट के चलती रहेगी।',
        {
          icon: 'wifi-off',
          en: 'The internet connection dropped. Weather is unavailable right now, but disease ' +
              'detection keeps working offline.',
        }
      );
    }
  });

  /* file inputs */
  el.cameraBtn.addEventListener('click', () => el.cameraInput.click());
  el.galleryBtn.addEventListener('click', () => el.galleryInput.click());
  el.cameraInput.addEventListener('change', handleFileSelected);
  el.galleryInput.addEventListener('change', handleFileSelected);

  /* dropzone: click + keyboard + drag&drop */
  el.dropzone.addEventListener('click', (e) => {
    if (e.target.closest('.preview-clear')) return;     // hatane wale button ka apna kaam hai
    el.galleryInput.click();
  });
  el.dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.galleryInput.click(); }
  });
  ['dragenter', 'dragover'].forEach((ev) =>
    el.dropzone.addEventListener(ev, (e) => {
      e.preventDefault(); el.dropzone.classList.add('is-drag');
    }));
  ['dragleave', 'drop'].forEach((ev) =>
    el.dropzone.addEventListener(ev, (e) => {
      e.preventDefault(); el.dropzone.classList.remove('is-drag');
    }));
  el.dropzone.addEventListener('drop', (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) acceptFile(f);
  });

  /* "फिर भी जाँचें" — kisan ki apni marzi, leaf-gate ek baar chhod do */
  if (el.forceScanBtn) {
    el.forceScanBtn.addEventListener('click', () => {
      state.forceScan = true;
      hide(el.notPlantBox);
      runPrediction();
    });
  }
  if (el.retakeBtn) {
    el.retakeBtn.addEventListener('click', () => {
      clearImage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (el.clearBtn) el.clearBtn.addEventListener('click', (e) => { e.stopPropagation(); clearImage(); });

  /* ---- BATCH SCAN (2 se 40 photo) ---- */
  if (el.batchScanBtn) el.batchScanBtn.addEventListener('click', runBatchScan);
  if (el.batchClearBtn) el.batchClearBtn.addEventListener('click', clearBatch);
  if (el.batchGrid) {
    el.batchGrid.addEventListener('click', (e) => {
      const x = e.target.closest('[data-remove]');
      if (x) removeFromBatch(x.dataset.remove);
    });
  }

  if (el.againBtn) el.againBtn.addEventListener('click', () => {
    clearBatch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  el.clearHistoryBtn.addEventListener('click', () => {
    if (!state.history.length) return;
    if (!confirm('सारी पुरानी जाँचें हटा दें?')) return;
    state.history = [];
    persistHistory();
    renderHistory(); renderRecent(); updateHistoryBadge();
  });

  el.errorClose.addEventListener('click', () => hide(el.errorBanner));
  el.infoClose.addEventListener('click', () => hide(el.infoBanner));

  /* aawaz band ho jaani chahiye jab page chhod dein */
  window.addEventListener('pagehide', stopSpeaking);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeaking(); });

  if (speech.supported && typeof window.speechSynthesis.addEventListener === 'function') {
    // Voices der se aati hain — aane par status line dobara banao
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      refreshVoices();
      renderVoiceStatus();
    });
  }
}

async function init() {
  state.netMode = loadNetMode();
  state.reportOptIn = loadReportOptIn();
  wireEvents();
  renderReportToggle();
  renderNetMode();
  refreshVoices();
  loadHistory();
  renderRecent();
  updateHistoryBadge();
  updateCropChip();
  renderBatchTray();
  registerServiceWorker();

  /* Login ke baad ghar = DASHBOARD (pehle seedha "fasal chunein" khulta tha).
     Fasal jaanch wahin se ek tap door hai. */
  switchView('home');
  setStatus('फसल चुनें / Choose crop', 'loading');

  if (location.protocol === 'file:') {
    setStatus('सर्वर चाहिए / Server needed', 'error');
    showError(
      'यह ऐप सीधे फ़ाइल (file://) से नहीं चलेगा, क्योंकि ब्राउज़र model.json पढ़ने नहीं देता। ' +
      'फ़ोल्डर में टर्मिनल खोलकर चलाएँ:  python3 -m http.server 8000  ' +
      'और फिर ब्राउज़र में खोलें: http://localhost:8000',
      'This app cannot run directly from a file (file://), because the browser will not let ' +
      'it read model.json. Open a terminal in this folder and run:  python3 -m http.server 8000  ' +
      'then open http://localhost:8000 in the browser.',
      'लोकल सर्वर से चलाएँ / Run via local server'
    );
    renderCropCards();
    return;
  }

  // Kaunsi fasal ka model maujood hai — "Coming Soon" isi se tay hota hai.
  // (Yeh sirf model.json check karta hai, poora model load NAHI karta.)
  await probeAllCrops();

  const anyReady = Object.keys(state.cropAvailable).some((k) => state.cropAvailable[k]);
  if (!anyReady) {
    setStatus('मॉडल नहीं / No model', 'error');
    showError(
      'किसी भी फसल का मॉडल नहीं मिला। कम-से-कम models/rice/ फ़ोल्डर में model.json, weights.bin ' +
      'और metadata.json होने चाहिए (README देखें)।',
      'No model was found for any crop. At minimum the folder models/rice/ must contain ' +
      'model.json, weights.bin and metadata.json (see the README).',
      'मॉडल नहीं मिला / No model found'
    );
  } else {
    setStatus('फसल चुनें / Choose crop', 'ready');
  }

  // Online AI chaalu hai ya nahi — ek chhota GET. Photo kahin nahi jaati.
  checkAiEndpoint();
  fetchAdvisories();
  renderOfflineManager();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
