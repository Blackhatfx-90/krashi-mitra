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

**अभी कौन सी फसल तैयार है:**

| फसल | Model | Classes |
|---|---|---|
| धान / Rice | ✅ TensorFlow.js | 17 |
| गेहूँ / Wheat | ✅ TensorFlow.js | 14 |
| गन्ना / Sugarcane | ✅ TensorFlow.js | 16 |
| प्याज / Onion | ✅ TensorFlow.js | 14 |
| मक्का / Maize | ✅ TensorFlow.js | 7 |
| आलू / Potato | ✅ TensorFlow.js | 10 |
| टमाटर / Tomato | ✅ TensorFlow.js | 10 |
| सरसों / Mustard | ❌ अभी नहीं — "Coming Soon" | 5 (सिर्फ advisory तैयार) |

> ⚠️ **Label का नाम बदलना मना है।** `models/<fasal>/metadata.json` में जो नाम और जो **क्रम** है, `js/script.js` के `CROPS.<fasal>.labels` में हू-ब-हू वही होना चाहिए। पाँच जगह model के नाम जान-बूझकर "गलत" रखे गए हैं, क्योंकि model वही string देता है — इन्हें ठीक करते ही advisory मिलनी बंद हो जाएगी:
>
> | Label | गड़बड़ी | फसल |
> |---|---|---|
> | `surgarcane_viral_disease` | spelling — "sugarcane" नहीं | गन्ना |
> | `onion_botrytis_leaf_light` | "blight" नहीं, "light" | प्याज |
> | `Potato_Blackspot_B...` | Teachable Machine ने नाम 20 अक्षर पर काटा | आलू |
> | `Potato_Miscellaneo...` | वही — कटा हुआ नाम | आलू |
> | `Tomato_Spider_mites Two-spotted_spider_mite` | नाम के बीच **space** है (key quotes में लिखें) | टमाटर |

**फोटो का hint:** हर फसल `photoHintHi` से अपना hint दे सकती है। आलू का model **कंद (tuber)** का है, पत्ती का नहीं — इसलिए वहाँ "आलू (कंद) की साफ फोटो" लिखा आता है। नई फसल में यह field न दें तो default "पत्ती की साफ फोटो" चलता रहेगा।

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
├── api/
│   └── diagnose.js       🌐 ONLINE MODE — Vercel serverless function
│                            (OpenRouter ki API key SIRF yahan, server par)
├── models/                  har fasal: model.json + weights.bin + metadata.json
│   ├── rice/ (17)  wheat/ (14)  sugarcane/ (16)  onion/ (14)
│   ├── maize/ (7)  potato/ (10)  tomato/ (10)
│   └── mustard/  (khaali — "Coming Soon")
├── assets/logo.svg
├── icon.svg, manifest.json, sw.js, serve.sh, vercel.json
└── README.md
```

> **Models git me hi rakhe gaye hain** (~2.2 MB per fasal). Vercel unhein static
> file ki tarah serve karta hai, aur `vercel.json` unpar 1-saal ka immutable
> cache header lagata hai — isliye dobara download nahi hote.

---

## 3B. 🌐 ONLINE MODE — bade AI se double-check (OpenRouter)

### Yeh kyun hai

Phone wala Teachable Machine model **chhota** hota hai — turant jawab deta hai,
par galti bhi karta hai. Internet ho to hum **wahi photo** ek bade vision model
se dobara jaanchte hain aur dono jawab milaate hain.

```
photo  →  [1] phone ka model  →  jawab TURANT dikh gaya   (0 sec, offline)
                    ↓
          [2] internet hai?  →  /api/diagnose  →  OpenRouter vision model
                    ↓
          [3] dono jawab mile:
                same     →  "AI ne bhi yahi bataya"  (bharosa badh gaya)
                alag     →  AI wali salah dikhati hai, phone wala jawab bhi saath
                unclear  →  "dobara saaf photo lein"
                fail     →  chupchaap offline jawab hi rehta hai
