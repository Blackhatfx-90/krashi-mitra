import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockPatients } from '../../data/patients';
import {
  ClipboardList, Search, ChevronDown, ChevronUp, User,
  Droplets, HeartPulse, FileText, Calendar, AlertCircle
} from 'lucide-react';

export default function PatientRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = mockPatients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diseases.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
          <ClipboardList size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
          Patient Records
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          View complete medical history of all your patients ({mockPatients.length} total)
        </p>

        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            className="skeu-input"
            style={{ paddingLeft: 42 }}
            placeholder="Search by patient name or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map((patient, i) => (
            <motion.div
              key={patient.id}
              className="glass-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              layout
            >
              {/* Header */}
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === patient.id ? null : patient.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img
                    src={`https://api.dicebear.com/7.x/personas/svg?seed=${patient.name}`}
                    alt={patient.name}
                    style={{ width: 50, height: 50, borderRadius: '50%', border: '3px solid var(--glass-border)' }}
                  />
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{patient.name}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Age {patient.age} · {patient.gender} · <Droplets size={12} style={{ display: 'inline', verticalAlign: -1 }} /> {patient.bloodGroup}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {patient.diseases.map((d, j) => (
                        <span key={j} className="badge badge-teal" style={{ fontSize: '0.72rem' }}>{d}</span>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                      Last Visit: {patient.lastVisit} · {patient.reports} reports
                    </p>
                  </div>
                  {expandedId === patient.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedId === patient.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ paddingTop: 20, marginTop: 20, borderTop: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* Symptoms */}
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <HeartPulse size={16} style={{ color: 'var(--accent-red)' }} /> Current Symptoms
                          </h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                            {patient.symptoms}
                          </p>
                        </div>

                        {/* Medical History */}
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={16} style={{ color: 'var(--accent-blue)' }} /> Medical History
                          </h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                            {patient.medicalHistory}
                          </p>
                        </div>

                        {/* Allergies */}
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertCircle size={16} style={{ color: 'var(--accent-orange)' }} /> Allergies
                          </h4>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {patient.allergies.length > 0 ? patient.allergies.map((a, j) => (
                              <span key={j} className="badge badge-red" style={{ fontSize: '0.8rem' }}>⚠️ {a}</span>
                            )) : (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No known allergies</span>
                            )}
                          </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={16} style={{ color: 'var(--accent-purple)' }} /> Emergency Contact
                          </h4>
                          <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                            <p style={{ fontWeight: 600 }}>{patient.emergencyContact.name}</p>
                            <p style={{ color: 'var(--text-secondary)' }}>{patient.emergencyContact.relation} · {patient.emergencyContact.phone}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button className="clay-btn clay-btn-primary" style={{ fontSize: '0.82rem', padding: '10px 18px' }}>
                          <Calendar size={14} /> Schedule Follow-up
                        </button>
                        <button className="clay-btn clay-btn-secondary" style={{ fontSize: '0.82rem', padding: '10px 18px' }}>
                          <FileText size={14} /> View Reports
                        </button>
                        <button className="clay-btn clay-btn-ghost" style={{ fontSize: '0.82rem', padding: '10px 18px' }}>
                          <HeartPulse size={14} /> Add Prescription
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
