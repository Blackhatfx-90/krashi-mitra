import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, UserCheck, Ambulance, Calendar,
  BarChart3, Settings, Stethoscope, ClipboardList, DollarSign,
  FileText, AlertTriangle, Video
} from 'lucide-react';

const adminLinks = [
  { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
  { path: '/admin/doctors', label: 'Doctor Verification', icon: <UserCheck size={20} /> },
  { path: '/admin/ambulances', label: 'Ambulance Verification', icon: <Ambulance size={20} /> },
  { path: '/admin/users', label: 'User Management', icon: <Users size={20} /> },
  { path: '/admin/appointments', label: 'Appointments', icon: <Calendar size={20} /> },
  { path: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  { path: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> },
];

const doctorLinks = [
  { path: '/doctor', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
  { path: '/doctor/appointments', label: 'Appointments', icon: <Calendar size={20} /> },
  { path: '/doctor/video-consult', label: 'Video Consult', icon: <Video size={20} /> },
  { path: '/doctor/patients', label: 'Patient Records', icon: <ClipboardList size={20} /> },
  { path: '/doctor/emergency', label: 'Emergency Queue', icon: <AlertTriangle size={20} /> },
  { path: '/doctor/earnings', label: 'Earnings', icon: <DollarSign size={20} /> },
];

export default function Sidebar({ type = 'admin' }) {
  const links = type === 'admin' ? adminLinks : doctorLinks;
  const location = useLocation();

  return (
    <aside className="sidebar-glass">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 12, paddingLeft: 16 }}>
          {type === 'admin' ? 'Admin Panel' : 'Doctor Portal'}
        </p>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {links.map((link) => {
          const isActive = link.end
            ? location.pathname === link.path
            : location.pathname.startsWith(link.path) && location.pathname !== (type === 'admin' ? '/admin' : '/doctor');

          const isExactActive = location.pathname === link.path;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={`sidebar-link ${isExactActive || (link.end && isActive) ? '' : ''}`}
              style={({ isActive: navActive }) => ({
                background: navActive ? 'var(--accent-teal)' : 'transparent',
                color: navActive ? '#0a0f1e' : 'var(--text-secondary)',
                boxShadow: navActive ? 'var(--shadow-glow-teal)' : 'none',
              })}
            >
              {link.icon}
              <span style={{ fontSize: '0.9rem' }}>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Portal Switcher */}
      <div style={{ marginTop: 'auto', paddingTop: 32 }}>
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>Switch Portal</p>
          <NavLink to="/" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 'var(--radius-md)',
            background: 'var(--glass-bg)', color: 'var(--text-secondary)',
            fontSize: '0.85rem', fontWeight: 500,
            border: '1px solid var(--glass-border)',
          }}>
            <Stethoscope size={16} />
            Public Portal
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
