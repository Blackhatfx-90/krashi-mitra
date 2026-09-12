'use strict';

/* ============================================================================
 * VRIDHI AI — saare /api/... ek hi Netlify function se
 * netlify/functions/api.js
 *
 * KYUN EK HI FUNCTION
 *   App me 14 API raste hain. Vercel par har file apna alag function ban
 *   jaati thi, aur free plan par 12 se zyada nahi chalte — isliye site
 *   Netlify par le jaayi gayi.
 *
 *   Netlify par bhi har raste ka alag function banaya ja sakta tha, par
 *   uske liye 14 files dobara likhni padtin (Netlify ka handler Vercel se
 *   alag shakl ka hota hai). Uske bajaye yahan EK function hai jo saare
 *   raste sambhalta hai, aur beech me ek chhota anuvaadak (adapter) hai.
 *
 *   Faayda: api/*.js me ek line nahi badli. Kal koi teesri jagah host
 *   karni ho to sirf yeh file badalni padegi.
 *
 * ANUVAADAK KYA-KYA SAMBHALTA HAI
 *   Vercel Node-style deta hai: (req, res) — res.status().json(), res.end()...
 *   Netlify event deta hai aur { statusCode, headers, body } maangta hai.
 *
 *   Do file (api/auth.js, api/admin.js) body ko STREAM ki tarah padhti hain
 *   — req.on('data') / req.on('end'). Isliye req me wo bhi banana pada,
 *   warna login chup-chaap atak jaata.
 *
 *   Set-Cookie ek se zyada ho sakti hai, isliye wo alag se
 *   multiValueHeaders me jaati hai — warna Netlify sirf aakhri rakhta hai
 *   aur login ka cookie gir jaata.
 * ========================================================================= */

/* Raste. Lazy require — thanda start tez rehta hai, kyunki ek request me
   sirf ek hi module load hota hai (mongodb/bcryptjs sab ke liye nahi). */
const ROUTES = {
  admin:       () => require('../../api/admin.js'),
  advisories:  () => require('../../api/advisories.js'),
  agriculture: () => require('../../api/agriculture.js'),
  auth:        () => require('../../api/auth.js'),
  community:   () => require('../../api/community.js'),
  diagnose:    () => require('../../api/diagnose.js'),
  google:      () => require('../../api/google.js'),
  mandi:       () => require('../../api/mandi.js'),
  outbreaks:   () => require('../../api/outbreaks.js'),
  protocols:   () => require('../../api/protocols.js'),
  scans:       () => require('../../api/scans.js'),
  stats:       () => require('../../api/stats.js'),
  translate:   () => require('../../api/translate.js'),
  weather:     () => require('../../api/weather.js'),
};

/** '/api/auth' ya '/.netlify/functions/api/auth' -> 'auth' */
function routeName(event) {
  let p = String(event.path || '');
  p = p.replace(/^\/\.netlify\/functions\/api/, '');
  p = p.replace(/^\/api/, '');
  p = p.replace(/^\/+|\/+$/g, '');
  return p.split('/')[0] || '';
}

/* ---------------------------------------------------------------------------
 * Netlify event  ->  Vercel jaisa req
 * ------------------------------------------------------------------------- */
function makeReq(event, rawBody) {
  const headers = {};
  for (const k of Object.keys(event.headers || {})) {
    headers[k.toLowerCase()] = event.headers[k];
  }

  /* Vercel JSON body khud parse karke deta hai. Kuch file req.body padhti
     hain, kuch stream. Dono ka intezaam. */
  let parsed;
  const ctype = String(headers['content-type'] || '');
  if (rawBody && ctype.indexOf('application/json') !== -1) {
    try { parsed = JSON.parse(rawBody); } catch (_) { parsed = undefined; }
  }

  const req = {
    method: event.httpMethod || 'GET',
    url: event.path,
    headers: headers,
    query: Object.assign({}, event.queryStringParameters || {}),
    body: parsed,
  };

  /* Stream wala roop — api/auth.js aur api/admin.js isi se body padhte
     hain. Dono listener pehle judte hain, phir hum ek hi baar bhejte
     hain (isliye setImmediate). */
  const listeners = {};
  let scheduled = false;
  req.on = function (ev, cb) {
    (listeners[ev] || (listeners[ev] = [])).push(cb);
    if (!scheduled) {
      scheduled = true;
      setImmediate(() => {
        if (rawBody) (listeners.data || []).forEach((f) => f(rawBody));
        (listeners.end || []).forEach((f) => f());
      });
    }
    return req;
  };
  req.setEncoding = function () { return req; };

  return req;
}

/* ---------------------------------------------------------------------------
 * Vercel jaisa res  ->  Netlify jawab
 * ------------------------------------------------------------------------- */
function makeRes(resolve) {
  const out = { statusCode: 200, headers: {}, body: '' };
  const cookies = [];
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    const r = { statusCode: out.statusCode, headers: out.headers, body: out.body };
    /* Set-Cookie ek se zyada ho sakti hai — Netlify usi haalat me
       multiValueHeaders maangta hai. */
    if (cookies.length) r.multiValueHeaders = { 'Set-Cookie': cookies };
    resolve(r);
  };

  const res = {
    setHeader(k, v) {
      if (String(k).toLowerCase() === 'set-cookie') {
        (Array.isArray(v) ? v : [v]).forEach((c) => cookies.push(c));
      } else {
        out.headers[k] = v;
      }
      return res;
    },
    getHeader(k) { return out.headers[k]; },

    status(code) { out.statusCode = code; return res; },

    json(obj) {
      if (!out.headers['Content-Type'] && !out.headers['content-type']) {
        out.headers['Content-Type'] = 'application/json; charset=utf-8';
      }
      out.body = JSON.stringify(obj);
      finish();
      return res;
    },

    send(bodyStr) {
      out.body = typeof bodyStr === 'string' ? bodyStr : String(bodyStr == null ? '' : bodyStr);
      finish();
      return res;
    },

    /* api/google.js redirect isi se karta hai */
    writeHead(code, headers) {
      out.statusCode = code;
      if (headers) for (const k of Object.keys(headers)) res.setHeader(k, headers[k]);
      return res;
    },
    end(bodyStr) {
      if (bodyStr != null) out.body = String(bodyStr);
      finish();
      return res;
    },
  };

  return res;
}

exports.handler = async function (event) {
  const name = routeName(event);
  const load = ROUTES[name];

  if (!load) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'not_found', path: event.path }),
    };
  }

  const rawBody = event.body && event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : (event.body || '');

  let handler;
  try {
    handler = load();
  } catch (e) {
    console.error('[api] module load fail:', name, e && e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'server_error' }),
    };
  }

  return new Promise((resolve) => {
    const res = makeRes(resolve);
    const req = makeReq(event, rawBody);

    /* Handler kabhi jawab diye bina lautt jaye to request latki rehti hai
       aur Netlify 502 deta hai. Isliye promise ke baad bhi jaanch lete
       hain — kuch na kuch hamesha wapas jata hai. */
    Promise.resolve()
      .then(() => handler(req, res))
      .then(() => {
        resolve({
          statusCode: 500,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ error: 'no_response', route: name }),
        });
      })
      .catch((err) => {
        console.error('[api]', name, err && err.stack ? err.stack : err);
        resolve({
          statusCode: 500,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ error: 'server_error' }),
        });
      });
  });
};
