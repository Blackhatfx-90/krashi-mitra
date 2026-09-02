import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import Modal from '../../components/ui/Modal';
import {
  Video, CheckCircle, XCircle, Clock, Calendar,
  Phone, MessageSquare, Shield, Wifi, User
} from 'lucide-react';

export default function DoctorVideoConsult() {
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const [filter, setFilter] = useState('all');
  const [selectedReq, setSelectedReq] = useState(null);
  const [denyModal, setDenyModal] = useState(false);
  const [denyReason, setDenyReason] = useState('');

  const [videoRequests, setVideoRequests] = useState([
    {
      id: 1, patientName: 'Nitin Kumar', age: 24, gender: 'Male',
      condition: 'Diabetes follow-up', date: '2026-04-06', time: '11:00 AM',
      status: 'pending', notes: 'Need to discuss recent blood sugar levels',
      urgency: 'Normal', fee: 600,
    },
    {
      id: 2, patientName: 'Priya Verma', age: 32, gender: 'Female',
      condition: 'Asthma checkup', date: '2026-04-06', time: '2:00 PM',
      status: 'approved', notes: 'Wheezing has increased this week',
      urgency: 'High', fee: 600,
    },
    {
      id: 3, patientName: 'Rohit Sharma', age: 45, gender: 'Male',
      condition: 'Post-surgery follow-up', date: '2026-04-07', time: '10:00 AM',
      status: 'pending', notes: 'Knee replacement - 2 week follow-up',
      urgency: 'Normal', fee: 800,
    },
    {
      id: 4, patientName: 'Anjali Deshmukh', age: 28, gender: 'Female',
      condition: 'Skin rash consultation', date: '2026-04-06', time: '4:30 PM',
      status: 'approved', notes: 'Sudden rash on arms, possible allergic reaction',
      urgency: 'High', fee: 500,
    },
    {
      id: 5, patientName: 'Amit Patel', age: 55, gender: 'Male',
      condition: 'Kidney function review', date: '2026-04-05', time: '9:00 AM',
      status: 'completed', notes: 'Latest lab results are in',
      urgency: 'Normal', fee: 800,
    },
  ]);

  const approveRequest = (id) => {
    setVideoRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    addToast({ type: 'success', message: 'Video call approved! Patient has been notified.' });
  };

  const denyRequest = (id) => {
    setVideoRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'denied', denyReason } : r));
    addToast({ type: 'info', message: 'Video call denied. Patient has been notified.' });
    setDenyModal(false);
    setDenyReason('');
    setSelectedReq(null);
  };

  const joinCall = (req) => {
    navigate(`/video-call?doctor=Dr.%20Priya%20Sharma&specialty=Cardiologist&type=scheduled`);
  };

  const filtered = videoRequests.filter(r =>
    filter === 'all' || r.status === filter
  );

  const statusConfig = {
    pending: { label: 'Pending', badge: 'badge-orange', icon: <Clock size={14} /> },
    approved: { label: 'Approved', badge: 'badge-teal', icon: <CheckCircle size={14} /> },
    completed: { label: 'Completed', badge: 'badge-purple', icon: <CheckCircle size={14} /> },
    denied: { label: 'Denied', badge: 'badge-red', icon: <XCircle size={14} /> },
  };

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
          <Video size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
          Video Consultations
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Manage video call requests from your patients
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Pending Requests', value: videoRequests.filter(r => r.status === 'pending').length, color: 'var(--accent-orange)', icon: <Clock size={20} /> },
            { label: 'Approved Today', value: videoRequests.filter(r => r.status === 'approved' && r.date === '2026-04-06').length, color: 'var(--accent-teal)', icon: <CheckCircle size={20} /> },
            { label: 'Total Completed', value: videoRequests.filter(r => r.status === 'completed').length, color: 'var(--accent-purple)', icon: <Video size={20} /> },
            { label: 'Revenue', value: `₹${videoRequests.filter(r => r.status === 'completed' || r.status === 'approved').reduce((s, r) => s + r.fee, 0).toLocaleString()}`, color: 'var(--accent-blue)', icon: <Shield size={20} /> },
          ].map((stat, i) => (
            <div key={i} className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ color: stat.color, marginBottom: 8 }}>{stat.icon}</div>
              <p className="stat-value" style={{ fontSize: '1.4rem' }}>{stat.value}</p>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          {['all', 'pending', 'approved', 'completed', 'denied'].map(f => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Request Cards */}
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map((req, i) => {
            const config = statusConfig[req.status];
            const isToday = req.date === '2026-04-06';
            return (
              <motion.div
                key={req.id}
                className="glass-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  border: req.status === 'pending' ? '1px solid rgba(245, 158, 11, 0.2)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={`https://api.dicebear.com/7.x/personas/svg?seed=${req.patientName}`}
                        alt={req.patientName}
                        style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid var(--glass-border)' }}
                      />
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'var(--accent-blue)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--bg-card)',
                      }}>
                        <Video size={10} color="white" />
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>
                        {req.patientName}
                        <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
                          {req.age}y · {req.gender}
                        </span>
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--accent-teal)', fontWeight: 600, marginTop: 2 }}>
                        {req.condition}
                      </p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        📅 {req.date} · 🕐 {req.time}
                      </p>
                      {req.notes && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4, fontStyle: 'italic' }}>
                          "{req.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {req.urgency === 'High' && (
                        <span className="badge badge-red" style={{ fontSize: '0.72rem' }}>⚡ Urgent</span>
                      )}
                      <span className={`badge ${config.badge}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {config.icon} {config.label}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--accent-teal)', fontFamily: "'Outfit', sans-serif" }}>
                      ₹{req.fee}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  {req.status === 'pending' && (
                    <>
                      <button className="clay-btn clay-btn-primary" style={{ fontSize: '0.82rem', padding: '10px 18px' }} onClick={() => approveRequest(req.id)}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button className="clay-btn clay-btn-danger" style={{ fontSize: '0.82rem', padding: '10px 18px' }} onClick={() => { setSelectedReq(req); setDenyModal(true); }}>
                        <XCircle size={14} /> Deny
                      </button>
                    </>
                  )}
                  {req.status === 'approved' && isToday && (
                    <motion.button
                      className="clay-btn clay-btn-primary"
                      style={{ fontSize: '0.85rem', padding: '10px 20px' }}
                      onClick={() => joinCall(req)}
                      whileHover={{ scale: 1.05 }}
                      animate={{ boxShadow: ['0 0 0 0 rgba(0,212,170,0.4)', '0 0 0 10px rgba(0,212,170,0)', '0 0 0 0 rgba(0,212,170,0.4)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Video size={16} /> Start Call
                    </motion.button>
                  )}
                  {req.status === 'approved' && !isToday && (
                    <span className="badge badge-blue">Scheduled for {req.date}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Deny Modal */}
      <Modal isOpen={denyModal} onClose={() => setDenyModal(false)} title="Deny Video Call Request" maxWidth={420}>
        {selectedReq && (
          <div>
            <p style={{ fontSize: '0.9rem', marginBottom: 16, color: 'var(--text-secondary)' }}>
              Denying request from <strong>{selectedReq.patientName}</strong> for {selectedReq.condition}.
            </p>
            <div className="form-group">
              <label className="form-label">Reason for Denial</label>
              <textarea
                className="skeu-textarea"
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Please provide a reason..."
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="clay-btn clay-btn-danger" onClick={() => denyRequest(selectedReq.id)}>
                <XCircle size={14} /> Confirm Deny
              </button>
              <button className="clay-btn clay-btn-ghost" onClick={() => setDenyModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
