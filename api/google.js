/* ============================================================================
 * api/google.js — Google se login (OAuth 2.0)
 *
 * NextAuth.js YAHAN NAHI CHAL SAKTA — wo Next.js maangta hai, aur yeh app
 * saada HTML/JS + Vercel functions par bani hai. Isliye OAuth ka standard
 * "authorization code" flow haath se likha gaya hai. Kaam wahi hota hai.
 *
 * EK HI FILE, DO KAAM (isliye redirect_uri me koi query param nahi lagta —
 * Google usme query params pasand nahi karta):
 *   /api/google              -> Google ke login page par bhej deta hai
 *   /api/google?code=...     -> Google wapas yahin bhejta hai, session ban jaata hai
 *
 * ── VERCEL ME KYA SET KARNA HAI ────────────────────────────────────────────
 *   GOOGLE_CLIENT_ID       = <Google Console se>
 *   GOOGLE_CLIENT_SECRET   = <Google Console se>
 *   MONGODB_URI            = (pehle se laga hoga)
 *
 * ── GOOGLE CLOUD CONSOLE ME KYA SET KARNA HAI ──────────────────────────────
 *   Credentials -> apna OAuth client -> "Authorized redirect URIs" me
 *   BILKUL yeh daalein (aakhir me slash nahi):
 *       https://<aapka-domain>/api/google
 *   Local test ke liye:  http://localhost:3000/api/google
 *
 * NIJTA: hum sirf naam aur email lete hain. Google ka access token kahin
 * sambhaal kar nahi rakhte — kaam hote hi phenk dete hain.
 * ========================================================================= */

'use strict';

const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const AUTH_URL  = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

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

/* ---------------------------------------------------------------------------
 * App ka apna pata.
 *
 * Yeh sabse nazuk cheez hai: isi se redirect_uri banta hai, aur Google use
 * AKSHAR-DAR-AKSHAR milata hai us pate se jo Console me darj hai. Ek
 * akshar ka farak = "Error 400: redirect_uri_mismatch" aur login band.
 *
 * Isliye teen parat:
 *   1. PUBLIC_SITE_URL — agar set ho to wahi, bina kisi anuman ke.
 *      (Netlify par ise set kar dena sabse surakshit hai — deploy preview
 *       aur branch deploy ke apne-apne pate hote hain, aur unme se kisi
 *       par bhi login tabhi chalega jab pata sthir ho.)
 *   2. x-forwarded-host / host — aam haalat me yahi sahi hota hai.
 *   3. kuch na mile to khali — neeche wala code use pehchan kar saaf
 *      error deta hai, "https://undefined/..." par nahi bhejta.
 * ------------------------------------------------------------------------- */
