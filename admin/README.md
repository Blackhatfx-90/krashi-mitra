# 🏛️ Regional Admin Dashboard — `/regional-admin`

Sarkari **Regional Agriculture Officer** ka command center. Kisan wali public app
(`https://krashi-mitrasih.vercel.app/`) ke andar, ek alag rasta:

```
https://krashi-mitrasih.vercel.app/regional-admin
```

## Yeh folder kya hai

| Folder | Kya | Git me? |
|---|---|---|
| `admin/` | React + Vite ka **source code** (yeh folder) | ✅ haan |
| `regional-admin/` | Build ka **taiyar output** — Vercel isi ko serve karta hai | ✅ haan (jaan-boojh kar) |
| `admin/node_modules/` | Dependencies | ❌ nahi (gitignore) |

## Badlav karne ke baad — build ZAROORI hai

Yeh React app hai, isliye source badalne se site par kuch nahi hota jab tak
build na karein:

```bash
cd admin
npm install     # sirf pehli baar
npm run build   # output -> ../regional-admin/
```

Phir `regional-admin/` ke saath commit + push kar dein.

Sirf dashboard par kaam karna ho to:

```bash
cd admin && npm run dev     # http://localhost:5173
```

## Kisan wali app se poori tarah alag kyun

Yeh sabse zaroori baat hai — public app **bilkul nahi chhui gayi**:

| Cheez | Kisan app | Admin dashboard |
|---|---|---|
| Rasta | `/` | `/regional-admin` |
| Tech | vanilla JS, koi build nahi | React + Vite |
| Files | `index.html`, `js/script.js`, `css/style.css` | `regional-admin/` |
| Service worker cache | `'/'` par app shell | apne hi URL par |
| Offline | poori tarah chalti hai | internet chahiye |

`sw.js` me `ADMIN_PATH` naam ka guard hai. Uske bina admin ka page kisan ke
app-shell (`'./'`) me likha jata aur **offline kholne par kisan ko apni app ki
jagah admin dashboard dikhta** — wahi sabse bada khatra tha, isliye woh alag
kiya gaya hai.

## Vercel

`vercel.json` me do rewrite hain taaki andar ke raste (jaise
`/regional-admin/login`) bhi SPA ke index.html par jayein. Vercel pehle asli
file dhoondta hai, isliye `/regional-admin/assets/*.js` seedha serve hoti hain.

Vercel par koi build command set karne ki **zaroorat nahi** — build pehle se
`regional-admin/` me committed hai. Isse main site ke deploy par koi khatra
nahi: agar kabhi dashboard ka build toote bhi, to kisan wali app fir bhi
deploy hoti rahegi.

## UI

Design tokens (green palette, neutrals, radius, shadows) main public site ki
`css/style.css` se **hu-ba-hu** milte hain. Font stack bhi wahi hai.

---
Aage ka kaam (abhi nahi hua): `INTEGRATION_HANDOVER_CLAUDE.md` me live scan
ingestion aur advisory push-back ka API contract likha hai — wo backend wiring
alag kaam hai.
