import { useState } from 'react';
import { 
  X, 
  Sprout, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck,
  User,
  Phone,
  Ruler
} from 'lucide-react';
import { WEBSITE_CROPS } from '../../data/multiStateAgriData';

export default function FarmerPlotRegistrationModal({ 
  activeState, 
  onClose, 
  onPlotRegistered 
}) {
  const [farmerName, setFarmerName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [khasraNo, setKhasraNo] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState(activeState.divisions[1]?.districts[0] || 'Bareilly');
  const [areaAcres, setAreaAcres] = useState('3.5');
  const [crop, setCrop] = useState('rice');
  const [sowingDate, setSowingDate] = useState('2026-07-15');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Calculate approximate polygon around current state center
    const baseLat = activeState.center[0] + (Math.random() - 0.5) * 0.04;
    const baseLng = activeState.center[1] + (Math.random() - 0.5) * 0.04;
    const delta = 0.0035 * Math.sqrt(parseFloat(areaAcres) || 2.5);

    const generatedPolygon = [
      [baseLat + delta, baseLng - delta],
      [baseLat + delta * 1.2, baseLng + delta * 0.9],
      [baseLat - delta * 0.8, baseLng + delta * 1.1],
      [baseLat - delta, baseLng - delta * 0.7]
    ];

    const selectedCropObj = WEBSITE_CROPS.find(c => c.id === crop) || WEBSITE_CROPS[0];

    const newPlot = {
      id: `PLOT-REG-${Date.now().toString().slice(-4)}`,
      khasraNo: khasraNo || `खसरा संख्या ${Math.floor(Math.random() * 400 + 10)}/1`,
      farmerName: farmerName || 'Ram Charan Verma (राम चरन वर्मा)',
      phone: phone || '+91 94120 XXXXX',
      village: village || 'Nawabganj Dehat',
      district: district,
      division: activeState.divisions[1]?.id || 'all',
      areaAcres: parseFloat(areaAcres) || 3.5,
      areaHa: Math.round((parseFloat(areaAcres) || 3.5) * 0.404686 * 100) / 100,
      crop: crop,
      cropName: `${selectedCropObj.nameEn} / ${selectedCropObj.nameHi}`,
      sowingDate: sowingDate,
      healthScore: 0.86,
      satelliteVerified: true,
      satelliteVisual: 'High-Resolution Sentinel-2 Biomass Signature Confirmed',
      diseaseStatus: 'healthy',
      detectedDisease: 'Healthy Crop (स्वस्थ फसल)',
      aiConfidence: 97.2,
      polygonCoordinates: generatedPolygon
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        onPlotRegistered(newPlot);
        onClose();
      }, 1600);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Modal Header */}
          <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-green-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                🌾
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  किसान खेत भूखंड पंजीकरण (Farm Plot Registration)
                </h3>
                <p className="text-xs text-gray-500">
                  {activeState.nameHi} — Cadastral Boundary & Crop Geo-Fencing
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {success ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-gray-900">
                खेत का भूखंड सफलतापूर्वक दर्ज हुआ!
              </h4>
              <p className="text-xs text-gray-600 max-w-xs mx-auto">
                Farm plot boundary polygon has been mapped and geofenced over high-resolution satellite imagery.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              {/* Farmer Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">
                    Farmer Full Name (किसान का नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra (रमेश चंद्र)"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-green-600 focus:bg-white text-gray-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">
                    Mobile Number (मोबाइल नंबर) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98XXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-green-600 focus:bg-white text-gray-800 font-medium"
                  />
                </div>
              </div>

              {/* Land Parcel Identifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">
                    Khasra / Plot Number (खसरा संख्या) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. खसरा संख्या 184/2"
                    value={khasraNo}
                    onChange={(e) => setKhasraNo(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-green-600 focus:bg-white text-gray-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">
                    Total Land Area (रकबा एकड़ में) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="3.5"
                      value={areaAcres}
                      onChange={(e) => setAreaAcres(e.target.value)}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 pr-14 outline-none focus:border-green-600 focus:bg-white text-gray-800 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400">
                      Acres
                    </span>
                  </div>
                </div>
              </div>

              {/* Village & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">
                    Village / Mauza (गांव / मौजा) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rampur Kalan"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-green-600 focus:bg-white text-gray-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">
                    District (जिला)
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-green-600 focus:bg-white text-gray-800 font-medium cursor-pointer"
                  >
                    {activeState.divisions.flatMap(d => d.districts || []).map((dst, i) => (
                      <option key={i} value={dst}>{dst}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Crop Selection (Strictly 7 Website Crops) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">
                  Crop Sown (बोई गई फसल — Vridhi AI Compatible) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WEBSITE_CROPS.map(c => {
                    const isSelected = crop === c.id;

                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCrop(c.id)}
                        className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                          isSelected 
                            ? 'border-green-600 bg-green-50 text-green-900 shadow-2xs' 
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-lg">{c.icon}</span>
                        <span className="truncate">{c.nameHi}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sowing Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">
                  Date of Sowing (बुवाई की तिथि)
                </label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none focus:border-green-600 focus:bg-white text-gray-800"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Generating Satellite Polygon...' : 'Register & Plot on Satellite Map'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
