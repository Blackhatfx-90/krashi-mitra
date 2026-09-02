import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { motion } from 'framer-motion';
import {
  Home, Calendar, FileText, AlertTriangle, Salad, Menu, X, LogOut, Video
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ type = 'public' }) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const publicLinks = [
    { path: '/dashboard', label: 'Home', icon: <Home size={18} /> },
    { path: '/appointments', label: 'My Appointments', icon: <Calendar size={18} /> },
    { path: '/video-appointments', label: 'Video Calls', icon: <Video size={18} /> },
    { path: '/reports', label: 'Reports', icon: <FileText size={18} /> },
    { path: '/emergency', label: 'Emergency', icon: <AlertTriangle size={18} /> },
    { path: '/dietician', label: 'AI Dietician', icon: <Salad size={18} /> },
  ];

  const links = type === 'public' ? publicLinks : [];

  return (
    <nav className="navbar-glass">
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to={type === 'admin' ? '/admin' : type === 'doctor' ? '/doctor' : '/dashboard'} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="url(#logo-grad)" />
              <rect x="14" y="6" width="8" height="24" rx="3" fill="white" />
              <rect x="6" y="14" width="24" height="8" rx="3" fill="white" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36">
                  <stop stopColor="#00d4aa" />
                  <stop offset="1" stopColor="#4f8ef7" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: '1.3rem',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            MediConnect
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }} className="nav-links-desktop">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.88rem',
                fontWeight: 500,
                color: location.pathname === link.path ? '#0a0f1e' : 'var(--text-secondary)',
                background: location.pathname === link.path ? 'var(--accent-teal)' : 'transparent',
                transition: 'var(--transition-smooth)',
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <div className="avatar-pill" style={{ cursor: 'pointer' }}>
              <img
                src={`https://api.dicebear.com/7.x/personas/svg?seed=${user.name || 'user'}`}
                alt="avatar"
                style={{ width: 32, height: 32, borderRadius: '50%' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.name?.split(' ')[0] || 'User'}
              </span>
            </div>
          )}
          {user && (
            <button
              onClick={() => { logout(); window.location.href = '/'; }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: 8,
              }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'none',
            }}
            className="mobile-menu-btn"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Spacer for top-right theme toggle */}
      <div style={{ width: 60 }} />
    </nav>
  );
}
