/* ============================================================================
 * api/_store.js — chhota storage layer (scans + advisories ke liye)
 *
 * DO HAALAT:
 *
 *   1. ASLI (recommended) — Vercel KV / Upstash Redis
 *      Vercel -> Storage -> KV banayein. Wo apne aap ye env vars daal deta hai:
 *          KV_REST_API_URL
 *          KV_REST_API_TOKEN
 *      Inke hote hi data sach me save hota hai aur sabhi officers ko dikhta hai.
 *
 *   2. DEMO (bina kisi setup ke) — server ki apni memory
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

/** KV lagi hai ya hum demo memory par chal rahe hain. */
function kvReady() {
  return Boolean(KV_URL && KV_TOKEN);
}

function storageKind() {
  return kvReady() ? 'kv' : 'memory';
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

  if (!kvReady()) {
    return (mem.lists[key] || []).slice(0, n + 1).map(safeParse).filter(Boolean);
  }
  const rows = (await kv(['LRANGE', key, 0, n])) || [];
  return rows.map(safeParse).filter(Boolean);
}

/* --- Hash: kisi scan ka status baad me badalna ---------------------------- */
async function hashSet(key, field, value) {
  const json = JSON.stringify(value);
  if (!kvReady()) {
    (mem.hashes[key] || (mem.hashes[key] = {}))[field] = json;
    return;
  }
  await kv(['HSET', key, field, json]);
}

/* Ek field mitana. Protocol hatane ke liye chahiye — bina iske purana
   galat protocol hamesha ke liye database me pada rehta. */
async function hashDel(key, field) {
  if (!kvReady()) {
    if (mem.hashes[key]) delete mem.hashes[key][field];
    return;
  }
  await kv(['HDEL', key, field]);
}

async function hashAll(key) {
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
  return kvReady()
    ? null
    : 'DEMO MODE: data server ki memory me hai (KV set nahi hai) — restart par mit jayega. ' +
      'Vercel -> Storage -> KV banayein, phir apne aap asli storage chalu ho jayega.';
}

module.exports = {
  kvReady, storageKind, storageNote,
  listPush, listAll, hashSet, hashAll, hashDel, newId,
};
