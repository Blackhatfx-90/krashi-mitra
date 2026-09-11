'use strict';

/* ============================================================================
 * KRASHI MITRA — ek IP se kitni baar (rate limit)
 * api/_ratelimit.js
 *
 * KYUN
 *   /api/diagnose, /api/agriculture aur /api/translate — teenon bina login
 *   ke khule hain (khule hone hi chahiye, kisan login kiye bina bhi jaanch
 *   kar sakta hai) aur teenon ek paid AI ko call karte hain.
 *
 *   Bina kisi seema ke, ek aadmi ek script se hazaron request bhej kar
 *   poora quota ya paisa uda sakta hai. Nuksan do taraf se hota hai —
 *   kharcha hamara, aur quota marte hi KISAN ki AI-jaanch, sahayak aur
 *   chetavni ka anuvaad band. Theek jis din wo sabse zyada zaroori ho.
 *
 * SEEMA UDAAR RAKHI HAI
 *   Asli kisan ek ghante me 10-20 baar jaanch karta hai, 200 baar nahi.
 *   Seema itni rakhi hai ki asli istemal kabhi na atke, par script turant
 *   ruk jaye. Ek hi gaon ke kai kisan aksar ek hi mobile network ke peeche
 *   hote hain (NAT), isliye jaan-boojhkar khuli chhodi hai.
 *
 * ATAKNE PAR KHULA CHHODTE HAIN (fail-open)
 *   Database ek pal ke liye jawab na de to hum request ROKTE NAHI. Kisan
 *   ko "bahut zyada koshish" ka jhootha sandesh dena isse bura hai ki ek
 *   extra AI call chali jaye.
 * ========================================================================= */

const store = require('./_store');

const KEY = 'km:ratelimit';

/* Vercel ke peeche asli IP yahan aati hai. Pehla hissa hi client ka hai;
   baaki proxy jodte jaate hain. */
function callerIp(req) {
  const h = (req && req.headers) || {};
  const fwd = h['x-forwarded-for'] || h['X-Forwarded-For'] || '';
  const first = String(fwd).split(',')[0].trim();
  return first || h['x-real-ip'] || 'unknown';
}

/**
 * @param {object} req
 * @param {string} bucket   kis cheez ki ginti ('diagnose' | 'ask' | 'translate')
 * @param {number} max      ek khidki me itni se zyada nahi
 * @param {number} windowSec khidki kitni lambi (second)
 * @returns {Promise<{ok:boolean, retryAfter:number}>}
 */
async function check(req, bucket, max, windowSec) {
  const ip = callerIp(req);
  if (ip === 'unknown') return { ok: true, retryAfter: 0 };   // pata hi nahi — rokna galat hoga

  const now = Date.now();
  const win = Math.floor(now / (windowSec * 1000));
  const field = bucket + ':' + ip + ':' + win;

  try {
    const all = await store.hashAll(KEY);
    const row = all[field];
    const count = (row && Number(row.n)) || 0;

    if (count >= max) {
      const nextWindowAt = (win + 1) * windowSec * 1000;
      return { ok: false, retryAfter: Math.max(1, Math.ceil((nextWindowAt - now) / 1000)) };
    }

    await store.hashSet(KEY, field, { n: count + 1, at: now });

    /* Purani khidkiyon ki entry jhaad dete hain — warna ye hash hamesha
       badhta rehta. Har baar nahi, kabhi-kabhi (taaki har request par
       poora hash na saaf karna pade). */
    if (Math.random() < 0.02) {
      const cutoff = now - windowSec * 1000 * 3;
      for (const f of Object.keys(all)) {
        const r = all[f];
        if (r && Number(r.at) && Number(r.at) < cutoff) {
          store.hashDel(KEY, f).catch(() => {});
        }
      }
    }

    return { ok: true, retryAfter: 0 };

  } catch (e) {
    console.error('[ratelimit] jaanch fail, khula chhod rahe hain:', e && e.message);
    return { ok: true, retryAfter: 0 };            // fail-open
  }
}

/** Rukna pade to seedha jawab bhej deta hai. true = request yahin khatam. */
async function blocked(req, res, bucket, max, windowSec, messageHi) {
  const r = await check(req, bucket, max, windowSec);
  if (r.ok) return false;

  res.setHeader('Retry-After', String(r.retryAfter));
  res.status(429).json({
    ok: false,
    error: 'too_many_requests',
    retryAfter: r.retryAfter,
    messageHi: messageHi || 'बहुत सारी कोशिशें हो गईं। थोड़ी देर बाद दोबारा कीजिए।',
  });
  return true;
}

module.exports = { check, blocked, callerIp };
