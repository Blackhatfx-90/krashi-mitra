'use strict';

const ALLOWED = /crop|फसल|disease|रोग|pest|कीट|pesticide|दवा|medicine|मौसम|weather|rain|बारिश|mandi|मंडी|price|भाव|rate|रेट|fertilizer|खाद|soil|मिट्टी/i;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Only GET is supported.' });
  const query = String(req.query?.q || '').trim();
  if (!query || !ALLOWED.test(query)) return res.status(400).json({ message: 'Krashi Mitra केवल खेती, फसल, मौसम और मंडी से जुड़े सवालों में मदद करता है।' });
  const crop = String(req.query?.crop || '');
  const state = String(req.query?.state || '');
  const district = String(req.query?.district || '');
  const mandi = String(req.query?.mandi || '');
  const context = [crop && `crop: ${crop}`, state && `state: ${state}`, district && `district: ${district}`, mandi && `mandi: ${mandi}`].filter(Boolean).join(', ');
  const answer = 'ऑनलाइन कृषि स्रोत उपलब्ध होने पर ' + (context ? context + ' के लिए ' : '') + 'ताज़ा मौसम और मंडी जानकारी यहाँ दिखाई जाएगी। अभी स्थानीय कृषि विभाग या eNAM/Agmarknet पर भी यही जानकारी सत्यापित करें।';
  return res.status(200).json({ answer, source: 'official-source-fallback', checkedAt: new Date().toISOString(), stale: false });
};
