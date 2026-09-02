import { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Users, 
  Activity, 
  CloudRain, 
  Send, 
  PackageCheck, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function ClusterDetailDrawer({ 
  cluster, 
  onClose, 
  onOpenRequisitionModal, 
  onOpenBroadcastModal,
  currentLanguage 
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!cluster) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {cluster.crop === 'rice' ? '🌾' : cluster.crop === 'sugarcane' ? '🎋' : cluster.crop === 'mustard' ? '🌼' : cluster.crop === 'potato' ? '🥔' : '🌽'}
          </span>
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">
              {cluster.id} • {cluster.district}
            </span>
            <h2 className="text-sm font-bold text-gray-900 leading-tight">
              {cluster.cropName}
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
          { id: 'overview', label: currentLanguage === 'hi' ? 'निदान व लक्षण' : 'Diagnostics & Symptoms' },
          { id: 'actions', label: currentLanguage === 'hi' ? 'नियंत्रण कार्ययोजना' : 'Containment Protocol' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-green-600 text-green-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Drawer Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Outbreak Status Banner */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          cluster.severity === 'critical' 
            ? 'bg-red-50/80 border-red-200 text-red-900' 
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">{cluster.status}</p>
              <p className="text-[11px] opacity-80">{cluster.spreadVelocity}</p>
            </div>
          </div>
          <span className="text-xs font-black px-2 py-0.5 rounded bg-white border border-red-200 text-red-700">
            {cluster.confidenceScore}% AI Confidence
          </span>
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* Disease Identification */}
            <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                पहचाना गया रोग / Confirmed Pathogen
              </span>
              <p className="text-sm font-black text-gray-900">
                {cluster.disease}
              </p>
              <p className="text-xs text-green-700 font-medium">
                Pathogen Class: <span className="font-bold uppercase">{cluster.pathogenType}</span>
              </p>
            </div>

            {/* Field Footprint Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold uppercase text-gray-400">प्रभावित रकबा</span>
                <p className="text-base font-black text-gray-900 mt-0.5">{cluster.affectedAreaHa} Ha</p>
                <span className="text-[10px] text-gray-500">Geospatial Radius</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold uppercase text-gray-400">प्रभावित किसान</span>
                <p className="text-base font-black text-gray-900 mt-0.5">{cluster.farmersAffected}</p>
                <span className="text-[10px] text-gray-500">Krishi Mitra Scans</span>
              </div>
            </div>

            {/* Weather Multiplier */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                <span>मौसम ट्रिगर (Micro-Climate Catalyst)</span>
              </div>
              <p className="text-xs text-blue-800 font-medium">
                {cluster.weatherTrigger}
              </p>
            </div>

            {/* Supply Deficit Warning */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                संसाधन कमी (Supply Deficit Alert)
              </span>
              <p className="text-xs text-amber-900 font-semibold">
                {cluster.requisitionDeficit}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* IPM Containment Protocol */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                मान्यता प्राप्त एकीकृत कीट प्रबंधन (IPM Action)
              </span>
              <div className="p-3 rounded-xl bg-green-50/80 border border-green-200 text-xs font-semibold text-green-900 leading-relaxed">
                {cluster.primaryAction}
              </div>
            </div>

            {/* Recommended UP State Diagnostic Labs */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                संबद्ध कृषि विश्वविद्यालय व जांच प्रयोगशाला
              </span>
              <ul className="text-xs text-gray-700 space-y-1 font-medium list-disc list-inside">
                <li>ICAR - Indian Veterinary & Agri Research Institute, Bareilly</li>
                <li>UP Council of Sugarcane Research (UPCSR), Shahjahanpur</li>
                <li>Chandra Shekhar Azad (CSA) University of Agri & Tech, Kanpur</li>
                <li>Sardar Vallabhbhai Patel University (SVPUAT), Meerut</li>
              </ul>
            </div>
          </>
        )}

      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/80 flex flex-col gap-2">
        <button
          onClick={() => {
            onOpenBroadcastModal();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Broadcast Targeted Advisory to {cluster.district}</span>
        </button>

        <button
          onClick={() => {
            onOpenRequisitionModal();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-colors"
        >
          <PackageCheck className="w-3.5 h-3.5 text-amber-700" />
          <span>Trigger Emergency Stock Dispatch</span>
        </button>
      </div>

    </div>
  );
}
