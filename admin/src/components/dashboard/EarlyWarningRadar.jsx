import { useState } from 'react';
import { 
  Activity, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  Layers, 
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { EPIDEMIC_RISK_FORECAST } from '../../data/maharashtraAgriData';

export default function EarlyWarningRadar({ 
  onOpenBroadcastModal,
  currentLanguage 
}) {
  const [forecasts] = useState(EPIDEMIC_RISK_FORECAST);

  return (
    <div className="space-y-4">
      
      {/* Header Card */}
      <div className="agri-card p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600 animate-pulse" />
                <span>{currentLanguage === 'hi' ? '७-दिवसीय मौसम-रोग प्रकोप जोखिम रडार' : '7-Day Weather Epidemic Risk Radar'}</span>
              </h2>
              <span className="agri-chip agri-chip-amber text-xs">
                Predictive AI Modeling
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {currentLanguage === 'hi' 
                ? 'तापमान, आर्द्रता, वर्षा व ओस पूर्वानुमान से पत्तियों पर लक्षण दिखने से ४८ घंटे पूर्व रोग प्रसार की चेतावनी' 
                : 'Micro-climate correlation with pathogen incubation periods across Uttar Pradesh agro-climatic zones'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBroadcastModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Pre-Symptom Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Weather Risk Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forecasts.map(f => {
          const isCritical = f.riskLevel === 'critical';

          return (
            <div 
              key={f.id} 
              className={`agri-card p-5 space-y-4 border transition-all hover:shadow-md ${
                isCritical ? 'border-red-200/80 bg-red-50/10' : 'border-amber-200/80 bg-amber-50/10'
              }`}
            >
              {/* Header: District & Risk Score */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {f.id} • {f.targetCrop}
                  </span>
                  <h3 className="text-sm lg:text-base font-bold text-gray-900 leading-snug mt-0.5">
                    {f.district}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                    <span className="text-lg font-black text-red-700">{f.riskScore}%</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-red-600 tracking-wider">
                    {f.riskLevel}
                  </span>
                </div>
              </div>

              {/* Primary Threat Identification */}
              <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  पूर्वानुमानित रोग / Projected Outbreak
                </span>
                <p className="text-xs lg:text-sm font-bold text-red-800">
                  {f.primaryThreat}
                </p>
                <p className="text-[11px] text-gray-600">
                  <span className="font-semibold text-gray-700">Incubation Phase:</span> {f.pestLifeCyclePhase}
                </p>
              </div>

              {/* Weather Trigger Details */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  <span>Weather Multiplier Trigger</span>
                </div>
                <p className="text-[11px] text-blue-800 font-medium">
                  {f.forecastTrigger}
                </p>
              </div>

              {/* Action Window & Advisory */}
              <div className="p-3 bg-green-50/70 rounded-xl border border-green-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-green-800">
                  <Sparkles className="w-3.5 h-3.5 text-green-600" />
                  <span>Pre-Symptomatic Preventive Window</span>
                </div>
                <p className="text-[11px] text-green-900 font-semibold">
                  {f.recommendedWindow}
                </p>
              </div>

              {/* Multilingual Pre-Formatted SMS / Push Alert */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Automated Farmer Push Message (Hindi / English)
                </span>
                <p className="text-xs font-bold text-gray-900">
                  {f.alertMessageHi}
                </p>
                <p className="text-[11px] text-gray-600 italic">
                  {f.alertMessageEn}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                <button
                  onClick={onOpenBroadcastModal}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Push Pre-Symptom Advisory to {f.district}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
