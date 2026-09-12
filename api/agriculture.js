'use strict';

/* ============================================================================
 * VRIDHI AI — sahayak ka jawab (general-purpose assistant)
 * api/agriculture.js
 *
 * PEHLE KYA THA
 *   Ek regex (ALLOWED) tha. Sawal me "fasal / rog / mandi" jaise shabd na hon
 *   to seedha 400 aur "Vridhi AI sirf kheti ke sawal leta hai" ka jawab.
 *   Kisan "mera naam kya hai", "kal chhutti hai kya", "ye number kaise jodun"
 *   poochhta to app use thukra deti thi — aur wo maan leta ki app tooti hai.
 *
 * AB KYA HAI
 *   Sahayak har tarah ke sawal ka jawab deta hai — kheti uski visheshagyata
 *   hai, uski deewar nahi. Uttar kisan ki chuni hui bhasha me aata hai aur
 *   uska naam pata ho to naam se baat hoti hai.
 *
 * DAWA KI MATRA PAR SAKHTI (ye jaan-boojhkar hai)
 *   System prompt model ko saaf mana karta hai ki wo apne mann se kisi dawa
 *   ki MATRA na bataye. Galat matra = fasal bhi gayi aur kisan ki sehat bhi.
 *   Model ko kaha gaya hai: dabbe ka label padhne aur KVK / krishi adhikari
 *   se poochhne ko kaho.
 *
 * KEY NA HO / NET NA CHALE
 *   Tab bhi 200 hi lautega — sthaniya (offline) gyaan ka jawab, aur
 *   `source:'local'`. App kabhi khaali haath nahi rehti.
 * ========================================================================= */

const { fertilizerRecommendation } = require('../lib/fertilizer');
const cultivationTips = require('../data/cultivation-tips.json');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 20000;

const MODELS = (process.env.OPENROUTER_MODELS || '')
  .split(',').map(s => s.trim()).filter(Boolean);
const DEFAULT_MODELS = [
  'google/gemma-4-31b-it:free',
  'thinkingmachines/inkling-small:free',
  'openrouter/free',
];

/* Bhasha ka code -> model ko batane wala naam. */
const LANG_NAME = {
  'hi-IN': 'Hindi (Devanagari)', 'en-IN': 'Indian English', 'mr-IN': 'Marathi',
  'gu-IN': 'Gujarati', 'pa-IN': 'Punjabi (Gurmukhi)', 'bn-IN': 'Bengali',
  'ta-IN': 'Tamil', 'te-IN': 'Telugu', 'kn-IN': 'Kannada', 'ml-IN': 'Malayalam',
  'or-IN': 'Odia', 'ur-IN': 'Urdu', 'as-IN': 'Assamese', 'ne-IN': 'Nepali',
  'kok-IN': 'Konkani', 'mai-IN': 'Maithili', 'sat-IN': 'Santali',
  'doi-IN': 'Dogri', 'brx-IN': 'Bodo', 'ks-IN': 'Kashmiri',
  'mni-IN': 'Manipuri', 'sd-IN': 'Sindhi', 'sa-IN': 'Sanskrit',
};

function systemPrompt(ctx) {
  const lang = LANG_NAME[ctx.lang] || 'Hindi (Devanagari)';
  const who = ctx.name ? `The farmer's name is ${ctx.name}. Address them by name, warmly.` : '';
  const where = [ctx.crop && `current crop: ${ctx.crop}`,
                 ctx.district && `district: ${ctx.district}`,
                 ctx.state && `state: ${ctx.state}`].filter(Boolean).join(', ');

  return [
    'You are Vridhi AI, a helpful assistant used by farmers in India.',
    'You are a GENERAL assistant: answer whatever is asked — farming, weather,',
    'government schemes, phone help, maths, health basics, or plain conversation.',
    'Farming is your strongest subject, not a restriction on what you may answer.',
    '',
    `Reply ONLY in ${lang}. Never mix in another language or script,`,
    'except for numbers and untranslatable proper nouns.',
    who,
    where ? `Context — ${where}.` : '',
    '',
    'Style: short, plain sentences. No jargon, no markdown, no bullet symbols.',
    'Imagine speaking aloud to someone standing in a field — this is read out by text-to-speech.',
    'Keep it under about 90 words unless more detail is genuinely needed.',
    '',
    'HARD RULES:',
    '1. NEVER state a pesticide/fungicide/herbicide dose, concentration or mixing',
    '   ratio from memory. Say to read the product label and confirm with the',
    '   local KVK or agriculture officer. This is non-negotiable — a wrong dose',
    '   ruins a crop and harms the person spraying it.',
    '2. Never give a medical diagnosis or prescription. Point to a doctor or',
    '   the 104 health helpline.',
    '3. Do not invent mandi prices, scheme amounts, or deadlines. If unsure, say',
    '   so and name where to check (eNAM, Agmarknet, pmkisan.gov.in).',
    '4. Do not mention which AI provider or model you are.',
  ].filter(Boolean).join('\n');
}

