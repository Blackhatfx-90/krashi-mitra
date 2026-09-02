import { useState } from 'react';
import { motion } from 'framer-motion';
import { mockAppointments } from '../../data/appointments';
import { useAppStore } from '../../store/useAppStore';
import {
  Calendar, CheckCircle, XCircle, RotateCcw, Clock,
  User, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import Modal from '../../components/ui/Modal';

export default function AppointmentMgr() {
  const { addToast } = useAppStore();
  const [view, setView] = useState('list'); // 'list' or 'calendar'
  const [appointments, setAppointments] = useState(mockAppointments);
  const [selectedApt, setSelectedApt] = useState(null);
  const [detailModal, setDetailModal] = useState(false);

  const updateStatus = (id, status) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    addToast({ type: 'success', message: `Appointment ${status.toLowerCase()}!` });
  };

  const todayApts = appointments.filter(a => a.date === '2026-04-06');
  const tomorrowApts = appointments.filter(a => a.date === '2026-04-07');
  const otherApts = appointments.filter(a => a.date !== '2026-04-06' && a.date !== '2026-04-07');

  const statusColors = {
    Confirmed: 'badge-teal',
    Pending: 'badge-orange',
    Completed: 'badge-purple',
    Cancelled: 'badge-red',
  };

  const renderAppointmentCard = (apt, i) => (
    <motion.div
      key={apt.id}
      className="glass-card"
      style={{ padding: 16, marginBottom: 12 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={`https://api.dicebear.com/7.x/personas/svg?seed=${apt.patientName}`}
            alt=""
            style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--glass-border)' }}
          />
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{apt.patientName}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Age {apt.patientAge} · {apt.time}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`badge ${apt.type === 'Emergency' ? 'badge-red' : 'badge-blue'}`}>
            {apt.type}
          </span>
          <span className={`badge ${statusColors[apt.status]}`}>
            {apt.status}
          </span>
        </div>
      </div>

      {apt.notes && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 10, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
          📝 {apt.notes}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {apt.status === 'Pending' && (
          <button className="clay-btn clay-btn-primary" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => updateStatus(apt.id, 'Confirmed')}>
            <CheckCircle size={14} /> Confirm
          </button>
        )}
        {(apt.status === 'Confirmed' || apt.status === 'Pending') && (
          <>
            <button className="clay-btn clay-btn-secondary" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => updateStatus(apt.id, 'Completed')}>
              <CheckCircle size={14} /> Complete
            </button>
            <button className="clay-btn clay-btn-ghost" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => addToast({ type: 'info', message: 'Reschedule modal would open here' })}>
              <RotateCcw size={14} /> Reschedule
            </button>
            <button className="clay-btn clay-btn-danger" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => updateStatus(apt.id, 'Cancelled')}>
              <XCircle size={14} /> Cancel
            </button>
          </>
        )}
        <button className="clay-btn clay-btn-ghost" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => { setSelectedApt(apt); setDetailModal(true); }}>
          <Eye size={14} /> View
        </button>
      </div>
    </motion.div>
  );

  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      num: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
    };
  });

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
              <Calendar size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
              Appointment Manager
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your patient appointments</p>
          </div>
          <div className="tabs">
            <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List View</button>
            <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>Calendar</button>
          </div>
        </div>

        {view === 'calendar' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 24 }}>
            {calendarDays.map((day) => {
              const dayApts = appointments.filter(a => a.date === day.date);
              return (
                <div
                  key={day.date}
                  className="glass-card"
                  style={{
                    padding: 12, textAlign: 'center', cursor: 'pointer',
                    border: day.date === new Date().toISOString().split('T')[0] ? '2px solid var(--accent-teal)' : undefined,
                  }}
                >
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{day.day}</p>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", margin: '4px 0' }}>{day.num}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{day.month}</p>
                  {dayApts.length > 0 && (
                    <span className="badge badge-teal" style={{ marginTop: 8, fontSize: '0.7rem' }}>
                      {dayApts.length} apt{dayApts.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Today', value: todayApts.length, color: 'var(--accent-teal)' },
            { label: 'Confirmed', value: appointments.filter(a => a.status === 'Confirmed').length, color: 'var(--accent-blue)' },
            { label: 'Pending', value: appointments.filter(a => a.status === 'Pending').length, color: 'var(--accent-orange)' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'Completed').length, color: 'var(--accent-purple)' },
          ].map((stat, i) => (
            <div key={i} className="stat-card" style={{ textAlign: 'center' }}>
              <p className="stat-value" style={{ fontSize: '1.5rem' }}>{stat.value}</p>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Appointment Sections */}
        {todayApts.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'var(--accent-teal)', fontFamily: "'Outfit', sans-serif" }}>
              📅 Today
            </h2>
            {todayApts.map((apt, i) => renderAppointmentCard(apt, i))}
          </div>
        )}

        {tomorrowApts.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, fontFamily: "'Outfit', sans-serif" }}>
              📅 Tomorrow
            </h2>
            {tomorrowApts.map((apt, i) => renderAppointmentCard(apt, i))}
          </div>
        )}

        {otherApts.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, fontFamily: "'Outfit', sans-serif" }}>
              📅 Upcoming
            </h2>
            {otherApts.map((apt, i) => renderAppointmentCard(apt, i))}
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Appointment Details" maxWidth={480}>
        {selectedApt && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <img src={`https://api.dicebear.com/7.x/personas/svg?seed=${selectedApt.patientName}`} alt="" style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--glass-border)' }} />
              <div>
                <h3 style={{ fontWeight: 700 }}>{selectedApt.patientName}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Age: {selectedApt.patientAge}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12, fontSize: '0.9rem' }}>
              {[
                ['Date', selectedApt.date],
                ['Time', selectedApt.time],
                ['Type', selectedApt.type],
                ['Status', selectedApt.status],
                ['Notes', selectedApt.notes || 'No notes'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
