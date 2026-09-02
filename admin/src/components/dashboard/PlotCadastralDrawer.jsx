import { useState } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Activity, 
  Send, 
  PackageCheck, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Phone,
  Ruler,
  Satellite,
  ShieldCheck
} from 'lucide-react';
import { WEBSITE_CROPS } from '../../data/multiStateAgriData';

export default function PlotCadastralDrawer({ 
  plot, 
  onClose, 
  onOpenBroadcastModal, 
  onOpenRequisitionModal,
  currentLanguage 
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!plot) return null;

  const isDiseased = plot.diseaseStatus === 'infected';
  const cropObj = WEBSITE_CROPS.find(c => c.id === plot.crop) || WEBSITE_CROPS[0];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-xs"
            style={{ backgroundColor: cropObj.color }}
          >
            {cropObj.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">
                {plot.khasraNo}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                isDiseased ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {isDiseased ? 'Alert: Infested' : 'Healthy Stand'}
              </span>
            </div>
            <h2 className="text-sm font-bold text-gray-900 leading-tight">
              {plot.farmerName}
            </h2>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4">
        {[
          { id: 'overview', label: currentLanguage === 'hi' ? 'खेत का रकबा व फसल' : 'Parcel & Crop Info' },
          { id: 'satellite', label: currentLanguage === 'hi' ? 'सैटेलाइट व रोग निदान' : 'Satellite & AI Health' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-green-600 text-green-800 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {activeTab === 'overview' ? (
          <>
            {/* Farmer Identification Card */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                भूस्वामी व काश्तकार विवरण (Farmer Details)
              </span>
              <p className="text-sm font-black text-gray-900">{plot.farmerName}</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{plot.village}, {plot.district}</span>
                </p>
                <p className="flex items-center gap-1.5 text-green-700 font-semibold">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{plot.phone}</span>
                </p>
              </div>
            </div>

            {/* Cadastral Acreage Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold uppercase text-gray-400">खेत का रकबा</span>
                <p className="text-base font-black text-gray-900 mt-0.5">{plot.areaAcres} Acres</p>
                <span className="text-[10px] text-gray-500">({plot.areaHa} Hectares)</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold uppercase text-gray-400">बोई गई फसल</span>
                <p className="text-base font-black text-gray-900 mt-0.5 flex items-center gap-1">
                  <span>{cropObj.icon}</span>
                  <span className="truncate">{cropObj.nameHi}</span>
                </p>
                <span className="text-[10px] text-green-700 font-semibold">{cropObj.nameEn}</span>
              </div>
            </div>

            {/* Sowing & Geo-Fence Coordinates */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-gray-600">
                <span className="font-semibold">बुवाई तिथि (Sowing Date):</span>
                <span className="font-bold text-gray-900">{plot.sowingDate}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600 pt-1 border-t border-gray-200/60">
                <span className="font-semibold">भू-सीमा बिंदु (Polygon Vertices):</span>
                <span className="font-bold text-gray-900">{plot.polygonCoordinates.length} GPS Coordinates</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Satellite Verification Status */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                  <Satellite className="w-4 h-4 text-blue-600" />
                  <span>High-Resolution Satellite Ground-Truthing</span>
                </div>
                <span className="text-[11px] font-black text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                  Sentinel-2 / Esri
                </span>
              </div>
              <p className="text-xs text-blue-900 font-medium">
                {plot.satelliteVisual}
              </p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-100">
                <span className="text-blue-800 font-semibold">Vegetation Health Index (NDVI):</span>
                <span className={`font-black ${plot.healthScore > 0.7 ? 'text-green-700' : 'text-red-700'}`}>
                  {plot.healthScore} ({plot.healthScore > 0.7 ? 'Vigorous Green' : 'Chlorotic / Stress'})
                </span>
              </div>
            </div>

            {/* AI Crop Disease Diagnostics */}
            <div className={`p-3.5 rounded-2xl border space-y-2 ${
              isDiseased 
                ? 'bg-red-50/80 border-red-200 text-red-900' 
                : 'bg-green-50/80 border-green-200 text-green-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {isDiseased ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  <span>{isDiseased ? 'AI Confirmed Pathogen Infestation' : 'Healthy Crop Confirmed'}</span>
                </div>
                <span className="text-xs font-black px-2 py-0.5 bg-white rounded border">
                  {plot.aiConfidence}% AI Score
                </span>
              </div>

              <p className="text-sm font-black">
                {plot.detectedDisease}
              </p>
            </div>
          </>
        )}

      </div>

      {/* Drawer Action Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/80 flex flex-col gap-2">
        <button
          onClick={() => {
            onOpenBroadcastModal();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send Advisory SMS/Push to {plot.farmerName.split(' ')[0]}</span>
        </button>

        <button
          onClick={() => {
            onOpenRequisitionModal();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-colors"
        >
          <PackageCheck className="w-3.5 h-3.5 text-amber-700" />
          <span>Dispatch Buffer Bio-Control to {plot.district}</span>
        </button>
      </div>

    </div>
  );
}
