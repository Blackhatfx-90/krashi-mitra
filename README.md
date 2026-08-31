# 🌾 AgriAI — AI/ML Crop Disease & Pest Detection + Smart Advisory

Offline-first, **multi-crop** web app. फसल की पत्ती की फोटो से रोग की पहचान **आपके फ़ोन पर ही** होती है — कोई सर्वर नहीं, कोई API नहीं।

| Feature | Internet chahiye? |
|---|---|
| Disease detection (TensorFlow.js) | ❌ नहीं — 100% offline |
| Advisory + Hindi voice | ❌ नहीं |
| History | ❌ नहीं (localStorage) |
| **Weather + spray warning** | ✅ **हाँ** — यही एक feature online है |

---

## 1. Chalane ka tarika (2 minute)

### Step A — model files daalein

App **दोनों** Teachable Machine exports चला लेती है — जो भी folder में मिले:

```
models/rice/   model.json + weights.bin + metadata.json   ← "Tensorflow.js" tab
     या        model.tflite + labels.txt                  ← "Tensorflow Lite" tab
```

Teachable Machine → अपना Image Project → **Export Model** → **Tensorflow.js** या **Tensorflow Lite** tab → **Download my model** → ZIP extract करके फाइलें उस crop के folder में डाल दें।

दोनों में से कुछ भी न मिले, तो उस crop का card अपने-आप **"Coming Soon"** दिखेगा — app crash नहीं होगी।

**⚠️ .tflite वाला रास्ता चुनें तो एक बात ध्यान रखें:** `.tflite` browser में सीधे नहीं चलता, उसके लिए एक WASM runtime चाहिए। App उसे अपने-आप CDN से ले आती है — यानी **पहली बार internet ज़रूरी है**। पूरी तरह offline चलाना है तो ये फाइलें project में रख दें:

```
js/tflite/tf-tflite.min.js          (1.2 MB)
js/tflite/wasm/                     (~7 MB — @tensorflow/tfjs-tflite@0.0.1-alpha.10 के wasm/ folder की सारी files)
```

Local copy मिलते ही app CDN को हाथ नहीं लगाती। `model.json` वाला (Tensorflow.js) export इस झंझट से मुक्त है — वो हमेशा offline चलता है और size भी बहुत कम है।

### Step B — local server chalayein

`file://` से app **नहीं** चलेगी (browser `model.json` fetch नहीं करने देता)।

```bash
cd "/Users/gyan/Desktop/KRASHI MITRA" && python3 -m http.server 8000
```

Browser: **http://localhost:8000**

या:

```bash
bash serve.sh
```

(यह आपका local IP भी print करता है ताकि phone से same Wi-Fi पर test कर सकें।)

---

## 2. 🔑 OpenWeatherMap API key kahan paste karein

**File:** `js/script.js` · **Line ~40** (सबसे ऊपर, बड़े box में)

```js
const WEATHER_API_KEY = "PASTE_KEY_HERE";
```

अपनी free key यहीं `"..."` के अंदर paste कर दें। बस — और कहीं कुछ नहीं बदलना।

Free key: https://openweathermap.org/api → Sign up → **API keys** tab → copy.
⏳ नई key को चालू होने में ~10–60 मिनट लगते हैं (तब तक "API key गलत है" message आएगा — यह normal है)।

Key न डालने पर app crash नहीं होती — weather card में सिर्फ यह लिखा आता है कि key डाल दें, और disease detection पहले जैसा चलता रहता है।

> ⚠️ Geolocation सिर्फ **HTTPS** या **localhost** पर चलता है। LAN IP (`192.168.x.x`) पर browser location block कर देगा — demo के लिए laptop पर localhost use करें, या app को GitHub Pages / Netlify पर host कर दें।

**लोकेशन न मिले तो app अटकती नहीं** — weather card में एक box आ जाता है जहाँ किसान अपना **गाँव/शहर का नाम या 6 अंक का PIN कोड** लिख देता है, और मौसम वहीं का दिखने लगता है। चुनी हुई जगह `localStorage` में याद रहती है, इसलिए दोबारा पूछा नहीं जाता।

- जगह ढूँढने के लिए **वही OpenWeatherMap key** इस्तेमाल होती है (Geocoding API) — कोई नई service या key नहीं चाहिए।
- 6 अंक का इनपुट PIN माना जाता है (`/geo/1.0/zip`), बाकी सब नाम (`/geo/1.0/direct`) — दोनों में देश `IN` लगता है (`WEATHER_CONFIG.COUNTRY`)।
- Card में नीचे हमेशा **"जगह बदलें / Change place"** (या **"जगह खुद चुनें / Set place"**) रहता है, और form में **"मेरी लोकेशन से / Use my location"** से वापस GPS पर जाया जा सकता है।

---

## 3. Project structure