/* Net/key na ho to yahi. Kabhi khaali nahi lautta. */
function localAnswer(query, ctx) {
  const t = String(query || '').toLowerCase();
  const hi = [
    [/मौसम|weather|बारिश|rain|छिड़काव|spray/, 'बारिश की संभावना हो तो छिड़काव न करें। पत्तियाँ सूखी हों और कम से कम छह घंटे बारिश न हो, तभी लेबल के अनुसार छिड़काव करें।'],
    [/भाव|price|मंडी|mandi|rate/, 'ताज़ा मंडी भाव देखने के लिए मंडी सेक्शन में जाएँ, जहाँ आधिकारिक Agmarknet स्रोत से आज के भाव मिलते हैं।'],
    [/खाद|fertilizer|यूरिया|urea|dap|डीआप/, 'खाद की मात्रा मिट्टी जाँच और फसल की अवस्था के अनुसार रखें। सूखी मिट्टी पर ज़्यादा यूरिया न डालें।'],
    [/दवा|pesticide|कीटनाशक|medicine|कीड़ा|रोग|कीट/, 'दवा हमेशा डिब्बे के लेबल के अनुसार ही मिलाएँ। दस्ताने और मास्क पहनें, हवा की उल्टी दिशा में छिड़काव न करें। मात्रा कृषि अधिकारी से पक्की कर लें।'],
    [/नमस्ते|hello|hi|मदद|help/, 'नमस्ते! मैं खेती, मौसम, मंडी, सरकारी योजना — या कोई भी और सवाल — में मदद कर सकता हूँ।'],
    [/पानी|सिंचाई|irrigation/, 'फसल में आवश्यकतानुसार ही पानी दें। फूल आने और दाना भरते समय नमी बनाए रखना सबसे ज़रूरी होता है।'],
    [/बीज|seed|बुवाई|sowing/, 'बुवाई से पहले बीज उपचार अवश्य करें। प्रमाणित बीजों का ही प्रयोग करें ताकि रोग का खतरा कम रहे।'],
  ];
  const hit = hi.find(([re]) => re.test(t));
  if (hit) return hit[1];
  return (ctx.name ? ctx.name + ' जी, ' : '') +
    'मैं फसल, रोग, खाद, मौसम, मंडी भाव और खेती से जुड़े सवालों में आपकी पूरी मदद कर सकता हूँ। कृपया अपना सवाल पूछिए।';
}

async function ask(model, apiKey, sys, question, referer) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: ctl.signal,
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer || process.env.PUBLIC_SITE_URL || 'https://vridhi-ai.netlify.app',
        'X-Title': 'Vridhi AI',
      },
      body: JSON.stringify({
        model, max_tokens: 400, temperature: 0.4,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: question },
        ],
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const m = data && data.choices && data.choices[0] && data.choices[0].message;
    const text = m && (typeof m.content === 'string' ? m.content
      : Array.isArray(m.content) ? m.content.map(c => c && c.text).filter(Boolean).join('\n') : '');
    return (text || '').trim() || null;
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const rateLimit = require('./_ratelimit');

module.exports = async function handler(req, res) {
  /* Sahayak se baat-cheet hoti hai, isliye seema thodi badi — 60 sawal
     ek ghante me. Utne me koi bhi asli baat-cheet poori ho jaati hai. */
  const stop = await rateLimit.blocked(req, res, 'ask', 60, 3600,
    'अभी बहुत सारे सवाल आ गए हैं। थोड़ी देर बाद दोबारा पूछिए।');
  if (stop) return;

  const q = req.method === 'POST' ? (req.body || {}) : (req.query || {});
  const query = String(q.q || '').trim();
  if (!query) return res.status(400).json({ message: 'Sawal khaali hai.' });
  if (query.length > 1000) return res.status(400).json({ message: 'Sawal bahut lamba hai.' });

  const ctx = {
    name:     String(q.name || '').slice(0, 60),
    lang:     String(q.lang || 'hi-IN'),
    crop:     String(q.crop || ''),
    state:    String(q.state || ''),
    district: String(q.district || ''),
  };

  /* Kheti se juda ho to saath me sthaniya salah bhi bhej dete hain. */
  const fertilizer = ctx.crop ? (() => {
    try { return fertilizerRecommendation(ctx.crop, Number(q.plotSize || 1), String(q.unit || 'acre')); }
    catch (_) { return null; }
  })() : null;
  const tips = cultivationTips[ctx.crop.toLowerCase()] || null;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (apiKey) {
    const list = MODELS.length ? MODELS : DEFAULT_MODELS;
    const sys = systemPrompt(ctx);
    const referer = req.headers && req.headers.referer;
    for (const model of list.slice(0, 2)) {
      const answer = await ask(model, apiKey, sys, query, referer);
      if (answer) {
        return res.status(200).json({
          answer, tips, fertilizer, source: 'assistant',
          checkedAt: new Date().toISOString(), stale: false,
        });
      }
    }
  }

  return res.status(200).json({
    answer: localAnswer(query, ctx), tips, fertilizer, source: 'local',
    checkedAt: new Date().toISOString(), stale: true,
  });
};
