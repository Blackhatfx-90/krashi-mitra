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
      'nav.home':'होम', 'nav.features':'सुविधाएँ', 'nav.how':'कैसे काम करता है',
      'nav.about':'हमारे बारे में', 'nav.contact':'संपर्क',
      'cta.start':'शुरू करें', 'cta.learn':'और जानें', 'cta.free':'मुफ़्त आज़माएँ',
      'hero.title':'आपकी फसल का साथी — रोग पहचानें, सही सलाह पाएँ',
      'hero.desc':'पत्ती की एक फोटो से रोग पहचानिए, इलाज की सलाह लीजिए, मौसम और मंडी भाव देखिए — ज़्यादातर काम बिना इंटरनेट के।',
      'gov.dept':'कृषि सहायता सेवा',
      'gov.sub':'किसानों के लिए फसल रोग पहचान एवं सलाह',
      'gov.helpline':'किसान कॉल सेंटर',
      'link.privacy':'निजता', 'link.terms':'शर्तें', 'link.admin':'विभाग लॉगिन',
    },
    en: {
      'nav.home':'Home', 'nav.features':'Features', 'nav.how':'How It Works',
      'nav.about':'About Us', 'nav.contact':'Contact',
      'cta.start':'Get Started', 'cta.learn':'Learn More', 'cta.free':'Try Now for Free',
      'hero.title':'Your smart companion for healthier crops',
      'hero.desc':'Detect crop disease from a single leaf photo, get treatment advice, and check weather and mandi prices — most of it works without internet.',
      'gov.dept':'Crop Advisory Service',
      'gov.sub':'Crop disease detection and advisory for farmers',
      'gov.helpline':'Kisan Call Centre',
      'link.privacy':'Privacy', 'link.terms':'Terms', 'link.admin':'Department Login',
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
      const v = t[el.getAttribute('data-ll')];
      if (v == null) return;              // anuvaad nahi hai to page ka apna text rehne do
      el.textContent = v;
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
