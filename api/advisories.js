/* ============================================================================
 * api/advisories.js — admin ki salah kisan tak
 *
 *   POST /api/advisories    admin dashboard se chetavni bhejna
 *   GET  /api/advisories    kisan app apni fasal ki chetavni maangti hai
 *                           (?crop=wheat&district=Bareilly&since=<ISO>)
 *
 * Kisan app har jaanch ke baad (aur app khulte hi) yeh ek chhota GET karti hai.
 * Koi login nahi — chetavni sarvajanik soochna hai, jaise akhbaar me chhapi ho.
 * ========================================================================= */

'use strict';

const store = require('./_store');

const KEY = 'km:advisories';
const MAX = 120;

function clean(v, max) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max || 200);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    /* ---------------- GET: kisan app ke liye ------------------------------ */
    if (req.method === 'GET') {
      const q = req.query || {};
      const crop = clean(q.crop, 40).toLowerCase();
      const district = clean(q.district, 80).toLowerCase();
      const since = clean(q.since, 40);

      let rows = await store.listAll(KEY, MAX);

      if (crop) {
        // 'all' wali chetavni sabhi fasalon ke liye hoti hai
        rows = rows.filter((a) => !a.crop || a.crop === 'all' || a.crop === crop);
      }
      if (district) {
        rows = rows.filter((a) => !a.district ||
                                  a.district.toLowerCase() === district ||
                                  a.district === 'all');
      }
      if (since) {
        rows = rows.filter((a) => a.issuedAt > since);
      }

      /* Rajya aur mandal ka nishana. 'all' ya khali = sabke liye. */
      const state = clean(q.state, 60).toLowerCase();
      if (state) {
        rows = rows.filter((a) => !a.state || a.state.toLowerCase() === state);
      }
      const division = clean(q.division, 80).toLowerCase();
      if (division) {
        rows = rows.filter((a) => !a.division || a.division === 'all' ||
                                  a.division.toLowerCase() === division);
      }

      /* ---- Kisan ki apni bhasha me ----------------------------------------
       * App ?lang=ta-IN bhejti hai. Admin ne Hindi me likha hota hai, isliye
       * yahan anuvaad karke bhejte hain. Sirf sabse nayi 3 chetavni ka
       * anuvaad karte hain — baaki purani hain aur har ek ka anuvaad karna
       * dher saara samay aur API call le lega.
       * Anuvaad na ho paye to ASLI Hindi text hi jaata hai (translated:false)
       * — kisan ko adhoora anuvaad dene se behtar hai sahi Hindi dena. */
      const lang = clean(q.lang, 10);

      /* Agar chetavni sirf kuch bhashaon ke kisano ke liye hai to baaki ko
         mat dikhao. languages khali ho to wo sabke liye hai. */
      if (lang) {
        rows = rows.filter((a) => !Array.isArray(a.languages) || !a.languages.length ||
                                  a.languages.indexOf(lang) !== -1);
      }

      if (lang && lang !== 'hi-IN' && rows.length) {
        try {
          const { translateCached } = require('./translate');
          const head = rows.slice(0, 3);
          await Promise.all(head.map(async (a) => {
            const t = await translateCached(a.messageHi, lang);
            const ti = a.titleHi ? await translateCached(a.titleHi, lang) : null;
            a.message = t.text;
            a.title = ti ? ti.text : a.titleHi;
            a.lang = lang;
            a.translated = t.translated;
          }));
        } catch (e) {
          console.error('[advisories] anuvaad fail:', e && e.message);
          // kuch nahi — neeche asli Hindi hi chala jayega
        }
      }

      return res.status(200).json({
        ok: true,
        storage: store.storageKind(),
        note: store.storageNote(),
        count: rows.length,
        advisories: rows,
      });
    }

    /* ---------------- POST: admin dashboard se ---------------------------- */
    if (req.method === 'POST') {
      /* ================================================================
       * SIRF LOGGED-IN ADMIN. Pehle yahan koi jaanch NAHI thi — matlab
       * internet par koi bhi POST karke sab kisano ko sandesh bhej sakta
       * tha, farzi dawa ki salah bhi. Yeh sabse badi suraksha kami thi.
       * ================================================================ */
      let admin = null;
      try { admin = await require('./admin').adminFor(req); }
      catch (e) { console.error('[advisories] admin check fail:', e && e.message); }
      if (!admin) {
        return res.status(401).json({ ok: false, error: 'admin_login_zaroori',
          messageHi: 'चेतावनी भेजने के लिए एडमिन लॉगिन ज़रूरी है।' });
      }

      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ ok: false, error: 'bad_body' });
      }

      const messageHi = clean(body.messageHi, 900);
      if (!messageHi) {
        return res.status(400).json({ ok: false, error: 'messageHi_zaroori' });
      }

      const advisory = {
        id: store.newId('ADV'),
        issuedAt: new Date().toISOString(),
        issuedByPortalId: admin.portalId || '',   // jawabdehi ke liye
        crop: clean(body.crop, 40).toLowerCase() || 'all',
        cropNameHi: clean(body.cropNameHi, 60),
        district: clean(body.district, 80) || 'all',
        division: clean(body.division, 80) || 'all',
        state: clean(body.state, 60),
        /* Kis bhasha ke kisano ko bhejni hai. Khali = sabko.
           Ye "kis bhasha me likhi hai" nahi hai — wo hamesha Hindi hai aur
           kisan ki app apni bhasha me anuvaad maang leti hai. Ye "kis
           samuday tak pahunchani hai" hai, jaise Bodo ilaake ki soochna. */
        languages: Array.isArray(body.languages)
          ? body.languages.map(l => clean(l, 10)).filter(Boolean).slice(0, 24)
          : [],
        severity: clean(body.severity, 20) || 'info',   // info | warning | critical
        titleHi: clean(body.titleHi, 160) || 'कृषि विभाग की सलाह',
        messageHi: messageHi,
        messageEn: clean(body.messageEn, 900),
        chemical: clean(body.chemical, 300),
        cibrcApproved: Boolean(body.cibrcApproved),
        issuedBy: clean(body.issuedBy, 120),
      };

      await store.listPush(KEY, advisory, MAX);

      return res.status(201).json({
        ok: true,
        id: advisory.id,
        storage: store.storageKind(),
        note: store.storageNote(),
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  } catch (err) {
    console.error('[advisories]', err);
    return res.status(500).json({ ok: false, error: 'server_error',
                                  detail: String(err && err.message).slice(0, 200) });
  }
};
