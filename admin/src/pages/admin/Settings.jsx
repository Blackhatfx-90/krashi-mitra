import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Users, Bell, Activity, Shield, Server } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true });

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
          <SettingsIcon size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
          Admin Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Manage system configuration</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Admin Accounts */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} style={{ color: 'var(--accent-teal)' }} /> Admin Accounts
            </h3>
            {[
              { name: 'Admin User', email: 'admin@mediconnect.com', role: 'Super Admin' },
              { name: 'Moderator', email: 'mod@mediconnect.com', role: 'Moderator' },
            ].map((admin, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i === 0 ? '1px solid var(--glass-border)' : 'none' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{admin.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{admin.email}</p>
                </div>
                <span className="badge badge-teal">{admin.role}</span>
              </div>
            ))}
            <button className="clay-btn clay-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 16, fontSize: '0.85rem' }}>
              <Users size={16} /> Add Admin
            </button>
          </div>

          {/* Notifications */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} style={{ color: 'var(--accent-blue)' }} /> Notification Settings
            </h3>
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{key} Notifications</span>
                <button
                  onClick={() => setNotifications({ ...notifications, [key]: !value })}
                  style={{
                    width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: value ? 'var(--accent-teal)' : 'var(--bg-secondary)',
                    position: 'relative', transition: 'var(--transition-smooth)',
                    boxShadow: 'var(--skeu-inset)',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 3, left: value ? 25 : 3,
                    transition: 'var(--transition-smooth)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            ))}
          </div>

          {/* System Health */}
          <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={18} style={{ color: 'var(--clay-green)' }} /> System Health
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Server Uptime', value: '99.97%', status: 'online' },
                { label: 'API Response', value: '142ms', status: 'online' },
                { label: 'Database', value: 'Healthy', status: 'online' },
                { label: 'Storage', value: '64% used', status: 'online' },
              ].map((item, i) => (
                <div key={i} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                    <div className={`status-dot ${item.status}`} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: 'var(--accent-teal)' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
