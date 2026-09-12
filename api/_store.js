/* ============================================================================
 * api/_store.js — chhota storage layer (scans + advisories ke liye)
 *
 * TEEN HAALAT — jo pehle mile, wahi chalta hai:
 *
 *   1. MONGODB (aaj yahi chal raha hai) — MONGODB_URI
 *      Yeh pehle se lagi hui hai, kyunki login/Google isi par chalte hain.
 *      Pehle yeh file usse dekhti hi nahi thi, isliye jaanch aur salah
 *      "memory" me ja rahi thi aur thodi der me mit jaati thi — jabki asli
 *      database saath me hi pada tha.
 *
 *   2. ASLI (vikalp) — Vercel KV / Upstash Redis
 *      Vercel -> Storage -> KV banayein. Wo apne aap ye env vars daal deta hai:
 *          KV_REST_API_URL
 *          KV_REST_API_TOKEN
 *      Inke hote hi data sach me save hota hai aur sabhi officers ko dikhta hai.
 *
 *   3. DEMO (jab kuch bhi set na ho) — server ki apni memory
 *      Kuch bhi set na ho to data serverless function ki memory me rehta hai.
 *      Yeh SIRF demo/viva ke liye theek hai:
 *        - Vercel naye instance par purana data nahi milta
 *        - kuch der baad instance so jata hai aur data chala jata hai
 *      Har jawab me "storage":"memory" aata hai taaki bharam na rahe.
 *
 * Jaan-boojh kar koi npm package use nahi kiya — yeh site bina build ke
 * chalti hai, isliye seedha REST call karte hain.
 * ========================================================================= */

'use strict';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

/** KV lagi hai ya hum demo memory par chal rahe hain. */
function kvReady() {
  return Boolean(KV_URL && KV_TOKEN);
}

function mongoReady() {
  return Boolean(MONGO_URI);
}

function storageKind() {
  if (mongoReady()) return 'mongodb';
  if (kvReady()) return 'kv';
  return 'memory';
}

/* --- MongoDB -------------------------------------------------------------
 * Do collection kaafi hain:
 *   km_lists   { key, at, v }          -> jaanch aur salah ki list
 *   km_hashes  { key, field, v }       -> kisi ek jaanch ka status
 *
 * 'at' par index chahiye warna list ulti-seedhi aayegi; ek hi baar banate
 * hain aur agar na bane to kaam rukta nahi (index na ho to bhi sort chalta
 * hai, bas dheema).
 * -------------------------------------------------------------------------- */
/* Ek hi millisecond me do jaanch aa jayein to Date.now() dono ka wahi number
   deta hai, aur phir sort ka kram bharosemand nahi rehta — list me nayi jaanch
   purani ke neeche chali jaati hai. KV me LPUSH yeh apne aap sambhal leta tha.
   Isliye yahan har entry ko apna badhta hua number dete hain. */
let lastAt = 0;
function nextAt() {
  const t = Date.now();
  lastAt = t > lastAt ? t : lastAt + 1;
  return lastAt;
}

let mongoPromise;
function mongoDb() {
  if (!mongoPromise) {
    const { MongoClient } = require('mongodb');
    mongoPromise = new MongoClient(MONGO_URI).connect()
      .then(async (c) => {
        const d = c.db(process.env.MONGODB_DB || 'krashi_mitra');
        try {
          await d.collection('km_lists').createIndex({ key: 1, at: -1 });
          await d.collection('km_hashes').createIndex({ key: 1, field: 1 }, { unique: true });
        } catch (_) { /* index na bane to bhi kaam chalta rahe */ }
        return d;
      })
      .catch((e) => { mongoPromise = null; throw e; });
  }
  return mongoPromise;
}

/* --- Demo memory (sirf tab jab KV na ho) ---------------------------------- */
const mem = globalThis.__krashiMitraStore || (globalThis.__krashiMitraStore = {
  lists: {},   // { key: [ '<json>', ... ] }
  hashes: {},  // { key: { field: '<json>' } }
});

/** Upstash/Vercel KV ka REST — body me seedha Redis command bhejte hain. */
async function kv(command) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + KV_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error('kv_' + res.status + ': ' + (await res.text()).slice(0, 160));
  const data = await res.json();
  return data && data.result;
}

