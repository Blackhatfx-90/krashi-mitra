import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  Sprout, 
  Download, 
  Award,
  Leaf
} from 'lucide-react';
import { 
  EXECUTIVE_METRICS, 
  MONTHLY_OUTBREAK_TREND, 
  CROP_DISTRIBUTION_STATS,
  UP_DIVISIONS 
} from '../../data/maharashtraAgriData';

export default function RegionalAnalytics({ currentLanguage }) {
  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="agri-card p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <span>{currentLanguage === 'hi' ? 'उत्तर प्रदेश कृषि सांख्यिकी व प्रभाव स्कोरकार्ड' : 'Executive Agricultural Analytics & Impact Scorecard'}</span>
              </h2>
              <span className="agri-chip agri-chip-green text-xs">
                UP State Impact Summary (2026)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {currentLanguage === 'hi'
                ? 'समय पर निदान से फसल क्षति में बचत, रासायनिक कीटनाशकों के अत्यधिक उपयोग में कमी व त्वरित समाधान SLA'
                : 'Measuring crop loss prevented, reduction in synthetic chemical pesticide overuse, surveillance coverage, and extension response SLA across UP'}
            </p>
          </div>

          <button
            onClick={() => alert('Downloading Comprehensive Uttar Pradesh Agriculture Impact Report (PDF)...')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download UP Impact Report</span>
          </button>
        </div>

        {/* 4 Core Impact KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
          
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50/80 border border-green-200 space-y-1">
            <span className="text-[11px] font-bold text-green-800 uppercase tracking-wider block">
              Crop Loss Prevented (UP)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-green-900">
                ₹{EXECUTIVE_METRICS.cropLossPreventedCrores}
              </span>
              <span className="text-xs font-bold text-green-700">Crores</span>
            </div>
            <p className="text-[11px] text-green-700 font-medium">
              54,200 Metric Tonnes Protected
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-200 space-y-1">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
              Chemical Overuse Reduction
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-blue-900">
                {EXECUTIVE_METRICS.targetedPesticideReductionPercent}%
              </span>
              <span className="text-xs font-bold text-blue-700">Less Chemical Load</span>
            </div>
            <p className="text-[11px] text-blue-700 font-medium">
              Via Early Precision Bio-Control
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50/80 border border-amber-200 space-y-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              KVK Response SLA
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-amber-900">
                {EXECUTIVE_METRICS.averageResponseTimeHours}
              </span>
              <span className="text-xs font-bold text-amber-700">Hours Avg</span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium">
              From Farmer Scan to Advisory
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50/80 border border-purple-200 space-y-1">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
              Active Area Monitored
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-purple-900">
                5.20
              </span>
              <span className="text-xs font-bold text-purple-700">Lakh Ha</span>
            </div>
            <p className="text-[11px] text-purple-700 font-medium">
              68,400 UP Farmers Enrolled
            </p>
          </div>

        </div>
      </div>

      {/* Two Column Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Monthly Trend of UP Major Crop Epidemics (7 cols) */}
        <div className="lg:col-span-7 agri-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Epidemic Progression & Containment Trend in UP (2026)
              </h3>
              <p className="text-xs text-gray-500">
                Monthly area affected in Hectares by crop
              </p>
            </div>
            <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
              Live Recharts
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_OUTBREAK_TREND} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCane" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPotato" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="sugarcaneRot" name="Sugarcane Red Rot (Ha)" stroke="#16a34a" fillOpacity={1} fill="url(#colorCane)" />
                <Area type="monotone" dataKey="riceBLB" name="Rice BLB (Ha)" stroke="#22c55e" fillOpacity={1} fill="url(#colorRice)" />
                <Area type="monotone" dataKey="potatoBlight" name="Potato Blight (Ha)" stroke="#eab308" fillOpacity={1} fill="url(#colorPotato)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Crop Distribution Breakdown (5 cols) */}
        <div className="lg:col-span-5 agri-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Active Outbreak Crop Distribution
              </h3>
              <p className="text-xs text-gray-500">
                Breakdown of 8,970 active affected Hectares
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {CROP_DISTRIBUTION_STATS.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.color }}></span>
                    {stat.name}
                  </span>
                  <span className="text-gray-600 font-bold">
                    {stat.hectares.toLocaleString()} Ha ({stat.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${stat.percentage}%`, backgroundColor: stat.color }} 
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 mt-4 text-xs space-y-1">
            <span className="font-bold text-gray-900 block">
              SIH Problem Statement 26131 Alignment
            </span>
            <p className="text-gray-600 leading-relaxed text-[11px]">
              Directly solves farmer late-detection by integrating predictive weather catalysts, precision CIBRC dosages, and mobile-to-lab rapid response ground truthing.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
