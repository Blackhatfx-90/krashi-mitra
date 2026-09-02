import { useState } from 'react';
import { motion } from 'framer-motion';
import { mockAppointments } from '../../data/appointments';
import { Calendar, Search, Download, Filter } from 'lucide-react';

export default function AppointmentMgmt() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const filtered = mockAppointments.filter(a => {
    const matchSearch = a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || a.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus ? a.status === filterStatus : true;
    const matchType = filterType ? a.type === filterType : true;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
              <Calendar size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
              Appointment Management
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>All appointments across all doctors</p>
          </div>
          <button className="clay-btn clay-btn-ghost"><Download size={16} /> Export CSV</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input className="skeu-input" style={{ paddingLeft: 42 }} placeholder="Search by patient or doctor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="skeu-select" style={{ maxWidth: 180 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Confirmed</option><option>Pending</option><option>Completed</option>
          </select>
          <select className="skeu-select" style={{ maxWidth: 180 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option>Regular</option><option>Emergency</option>
          </select>
        </div>

        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th><th>Doctor</th><th>Specialization</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt) => (
                <tr key={apt.id}>
                  <td style={{ fontWeight: 600 }}>{apt.patientName}</td>
                  <td>{apt.doctorName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{apt.doctorSpecialization}</td>
                  <td>{apt.date}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{apt.time}</td>
                  <td>
                    <span className={`badge ${apt.type === 'Emergency' ? 'badge-red' : 'badge-blue'}`}>{apt.type}</span>
                  </td>
                  <td>
                    <span className={`badge ${apt.status === 'Confirmed' ? 'badge-teal' : apt.status === 'Pending' ? 'badge-orange' : 'badge-purple'}`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
