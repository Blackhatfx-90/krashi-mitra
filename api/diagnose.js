/* ============================================================================
 * api/diagnose.js — ONLINE MODE ka dimaag (Vercel Serverless Function)
 *
 * KYUN ZAROORI HAI:
 *   OpenRouter ki API key KABHI BHI browser ke code me nahi daalni chahiye —
 *   website ka source koi bhi khol kar dekh sakta hai aur key chura sakta hai.
 *   Isliye browser sirf IS function ko call karta hai, aur key yahan server par
 *   environment variable (OPENROUTER_API_KEY) me rehti hai.
 *
 * KAAM:
 *   1. Browser se photo (base64) + offline model ka top-3 answer leta hai
 *   2. OpenRouter ke free vision model se photo ki dobara jaanch karata hai
 *   3. Model ko SIRF usi fasal ke labels me se chunne deta hai
 *   4. JSON wapas bhejta hai: { label, confidence, agree, reason }
 *
 * SETUP (ek hi baar):
 *   1. https://openrouter.ai par free account -> Keys -> naya key banayein
 *   2. Vercel -> apna project -> Settings -> Environment Variables
 *      Name : OPENROUTER_API_KEY
 *      Value: sk-or-v1-...
 *   3. Redeploy. Bas.
 *
 * Local test ke liye:  export OPENROUTER_API_KEY=sk-or-v1-...  phir vercel dev
 * ========================================================================= */

'use strict';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Model chain — pehla try hota hai, na chale (rate limit / error) to agla.
 * Saare FREE vision models hain (OpenRouter par ":free" suffix = 0 cost).
 * Badalna ho to Vercel me OPENROUTER_MODELS env var set kar dein (comma se alag).
 */
const DEFAULT_MODELS = [
  'google/gemma-4-31b-it:free',      // Google DeepMind 31B multimodal — best default
  'thinkingmachines/inkling:free',   // 975B MoE — sabse gehri reasoning
  'thinkingmachines/inkling-small:free', // halka/tez variant, wahi 1M context
  'google/gemma-4-26b-a4b-it:free',  // halka/tez MoE variant
  'openrouter/free',                 // last resort: OpenRouter ka free router
];

/* ---------------------------------------------------------------------------
 * SAMAY KA BUDGET — yeh Netlify par aakar badalna PADA
 *
 * Pehle: har model ko 22 second, aur 3 model tak koshish = 66 second tak.
 * Vercel par function ko 60 second mile the (vercel.json me maxDuration),
 * isliye chal jata tha.
 *
 * Netlify par function ka waqt bahut kam hai (default 10 second). Agar hum
 * 22 second wala model call chalu rakhte, to har baar function BEECH ME
 * mar jata — kisan ko 502 milta, aur hum kabhi sahi kaaran bhi na dekh
 * paate (log bhi katt jaate).
 *
 * Isliye ab ek KUL BUDGET hai, aur har model call usi ke andar rehta hai.
 * Budget khatam hone par aage koshish hi nahi karte — seedha offline
 * jawab ke saath saaf sandesh.
 *
 * Netlify par function ka waqt badha lein to bas env var badal dein,
 * code chhune ki zaroorat nahi:
 *     API_BUDGET_MS   = 9000   (default — 10s wale function me surakshit)
 *     AI_MAX_ATTEMPTS = 2
 * ------------------------------------------------------------------------- */
const TOTAL_BUDGET_MS = Number(process.env.API_BUDGET_MS) || 9000;

/** Jawab dene ke liye itna hissa hamesha bacha kar rakhte hain. */
const SAFETY_MS = 1200;

/** Zyada se zyada itne models try karenge (budget ke andar). */
const MAX_ATTEMPTS = Number(process.env.AI_MAX_ATTEMPTS) || 2;

/** Ek model ko zyada se zyada itna — par bacha hua budget isse chhota ho
    to wahi chalta hai. */
const PER_MODEL_TIMEOUT_MS = Math.max(3000, Math.floor(TOTAL_BUDGET_MS / MAX_ATTEMPTS));

