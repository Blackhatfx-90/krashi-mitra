/* ============================================================================
 * KRASHI MITRA — hukm ke shabd, har bhasha me
 * js/voice-commands-lang.js
 *
 * SAMASYA: js/voice-assistant.js ka COMMANDS table sirf Hindi (aur Hinglish)
 * ke shabd jaanta tha. Kisan ne Marathi chuni aur bola "फोटो काढ" — app
 * samajh hi nahi paata tha.
 *
 * HAL: yahan har bhasha ke apne shabd rakhe hain. voice-assistant.js in
 * shabdon ko apne table me JOD leta hai (badalta nahi) — matlab Hindi ke
 * shabd hamesha kaam karte rehte hain, aur chuni hui bhasha ke shabd bhi
 * chal jaate hain. Kisan aksar do bhashayein mila kar bolta hai, isliye
 * dono ka chalna hi sahi hai.
 *
 * NAYA SHABD JODNA
 *   Neeche apni bhasha ke block me us hukm ki list me shabd jod dein.
 *   Hukm ki ID wahi rakhein jo voice-assistant.js me hai:
 *     stop, tour, weather, advisory, crop-screen, camera, gallery, scan, history
 *
 * NAYI BHASHA JODNA
 *   Ek naya block bana dein — bas. Jo bhasha yahan na ho, uske liye Hindi
 *   ke shabd chalte rehte hain (kuch tootta nahi).
 *
 * NOTE: yeh anuvaad pehla draft hai — native speaker se janchwana behtar hai.
 * ========================================================================= */

