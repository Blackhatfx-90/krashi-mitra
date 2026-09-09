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

/** App ka apna pata — Vercel ke peeche host header proxy se aata hai. */
function origin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host;
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
  const REDIRECT_URI  = origin(req) + '/api/google';

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return failBack(req, res, 'google_not_configured');
  }

  const code  = req.query && req.query.code;
  const state = req.query && req.query.state;
  const err   = req.query && req.query.error;

  /* Kisan ne Google ke page par "Cancel" daba diya */
  if (err) return redirectTo(res, origin(req) + '/login');

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
    return failBack(req, res, 'server_error');
  }
};
