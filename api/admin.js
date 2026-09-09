/* ============================================================================
 * api/admin.js — Kshetriya adhikari (regional admin) ka login
 *
 * KYUN ZAROORI: /api/advisories par POST karke KOI BHI sab kisano ko sandesh
 * bhej sakta tha — farzi dawa ki salah bhi. Ab wo POST sirf logged-in admin
 * hi kar sakta hai.
 *
 *   POST /api/admin?action=login    { portalId, password }
 *   GET  /api/admin?action=session
 *   POST /api/admin?action=logout
 *
 * ── PASSWORD KAHIN LIKHA NAHI JAATA ────────────────────────────────────────
 *   Vercel me sirf ye do set karein:
 *       ADMIN_PORTAL_ID        = <aapki portal ID>
 *       ADMIN_PORTAL_PASSWORD  = <aapka password>
 *
 *   Pehli baar login karte hi hum password ka bcrypt HASH database me daal
 *   dete hain, aur uske baad hamesha usi hash se milaate hain. Password
 *   kabhi bhi code, git, ya database me saaf-saaf nahi jaata.
 *
 *   Password badalna ho: Vercel me nayi value daalein aur database ke
 *   `admins` collection se us admin ka document hata dein — agli login par
 *   naya hash apne aap ban jaayega.
 * ========================================================================= */

'use strict';

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

let clientPromise;
function client() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  if (!clientPromise) clientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  return clientPromise;
}
async function db() { return (await client()).db(process.env.MONGODB_DB || 'krashi_mitra'); }

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean)
    .map((v) => { const i = v.indexOf('='); return [v.slice(0, i).trim(), decodeURIComponent(v.slice(i + 1))]; }));
}
function body(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let s = ''; req.on('data', (c) => s += c);
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (_) { resolve({}); } });
  });
}

/** Har request par admin ka session jaancho. Doosri files bhi isse use karti hain. */
async function adminFor(req) {
  const c = cookies(req);
  if (!c.krashi_admin) return null;
  const d = await db();
  const s = await d.collection('admin_sessions')
    .findOne({ token: c.krashi_admin, expiresAt: { $gt: new Date() } });
  if (!s) return null;
  return d.collection('admins').findOne({ _id: s.adminId });
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  const action = (req.query && req.query.action) || '';

  try {
    const d = await db();

    /* ---------------- LOGIN ---------------- */
    if (req.method === 'POST' && action === 'login') {
      const ENV_ID = process.env.ADMIN_PORTAL_ID;
      const ENV_PW = process.env.ADMIN_PORTAL_PASSWORD;
      if (!ENV_ID || !ENV_PW) {
        return res.status(503).json({ error: 'एडमिन लॉगिन अभी चालू नहीं है (सर्वर सेटिंग बाकी है)।' });
      }

      const input = await body(req);
      const portalId = String(input.portalId || '').trim();
      const password = String(input.password || '');
      if (!portalId || !password) {
        return res.status(400).json({ error: 'पोर्टल आईडी और पासवर्ड दोनों ज़रूरी हैं।' });
      }

      const admins = d.collection('admins');
      let admin = await admins.findOne({ portalId: ENV_ID });

      /* Pehli baar — env se hash banakar database me daal do. Uske baad
         env ka password kabhi seedha compare nahi hota. */
      if (!admin) {
        const now = new Date();
        const r = await admins.insertOne({
          portalId: ENV_ID,
          passwordHash: await bcrypt.hash(ENV_PW, 12),
          role: 'regional', createdAt: now, updatedAt: now,
        });
        admin = { _id: r.insertedId, portalId: ENV_ID, role: 'regional' };
        admin.passwordHash = await admins.findOne({ _id: r.insertedId }).then((a) => a.passwordHash);
      }

      const ok = portalId === admin.portalId && await bcrypt.compare(password, admin.passwordHash);
      if (!ok) {
        // Jaan-boojhkar nahi batate ki ID galat thi ya password
        return res.status(401).json({ error: 'पोर्टल आईडी या पासवर्ड गलत है।' });
      }

      const t = crypto.randomBytes(32).toString('hex');
      await d.collection('admin_sessions').insertOne({
        token: t, adminId: admin._id,
        expiresAt: new Date(Date.now() + 43200000),      // 12 ghante — admin session chhota rakha hai
      });
      res.setHeader('Set-Cookie',
        'krashi_admin=' + t + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200');
      return res.json({ ok: true, portalId: admin.portalId, role: admin.role || 'regional' });
    }

    /* ---------------- SESSION ---------------- */
    if (req.method === 'GET' && action === 'session') {
      const admin = await adminFor(req);
      if (!admin) return res.status(401).json({ authenticated: false });
      return res.json({ authenticated: true, portalId: admin.portalId, role: admin.role || 'regional' });
    }

    /* ---------------- LOGOUT ---------------- */
    if (req.method === 'POST' && action === 'logout') {
      const c = cookies(req);
      if (c.krashi_admin) await d.collection('admin_sessions').deleteOne({ token: c.krashi_admin });
      res.setHeader('Set-Cookie', 'krashi_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
      return res.json({ ok: true });
    }

    return res.status(404).json({ error: 'Not found' });

  } catch (e) {
    console.error('[admin]', e && e.message);
    return res.status(500).json({ error: 'सर्वर या डेटाबेस की दिक्कत।' });
  }
};

module.exports.adminFor = adminFor;
