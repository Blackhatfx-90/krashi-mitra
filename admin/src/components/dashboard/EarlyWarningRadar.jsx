import { useEffect, useState } from 'react';
import { Activity, Send, AlertTriangle, MapPin, Info, Clock } from 'lucide-react';
import { fetchStats } from '../../lib/api';

/* ============================================================================
 * Kshetriya "Early Warning" — jo dikh raha hai, wo hi dikhate hain
 *
 * PEHLE KYA THA
 *   Yeh screen "7-Day Weather Epidemic Risk Radar / Predictive AI Modeling"
 *   kehkar zilewaar jokhim ka pratishat dikhati thi (e.g. "Nashik 87%,
 *   projected outbreak: Leaf Blast"). Wo saara data ek JS file me haath se
 *   likha hua tha. Koi model nahi tha, koi mausam ka joda hua data nahi tha.
 *
 *   Yeh sirf galat nahi — KHATARNAK tha. Ek adhikari is number ko dekhkar
 *   poore zile me chhidkav ka aadesh de sakta hai. Farzi bhavishyavani par
 *   asli kheton me asli dawa girti hai.
 *
 * AB KYA HAI
 *   Sirf wo jo hum SACH ME jaante hain — kisano ki bheji hui jaanchon se
 *   bane cluster. Yeh "bhavishyavani" nahi, "abhi zameen par kya ho raha
 *   hai" hai. Aur hum yeh saaf likhte hain.
 *
 *   Mausam-aadharit bhavishyavani tab judegi jab IMD ka data aur kisi krishi
 *   vishwavidyalaya ka jaancha hua rog-model juda ho. Tab tak wo khana
 *   khaali hai, bhara hua jhooth nahi.
 * ========================================================================= */

