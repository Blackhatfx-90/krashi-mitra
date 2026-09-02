import { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Clock, 
  MapPin, 
  Sparkles, 
  Building2, 
  FileSpreadsheet, 
  Filter, 
  Check, 
  ArrowRight,
  Phone,
  Eye,
  AlertCircle
} from 'lucide-react';
import { FIELD_VERIFICATION_QUEUE } from '../../data/maharashtraAgriData';
import { fetchLiveScans, updateScanStatus, scanToQueueItem } from '../../lib/api';

export default function FieldValidationQueue({ 
  onOpenBroadcastModal,
  currentLanguage 
}) {
  const [queue, setQueue] = useState(FIELD_VERIFICATION_QUEUE);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(FIELD_VERIFICATION_QUEUE[0]);
  const [showImageModal, setShowImageModal] = useState(false);

  /* --- LIVE: kisan app se aayi jaanchein ---------------------------------
   * Demo data waisa hi rehta hai (viva ke liye), uske UPAR live scans aati
   * hain. API na chale to kuch nahi bigadta — demo list dikhti rehti hai.  */
  const [liveInfo, setLiveInfo] = useState({ count: 0, storage: null, at: null });

  const loadLive = useCallback(async () => {
    const { ok, scans, storage } = await fetchLiveScans();
    if (!ok) return;
    const live = scans.map(scanToQueueItem);
    setQueue([...live, ...FIELD_VERIFICATION_QUEUE]);
    setLiveInfo({ count: live.length, storage, at: new Date() });
  }, []);

  useEffect(() => {
    loadLive();
    const t = setInterval(loadLive, 20000);   // har 20 sec — nayi scan apne aap
    return () => clearInterval(t);
  }, [loadLive]);

  /* Live scan ka faisla server par bhi likhna zaroori hai — warna page
     refresh karte hi wo dobara "pending" dikhne lagega. Demo wale items
     server par hain hi nahi, unpar yeh chalta nahi. */
  const pushStatus = (id, status, note) => {
    const item = queue.find(q => q.id === id);
    if (!item || !item.isLive) return;
    updateScanStatus(id, status, {
      reviewedBy: 'Dr. A. K. Gangwar (Joint Director Agri, Bareilly)',
      officerNote: note || '',
    });
  };

  // Handle Verify action
  const handleVerify = (id) => {
    pushStatus(id, 'verified', 'Ground-truth verified by district agronomist');
    setQueue(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'verified',
          verifiedBy: 'Dr. A. K. Gangwar (Joint Director Agri, Bareilly)'
        };
      }
      return item;
    }));
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(prev => ({
        ...prev,
        status: 'verified',
        verifiedBy: 'Dr. A. K. Gangwar (Joint Director Agri, Bareilly)'
      }));
    }
  };

  // Handle Refer to State Lab
  const handleReferLab = (id) => {
    const labName = 'Chandra Shekhar Azad (CSA) University of Agriculture & Tech, Kanpur';
    pushStatus(id, 'lab', 'Referred to ' + labName);
    setQueue(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'lab_referred',
          labName
        };
      }
      return item;
    }));
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(prev => ({
        ...prev,
        status: 'lab_referred',
        labName
      }));
    }
  };

  const filteredQueue = queue.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="agri-card p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>{currentLanguage === 'hi' ? 'कृषि विज्ञान केंद्र किसान स्कैन व सत्यापन कतार' : 'Field Validation & Ground-Truthing Queue'}</span>
              </h2>
              <span className="agri-chip agri-chip-blue text-xs">
                {queue.filter(q => q.status === 'pending').length} Pending Review
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {currentLanguage === 'hi' 
                ? 'कृषि मित्र मोबाइल ऐप से किसानों द्वारा भेजे गए पत्ती स्कैन, एआई निदान व विशेषज्ञ सत्यापन' 
                : 'Real-time farmer submissions from Krishi Mitra App awaiting agronomist review across UP districts'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none cursor-pointer"
            >
              <option value="all">All Verification Status</option>
              <option value="pending">⏳ Pending Review</option>
              <option value="verified">✅ Verified by KVK</option>
              <option value="lab_referred">🔬 Referred to State Lab</option>
            </select>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Queue on Left, Detail Inspection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Submission List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredQueue.map(item => {
            const isSelected = selectedItem?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`agri-card p-3.5 cursor-pointer transition-all border ${
                  isSelected 
                    ? 'border-green-600 bg-green-50/40 shadow-xs' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {item.crop === 'rice' ? '🌾' : item.crop === 'sugarcane' ? '🎋' : item.crop === 'potato' ? '🥔' : item.crop === 'mustard' ? '🌼' : item.crop === 'onion' ? '🧅' : '🌽'}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 leading-tight">
                        {item.farmerName}
                      </h4>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{item.district}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`agri-chip text-[10px] ${
                    item.status === 'verified' 
                      ? 'agri-chip-green' 
                      : item.status === 'lab_referred' 
                      ? 'agri-chip-blue' 
                      : 'agri-chip-amber'
                  }`}>
                    {item.status === 'verified' ? 'Verified' : item.status === 'lab_referred' ? 'Lab Referred' : 'Pending'}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-red-700 truncate max-w-[200px]">
                    {item.aiDetectedDisease}
                  </span>
                  <span className="text-[11px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                    {item.aiConfidence}% AI
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Deep Diagnostic Inspector (7 cols) */}
        {selectedItem ? (
          <div className="lg:col-span-7 agri-card p-5 space-y-4">
            
            {/* Header with Farmer info */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Submission ID: {selectedItem.id} • {selectedItem.submittedAt}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">
                  {selectedItem.farmerName}
                </h3>
                <p className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {selectedItem.village}, {selectedItem.district}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1 text-green-700 font-semibold">
                    <Phone className="w-3.5 h-3.5" />
                    {selectedItem.phone}
                  </span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-gray-900 block">
                  {selectedItem.cropName}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                  selectedItem.status === 'verified' 
                    ? 'bg-green-100 text-green-800' 
                    : selectedItem.status === 'lab_referred'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedItem.status === 'verified' 
                    ? `Verified by: ${selectedItem.verifiedBy}` 
                    : selectedItem.status === 'lab_referred'
                    ? `Lab: ${selectedItem.labName}`
                    : 'Pending Agronomist Action'}
                </span>
              </div>
            </div>

            {/* AI Diagnosis Result Card */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-green-700 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Teachable Machine & TFJS Prediction</span>
                </div>
                <span className="text-xs font-black text-green-700">
                  {selectedItem.aiConfidence}% Match Confidence
                </span>
              </div>

              <p className="text-sm font-black text-gray-900">
                {selectedItem.aiDetectedDisease}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Diagnostic Symptoms:</span> {selectedItem.leafSymptoms}
              </p>
            </div>

            {/* Farmer Uploaded Leaf Image */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Farmer Uploaded Scan Photo
              </span>
              <div className="relative rounded-xl overflow-hidden border border-gray-200 h-48 bg-gray-100">
                <img 
                  src={selectedItem.image} 
                  alt="Crop Scan"
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-semibold px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-green-400" />
                  <span>GPS: {selectedItem.gpsCoordinates.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Recommended CIBRC Protocol */}
            <div className="p-3 rounded-xl bg-green-50/70 border border-green-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-800">
                CIBRC Approved Treatment Protocol
              </span>
              <p className="text-xs text-green-900 font-semibold">
                {selectedItem.suggestedAction}
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedItem.status !== 'verified' && (
                  <button
                    onClick={() => handleVerify(selectedItem.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Verify</span>
                  </button>
                )}

                {selectedItem.status !== 'lab_referred' && (
                  <button
                    onClick={() => handleReferLab(selectedItem.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Refer to CSA / IVRI Lab</span>
                  </button>
                )}
              </div>

              <button
                onClick={onOpenBroadcastModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
              >
                <span>Broadcast Advisory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-7 agri-card p-12 flex flex-col items-center justify-center text-center text-gray-400">
            <CheckCircle2 className="w-12 h-12 stroke-1 text-gray-300 mb-2" />
            <p className="text-sm font-semibold">Select a farmer submission from the queue</p>
          </div>
        )}

      </div>

    </div>
  );
}