```
KRASHI MITRA/
├── index.html            UI + SVG icon sprite
├── css/style.css         white-minimal theme (saare colors :root me)
├── js/
│   ├── tf.min.js         TensorFlow.js 4.20.0 — LOCAL copy (offline ke liye)
│   └── script.js         CONFIG + CROPS + model + predict + weather + speech
├── models/
│   ├── rice/        model.tflite + labels.txt      (6 classes) ✅
│   ├── wheat/       model.json + weights.bin + metadata.json (14 classes) ✅
│   ├── sugarcane/   (khaali — "Coming Soon")
│   └── mustard/     (khaali — "Coming Soon")
├── assets/logo.svg
├── icon.svg, manifest.json, sw.js, serve.sh
└── README.md
```

---

## 4. ⭐ Nayi fasal (5th crop) kaise jodein

**सिर्फ 2 काम** — core logic छूना नहीं है:

1. `models/<nayi-fasal>/` में model.json + weights.bin + metadata.json डालें
2. `js/script.js` के **SECTION 2 (`CROPS`)** में एक नया block जोड़ें:

```js
tomato: {
  id: 'tomato',
  nameHi: 'टमाटर', nameEn: 'Tomato', altHi: 'टमाटर',
  icon: '🍅', seasonHi: 'रबी',
  labels: ['Tomato_EarlyBlight', 'Tomato_Healthy'],   // metadata.json ka EXACT order
  classes: {
    Tomato_EarlyBlight: {
      emoji: '🟤', nameHi: '...', nameEn: '...', pathogen: '...',
      severity: 'high', severityHi: 'ज़्यादा नुकसान',
      risk: 'high', riskHi: 'ज़्यादा जोखिम / High Risk',
      actions: ['...', '...'],          // dashboard ke "Recommended Actions"
      symptoms: '...', symptomsEn: '...',
      organic: ['...'], chemical: ['...'], prevention: ['...'],
      speech: '...',                    // Hindi awaaz ka saaf paragraph
      // note: '...'                    // optional — laal warning line
    },
    Tomato_Healthy: { /* ... */ },
  },
},
```

3. (Optional) `sw.js` में `CACHE_VERSION` बढ़ा दें और नए model paths जोड़ दें।

Crop card, model loading, advisory card, score bars, crop guide, history — सब अपने आप काम करेंगे।

---

## 5. Testing — bina asli baarish ke 🌧️

Browser का **console** खोलें (F12 → Console) और चलाएँ:

```js
demoWeather('rain')     // ⚠️ "बारिश हो सकती है — अभी spray न करें" warning
demoWeather('humid')    // ⚠️ "फंगल रोग का खतरा" warning (nami 91%)
demoWeather('clear')    // ✅ "मौसम ठीक है"
demoWeather('off')      // wapas asli data
```

या permanently: `js/script.js` में `WEATHER_CONFIG.DEMO_SCENARIO` को `'rain'` कर दें।
इसमें न internet चाहिए, न location, न API key — demo के लिए एकदम safe.

### "Coming Soon" state test करना

- **देखने के लिए**: कुछ मत कीजिए — जिन crops के `models/<crop>/model.json` नहीं हैं, वे already "Coming Soon" दिखेंगे।
- **हटाकर test**: `models/rice/` का नाम बदलकर `models/rice_off/` कर दें → reload → Rice भी "Coming Soon" दिखेगा (app crash नहीं होगी)। वापस नाम बदलकर reload करें।
- **नया crop चालू होते देखना**: `models/sugarcane/` में model files डालें → reload → Sugarcane का badge अपने आप **"तैयार / Ready"** हो जाएगा (Rice और Wheat के models पहले से लगे हैं)।

### Threshold test

`js/script.js` में `CONFIG.CONFIDENCE_THRESHOLD` को `0.99` कर दें → हर फोटो पर "सही तरह identify नहीं हो पाया" वाला message आएगा। वापस `0.75` कर दें।

---

## 6. Team ke liye — kya kahan badalna hai

| काम | File | जगह |
|---|---|---|
| **Weather API key** | `js/script.js` | `WEATHER_API_KEY` (line ~40) |
| बारिश warning का threshold | `js/script.js` | `WEATHER_CONFIG.RAIN_POP_THRESHOLD` (0.5) |
| कितने घंटे आगे देखना है | `js/script.js` | `WEATHER_CONFIG.RAIN_LOOKAHEAD_HOURS` (12) |
| Humidity warning का threshold | `js/script.js` | `WEATHER_CONFIG.HUMIDITY_THRESHOLD` (85) |
| जगह ढूँढने का देश (PIN/शहर) | `js/script.js` | `WEATHER_CONFIG.COUNTRY` (`IN`) |
| Confidence threshold (75%) | `js/script.js` | `CONFIG.CONFIDENCE_THRESHOLD` |
| फसल, labels, पूरी advisory | `js/script.js` | **SECTION 2 — `CROPS`** |
| आवाज़ की speed / भाषा | `js/script.js` | `CONFIG.SPEECH_RATE`, `SPEECH_LANG` |
| Theme के रंग | `css/style.css` | सबसे ऊपर `:root` |
| Brand का नाम | `index.html` | `.brand__name` वाला `<span>` |

