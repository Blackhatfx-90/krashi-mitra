(function () {
  'use strict';

  const LANGUAGES = [
    ['hi-IN','हिन्दी','Hindi'],['as-IN','অসমীয়া','Assamese'],['bn-IN','বাংলা','Bengali'],['brx-IN','बड़ो','Bodo'],['doi-IN','डोगरी','Dogri'],['gu-IN','ગુજરાતી','Gujarati'],['kn-IN','ಕನ್ನಡ','Kannada'],['ks-IN','कश्मीरी','Kashmiri'],['kok-IN','कोंकणी','Konkani'],['mai-IN','मैथिली','Maithili'],['ml-IN','മലയാളം','Malayalam'],['mni-IN','মৈতৈলোন্','Manipuri'],['mr-IN','मराठी','Marathi'],['ne-IN','नेपाली','Nepali'],['or-IN','ଓଡ଼ିଆ','Odia'],['pa-IN','ਪੰਜਾਬੀ','Punjabi'],['sa-IN','संस्कृतम्','Sanskrit'],['sat-IN','संताली','Santali'],['sd-IN','سنڌي','Sindhi'],['ta-IN','தமிழ்','Tamil'],['te-IN','తెలుగు','Telugu'],['ur-IN','اردو','Urdu']
  ].map(([code,native,english]) => ({ code, native, english }));

  const LOCATIONS = {
    'Uttar Pradesh': ['Lucknow Mandi','Kanpur Mandi','Agra Mandi'],
    Maharashtra: ['Lasalgaon Mandi','Pune Mandi','Nagpur Mandi'],
    Punjab: ['Ludhiana Mandi','Amritsar Mandi','Patiala Mandi'],
    Haryana: ['Karnal Mandi','Hisar Mandi','Gurugram Mandi'],
    Gujarat: ['Unjha Mandi','Rajkot Mandi','Ahmedabad Mandi'],
    Rajasthan: ['Kota Mandi','Jaipur Mandi','Jodhpur Mandi'],
    Karnataka: ['Bengaluru Mandi','Hubballi Mandi','Mysuru Mandi'],
    'West Bengal': ['Kolkata Mandi','Burdwan Mandi','Siliguri Mandi']
  };

  const KNOWLEDGE = [
    { words:['मौसम','weather','बारिश','rain','spray','छिड़काव'], answer:'बारिश की संभावना में दवा का छिड़काव न करें। पत्तियाँ सूखी हों और कम से कम 6 घंटे बारिश न हो, तभी लेबल के अनुसार छिड़काव करें।' },
    { words:['कपास','cotton','pink bollworm','गुलाबी सुंडी'], answer:'कपास में गुलाबी सुंडी के लिए खेत की निगरानी करें, प्रभावित टिंडे हटाएँ और केवल पंजीकृत दवा को लेबल की मात्रा में इस्तेमाल करें।' },
    { words:['धान','rice','blast','झुलसा'], answer:'धान में झुलसा दिखे तो खेत में अधिक नमी न रखें, संक्रमित पत्तियों की जाँच कर कृषि अधिकारी की सलाह से पंजीकृत फफूंदनाशक लें।' },
    { words:['गेहूं','wheat','रस्ट','रतुआ'], answer:'गेहूँ में पीले या भूरे रतुआ के लक्षण पर खेत की नियमित निगरानी करें। दवा की मात्रा हमेशा उत्पाद के लेबल और स्थानीय कृषि सलाह के अनुसार रखें।' },
    { words:['कीटनाशक','pesticide','दवा','medicine','सुरक्षा','safety'], answer:'कीटनाशक को लेबल के अनुसार ही मिलाएँ। दस्ताने और मास्क पहनें, हवा की दिशा के विपरीत छिड़काव न करें और खाली डिब्बे दोबारा उपयोग न करें।' },
    { words:['खाद','fertilizer','urea','यूरिया'], answer:'खाद की मात्रा मिट्टी जाँच और फसल की अवस्था के अनुसार रखें। यूरिया को सूखी मिट्टी पर अधिक मात्रा में न डालें और सिंचाई से पहले कृषि सलाह लें।' },
    { words:['भाव','price','मंडी','mandi','rate','रेट'], answer:'मंडी भाव बताने के लिए फसल, राज्य, जिला और चुनी हुई मंडी चाहिए। इंटरनेट उपलब्ध होने पर Krashi Mitra आधिकारिक स्रोत से ताज़ा भाव लाएगा; ऑफलाइन में आखिरी सेव डेटा दिखेगा।' },
    { words:['नमस्ते','hello','help','मदद','क्या कर सकते'], answer:'मैं फसल, रोग, कीट, दवा-सुरक्षा, मौसम, मंडी भाव और खेती की देखभाल से जुड़े सवालों में मदद कर सकता हूँ।' }
  ];

  function getPrefs() { try { return JSON.parse(localStorage.getItem('km.preferences.v1') || '{}'); } catch (_) { return {}; } }
  function savePrefs(prefs) { try { localStorage.setItem('km.preferences.v1', JSON.stringify(prefs)); } catch (_) {} }
  function language() { const p = getPrefs(); return LANGUAGES.find(l => l.code === p.language) || LANGUAGES[0]; }
  function speak(text) {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language().code;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
  function offlineAnswer(query) {
    const text = String(query || '').toLowerCase();
    const hit = KNOWLEDGE.find(item => item.words.some(word => text.includes(word.toLowerCase())));
    return hit ? hit.answer : 'यह सवाल अभी मेरे कृषि ज्ञान क्षेत्र में नहीं है। कृपया फसल, रोग, कीट, दवा, मौसम, मंडी भाव या खेती की देखभाल से जुड़ा सवाल पूछें।';
  }
  function officialFallback(query) {
    const p = getPrefs();
    const url = '/api/agriculture?q=' + encodeURIComponent(query) + '&crop=' + encodeURIComponent(p.crop || '') + '&state=' + encodeURIComponent(p.state || '') + '&district=' + encodeURIComponent(p.district || '') + '&mandi=' + encodeURIComponent(p.mandi || '');
    return fetch(url).then(r => r.ok ? r.json() : Promise.reject(new Error('offline'))).then(data => data.answer || data.message).catch(() => offlineAnswer(query));
  }

  window.KrashiMitraOffline = { LANGUAGES, LOCATIONS, getPrefs, savePrefs, language, speak, offlineAnswer, officialFallback };

  function addOnboarding() {
    const form = document.getElementById('signup-form');
    if (!form || document.getElementById('km-onboarding')) return;
    const box = document.createElement('fieldset');
    box.id = 'km-onboarding'; box.className = 'km-onboarding';
    box.innerHTML = '<legend>अपनी भाषा और मंडी चुनें</legend><label>भाषा / Language<select id="km-language"></select></label><label>राज्य / State<select id="km-state"><option value="">राज्य चुनें</option></select></label><label>जिला / District<input id="km-district" placeholder="जिला लिखें" required></label><label>पसंदीदा मंडी / Mandi<select id="km-mandi"><option value="">पहले राज्य चुनें</option></select></label><p class="km-onboarding__hint">ये जानकारी मौसम, मंडी भाव और आपकी भाषा की आवाज़ के लिए उपयोग होगी।</p>';
    form.insertBefore(box, form.firstChild);
    const lang = box.querySelector('#km-language'); LANGUAGES.forEach(l => { const o = document.createElement('option'); o.value = l.code; o.textContent = l.native + ' / ' + l.english; lang.appendChild(o); });
    const state = box.querySelector('#km-state'); Object.keys(LOCATIONS).forEach(name => { const o = document.createElement('option'); o.value = name; o.textContent = name; state.appendChild(o); });
    const mandi = box.querySelector('#km-mandi'); state.addEventListener('change', () => { mandi.innerHTML = '<option value="">मंडी चुनें</option>'; (LOCATIONS[state.value] || []).forEach(name => { const o=document.createElement('option'); o.value=name; o.textContent=name; mandi.appendChild(o); }); });
    const existing = getPrefs(); if (existing.language) lang.value=existing.language; if (existing.state) { state.value=existing.state; state.dispatchEvent(new Event('change')); } if(existing.mandi) mandi.value=existing.mandi; if(existing.district) box.querySelector('#km-district').value=existing.district;
    form.addEventListener('submit', () => savePrefs({ ...getPrefs(), language: lang.value, state: state.value, district: box.querySelector('#km-district').value.trim(), mandi: mandi.value }), { capture: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addOnboarding); else addOnboarding();
})();

window.addEventListener('online', () => document.documentElement.dataset.connection = 'online');
window.addEventListener('offline', () => document.documentElement.dataset.connection = 'offline');
