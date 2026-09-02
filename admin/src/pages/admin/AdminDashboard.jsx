import { motion } from 'framer-motion';
import {
  Users, UserCheck, Ambulance, Calendar, AlertTriangle,
  TrendingUp, DollarSign, Activity
} from 'lucide-react';
import { adminStats, registrationData, appointmentsBySpec, appointmentStatus } from '../../data/analytics';
import { doctors } from '../../data/doctors';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const stats = [
    { icon: <Users size={24} />, value: adminStats.totalUsers.toLocaleString(), label: 'Total Users', color: 'var(--accent-teal)', bg: 'rgba(0, 212, 170, 0.1)' },
    { icon: <UserCheck size={24} />, value: adminStats.verifiedDoctors, label: 'Verified Doctors', color: 'var(--accent-blue)', bg: 'rgba(79, 142, 247, 0.1)' },
    { icon: <Activity size={24} />, value: adminStats.pendingApprovals, label: 'Pending Approvals', color: 'var(--accent-orange)', bg: 'rgba(245, 158, 11, 0.1)' },
    { icon: <Ambulance size={24} />, value: adminStats.activeAmbulances, label: 'Active Ambulances', color: 'var(--accent-purple)', bg: 'rgba(139, 92, 246, 0.1)' },
    { icon: <Calendar size={24} />, value: adminStats.todayAppointments, label: 'Today Appointments', color: 'var(--clay-green)', bg: 'rgba(110, 231, 183, 0.1)' },
    { icon: <AlertTriangle size={24} />, value: adminStats.emergencyCalls, label: 'Emergency Calls', color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)' },
  ];

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        <motion.div variants={itemVariants}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            System overview and management controls
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

        {/* Live Map */}
        <motion.div variants={itemVariants} className="glass-card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
              Live Map Overview
            </h3>
          </div>
          <div style={{
            height: 350, background: 'var(--bg-secondary)', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Doctor pins */}
            {doctors.map((doc, i) => (
              <motion.div
                key={doc.id}
                style={{
                  position: 'absolute',
                  left: `${15 + (i * 13) % 65}%`,
                  top: `${10 + (i * 17) % 60}%`,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid white',
                  cursor: 'pointer', zIndex: 2,
                }}
                title={`${doc.name} (Doctor)`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
            {/* Ambulance pins */}
            {[{ x: '45%', y: '40%' }, { x: '60%', y: '55%' }, { x: '30%', y: '65%' }].map((pos, i) => (
              <motion.div
                key={`amb-${i}`}
                style={{
                  position: 'absolute', left: pos.x, top: pos.y,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#ef4444',
                  border: '2px solid white', zIndex: 2,
                }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
            {/* User clusters */}
            {[{ x: '20%', y: '30%', s: 30 }, { x: '50%', y: '25%', s: 24 }, { x: '70%', y: '45%', s: 28 }, { x: '35%', y: '50%', s: 20 }].map((cluster, i) => (
              <div
                key={`user-${i}`}
                style={{
                  position: 'absolute', left: cluster.x, top: cluster.y,
                  width: cluster.s, height: cluster.s, borderRadius: '50%',
                  background: 'rgba(79, 142, 247, 0.3)',
                  border: '2px solid var(--accent-blue)', zIndex: 1,
                }}
              />
            ))}

            {/* Legend */}
            <div style={{
              position: 'absolute', bottom: 16, left: 16,
              display: 'flex', gap: 16, background: 'var(--bg-card)',
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)', fontSize: '0.75rem',
            }}>
              {[
                { color: '#22c55e', label: 'Doctors' },
                { color: '#4f8ef7', label: 'Users' },
                { color: '#ef4444', label: 'Ambulances' },
                { color: '#f59e0b', label: 'Pending' },
              ].map((item, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Registration Trend */}
          <motion.div variants={itemVariants} className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
              Daily User Registrations (30 days)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} interval={4} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="users" stroke="var(--accent-teal)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Appointments by Specialization */}
          <motion.div variants={itemVariants} className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
              Appointments by Specialization
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={appointmentsBySpec}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={10} angle={-30} textAnchor="end" height={60} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Pie Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <motion.div variants={itemVariants} className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
              Appointment Status Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={appointmentStatus}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {appointmentStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Quick Metrics */}
          <motion.div variants={itemVariants} className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
              System Metrics
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { label: 'Monthly Appointments', value: adminStats.monthlyAppointments.toLocaleString(), trend: '+12%', color: 'var(--accent-teal)' },
                { label: 'Total Revenue', value: adminStats.totalRevenue, trend: '+8%', color: 'var(--accent-blue)' },
                { label: 'Avg Response Time', value: '8 min', trend: '-15%', color: 'var(--clay-green)' },
                { label: 'Satisfaction Rate', value: '94.2%', trend: '+3%', color: 'var(--accent-purple)' },
              ].map((metric, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{metric.label}</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: metric.color }}>{metric.value}</p>
                  </div>
                  <span style={{
                    fontSize: '0.8rem', fontWeight: 600,
                    color: metric.trend.startsWith('+') ? '#22c55e' : 'var(--accent-red)',
                  }}>
                    {metric.trend.startsWith('+') ? <TrendingUp size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} /> : null}
                    {metric.trend}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
