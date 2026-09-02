/* ============================================================================
 * api/scans.js — kisan ki jaanch (scan) ka rasta
 *
 *   POST  /api/scans        kisan app se nayi scan aati hai
 *   GET   /api/scans        admin dashboard poori list padhta hai
 *   PATCH /api/scans        admin status badalta hai (verified/rejected/lab)
 *
 * NIJTA (privacy) — yeh sabse zaroori hissa hai:
 *   - Kisan app se scan TABHI jaati hai jab kisan ne khud "रिपोर्ट भेजें"
 *     chालू kiya ho. Default me BAND hai.
 *   - Poori photo kabhi nahi jaati. Sirf ek chhota thumbnail (aur wo bhi
 *     tabhi jab kisan ne diya ho).
 *   - Naam/phone tabhi jate hain jab kisan ne khud bhare hon.
 * ========================================================================= */

'use strict';

const store = require('./_store');

const SCANS_KEY = 'km:scans';
const STATUS_KEY = 'km:scan_status';
const MAX_SCANS = 300;
const MAX_THUMB_CHARS = 120 * 1024;   // ~120 KB thumbnail se zyada nahi

const ALLOWED_STATUS = ['pending', 'verified', 'rejected', 'lab'];

function clean(v, max) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max || 120);
}

function num(v) {
  const n = Number(v);
  return isFinite(n) ? n : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    /* ---------------- GET: dashboard list padhta hai ---------------------- */
    if (req.method === 'GET') {
      const [rows, overrides] = await Promise.all([
        store.listAll(SCANS_KEY, MAX_SCANS),
        store.hashAll(STATUS_KEY),
      ]);

      // Status alag rakha jata hai, isliye padhte waqt jod dete hain
      const scans = rows.map((s) => {
        const o = overrides[s.id];
        return o ? Object.assign({}, s, o) : s;
      });

      return res.status(200).json({
        ok: true,
        storage: store.storageKind(),
        note: store.storageNote(),
        count: scans.length,
        scans: scans,
      });
    }

    /* ---------------- POST: kisan app se nayi scan ------------------------ */
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ ok: false, error: 'bad_body' });
      }

      const crop = clean(body.crop, 40);
      const label = clean(body.label, 80);
      if (!crop || !label) {
        return res.status(400).json({ ok: false, error: 'crop_aur_label_zaroori' });
      }

      const thumb = typeof body.thumb === 'string' &&
                    /^data:image\/(jpeg|jpg|png|webp);base64,/.test(body.thumb) &&
                    body.thumb.length <= MAX_THUMB_CHARS
        ? body.thumb
        : '';

      const lat = num(body.lat), lng = num(body.lng);

      const scan = {
        id: store.newId('SCAN'),
        receivedAt: new Date().toISOString(),
        crop: crop,
        cropNameHi: clean(body.cropNameHi, 60),
        label: label,
        diseaseHi: clean(body.diseaseHi, 120),
        diseaseEn: clean(body.diseaseEn, 120),
        confidence: Math.max(0, Math.min(1, num(body.confidence) || 0)),
        source: clean(body.source, 20) || 'offline',   // offline | ai | health
        severity: clean(body.severity, 20),
        // Kisan ne khud bhara ho to hi
        farmerName: clean(body.farmerName, 80),
        phone: clean(body.phone, 20),
        village: clean(body.village, 80),
        district: clean(body.district, 80),
        // Location tabhi jab kisan ne pehle se allow ki ho
        gps: (lat !== null && lng !== null) ? [lat, lng] : null,
        thumb: thumb,
        status: 'pending',
        appVersion: clean(body.appVersion, 20),
      };

      await store.listPush(SCANS_KEY, scan, MAX_SCANS);

      return res.status(201).json({
        ok: true,
        id: scan.id,
        storage: store.storageKind(),
        note: store.storageNote(),
      });
    }

    /* ---------------- PATCH: admin status badalta hai --------------------- */
    if (req.method === 'PATCH') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
      const id = body && clean(body.id, 40);
      const status = body && clean(body.status, 20);

      if (!id || ALLOWED_STATUS.indexOf(status) === -1) {
        return res.status(400).json({ ok: false, error: 'id_ya_status_galat',
                                      allowed: ALLOWED_STATUS });
      }

      const patch = {
        status: status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: clean(body.reviewedBy, 80),
        officerNote: clean(body.officerNote, 400),
      };
      await store.hashSet(STATUS_KEY, id, patch);

      return res.status(200).json({ ok: true, id: id, status: status,
                                    storage: store.storageKind() });
    }

    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  } catch (err) {
    console.error('[scans]', err);
    return res.status(500).json({ ok: false, error: 'server_error',
                                  detail: String(err && err.message).slice(0, 200) });
  }
};
