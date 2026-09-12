'use strict';

/* ============================================================================
 * KRASHI MITRA — mandi bhaav ka rasta (data.gov.in ka proxy)
 * api/mandi.js
 *
 * KYUN YEH BEECH ME KHADA HAI
 *   js/mandi.js me DATAGOV_API_KEY ke liye jagah bani hui thi — "yahan
 *   paste karein". Wo file har browser me jaati hai aur GitHub par bhi
 *   padi rehti hai. Jis din koi wahan asli key paste karta, wo key usi pal
 *   sabki ho jaati.
 *
 *   Mausam wali key ke saath yahi ho chuka tha. Isliye yahan wo galti hone
 *   se PEHLE rasta band kar rahe hain: key ab sirf server par
 *   (DATAGOV_API_KEY), aur browser yahan se poochta hai.
 *
 * YEH KHULA RELAY NAHI HAI
 *   Sirf ek hi dataset, ek hi host. Rajya aur fasal ka naam saaf karke hi
 *   aage jata hai, aur limit par chhat lagi hai.
 *
 * JAWAB JYON KA TYON
 *   data.gov.in ka JSON waise hi lautaya jata hai — js/mandi.js pehle se
 *   `records` ko isi shakl me padhta hai.
 * ========================================================================= */

const rateLimit = require('./_ratelimit');

const HOST = 'https://api.data.gov.in/resource/';

/* Agmarknet ka "Variety-wise Daily Market Prices" dataset. Yahi ek. */
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';

const MAX_LIMIT = 2000;

function clean(v, max) {
  if (typeof v !== 'string') return '';
  /* Sirf akshar, ank, space, dash aur brackets — rajya/fasal ke naam me
     isse zyada kuch nahi hota. */
  return v.trim().replace(/[^\p{L}\p{N}\s()\-,.]/gu, '').slice(0, max || 80);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  /* data.gov.in ki bhi apni seema hai, aur har call 2000 tak record
     kheenchta hai — mehnga jawab. 60/ghanta kaafi khula hai (kisan din me
     chand baar bhaav dekhta hai) par script ko rok deta hai. */
  const stop = await rateLimit.blocked(req, res, 'mandi', 60, 3600,
    'मंडी भाव अभी बहुत बार माँगे गए हैं। थोड़ी देर बाद कोशिश कीजिए।');
  if (stop) return;

  const key = process.env.DATAGOV_API_KEY;
  if (!key) {
    /* Key set hi nahi hai. App is jawab ko pehchan kar mandi ka card
       chhupa deti hai — baaki app par koi asar nahi. */
    return res.status(503).json({ error: 'not_configured' });
  }

  const q = req.query || {};
  const state = clean(q.state, 60);
  const commodity = clean(q.commodity, 60);
  if (!state || !commodity) {
    return res.status(400).json({ error: 'state_aur_commodity_zaroori' });
  }

  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 500, 1), MAX_LIMIT);

  const params = new URLSearchParams();
  params.set('api-key', key);
  params.set('format', 'json');
  params.set('limit', String(limit));
  params.set('filters[state]', state);
  params.set('filters[commodity]', commodity);

  try {
    const upstream = await fetch(HOST + RESOURCE_ID + '?' + params.toString(),
      { headers: { Accept: 'application/json' } });
    const body = await upstream.text();

    if (!upstream.ok) {
      /* Upstream ki apni error body aage nahi bhejte — usme kabhi key
         jhalak sakti hai. */
      const code = (upstream.status === 401 || upstream.status === 403) ? 'bad_key'
                 : upstream.status === 429 ? 'rate_limited'
                 : 'upstream_error';
      return res.status(code === 'bad_key' ? 503 : upstream.status).json({ error: code });
    }

    /* Mandi bhaav din me ek baar badalta hai. 30 minute cache se kisan ko
       jawab tez milta hai aur data.gov.in par bojh kam padta hai. */
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(body);

  } catch (_) {
    return res.status(502).json({ error: 'mandi_unavailable' });
  }
};
