import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Package, 
  CheckCircle2, 
  Activity, 
  Radio, 
  BarChart3, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  Menu,
  Sparkles,
  Layers,
  Building2,
  Send,
  Truck,
  Satellite,
  Sprout
} from 'lucide-react';
import AdminNavbar from '../../components/layout/AdminNavbar';
import AdminSidebar from '../../components/layout/AdminSidebar';
import OutbreakMap from '../../components/dashboard/OutbreakMap';
import ClusterDetailDrawer from '../../components/dashboard/ClusterDetailDrawer';
import PlotCadastralDrawer from '../../components/dashboard/PlotCadastralDrawer';
import DemandForecasting from '../../components/dashboard/DemandForecasting';
import FieldValidationQueue from '../../components/dashboard/FieldValidationQueue';
import EarlyWarningRadar from '../../components/dashboard/EarlyWarningRadar';
import AdvisoryBroadcast from '../../components/dashboard/AdvisoryBroadcast';
import RegionalAnalytics from '../../components/dashboard/RegionalAnalytics';
import RequisitionModal from '../../components/ui/RequisitionModal';
import { getStateData } from '../../data/multiStateAgriData';
import { fetchStats, fetchAdminSession, adminLogout } from '../../lib/api';

export default function RegionalAdminDashboard({ 
  authStateId = 'uttar_pradesh', 
  onLogout 
}) {
  const [selectedStateId, setSelectedStateId] = useState(authStateId);
  const [activeView, setActiveView] = useState('map'); // map, demand, validation, radar, advisory, analytics
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [currentLanguage, setCurrentLanguage] = useState('en'); // en, hi
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSelectedStateId(authStateId);
    setSelectedDivision('all');
  }, [authStateId]);

  const activeState = getStateData(selectedStateId);

  /* --------------------------------------------------------------------
   * ASLI AANKDE
   * Pehle yahan `activeState.metrics` tha — ek JS file me haath se likhe
   * hue number, jo har baar wahi dikhte the. Ab /api/stats se aate hain,
   * jo kisan ki bheji hui asli jaanchon se gine jate hain.
   *
   * Jo number hamare paas hai hi nahi (khasra rakba, bachai gayi fasal ka
   * rupaya) wo null aata hai aur UI me "—" dikhta hai, jhootha number
   * nahi. Har 60 second me taaza hota hai.
   * ------------------------------------------------------------------ */
  const [stats, setStats] = useState(null);
  const [statsState, setStatsState] = useState('loading'); // loading|ok|login|error
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const d = await fetchStats();
      if (!alive) return;
      if (d && d.ok) { setStats(d); setStatsState('ok'); }
      else setStatsState(d && d.error === 'login' ? 'login' : 'error');
    };
    load();
    const timer = setInterval(load, 60000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    let alive = true;
    fetchAdminSession().then((s) => { if (alive && s && s.authenticated) setAdmin(s); });
    return () => { alive = false; };
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    if (onLogout) onLogout();
    else window.location.href = '/admin-portal/';
  };

  const m = (stats && stats.metrics) || {};
  /* null/undefined ko "—" dikhao. 0 ek asli jawab hai — usse chhupao mat. */
  const show = (v) => (v === null || v === undefined ? '—' : v.toLocaleString('en-IN'));
  const why = (key) => (stats && stats.unavailable && stats.unavailable[key]) || '';

  // Drawer & Modal States
  const [inspectingCluster, setInspectingCluster] = useState(null);
  const [inspectingPlot, setInspectingPlot] = useState(null);
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [requisitionItem, setRequisitionItem] = useState(null);
  const [advisoryInitialData, setAdvisoryInitialData] = useState(null);

  const openRequisition = (item) => {
    setRequisitionItem(item || null);
    setShowRequisitionModal(true);
  };

  const handleStateChange = (newStateId) => {
    setSelectedStateId(newStateId);
    setSelectedDivision('all');
    setInspectingCluster(null);
    setInspectingPlot(null);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col font-sans antialiased text-[#101828]">
      
      {/* Top Navigation */}
      <AdminNavbar
        activeState={activeState}
        onStateChange={handleStateChange}
        selectedDivision={selectedDivision}
        setSelectedDivision={setSelectedDivision}
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenRequisitionModal={() => openRequisition(null)}
        onOpenBroadcastModal={() => setActiveView('advisory')}
        admin={admin}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex">
        
        {/* Sidebar */}
        <AdminSidebar
          activeState={activeState}
          activeView={activeView}
          setActiveView={setActiveView}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          currentLanguage={currentLanguage}
          stats={stats}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 lg:pl-68 p-4 lg:p-6 space-y-5">
          
          {/* Mobile Sidebar Trigger & Breadcrumb */}
          <div className="flex items-center justify-between lg:hidden pb-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-xs"
            >
              <Menu className="w-4 h-4 text-green-600" />
              <span>Navigation Menu</span>
            </button>

            <span className="text-xs font-bold text-gray-600 capitalize">
              {activeState.nameEn}: {activeView}
            </span>
          </div>

          {/* Top Executive Summary Metric Strip — ab asli aankde (/api/stats) */}
          {statsState === 'login' && (
            <div className="agri-card p-3 text-xs font-semibold text-amber-800 bg-amber-50 border-amber-200">
              सत्र समाप्त हो गया है। आँकड़े देखने के लिए दोबारा लॉगिन कीजिए।
            </div>
          )}
          {statsState === 'error' && (
            <div className="agri-card p-3 text-xs font-semibold text-gray-600">
              आँकड़े अभी नहीं आ पाए — सर्वर से संपर्क नहीं हुआ। एक मिनट में अपने आप दोबारा कोशिश होगी।
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* 1. Outbreak clusters — ek hi zile me ek hi rog ki >=3 jaanchein */}
            <div
              onClick={() => setActiveView('map')}
              className={`agri-card p-3.5 cursor-pointer transition-all ${
                activeView === 'map' ? 'ring-2 ring-red-500 bg-red-50/15' : 'hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Outbreak Clusters
                </span>
                {m.criticalClusters > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-extrabold text-red-600">
                  {show(m.activeClusters)}
                </span>
                <span className="text-xs font-bold text-red-800">
                  ({show(m.criticalClusters)} गंभीर)
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {statsState === 'ok' && !m.activeClusters
                  ? 'अभी कोई क्लस्टर नहीं — यह अच्छी ख़बर है'
                  : '14 दिन में एक ही ज़िले, एक ही रोग की 3+ जाँचें'}
              </p>
            </div>

            {/* 2. Farm parcels — cadastral layer abhi judi nahi hai */}
            <div
              className="agri-card p-3.5 bg-gradient-to-br from-white to-gray-50/40"
              title={why('farmParcels')}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Farm Parcels (खेत)
                </span>
                <Satellite className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-extrabold text-gray-400">
                  {show(m.farmParcels)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                {why('farmParcels') || 'खसरा/कैडस्ट्रल परत अभी नहीं जुड़ी है।'}
              </p>
            </div>

            {/* 3. Pending verifications — asli ginti, asli intezaar */}
            <div
              onClick={() => setActiveView('validation')}
              className={`agri-card p-3.5 cursor-pointer transition-all ${
                activeView === 'validation' ? 'ring-2 ring-blue-500 bg-blue-50/15' : 'hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Pending Verifications
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-extrabold text-blue-600">
                  {show(m.pendingScans)}
                </span>
                <span className="text-xs font-semibold text-blue-800">किसान जाँचें</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {statsState !== 'ok'
                  ? 'आँकड़े आ रहे हैं…'
                  : m.slaHours === null || m.slaHours === undefined
                    ? 'कोई जाँच प्रतीक्षा में नहीं'
                    : 'औसत प्रतीक्षा: ' + m.slaHours + ' घंटे'}
              </p>
            </div>

            {/* 4. Aaj ki jaanchein — pehle yahan "Crop Loss Prevented ₹ crore"
                   tha. Wo ek aarthik anumaan hai jiske liye rakba, upaj aur
                   mandi bhav chahiye — teenon nahi hain. Isliye uski jagah
                   ek number jo SACH me pata hai. */}
            <div
              onClick={() => setActiveView('analytics')}
              className={`agri-card p-3.5 cursor-pointer transition-all ${
                activeView === 'analytics' ? 'ring-2 ring-green-600 bg-green-50/15' : 'hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  जाँचें (7 दिन)
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-extrabold text-green-700">
                  {show(m.scans7d)}
                </span>
                <span className="text-xs font-bold text-green-800">
                  {show(m.scans24h)} आज
                </span>
              </div>
              <p className="text-[11px] text-green-700 font-semibold mt-1">
                कुल {show(m.totalScans)} · सत्यापित {show(m.verifiedScans)}
              </p>
            </div>

          </div>

          {/* Active View Module */}
          <div className="transition-all duration-200">
            {activeView === 'map' && (
              <OutbreakMap
                activeState={activeState}
                selectedDivision={selectedDivision}
                setSelectedDivision={setSelectedDivision}
                onSelectCluster={(cluster) => {
                  setInspectingCluster(cluster);
                  setInspectingPlot(null);
                }}
                onSelectPlot={(plot) => {
                  setInspectingPlot(plot);
                  setInspectingCluster(null);
                }}
                currentLanguage={currentLanguage}
              />
            )}

            {activeView === 'demand' && (
              <DemandForecasting
                onOpenRequisitionModal={openRequisition}
                currentLanguage={currentLanguage}
              />
            )}

            {activeView === 'validation' && (
              <FieldValidationQueue
                currentLanguage={currentLanguage}
              />
            )}

            {activeView === 'radar' && (
              <EarlyWarningRadar
                onOpenBroadcastModal={() => setActiveView('advisory')}
                currentLanguage={currentLanguage}
              />
            )}

            {activeView === 'advisory' && (
              <AdvisoryBroadcast
                initialData={advisoryInitialData}
                currentLanguage={currentLanguage}
              />
            )}

            {activeView === 'analytics' && (
              <RegionalAnalytics
                currentLanguage={currentLanguage}
              />
            )}
          </div>

        </main>

      </div>

      {/* Cluster Detail Drawer */}
      {inspectingCluster && (
        <ClusterDetailDrawer
          cluster={inspectingCluster}
          onClose={() => setInspectingCluster(null)}
          onOpenRequisitionModal={() => openRequisition(null)}
          onOpenBroadcastModal={() => {
            setActiveView('advisory');
            setInspectingCluster(null);
          }}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Farm Plot Cadastral Inspector Drawer */}
      {inspectingPlot && (
        <PlotCadastralDrawer
          plot={inspectingPlot}
          onClose={() => setInspectingPlot(null)}
          onOpenBroadcastModal={() => {
            setActiveView('advisory');
            setInspectingPlot(null);
          }}
          onOpenRequisitionModal={() => openRequisition(null)}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Emergency Requisition Modal */}
      {showRequisitionModal && (
        <RequisitionModal
          item={requisitionItem}
          onClose={() => setShowRequisitionModal(false)}
          onSuccess={() => {}}
        />
      )}

    </div>
  );
}
