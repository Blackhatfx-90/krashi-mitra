# Netlify par Vridhi AI

Site pehle Vercel par thi. Wahan free plan par **12 se zyada serverless
function nahi chalte**, aur app me 14 API raste hain — isliye Netlify.

---

## Ginti ki dikkat kaise khatam hui

Netlify par bhi har raste ka alag function banaya ja sakta tha, par uske
liye 14 files dobara likhni padtin (Netlify ka handler Vercel se alag
shakl ka hota hai).

Uske bajaye **ek hi function** hai — `netlify/functions/api.js` — jo saare
raste sambhalta hai, aur beech me ek chhota anuvaadak (adapter) hai.

```
/api/auth  ─┐
/api/scans ─┤
/api/...   ─┴──>  netlify/functions/api.js  ──>  api/<naam>.js  (jyon ke tyon)
```

**`api/*.js` me ek line nahi badli.** Kal koi teesri jagah host karni ho
to sirf ek file badalni padegi.

---

## Netlify dashboard me kya set karna hai

**Site settings → Build & deploy** me kuch karne ki zaroorat nahi —
`netlify.toml` me sab likha hai (build command, publish folder, functions).

**Site settings → Environment variables** me ye daalein:

| Variable | Zaroori? | Kya hai |
|---|---|---|
| `MONGODB_URI` | **haan** | Iske bina login, scans, advisories kuch nahi chalega |
| `MONGODB_DB` | nahi | Default `krashi_mitra` |
| `PUBLIC_SITE_URL` | **haan** | `https://<aapka-site>.netlify.app` (aakhir me slash nahi) |
| `OPENWEATHER_API_KEY` | nahi | Na ho to mausam ka hissa saaf sandesh dikhata hai |
| `DATAGOV_API_KEY` | nahi | Na ho to mandi bhaav ka hissa chhup jata hai |
| `OPENROUTER_API_KEY` / `GEMINI_API_KEY` | nahi | Online AI dobara-jaanch; na ho to sirf phone ka model |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | nahi | Google login |
| `ADMIN_PORTAL_ID` / `ADMIN_PORTAL_PASSWORD` | adhikari ke liye | Pehli login par bcrypt hash DB me ban jata hai |
| `API_BUDGET_MS` | nahi | Default 9000 — neeche padhein |

### `PUBLIC_SITE_URL` kyun zaroori hai

Google OAuth ka `redirect_uri` **akshar-dar-akshar** milta hai us pate se
jo Google Console me darj hai. Deploy preview aur branch deploy ke apne
alag pate hote hain, isliye pata sthir hona chahiye.

Google Console → Credentials → OAuth client → **Authorized redirect URIs**
me bilkul yeh daalein (aakhir me slash nahi):

```
https://<aapka-site>.netlify.app/api/google
```

---

## Function ka samay (`API_BUDGET_MS`)

Vercel par `api/diagnose.js` ko 60 second mile the. Netlify par function ka
waqt bahut kam hai (default 10 second).

Isliye ab ek **kul budget** hai. Har AI call usi ke andar rehta hai, aur
budget khatam hone par aage koshish hi nahi hoti — kisan ko offline jawab
ke saath saaf sandesh milta hai (502 ke bajaye).

Netlify par function ka waqt badha lein to sirf env var badlein:

```
API_BUDGET_MS   = 24000
AI_MAX_ATTEMPTS = 3
```

---

## Local par chalana

```bash
npm install
npm run build          # dist/ banata hai
```

`dist/` me sirf wahi jata hai jo browser ko chahiye. Seedha jad se publish
karte to `admin/node_modules` (199 MB) bhi chadh jata.

Regional admin dashboard (React) alag se banta hai — uska bana hua roop
`regional-admin/` me committed hai:

```bash
npm run build:admin
```

---

## Site ka pata (SEO)

`index.html`, `sitemap.xml`, `robots.txt` aur `guide/` me canonical,
`og:url` wagairah likhe hain. Wo **build ke waqt** apne aap badal jaate
hain — Netlify ka `$URL` istemal hota hai.

Matlab custom domain lagane par bhi kuch haath se badalne ki zaroorat
nahi. Yeh chhodna khatarnak hota: canonical purane pate par rehta to
Google sara SEO wahin bhejta rehta.

---

## `vercel.json` ab bhi kyun pada hai

Jaan-boojhkar rakha hai — kal wapas Vercel par jaana ho to kuch dobara
likhna na pade. Netlify use padhta hi nahi.