export default function EarlyWarningRadar({ onOpenBroadcastModal, currentLanguage }) {
  const hi = currentLanguage === 'hi';
  const [clusters, setClusters] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const d = await fetchStats();
      if (!alive) return;
      if (d && d.ok) { setClusters(d.clusters || []); setState('ok'); }
      else setState(d && d.error === 'login' ? 'login' : 'error');
    };
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const since = (iso) => {
    if (!iso) return '';
    const h = Math.round((Date.now() - Date.parse(iso)) / 3600000);
    if (h < 1) return hi ? 'अभी-अभी' : 'just now';
    if (h < 24) return h + (hi ? ' घंटे पहले' : 'h ago');
    return Math.round(h / 24) + (hi ? ' दिन पहले' : 'd ago');
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="agri-card p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span>{hi ? 'रोग समूह (क्लस्टर) — अभी की स्थिति' : 'Disease Clusters — Observed Now'}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {hi
                ? 'किसानों की ऐप से आई असली जाँचों से बने समूह — 14 दिन में एक ही ज़िले में एक ही रोग की रिपोर्ट करने वाले 3 या ज़्यादा अलग-अलग किसान। एक ही किसान की बार-बार की जाँच एक ही गिनी जाती है।'
                : 'Built from real farmer scans — 3+ distinct farmers reporting the same disease in one district within 14 days. Repeat scans by one farmer count once.'}
            </p>
          </div>

          <button
            onClick={onOpenBroadcastModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{hi ? 'चेतावनी भेजें' : 'Broadcast advisory'}</span>
          </button>
        </div>
      </div>

      {/* Bhavishyavani abhi nahi hai — chhupate nahi, saaf likhte hain */}
      <div className="agri-card p-4 flex gap-3 bg-gray-50/70">
        <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700 leading-relaxed">
          <p className="font-bold text-gray-900">
            {hi ? 'मौसम-आधारित पूर्वानुमान अभी उपलब्ध नहीं है' : 'Weather-based prediction is not available yet'}
          </p>
          <p className="mt-1">
            {hi
              ? 'लक्षण दिखने से पहले चेतावनी देने के लिए IMD का मौसम डेटा और किसी कृषि विश्वविद्यालय का जाँचा हुआ रोग-मॉडल जोड़ना ज़रूरी है। जब तक वे नहीं जुड़ते, यहाँ अनुमानित जोखिम प्रतिशत नहीं दिखाया जाएगा — क्योंकि उस पर पूरे ज़िले में छिड़काव का आदेश दिया जा सकता है।'
              : 'Pre-symptom warnings need IMD weather feeds plus a validated pathogen model from an agricultural university. Until those are wired, no predicted risk percentages are shown here — an officer could order district-wide spraying on such a number.'}
          </p>
        </div>
      </div>

      {state === 'login' && (
        <div className="agri-card p-4 text-xs font-semibold text-amber-800 bg-amber-50 border-amber-200">
          {hi ? 'सत्र समाप्त — दोबारा लॉगिन कीजिए।' : 'Session expired — please log in again.'}
        </div>
      )}
      {state === 'error' && (
        <div className="agri-card p-4 text-xs font-semibold text-gray-600">
          {hi ? 'आँकड़े नहीं आ पाए। एक मिनट में दोबारा कोशिश होगी।' : 'Could not load data. Retrying in a minute.'}
        </div>
      )}
      {state === 'loading' && (
        <div className="agri-card p-4 text-xs text-gray-500">
          {hi ? 'आँकड़े आ रहे हैं…' : 'Loading…'}
        </div>
      )}

      {state === 'ok' && clusters && clusters.length === 0 && (
        <div className="agri-card p-6 text-center space-y-1">
          <p className="text-sm font-bold text-gray-900">
            {hi ? 'अभी कोई रोग समूह नहीं मिला' : 'No disease clusters right now'}
          </p>
          <p className="text-xs text-gray-500">
            {hi
              ? 'यह अच्छी ख़बर है। समूह तभी बनता है जब एक ही ज़िले में एक ही रोग की तीन या ज़्यादा जाँचें आएँ।'
              : 'That is good news. A cluster forms only when three or more reports of the same disease arrive from one district.'}
          </p>
        </div>
      )}

      {state === 'ok' && clusters && clusters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clusters.map((c, i) => {
            const critical = c.severity === 'critical';
            return (
              <div
                key={c.district + c.disease + i}
                className={`agri-card p-5 space-y-3 border ${
                  critical ? 'border-red-200/80 bg-red-50/10' : 'border-amber-200/80 bg-amber-50/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{c.district}
                    </span>
                    <h3 className="text-sm lg:text-base font-bold text-gray-900 leading-snug mt-0.5">
                      {c.disease}
                    </h3>
                    <p className="text-[11px] text-gray-500">{c.cropNameHi || c.crop}</p>
                  </div>

                  {/* KISAN ki ginti bada number hai, jaanch ki nahi. Ek hi
                      kisan 10 baar photo khinche to wo prakop nahi hai —
                      failav kitne KHETON me hai, wahi maayne rakhta hai.
                      Jaanch ki ginti chhoti karke neeche, kyunki
                      "3 kisan / 20 jaanch" aur "3 kisan / 3 jaanch" do alag
                      haalat hain. */}
                  <div className="text-right shrink-0">
                    <span className={`text-lg font-black ${critical ? 'text-red-700' : 'text-amber-700'}`}>
                      {c.farmerCount ?? c.scanCount}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {hi ? 'किसान' : 'farmers'}
                    </p>
                    {c.scanCount !== undefined && c.scanCount !== c.farmerCount && (
                      <p className="text-[10px] text-gray-400">
                        {c.scanCount}{hi ? ' जाँचें' : ' scans'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-200/80 text-xs space-y-1">
                  <p className="text-gray-700">
                    <span className="font-semibold">{hi ? 'गाँव:' : 'Villages:'}</span>{' '}
                    {c.villageCount
                      ? c.villages.join(', ') + (c.villageCount > c.villages.length ? ' …' : '')
                      : (hi ? 'किसानों ने गाँव नहीं भरा' : 'not provided by farmers')}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">{hi ? 'ऐप का औसत भरोसा:' : 'Avg app confidence:'}</span>{' '}
                    {c.avgConfidence}%
                  </p>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {hi ? 'आख़िरी रिपोर्ट: ' : 'Last report: '}{since(c.lastReportedAt)}
                  </p>
                </div>

                {c.confirmed && (
                  <p className="text-[11px] font-bold text-green-700">
                    {hi ? '✓ विभाग ने इनमें से कुछ जाँचें ख़ुद सत्यापित की हैं'
                        : '✓ Some of these were verified by the department'}
                  </p>
                )}

                {critical && (
                  <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 text-[11px] text-red-900 flex gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      {hi
                        ? 'यह समूह बड़ा है। भेजने से पहले क्षेत्र सत्यापन कराएँ — ऐप का भरोसा प्रयोगशाला की पुष्टि नहीं है।'
                        : 'Large cluster. Get field verification before acting — app confidence is not a lab confirmation.'}
                    </span>
                  </div>
                )}

                <button
                  onClick={onOpenBroadcastModal}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{hi ? c.district + ' को सलाह भेजें' : 'Advise ' + c.district}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
