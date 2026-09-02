import { useState } from 'react';
import { 
  X, 
  Truck, 
  Package, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  FileCheck
} from 'lucide-react';
import { DEMAND_SUPPLY_INVENTORY, UP_DIVISIONS } from '../../data/maharashtraAgriData';

export default function RequisitionModal({ item, onClose, onSuccess }) {
  const [selectedItem, setSelectedItem] = useState(item || DEMAND_SUPPLY_INVENTORY[0]);
  const [sourceWarehouse, setSourceWarehouse] = useState('Lucknow Central Agrochemical Reserve (Alambagh)');
  const [destinationDepot, setDestinationDepot] = useState('Bareilly Regional Agro Hub (CB Ganj / Invertis Zone)');
  const [dispatchQty, setDispatchQty] = useState(selectedItem?.deficit || 5000);
  const [priority, setPriority] = useState('emergency');
  const [officerNote, setOfficerNote] = useState('Urgent buffer replenishment for critical pest outbreak containment in UP.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderCreated(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(selectedItem);
        onClose();
      }, 2500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Modal Header */}
          <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Emergency Supply Requisition Order
                </h3>
                <p className="text-xs text-gray-500">
                  Government of Uttar Pradesh — Directorate of Agriculture Logistics Hub
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

          {orderCreated ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-gray-900">
                Requisition Order #UP-REQ-2026-889 Authorized!
              </h4>
              <p className="text-xs text-gray-600 max-w-xs mx-auto">
                Official stock transfer dispatched from {sourceWarehouse} to {destinationDepot}. Dispatch manifest transmitted to warehouse superintendent.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              {/* Item selection */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Crop Protection Input / Machinery
                </label>
                <select
                  value={selectedItem.id}
                  onChange={(e) => {
                    const found = DEMAND_SUPPLY_INVENTORY.find(i => i.id === e.target.value);
                    if (found) {
                      setSelectedItem(found);
                      setDispatchQty(found.deficit);
                    }
                  }}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-green-600 focus:bg-white text-gray-800"
                >
                  {DEMAND_SUPPLY_INVENTORY.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Deficit: {i.deficit.toLocaleString()} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Source & Destination Hubs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Source Central Warehouse
                  </label>
                  <select
                    value={sourceWarehouse}
                    onChange={(e) => setSourceWarehouse(e.target.value)}
                    className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
                  >
                    <option value="Lucknow Central Agrochemical Reserve (Alambagh)">Lucknow Central Agrochemical Reserve</option>
                    <option value="Bareilly Regional Agro Hub (CB Ganj / Invertis)">Bareilly Regional Agro Hub (CB Ganj)</option>
                    <option value="UPCSR Shahjahanpur Bio-Fungicide Lab">UPCSR Shahjahanpur Bio-Fungicide Lab</option>
                    <option value="Agra Regional Krishi Bhavan Logistics Depot">Agra Regional Krishi Bhavan Depot</option>
                    <option value="Meerut Mandi Agro Reserve">Meerut Mandi Agro Reserve</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Destination District Depot
                  </label>
                  <select
                    value={destinationDepot}
                    onChange={(e) => setDestinationDepot(e.target.value)}
                    className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none font-bold text-green-700"
                  >
                    <option value="Bareilly Regional Agro Hub (CB Ganj / Invertis Zone)">Bareilly Regional Agro Hub (Invertis)</option>
                    <option value="Lakhimpur Kheri Palia Buffer Depot">Lakhimpur Kheri Palia Buffer Depot</option>
                    <option value="Farrukhabad Kaimganj Depot">Farrukhabad Kaimganj Depot</option>
                    <option value="Agra Khandauli Buffer Hub">Agra Khandauli Buffer Hub</option>
                    <option value="Meerut Sardhana Buffer Depot">Meerut Sardhana Buffer Depot</option>
                  </select>
                </div>
              </div>

              {/* Quantity & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Dispatch Quantity ({selectedItem.unit})
                  </label>
                  <input
                    type="number"
                    value={dispatchQty}
                    onChange={(e) => setDispatchQty(e.target.value)}
                    className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none focus:border-green-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Logistics Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-xs font-bold bg-red-50 border border-red-200 text-red-700 rounded-lg p-2 outline-none"
                  >
                    <option value="emergency">🚨 Level 1 - Emergency (24h SLA)</option>
                    <option value="high">⚠️ High Priority (48h)</option>
                    <option value="standard">Standard Buffer Rebalance</option>
                  </select>
                </div>
              </div>

              {/* Officer Note */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Authorization Memo / Justification Note
                </label>
                <textarea
                  rows={2}
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none focus:border-green-600 focus:bg-white text-gray-700"
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Transmitting Transfer Order...' : 'Authorize Dispatch Order'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
