import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { Link } from 'react-router-dom';
import { getGreeting } from '../../utils/helpers';
import {
  Calendar, FileText, AlertTriangle, UserPlus, Activity,
  Heart, TrendingUp, Clock, ChevronRight, Salad, Star
} from 'lucide-react';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const greeting = getGreeting();

  const stats = [
    { icon: <Calendar size={24} />, value: '3', label: 'Active Appointments', color: 'var(--accent-teal)', bg: 'rgba(0, 212, 170, 0.1)' },
    { icon: <FileText size={24} />, value: '2', label: 'Pending Reports', color: 'var(--accent-blue)', bg: 'rgba(79, 142, 247, 0.1)' },
    { icon: <Heart size={24} />, value: '86', label: 'Health Score', color: 'var(--accent-purple)', bg: 'rgba(139, 92, 246, 0.1)' },
    { icon: <TrendingUp size={24} />, value: '+12%', label: 'Improvement', color: 'var(--clay-green)', bg: 'rgba(110, 231, 183, 0.1)' },
  ];

  const quickActions = [
    { icon: <UserPlus size={22} />, label: 'Add Patient', path: '/patient-profile', color: 'var(--accent-teal)' },
    { icon: <Calendar size={22} />, label: 'Book Appointment', path: '/appointments', color: 'var(--accent-blue)' },
    { icon: <FileText size={22} />, label: 'Upload Report', path: '/reports', color: 'var(--accent-purple)' },
    { icon: <AlertTriangle size={22} />, label: 'Emergency', path: '/emergency', color: 'var(--accent-red)' },
    { icon: <Salad size={22} />, label: 'AI Dietician', path: '/dietician', color: 'var(--clay-green)' },
    { icon: <Star size={22} />, label: 'Rate Doctor', path: '/rate-doctor', color: 'var(--accent-yellow)' },
  ];

  const recentAppointments = [
    { doctor: 'Dr. Priya Sharma', spec: 'Cardiologist', date: 'Today, 10:00 AM', status: 'Confirmed' },
    { doctor: 'Dr. Rajesh Patel', spec: 'Neurologist', date: 'Tomorrow, 2:00 PM', status: 'Pending' },
    { doctor: 'Dr. Sneha Joshi', spec: 'Pediatrician', date: 'Apr 8, 11:00 AM', status: 'Confirmed' },
  ];

  const healthTips = [
    '💧 Stay hydrated — drink 8 glasses of water daily',
    '🚶 Walk at least 30 minutes every day',
    '😴 Ensure 7-8 hours of quality sleep',
    '🥗 Include 5 servings of fruits & vegetables daily',
  ];

  return (
    <div className="page-wrapper">
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          {/* Greeting Card */}
          <motion.div
            variants={itemVariants}
            className="glass-card"
            style={{
              background: 'var(--gradient-primary)',
              border: 'none',
              marginBottom: 32,
              padding: 32,
              borderRadius: 'var(--radius-xl)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'white',
                fontFamily: "'Outfit', sans-serif",
                marginBottom: 8,
              }}>
                {greeting}, {user?.name?.split(' ')[0] || 'User'} 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>
                Welcome back to MediConnect. Here's your health overview.
              </p>
            </div>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', right: -30, top: -30, width: 180, height: 180,
              borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
            }} />
            <div style={{
              position: 'absolute', right: 60, bottom: -40, width: 120, height: 120,
              borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
            }} />
          </motion.div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
            {stats.map((stat, i) => (
              <motion.div key={i} variants={itemVariants} className="stat-card">
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: stat.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: stat.color, marginBottom: 16,
                }}>
                  {stat.icon}
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 16, fontFamily: "'Outfit', sans-serif" }}>
              Quick Actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 32 }}>
              {quickActions.map((action, i) => (
                <Link key={i} to={action.path}>
                  <motion.div
                    className="glass-card"
                    style={{
                      textAlign: 'center', padding: 20, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    }}
                    whileHover={{ scale: 1.04, y: -4 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <div style={{
                      width: 50, height: 50, borderRadius: 'var(--radius-md)',
                      background: `${action.color}15`, color: action.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {action.icon}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{action.label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Recent Appointments */}
            <motion.div variants={itemVariants} className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                  <Clock size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: -3 }} />
                  Upcoming Appointments
                </h3>
                <Link to="/appointments" style={{ color: 'var(--accent-teal)', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  View All <ChevronRight size={16} />
                </Link>
              </div>
              {recentAppointments.map((apt, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 0',
                    borderBottom: i < recentAppointments.length - 1 ? '1px solid var(--glass-border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={`https://api.dicebear.com/7.x/personas/svg?seed=${apt.doctor}`}
                      alt={apt.doctor}
                      style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--glass-border)' }}
                    />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{apt.doctor}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{apt.spec} · {apt.date}</p>
                    </div>
                  </div>
                  <span className={`badge ${apt.status === 'Confirmed' ? 'badge-teal' : 'badge-orange'}`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Health Tips */}
            <motion.div variants={itemVariants} className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
                <Activity size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: -3 }} />
                Daily Health Tips
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {healthTips.map((tip, i) => (
                  <motion.div
                    key={i}
                    style={{
                      padding: '14px 18px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    {tip}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
