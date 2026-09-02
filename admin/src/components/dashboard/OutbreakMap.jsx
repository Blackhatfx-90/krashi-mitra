import { useState, useMemo, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polygon,
  Tooltip as LeafletTooltip,
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Layers, 
  Filter, 
  Satellite, 
  Map as MapIcon, 
  Sprout, 
  AlertTriangle,
  ZoomIn,
  CheckCircle2
} from 'lucide-react';
import { WEBSITE_CROPS, getStateData } from '../../data/multiStateAgriData';

// Fix Leaflet default icon paths
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

// Custom Leaflet DivIcon for on-field disease badges (directly over infected farm plots)
const createFieldDiseaseBadgeIcon = (diseaseName, confidence, isDiseased, cropIcon) => {
  if (!isDiseased) {
    return L.divIcon({
      className: 'custom-field-badge',
      html: `
        <div style="
          background: rgba(22, 101, 52, 0.9);
          color: #ffffff;
          border: 1.5px solid #86efac;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 3px;
        ">
          <span>${cropIcon}</span>
          <span>Healthy</span>
        </div>
      `,
      iconSize: [60, 20],
      iconAnchor: [30, 10]
    });
  }

  return L.divIcon({
    className: 'custom-field-badge',
    html: `
      <div style="
        background: #dc2626;
        color: #ffffff;
        border: 2px solid #ffffff;
        padding: 3px 8px;
        border-radius: 14px;
        font-size: 10.5px;
        font-weight: 800;
        white-space: nowrap;
        box-shadow: 0 4px 8px rgba(220, 38, 38, 0.5);
        display: flex;
        align-items: center;
        gap: 4px;
        animation: pulse 1.5s infinite;
      ">
        <span style="font-size: 12px;">🚨</span>
        <span>${diseaseName.split('(')[0].trim()}</span>
        <span style="background: rgba(0,0,0,0.25); padding: 1px 4px; border-radius: 6px; font-size: 9px;">${confidence}% AI</span>
      </div>
    `,
    iconSize: [120, 24],
    iconAnchor: [60, 12]
  });
};

// Map Recenter & Invalidate Helper Component
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && map) {
      map.setView(center, zoom, { animate: true, duration: 0.8 });
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  }, [center, zoom, map]);
  return null;
}

