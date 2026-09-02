import { motion } from 'framer-motion';
import {
  Users, Calendar, Clock, AlertTriangle, Star, Eye,
  CheckCircle, XCircle, RotateCcw, ChevronRight
} from 'lucide-react';
import { mockAppointments } from '../../data/appointments';
import { doctorEarnings } from '../../data/analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DoctorDashboard() {
  const stats = [
    { icon: <Users size={24} />, value: '1,247', label: 'Total Patients', color: 'var(--accent-teal)', bg: 'rgba(0, 212, 170, 0.1)' },
    { icon: <Calendar size={24} />, value: '8', label: 'Appointments Today', color: 'var(--accent-blue)', bg: 'rgba(79, 142, 247, 0.1)' },
    { icon: <Clock size={24} />, value: '3', label: 'Pending', color: 'var(--accent-orange)', bg: 'rgba(245, 158, 11, 0.1)' },
    { icon: <AlertTriangle size={24} />, value: '2', label: 'Emergency Cases', color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)' },
    { icon: <Eye size={24} />, value: '423', label: 'Profile Views', color: 'var(--accent-purple)', bg: 'rgba(139, 92, 246, 0.1)' },
    { icon: <Star size={24} />, value: '4.8', label: 'Avg Rating', color: 'var(--accent-yellow)', bg: 'rgba(234, 179, 8, 0.1)' },
  ];

  const todayAppointments = mockAppointments.filter((a) => a.date === '2026-04-06');

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        <motion.div variants={itemVariants}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            Doctor Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Welcome back, Dr. Priya Sharma. Here's your practice overview.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {stats.map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="stat-card">
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                background: stat.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: stat.color, marginBottom: 12,
              }}>
                {stat.icon}
              </div>
              <div className="stat-value" style={{ fontSize: '1.6rem' }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          {/* Today's Appointments */}
          <motion.div variants={itemVariants} className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
              Today's Appointments
            </h3>
            {todayAppointments.length > 0 ? todayAppointments.map((apt, i) => (
              <div key={apt.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom: i < todayAppointments.length - 1 ? '1px solid var(--glass-border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={`https://api.dicebear.com/7.x/personas/svg?seed=${apt.patientName}`}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--glass-border)' }}
                  />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{apt.patientName}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {apt.time} · Age {apt.patientAge} · {apt.type}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={`badge ${apt.status === 'Confirmed' ? 'badge-teal' : apt.status === 'Pending' ? 'badge-orange' : 'badge-blue'}`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32 }}>No appointments today</p>
            )}

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { icon: <CheckCircle size={14} />, label: 'Mark Complete', color: 'badge-teal' },
                { icon: <RotateCcw size={14} />, label: 'Reschedule', color: 'badge-blue' },
                { icon: <XCircle size={14} />, label: 'Cancel', color: 'badge-red' },
              ].map((action, i) => (
                <button key={i} className={`badge ${action.color}`} style={{ cursor: 'pointer', border: 'none', padding: '6px 14px', fontSize: '0.8rem' }}>
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Earnings Chart */}
          <motion.div variants={itemVariants} className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
              Monthly Earnings
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={doctorEarnings}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                  }}
                  formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--accent-teal)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: 'var(--accent-teal)' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Total This Month: <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>₹72,000</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Emergency Queue */}
        <motion.div variants={itemVariants} className="glass-card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, fontFamily: "'Outfit', sans-serif", color: 'var(--accent-red)' }}>
            <AlertTriangle size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: -3 }} />
            Emergency Queue
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { name: 'Rohit Sharma', age: 45, condition: 'Chest Pain', time: '15 min ago', severity: 'High' },
              { name: 'Anjali Deshmukh', age: 28, condition: 'Severe headache', time: '32 min ago', severity: 'Medium' },
            ].map((emergency, i) => (
              <div key={i} style={{
                padding: 16, background: 'rgba(239, 68, 68, 0.05)',
                borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.15)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>{emergency.name}, {emergency.age}</span>
                  <span className={`badge ${emergency.severity === 'High' ? 'badge-red' : 'badge-orange'}`}>
                    {emergency.severity}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  {emergency.condition} · {emergency.time}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="clay-btn clay-btn-primary" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>Accept</button>
                  <button className="clay-btn clay-btn-ghost" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
