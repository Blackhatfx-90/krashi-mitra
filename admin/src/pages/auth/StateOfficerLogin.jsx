import { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  Sprout, 
  CheckCircle2, 
  Sparkles,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { STATES_CONFIG } from '../../data/multiStateAgriData';

export default function StateOfficerLogin({ onLoginSuccess }) {
  const [selectedStateId, setSelectedStateId] = useState('uttar_pradesh');
  const [username, setUsername] = useState('officer.up@agri.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const states = [
    {
      id: 'uttar_pradesh',
      name: 'उत्तर प्रदेश (Uttar Pradesh)',
      zone: 'Bareilly / Rohilkhand (Invertis Zone) & Lucknow',
      officerName: 'Dr. A. K. Gangwar (Joint Director Agri)',
      email: 'officer.up@agri.gov.in',
      badgeColor: 'bg-green-100 text-green-800 border-green-300',
      flagEmoji: '🌾'
    },
    {
      id: 'uttarakhand',
      name: 'उत्तराखंड (Uttarakhand)',
      zone: 'Udham Singh Nagar (Pantnagar Zone) & Haridwar',
      officerName: 'Dr. H. C. Joshi (Chief Agriculture Officer)',
      email: 'officer.uk@agri.gov.in',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      flagEmoji: '🏔️'
    },
    {
      id: 'maharashtra',
      name: 'महाराष्ट्र (Maharashtra)',
      zone: 'Pune & Nashik (Western Maharashtra Zone)',
      officerName: 'Dr. S. V. Patil (Divisional Joint Director)',
      email: 'officer.mh@agri.gov.in',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      flagEmoji: '🌱'
    }
  ];

  const handleStateSelect = (st) => {
    setSelectedStateId(st.id);
    setUsername(st.email);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(selectedStateId);
    }, 600);
  };

  const handleQuickLogin = (stateId) => {
    setSelectedStateId(stateId);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(stateId);
    }, 400);
  };

  const activeStateObj = STATES_CONFIG[selectedStateId];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-green-50/50 flex flex-col justify-between font-sans antialiased text-[#101828]">
      
      {/* Top Govt of India / State Seal Banner */}
      <header className="border-b border-[#eaecf0] bg-white/90 backdrop-blur-md px-6 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white shadow-xs font-bold text-lg">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900 tracking-tight">
                  Agri<span className="text-green-600">AI</span> / Krishi Mitra
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                  SIH 2026 Problem ID: 26131
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                National Integrated Plant Health & Geospatial Crop Cadastral Portal
              </p>
            </div>
          </div>

          <a
            href="https://krashi-mitrasih.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 transition-colors"
          >
            <span>Live Farmer App</span>
            <ExternalLink className="w-3.5 h-3.5 text-green-600" />
          </a>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left: State Fast Selection Cards (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-green-900 to-emerald-950 p-6 lg:p-8 text-white flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-green-300">
                1-Click State Demo Login
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1 leading-tight">
                Select State Agriculture Office
              </h2>
              <p className="text-xs text-green-100/80 mt-1">
                Role-based data isolation for state agriculture directors and district extension teams.
              </p>

              {/* State Pills */}
              <div className="space-y-3 mt-5">
                {states.map(st => {
                  const isSelected = selectedStateId === st.id;

                  return (
                    <div
                      key={st.id}
                      onClick={() => handleStateSelect(st)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'bg-white text-gray-900 border-white shadow-lg font-bold' 
                          : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{st.flagEmoji}</span>
                          <span className="text-xs font-bold">{st.name}</span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className={`text-[11px] mt-1 line-clamp-1 ${isSelected ? 'text-gray-600' : 'text-green-200'}`}>
                        {st.zone}
                      </p>
                      <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-gray-200/20">
                        <span className={`text-[10px] ${isSelected ? 'text-green-700 font-semibold' : 'text-green-300'}`}>
                          {st.officerName}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickLogin(st.id);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors ${
                            isSelected 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          Login Now →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-[11px] text-green-200/70 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
              <span>CIBRC & ICAR Certified Cadastral Security</span>
            </div>
          </div>

          {/* Right: Login Form (7 cols) */}
          <div className="lg:col-span-7 p-6 lg:p-10 flex flex-col justify-center space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-green-600" />
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                  {activeStateObj.departmentName}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Official Officer Sign-In
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter your authorized credentials to access {activeStateObj.nameEn} regional surveillance & cadastral parcel GIS grid.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Selected State Badge Banner */}
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-800">
                    Active State Authority
                  </span>
                  <p className="text-xs font-bold text-gray-900">
                    {activeStateObj.nameHi}
                  </p>
                </div>
                <span className="text-xs font-black px-2 py-1 bg-white text-green-800 rounded-lg border border-green-300">
                  {activeStateObj.code} Grid
                </span>
              </div>

              {/* Email / Officer ID */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">
                  Official Email / Government ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-600 focus:bg-white transition-all font-medium text-gray-800"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-600">
                    Security Key / Password
                  </label>
                  <span className="text-[11px] text-green-600 hover:underline cursor-pointer">
                    Demo Mode Active
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-600 focus:bg-white transition-all font-medium text-gray-800"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? 'Authenticating Official Session...' : `Open ${activeStateObj.nameEn} Dashboard`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>Smart India Hackathon 2026</span>
              <span className="font-semibold text-gray-700">Invertis University, Bareilly</span>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
        Department of Agriculture & Farmers Welfare • Krishi Mitra AI Regional Surveillance System
      </footer>

    </div>
  );
}