/** Kitna samay bacha hai. */
function msLeft(startedAt) {
  return TOTAL_BUDGET_MS - SAFETY_MS - (Date.now() - startedAt);
}
/** Photo ki max size (base64 ke baad). Vercel ki body limit 4.5 MB hai. */
const MAX_IMAGE_CHARS = 3 * 1024 * 1024;

function models() {
  const fromEnv = (process.env.OPENROUTER_MODELS || '').trim();
  if (!fromEnv) return DEFAULT_MODELS;
  return fromEnv.split(',').map((s) => s.trim()).filter(Boolean);
}

/* ---------------------------------------------------------------------------
 * Prompt — model ko bilkul saaf hidayat, aur sirf diye gaye labels me se chunna.
 * ------------------------------------------------------------------------- */
function buildPrompt(crop, labels, localTop) {
  const list = labels.map((l, i) => `${i}. ${l}`).join('\n');

  const local = (localTop || [])
    .slice(0, 3)
    .map((r, i) => `${i + 1}. ${r.label} — ${(r.prob * 100).toFixed(1)}%`)
    .join('\n') || '(none)';

  return [
    `You are an expert agricultural plant pathologist for Indian farming conditions.`,
    `The farmer photographed a ${crop} plant/leaf. Identify the disease or pest.`,
    ``,
    `You MUST choose exactly one label from this list (copy the string exactly):`,
    list,
    ``,
    `An on-device model (small, often wrong) guessed:`,
    local,
    ``,
    `Treat that guess as a weak hint only. Judge the photo yourself.`,
    ``,
    `Rules:`,
    `- Look at real visual evidence: lesion shape, colour, margins, halo, distribution,`,
    `  powder/pustules, insects, wilting, position on the leaf.`,
    `- If the plant looks healthy, choose the "healthy" label from the list.`,
    `- IMPORTANT: if the photo does not show a plant at all (a person, an animal, a room,`,
    `  the sky, a wall, food, a screenshot, text, an object), set "label" to "not_plant".`,
    `  Never guess a disease for such a photo - a wrong answer can cost the farmer a crop.`,
    `- If it IS clearly a plant but a DIFFERENT crop than ${crop}, set "label" to "wrong_crop"`,
    `  and name the crop you actually see in "evidence". The farmer picked ${crop}, so a`,
    `  ${crop} disease name would be wrong advice.`,
    `- If it IS a ${crop} plant but blurry or too dark to judge, set "label" to "unclear".`,
    `- Never invent a label that is not in the list above.`,
    ``,
    `Reply with ONLY this JSON object, no markdown, no extra text:`,
    `{"label":"<exact label from list, or unclear, or not_plant, or wrong_crop>",`,
    ` "confidence":<0.0-1.0>,`,
    ` "second":"<second most likely label from list, or empty>",`,
    ` "evidence":"<one short English sentence naming what you actually see>",`,
    ` "evidence_hi":"<wahi baat ek chhote Hindi vakya me, kisan ke liye saral bhasha>"}`,
  ].join('\n');
}

/* ---------------------------------------------------------------------------
 * Model ka jawab JSON me badalna — free models kabhi ```json fence laga dete hain,
 * kabhi aage-peeche text likh dete hain. Isliye defensive parsing.
 * ------------------------------------------------------------------------- */
function parseJsonish(text) {
  if (!text) return null;
  let t = String(text).trim();

  // ```json ... ``` fence hata do
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

  try { return JSON.parse(t); } catch (_) {}

  // Pehla { ... } block dhoondho
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(t.slice(start, end + 1)); } catch (_) {}
  }
  return null;
}

/** Model ne label thoda alag likh diya (case/space) to usse asli label se milao. */
function matchLabel(guess, labels) {
  if (!guess) return null;
  const g = String(guess).trim();
  if (!g) return null;
  if (/^unclear$/i.test(g)) return 'unclear';
  if (/^not[_\s-]?plant$/i.test(g)) return 'not_plant';
  if (/^wrong[_\s-]?crop$/i.test(g)) return 'wrong_crop';

  const exact = labels.find((l) => l === g);
  if (exact) return exact;

  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const gn = norm(g);
  const loose = labels.find((l) => norm(l) === gn);
  if (loose) return loose;

  // "Wheat Stripe Rust" jaisa jawab -> wheat_stripe_rust
  const partial = labels.find((l) => norm(l).includes(gn) || gn.includes(norm(l)));
  return partial || null;
}

