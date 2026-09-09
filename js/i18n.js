/* ============================================================================
 * KRASHI MITRA — UI ka anuvaad (i18n)
 * js/i18n.js
 *
 * KYA HAI ISME AUR KYA NAHI — YEH PADH LEIN
 *   ISME HAI  : sirf UI ka dhancha — menu, button, heading, status.
 *               Yani wo shabd jinse kisan app me ghoomta hai.
 *   ISME NAHI : rog ki salah, dawa ke naam, aur MATRA (dosage).
 *
 *   Kyun nahi? Kyunki galat bhasha me galat matra likhna kisan ki poori fasal
 *   — aur uski sehat — kharab kar sakta hai. Wo content har bhasha me kisi
 *   krishi vigyani se jaanchwana zaroori hai, machine se anuvaad karna nahi.
 *   Tab tak salah Hindi + English me hi rehti hai (dono ek saath dikhti hain).
 *
 * ANUVAAD KI GUNVATTA
 *   Neeche 12 bhashaon ka pehla draft hai. Ye kaam chalane layak hain, par
 *   KISI NATIVE SPEAKER SE JANCHWANA BAAKI HAI — khaaskar khet se jude shabd.
 *   Baaki 10 bhashaon ke liye abhi Hindi hi dikhti hai (fallback), taaki
 *   aadha-adhoora galat anuvaad na dikhe.
 *
 * NAYA SHABD KAISE JODEIN
 *   1. STRINGS['hi-IN'] me nayi key + Hindi text likhein
 *   2. HTML me:  <span data-i18n="apni.key">Hindi text</span>
 *   3. Baaki bhashaon me wahi key jodte jaayein. Jis bhasha me na ho,
 *      wahan apne aap Hindi dikh jaayegi — kuch tootega nahi.
 *
 * KISI ANUVAAD KO THEEK KAISE KAREIN
 *   Bas neeche us bhasha ke block me us key ka text badal dein. Aur kahin
 *   kuch chhune ki zaroorat nahi.
 * ========================================================================= */

