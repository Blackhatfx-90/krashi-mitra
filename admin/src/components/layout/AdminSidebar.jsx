import { 
  MapPin, 
  Package, 
  CheckCircle2, 
  Activity, 
  Radio, 
  BarChart3, 
  ExternalLink, 
  PhoneCall, 
  Sprout
} from 'lucide-react';

export default function AdminSidebar({ 
  activeState,
  activeView, 
  setActiveView, 
  isOpen, 
  setIsOpen,
  currentLanguage 
}) {
  const metrics = activeState.metrics;

  const navItems = [
    {
      group: 'निगरानी व जीआईएस (SURVEILLANCE)',
      items: [
        {
          id: 'map',
          labelEn: 'Cadastral Farm GIS Map',
          labelHi: 'खेत भूखंड व हॉटस्पॉट (GIS)',
          icon: MapPin,
          badge: `${activeState.farmPlots?.length || 0} Plots`,
          badgeColor: 'bg-green-100 text-green-800 font-bold'
        },
        {
          id: 'radar',
          labelEn: 'Epidemic Risk Radar',
          labelHi: 'मौसम-रोग जोखिम रडार',
          icon: Activity,
          badge: '7-Day AI',
          badgeColor: 'bg-amber-100 text-amber-800'
        },
        {
          id: 'validation',
          labelEn: 'Field Verification Queue',
          labelHi: 'किसान निदान व लैब सत्यापन',
          icon: CheckCircle2,
          badge: `${metrics.pendingLabVerifications}`,
          badgeColor: 'bg-blue-100 text-blue-700'
        }
      ]
    },
    {
      group: 'संसाधन व लॉजिस्टिक्स (SUPPLY & DEMAND)',
      items: [
        {
          id: 'demand',
          labelEn: 'Demand & Supply Forecasting',
          labelHi: 'कीटनाशक व ड्रोन मांग ट्रैकर',
          icon: Package,
          badge: `${metrics.demandShortageAlertsCount} Deficits`,
          badgeColor: 'bg-red-50 text-red-600 border border-red-200'
        },
        {
          id: 'advisory',
          labelEn: 'Targeted Advisory Broadcast',
          labelHi: 'कृषि परामर्श प्रसारण केंद्र',
          icon: Radio,
          badge: 'CIBRC',
          badgeColor: 'bg-green-100 text-green-700'
        }
      ]
    },
    {
      group: 'प्रशासनिक विश्लेषण (EXECUTIVE REPORT)',
      items: [
        {
          id: 'analytics',
          labelEn: 'Analytics & Crop Loss Impact',
          labelHi: 'फसल बचत व प्रभाव रिपोर्ट',
          icon: BarChart3,
          badge: `₹${metrics.cropLossPreventedCrores} Cr`,
          badgeColor: 'bg-green-50 text-green-700 font-bold border border-green-200'
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-68 bg-white border-r border-[#eaecf0] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-4 border-b border-[#eaecf0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-xs font-bold">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 tracking-tight">
                Agri<span className="text-green-600">AI</span> Portal
              </span>
              <span className="block text-[10px] uppercase tracking-wider font-bold text-green-700">
                {activeState.nameEn} Grid ({activeState.code})
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navItems.map((grp, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {grp.group}
              </p>
              {grp.items.map(item => {
                const IconComponent = item.icon;
                const isActive = activeView === item.id;
                const label = currentLanguage === 'hi' ? item.labelHi : item.labelEn;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      isActive 
                        ? 'bg-green-50 text-green-800 shadow-xs border border-green-200/70 font-bold' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-green-700' : 'text-gray-400'}`} />
                    {/* truncate HATAYA GAYA — Hindi module ke naam lambe hain
                        ("किसान निदान व लैब सत्यापन") aur adhoore dikh rahe the. */}
                    <span className="flex-1 leading-snug">{label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Quick link to Farmer Mobile Interface */}
          <div className="pt-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              किसान फील्ड ऐप (LIVE)
            </p>
            <a
              href="https://krashi-mitrasih.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-green-50/80 hover:text-green-800 border border-gray-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-green-600" />
              <span>Open Farmer Field App</span>
            </a>
          </div>
        </div>

        {/* State Kisan Call Center Helpline Card */}
        <div className="p-3 border-t border-[#eaecf0] bg-gray-50/50">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">👨‍🌾</span>
              <div>
                <p className="text-xs font-bold text-gray-900">किसान हेल्पलाइन ({activeState.code})</p>
                <p className="text-[10px] text-gray-500">{activeState.departmentName.split(',')[0]}</p>
              </div>
            </div>
            <a
              href={`tel:${activeState.helpline.split('/')[0].trim()}`}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{activeState.helpline}</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
