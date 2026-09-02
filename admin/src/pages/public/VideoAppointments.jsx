import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import Modal from '../../components/ui/Modal';
import {
  Video, Calendar, Clock, Phone, CheckCircle, XCircle,
  Search, ChevronRight, User, Shield, Wifi
} from 'lucide-react';

export default function VideoAppointments() {
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedApt, setSelectedApt] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);

  const [videoAppointments, setVideoAppointments] = useState([
    {
      id: 1, doctorName: 'Dr. Priya Sharma', specialty: 'Cardiologist',
      photo: 'https://api.dicebear.com/7.x/personas/svg?seed=priya',
      date: '2026-04-06', time: '11:00 AM', status: 'Approved',
      duration: '30 min', fee: 600, notes: 'Follow-up for heart checkup',
    },
    {
      id: 2, doctorName: 'Dr. Rajesh Patel', specialty: 'Neurologist',
      photo: 'https://api.dicebear.com/7.x/personas/svg?seed=rajesh',
      date: '2026-04-07', time: '2:30 PM', status: 'Pending',
      duration: '30 min', fee: 900, notes: 'Migraine consultation',
    },
    {
      id: 3, doctorName: 'Dr. Ananya Reddy', specialty: 'Dermatologist',
      photo: 'https://api.dicebear.com/7.x/personas/svg?seed=ananya',
      date: '2026-04-05', time: '10:00 AM', status: 'Completed',
      duration: '25 min', fee: 500, notes: 'Skin allergy treatment',
    },
    {
      id: 4, doctorName: 'Dr. Arjun Mehta', specialty: 'Psychiatrist',
      photo: 'https://api.dicebear.com/7.x/personas/svg?seed=arjun',
      date: '2026-04-08', time: '4:00 PM', status: 'Approved',
      duration: '45 min', fee: 700, notes: 'Therapy session',
    },
    {
      id: 5, doctorName: 'Dr. Sneha Joshi', specialty: 'Pediatrician',
      photo: 'https://api.dicebear.com/7.x/personas/svg?seed=sneha',
      date: '2026-04-04', time: '9:00 AM', status: 'Cancelled',
      duration: '30 min', fee: 400, notes: 'Child health checkup',
    },
  ]);

  const filtered = videoAppointments.filter(a =>
    filterStatus === 'all' || a.status.toLowerCase() === filterStatus.toLowerCase()
  );

  const statusConfig = {
    'Approved': { color: 'badge-teal', icon: <CheckCircle size={14} />, canJoin: true },
    'Pending': { color: 'badge-orange', icon: <Clock size={14} />, canJoin: false },
    'Completed': { color: 'badge-purple', icon: <CheckCircle size={14} />, canJoin: false },
    'Cancelled': { color: 'badge-red', icon: <XCircle size={14} />, canJoin: false },
  };

  const joinCall = (apt) => {
    navigate(`/video-call?doctor=${encodeURIComponent(apt.doctorName)}&specialty=${encodeURIComponent(apt.specialty)}&type=scheduled`);
  };

  return (
    <div className="page-wrapper">
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
                <Video size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
                Video Consultations
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Schedule and join video calls with your doctors
              </p>
            </div>
            <button className="clay-btn clay-btn-primary" onClick={() => navigate('/appointments')}>
              <Video size={16} /> Book Video Call
            </button>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Upcoming', value: videoAppointments.filter(a => a.status === 'Approved').length, color: 'var(--accent-teal)', icon: <Calendar size={20} /> },
              { label: 'Pending Approval', value: videoAppointments.filter(a => a.status === 'Pending').length, color: 'var(--accent-orange)', icon: <Clock size={20} /> },
              { label: 'Completed', value: videoAppointments.filter(a => a.status === 'Completed').length, color: 'var(--accent-purple)', icon: <CheckCircle size={20} /> },
              { label: 'Total Saved', value: '₹2,400', color: 'var(--accent-blue)', icon: <Shield size={20} /> },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="stat-card"
                style={{ textAlign: 'center' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div style={{ color: stat.color, marginBottom: 8 }}>{stat.icon}</div>
                <p className="stat-value" style={{ fontSize: '1.4rem' }}>{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="tabs" style={{ marginBottom: 24 }}>
            {['all', 'Approved', 'Pending', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                className={`tab ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
                style={{ textTransform: 'capitalize' }}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>

          {/* Appointment List */}
          <div style={{ display: 'grid', gap: 16 }}>
            {filtered.map((apt, i) => {
              const config = statusConfig[apt.status];
              const isToday = apt.date === '2026-04-06';
              return (
                <motion.div
                  key={apt.id}
                  className="glass-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    border: isToday && apt.status === 'Approved'
                      ? '1px solid rgba(0, 212, 170, 0.3)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <img
                          src={apt.photo}
                          alt={apt.doctorName}
                          style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--glass-border)' }}
                        />
                        <div style={{
                          position: 'absolute', bottom: -2, right: -2,
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'var(--accent-teal)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '2px solid var(--bg-card)',
                        }}>
                          <Video size={12} color="#0a0f1e" />
                        </div>
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{apt.doctorName}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--accent-teal)' }}>{apt.specialty}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          📅 {apt.date} · 🕐 {apt.time} · ⏱ {apt.duration}
                        </p>
                        {apt.notes && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                            📝 {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span className={`badge ${config.color}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {config.icon} {apt.status}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-teal)', fontFamily: "'Outfit', sans-serif" }}>
                        ₹{apt.fee}
                      </span>
                      {isToday && config.canJoin && (
                        <motion.button
                          className="clay-btn clay-btn-primary"
                          style={{ fontSize: '0.85rem', padding: '10px 20px' }}
                          onClick={() => joinCall(apt)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Video size={16} /> Join Now
                        </motion.button>
                      )}
                      {!isToday && config.canJoin && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          Joining opens on {apt.date}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Emergency Call Section */}
          <motion.div
            className="glass-card"
            style={{
              marginTop: 32, padding: 24,
              background: 'rgba(239, 68, 68, 0.03)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-red)', marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
                  🚨 Need Urgent Medical Advice?
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Connect instantly with an available doctor via video call. No appointment needed.
                </p>
              </div>
              <button
                className="clay-btn clay-btn-danger"
                style={{ fontSize: '0.9rem', padding: '14px 28px', whiteSpace: 'nowrap' }}
                onClick={() => navigate('/video-call?doctor=Dr.%20Priya%20Sharma&specialty=General%20Physician&type=emergency')}
              >
                <Phone size={18} /> Emergency Video Call
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
