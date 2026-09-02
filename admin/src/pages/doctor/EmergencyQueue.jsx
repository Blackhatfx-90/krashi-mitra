import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  AlertTriangle, MapPin, CheckCircle, XCircle, Phone,
  Clock, User, Navigation
} from 'lucide-react';

export default function EmergencyQueue() {
  const { addToast } = useAppStore();
  const [emergencies, setEmergencies] = useState([
    {
      id: 1,
      patientName: 'Rohit Sharma',
      age: 45,
      condition: 'Chest Pain - Severe',
      symptoms: 'Sharp pain in left chest, sweating, shortness of breath',
      phone: '+91 76543 21098',
      location: 'Connaught Place, New Delhi',
      timeAgo: '5 min ago',
      severity: 'Critical',
      lat: 28.6315,
      lng: 77.2167,
      distance: '1.2 km',
    },
    {
      id: 2,
      patientName: 'Anjali Deshmukh',
      age: 28,
      condition: 'Severe Migraine with Aura',
      symptoms: 'Intense headache, visual disturbances, nausea, vomiting',
      phone: '+91 65432 10987',
      location: 'Saket, New Delhi',
      timeAgo: '12 min ago',
      severity: 'High',
      lat: 28.5244,
      lng: 77.2167,
      distance: '3.5 km',
    },
    {
      id: 3,
      patientName: 'Amit Patel',
      age: 55,
      condition: 'Diabetic Emergency - Hypoglycemia',
      symptoms: 'Confusion, shaking, excessive sweating, rapid heartbeat',
      phone: '+91 54321 09876',
      location: 'Lajpat Nagar, New Delhi',
      timeAgo: '18 min ago',
      severity: 'High',
      lat: 28.5706,
      lng: 77.2433,
      distance: '2.8 km',
    },
    {
      id: 4,
      patientName: 'Kavya Nair',
      age: 35,
      condition: 'Allergic Reaction - Anaphylaxis',
      symptoms: 'Swelling of face and throat, difficulty breathing, rash',
      phone: '+91 43210 98765',
      location: 'Green Park, New Delhi',
      timeAgo: '25 min ago',
      severity: 'Critical',
      lat: 28.5590,
      lng: 77.2090,
      distance: '4.1 km',
    },
  ]);

  const handleAccept = (id) => {
    setEmergencies(prev => prev.map(e => e.id === id ? { ...e, accepted: true } : e));
    addToast({ type: 'success', message: 'Emergency accepted! Patient has been notified.' });
  };

  const handleDecline = (id) => {
    setEmergencies(prev => prev.filter(e => e.id !== id));
    addToast({ type: 'info', message: 'Emergency declined. Forwarded to next available doctor.' });
  };

  const severityColors = {
    Critical: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: 'var(--accent-red)' },
    High: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: 'var(--accent-orange)' },
    Medium: { bg: 'rgba(79, 142, 247, 0.1)', border: 'rgba(79, 142, 247, 0.3)', text: 'var(--accent-blue)' },
  };

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: 'var(--accent-red)' }}>
            <AlertTriangle size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
            Emergency Queue
          </h1>
          <motion.div
            className="badge badge-red"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontSize: '0.85rem', padding: '4px 14px' }}
          >
            {emergencies.filter(e => !e.accepted).length} Active
          </motion.div>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Real-time emergency requests from patients in your area
        </p>

        {/* Summary Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Critical Cases', value: emergencies.filter(e => e.severity === 'Critical').length, color: 'var(--accent-red)', icon: <AlertTriangle size={20} /> },
            { label: 'Accepted', value: emergencies.filter(e => e.accepted).length, color: 'var(--accent-teal)', icon: <CheckCircle size={20} /> },
            { label: 'Avg Distance', value: '2.9 km', color: 'var(--accent-blue)', icon: <Navigation size={20} /> },
          ].map((stat, i) => (
            <div key={i} className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ color: stat.color, marginBottom: 8 }}>{stat.icon}</div>
              <p className="stat-value" style={{ fontSize: '1.4rem' }}>{stat.value}</p>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Emergency Cards */}
        <div style={{ display: 'grid', gap: 16 }}>
          {emergencies.map((emergency, i) => {
            const colors = severityColors[emergency.severity] || severityColors.Medium;
            return (
              <motion.div
                key={emergency.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: 20,
                  borderRadius: 'var(--radius-lg)',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  transition: 'var(--transition-smooth)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <img
                      src={`https://api.dicebear.com/7.x/personas/svg?seed=${emergency.patientName}`}
                      alt=""
                      style={{ width: 50, height: 50, borderRadius: '50%', border: '3px solid var(--glass-border)' }}
                    />
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>
                        {emergency.patientName}, {emergency.age}
                      </h3>
                      <p style={{ color: colors.text, fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>
                        {emergency.condition}
                      </p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        {emergency.symptoms}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={`badge ${emergency.severity === 'Critical' ? 'badge-red' : 'badge-orange'}`}>
                      {emergency.severity}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {emergency.timeAgo}
                    </span>
                    {emergency.accepted && (
                      <span className="badge badge-teal">✅ Accepted</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, marginBottom: 14, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={14} /> {emergency.location}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Navigation size={14} /> {emergency.distance} away
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={14} /> {emergency.phone}
                  </span>
                </div>

                {!emergency.accepted && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="clay-btn clay-btn-primary" style={{ fontSize: '0.85rem', padding: '10px 20px' }} onClick={() => handleAccept(emergency.id)}>
                      <CheckCircle size={16} /> Accept Emergency
                    </button>
                    <button className="clay-btn clay-btn-ghost" style={{ fontSize: '0.85rem', padding: '10px 20px' }} onClick={() => handleDecline(emergency.id)}>
                      <XCircle size={16} /> Decline
                    </button>
                    <a href={`tel:${emergency.phone}`} className="clay-btn clay-btn-secondary" style={{ fontSize: '0.85rem', padding: '10px 20px' }}>
                      <Phone size={16} /> Call Patient
                    </a>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