> **ZAROORI:** HTML/CSS/JS या model बदलने के बाद `sw.js` में `CACHE_VERSION` का नंबर बढ़ा दें (`krashi-mitra-v2` → `v3`), वरना browser पुरानी cached file ही दिखाता रहेगा।

---

## 7. Confidence threshold logic

- Top prediction **≥ 75%** → Smart Advisory card + risk pill + Recommended Actions + 🔊 Speak
- Top prediction **< 75%** → कोई diagnosis **नहीं**, सिर्फ:
  > "सही तरह identify नहीं हो पाया, कृपया clear फोटो लें या सही crop की leaf upload करें"

दोनों हालत में सभी classes के confidence scores दिखते हैं।

---

## 8. Image preprocessing (क्या हो रहा है)

1. Image को **center से square crop** (Teachable Machine का capture भी यही करता है)
2. Model के input shape से मिला size (आमतौर पर **224 × 224**) पर resize
3. Model के input dtype के हिसाब से pixel values:
   - `float32` (Tensorflow.js export) → `[0,255]` से `[-1,1]` : `(px / 127.5) - 1`
   - `int32`/uint8 (quantized `.tflite`) → pixel `[0,255]` जैसे हैं वैसे ही; dequantization model खुद करता है
4. Batch dimension: shape `[1, 224, 224, 3]`

Output softmax probabilities होती हैं। तीन case handle किए गए हैं:
- sum ≈ 1 → जैसा है वैसा ही
- सब values ≥ 0 और sum > 1 (quantized `.tflite` का uint8 output, sum ≈ 255) → sum से divide
- negative values (raw logits) → app खुद softmax लगाता है

**Quantized model की एक सीमा:** uint8 output में सिर्फ 256 step होते हैं, इसलिए confidence मोटे-मोटे टुकड़ों में आती है (~0.4% steps) और अक्सर 100% या 0% पर जा टिकती है। ज़्यादा बारीक confidence चाहिए तो Tensorflow.js (float) export इस्तेमाल करें।

---

## 9. Troubleshooting

| Problem | हल |
|---|---|
| सारे crops "Coming Soon" | `models/<crop>/` में न `model.json` है न `model.tflite`, या app `file://` से चल रही है — local server use करें |
| "मॉडल लोड नहीं हो पाया" | TFJS export में weights.bin / metadata.json missing है; `.tflite` में internet नहीं मिला (runtime CDN से आता है) |
| `.tflite` model बिना internet नहीं चलता | `js/tflite/` वाली local copy रखें — Step A देखें |
| Weather: "API key चाहिए" | `js/script.js` में `WEATHER_API_KEY` भरें |
| Weather: "API key गलत है" | नई key है — ~1 घंटा रुकें |
| Weather: "लोकेशन की अनुमति नहीं" | Browser के address bar में 🔒 → Location → Allow (HTTPS/localhost ज़रूरी है), **या** card में आए box में गाँव/शहर का नाम या 6 अंक का PIN कोड लिख दें |
| फ़ोन पर LAN IP से location कभी नहीं मिलती | यह browser की पाबंदी है, bug नहीं — PIN कोड वाला box इस्तेमाल करें, या app को HTTPS पर host करें |
| "यह जगह नहीं मिली" | पास के बड़े शहर का नाम, या 6 अंक का PIN कोड डालें। बहुत छोटे गाँव geocoding में नहीं होते |
| Camera नहीं खुलता | `capture` सिर्फ HTTPS/localhost पर। "Choose Image" से gallery use करें |
| हिंदी आवाज़ नहीं आती | Phone: Settings → Language & input → Text-to-speech → Hindi voice download करें |
| पुरानी file दिख रही है | `sw.js` में `CACHE_VERSION` बढ़ाएँ, या DevTools → Application → Unregister SW |
| नया model डाला पर पुराना चल रहा है | Model files cache-first cached हैं — `CACHE_VERSION` बढ़ाएँ |
| iPhone HEIC photo error | Camera settings → "Most Compatible" (JPEG) |

---

## 10. Disclaimer

यह सलाह **सिर्फ मार्गदर्शन** के लिए है। दवा की मात्रा लगभग (approximate) दी गई है। किसी भी छिड़काव से पहले अपने **कृषि विज्ञान केंद्र (KVK)** या कृषि अधिकारी से पुष्टि ज़रूर करें। दवा के डिब्बे पर लिखी सावधानियाँ पढ़ें, और छिड़काव के समय मास्क व दस्ताने पहनें।
