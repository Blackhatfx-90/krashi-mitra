import { useState } from 'react';
import { 
  Building2, 
  Globe2, 
  Radio, 
  Send, 
  PackageCheck,
  ChevronDown,
  LogOut,
  Sparkles,
  MapPin
} from 'lucide-react';
import { STATES_CONFIG } from '../../data/multiStateAgriData';

export default function AdminNavbar({ 
  activeState,
  onStateChange,
  selectedDivision, 
  setSelectedDivision, 
  currentLanguage, 
  setCurrentLanguage,
  onOpenRequisitionModal,
  onOpenBroadcastModal,
  onLogout
}) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showDivMenu, setShowDivMenu] = useState(false);
  const [showStateMenu, setShowStateMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const activeDivObj = activeState.divisions.find(d => d.id === selectedDivision) || activeState.divisions[0];

  /* lg:pl-[18.5rem] = sidebar (17rem) + 1.5rem gap.
     Sidebar 'fixed ... z-50' hai aur header 'sticky ... z-40', isliye bina is
     padding ke sidebar header ka baayan hissa dhak leta tha. */
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#eaecf0] px-4 lg:pl-[18.5rem] lg:pr-6 py-2.5 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Active State Govt Identity
            NOTE: yahan pehle purana logo aur naam tha,
            jabki wahi cheez sidebar ke sabse upar bhi hai. Main public site par
            brand sirf sidebar me rehta hai aur topbar par PAGE ka naam aata hai —
            isliye sirf wo dohra logo hataya gaya hai.
            Koi button/option nahi hata: state switcher, tagline, division,
            bhasha, profile — sab neeche waise ke waise hain. */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                {/* nameHi lamba hai ("उत्तर प्रदेश शासन — कृषि विभाग"), isliye
                    truncate + nowrap — warna yeh khadi patti ban kar poora
                    navbar kheench deta tha. */}
                <h1 className="text-sm lg:text-base font-bold text-gray-900 tracking-tight
                               leading-tight whitespace-nowrap truncate max-w-[38vw] lg:max-w-none">
                  {activeState.nameHi}
                </h1>
                
                {/* State Switcher Badge Button */}
                <div className="relative">
                  <button
                    onClick={() => { setShowStateMenu(!showStateMenu); setShowDivMenu(false); setShowLangMenu(false); }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 hover:bg-green-100 text-green-800 border border-green-300 transition-colors"
                  >
                    {/* Pehle yahan bhi activeState.nameHi tha — wahi naam h1 me
                        bhi hai, isliye badge sikud kar khadi patti ban jata tha.
                        Button ka KAAM waisa hi hai (raajya badalna). */}
                    <span className="whitespace-nowrap">राज्य बदलें</span>
                    <ChevronDown className="w-3 h-3 text-green-600" />
                  </button>

                  {showStateMenu && (
                    <div className="absolute left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Switch State Agriculture Authority
                      </div>
                      {Object.values(STATES_CONFIG).map(st => (
                        <button
                          key={st.id}
                          onClick={() => {
                            onStateChange(st.id);
                            setShowStateMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-green-50 transition-colors ${
                            activeState.id === st.id ? 'bg-green-50 text-green-800 font-bold' : 'text-gray-700'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{st.nameHi}</p>
                            <p className="text-[10px] text-gray-500">{st.nameEn} Grid</p>
                          </div>
                          {activeState.id === st.id && <span className="w-2 h-2 rounded-full bg-green-600"></span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              <p className="text-xs text-gray-500 font-medium hidden md:block truncate max-w-[46ch]">
                {activeState.tagline}
              </p>
            </div>
          </div>

          {/* Division Selector Dropdown */}
          <div className="relative ml-2 lg:ml-4">
            <button
              onClick={() => { setShowDivMenu(!showDivMenu); setShowStateMenu(false); setShowLangMenu(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs lg:text-sm font-semibold text-gray-800 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-green-600" />
              <span className="truncate max-w-[130px] lg:max-w-[210px]">
                {currentLanguage === 'hi' ? activeDivObj.nameHi : activeDivObj.nameEn}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showDivMenu && (
              <div className="absolute left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {activeState.nameEn} Divisions (प्रशासनिक संभाग)
                </div>
                {activeState.divisions.map(div => (
                  <button
                    key={div.id}
                    onClick={() => {
                      setSelectedDivision(div.id);
                      setShowDivMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-green-50 transition-colors ${
                      selectedDivision === div.id ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700'
                    }`}
                  >
                    <span>{currentLanguage === 'hi' ? div.nameHi : div.nameEn}</span>
                    {selectedDivision === div.id && <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Live Outbreak Emergency Ticker */}
        <div className="hidden xl:flex items-center flex-1 max-w-md mx-4">
          <div 
            onClick={onOpenBroadcastModal}
            className="w-full cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100/80 border border-red-200 text-xs text-red-800 transition-colors"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span className="font-bold text-red-700 shrink-0">�� {activeState.code} RADAR:</span>
            <span className="truncate text-red-900 font-medium">
              {activeState.hotspots[0]?.district} ({activeState.hotspots[0]?.disease}) • {activeState.farmPlots?.length} Farm Parcels Geofenced
            </span>
          </div>
        </div>

        {/* Right: Quick Actions, Language, Profile & Logout */}
        <div className="flex items-center gap-2 lg:gap-3">
          
          {/* Quick Action: New Advisory */}
          <button
            onClick={onOpenBroadcastModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Advisory Broadcast</span>
          </button>

          {/* Quick Action: Requisition Buffer Stock */}
          <button
            onClick={onOpenRequisitionModal}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors"
          >
            <PackageCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>Requisition</span>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => { setShowLangMenu(!showLangMenu); setShowDivMenu(false); setShowStateMenu(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 transition-colors"
            >
              <Globe2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="uppercase">{currentLanguage}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {[
                  { code: 'hi', label: 'हिंदी (Hindi)' },
                  { code: 'en', label: 'English' }
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setCurrentLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-green-50 ${
                      currentLanguage === lang.code ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {currentLanguage === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Officer Profile Badge with Logout */}
          <div className="relative pl-2 border-l border-gray-200">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-green-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {activeState.code}
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[130px]">{activeState.officer.name}</p>
                <p className="text-[10px] text-gray-500">{activeState.officer.id}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900">{activeState.officer.name}</p>
                  <p className="text-[11px] text-gray-500">{activeState.officer.designation}</p>
                  <p className="text-[10px] text-green-700 font-semibold mt-0.5">{activeState.officer.universityLab}</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout / Switch State</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
