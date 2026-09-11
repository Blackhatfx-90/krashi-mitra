import { useState, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Send, 
  Download, 
  Search, 
  Filter, 
  Truck, 
  Sparkles, 
  Layers, 
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Building2,
  DollarSign
} from 'lucide-react';
import { DEMAND_SUPPLY_INVENTORY } from '../../data/maharashtraAgriData';

export default function DemandForecasting({ 
  onOpenRequisitionModal, 
  currentLanguage 
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Category Filter list
  const categories = [
    { id: 'all', label: currentLanguage === 'hi' ? 'सभी संसाधन' : 'All Resources', icon: '📦' },
    { id: 'bio_control', label: currentLanguage === 'hi' ? 'जैव-कीटनाशक व फेरोमोन ट्रैप' : 'Bio-Pesticides & Traps', icon: '🌿' },
    { id: 'chemical_inputs', label: currentLanguage === 'hi' ? 'अनुमोदित रासायनिक दवाएं' : 'Targeted Chemical Inputs', icon: '⚗️' },
    { id: 'mechanization', label: currentLanguage === 'hi' ? 'ड्रोन फ्लीट व मशीनरी' : 'Drone Fleets & Sprayers', icon: '🛸' },
    { id: 'expert_staff', label: currentLanguage === 'hi' ? 'केवीके विशेषज्ञ व जांच दल' : 'Field Officers & Diagnostic Kits', icon: '🧑‍🔬' }
  ];

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    return DEMAND_SUPPLY_INVENTORY.filter(item => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = item.name.toLowerCase().includes(q) ||
                      item.targetCrop.toLowerCase().includes(q) ||
                      item.targetPest.toLowerCase().includes(q) ||
                      item.priorityDistricts.some(d => d.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [activeCategory, severityFilter, searchQuery]);

  // Overall Statistics
  const totalDeficitCount = DEMAND_SUPPLY_INVENTORY.filter(i => i.severity === 'critical').length;

  return (
    <>
      {/* Ye poori screen NAMOONA data par chalti hai. Godaam ka stock, dawa
          ki kami, aur maang ka anuman kisi asli supply system se nahi aata
          — koi aisa system abhi juda hi nahi hai. Adhikari iske aadhar par
          requisition bhej sakta hai, isliye chhupana khatarnak hai. */}
      <div className="agri-card p-3.5 mb-4 bg-amber-50 border-amber-200 text-xs text-amber-900">
        <b>यह नमूना (demo) डेटा है।</b> गोदाम का स्टॉक, दवा की कमी और माँग का
        अनुमान अभी किसी असली आपूर्ति प्रणाली से नहीं जुड़ा है। इन आँकड़ों पर
        ख़रीद या माँग-पत्र (requisition) का निर्णय न लें।
      </div>
    <div className="space-y-4">
      
      {/* Top Header & Export Banner */}
      <div className="agri-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                <span>{currentLanguage === 'hi' ? 'कृषि संसाधन मांग व आपूर्ति पूर्वानुमान' : 'Agricultural Resource Demand & Supply Forecasting'}</span>
              </h2>
              <span className="agri-chip agri-chip-red text-xs">
                {totalDeficitCount} Critical Deficits
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {currentLanguage === 'hi' 
                ? 'उद्रेक के आधार पर एआई द्वारा आकलित कीटनाशक व जैव-नियंत्रक मांग बनाम उत्तर प्रदेश राज्य गोदाम स्टॉक' 
                : 'AI-projected input demand vs. regional warehouse inventory to prevent crop protection stock-outs across Uttar Pradesh Grid'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenRequisitionModal(null)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>1-Click Buffer Requisition</span>
            </button>

            <button
              onClick={() => alert('Exporting Official Uttar Pradesh Agriculture Resource Demand Manifest (PDF / XLSX)...')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Export Manifest</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Capsules */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-[11px] font-semibold text-gray-500">Total Tracked SKUs</span>
            <p className="text-lg font-black text-gray-900 mt-0.5">{DEMAND_SUPPLY_INVENTORY.length} Items</p>
            <span className="text-[10px] text-green-700 font-medium">All 7 UP Website Crops</span>
          </div>

          <div className="p-3 bg-red-50/60 rounded-xl border border-red-100">
            <span className="text-[11px] font-semibold text-red-600">Active Deficit Hotspots</span>
            <p className="text-lg font-black text-red-700 mt-0.5">{totalDeficitCount} Critical</p>
            <span className="text-[10px] text-red-600 font-medium">Immediate transfer needed</span>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-600">Bio-Control Ratio</span>
            <p className="text-lg font-black text-blue-800 mt-0.5">58.4% Eco-Safe</p>
            <span className="text-[10px] text-blue-700 font-medium">Trichoderma & Pheromones</span>
          </div>

          <div className="p-3 bg-green-50/60 rounded-xl border border-green-100">
            <span className="text-[11px] font-semibold text-green-700">Drone Squad Readiness</span>
            <p className="text-lg font-black text-green-800 mt-0.5">19 / 45 Active</p>
            <span className="text-[10px] text-green-700 font-medium">26 Drone Squads in Buffer</span>
          </div>
        </div>

        {/* Category Pills & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-green-600 text-white shadow-2xs font-bold'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crop, pest or district..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 focus:bg-white transition-all font-medium text-gray-800"
              />
            </div>
          </div>

        </div>

      </div>

      {/* Grid of Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredInventory.map(item => {
          const isCritical = item.severity === 'critical';
          const progressPercent = Math.min(100, Math.round((item.availableStock / item.totalDemand) * 100));

          return (
            <div 
              key={item.id} 
              className={`agri-card p-4 flex flex-col justify-between transition-all hover:shadow-md ${
                isCritical ? 'border-red-200/80 hover:border-red-300' : 'border-gray-200'
              }`}
            >
              <div className="space-y-3">
                
                {/* Header: Target Crop & Severity Chip */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {item.categoryName}
                    </span>
                    <h3 className="text-xs lg:text-sm font-bold text-gray-900 leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  <span className={`agri-chip text-[10px] shrink-0 font-bold ${
                    isCritical ? 'agri-chip-red' : 'agri-chip-green'
                  }`}>
                    {isCritical ? `Deficit -${item.deficitPercentage}%` : 'Stock Stable'}
                  </span>
                </div>

                {/* Target Crop & Pest */}
                <div className="bg-gray-50/80 rounded-lg p-2 text-xs space-y-1 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Target Crop:</span>
                    <span className="font-bold text-gray-800">{item.targetCrop}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Target Threat:</span>
                    <span className="font-bold text-red-700">{item.targetPest}</span>
                  </div>
                </div>

                {/* Stock Gauge Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-500">Warehouse Stock vs Demand:</span>
                    <span className={isCritical ? 'text-red-700 font-bold' : 'text-green-700 font-bold'}>
                      {item.availableStock.toLocaleString()} / {item.totalDemand.toLocaleString()} {item.unit}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${progressPercent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical ? 'bg-red-500' : 'bg-green-600'
                      }`}
                    />
                  </div>

                  {isCritical && (
                    <div className="flex items-center justify-between text-[11px] font-bold text-red-600 pt-0.5">
                      <span>Deficit Gap:</span>
                      <span>-{item.deficit.toLocaleString()} {item.unit}</span>
                    </div>
                  )}
                </div>

                {/* Priority UP Districts */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    High Demand Districts:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.priorityDistricts.map((d, i) => (
                      <span key={i} className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md border border-gray-200">
                        📍 {d}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Card Action Footer */}
              <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="text-[11px] text-gray-500 truncate max-w-[170px]">
                  <span className="font-semibold text-gray-700">Hub: </span>
                  {item.allocatedWarehouse}
                </div>

                <button
                  onClick={() => onOpenRequisitionModal(item)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                    isCritical
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Send className="w-3 h-3" />
                  <span>Transfer Stock</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
    </>
  );
}