```

App **kabhi rukti nahi** — offline jawab pehle aata hai, online jawab usse
sudharta hai. Isi liye 2G par bhi app utni hi tez chalti hai.

### Teen mode (kisan khud chun sakta hai — Scan screen par)

| Mode | Kab use karein | Kya karta hai |
|---|---|---|
| ⚡ **ऑटो** (default) | roz ka istemal | network accha ho to online double-check, 2G / "data bachao" par apne aap offline |
| 🌐 **ऑनलाइन AI** | jab sabse sahi jawab chahiye | har jaanch online AI se verify hoti hai |
| 📴 **ऑफ़लाइन** | khet me, network nahi / data bachana hai | sirf phone ka model, ek byte internet nahi |

Chuna hua mode `localStorage` me yaad rehta hai.

### Setup — sirf 3 step (ek hi baar)

1. **Free key banayein** — [openrouter.ai](https://openrouter.ai) → Sign in → *Keys*
   → *Create Key*. Key aisi dikhegi: `sk-or-v1-...`
2. **Vercel me daalein** — Project → *Settings* → *Environment Variables*
   | Name | Value |
   |---|---|
   | `OPENROUTER_API_KEY` | `sk-or-v1-...` |
3. **Redeploy** karein. Bas — app khud pehchan legi ki online mode chaalu ho gaya.

> ⚠️ **Key kabhi `js/script.js` me mat daalein.** Browser ka saara code public hota
> hai — koi bhi *View Source* karke key chura sakta hai aur aapke naam par kharcha
> kar sakta hai. Isi liye key server par (`api/diagnose.js`) rehti hai aur browser
> sirf apne hi `/api/diagnose` ko call karta hai.

### Kaunsa AI model? (sab FREE)

`api/diagnose.js` me ek **model chain** hai — pehla try hota hai, rate-limit ya
error aaye to apne aap agla:

| # | Model | Kyun |
|---|---|---|
| 1 | `google/gemma-4-31b-it:free` | Google DeepMind ka 31B multimodal — patti ke lakshan pehchanne me sabse sthir. **Default.** |
| 2 | `thinkingmachines/inkling:free` | 975B MoE (41B active) — sabse gehri reasoning, jab pehla busy ho |
| 3 | `minimax/minimax-m3:free` | MiniMax M3 multimodal |
| 4 | `google/gemma-4-26b-a4b-it:free` | halka/tez MoE variant |
| 5 | `openrouter/free` | last resort — OpenRouter khud koi free model chun leta hai |

Chain badalni ho to code chhune ki zaroorat nahi — Vercel me ek aur env var:

```
OPENROUTER_MODELS = google/gemma-4-31b-it:free,thinkingmachines/inkling:free
```

**Aaj ke free vision models kaise dekhein** (list badalti rehti hai):

```bash
curl -s https://openrouter.ai/api/v1/models | python3 -c "import json,sys;[print(m['id']) for m in json.load(sys.stdin)['data'] if 'image' in (m.get('architecture') or {}).get('input_modalities',[]) and float((m.get('pricing') or {}).get('prompt') or 0)==0]"
```

> **Free models ki seemaa:** OpenRouter free models par roz ki request limit hoti
> hai. Limit khatam ho to app chupchaap offline jawab dikhati rehti hai — kuch
> tootta nahi. Agar bahut zyada kisan use karne lagein, to ek sasta paid vision
> model (jaise Claude Haiku 4.5 — lagbhag $1 / 10 lakh input token) chain me
> pehle number par daal dena kaafi hai.

### Kya photo kahin bhejhi jaati hai?

- **ऑफ़लाइन mode** → nahi. Photo phone se bahar jaati hi nahi.
- **ऑटो / ऑनलाइन mode** → photo 640px JPEG banakar aapke apne Vercel server ko
  jaati hai, jo use OpenRouter ko forward karta hai. Kahin save nahi hoti.
  Yeh baat app ki "Offline & Help" screen par kisan ko साफ़ likhi hai.

---

## 3C. ⬇️ OFFLINE MODELS — download aur storage

App ab GitHub + Vercel par host hai. Har fasal ka model ~2.2 MB ka hai, aur
7 fasal = ~15 MB. **Sab kuch pehli baar me download NAHI hota** — warna kisan ka
mobile data ek jhatke me chala jayega.

Iske badle teen tarike hain:

1. **Apne aap** — jis fasal ko kisan chunta hai, uska model use hote hi
   service worker cache kar leta hai. Agli baar wo fasal bina internet chalti hai.
2. **Pehle se** — *Offline & Help* screen par har fasal ke saamne **"डाउनलोड करें"**
   button hai (progress % ke saath). Khet jaane se pehle wifi par daba lein.
   **"सभी डाउनलोड"** se saare model ek saath.
3. **Hataana** — jagah kam ho to **"हटाएँ"** se koi bhi model nikal dein.

---

## 3D. 📲 "ऐप डाउनलोड करें" — sidebar wala button

Sidebar (RESOURCES ke neeche) me **हमेशा** ek button rehta hai. Pehle install
button sirf tab dikhta tha jab browser khud `beforeinstallprompt` deta tha —
isliye aksar dikhta hi nahi tha. Ab button hamesha hai, aur dabane par phone ke
hisaab se teen me se ek cheez hoti hai:

| Halat | Kya hota hai |
|---|---|
| `CONFIG.APK_URL` bhara hai | seedha **.apk download** shuru ho jata hai |
| Chrome / Android / desktop | asli **install prompt** khulta hai (home screen icon) |
| iPhone ya koi aur browser | *Offline & Help* par le jata hai jahan **step-by-step** likha hai (Safari: Share → Add to Home Screen) |

### Chrome install prompt kyun nahi aata tha

Chrome tabhi "Install app" offer karta hai jab manifest me **PNG icons**
(192px aur 512px) hon — sirf SVG se kaam nahi chalta. Isliye ab
`assets/icon-192.png`, `icon-512.png` aur `icon-maskable-512.png` bana kar
`manifest.json` me daal diye gaye hain, aur `sw.js` unhein precache bhi karta hai.

### Asli .apk kaise banayein (5 minute, bina Android Studio ke)

1. App ko Vercel par deploy karein (https zaroori hai)
2. [pwabuilder.com](https://pwabuilder.com) kholein → apna URL daalein → **Android package**
3. Jo `.apk` / `.aab` mile use **GitHub Release** par chadha dein
4. Us file ka direct link `js/script.js` me paste kar dein:

```js
// CONFIG ke andar
APK_URL: 'https://github.com/<user>/<repo>/releases/download/v1/agriai.apk',
```

Bas — sidebar ka button ab seedha APK download karega, aur *Offline & Help* par
"APK डाउनलोड करें" ka bada butan bhi aa jayega.

**Do alag cache** (`sw.js`):

| Cache | Kya | Kab mitta hai |
|---|---|---|
| `krashi-mitra-v23` | app shell (html/css/js/tf.min.js) | jab `CACHE_VERSION` badhaate hain |
| `krashi-mitra-models` | fasal ke models | **kabhi apne aap nahi** — kisan khud "हटाएँ" dabaye tabhi |

Isi wajah se app update karne par kisan ke download kiye hue models dobara
download nahi karne padte.

---

## 3E. 🌿🚫 LEAF GATE — sirf paudhe/patti par hi jaanch

### Samasya

Teachable Machine ka model **closed-set** hai. Usne sirf 14 rog dekhe hain,
isliye wo **HAR photo ko unhi 14 me se kisi ek me daal deta hai**. Selfie daalo
to bhi poore confidence ke saath "पीला रतुआ 82%" bata dega. Kisan us par bhरोsa
karke chhidkav kar de — to nuksan uska hota hai.

### Hal

Model chalane se **PEHLE** photo ka rang aur bunawat jaanchi jaati hai
(`checkIsPlantPhoto()` — SECTION 6B). Poori tarah offline, koi extra model
download nahi — bas 96x96 par pixel ginti.

| Kya dekhte hain | Kaise |
|---|---|
| **Hara paudha** | ExG (Excess Green) index — kheti me maana hua tarika |
| **Rogi/sookhi patti** | peela–narangi–bhoora rang. **Yeh sabse zaroori hai** — rog wali patti hari hoti hi nahi |
| **Aadmi ki chamdi** | selfie sabse aam galat photo hai |
| **Aasman / paani** | neela |
| **Deewar / kaagaz / screenshot** | bilkul feeka rang (kam saturation) |
| **Bunawat (texture)** | patti par nasein aur dhabbe hote hain; chamdi aur deewar chikni hoti hai |

**Sabse chalak hissa:** bhoori sookhi patti aur aadmi ki chamdi ka RANG lagbhag
ek jaisa hota hai — sirf rang se pehchanna namumkin hai. Isliye faisla
**bunawat se** hota hai: texture zyada (`edges >= LEAF_TEXTURE`) → patti;
chikna → chamdi.

### Kisan ko rokta nahi

Card par **"फिर भी जाँचें"** ka button rehta hai — ek baar ke liye gate chhod
deta hai (agli photo par phir jaanch hoti hai). Kabhi asli patti bhi reject ho
sakti hai, tab kisan khud aage badh sakta hai.

### Doosri parat — online AI

`api/diagnose.js` ka prompt ab साफ़ kehta hai: photo me paudha na ho to
`"label": "not_plant"` lauta do. To offline gate chook jaye to bhi online AI
pakad leta hai (aur ulta bhi — dono milkar zyada pakka).

### Tuning (agar zaroorat pade)

`js/script.js` -> `CONFIG.LEAF_GATE`:

```js
LEAF_GATE: {
  ENABLED: true,
  MIN_SCORE: 0.16,     // asli photos reject ho rahi hain? -> 0.10 kar dein
  MAX_SKIN: 0.30,
  MAX_SKY: 0.45,
  MAX_DULL: 0.72,
  MAX_DARK: 0.55,
  MIN_EDGES: 0.045,    // bilkul saadi satah (kapda/deewar)
  LEAF_TEXTURE: 0.22,  // isse zyada bunawat -> garm rang = patti, chamdi nahi
},
```

Browser console me har jaanch par `[leaf-gate]` wali line aati hai — usme saare
number dikhte hain, isliye tuning aasan hai. Bilkul band karna ho to
`ENABLED: false`.

---

## 3F. ✅ SAHI FASAL KO SAHI BATAO — health check + crop match

### Samasya 1 — sehatmand fasal ko bhi "rogi" batata tha

Teachable Machine ka model **over-confident** hota hai. Uske paas "kuch nahi
mila" kehne ka koi rasta hi nahi — isliye bilkul sehatmand patti par bhi wo
82% par koi rog bata deta hai.

### Hal — model ke jawab ko PHOTO ke suboot se milao

`analyzeImageContent()` har photo ka **damage score** nikalta hai:

| Naapa jata hai | Kaise |
|---|---|
| **Rang badla hissa** | patti ka kitna % peela / bhoora / kaala ho chuka hai |
| **Daagon ka jamaav** | 12x12 khaanon me kitne khaane "rogi" hain (bikhre daag vs ek-samaan peelapan) |

`damage = 0.7 x rang-badla + 0.3 x daag-jamaav`

Phir `applyHealthCheck()` do halat me model ka rog-faisla **nahi maanta**:

1. `damage < 0.14` (patti lagbhag poori ek-samaan hari) **aur** model ka bharosa
   92% se kam
2. `healthy` class top se 0.22 ke andar hai **aur** nuksan saaf nahi dikh raha

Aise me kisan ko **"आपकी फसल स्वस्थ लग रही है"** dikhta hai, saath me healthy
class ki poori salah (kya karein, sinchai ka samay, kab dobara jaanchein) —
yani **behtar rakhne** ki salah, dawa ki nahi.

**Pardarshita:** Confidence Scores me model ka ASLI jawab waisa hi dikhta hai
(jaise "पीला रतुआ 79.6%"), aur note me saaf likha hota hai ki model ne kya kaha
tha aur kyun nahi maana gaya. Kuch chhupaya nahi jata.

### Samasya 2 — "ganne me sirf ganna"

`checkCropFamily()` patti ki **disha (coherence)** naapta hai (structure tensor):

| Fasal-parivaar | Coherence | Fasal |
|---|---|---|
| Ghaas-kul — lambi patli patti | zyada (> 0.55) | dhaan, gehu, ganna, makka |
| Chaudi patti | kam (< 0.08) | tamatar, aalu, sarson |

Mismatch par halki chetavni: *"यह फोटो चौड़ी पत्ती की लग रही है, जबकि आपने गन्ना
चुना है"* — jaanch rokti nahi, sirf poochti hai.

> ⚠️ **Iski seema saaf samajh lein:** yeh sirf PARIVAAR alag karta hai.
> **Gehu aur dhaan me farq karna is tarike se sambhav nahi** — dono lambi-patli
> pattiyan hain. Uske liye online AI hai (neeche).
>
> Test me pata chala ki **rogi patti par daag uski disha mita dete hain**
> (coherence 0.03), isliye `damage > 0.20` hone par yeh jaanch chalti hi nahi —
> warna har rogi ghaas-patti par jhoothi chetavni aati.

### Teesri parat — online AI

`api/diagnose.js` ka prompt ab `wrong_crop` bhi laut sakta hai. Internet ho to
vision model saaf pehchan leta hai ki photo dhaan ki hai ya gehu ki — offline
jo sambhav nahi. Aisa hone par salah rok di jaati hai aur history se wo entry
hata di jaati hai.

### Tuning

```js
HEALTH: {
  ENABLED: true,
  HEALTHY_MAX_DAMAGE: 0.14,     // rogi patti ko swasth bata raha hai? -> ghatayein
  DISEASE_OVERRIDE_CONF: 0.92,
  HEALTHY_MARGIN: 0.22,
  CLEAR_DAMAGE: 0.30,
},
CROP_MATCH: {
  ENABLED: true,
  GRASS_MIN: 0.55,
  BROAD_MAX: 0.08,
  SKIP_IF_DAMAGE: 0.20,
},
```

Console me `[health]` aur `[leaf-gate]` lines har jaanch par saare number dikhati
hain — tuning aasan hai.

---

## 3G. 🏛️ REGIONAL ADMIN DASHBOARD — `/regional-admin`

Sarkari **Regional Agriculture Officer** ka command center ab isi site par hai:

```
https://krashi-mitrasih.vercel.app/regional-admin
```

Kisan wali public app (`/`) **bilkul nahi badli** — dashboard ek alag rasta hai.

| | Kisan app (`/`) | Admin dashboard (`/regional-admin`) |
|---|---|---|
| Tech | vanilla JS, koi build nahi | React 19 + Vite + Tailwind v4 |
| Source | `index.html`, `js/`, `css/` | `admin/` |
| Serve hota hai | seedha (static) | `regional-admin/` (build ka output) |
| Offline | poori tarah chalti hai | internet chahiye |

**Badlav ke baad build zaroori hai:**

```bash
cd admin && npm install && npm run build
```

Poori jaankari: [`admin/README.md`](admin/README.md)

### Ek zaroori suraksha (sw.js)

Service worker har navigation ka jawab kisan ke app-shell (`'./'`) me likhta
tha. Bina guard ke `/regional-admin` kholte hi wo shell admin ke page se badal
jata — aur **kisan offline app kholta to use apni app ki jagah admin dashboard
dikhta**. Isliye `sw.js` me `ADMIN_PATH` guard hai: admin ke page apne hi URL
par cache hote hain, kisan ka shell chhua bhi nahi jata.

---

## 3H. 📡 KISAN APP ⇄ ADMIN DASHBOARD — live judaav

Do taraf ka rasta, dono apne hi server par (koi teesri service nahi):

```
KISAN                                         ADHIKARI
  scan  ──POST /api/scans──────────────────▶  Field Verification Queue
                                              (har 20 sec apne aap refresh)
  app   ◀──GET /api/advisories──────────────  Advisory Broadcast
  (chetavni upar dikhti hai)                  (POST /api/advisories)