(function () {
  'use strict';

  /* --------------------------------------------------------------------
   * hi-IN = aadhaar. Har doosri bhasha me jo key na ho, wo yahan se aati hai.
   * ------------------------------------------------------------------ */
  const STRINGS = {

    'hi-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'धान',
      'net.offline':'इंटरनेट नहीं',
      'net.weak':'बहुत धीमा इंटरनेट',
      'net.ok':'ठीक-ठाक इंटरनेट',
      'net.good':'अच्छा इंटरनेट',
      'crop.wheat':'गेहूँ',
      'crop.sugarcane':'गन्ना',
      'crop.cotton':'कपास',
      'crop.onion':'प्याज',
      'crop.maize':'मक्का',
      'crop.potato':'आलू',
      'crop.tomato':'टमाटर',
      'crop.mango':'आम',
      'crop.apple':'सेब',
      'nav.crops':        'फसल चुनें',
      'nav.scan':         'फोटो से जाँच',
      'nav.history':      'पुरानी जाँचें',
      'nav.advisory':     'सलाह',
      'nav.handbook':     'रोग पुस्तिका',
      'nav.about':        'ऑफ़लाइन व मदद',
      'nav.download':     'ऐप डाउनलोड करें',

      'head.chooseCrop':  'आपकी फसल कौन सी है?',
      'head.weather':     'आज का मौसम',
      'head.mandi':       'आस-पास की मंडी का भाव',
      'head.scan':        'फोटो से रोग जाँचें',
      'head.recent':      'पिछली जाँचें',
      'head.result':      'पूरे खेत का नतीजा',
      'head.advisory':    'सलाह',
      'head.scores':      'कितना भरोसा है',
      'head.history':     'पुरानी जाँचें',
      'head.guide':       'रोग पुस्तिका',
      'head.install':     'ऐप फ़ोन में लें',

      'btn.takePhoto':    'फोटो खींचें',
      'btn.choosePhoto':  'फोटो चुनें',
      'btn.scanAll':      'सब जाँचें',
      'btn.listen':       'सुनो',
      'btn.stop':         'रोकें',
      'btn.retry':        'दोबारा कोशिश करें',
      'btn.next':         'आगे',
      'btn.back':         'पीछे',
      'btn.skip':         'छोड़ें',
      'btn.done':         'हो गया',
      'btn.viewAll':      'सब देखें',
      'btn.clear':        'हटाएँ',
      'btn.changeLang':   'भाषा बदलें',
      'btn.help':         'मदद',

      'st.modelReady':    'तैयार',
      'st.modelLoading':  'तैयार हो रहा है…',
      'st.chooseCrop':    'फसल चुनें',
      'st.offline':       'बिना इंटरनेट',
      'st.scanning':      'जाँच चल रही है…',

      'msg.needInternet': 'इसके लिए इंटरनेट चाहिए। रोग पहचान बिना इंटरनेट के चलती रहेगी।',
      'msg.notLeaf':      'यह पत्ती की फोटो नहीं लग रही',
      'msg.notIdentified':'सही पहचान नहीं हो पाई — साफ फोटो लें',
      'msg.chooseCropFirst':'पहले अपनी फसल चुनें',
    },

    'en-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'Rice',
      'net.offline':'No internet',
      'net.weak':'Very slow internet',
      'net.ok':'Fair internet',
      'net.good':'Good internet',
      'crop.wheat':'Wheat',
      'crop.sugarcane':'Sugarcane',
      'crop.cotton':'Cotton',
      'crop.onion':'Onion',
      'crop.maize':'Maize',
      'crop.potato':'Potato',
      'crop.tomato':'Tomato',
      'crop.mango':'Mango',
      'crop.apple':'Apple',
      'nav.crops':'Choose crop','nav.scan':'Scan & Detect','nav.history':'History',
      'nav.advisory':'Advisory','nav.handbook':'Crop Guide','nav.about':'Offline & Help',
      'nav.download':'Download app',
      'head.chooseCrop':'Which is your crop?','head.weather':'Today’s weather',
      'head.mandi':'Nearby mandi prices','head.scan':'Check disease from a photo',
      'head.recent':'Recent checks','head.result':'Whole-field result','head.advisory':'Advisory',
      'head.scores':'How confident','head.history':'Past checks','head.guide':'Crop guide',
      'head.install':'Install the app',
      'btn.takePhoto':'Take photo','btn.choosePhoto':'Choose photo','btn.scanAll':'Check all',
      'btn.listen':'Listen','btn.stop':'Stop','btn.retry':'Try again','btn.next':'Next',
      'btn.back':'Back','btn.skip':'Skip','btn.done':'Done','btn.viewAll':'View all',
      'btn.clear':'Clear','btn.changeLang':'Change language','btn.help':'Help',
      'st.modelReady':'Ready','st.modelLoading':'Getting ready…','st.chooseCrop':'Choose crop',
      'st.offline':'No internet needed','st.scanning':'Checking…',
      'msg.needInternet':'This needs internet. Disease detection keeps working offline.',
      'msg.notLeaf':'This does not look like a leaf photo',
      'msg.notIdentified':'Could not identify clearly — take a sharper photo',
      'msg.chooseCropFirst':'Choose your crop first',
    },

    'mr-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'भात',
      'net.offline':'इंटरनेट नाही',
      'net.weak':'खूप संथ इंटरनेट',
      'net.ok':'बऱ्यापैकी इंटरनेट',
      'net.good':'चांगले इंटरनेट',
      'crop.wheat':'गहू',
      'crop.sugarcane':'ऊस',
      'crop.cotton':'कापूस',
      'crop.onion':'कांदा',
      'crop.maize':'मका',
      'crop.potato':'बटाटा',
      'crop.tomato':'टोमॅटो',
      'crop.mango':'आंबा',
      'crop.apple':'सफरचंद',
      'nav.crops':'पीक निवडा','nav.scan':'फोटोवरून तपासा','nav.history':'जुन्या तपासण्या',
      'nav.advisory':'सल्ला','nav.handbook':'रोग पुस्तिका','nav.about':'ऑफलाइन व मदत',
      'nav.download':'अ‍ॅप डाउनलोड करा',
      'head.chooseCrop':'तुमचे पीक कोणते आहे?','head.weather':'आजचे हवामान',
      'head.mandi':'जवळच्या बाजारातील भाव','head.scan':'फोटोवरून रोग तपासा',
      'head.recent':'मागील तपासण्या','head.result':'संपूर्ण शेताचा निकाल','head.advisory':'सल्ला',
      'head.scores':'किती खात्री आहे','head.history':'जुन्या तपासण्या','head.guide':'रोग पुस्तिका',
      'head.install':'अ‍ॅप फोनमध्ये घ्या',
      'btn.takePhoto':'फोटो काढा','btn.choosePhoto':'फोटो निवडा','btn.scanAll':'सर्व तपासा',
      'btn.listen':'ऐका','btn.stop':'थांबा','btn.retry':'पुन्हा प्रयत्न करा','btn.next':'पुढे',
      'btn.back':'मागे','btn.skip':'वगळा','btn.done':'झाले','btn.viewAll':'सर्व पहा',
      'btn.clear':'काढून टाका','btn.changeLang':'भाषा बदला','btn.help':'मदत',
      'st.modelReady':'तयार','st.modelLoading':'तयार होत आहे…','st.chooseCrop':'पीक निवडा',
      'st.offline':'इंटरनेटशिवाय','st.scanning':'तपासणी सुरू आहे…',
      'msg.needInternet':'यासाठी इंटरनेट लागते. रोग ओळख इंटरनेटशिवाय चालू राहील.',
      'msg.notLeaf':'हा पानाचा फोटो वाटत नाही',
      'msg.notIdentified':'नीट ओळखता आले नाही — स्पष्ट फोटो काढा',
      'msg.chooseCropFirst':'आधी तुमचे पीक निवडा',
    },

    'gu-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'ડાંગર',
      'net.offline':'ઇન્ટરનેટ નથી',
      'net.weak':'ખૂબ ધીમું ઇન્ટરનેટ',
      'net.ok':'ઠીક-ઠાક ઇન્ટરનેટ',
      'net.good':'સારું ઇન્ટરનેટ',
      'crop.wheat':'ઘઉં',
      'crop.sugarcane':'શેરડી',
      'crop.cotton':'કપાસ',
      'crop.onion':'ડુંગળી',
      'crop.maize':'મકાઈ',
      'crop.potato':'બટાટા',
      'crop.tomato':'ટામેટા',
      'crop.mango':'કેરી',
      'crop.apple':'સફરજન',
      'nav.crops':'પાક પસંદ કરો','nav.scan':'ફોટોથી તપાસો','nav.history':'જૂની તપાસ',
      'nav.advisory':'સલાહ','nav.handbook':'રોગ પુસ્તિકા','nav.about':'ઓફલાઇન અને મદદ',
      'nav.download':'એપ ડાઉનલોડ કરો',
      'head.chooseCrop':'તમારો પાક કયો છે?','head.weather':'આજનું હવામાન',
      'head.mandi':'નજીકના બજારના ભાવ','head.scan':'ફોટોથી રોગ તપાસો',
      'head.recent':'છેલ્લી તપાસ','head.result':'આખા ખેતરનું પરિણામ','head.advisory':'સલાહ',
      'head.scores':'કેટલો ભરોસો','head.history':'જૂની તપાસ','head.guide':'રોગ પુસ્તિકા',
      'head.install':'એપ ફોનમાં લો',
      'btn.takePhoto':'ફોટો પાડો','btn.choosePhoto':'ફોટો પસંદ કરો','btn.scanAll':'બધું તપાસો',
      'btn.listen':'સાંભળો','btn.stop':'રોકો','btn.retry':'ફરી પ્રયાસ કરો','btn.next':'આગળ',
      'btn.back':'પાછળ','btn.skip':'છોડો','btn.done':'થઈ ગયું','btn.viewAll':'બધું જુઓ',
      'btn.clear':'હટાવો','btn.changeLang':'ભાષા બદલો','btn.help':'મદદ',
      'st.modelReady':'તૈયાર','st.modelLoading':'તૈયાર થાય છે…','st.chooseCrop':'પાક પસંદ કરો',
      'st.offline':'ઇન્ટરનેટ વગર','st.scanning':'તપાસ ચાલુ છે…',
      'msg.needInternet':'આ માટે ઇન્ટરનેટ જોઈએ. રોગ ઓળખ ઇન્ટરનેટ વગર ચાલુ રહેશે.',
      'msg.notLeaf':'આ પાંદડાનો ફોટો લાગતો નથી',
      'msg.notIdentified':'બરાબર ઓળખાયું નહીં — સ્પષ્ટ ફોટો લો',
      'msg.chooseCropFirst':'પહેલા તમારો પાક પસંદ કરો',
    },

    'pa-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'ਝੋਨਾ',
      'net.offline':'ਇੰਟਰਨੈੱਟ ਨਹੀਂ',
      'net.weak':'ਬਹੁਤ ਹੌਲੀ ਇੰਟਰਨੈੱਟ',
      'net.ok':'ਠੀਕ-ਠਾਕ ਇੰਟਰਨੈੱਟ',
      'net.good':'ਵਧੀਆ ਇੰਟਰਨੈੱਟ',
      'crop.wheat':'ਕਣਕ',
      'crop.sugarcane':'ਗੰਨਾ',
      'crop.cotton':'ਕਪਾਹ',
      'crop.onion':'ਪਿਆਜ਼',
      'crop.maize':'ਮੱਕੀ',
      'crop.potato':'ਆਲੂ',
      'crop.tomato':'ਟਮਾਟਰ',
      'crop.mango':'ਅੰਬ',
      'crop.apple':'ਸੇਬ',
      'nav.crops':'ਫ਼ਸਲ ਚੁਣੋ','nav.scan':'ਫੋਟੋ ਤੋਂ ਜਾਂਚ','nav.history':'ਪੁਰਾਣੀਆਂ ਜਾਂਚਾਂ',
      'nav.advisory':'ਸਲਾਹ','nav.handbook':'ਰੋਗ ਪੁਸਤਿਕਾ','nav.about':'ਆਫ਼ਲਾਈਨ ਤੇ ਮਦਦ',
      'nav.download':'ਐਪ ਡਾਊਨਲੋਡ ਕਰੋ',
      'head.chooseCrop':'ਤੁਹਾਡੀ ਫ਼ਸਲ ਕਿਹੜੀ ਹੈ?','head.weather':'ਅੱਜ ਦਾ ਮੌਸਮ',
      'head.mandi':'ਨੇੜਲੀ ਮੰਡੀ ਦੇ ਭਾਅ','head.scan':'ਫੋਟੋ ਤੋਂ ਰੋਗ ਜਾਂਚੋ',
      'head.recent':'ਪਿਛਲੀਆਂ ਜਾਂਚਾਂ','head.result':'ਪੂਰੇ ਖੇਤ ਦਾ ਨਤੀਜਾ','head.advisory':'ਸਲਾਹ',
      'head.scores':'ਕਿੰਨਾ ਭਰੋਸਾ','head.history':'ਪੁਰਾਣੀਆਂ ਜਾਂਚਾਂ','head.guide':'ਰੋਗ ਪੁਸਤਿਕਾ',
      'head.install':'ਐਪ ਫ਼ੋਨ ਵਿੱਚ ਲਵੋ',
      'btn.takePhoto':'ਫੋਟੋ ਖਿੱਚੋ','btn.choosePhoto':'ਫੋਟੋ ਚੁਣੋ','btn.scanAll':'ਸਭ ਜਾਂਚੋ',
      'btn.listen':'ਸੁਣੋ','btn.stop':'ਰੋਕੋ','btn.retry':'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ','btn.next':'ਅੱਗੇ',
      'btn.back':'ਪਿੱਛੇ','btn.skip':'ਛੱਡੋ','btn.done':'ਹੋ ਗਿਆ','btn.viewAll':'ਸਭ ਵੇਖੋ',
      'btn.clear':'ਹਟਾਓ','btn.changeLang':'ਭਾਸ਼ਾ ਬਦਲੋ','btn.help':'ਮਦਦ',
      'st.modelReady':'ਤਿਆਰ','st.modelLoading':'ਤਿਆਰ ਹੋ ਰਿਹਾ ਹੈ…','st.chooseCrop':'ਫ਼ਸਲ ਚੁਣੋ',
      'st.offline':'ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ','st.scanning':'ਜਾਂਚ ਚੱਲ ਰਹੀ ਹੈ…',
      'msg.needInternet':'ਇਸ ਲਈ ਇੰਟਰਨੈੱਟ ਚਾਹੀਦਾ ਹੈ। ਰੋਗ ਪਛਾਣ ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ ਚੱਲਦੀ ਰਹੇਗੀ।',
      'msg.notLeaf':'ਇਹ ਪੱਤੇ ਦੀ ਫੋਟੋ ਨਹੀਂ ਲੱਗਦੀ',
      'msg.notIdentified':'ਠੀਕ ਪਛਾਣ ਨਹੀਂ ਹੋ ਸਕੀ — ਸਾਫ਼ ਫੋਟੋ ਲਵੋ',
      'msg.chooseCropFirst':'ਪਹਿਲਾਂ ਆਪਣੀ ਫ਼ਸਲ ਚੁਣੋ',
    },

    'bn-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'ধান',
      'net.offline':'ইন্টারনেট নেই',
      'net.weak':'খুব ধীর ইন্টারনেট',
      'net.ok':'মোটামুটি ইন্টারনেট',
      'net.good':'ভালো ইন্টারনেট',
      'crop.wheat':'গম',
      'crop.sugarcane':'আখ',
      'crop.cotton':'তুলা',
      'crop.onion':'পেঁয়াজ',
      'crop.maize':'ভুট্টা',
      'crop.potato':'আলু',
      'crop.tomato':'টমেটো',
      'crop.mango':'আম',
      'crop.apple':'আপেল',
      'nav.crops':'ফসল বাছুন','nav.scan':'ছবি থেকে পরীক্ষা','nav.history':'পুরনো পরীক্ষা',
      'nav.advisory':'পরামর্শ','nav.handbook':'রোগ পুস্তিকা','nav.about':'অফলাইন ও সাহায্য',
      'nav.download':'অ্যাপ ডাউনলোড করুন',
      'head.chooseCrop':'আপনার ফসল কোনটি?','head.weather':'আজকের আবহাওয়া',
      'head.mandi':'কাছের বাজারের দাম','head.scan':'ছবি থেকে রোগ দেখুন',
      'head.recent':'সাম্প্রতিক পরীক্ষা','head.result':'পুরো ক্ষেতের ফল','head.advisory':'পরামর্শ',
      'head.scores':'কতটা নিশ্চিত','head.history':'পুরনো পরীক্ষা','head.guide':'রোগ পুস্তিকা',
      'head.install':'ফোনে অ্যাপ নিন',
      'btn.takePhoto':'ছবি তুলুন','btn.choosePhoto':'ছবি বাছুন','btn.scanAll':'সব দেখুন',
      'btn.listen':'শুনুন','btn.stop':'থামান','btn.retry':'আবার চেষ্টা করুন','btn.next':'পরে',
      'btn.back':'আগে','btn.skip':'বাদ দিন','btn.done':'হয়ে গেছে','btn.viewAll':'সব দেখুন',
      'btn.clear':'মুছুন','btn.changeLang':'ভাষা বদলান','btn.help':'সাহায্য',
      'st.modelReady':'প্রস্তুত','st.modelLoading':'প্রস্তুত হচ্ছে…','st.chooseCrop':'ফসল বাছুন',
      'st.offline':'ইন্টারনেট ছাড়াই','st.scanning':'পরীক্ষা চলছে…',
      'msg.needInternet':'এর জন্য ইন্টারনেট লাগে। রোগ শনাক্তকরণ ইন্টারনেট ছাড়াই চলবে।',
      'msg.notLeaf':'এটি পাতার ছবি মনে হচ্ছে না',
      'msg.notIdentified':'ঠিকমতো চেনা গেল না — পরিষ্কার ছবি তুলুন',
      'msg.chooseCropFirst':'আগে আপনার ফসল বাছুন',
    },

    'ta-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'நெல்',
      'net.offline':'இணையம் இல்லை',
      'net.weak':'மிக மெதுவான இணையம்',
      'net.ok':'சுமாரான இணையம்',
      'net.good':'நல்ல இணையம்',
      'crop.wheat':'கோதுமை',
      'crop.sugarcane':'கரும்பு',
      'crop.cotton':'பருத்தி',
      'crop.onion':'வெங்காயம்',
      'crop.maize':'மக்காச்சோளம்',
      'crop.potato':'உருளைக்கிழங்கு',
      'crop.tomato':'தக்காளி',
      'crop.mango':'மாம்பழம்',
      'crop.apple':'ஆப்பிள்',
      'nav.crops':'பயிரைத் தேர்வு செய்','nav.scan':'படத்தில் இருந்து சோதனை','nav.history':'பழைய சோதனைகள்',
      'nav.advisory':'ஆலோசனை','nav.handbook':'நோய் கையேடு','nav.about':'ஆஃப்லைன் & உதவி',
      'nav.download':'செயலியைப் பதிவிறக்கு',
      'head.chooseCrop':'உங்கள் பயிர் எது?','head.weather':'இன்றைய வானிலை',
      'head.mandi':'அருகிலுள்ள சந்தை விலை','head.scan':'படத்தில் நோயைச் சோதி',
      'head.recent':'சமீபத்திய சோதனைகள்','head.result':'முழு வயலின் முடிவு','head.advisory':'ஆலோசனை',
      'head.scores':'எவ்வளவு உறுதி','head.history':'பழைய சோதனைகள்','head.guide':'நோய் கையேடு',
      'head.install':'செயலியை நிறுவு',
      'btn.takePhoto':'படம் எடு','btn.choosePhoto':'படத்தைத் தேர்வு செய்','btn.scanAll':'அனைத்தையும் சோதி',
      'btn.listen':'கேள்','btn.stop':'நிறுத்து','btn.retry':'மீண்டும் முயற்சி','btn.next':'அடுத்து',
      'btn.back':'பின்','btn.skip':'தவிர்','btn.done':'முடிந்தது','btn.viewAll':'அனைத்தையும் பார்',
      'btn.clear':'நீக்கு','btn.changeLang':'மொழியை மாற்று','btn.help':'உதவி',
      'st.modelReady':'தயார்','st.modelLoading':'தயாராகிறது…','st.chooseCrop':'பயிரைத் தேர்வு செய்',
      'st.offline':'இணையம் இல்லாமல்','st.scanning':'சோதனை நடக்கிறது…',
      'msg.needInternet':'இதற்கு இணையம் தேவை. நோய் கண்டறிதல் இணையம் இல்லாமலும் இயங்கும்.',
      'msg.notLeaf':'இது இலையின் படமாகத் தெரியவில்லை',
      'msg.notIdentified':'சரியாக அடையாளம் காண முடியவில்லை — தெளிவான படம் எடுங்கள்',
      'msg.chooseCropFirst':'முதலில் உங்கள் பயிரைத் தேர்வு செய்யுங்கள்',
    },

    'te-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'వరి',
      'net.offline':'ఇంటర్నెట్ లేదు',
      'net.weak':'చాలా నెమ్మది ఇంటర్నెట్',
      'net.ok':'ఫర్వాలేదు ఇంటర్నెట్',
      'net.good':'మంచి ఇంటర్నెట్',
      'crop.wheat':'గోధుమ',
      'crop.sugarcane':'చెరకు',
      'crop.cotton':'పత్తి',
      'crop.onion':'ఉల్లిపాయ',
      'crop.maize':'మొక్కజొన్న',
      'crop.potato':'బంగాళదుంప',
      'crop.tomato':'టమాటా',
      'crop.mango':'మామిడి',
      'crop.apple':'యాపిల్',
      'nav.crops':'పంట ఎంచుకోండి','nav.scan':'ఫోటోతో పరీక్ష','nav.history':'పాత పరీక్షలు',
      'nav.advisory':'సలహా','nav.handbook':'వ్యాధి పుస్తకం','nav.about':'ఆఫ్‌లైన్ & సహాయం',
      'nav.download':'యాప్ డౌన్‌లోడ్ చేయండి',
      'head.chooseCrop':'మీ పంట ఏది?','head.weather':'నేటి వాతావరణం',
      'head.mandi':'దగ్గరి మార్కెట్ ధరలు','head.scan':'ఫోటోతో వ్యాధి చూడండి',
      'head.recent':'ఇటీవలి పరీక్షలు','head.result':'మొత్తం పొలం ఫలితం','head.advisory':'సలహా',
      'head.scores':'ఎంత నమ్మకం','head.history':'పాత పరీక్షలు','head.guide':'వ్యాధి పుస్తకం',
      'head.install':'యాప్ ఫోన్‌లో పెట్టండి',
      'btn.takePhoto':'ఫోటో తీయండి','btn.choosePhoto':'ఫోటో ఎంచుకోండి','btn.scanAll':'అన్నీ పరీక్షించండి',
      'btn.listen':'వినండి','btn.stop':'ఆపండి','btn.retry':'మళ్లీ ప్రయత్నించండి','btn.next':'తర్వాత',
      'btn.back':'వెనుకకు','btn.skip':'వదిలేయండి','btn.done':'అయ్యింది','btn.viewAll':'అన్నీ చూడండి',
      'btn.clear':'తీసివేయండి','btn.changeLang':'భాష మార్చండి','btn.help':'సహాయం',
      'st.modelReady':'సిద్ధం','st.modelLoading':'సిద్ధమవుతోంది…','st.chooseCrop':'పంట ఎంచుకోండి',
      'st.offline':'ఇంటర్నెట్ లేకుండా','st.scanning':'పరీక్ష జరుగుతోంది…',
      'msg.needInternet':'దీనికి ఇంటర్నెట్ కావాలి. వ్యాధి గుర్తింపు ఇంటర్నెట్ లేకుండా పని చేస్తుంది.',
      'msg.notLeaf':'ఇది ఆకు ఫోటోలా అనిపించడం లేదు',
      'msg.notIdentified':'సరిగ్గా గుర్తించలేకపోయాము — స్పష్టమైన ఫోటో తీయండి',
      'msg.chooseCropFirst':'ముందుగా మీ పంట ఎంచుకోండి',
    },

    'kn-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'ಭತ್ತ',
      'net.offline':'ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ',
      'net.weak':'ತುಂಬಾ ನಿಧಾನ ಇಂಟರ್ನೆಟ್',
      'net.ok':'ಪರವಾಗಿಲ್ಲ ಇಂಟರ್ನೆಟ್',
      'net.good':'ಒಳ್ಳೆಯ ಇಂಟರ್ನೆಟ್',
      'crop.wheat':'ಗೋಧಿ',
      'crop.sugarcane':'ಕಬ್ಬು',
      'crop.cotton':'ಹತ್ತಿ',
      'crop.onion':'ಈರುಳ್ಳಿ',
      'crop.maize':'ಜೋಳ',
      'crop.potato':'ಆಲೂಗಡ್ಡೆ',
      'crop.tomato':'ಟೊಮೆಟೊ',
      'crop.mango':'ಮಾವು',
      'crop.apple':'ಸೇಬು',
      'nav.crops':'ಬೆಳೆ ಆಯ್ಕೆ ಮಾಡಿ','nav.scan':'ಫೋಟೋದಿಂದ ಪರೀಕ್ಷೆ','nav.history':'ಹಳೆಯ ಪರೀಕ್ಷೆಗಳು',
      'nav.advisory':'ಸಲಹೆ','nav.handbook':'ರೋಗ ಪುಸ್ತಿಕೆ','nav.about':'ಆಫ್‌ಲೈನ್ ಮತ್ತು ಸಹಾಯ',
      'nav.download':'ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
      'head.chooseCrop':'ನಿಮ್ಮ ಬೆಳೆ ಯಾವುದು?','head.weather':'ಇಂದಿನ ಹವಾಮಾನ',
      'head.mandi':'ಹತ್ತಿರದ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ','head.scan':'ಫೋಟೋದಿಂದ ರೋಗ ಪರಿಶೀಲಿಸಿ',
      'head.recent':'ಇತ್ತೀಚಿನ ಪರೀಕ್ಷೆಗಳು','head.result':'ಇಡೀ ಹೊಲದ ಫಲಿತಾಂಶ','head.advisory':'ಸಲಹೆ',
      'head.scores':'ಎಷ್ಟು ವಿಶ್ವಾಸ','head.history':'ಹಳೆಯ ಪರೀಕ್ಷೆಗಳು','head.guide':'ರೋಗ ಪುಸ್ತಿಕೆ',
      'head.install':'ಆ್ಯಪ್ ಫೋನಿನಲ್ಲಿ ಹಾಕಿ',
      'btn.takePhoto':'ಫೋಟೋ ತೆಗೆಯಿರಿ','btn.choosePhoto':'ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಿ','btn.scanAll':'ಎಲ್ಲವನ್ನೂ ಪರೀಕ್ಷಿಸಿ',
      'btn.listen':'ಕೇಳಿ','btn.stop':'ನಿಲ್ಲಿಸಿ','btn.retry':'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ','btn.next':'ಮುಂದೆ',
      'btn.back':'ಹಿಂದೆ','btn.skip':'ಬಿಟ್ಟುಬಿಡಿ','btn.done':'ಮುಗಿಯಿತು','btn.viewAll':'ಎಲ್ಲವನ್ನೂ ನೋಡಿ',
      'btn.clear':'ತೆಗೆದುಹಾಕಿ','btn.changeLang':'ಭಾಷೆ ಬದಲಾಯಿಸಿ','btn.help':'ಸಹಾಯ',
      'st.modelReady':'ಸಿದ್ಧ','st.modelLoading':'ಸಿದ್ಧವಾಗುತ್ತಿದೆ…','st.chooseCrop':'ಬೆಳೆ ಆಯ್ಕೆ ಮಾಡಿ',
      'st.offline':'ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆ','st.scanning':'ಪರೀಕ್ಷೆ ನಡೆಯುತ್ತಿದೆ…',
      'msg.needInternet':'ಇದಕ್ಕೆ ಇಂಟರ್ನೆಟ್ ಬೇಕು. ರೋಗ ಪತ್ತೆ ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ.',
      'msg.notLeaf':'ಇದು ಎಲೆಯ ಫೋಟೋ ಎನಿಸುತ್ತಿಲ್ಲ',
      'msg.notIdentified':'ಸರಿಯಾಗಿ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ — ಸ್ಪಷ್ಟ ಫೋಟೋ ತೆಗೆಯಿರಿ',
      'msg.chooseCropFirst':'ಮೊದಲು ನಿಮ್ಮ ಬೆಳೆ ಆಯ್ಕೆ ಮಾಡಿ',
    },

    'ml-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'നെല്ല്',
      'net.offline':'ഇന്റർനെറ്റ് ഇല്ല',
      'net.weak':'വളരെ പതുക്കെയുള്ള ഇന്റർനെറ്റ്',
      'net.ok':'സാമാന്യം ഇന്റർനെറ്റ്',
      'net.good':'നല്ല ഇന്റർനെറ്റ്',
      'crop.wheat':'ഗോതമ്പ്',
      'crop.sugarcane':'കരിമ്പ്',
      'crop.cotton':'പരുത്തി',
      'crop.onion':'സവാള',
      'crop.maize':'ചോളം',
      'crop.potato':'ഉരുളക്കിഴങ്ങ്',
      'crop.tomato':'തക്കാളി',
      'crop.mango':'മാങ്ങ',
      'crop.apple':'ആപ്പിൾ',
      'nav.crops':'വിള തിരഞ്ഞെടുക്കുക','nav.scan':'ഫോട്ടോയിൽ നിന്ന് പരിശോധന','nav.history':'പഴയ പരിശോധനകൾ',
      'nav.advisory':'ഉപദേശം','nav.handbook':'രോഗ പുസ്തിക','nav.about':'ഓഫ്‌ലൈൻ & സഹായം',
      'nav.download':'ആപ്പ് ഡൗൺലോഡ് ചെയ്യുക',
      'head.chooseCrop':'നിങ്ങളുടെ വിള ഏതാണ്?','head.weather':'ഇന്നത്തെ കാലാവസ്ഥ',
      'head.mandi':'അടുത്തുള്ള ചന്ത വില','head.scan':'ഫോട്ടോയിൽ രോഗം പരിശോധിക്കുക',
      'head.recent':'അടുത്തിടെയുള്ള പരിശോധനകൾ','head.result':'മുഴുവൻ വയലിന്റെ ഫലം','head.advisory':'ഉപദേശം',
      'head.scores':'എത്ര ഉറപ്പ്','head.history':'പഴയ പരിശോധനകൾ','head.guide':'രോഗ പുസ്തിക',
      'head.install':'ആപ്പ് ഫോണിൽ എടുക്കുക',
      'btn.takePhoto':'ഫോട്ടോ എടുക്കുക','btn.choosePhoto':'ഫോട്ടോ തിരഞ്ഞെടുക്കുക','btn.scanAll':'എല്ലാം പരിശോധിക്കുക',
      'btn.listen':'കേൾക്കുക','btn.stop':'നിർത്തുക','btn.retry':'വീണ്ടും ശ്രമിക്കുക','btn.next':'അടുത്തത്',
      'btn.back':'പിന്നോട്ട്','btn.skip':'ഒഴിവാക്കുക','btn.done':'കഴിഞ്ഞു','btn.viewAll':'എല്ലാം കാണുക',
      'btn.clear':'നീക്കം ചെയ്യുക','btn.changeLang':'ഭാഷ മാറ്റുക','btn.help':'സഹായം',
      'st.modelReady':'തയ്യാർ','st.modelLoading':'തയ്യാറാകുന്നു…','st.chooseCrop':'വിള തിരഞ്ഞെടുക്കുക',
      'st.offline':'ഇന്റർനെറ്റ് ഇല്ലാതെ','st.scanning':'പരിശോധന നടക്കുന്നു…',
      'msg.needInternet':'ഇതിന് ഇന്റർനെറ്റ് വേണം. രോഗനിർണയം ഇന്റർനെറ്റ് ഇല്ലാതെയും പ്രവർത്തിക്കും.',
      'msg.notLeaf':'ഇത് ഇലയുടെ ഫോട്ടോ ആയി തോന്നുന്നില്ല',
      'msg.notIdentified':'ശരിയായി തിരിച്ചറിയാനായില്ല — വ്യക്തമായ ഫോട്ടോ എടുക്കുക',
      'msg.chooseCropFirst':'ആദ്യം നിങ്ങളുടെ വിള തിരഞ്ഞെടുക്കുക',
    },

    'or-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'ଧାନ',
      'net.offline':'ଇଣ୍ଟରନେଟ୍ ନାହିଁ',
      'net.weak':'ବହୁତ ଧୀର ଇଣ୍ଟରନେଟ୍',
      'net.ok':'ମୋଟାମୋଟି ଇଣ୍ଟରନେଟ୍',
      'net.good':'ଭଲ ଇଣ୍ଟରନେଟ୍',
      'crop.wheat':'ଗହମ',
      'crop.sugarcane':'ଆଖୁ',
      'crop.cotton':'କପା',
      'crop.onion':'ପିଆଜ',
      'crop.maize':'ମକା',
      'crop.potato':'ଆଳୁ',
      'crop.tomato':'ଟମାଟୋ',
      'crop.mango':'ଆମ୍ବ',
      'crop.apple':'ସେଓ',
      'nav.crops':'ଫସଲ ବାଛନ୍ତୁ','nav.scan':'ଫଟୋରୁ ଯାଞ୍ଚ','nav.history':'ପୁରୁଣା ଯାଞ୍ଚ',
      'nav.advisory':'ପରାମର୍ଶ','nav.handbook':'ରୋଗ ପୁସ୍ତିକା','nav.about':'ଅଫଲାଇନ ଓ ସାହାଯ୍ୟ',
      'nav.download':'ଆପ ଡାଉନଲୋଡ କରନ୍ତୁ',
      'head.chooseCrop':'ଆପଣଙ୍କ ଫସଲ କଣ?','head.weather':'ଆଜିର ପାଣିପାଗ',
      'head.mandi':'ନିକଟସ୍ଥ ବଜାର ଦର','head.scan':'ଫଟୋରୁ ରୋଗ ଯାଞ୍ଚ କରନ୍ତୁ',
      'head.recent':'ସାମ୍ପ୍ରତିକ ଯାଞ୍ଚ','head.result':'ସମଗ୍ର କ୍ଷେତର ଫଳ','head.advisory':'ପରାମର୍ଶ',
      'head.scores':'କେତେ ବିଶ୍ୱାସ','head.history':'ପୁରୁଣା ଯାଞ୍ଚ','head.guide':'ରୋଗ ପୁସ୍ତିକା',
      'head.install':'ଆପ ଫୋନରେ ନିଅନ୍ତୁ',
      'btn.takePhoto':'ଫଟୋ ଉଠାନ୍ତୁ','btn.choosePhoto':'ଫଟୋ ବାଛନ୍ତୁ','btn.scanAll':'ସବୁ ଯାଞ୍ଚ କରନ୍ତୁ',
      'btn.listen':'ଶୁଣନ୍ତୁ','btn.stop':'ବନ୍ଦ କରନ୍ତୁ','btn.retry':'ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ','btn.next':'ଆଗକୁ',
      'btn.back':'ପଛକୁ','btn.skip':'ଛାଡ଼ନ୍ତୁ','btn.done':'ହୋଇଗଲା','btn.viewAll':'ସବୁ ଦେଖନ୍ତୁ',
      'btn.clear':'ହଟାନ୍ତୁ','btn.changeLang':'ଭାଷା ବଦଳାନ୍ତୁ','btn.help':'ସାହାଯ୍ୟ',
      'st.modelReady':'ପ୍ରସ୍ତୁତ','st.modelLoading':'ପ୍ରସ୍ତୁତ ହେଉଛି…','st.chooseCrop':'ଫସଲ ବାଛନ୍ତୁ',
      'st.offline':'ଇଣ୍ଟରନେଟ ବିନା','st.scanning':'ଯାଞ୍ଚ ଚାଲିଛି…',
      'msg.needInternet':'ଏଥିପାଇଁ ଇଣ୍ଟରନେଟ ଦରକାର। ରୋଗ ଚିହ୍ନଟ ଇଣ୍ଟରନେଟ ବିନା ଚାଲିବ।',
      'msg.notLeaf':'ଏହା ପତ୍ରର ଫଟୋ ଲାଗୁନାହିଁ',
      'msg.notIdentified':'ଠିକ୍ ଭାବେ ଚିହ୍ନଟ ହୋଇପାରିଲା ନାହିଁ — ସ୍ପଷ୍ଟ ଫଟୋ ଉଠାନ୍ତୁ',
      'msg.chooseCropFirst':'ପ୍ରଥମେ ଆପଣଙ୍କ ଫସଲ ବାଛନ୍ତୁ',
    },

    'ur-IN': {

      /* Fasal ke naam — sirf chuni hui bhasha me dikhte hain */
      'crop.rice':'دھان',
      'net.offline':'انٹرنیٹ نہیں',
      'net.weak':'بہت سست انٹرنیٹ',
      'net.ok':'ٹھیک ٹھاک انٹرنیٹ',
      'net.good':'اچھا انٹرنیٹ',
      'crop.wheat':'گندم',
      'crop.sugarcane':'گنا',
      'crop.cotton':'کپاس',
      'crop.onion':'پیاز',
      'crop.maize':'مکئی',
      'crop.potato':'آلو',
      'crop.tomato':'ٹماٹر',
      'crop.mango':'آم',
      'crop.apple':'سیب',
      'nav.crops':'فصل منتخب کریں','nav.scan':'تصویر سے جانچ','nav.history':'پرانی جانچیں',
      'nav.advisory':'مشورہ','nav.handbook':'بیماری کی کتاب','nav.about':'آف لائن اور مدد',
      'nav.download':'ایپ ڈاؤن لوڈ کریں',
      'head.chooseCrop':'آپ کی فصل کون سی ہے؟','head.weather':'آج کا موسم',
      'head.mandi':'قریبی منڈی کے بھاؤ','head.scan':'تصویر سے بیماری جانچیں',
      'head.recent':'حالیہ جانچیں','head.result':'پورے کھیت کا نتیجہ','head.advisory':'مشورہ',
      'head.scores':'کتنا بھروسہ','head.history':'پرانی جانچیں','head.guide':'بیماری کی کتاب',
      'head.install':'ایپ فون میں لیں',
      'btn.takePhoto':'تصویر کھینچیں','btn.choosePhoto':'تصویر منتخب کریں','btn.scanAll':'سب جانچیں',
      'btn.listen':'سنیں','btn.stop':'روکیں','btn.retry':'دوبارہ کوشش کریں','btn.next':'آگے',
      'btn.back':'پیچھے','btn.skip':'چھوڑیں','btn.done':'ہو گیا','btn.viewAll':'سب دیکھیں',
      'btn.clear':'ہٹائیں','btn.changeLang':'زبان بدلیں','btn.help':'مدد',
      'st.modelReady':'تیار','st.modelLoading':'تیار ہو رہا ہے…','st.chooseCrop':'فصل منتخب کریں',
      'st.offline':'بغیر انٹرنیٹ','st.scanning':'جانچ جاری ہے…',
      'msg.needInternet':'اس کے لیے انٹرنیٹ چاہیے۔ بیماری کی پہچان بغیر انٹرنیٹ چلتی رہے گی۔',
      'msg.notLeaf':'یہ پتے کی تصویر نہیں لگتی',
      'msg.notIdentified':'ٹھیک سے پہچان نہیں ہو سکی — صاف تصویر لیں',
      'msg.chooseCropFirst':'پہلے اپنی فصل منتخب کریں',
    },
  };

  /* Jin bhashaon ka anuvaad abhi nahi hai — inme Hindi dikhegi. Jab koi
     native speaker text de de, bas upar uska block jod dein; yahan se naam
     apne aap hat jaayega kyunki STRINGS me key mil jaayegi. */
  const NOT_TRANSLATED_YET = ['as-IN','ne-IN','sa-IN','kok-IN','mai-IN',
                              'doi-IN','brx-IN','ks-IN','sat-IN','sd-IN','mni-IN'];

  const BASE = 'hi-IN';

  /* --------------------------------------------------------------------
   * t() — ek shabd ka anuvaad.
   * Chain: chuni hui bhasha -> हिन्दी -> key ka naam (taaki kabhi khali na dikhe)
   * ------------------------------------------------------------------ */
  function currentCode() {
    try {
      if (window.kmLang && window.kmLang.current) return window.kmLang.current().code;
      const p = JSON.parse(localStorage.getItem('km.preferences.v1') || '{}');
      return p.language || BASE;
    } catch (_) { return BASE; }
  }

  function t(key, code) {
    const lang = code || currentCode();
    const table = STRINGS[lang];
    if (table && table[key]) return table[key];
    const base = STRINGS[BASE];
    if (base && base[key]) return base[key];
    return key;                                  // key hi dikha do — dhoondhna aasan
  }

  /* --------------------------------------------------------------------
   * Page par laga do.
   * HTML me sirf itna likhna hai:  <span data-i18n="btn.listen">सुनो</span>
   * Attribute ke liye:             data-i18n-attr="aria-label:btn.help"
   * ------------------------------------------------------------------ */
  function apply(root) {
    const scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const val = t(key);
      // Sirf text badalte hain — andar ke icon/svg ko haath nahi lagate
      const holder = el.querySelector('[data-i18n-text]') || el;
      if (holder === el && el.children.length && !el.hasAttribute('data-i18n-force')) {
        // Bachche hain (jaise icon) — sirf pehla text node badlo
        const node = Array.from(el.childNodes).find((n) => n.nodeType === 3 && n.textContent.trim());
        if (node) { node.textContent = val; return; }
      }
      holder.textContent = val;
    });

    scope.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      String(el.getAttribute('data-i18n-attr')).split(',').forEach((pair) => {
        const bits = pair.split(':');
        if (bits.length === 2) el.setAttribute(bits[0].trim(), t(bits[1].trim()));
      });
    });
  }

  /* Bhasha badalte hi poora page dobara likh do */
  window.addEventListener('km:language', () => apply());

  window.kmI18n = {
    t: t,
    apply: apply,
    current: currentCode,
    STRINGS: STRINGS,
    /** Kaunsi bhashaon ka anuvaad abhi baaki hai (UI me Hindi dikhegi). */
    pending: NOT_TRANSLATED_YET,
    /** Team ke liye: kaunsi key kis bhasha me nahi hai. */
    missing: function (code) {
      const base = Object.keys(STRINGS[BASE]);
      const have = STRINGS[code] || {};
      return base.filter((k) => !have[k]);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => apply());
  } else {
    apply();
  }
})();
