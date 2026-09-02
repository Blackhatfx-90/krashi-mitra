import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { ambulances } from '../../data/ambulances';
import {
  AlertTriangle, Phone, MapPin, Clock, X, Truck, User,
  CreditCard, Navigation, Shield, Video
} from 'lucide-react';

export default function Emergency() {
  const { addToast, emergencyActive, setEmergencyActive } = useAppStore();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('idle'); // idle, detecting, dispatching, tracking
  const [eta, setEta] = useState(8);
  const [ambulance, setAmbulance] = useState(null);

  useEffect(() => {
    let timer;
    if (phase === 'tracking' && eta > 0) {
      timer = setInterval(() => setEta((prev) => Math.max(0, prev - 1)), 5000);
    }
    return () => clearInterval(timer);
  }, [phase, eta]);

  const handleEmergency = () => {
    setPhase('detecting');
    addToast({ type: 'warning', message: 'Detecting your location...' });
    
    setTimeout(() => {
      setPhase('dispatching');
      addToast({ type: 'info', message: 'Finding nearest ambulance...' });
    }, 2000);

    setTimeout(() => {
      const amb = ambulances[0];
      setAmbulance(amb);
      setEta(amb.eta);
      setPhase('tracking');
      setEmergencyActive(true);
      addToast({ type: 'success', message: 'Ambulance dispatched! 🚑' });
    }, 4000);
  };

  const handleCancel = () => {
    setPhase('idle');
    setEmergencyActive(false);
    setAmbulance(null);
    addToast({ type: 'info', message: 'Emergency request cancelled' });
  };

  return (
    <div className="page-wrapper">
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif", color: 'var(--accent-red)' }}>
            <AlertTriangle size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
            Emergency Ambulance
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Call an ambulance immediately. We'll detect your location and dispatch the nearest available unit.
          </p>

          {phase === 'idle' && (
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.button
                className="emergency-btn"
                onClick={handleEmergency}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <AlertTriangle size={40} />
                <span>🚨 CALL</span>
                <span>AMBULANCE</span>
              </motion.button>
              <p style={{ color: 'var(--text-tertiary)', marginTop: 24, fontSize: '0.9rem' }}>
                Press the button for immediate emergency response
              </p>

              {/* Emergency Info Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 48, width: '100%', maxWidth: 700 }}>
                {[
                  { icon: <Clock size={24} />, title: 'Average Response', value: '8 min', color: 'var(--accent-teal)' },
                  { icon: <Truck size={24} />, title: 'Active Ambulances', value: `${ambulances.length}`, color: 'var(--accent-blue)' },
                  { icon: <Shield size={24} />, title: 'Verified Drivers', value: '100%', color: 'var(--accent-purple)' },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    className="glass-card"
                    style={{ textAlign: 'center' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <div style={{ color: card.color, marginBottom: 12 }}>{card.icon}</div>
                    <p style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{card.value}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{card.title}</p>
                  </motion.div>
                ))}
              </div>

              {/* Emergency Video Call */}
              <motion.div
                className="glass-card"
                style={{
                  marginTop: 32, width: '100%', maxWidth: 700,
                  background: 'rgba(79, 142, 247, 0.05)',
                  border: '1px solid rgba(79, 142, 247, 0.15)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                      📹 Emergency Video Consultation
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Get immediate medical advice via video call while you wait for the ambulance or for non-ambulance emergencies.
                    </p>
                  </div>
                  <button
                    className="clay-btn clay-btn-primary"
                    style={{ whiteSpace: 'nowrap', padding: '14px 24px' }}
                    onClick={() => navigate('/video-call?doctor=Dr.%20Priya%20Sharma&specialty=Emergency%20Medicine&type=emergency')}
                  >
                    <Video size={18} /> Call Doctor Now
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {(phase === 'detecting' || phase === 'dispatching') && (
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {phase === 'detecting' ? (
                  <MapPin size={64} style={{ color: 'var(--accent-red)' }} />
                ) : (
                  <Truck size={64} style={{ color: 'var(--accent-teal)' }} />
                )}
              </motion.div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 24, fontFamily: "'Outfit', sans-serif" }}>
                {phase === 'detecting' ? 'Detecting Location...' : 'Dispatching Ambulance...'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                {phase === 'detecting' ? 'Getting your exact GPS coordinates' : 'Contacting the nearest available unit'}
              </p>
              <div style={{ marginTop: 24 }}>
                <motion.div
                  style={{
                    width: 200, height: 4, borderRadius: 2,
                    background: 'var(--bg-secondary)', overflow: 'hidden',
                  }}
                >
                  <motion.div
                    style={{
                      height: '100%', borderRadius: 2,
                      background: 'var(--gradient-primary)',
                    }}
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {phase === 'tracking' && ambulance && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Map / Tracker */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden', minHeight: 400 }}>
                <div style={{
                  width: '100%', height: '100%', minHeight: 400,
                  background: 'var(--bg-secondary)',
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {/* Your location */}
                  <motion.div
                    style={{
                      position: 'absolute', left: '55%', top: '60%',
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'var(--accent-blue)',
                      border: '3px solid white',
                      zIndex: 2,
                    }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div style={{
                    position: 'absolute', left: 'calc(55% - 30px)', top: 'calc(60% + 14px)',
                    fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-blue)',
                    background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 4,
                  }}>Your Location</div>

                  {/* Ambulance */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      width: 32, height: 32,
                      zIndex: 3,
                    }}
                    animate={{
                      left: ['30%', '35%', '40%', '45%', '50%'],
                      top: ['30%', '35%', '40%', '45%', '55%'],
                    }}
                    transition={{ duration: 20, repeat: Infinity }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--accent-red)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '3px solid white',
                      fontSize: '16px',
                    }}>
                      🚑
                    </div>
                  </motion.div>

                  {/* Road lines */}
                  <svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
                    <line x1="35%" y1="35%" x2="55%" y2="60%" stroke="var(--accent-teal)" strokeWidth="2" strokeDasharray="5,5" opacity="0.5" />
                  </svg>
                </div>
              </div>

              {/* Info Panel */}
              <div>
                {/* ETA Card */}
                <motion.div
                  className="stat-card"
                  style={{ marginBottom: 20, textAlign: 'center', background: 'var(--accent-red)', padding: 24 }}
                  animate={{ scale: [1, 1.01, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: 4 }}>Estimated Arrival</p>
                  <p style={{ fontSize: '3rem', fontWeight: 900, color: 'white', fontFamily: "'Outfit', sans-serif" }}>
                    ~{eta} min
                  </p>
                  <div className="status-dot en-route" style={{ display: 'inline-block', marginRight: 8 }} />
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>Ambulance en route</span>
                </motion.div>

                {/* Driver Details */}
                <div className="glass-card" style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={18} style={{ color: 'var(--accent-teal)' }} /> Driver Details
                  </h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {[
                      { label: 'Driver Name', value: ambulance.driverName },
                      { label: 'License', value: ambulance.licenseNumber },
                      { label: 'Phone', value: ambulance.phone },
                      { label: 'Vehicle', value: ambulance.vehicleNumber },
                      { label: 'Type', value: ambulance.type },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <a href={`tel:${ambulance.phone}`} className="clay-btn clay-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    <Phone size={18} /> Call Driver
                  </a>
                  <button className="clay-btn clay-btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCancel}>
                    <X size={18} /> Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
