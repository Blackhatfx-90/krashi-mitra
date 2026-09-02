import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { pendingAmbulances } from '../../data/ambulances';
import { Ambulance, CheckCircle, XCircle, Eye, Search } from 'lucide-react';
import Modal from '../../components/ui/Modal';

export default function AmbulanceVerify() {
  const { addToast } = useAppStore();
  const [list, setList] = useState(pendingAmbulances);
  const [searchTerm, setSearchTerm] = useState('');

  const handleApprove = (id) => {
    setList(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
    addToast({ type: 'success', message: 'Ambulance approved!' });
  };

  const handleDeny = (id) => {
    setList(prev => prev.map(a => a.id === id ? { ...a, status: 'denied' } : a));
    addToast({ type: 'info', message: 'Ambulance application denied.' });
  };

  const filtered = list.filter(a =>
    a.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
          <Ambulance size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
          Ambulance Verification
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Review ambulance registration applications</p>

        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="skeu-input" style={{ paddingLeft: 42 }} placeholder="Search by driver name or vehicle number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {filtered.map((amb) => (
            <motion.div key={amb.id} className="glass-card" layout>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{amb.driverName}</h3>
                <span className={`badge ${amb.status === 'pending' ? 'badge-orange' : amb.status === 'approved' ? 'badge-teal' : 'badge-red'}`}>
                  {amb.status}
                </span>
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: '0.85rem', marginBottom: 16 }}>
                {[
                  ['License', amb.licenseNumber],
                  ['Vehicle', amb.vehicleNumber],
                  ['Type', amb.type],
                  ['Phone', amb.phone],
                  ['Service Area', amb.serviceArea],
                  ['Submitted', amb.submittedDate],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              {amb.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="clay-btn clay-btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '10px' }} onClick={() => handleApprove(amb.id)}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button className="clay-btn clay-btn-danger" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '10px' }} onClick={() => handleDeny(amb.id)}>
                    <XCircle size={16} /> Deny
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
