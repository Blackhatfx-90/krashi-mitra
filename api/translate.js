/* ============================================================================
 * api/translate.js — chetavni ko kisan ki bhasha me
 *
 * SOCH
 *   Admin apni bhasha (aam taur par Hindi) me ek hi baar likhta hai.
 *   Har kisan ne apni alag bhasha chuni hai. Sabhi 22 bhashaon me pehle se
 *   anuvaad karna fizool hai — zyadatar kabhi maangi hi nahi jaatin.
 *   Isliye JAB MAANGI JAAYE TAB anuvaad karte hain, aur natija sambhal lete
 *   hain. Doosri baar wahi bhasha maange to seedha cache se milta hai.
 *
 *   Anuvaad usi engine se hota hai jo photo jaanchne me lagta hai
 *   (api/diagnose.js) — koi nayi service nahi jodi.
 *
 * KHAAS DHYAN — DAWA AUR MATRA
 *   Prompt me saaf likha hai ki dawa ke naam, sankhya aur matra JAISI KI
 *   TAISI rehni chahiye. "2.5 ग्राम प्रति लीटर" ka anuvaad me badal jana
 *   kisan ki fasal kharab kar sakta hai.
 *
 *   Anuvaad na ho paye to hum ASLI Hindi text hi bhejte hain, saath me
 *   translated:false — taaki kisan ko kuch to sahi mile. Adhoora ya
 *   shakki anuvaad bhejne se behtar hai asli text bhejna.
 * ========================================================================= */

'use strict';

const store = require('./_store');
const CACHE_KEY = 'km:translations';
const MAX_CACHE = 400;

const NAMES = {
  'hi-IN':'Hindi','en-IN':'English','bn-IN':'Bengali','mr-IN':'Marathi','te-IN':'Telugu',
  'ta-IN':'Tamil','gu-IN':'Gujarati','kn-IN':'Kannada','ml-IN':'Malayalam','pa-IN':'Punjabi',
  'or-IN':'Odia','as-IN':'Assamese','ur-IN':'Urdu','ne-IN':'Nepali','sa-IN':'Sanskrit',
  'kok-IN':'Konkani','mai-IN':'Maithili','doi-IN':'Dogri','brx-IN':'Bodo','ks-IN':'Kashmiri',
  'sat-IN':'Santali','sd-IN':'Sindhi','mni-IN':'Manipuri',
};

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return String(h >>> 0);
}

/* _store me get/set nahi hai — hashSet/hashAll hai, isliye wahi use karte hain.
   Cache ka har entry ek "field" hai: <bhasha>:<text ka hash> -> anuvaad */
async function readCache() {
  try { return (await store.hashAll(CACHE_KEY)) || {}; } catch (_) { return {}; }
}
async function saveOne(field, value) {
  try { await store.hashSet(CACHE_KEY, field, value); } catch (_) { /* cache fail — koi baat nahi */ }
}

function buildPrompt(text, langName) {
  return [
    'You are translating an official agriculture advisory for Indian farmers.',
    'Translate the following text into ' + langName + '.',
    '',
    'STRICT RULES:',
    '- Keep every number, dose, quantity and unit EXACTLY as written',
    '  (e.g. "2.5 ग्राम प्रति लीटर" must keep 2.5 and the same unit).',
    '- Keep pesticide / chemical / fertiliser brand and chemical names in their',
    '  original form. Do not translate or transliterate them into something else.',
    '- Keep it short and plain, the way a village farmer speaks. No formal words.',
    '- Reply with ONLY the translated text. No quotes, no notes, no explanation.',
    '',
    'TEXT:',
    text,
  ].join('\n');
}

/** Ek text ka anuvaad. Fail ho to null (caller asli text bhej dega). */
async function translateOne(text, targetCode) {
  const langName = NAMES[targetCode];
  if (!langName || targetCode === 'hi-IN') return null;   // Hindi hi asli hai

  const geminiKey = process.env.GEMINI_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;
  if (!geminiKey && !orKey) return null;

  const prompt = buildPrompt(text, langName);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);

  try {
    if (geminiKey) {
      const r = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
        encodeURIComponent(geminiKey),
        { method:'POST', signal: ctrl.signal, headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{ parts:[{ text: prompt }] }] }) });
      if (!r.ok) return null;
      const j = await r.json();
      const out = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('').trim();
      return out || null;
    }

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:'POST', signal: ctrl.signal,
      headers:{ 'Authorization':'Bearer '+orKey, 'Content-Type':'application/json',
                'X-Title':'Vridhi AI - Advisory Translation' },
      body: JSON.stringify({
        model: (process.env.OPENROUTER_MODELS || 'google/gemma-4-31b-it:free').split(',')[0].trim(),
        max_tokens: 900, temperature: 0.1,
        messages: [{ role:'user', content: prompt }],
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const msg = j?.choices?.[0]?.message?.content;
    const out = (typeof msg === 'string' ? msg : Array.isArray(msg) ? msg.map((c)=>c&&c.text).join('') : '').trim();
    return out || null;

  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cache ke saath anuvaad.
 * @returns {{text:string, translated:boolean}}
 */
async function translateCached(text, targetCode) {
  const src = String(text || '').trim();
  if (!src) return { text: '', translated: false };
  if (!targetCode || targetCode === 'hi-IN' || !NAMES[targetCode]) {
    return { text: src, translated: false };
  }

  const key = targetCode + ':' + hash(src);
  const cache = await readCache();
  if (cache[key]) return { text: cache[key], translated: true };

  const out = await translateOne(src, targetCode);
  if (!out) return { text: src, translated: false };      // asli text — kuch to sahi mile

  await saveOne(key, out);
  return { text: out, translated: true };
}

/* HTTP se bhi bula sakte hain (admin dashboard preview ke liye) */
const rateLimit = require('./_ratelimit');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  /* Anuvaad cache hota hai, isliye ek kisan ki app isse kam hi bulati hai.
     100 ek ghante me — asli istemal me kabhi nahi chhuega. */
  if (req.method === 'POST') {
    const stop = await rateLimit.blocked(req, res, 'translate', 100, 3600);
    if (stop) return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'method_not_allowed' });
  }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (_) { b = null; } }
  if (!b || !b.text) return res.status(400).json({ ok:false, error:'text_zaroori' });

  const out = await translateCached(String(b.text).slice(0, 1200), String(b.lang || ''));
  return res.status(200).json({ ok:true, text: out.text, translated: out.translated });
};

module.exports.translateCached = translateCached;
module.exports.LANG_NAMES = NAMES;
