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
  const metrics = activeState.metrics;

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
        onLogout={onLogout}
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

          {/* Top Executive Summary Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            {/* Outbreak Hotspots Card */}
            <div 
              onClick={() => setActiveView('map')}
              className={`agri-card p-3.5 cursor-pointer transition-all ${
                activeView === 'map' ? 'ring-2 ring-red-500 bg-red-50/15' : 'hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Outbreak Hotspots
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-extrabold text-red-600">
                  {metrics.activeOutbreakClusters}
                </span>
                <span className="text-xs font-bold text-red-800">
                  ({metrics.criticalRedAlerts} Red Alerts)
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 truncate">
                {metrics.activeAffectedAreaHa.toLocaleString()} Ha under infestation in {activeState.code}
              </p>
            </div>

            {/* Farm Cadastral Plots Geofenced */}
            <div 
              onClick={() => setActiveView('map')}
              className="agri-card p-3.5 cursor-pointer transition-all hover:border-green-400 bg-gradient-to-br from-white to-green-50/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-green-800 uppercase tracking-wider">
                  Farm Parcels (खेत)
                </span>
                <Satellite className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-2xl font-extrabold text-green-700">
                  {activeState.farmPlots?.length || 0}
                </span>
                <span className="text-xs font-bold text-green-800">
                  Cadastral Polygons
                </span>
              </div>
              <p className="text-[11px] text-green-700 font-medium mt-1">
                Satellite Verified & Monitored
              </p>
            </div>

            {/* Field Verifications Pending */}
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
                  {metrics.pendingLabVerifications}
                </span>
                <span className="text-xs font-semibold text-blue-800">
                  Farmer Scans
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Avg SLA: {metrics.averageResponseTimeHours} hrs response
              </p>
            </div>

            {/* Crop Loss Prevented */}
            <div 
              onClick={() => setActiveView('analytics')}
              className={`agri-card p-3.5 cursor-pointer transition-all ${
                activeView === 'analytics' ? 'ring-2 ring-green-600 bg-green-50/15' : 'hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Crop Loss Prevented
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>
              </div>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-2xl font-extrabold text-green-700">
                  ₹{metrics.cropLossPreventedCrores}
                </span>
                <span className="text-xs font-bold text-green-800">Crores</span>
              </div>
              <p className="text-[11px] text-green-700 font-semibold mt-1 truncate">
                {metrics.targetedPesticideReductionPercent}% chemical reduction in {activeState.code}
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