```

### 🔒 Nijta — sabse zaroori niyam

| | |
|---|---|
| Bhejna default me | **BAND** — kisan "Offline & Help" me khud chalu kare tabhi |
| Kya jata hai | jaanch ka nateeja, fasal, patti ka chhota thumbnail |
| Kya **kabhi nahi** jata | **naam aur phone number** |
| Location | sirf tab jab kisan pehle se mausam ke liye jagah de chuka ho |
| Offline mode | kuch bhi nahi jata |

Chetavni **padhna** hamesha chalu hai — usme kisan ka koi data nahi jata.

### Storage — do haalat

`api/_store.js` khud tay kar leta hai:

| Haalat | Kab | Kya hota hai |
|---|---|---|
| **KV (asli)** | `KV_REST_API_URL` + `KV_REST_API_TOKEN` set hon | data sach me save, sab officers ko dikhta hai |
| **memory (demo)** | kuch set na ho | serverless instance ki memory — restart par mit jata hai |

Asli storage chalu karne ke liye: **Vercel → Storage → KV → Create**. Wo dono
env vars apne aap jod deta hai, code me kuch badalna nahi padta. Har API jawab
me `"storage":"kv"` ya `"memory"` aata hai, taaki bharam na rahe.

### Endpoints

| Rasta | Kaun | Kaam |
|---|---|---|
| `POST /api/scans` | kisan app | nayi jaanch bhejna |
| `GET /api/scans` | dashboard | poori list |
| `PATCH /api/scans` | dashboard | status: `verified` / `rejected` / `lab` |
| `POST /api/advisories` | dashboard | chetavni bhejna |
| `GET /api/advisories?crop=&district=` | kisan app | apni fasal ki chetavni |

Chetavni **fasal aur zile se filter** hoti hai — dhaan wali chetavni gehu wale
kisan ko nahi jaati (`crop: "all"` daalein to sabko jaayegi).

---

## 4. ⭐ Nayi fasal (9th crop) kaise jodein

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
| **Vercel पर "This site can't be reached" / `ERR_FAILED`** | `/index.html` खोल रहे हैं। `vercel.json` में `cleanUrls: true` है, इसलिए वो `/` पर **308 redirect** करता है — और service worker से आया redirected जवाब browser navigation के लिए मना कर देता है। **हल (v14 में हो चुका है):** `manifest.json` का `start_url` अब `./` है, और `sw.js` redirect वाले जवाब की साफ़ copy बनाकर देता है। पुराना टूटा SW हटाने के लिए एक बार **`/index.html` के बिना** सिर्फ़ `https://<आपका-app>.vercel.app/` खोलें |
| PWA install करने के बाद ऐप नहीं खुलती | ऊपर वाली ही वजह — पुराना `start_url: ./index.html`। ऐप uninstall करके, `/` खोलकर दोबारा install करें |
| सारे crops "Coming Soon" | `models/<crop>/` में न `model.json` है न `model.tflite`, या app `file://` से चल रही है — local server use करें |
| "मॉडल लोड नहीं हो पाया" | TFJS export में weights.bin / metadata.json missing है; `.tflite` में internet नहीं मिला (runtime CDN से आता है) |
| `.tflite` model बिना internet नहीं चलता | `js/tflite/` वाली local copy रखें — Step A देखें |
| Weather: "API key चाहिए" | `js/script.js` में `WEATHER_API_KEY` भरें |
| Weather: "API key गलत है" | नई key है — ~1 घंटा रुकें |
| Weather: "लोकेशन की अनुमति नहीं" | Browser के address bar में 🔒 → Location → Allow (HTTPS/localhost ज़रूरी है), **या** card में आए box में गाँव/शहर का नाम या 6 अंक का PIN कोड लिख दें |
| फ़ोन पर LAN IP से location कभी नहीं मिलती | यह browser की पाबंदी है, bug नहीं — PIN कोड वाला box इस्तेमाल करें, या app को HTTPS पर host करें |
| "यह जगह नहीं मिली" | पास के बड़े शहर का नाम, या 6 अंक का PIN कोड डालें। बहुत छोटे गाँव geocoding में नहीं होते |
| Camera नहीं खुलता | `capture` सिर्फ HTTPS/localhost पर। "Choose Image" से gallery use करें |
| हिंदी आवाज़ नहीं आती | Phone: Settings → Language & input → Text-to-speech → Hindi voice download करें। *Offline & Help* स्क्रीन पर **"ऑफ़लाइन आवाज़"** कार्ड बता देता है कि फ़ोन में आवाज़ है या नहीं |
| **बिना इंटरनेट आवाज़ नहीं आती** | Chrome `getVoices()` में **network** आवाज़ें भी देता है (जैसे "Google हिन्दी") जो ऑफ़लाइन चुप रहती हैं। v16 से app ऑफ़लाइन होने पर सिर्फ़ **phone के अंदर वाली** (`localService`) आवाज़ चुनती है, और network आवाज़ फेल हो तो अपने आप local से दोबारा कोशिश करती है |
| **आवाज़ आधी बोलकर रुक जाती है** | Chrome का पुराना bug — `SpeechSynthesisUtterance` का reference न रहे तो garbage collector उसे बीच में उठा लेता है (न `end` आता है, न `error`), और पुराना `pause()`/`resume()` वाला उपाय टुकड़ा काट देता था। v16 में utterance `speech.current` में पकड़ कर रखा जाता है, `pause()` खुद से कभी नहीं होता, और एक **watchdog** हर सेकंड देखता है — आवाज़ चुपचाप रुके तो 2 सेकंड में अगला टुकड़ा शुरू कर देता है |
| पुरानी file दिख रही है | `sw.js` में `CACHE_VERSION` बढ़ाएँ, या DevTools → Application → Unregister SW |
| नया model डाला पर पुराना चल रहा है | Model files cache-first cached हैं — `CACHE_VERSION` बढ़ाएँ |
| iPhone HEIC photo error | Camera settings → "Most Compatible" (JPEG) |
| **स्वस्थ फसल को भी रोगी बताता है** | v23 से **health check** लगा है — फोटो में नुकसान न दिखे तो मॉडल का रोग-फ़ैसला नहीं माना जाता, "फसल स्वस्थ है" + बेहतरी की सलाह मिलती है। देखें section 3F |
| **दूसरी फसल की फोटो पर भी रोग बताता है** | leaf-family चेतावनी (घास बनाम चौड़ी पत्ती) + online AI का `wrong_crop`। गेहूँ-धान का फ़र्क सिर्फ़ online AI कर सकता है — section 3F |
| **किसी भी फोटो पर रोग बता देता है** | v18 से **leaf gate** लगा है — पौधा/पत्ती न दिखे तो मॉडल चलता ही नहीं। देखें section 3E |
| असली पत्ती की फोटो भी reject हो रही है | `CONFIG.LEAF_GATE.MIN_SCORE` घटाएँ (0.16 → 0.10), या कार्ड पर **"फिर भी जाँचें"** दबाएँ। console की `[leaf-gate]` लाइन में सारे नंबर दिखते हैं |
| **नया code deploy किया पर पुराना चल रहा है** | v18 से `script.js`/`style.css` अब cache-first नहीं हैं (सिर्फ़ `tf.min.js` है), इसलिए redeploy अपने आप पहुँचता है। फिर भी अटके तो `CACHE_VERSION` बढ़ाएँ |

---

## 10. Disclaimer

यह सलाह **सिर्फ मार्गदर्शन** के लिए है। दवा की मात्रा लगभग (approximate) दी गई है। किसी भी छिड़काव से पहले अपने **कृषि विज्ञान केंद्र (KVK)** या कृषि अधिकारी से पुष्टि ज़रूर करें। दवा के डिब्बे पर लिखी सावधानियाँ पढ़ें, और छिड़काव के समय मास्क व दस्ताने पहनें।
