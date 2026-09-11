'use strict';

/* ============================================================================
 * KRASHI MITRA — CIBRC protocol (dawa aur matra) ka database
 * api/protocols.js
 *
 *   GET    /api/protocols            padhna — kisan app bhi padh sakti hai
 *   POST   /api/protocols            naya/badla hua protocol (sirf adhikari)
 *   DELETE /api/protocols?id=...     hatana (sirf adhikari)
 *
 * KYUN
 *   Dawa ke naam aur MATRA abhi tak dashboard ke andar ek JS file me likhe
 *   the ('0.15g Streptocycline + 2.5g COC / Litre'). Unhe badalne ke liye
 *   code badalna, build karna aur deploy karna padta tha. Matlab: jab
 *   CIBRC koi matra badal de ya kisi dawa par rok laga de, purani matra
 *   kisano tak jaati rehti — jab tak koi programmer khali na ho.
 *
 *   Ab adhikari khud dashboard se badal sakta hai, turant.
 *
 * JAWABDEHI
 *   Har protocol ke saath likha jata hai ki kis portal ID ne, kab likha.
 *   Yeh mitaya nahi ja sakta — matra galat nikle to pata chalna chahiye
 *   ki wo kahan se aayi.
 *
 * ISME "AI" KUCH NAHI HAI
 *   Yeh sirf ek list hai jo adhikari bharta hai. App khud se koi matra
 *   nahi gadhti. Yahi iska poora maqsad hai — matra hamesha kisi zimmedar
 *   insaan ke haath se aaye.
 * ========================================================================= */

const store = require('./_store');
const { adminFor } = require('./admin');

const KEY = 'km:protocols';

function clean(v, max) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max || 200);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    /* ---------------- GET: sabke liye khula ---------------------------- */
    /* Kisan app ko bhi yahi list chahiye hoti hai, isliye padhna khula hai.
       Isme koi niji jaankari nahi — sirf dawa aur matra. */
    if (req.method === 'GET') {
      const all = await store.hashAll(KEY);
      const rows = Object.values(all).sort((a, b) =>
        String(a.crop || '').localeCompare(String(b.crop || '')));
      return res.status(200).json({ ok: true, count: rows.length, protocols: rows });
    }

    /* Aage sab kuch sirf logged-in adhikari ke liye. Koi bhi internet se
       matra badal de — wo seedha kisan ke khet me girti hai. */
    let admin = null;
    try { admin = await adminFor(req); }
    catch (e) { console.error('[protocols] admin check fail:', e && e.message); }
    if (!admin) {
      return res.status(401).json({ ok: false, error: 'admin_login_zaroori',
        messageHi: 'दवा की मात्रा बदलने के लिए अधिकारी लॉगिन ज़रूरी है।' });
    }

    /* ---------------- POST: naya ya badla hua -------------------------- */
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ ok: false, error: 'bad_body' });
      }

      const crop    = clean(body.crop, 40).toLowerCase();
      const disease = clean(body.disease, 160);
      const dose    = clean(body.dose, 300);
      if (!crop || !disease || !dose) {
        return res.status(400).json({ ok: false, error: 'crop_disease_dose_zaroori',
          messageHi: 'फसल, रोग और मात्रा — तीनों ज़रूरी हैं।' });
      }

      const id = clean(body.id, 60) || store.newId('PROT');
      const old = (await store.hashAll(KEY))[id] || null;

      const row = {
        id: id,
        crop: crop,
        cropNameHi: clean(body.cropNameHi, 60),
        disease: disease,
        diseaseEn: clean(body.diseaseEn, 160),
        chemical: clean(body.chemical, 200),
        dose: dose,
        /* Chhidkav ke baad kitne din tak fasal na todein — yeh cheez
           kisan ki sehat se judi hai, isliye alag khana. */
        waitingPeriodDays: Number(body.waitingPeriodDays) || null,
        cibrcRegNo: clean(body.cibrcRegNo, 80),
        notes: clean(body.notes, 600),

        /* Jawabdehi — kisne likha, kab. Pehli baar ka record nahi mitta. */
        createdBy: (old && old.createdBy) || (admin.portalId || ''),
        createdAt: (old && old.createdAt) || new Date().toISOString(),
        updatedBy: admin.portalId || '',
        updatedAt: new Date().toISOString(),
      };

      await store.hashSet(KEY, id, row);
      return res.status(old ? 200 : 201).json({ ok: true, id: id, protocol: row });
    }

    /* ---------------- DELETE ------------------------------------------- */
    if (req.method === 'DELETE') {
      const id = clean((req.query && req.query.id) || '', 60);
      if (!id) return res.status(400).json({ ok: false, error: 'id_zaroori' });
      await store.hashDel(KEY, id);
      return res.status(200).json({ ok: true, id: id });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  } catch (err) {
    console.error('[protocols]', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
};
