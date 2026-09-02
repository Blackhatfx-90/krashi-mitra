import { useState } from 'react';
import { broadcastAdvisory } from '../../lib/api';
import { 
  Send, 
  Globe2, 
  MessageSquare, 
  Radio, 
  PhoneCall, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Users, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { ADVISORY_TEMPLATES, CROPS_CONFIG, UP_DIVISIONS } from '../../data/maharashtraAgriData';

export default function AdvisoryBroadcast({ initialData, currentLanguage }) {
  const [selectedTemplate, setSelectedTemplate] = useState(ADVISORY_TEMPLATES[0]);
  const [targetDivision, setTargetDivision] = useState('all');
  const [targetCrop, setTargetCrop] = useState(ADVISORY_TEMPLATES[0].crop);
  const [langTab, setLangTab] = useState('hi'); // hi, en
  const [channels, setChannels] = useState({
    push: true,
    sms: true,
    ivrs: false
  });
  const [customText, setCustomText] = useState(ADVISORY_TEMPLATES[0].bodyHi);
  const [isSending, setIsSending] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);
  const [sendResult, setSendResult] = useState(null);   // API ka asli jawab

  const handleTemplateChange = (tpl) => {
    setSelectedTemplate(tpl);
    setTargetCrop(tpl.crop);
    if (langTab === 'hi') setCustomText(tpl.bodyHi);
    else setCustomText(tpl.bodyEn);
  };

  const handleLangSwitch = (lang) => {
    setLangTab(lang);
    if (lang === 'hi') setCustomText(selectedTemplate.bodyHi);
    else setCustomText(selectedTemplate.bodyEn);
  };

  /* Pehle yeh sirf 1.2 second ka nakli wait tha. Ab chetavni SACH ME
     /api/advisories par jaati hai aur kisan ki app use upar dikha deti hai. */
  const handleSend = async () => {
    setIsSending(true);
    setSendResult(null);

    const res = await broadcastAdvisory({
      crop: targetCrop || 'all',
      cropNameHi: selectedTemplate.cropNameHi || '',
      district: targetDivision === 'all' ? 'all' : targetDivision,
      severity: selectedTemplate.severity || 'warning',
      titleHi: selectedTemplate.titleHi || selectedTemplate.title || 'कृषि विभाग की सलाह',
      messageHi: langTab === 'hi' ? customText : (selectedTemplate.bodyHi || customText),
      messageEn: langTab === 'en' ? customText : (selectedTemplate.bodyEn || ''),
      chemical: selectedTemplate.chemical || '',
      cibrcApproved: true,
      issuedBy: 'Dr. A. K. Gangwar (Joint Director Agriculture)',
    });

    if (!res || !res.ok) console.warn('[advisory] kisan app tak nahi pahunchi:', res && res.error);
    else console.info('[advisory] kisan app par bhej di:', res.id, '| storage:', res.storage);

    setSendResult(res);
    setIsSending(false);
    setBroadcastDone(true);
    setTimeout(() => setBroadcastDone(false), 5000);
  };

  return (
    <div className="space-y-4">
      
      {/* Success notification */}
      {broadcastDone && (
        <div className="p-4 rounded-xl bg-green-900 text-white flex items-center justify-between border border-green-700 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-bold">
                {sendResult && sendResult.ok
                  ? 'Advisory किसान ऐप पर live भेज दी गई'
                  : 'Advisory भेजी गई — पर किसान ऐप तक नहीं पहुँची'}
              </p>
              <p className="text-xs text-green-200">
                {sendResult && sendResult.ok
                  ? sendResult.id + ' — ' + selectedTemplate.targetTalukas.join(', ') +
                    ' के किसानों की ऐप में यह चेतावनी ऊपर दिखेगी।'
                  : 'सर्वर तक नहीं पहुँच पाई (API बंद या नेटवर्क नहीं)। दोबारा कोशिश करें।'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="agri-card p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-green-600" />
                <span>{currentLanguage === 'hi' ? 'लक्षित बहुभाषी कृषि परामर्श व आईपीएम प्रसारण केंद्र' : 'Targeted Multilingual Advisory & IPM Broadcast Center'}</span>
              </h2>
              <span className="agri-chip agri-chip-green text-xs">
                CIBRC Approved Protocols
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {currentLanguage === 'hi' 
                ? 'कृषि वैज्ञानिकों द्वारा सत्यापित एकीकृत कीट प्रबंधन (IPM) व दवा छिड़काव परामर्श को किसानों के मोबाइल पर प्रसारित करें' 
                : 'Broadcast verified Integrated Pest Management (IPM) advisories, dosages, and safety alerts in Hindi and English across UP'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200">
              Active Reach: <strong>~18,420 Farmers in UP</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Preset Templates (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              CIBRC Approved Protocols
            </span>
            <span className="text-[11px] text-gray-400">Select to Load</span>
          </div>

          <div className="space-y-2.5">
            {ADVISORY_TEMPLATES.map(tpl => {
              const isSelected = selectedTemplate.id === tpl.id;

              return (
                <div
                  key={tpl.id}
                  onClick={() => handleTemplateChange(tpl)}
                  className={`agri-card p-3.5 cursor-pointer border transition-all ${
                    isSelected
                      ? 'border-green-600 bg-green-50/50 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        {tpl.cropName}
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 leading-snug mt-0.5">
                        {tpl.titleHi}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{tpl.titleEn}</p>
                    </div>

                    <span className="agri-chip agri-chip-red text-[10px] shrink-0 font-bold">
                      {tpl.severity}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
                    <span>Dose: <strong>{tpl.cibrcDose}</strong></span>
                    <span className="font-semibold text-amber-700">PHI: {tpl.phiDays} Days</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Composer & Broadcast Controls (7 cols) */}
        <div className="lg:col-span-7 agri-card p-5 space-y-4">
          
          {/* Target Audience Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">
                Target Division / District
              </label>
              <select
                value={targetDivision}
                onChange={(e) => setTargetDivision(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-lg p-2 outline-none"
              >
                {UP_DIVISIONS.map(d => (
                  <option key={d.id} value={d.id}>{d.nameEn}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">
                Target Crop Belt
              </label>
              <select
                value={targetCrop}
                onChange={(e) => setTargetCrop(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-lg p-2 outline-none font-bold text-green-700"
              >
                {CROPS_CONFIG.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.nameEn}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Multilingual Editor Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-1">
                {[
                  { id: 'hi', label: 'हिंदी (Hindi)' },
                  { id: 'en', label: 'English' }
                ].map(l => (
                  <button
                    key={l.id}
                    onClick={() => handleLangSwitch(l.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      langTab === l.id 
                        ? 'bg-green-600 text-white shadow-2xs' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-gray-400 font-medium">
                Characters: {customText.length}
              </span>
            </div>

            {/* Advisory Message Textarea */}
            <textarea
              rows={7}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-600 focus:bg-white transition-all leading-relaxed font-mono text-gray-800"
              placeholder="Compose advisory message..."
            />
          </div>

          {/* Delivery Channels Checklist */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
              Dissemination Channels
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.push}
                  onChange={(e) => setChannels({ ...channels, push: e.target.checked })}
                  className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
                />
                <span>Krishi Mitra App Push Alert</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                  className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
                />
                <span>Kisan SMS Gateway</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.ivrs}
                  onChange={(e) => setChannels({ ...channels, ivrs: e.target.checked })}
                  className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
                />
                <span>Voice Call Alert (IVRS)</span>
              </label>
            </div>
          </div>

          {/* Dispatch Button */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>Signed by UP Plant Protection Officer</span>
            </div>

            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Transmitting Broadcast...' : 'Broadcast to UP Farmers'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