/* --- List: nayi entry sabse upar, purani apne aap kat jaati hai ----------- */
async function listPush(key, value, cap) {
  const json = JSON.stringify(value);
  const limit = cap || 300;

  if (mongoReady()) {
    const d = await mongoDb();
    const col = d.collection('km_lists');
    await col.insertOne({ key: key, at: nextAt(), v: value });
    /* Purani entry kaat do, warna collection hamesha badhti rahegi */
    const extra = await col.countDocuments({ key: key }) - limit;
    if (extra > 0) {
      const old = await col.find({ key: key }).sort({ at: 1 }).limit(extra)
                           .project({ _id: 1 }).toArray();
      if (old.length) await col.deleteMany({ _id: { $in: old.map((o) => o._id) } });
    }
    return;
  }

  if (!kvReady()) {
    const arr = mem.lists[key] || (mem.lists[key] = []);
    arr.unshift(json);
    if (arr.length > limit) arr.length = limit;
    return;
  }
  await kv(['LPUSH', key, json]);
  await kv(['LTRIM', key, 0, limit - 1]);
}

async function listAll(key, limit) {
  const n = (limit || 300) - 1;

  if (mongoReady()) {
    const d = await mongoDb();
    const rows = await d.collection('km_lists')
      .find({ key: key }).sort({ at: -1 }).limit(n + 1).toArray();
    return rows.map((r) => r.v).filter(Boolean);
  }

  if (!kvReady()) {
    return (mem.lists[key] || []).slice(0, n + 1).map(safeParse).filter(Boolean);
  }
  const rows = (await kv(['LRANGE', key, 0, n])) || [];
  return rows.map(safeParse).filter(Boolean);
}

/* --- Hash: kisi scan ka status baad me badalna ---------------------------- */
async function hashSet(key, field, value) {
  const json = JSON.stringify(value);

  if (mongoReady()) {
    const d = await mongoDb();
    await d.collection('km_hashes').updateOne(
      { key: key, field: field },
      { $set: { v: value, at: nextAt() } },
      { upsert: true });
    return;
  }

  if (!kvReady()) {
    (mem.hashes[key] || (mem.hashes[key] = {}))[field] = json;
    return;
  }
  await kv(['HSET', key, field, json]);
}

/* Ek field mitana. Protocol hatane ke liye chahiye — bina iske purana
   galat protocol hamesha ke liye database me pada rehta. */
async function hashDel(key, field) {
  if (mongoReady()) {
    const d = await mongoDb();
    await d.collection('km_hashes').deleteOne({ key: key, field: field });
    return;
  }

  if (!kvReady()) {
    if (mem.hashes[key]) delete mem.hashes[key][field];
    return;
  }
  await kv(['HDEL', key, field]);
}

async function hashAll(key) {
  if (mongoReady()) {
    const d = await mongoDb();
    const rows = await d.collection('km_hashes').find({ key: key }).toArray();
    const out = {};
    rows.forEach((r) => { if (r.v) out[r.field] = r.v; });
    return out;
  }

  if (!kvReady()) {
    const out = {};
    Object.keys(mem.hashes[key] || {}).forEach((f) => {
      const v = safeParse(mem.hashes[key][f]);
      if (v) out[f] = v;
    });
    return out;
  }
  const flat = (await kv(['HGETALL', key])) || [];
  const out = {};
  // Upstash flat array deta hai: [field, value, field, value, ...]
  if (Array.isArray(flat)) {
    for (let i = 0; i < flat.length; i += 2) {
      const v = safeParse(flat[i + 1]);
      if (v) out[flat[i]] = v;
    }
  } else if (flat && typeof flat === 'object') {
    Object.keys(flat).forEach((f) => {
      const v = safeParse(flat[f]);
      if (v) out[f] = v;
    });
  }
  return out;
}

function safeParse(s) {
  if (s && typeof s === 'object') return s;
  try { return JSON.parse(s); } catch (_) { return null; }
}

/* --- Chhote helpers ------------------------------------------------------- */
function newId(prefix) {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return prefix + '-' + t + r;
}

/** Har jawab me batate hain ki data kahan rakha ja raha hai. */
function storageNote() {
  if (mongoReady() || kvReady()) return null;
  return 'DEMO MODE: data server ki memory me hai (KV set nahi hai) — restart par mit jayega. ' +
      'MONGODB_URI ya KV set karein, phir apne aap asli storage chalu ho jayega.';
}

module.exports = {
  kvReady, mongoReady, storageKind, storageNote,
  listPush, listAll, hashSet, hashAll, hashDel, newId,
};