export default function OutbreakMap({ 
  activeState,
  selectedDivision = 'all', 
  setSelectedDivision, 
  onSelectCluster,
  onSelectPlot,
  currentLanguage = 'en'
}) {
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [mapLayer, setMapLayer] = useState('google_hybrid'); // 'google_hybrid' | 'esri_sat' | 'streets'
  const [showParcels, setShowParcels] = useState(true);
  const [showFieldBadges, setShowFieldBadges] = useState(true);

  // Safe State fallback
  const stateObj = activeState || getStateData('uttar_pradesh');

  // Active division coordinates
  const activeDivObj = useMemo(() => {
    if (!stateObj.divisions || stateObj.divisions.length === 0) {
      return { center: stateObj.center || [28.3240, 79.5180], zoom: stateObj.defaultZoom || 13 };
    }
    return stateObj.divisions.find(d => d.id === selectedDivision) || stateObj.divisions[0];
  }, [stateObj, selectedDivision]);

  // Filtered farm plots
  const filteredFarmPlots = useMemo(() => {
    return (stateObj.farmPlots || []).filter(plot => {
      if (selectedDivision !== 'all' && plot.division !== selectedDivision) return false;
      if (selectedCrop !== 'all' && plot.crop !== selectedCrop) return false;
      if (selectedSeverity === 'critical' && plot.diseaseStatus !== 'infected') return false;
      return true;
    });
  }, [stateObj, selectedDivision, selectedCrop, selectedSeverity]);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-[#eaecf0] shadow-xs overflow-hidden">
      
      {/* Control Bar: Filters & Satellite Switcher */}
      <div className="p-3 lg:p-4 border-b border-[#eaecf0] bg-gray-50/80 flex flex-wrap items-center justify-between gap-3">
        
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Crop Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs">
            <span className="text-gray-400">फसल:</span>
            <select 
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-green-700 cursor-pointer pr-1"
            >
              <option value="all">🌾 {currentLanguage === 'hi' ? 'सभी फसलें (All Crops)' : 'All 7 Crops'}</option>
              {WEBSITE_CROPS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {currentLanguage === 'hi' ? c.nameHi : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Satellite View (Google Hybrid vs Esri vs Street Map) */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setMapLayer('google_hybrid')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                mapLayer === 'google_hybrid' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Ultra High-Resolution Satellite Imagery (Sentinel/Google)"
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>🛰️ High-Res Satellite</span>
            </button>

            <button
              onClick={() => setMapLayer('esri_sat')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mapLayer === 'esri_sat' 
                  ? 'bg-indigo-600 text-white shadow-xs font-bold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>🌍 Esri View</span>
            </button>

            <button
              onClick={() => setMapLayer('streets')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mapLayer === 'streets' 
                  ? 'bg-green-700 text-white shadow-xs font-bold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>🗺️ Street Map</span>
            </button>
          </div>

          {/* Toggle Farm Parcels */}
          <button
            onClick={() => setShowParcels(!showParcels)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              showParcels 
                ? 'bg-green-50 border-green-300 text-green-800 font-bold' 
                : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'hi' ? 'खेत का रकबा (Parcels)' : 'Farm Cadastral Plots'}</span>
          </button>
        </div>

        {/* Live Cadastral Info Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-xs font-bold text-green-800">
            <Sprout className="w-3.5 h-3.5 text-green-600" />
            <span>{filteredFarmPlots.length} Farmland Plots Geofenced</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span>{filteredFarmPlots.filter(p => p.diseaseStatus === 'infected').length} Infested Fields</span>
          </div>
        </div>

      </div>

      {/* Main Map View Container */}
      <div className="relative w-full h-[580px] min-h-[580px] bg-gray-100">
        
        <MapContainer
          center={activeDivObj.center}
          zoom={activeDivObj.zoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '580px', minHeight: '580px', zIndex: 10 }}
        >
          <ChangeMapView center={activeDivObj.center} zoom={activeDivObj.zoom} />

          {/* High-Resolution Tile Layers with maxNativeZoom=18/20 so deep zoom NEVER shows "No data available" */}
          {mapLayer === 'google_hybrid' && (
            <TileLayer
              attribution='&copy; Google &mdash; High-Resolution Satellite & Agricultural Land Surface Imagery'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
            />
          )}

          {mapLayer === 'esri_sat' && (
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={18}
              maxZoom={20}
            />
          )}

          {mapLayer === 'streets' && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxNativeZoom={19}
              maxZoom={21}
            />
          )}

          {/* 1. Cadastral Farm Parcel Polygons (Actual Farmer Fields Covered Over Satellite) */}
          {showParcels && filteredFarmPlots.map(plot => {
            const isDiseased = plot.diseaseStatus === 'infected';
            const cropObj = WEBSITE_CROPS.find(c => c.id === plot.crop) || WEBSITE_CROPS[0];
            const fillColor = cropObj.color;
            const borderColor = isDiseased ? '#dc2626' : '#16a34a';

            return (
              <div key={plot.id}>
                {/* Field Boundary Polygon */}
                <Polygon
                  positions={plot.polygonCoordinates}
                  pathOptions={{
                    color: borderColor,
                    weight: isDiseased ? 3.5 : 2,
                    fillColor: fillColor,
                    fillOpacity: isDiseased ? 0.55 : 0.40,
                    dashArray: isDiseased ? '5, 5' : null
                  }}
                  eventHandlers={{
                    click: () => onSelectPlot && onSelectPlot(plot)
                  }}
                >
                  <LeafletTooltip sticky direction="top">
                    <div className="text-xs p-1">
                      <p className="font-bold text-gray-900">{plot.khasraNo} • {plot.farmerName}</p>
                      <p className="text-[11px] font-semibold text-green-700">{plot.cropName} ({plot.areaAcres} Acres)</p>
                      <p className={`text-[10px] font-bold mt-0.5 ${isDiseased ? 'text-red-600' : 'text-green-600'}`}>
                        {isDiseased ? `🚨 Disease: ${plot.detectedDisease} (${plot.aiConfidence}% AI)` : '✅ Healthy Crop Stand'}
                      </p>
                    </div>
                  </LeafletTooltip>
                </Polygon>

                {/* On-Field Disease Alert Badge (directly at the center of the covered farm plot) */}
                {plot.centerPoint && (
                  <Marker
                    position={plot.centerPoint}
                    icon={createFieldDiseaseBadgeIcon(plot.detectedDisease, plot.aiConfidence, isDiseased, cropObj.icon)}
                    eventHandlers={{
                      click: () => onSelectPlot && onSelectPlot(plot)
                    }}
                  />
                )}
              </div>
            );
          })}
        </MapContainer>

        {/* Crop Color Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-200 shadow-lg text-xs space-y-2 max-w-[230px]">
          <p className="font-bold text-gray-900 border-b border-gray-100 pb-1 flex items-center justify-between">
            <span>🌾 Crop Cadastral Legend</span>
            <span className="text-[10px] text-green-700 font-bold">{stateObj.code} Farmland</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-semibold text-gray-700">
            {WEBSITE_CROPS.map(c => (
              <div key={c.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }}></span>
                <span className="truncate">{c.nameHi}</span>
              </div>
            ))}
          </div>
          <div className="pt-1.5 border-t border-gray-100 flex items-center gap-2 text-[10px] text-red-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white animate-pulse"></span>
            <span>Red Shaded = AI Infested Field</span>
          </div>
        </div>

        {/* Live Satellite Info Overlay */}
        <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200 shadow-md text-xs font-bold text-gray-800">
          <Sprout className="w-4 h-4 text-green-600" />
          <span>Rural Agricultural Farmland Grid ({activeDivObj.nameEn})</span>
          <span className="text-gray-300">|</span>
          <span className="text-blue-700 font-semibold">🛰️ 0.5m High-Res Sentinel Imagery Active</span>
        </div>

      </div>

    </div>
  );
}
