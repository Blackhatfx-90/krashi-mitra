/* ============================================================================
 * VRIDHI AI — landing page ki bhasha
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
      'hero.title':'Vridhi AI — आपकी फसल का साथी, रोग पहचानें और सही सलाह पाएँ',
      'hero.desc':'Vridhi AI (वृद्धि AI) भारत भर के किसानों के लिए मुफ़्त AI ऐप है। पत्ती की एक फोटो से फसल का रोग पहचानिए, खाद और इलाज की सलाह लीजिए, मौसम की चेतावनी और मंडी भाव देखिए — ज़्यादातर काम बिना इंटरनेट के।',
      'faq.title':'आम सवाल',
      'faq.sub':'Vridhi AI (वृद्धि AI) के बारे में जो सबसे ज़्यादा पूछा जाता है',
      'faq.q1':'Vridhi AI क्या है?',
      'faq.a1':'Vridhi AI (जिसे Vridhi AI भी लिखा जाता है) एक मुफ़्त AI ऐप है जो भारत के किसानों की मदद करती है — पत्ती की फोटो से रोग पहचानना, खाद की सलाह, और मौसम की चेतावनी — सब अपनी भाषा में।',
      'faq.q2':'क्या Vridhi AI हिंदी में है?',
      'faq.a2':'हाँ। Vridhi AI पूरी तरह हिंदी में चलती है, और बंगाली, मराठी, तेलुगु, तमिल, गुजराती, कन्नड़, मलयालम, पंजाबी व ओड़िया में भी। सलाह बोलकर भी सुनाई जाती है, ताकि पढ़ना न आता हो तो भी काम चले।',
      'faq.q3':'क्या Vridhi AI मुफ़्त है?',
      'faq.a3':'हाँ, पूरी तरह मुफ़्त। कोई शुल्क नहीं, कोई सदस्यता नहीं, किसी सुविधा के लिए पैसे नहीं। मॉडल एक बार डाउनलोड करने में डेटा लगता है — उसके बाद जाँच आपके फ़ोन पर ही होती है और डेटा नहीं लगता।',
      'faq.q4':'Vridhi AI रोग कैसे पहचानती है?',
      'faq.a4':'किसान प्रभावित पत्ती की फोटो खींचता या चुनता है, और Vridhi AI का AI उसे देखकर रोग बताता है और इलाज सुझाता है। ऐप पहले यह जाँचती है कि फोटो सच में उसी फसल की पत्ती की है — ताकि किसी और फोटो पर गलत रोग का नाम न आ जाए।',
      'faq.q5':'क्या Vridhi AI बिना इंटरनेट चलती है?',
      'faq.a5':'हाँ। एक बार वाई-फ़ाई पर अपनी फसल का मॉडल उतार लें, फिर रोग की जाँच, इलाज की सलाह, खाद का हिसाब, फसल कैलेंडर और आवाज़ — सब बिना इंटरनेट चलते हैं। सिर्फ़ मौसम, मंडी भाव, किसान चौपाल और ऑनलाइन दूसरी राय के लिए नेटवर्क चाहिए।',
      'faq.more1':'रोग पहचान कैसे काम करती है →',
      'faq.more2':'खाद की सलाह कैसे बनती है →',
      'faq.more3':'हिंदी आवाज़ सहायक →',
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
      'footer.copy':'© 2026 वृद्धि AI। सर्वाधिकार सुरक्षित।',

      /* --- Disclaimer --- */
      'disclaimer':'<strong>ज़रूरी सूचना:</strong> वृद्धि AI एक <strong>स्वतंत्र विद्यार्थी परियोजना</strong> है (Smart India Hackathon)। यह भारत सरकार या किसी सरकारी विभाग का आधिकारिक ऐप <strong>नहीं</strong> है और न ही इसे सरकार की मान्यता प्राप्त है। यहाँ दी गई रोग पहचान और दवा की सलाह केवल मार्गदर्शन के लिए है — किसी भी छिड़काव से पहले अपने <strong>कृषि विज्ञान केंद्र (KVK)</strong> या कृषि अधिकारी से दवा और मात्रा की पुष्टि अवश्य करें।',
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
      'hero.title':'Vridhi AI — AI farming assistant for Indian farmers',
      'hero.desc':'Vridhi AI (also written Vridhi AI) is a free AI app for farmers across all India. Detect crop disease from a single leaf photo, get fertilizer and treatment advice, and check weather warnings and mandi prices — most of it works without internet.',
      'faq.title':'Common questions',
      'faq.sub':'What people most often ask about Vridhi AI',
      'faq.q1':'What is Vridhi AI?',
      'faq.a1':'Vridhi AI (also written as Vridhi AI) is a free AI-powered assistant app that helps Indian farmers detect crop diseases from photos, get fertilizer recommendations, and receive weather updates — all in their own language.',
      'faq.q2':'Is Vridhi AI available in Hindi?',
      'faq.a2':'Yes. Vridhi AI works fully in Hindi and in other Indian languages including Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi and Odia, with voice support that reads advice aloud.',
      'faq.q3':'Is Vridhi AI free to use?',
      'faq.a3':'Yes, Vridhi AI is completely free. There is no subscription, no paid plan and no charge for any feature. Downloading the crop models uses your data once, after which disease detection runs on your phone without using data.',
      'faq.q4':'How does Vridhi AI detect crop disease?',
      'faq.a4':"Farmers take or upload a photo of the affected leaf, and Vridhi AI's AI analyses it to identify the disease and suggest treatment. The app first checks that the photo really shows a leaf of the selected crop, so an unrelated photo is not given a wrong disease name.",
      'faq.q5':'Does Vridhi AI work offline?',
      'faq.a5':"Yes. Once you download your crop's model over Wi-Fi, disease detection, treatment advice, the fertilizer calculator, the crop calendar and voice readout all work with no internet. Only weather, mandi prices, the farmer community and the online second opinion need a network.",
      'faq.more1':'How disease detection works →',
      'faq.more2':'How fertilizer advice is calculated →',
      'faq.more3':'Hindi voice assistant →',
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
      'footer.copy':'© 2026 Vridhi AI. All rights reserved.',

      /* --- Disclaimer --- */
      'disclaimer':'<strong>Important Notice:</strong> Vridhi AI is an <strong>independent student project</strong> (Smart India Hackathon). It is <strong>not</strong> an official app of the Government of India or any government department, nor is it endorsed by the government. The disease identification and treatment advice provided here is for guidance only — always confirm the medicine and dosage with your <strong>Krishi Vigyan Kendra (KVK)</strong> or agriculture officer before spraying.',
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
