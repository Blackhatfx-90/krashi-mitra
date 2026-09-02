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
        crop: clean(body.crop, 40).toLowerCase() || 'all',
        cropNameHi: clean(body.cropNameHi, 60),
        district: clean(body.district, 80) || 'all',
        state: clean(body.state, 60),
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