async function callModel(model, apiKey, imageDataUrl, prompt, referer, budgetMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(),
                           Math.max(1500, Math.min(PER_MODEL_TIMEOUT_MS, budgetMs || PER_MODEL_TIMEOUT_MS)));

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer || process.env.PUBLIC_SITE_URL || 'https://vridhi-ai.netlify.app',
        'X-Title': 'Vridhi AI - Crop Disease Detection',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 700,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        }],
      }),
    });

    const bodyText = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, error: bodyText.slice(0, 300) };
    }

    let data;
    try { data = JSON.parse(bodyText); }
    catch (_) { return { ok: false, status: 502, error: 'bad_json_from_provider' }; }

    const msg = data && data.choices && data.choices[0] && data.choices[0].message;
    const content = msg && (typeof msg.content === 'string'
      ? msg.content
      : Array.isArray(msg.content)
        ? msg.content.map((c) => c && c.text).filter(Boolean).join('\n')
        : '');

    return { ok: true, content: content, usedModel: (data && data.model) || model };
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    return { ok: false, status: aborted ? 504 : 500, error: aborted ? 'timeout' : String(err && err.message) };
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(apiKey, imageDataUrl, prompt, budgetMs) {
  const match = imageDataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) return { ok: false, status: 400, error: 'bad_image' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_MODEL_TIMEOUT_MS);
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(apiKey), {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: match[1], data: match[2] } }] }] }),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 300) };
    const data = JSON.parse(text);
    const content = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join('\\n') || '';
    return { ok: true, content, usedModel: 'gemini-2.0-flash' };
  } catch (err) {
    return { ok: false, status: err?.name === 'AbortError' ? 504 : 500, error: String(err?.message || err) };
  } finally { clearTimeout(timer); }
}