(function () {
  'use strict';

  window.KM_VOICE_LANG_WORDS = {

    'mr-IN': {   /* मराठी */
      stop:        ['थांब', 'गप्प बस', 'बंद कर', 'पुरे'],
      tour:        ['मदत', 'कसं वापरायचं', 'शिकव', 'समजाव'],
      weather:     ['हवामान', 'पाऊस', 'हवामान सांग'],
      advisory:    ['सल्ला', 'सल्ला वाच', 'औषध सांग', 'काय करू'],
      'crop-screen': ['पीक', 'पीक निवड', 'पीक बदल'],
      camera:      ['फोटो काढ', 'कॅमेरा उघड', 'कॅमेरा'],
      gallery:     ['फोटो निवड', 'गॅलरी'],
      scan:        ['तपास', 'तपासणी कर', 'रोग तपास'],
      history:     ['जुन्या तपासण्या', 'इतिहास'],
    },

    'gu-IN': {   /* ગુજરાતી */
      stop:        ['બંધ કર', 'ચૂપ', 'બસ કર'],
      tour:        ['મદદ', 'શીખવ', 'સમજાવ'],
      weather:     ['હવામાન', 'વરસાદ'],
      advisory:    ['સલાહ', 'દવા બતાવ', 'શું કરું'],
      'crop-screen': ['પાક', 'પાક પસંદ', 'પાક બદલ'],
      camera:      ['ફોટો પાડ', 'કેમેરા ખોલ', 'કેમેરા'],
      gallery:     ['ફોટો પસંદ', 'ગેલેરી'],
      scan:        ['તપાસ', 'રોગ તપાસ'],
      history:     ['જૂની તપાસ', 'ઇતિહાસ'],
    },

    'pa-IN': {   /* ਪੰਜਾਬੀ */
      stop:        ['ਰੁਕ', 'ਚੁੱਪ', 'ਬੰਦ ਕਰ', 'ਬਸ'],
      tour:        ['ਮਦਦ', 'ਸਿਖਾ', 'ਸਮਝਾ'],
      weather:     ['ਮੌਸਮ', 'ਮੀਂਹ'],
      advisory:    ['ਸਲਾਹ', 'ਦਵਾਈ ਦੱਸ', 'ਕੀ ਕਰਾਂ'],
      'crop-screen': ['ਫ਼ਸਲ', 'ਫ਼ਸਲ ਚੁਣ', 'ਫ਼ਸਲ ਬਦਲ'],
      camera:      ['ਫੋਟੋ ਖਿੱਚ', 'ਕੈਮਰਾ ਖੋਲ੍ਹ', 'ਕੈਮਰਾ'],
      gallery:     ['ਫੋਟੋ ਚੁਣ', 'ਗੈਲਰੀ'],
      scan:        ['ਜਾਂਚ', 'ਰੋਗ ਜਾਂਚ'],
      history:     ['ਪੁਰਾਣੀਆਂ ਜਾਂਚਾਂ', 'ਇਤਿਹਾਸ'],
    },

    'bn-IN': {   /* বাংলা */
      stop:        ['থামো', 'চুপ', 'বন্ধ করো'],
      tour:        ['সাহায্য', 'শেখাও', 'বুঝিয়ে দাও'],
      weather:     ['আবহাওয়া', 'বৃষ্টি'],
      advisory:    ['পরামর্শ', 'ওষুধ বলো', 'কী করব'],
      'crop-screen': ['ফসল', 'ফসল বাছো', 'ফসল বদলাও'],
      camera:      ['ছবি তোলো', 'ক্যামেরা খোলো', 'ক্যামেরা'],
      gallery:     ['ছবি বাছো', 'গ্যালারি'],
      scan:        ['পরীক্ষা করো', 'রোগ দেখো'],
      history:     ['পুরনো পরীক্ষা', 'ইতিহাস'],
    },

    'ta-IN': {   /* தமிழ் */
      stop:        ['நிறுத்து', 'அமைதி', 'போதும்'],
      tour:        ['உதவி', 'கற்றுக்கொடு', 'விளக்கு'],
      weather:     ['வானிலை', 'மழை'],
      advisory:    ['ஆலோசனை', 'மருந்து சொல்', 'என்ன செய்ய'],
      'crop-screen': ['பயிர்', 'பயிர் தேர்வு', 'பயிர் மாற்று'],
      camera:      ['படம் எடு', 'கேமரா திற', 'கேமரா'],
      gallery:     ['படம் தேர்வு', 'கேலரி'],
      scan:        ['சோதி', 'நோய் சோதி'],
      history:     ['பழைய சோதனை', 'வரலாறு'],
    },

    'te-IN': {   /* తెలుగు */
      stop:        ['ఆపు', 'నిశ్శబ్దం', 'చాలు'],
      tour:        ['సహాయం', 'నేర్పించు', 'వివరించు'],
      weather:     ['వాతావరణం', 'వర్షం'],
      advisory:    ['సలహా', 'మందు చెప్పు', 'ఏం చేయాలి'],
      'crop-screen': ['పంట', 'పంట ఎంచు', 'పంట మార్చు'],
      camera:      ['ఫోటో తీయి', 'కెమెరా తెరువు', 'కెమెరా'],
      gallery:     ['ఫోటో ఎంచు', 'గ్యాలరీ'],
      scan:        ['పరీక్షించు', 'వ్యాధి చూడు'],
      history:     ['పాత పరీక్షలు', 'చరిత్ర'],
    },

    'kn-IN': {   /* ಕನ್ನಡ */
      stop:        ['ನಿಲ್ಲಿಸು', 'ಸುಮ್ಮನಿರು', 'ಸಾಕು'],
      tour:        ['ಸಹಾಯ', 'ಕಲಿಸು', 'ವಿವರಿಸು'],
      weather:     ['ಹವಾಮಾನ', 'ಮಳೆ'],
      advisory:    ['ಸಲಹೆ', 'ಔಷಧಿ ಹೇಳು', 'ಏನು ಮಾಡಲಿ'],
      'crop-screen': ['ಬೆಳೆ', 'ಬೆಳೆ ಆಯ್ಕೆ', 'ಬೆಳೆ ಬದಲಿಸು'],
      camera:      ['ಫೋಟೋ ತೆಗೆ', 'ಕ್ಯಾಮೆರಾ ತೆರೆ', 'ಕ್ಯಾಮೆರಾ'],
      gallery:     ['ಫೋಟೋ ಆಯ್ಕೆ', 'ಗ್ಯಾಲರಿ'],
      scan:        ['ಪರೀಕ್ಷಿಸು', 'ರೋಗ ನೋಡು'],
      history:     ['ಹಳೆಯ ಪರೀಕ್ಷೆ', 'ಇತಿಹಾಸ'],
    },

    'ml-IN': {   /* മലയാളം */
      stop:        ['നിർത്തുക', 'മിണ്ടരുത്', 'മതി'],
      tour:        ['സഹായം', 'പഠിപ്പിക്കൂ', 'വിശദീകരിക്കൂ'],
      weather:     ['കാലാവസ്ഥ', 'മഴ'],
      advisory:    ['ഉപദേശം', 'മരുന്ന് പറയൂ', 'എന്ത് ചെയ്യണം'],
      'crop-screen': ['വിള', 'വിള തിരഞ്ഞെടുക്കൂ', 'വിള മാറ്റൂ'],
      camera:      ['ഫോട്ടോ എടുക്കൂ', 'ക്യാമറ തുറക്കൂ', 'ക്യാമറ'],
      gallery:     ['ഫോട്ടോ തിരഞ്ഞെടുക്കൂ', 'ഗാലറി'],
      scan:        ['പരിശോധിക്കൂ', 'രോഗം നോക്കൂ'],
      history:     ['പഴയ പരിശോധന', 'ചരിത്രം'],
    },

    'or-IN': {   /* ଓଡ଼ିଆ */
      stop:        ['ବନ୍ଦ କର', 'ଚୁପ୍', 'ଯଥେଷ୍ଟ'],
      tour:        ['ସାହାଯ୍ୟ', 'ଶିଖାଅ', 'ବୁଝାଅ'],
      weather:     ['ପାଣିପାଗ', 'ବର୍ଷା'],
      advisory:    ['ପରାମର୍ଶ', 'ଔଷଧ କୁହ', 'କଣ କରିବି'],
      'crop-screen': ['ଫସଲ', 'ଫସଲ ବାଛ', 'ଫସଲ ବଦଳାଅ'],
      camera:      ['ଫଟୋ ଉଠାଅ', 'କ୍ୟାମେରା ଖୋଲ', 'କ୍ୟାମେରା'],
      gallery:     ['ଫଟୋ ବାଛ', 'ଗ୍ୟାଲେରୀ'],
      scan:        ['ଯାଞ୍ଚ କର', 'ରୋଗ ଦେଖ'],
      history:     ['ପୁରୁଣା ଯାଞ୍ଚ', 'ଇତିହାସ'],
    },

    'ur-IN': {   /* اردو */
      stop:        ['رکو', 'چپ', 'بند کرو', 'بس'],
      tour:        ['مدد', 'سکھاؤ', 'سمجھاؤ'],
      weather:     ['موسم', 'بارش'],
      advisory:    ['مشورہ', 'دوا بتاؤ', 'کیا کروں'],
      'crop-screen': ['فصل', 'فصل منتخب کرو', 'فصل بدلو'],
      camera:      ['تصویر کھینچو', 'کیمرہ کھولو', 'کیمرہ'],
      gallery:     ['تصویر منتخب کرو', 'گیلری'],
      scan:        ['جانچو', 'بیماری دیکھو'],
      history:     ['پرانی جانچیں', 'تاریخ'],
    },

    'en-IN': {   /* English — Hinglish ke alawa saaf English bhi */
      stop:        ['stop', 'quiet', 'be quiet', 'shut up', 'enough'],
      tour:        ['help me', 'show me how', 'teach me', 'guide me', 'tutorial'],
      weather:     ['weather', 'rain', 'forecast', 'is it going to rain'],
      advisory:    ['advice', 'read advice', 'what medicine', 'what should i do', 'treatment'],
      'crop-screen': ['change crop', 'select crop', 'choose crop', 'crop list'],
      camera:      ['open camera', 'take a photo', 'take picture', 'camera'],
      gallery:     ['choose photo', 'pick photo', 'gallery', 'upload'],
      scan:        ['scan', 'check disease', 'detect', 'analyse', 'analyze'],
      history:     ['history', 'past checks', 'previous scans'],
    },
  };
})();
