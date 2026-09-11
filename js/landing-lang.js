/* ============================================================================
 * KRASHI MITRA — landing page ki bhasha
 * js/landing-lang.js
 *
 * NIYAM (sirf landing page ke liye):
 *   - Landing HAMESHA हिन्दी me khulta hai, chahe phone ki bhasha kuch bhi ho.
 *     Wajah: yeh page kisan ke liye hai, aur zyadatar kisan Hindi padh lete hain.
 *     Device locale par chhodne se aksar English khul jaata tha.
 *   - Upar "हिंदी | English" ka toggle hai, jisse jab chahein badal sakte hain.
 *
 * ZAROORI FARQ: yeh sirf LOGIN SE PEHLE wale page par lagta hai.
 * Login ke baad har screen kisan ki apni chuni hui bhasha me chalti hai
 * (js/language-picker.js + js/i18n.js) — wahan yeh file kuch nahi karti.
 *
 * NAYA TEXT JODNA: HTML me  data-ll="key"  likh dein aur neeche TEXT me
 * dono bhashaon ka anuvaad daal dein. Key na mile to page ka apna text
 * jaisa hai waisa hi rehta hai — kuch tootta nahi.
 * ========================================================================= */

(function () {
  'use strict';

  const KEY = 'km.landingLang';          // 'hi' | 'en'

  const TEXT = {
    hi: {
      /* --- Navbar & Gov bar --- */
      'nav.home':'होम', 'nav.features':'सुविधाएँ', 'nav.how':'कैसे काम करता है',
      'nav.about':'हमारे बारे में', 'nav.contact':'संपर्क',
      'cta.start':'शुरू करें', 'cta.learn':'और जानें', 'cta.free':'मुफ़्त आज़माएँ',
      'gov.dept':'कृषि सहायता सेवा',
      'gov.sub':'किसानों के लिए फसल रोग पहचान एवं सलाह',
      'gov.helpline':'किसान कॉल सेंटर',
      'link.privacy':'निजता', 'link.terms':'शर्तें', 'link.admin':'विभाग लॉगिन',

      /* --- Hero --- */
      'hero.title':'आपकी फसल का साथी — रोग पहचानें, सही सलाह पाएँ',
      'hero.desc':'पत्ती की एक फोटो से रोग पहचानिए, इलाज की सलाह लीजिए, मौसम और मंडी भाव देखिए — ज़्यादातर काम बिना इंटरनेट के।',
      'float.label':'AI विश्लेषण',
      'float.value':'स्वस्थ फसल',

      /* --- Trust bar --- */
      'trust.ai.title':'AI संचालित',
      'trust.ai.desc':'सटीक पहचान के लिए उन्नत AI मॉडल',
      'trust.instant.title':'तुरंत नतीजे',
      'trust.instant.desc':'तुरंत जाँच करें और उपाय पाएँ',
      'trust.expert.title':'विशेषज्ञ सलाह',
      'trust.expert.desc':'आपकी फसल के लिए व्यक्तिगत सलाह',
      'trust.yield.title':'बेहतर उपज',
      'trust.yield.desc':'उत्पादकता और मुनाफ़ा बढ़ाएँ',

      /* --- Features section --- */
      'feat.heading':'आधुनिक किसानों के लिए शक्तिशाली सुविधाएँ',
      'feat.subheading':'फसल की सुरक्षा और बेहतर उपज के लिए सब कुछ एक जगह।',
      'feat.scan.title':'स्कैन और पहचानें',
      'feat.scan.desc':'प्रभावित पौधे की फोटो अपलोड करें और रोग या कीट की पहचान करें।',
      'feat.advisory.title':'स्मार्ट सलाह',
      'feat.advisory.desc':'AI की मदद से इलाज और उपचार की सिफ़ारिशें पाएँ।',
      'feat.monitor.title':'खेत की निगरानी',
      'feat.monitor.desc':'अपने खेतों की निगरानी करें, रिकॉर्ड रखें और फसल की सेहत जाँचें।',
      'feat.weather.title':'मौसम और चेतावनी',
      'feat.weather.desc':'मौसम का पूर्वानुमान और ज़रूरी सूचनाएँ पाएँ।',

      /* --- AI section --- */
      'ai.heading':'AI जो आपकी फसल समझे',
      'ai.desc':'हमारा उन्नत AI फोटो और डेटा का विश्लेषण करके आपकी भाषा में सटीक जानकारी और व्यावहारिक सलाह देता है।',

      /* --- Footer --- */
      'footer.tagline':'आपकी फसल का स्मार्ट AI साथी।',
      'footer.product':'उत्पाद',
      'footer.features':'सुविधाएँ',
      'footer.howworks':'कैसे काम करता है',
      'footer.pricing':'मूल्य',
      'footer.resources':'संसाधन',
      'footer.cropguide':'फसल गाइड',
      'footer.pestlib':'कीट पुस्तकालय',
      'footer.blog':'ब्लॉग',
      'footer.company':'कंपनी',
      'footer.about':'हमारे बारे में',
      'footer.contact':'संपर्क',
      'footer.privacy':'गोपनीयता नीति',
      'footer.copy':'© 2026 कृषि मित्र। सर्वाधिकार सुरक्षित।',

      /* --- Disclaimer --- */
      'disclaimer':'<strong>ज़रूरी सूचना:</strong> कृषि मित्र एक <strong>स्वतंत्र विद्यार्थी परियोजना</strong> है (Smart India Hackathon)। यह भारत सरकार या किसी सरकारी विभाग का आधिकारिक ऐप <strong>नहीं</strong> है और न ही इसे सरकार की मान्यता प्राप्त है। यहाँ दी गई रोग पहचान और दवा की सलाह केवल मार्गदर्शन के लिए है — किसी भी छिड़काव से पहले अपने <strong>कृषि विज्ञान केंद्र (KVK)</strong> या कृषि अधिकारी से दवा और मात्रा की पुष्टि अवश्य करें।',
    },
    en: {
      /* --- Navbar & Gov bar --- */
      'nav.home':'Home', 'nav.features':'Features', 'nav.how':'How It Works',
      'nav.about':'About Us', 'nav.contact':'Contact',
      'cta.start':'Get Started', 'cta.learn':'Learn More', 'cta.free':'Try Now for Free',
      'gov.dept':'Crop Advisory Service',
      'gov.sub':'Crop disease detection and advisory for farmers',
      'gov.helpline':'Kisan Call Centre',
      'link.privacy':'Privacy', 'link.terms':'Terms', 'link.admin':'Department Login',

      /* --- Hero --- */
      'hero.title':'Your smart companion for healthier crops',
      'hero.desc':'Detect crop disease from a single leaf photo, get treatment advice, and check weather and mandi prices — most of it works without internet.',
      'float.label':'AI Analysis',
      'float.value':'Healthy Crop',

      /* --- Trust bar --- */
      'trust.ai.title':'AI Powered',
      'trust.ai.desc':'Advanced AI models for accurate detection',
      'trust.instant.title':'Instant Results',
      'trust.instant.desc':'Get real-time results and solutions',
      'trust.expert.title':'Expert Advice',
      'trust.expert.desc':'Personalized advisory for your crops',
      'trust.yield.title':'Better Yields',
      'trust.yield.desc':'Improve productivity and profitability',

      /* --- Features section --- */
      'feat.heading':'Powerful features for modern farmers',
      'feat.subheading':'Everything you need to protect your crops and grow better.',
      'feat.scan.title':'Scan & Detect',
      'feat.scan.desc':'Upload image of affected plant part and detect diseases or pests.',
      'feat.advisory.title':'Smart Advisory',
      'feat.advisory.desc':'Get AI-powered recommendations and treatment solutions.',
      'feat.monitor.title':'Field Monitoring',
      'feat.monitor.desc':'Monitor your fields, keep records and track crop health.',
      'feat.weather.title':'Weather & Alerts',
      'feat.weather.desc':'Stay updated with weather forecast and important alerts.',

      /* --- AI section --- */
      'ai.heading':'AI that understands your crops',
      'ai.desc':'Our advanced AI analyzes images and data to provide accurate insights and actionable advice in your language.',

      /* --- Footer --- */
      'footer.tagline':'Your smart AI companion for healthier crops.',
      'footer.product':'Product',
      'footer.features':'Features',
      'footer.howworks':'How It Works',
      'footer.pricing':'Pricing',
      'footer.resources':'Resources',
      'footer.cropguide':'Crop Guide',
      'footer.pestlib':'Pest Library',
      'footer.blog':'Blog',
      'footer.company':'Company',
      'footer.about':'About Us',
      'footer.contact':'Contact',
      'footer.privacy':'Privacy Policy',
      'footer.copy':'© 2026 Krashi Mitra. All rights reserved.',

      /* --- Disclaimer --- */
      'disclaimer':'<strong>Important Notice:</strong> Krashi Mitra is an <strong>independent student project</strong> (Smart India Hackathon). It is <strong>not</strong> an official app of the Government of India or any government department, nor is it endorsed by the government. The disease identification and treatment advice provided here is for guidance only — always confirm the medicine and dosage with your <strong>Krishi Vigyan Kendra (KVK)</strong> or agriculture officer before spraying.',
    },
  };

  function current() {
    try { const v = localStorage.getItem(KEY); if (v === 'hi' || v === 'en') return v; }
    catch (_) {}
    return 'hi';                          // DEFAULT हिन्दी — device ki bhasha se matlab nahi
  }

  function apply(lang) {
    const t = TEXT[lang] || TEXT.hi;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-ll]').forEach((el) => {
      const key = el.getAttribute('data-ll');
      const v = t[key];
      if (v == null) return;              // anuvaad nahi hai to page ka apna text rehne do
      /* disclaimer me HTML (<strong>) hai — uske liye innerHTML chahiye */
      if (key === 'disclaimer') { el.innerHTML = v; }
      else { el.textContent = v; }
    });

    document.querySelectorAll('.ll-switch__btn').forEach((b) => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    try { localStorage.setItem(KEY, lang); } catch (_) {}
  }

  function init() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('.ll-switch__btn');
      if (!b) return;
      e.preventDefault();
      apply(b.dataset.lang);
    });
    apply(current());
  }

  window.kmLandingLang = { apply, current, TEXT };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