/* ------------------------------------------------------------------------- */
const rateLimit = require('./_ratelimit');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  /* Yeh sabse mehnga raasta hai — har call ek vision model ko photo bhejta
     hai. Asli kisan ek ghante me 10-20 jaanch karta hai; 40 kaafi khuli
     seema hai. Ek hi gaon ke kai kisan ek hi network ke peeche ho sakte
     hain, isliye tang nahi rakha.
     GET (health check) par seema nahi — wo kuch kharch nahi karta. */
  if (req.method === 'POST') {
    const stop = await rateLimit.blocked(req, res, 'diagnose', 40, 3600,
      'इस समय बहुत सारी जाँचें आ गई हैं। थोड़ी देर बाद कोशिश कीजिए — ' +
      'फ़ोन पर होने वाली जाँच अभी भी चलती रहेगी।');
    if (stop) return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const apiKey = process.env.OPENROUTER_API_KEY;

  /* GET = health check. Key kabhi wapas nahi bhejte, sirf "lagi hai ya nahi". */
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      configured: Boolean(geminiKey || apiKey),
      /* Yahan pehle provider aur model ke asli naam jaate the. Client ko unki
         zaroorat nahi hai aur browser ka network tab koi bhi khol sakta hai,
         isliye ab sirf ginti bhejte hain. */
      engines: geminiKey ? 1 : models().length,
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  if (!geminiKey && !apiKey) {
    return res.status(503).json({
      ok: false,
      error: 'not_configured',
      /* Kisan ko dikhne wale sandesh me kisi bhi bahari service ka naam nahi
         jaata — wo hamara andaruni intezaam hai. Team ke liye asli wajah
         `error: 'not_configured'` field me hai. */
      messageHi: 'ऑनलाइन जाँच अभी चालू नहीं है। फ़ोन का अपना मॉडल काम करता रहेगा।',
      messageEn: 'Online checking is not enabled right now. The on-device model keeps working.',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'bad_body' });
  }

  const image = body.image;
  const crop = String(body.crop || 'crop').slice(0, 40);
  const labels = Array.isArray(body.labels)
    ? body.labels.filter((l) => typeof l === 'string').slice(0, 60)
    : [];
  const localTop = Array.isArray(body.localTop) ? body.localTop.slice(0, 3) : [];

  if (typeof image !== 'string' || !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(image)) {
    return res.status(400).json({ ok: false, error: 'bad_image' });
  }
  if (image.length > MAX_IMAGE_CHARS) {
    return res.status(413).json({ ok: false, error: 'image_too_large' });
  }
  if (!labels.length) {
    return res.status(400).json({ ok: false, error: 'no_labels' });
  }

  const prompt = buildPrompt(crop, labels, localTop);
  const referer = req.headers && req.headers.origin;
  const chain = models();
  const tried = [];
  const startedAt = Date.now();

  if (geminiKey && msLeft(startedAt) > 1500) {
    const out = await callGemini(geminiKey, image, prompt, msLeft(startedAt));
    tried.push(out.usedModel || 'gemini-2.0-flash');
    if (out.ok) {
      const parsed = parseJsonish(out.content);
      const label = parsed && matchLabel(parsed.label, labels);
      if (label) {
        const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7));
        const localLabel = (localTop[0] && localTop[0].label) || null;
        return res.status(200).json({ ok: true, label, confidence, second: matchLabel(parsed.second, labels) || '', evidence: String(parsed.evidence || '').slice(0, 400), evidenceHi: String(parsed.evidence_hi || '').slice(0, 400), agree: Boolean(localLabel && label === localLabel), localLabel, model: out.usedModel, tried });
      }
    }
  }

  for (let i = 0; apiKey && i < chain.length && tried.length < MAX_ATTEMPTS; i++) {
    /* Budget khatam — aage koshish karne ka matlab sirf itna hai ki
       function beech me mar jaye aur kisan ko 502 mile. Usse behtar hai
       abhi rukna: offline jawab uske paas pehle se hai. */
    if (msLeft(startedAt) < 1500) break;

    const model = chain[i];
    const out = await callModel(model, apiKey, image, prompt, referer, msLeft(startedAt));
    tried.push(model);

    if (!out.ok) {
      // 429 (rate limit) ya 5xx -> agla model try karo. 401/402 -> rukna hi behtar.
      if (out.status === 401 || out.status === 402 || out.status === 403) {
        return res.status(502).json({
          ok: false, error: 'auth_failed', detail: out.error, tried: tried,
          messageHi: 'ऑनलाइन जाँच अभी नहीं हो पा रही। फ़ोन का अपना मॉडल काम कर रहा है।',
          messageEn: 'Online checking is unavailable right now. The on-device model is being used.',
        });
      }
      continue;
    }

    const parsed = parseJsonish(out.content);
    if (!parsed) continue;                       // jawab samajh nahi aaya -> agla model

    const label = matchLabel(parsed.label, labels);
    if (!label) continue;                        // list se bahar ka label -> agla model

    let confidence = Number(parsed.confidence);
    if (!isFinite(confidence) || confidence < 0 || confidence > 1) confidence = 0.7;

    const localLabel = (localTop[0] && localTop[0].label) || null;

    return res.status(200).json({
      ok: true,
      label: label,                              // 'unclear' bhi ho sakta hai
      confidence: confidence,
      second: matchLabel(parsed.second, labels) || '',
      evidence: String(parsed.evidence || '').slice(0, 400),
      evidenceHi: String(parsed.evidence_hi || '').slice(0, 400),
      agree: Boolean(localLabel && label === localLabel),
      localLabel: localLabel,
      model: out.usedModel,
      tried: tried,
    });
  }

  return res.status(503).json({
    ok: false,
    error: 'all_models_failed',
    tried: tried,
    messageHi: 'ऑनलाइन AI अभी जवाब नहीं दे पाया (free model की सीमा या नेटवर्क)। ऑफ़लाइन नतीजा दिखाया गया है।',
    messageEn: 'The online AI could not answer right now (free-model rate limit or network). The offline result is shown instead.',
  });
};
