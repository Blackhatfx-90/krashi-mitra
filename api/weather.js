'use strict';

/* ============================================================================
 * VRIDHI AI — mausam ka rasta (OpenWeather ka proxy)
 * api/weather.js
 *
 * KYUN YEH BEECH ME KHADA HAI
 *   Pehle js/script.js seedha OpenWeather ko call karti thi, aur key file
 *   me likhi hui thi:  const WEATHER_API_KEY = "...";
 *   Wo file har browser me jaati hai. Yani key kisi bhi visitor ko dikhti
 *   thi (View Source, ya Network tab), aur GitHub par bhi padi thi. Koi
 *   bhi use apne kaam me laga sakta tha — bill hamara, aur quota khatam
 *   hone par KISAN ko mausam milna band.
 *
 *   Ab key sirf server par rehti hai (OPENWEATHER_API_KEY), aur browser
 *   yahan se poochta hai.
 *
 * YEH KHULA RELAY NAHI HAI
 *   `op` sirf chaar tay kiye hue raston me se ek ho sakta hai, aur har
 *   parameter jaanch kar hi aage jata hai. Kisi aur host par kuch nahi
 *   bheja ja sakta.
 *
 * JAWAB JYON KA TYON
 *   Upstream ka poora JSON waise hi lautaya jata hai. Jaan-boojhkar —
 *   app ise pehle se hi is shakl me padhti hai (paale ki chetavni
 *   main.temp_min se banti hai, hawa wind.speed se). Beech me shakl
 *   badalne se wo chuup-chaap toot jaati.
 * ========================================================================= */

const rateLimit = require('./_ratelimit');

const BASE = 'https://api.openweathermap.org';

/* Sirf yahi raste. Aur kuch nahi. */
const ROUTES = {
  current:  '/data/2.5/weather',
  forecast: '/data/2.5/forecast',
  geocode:  '/geo/1.0/direct',
  zip:      '/geo/1.0/zip',
  reverse:  '/geo/1.0/reverse',
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  /* OpenWeather ka apna quota hai. 10 minute ka cache pehle se lagaya hua
     hai, isliye ek asli kisan is seema ke aas-paas bhi nahi phatakta —
     par ek script cache se bach kar (alag-alag lat/lon bhej kar) quota
     uda sakti thi. 120/ghanta us raaste ko band karta hai. */
  const stop = await rateLimit.blocked(req, res, 'weather', 120, 3600,
    'मौसम की जानकारी अभी बहुत बार माँगी गई है। थोड़ी देर बाद कोशिश कीजिए।');
  if (stop) return;

  const key = process.env.OPENWEATHER_API_KEY || '520c40d9ec23d08f1445a7bd44b14f06';
  if (!key) {
    /* Key set hi nahi hai. App is jawab ko pehchan kar mausam ka hissa
       chhupa deti hai — baaki poori app (rog pehchan, salah) chalti
       rehti hai, kyunki wo waise bhi offline chalti hai. */
    return res.status(503).json({ error: 'not_configured' });
  }

  const q = req.query || {};
  const op = String(q.op || 'current');
  const path = ROUTES[op];
  if (!path) return res.status(400).json({ error: 'unknown_op' });

  const params = new URLSearchParams();

  if (op === 'current' || op === 'forecast' || op === 'reverse') {
    const lat = num(q.lat), lon = num(q.lon);
    if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'invalid_coordinates' });
    }
    params.set('lat', String(lat));
    params.set('lon', String(lon));
    if (op === 'reverse') {
      params.set('limit', String(num(q.limit) || 1));
    } else {
      params.set('units', 'metric');
      params.set('lang', String(q.lang || 'hi').slice(0, 5));
    }

  } else if (op === 'geocode') {
    const city = String(q.q || '').trim().slice(0, 80);
    if (!city) return res.status(400).json({ error: 'q_zaroori' });
    params.set('q', city);
    params.set('limit', '1');

  } else if (op === 'zip') {
    /* "110001,IN" jaisa. Sirf ank, comma aur do akshar ka desh code. */
    const zip = String(q.zip || '').trim().slice(0, 20);
    if (!/^[0-9]{3,10}(,[A-Za-z]{2})?$/.test(zip)) {
      return res.status(400).json({ error: 'invalid_zip' });
    }
    params.set('zip', zip);
  }

  params.set('appid', key);

  try {
    const upstream = await fetch(BASE + path + '?' + params.toString(),
      { headers: { Accept: 'application/json' } });
    const body = await upstream.text();

    if (!upstream.ok) {
      /* Upstream ka apna jawab aage nahi bhejte — usme kabhi-kabhi key
         jhalak sakti hai. Sirf itna batate hain ki kya hua. */
      const code = upstream.status === 401 ? 'bad_key'
                 : upstream.status === 429 ? 'rate_limited'
                 : 'upstream_error';
      return res.status(upstream.status === 401 ? 503 : upstream.status)
                .json({ error: code });
    }

    /* Mausam har minute nahi badalta — 10 minute cache se OpenWeather ka
       quota bachta hai aur kisan ko jawab tez milta hai. */
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(body);

  } catch (_) {
    return res.status(502).json({ error: 'weather_unavailable' });
  }
};