function origin(req) {
  const fixed = String(process.env.PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (fixed) return fixed;

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return '';
  return proto + '://' + host;
}

/** JWT ka beech wala hissa (payload) padho. Signature jaanchne ki zaroorat
 *  nahi — token seedha Google ke server se TLS par aaya hai, beech me koi
 *  nahi tha (OIDC spec me isi ko chhoot di gayi hai). */
function readIdToken(idToken) {
  const part = String(idToken || '').split('.')[1];
  if (!part) return null;
  const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  try { return JSON.parse(json); } catch (_) { return null; }
}

function redirectTo(res, url) {
  res.writeHead(302, { Location: url });
  res.end();
}

/** Kuch gadbad hui to login page par saaf message ke saath wapas. */
function failBack(req, res, why) {
  console.error('[google-auth]', why);
  redirectTo(res, origin(req) + '/login?error=' + encodeURIComponent(why));
}

module.exports = async function handler(req, res) {
  const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const site = origin(req);
  if (!site) {
    /* Pata hi nahi chala ki app kahan chal rahi hai. Aise me Google ke
       paas bhejna bekaar hai — wo turant mismatch par gira dega. */
    console.error('[google-auth] app ka pata nahi mila — PUBLIC_SITE_URL set kijiye');
    return res.status(500).json({
      error: 'site_url_missing',
      messageHi: 'सर्वर पर साइट का पता सेट नहीं है। (PUBLIC_SITE_URL)',
    });
  }
  const REDIRECT_URI  = site + '/api/google';

  /* ---------------------------------------------------------------------
   * JAANCH ka raasta:  /api/google?check=1
   * Sirf yeh batata hai ki setting lagi hai ya nahi — VALUE kabhi nahi
   * bhejta. Isse pata chal jaata hai ki dikkat env var me hai ya kahin aur.
   * ------------------------------------------------------------------- */
  if (req.query && req.query.check) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    let mongoOk = false, mongoErr = '';
    if (process.env.MONGODB_URI) {
      try { await db(); mongoOk = true; } catch (e) { mongoErr = String(e && e.message || e).slice(0, 120); }
    }
    return res.status(200).end(JSON.stringify({
      clientIdSet:     Boolean(CLIENT_ID),
      clientSecretSet: Boolean(CLIENT_SECRET),
      mongoSet:        Boolean(process.env.MONGODB_URI),
      mongoOk:         mongoOk,
      mongoErr:        mongoErr || undefined,
      // Google Console me BILKUL yahi URI daalna hai
      redirectUriToRegister: REDIRECT_URI,
      ready: Boolean(CLIENT_ID && CLIENT_SECRET && mongoOk),
    }, null, 2));
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return failBack(req, res, 'google_not_configured');
  }

  const code  = req.query && req.query.code;
  const state = req.query && req.query.state;
  const err   = req.query && req.query.error;

  /* Google ne khud koi gadbad batai.
     Pehle hum ise chup-chaap gira dete the aur kisan ko kuch pata hi nahi
     chalta tha. Ab wajah aage bhej dete hain taaki login page par saaf
     dikhe ki hua kya. "access_denied" ka matlab kisan ne khud Cancel dabaya
     — usme koi gadbad nahi, isliye chup-chaap wapas bhej dete hain. */
  if (err) {
    if (err === 'access_denied') return redirectTo(res, origin(req) + '/login');
    return failBack(req, res, 'google_' + String(err).slice(0, 40));
  }

  /* ---------- 1. SHURUAAT — Google ke login page par bhejo ---------- */
  if (!code) {
    const csrf = crypto.randomBytes(16).toString('hex');
    // 10 minute ka chhota cookie — sirf yeh jaanchne ke liye ki wapas aane
    // wala wahi hai jise humne bheja tha (CSRF se bachav)
    res.setHeader('Set-Cookie',
      'krashi_oauth=' + csrf + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600');

    const url = AUTH_URL + '?' + new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      state: csrf,
      prompt: 'select_account',
    }).toString();
    return redirectTo(res, url);
  }

  /* ---------- 2. WAPSI — Google ne code bheja hai ---------- */
  try {
    const saved = cookies(req).krashi_oauth;
    if (!saved || !state || saved !== state) return failBack(req, res, 'state_mismatch');

    /* code ko token se badlo */
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });
    if (!tokenRes.ok) return failBack(req, res, 'token_exchange_failed');

    const tokens = await tokenRes.json();
    const claims = readIdToken(tokens.id_token);
    if (!claims || !claims.email) return failBack(req, res, 'no_email');
    if (claims.email_verified === false) return failBack(req, res, 'email_not_verified');

    const email = String(claims.email).toLowerCase().trim();
    const name  = String(claims.name || email.split('@')[0]).trim();

    const d = await db();
    const users = d.collection('users');
    let user = await users.findOne({ email: email });
    const now = new Date();

    if (!user) {
      /* Naya kisan — password nahi rakhte, Google hi pehchan hai */
      const r = await users.insertOne({
        name: name, email: email, phone: '',
        passwordHash: null, authProvider: 'google', googleId: claims.sub,
        profile: null, createdAt: now, updatedAt: now,
      });
      user = { _id: r.insertedId, name: name, email: email, profile: null };
    } else if (!user.googleId) {
      /* Pehle password se bana tha — ab Google bhi jod dete hain.
         Email Google ne khud verify kiya hai, isliye yeh surakshit hai. */
      await users.updateOne({ _id: user._id },
        { $set: { googleId: claims.sub, updatedAt: now } });
    }

    /* Wahi session banate hain jo api/auth.js banata hai — dono jagah ek hi
       tarika, warna do alag login system ho jaate. */
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await d.collection('sessions').insertOne({
      token: sessionToken, userId: user._id,
      expiresAt: new Date(Date.now() + 2592000000),      // 30 din
    });

    res.setHeader('Set-Cookie', [
      'krashi_session=' + sessionToken + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000',
      'krashi_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',   // csrf cookie hatao
    ]);

    /* Profile adhoori ho to app khud modal dikha dega (js/profile-onboarding.js) */
    return redirectTo(res, origin(req) + '/app');

  } catch (e) {
    const emsg = String(e && e.message || '').toLowerCase();
    console.error('[google-auth] catch:', e && e.stack ? e.stack : e);
    if (emsg.includes('mongo') || emsg.includes('topology') || emsg.includes('econnrefused') || emsg.includes('authentication') || emsg.includes('auth')) {
      return failBack(req, res, 'db_error');
    }
    return failBack(req, res, 'server_error');
  }
};
