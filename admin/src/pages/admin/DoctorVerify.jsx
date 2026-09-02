import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { pendingDoctors } from '../../data/doctors';
import Modal from '../../components/ui/Modal';
import {
  UserCheck, CheckCircle, XCircle, Eye, Search, Filter,
  Calendar, MapPin, GraduationCap, FileText
} from 'lucide-react';

export default function DoctorVerify() {
  const { addToast } = useAppStore();
  const [doctorList, setDoctorList] = useState(pendingDoctors);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [denyModal, setDenyModal] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleApprove = (id) => {
    setDoctorList((prev) => prev.map((d) => d.id === id ? { ...d, status: 'approved' } : d));
    addToast({ type: 'success', message: 'Doctor approved successfully!' });
  };

  const handleDeny = () => {
    if (!selectedDoctor) return;
    setDoctorList((prev) => prev.map((d) => d.id === selectedDoctor.id ? { ...d, status: 'denied', denyReason } : d));
    addToast({ type: 'info', message: 'Doctor application denied.' });
    setDenyModal(false);
    setDenyReason('');
  };

  const filtered = doctorList.filter((d) => {
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
          <UserCheck size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
          Doctor Verification
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Review and verify doctor registration applications
        </p>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input className="skeu-input" style={{ paddingLeft: 42 }} placeholder="Search doctors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="tabs">
            {['all', 'pending', 'approved', 'denied'].map((status) => (
              <button
                key={status}
                className={`tab ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
                style={{ textTransform: 'capitalize' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          <AnimatePresence>
            {filtered.map((doc) => (
              <motion.div
                key={doc.id}
                className="glass-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <img src={doc.photo} alt="" style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--glass-border)' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{doc.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--accent-teal)' }}>{doc.specialization}</p>
                    <span className={`badge ${doc.status === 'pending' ? 'badge-orange' : doc.status === 'approved' ? 'badge-teal' : 'badge-red'}`} style={{ marginTop: 4 }}>
                      {doc.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 8, marginBottom: 16, fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Aadhaar</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{doc.aadhaar}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>License</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{doc.licenseNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>College</span>
                    <span>{doc.education}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Hospital</span>
                    <span>{doc.hospital}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Submitted</span>
                    <span>{doc.submittedDate}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {doc.status === 'pending' && (
                    <>
                      <button className="clay-btn clay-btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '10px 16px' }} onClick={() => handleApprove(doc.id)}>
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button className="clay-btn clay-btn-danger" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '10px 16px' }} onClick={() => { setSelectedDoctor(doc); setDenyModal(true); }}>
                        <XCircle size={16} /> Deny
                      </button>
                    </>
                  )}
                  <button className="clay-btn clay-btn-ghost" style={{ justifyContent: 'center', fontSize: '0.85rem', padding: '10px 16px' }} onClick={() => { setSelectedDoctor(doc); setViewModal(true); }}>
                    <Eye size={16} /> View
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* View Profile Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Doctor Profile" maxWidth={600}>
        {selectedDoctor && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <img src={selectedDoctor.photo} alt="" style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--glass-border)' }} />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedDoctor.name}</h3>
                <p style={{ color: 'var(--accent-teal)' }}>{selectedDoctor.specialization}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedDoctor.experience} years experience · ₹{selectedDoctor.fee}/visit</p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(selectedDoctor).filter(([k]) => !['id', 'photo', 'lat', 'lng', 'status'].includes(k)).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span style={{ fontWeight: 500 }}>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Deny Modal */}
      <Modal isOpen={denyModal} onClose={() => setDenyModal(false)} title="Deny Application">
        <div className="form-group">
          <label className="form-label">Reason for denial</label>
          <textarea className="skeu-textarea" placeholder="Please provide a reason..." value={denyReason} onChange={(e) => setDenyReason(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="clay-btn clay-btn-ghost" onClick={() => setDenyModal(false)}>Cancel</button>
          <button className="clay-btn clay-btn-danger" onClick={handleDeny}>Confirm Denial</button>
        </div>
      </Modal>
    </div>
  );
}
