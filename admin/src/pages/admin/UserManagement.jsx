import { useState } from 'react';
import { motion } from 'framer-motion';
import { allUsers } from '../../data/analytics';
import { Search, Users, Eye, Ban, Trash2, Download } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function UserManagement() {
  const { addToast } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState(allUsers);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSuspend = (id) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u
    ));
    addToast({ type: 'info', message: 'User status updated' });
  };

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
              <Users size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
              User Management
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>{users.length} total registered users</p>
          </div>
          <button className="clay-btn clay-btn-ghost"><Download size={16} /> Export CSV</button>
        </div>

        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="skeu-input" style={{ paddingLeft: 42 }} placeholder="Search by name, email, or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Joined</th><th>Appointments</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={`https://api.dicebear.com/7.x/personas/svg?seed=${user.name}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        {user.name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{user.phone}</td>
                    <td>{user.location}</td>
                    <td style={{ fontSize: '0.8rem' }}>{user.joined}</td>
                    <td style={{ fontWeight: 600 }}>{user.appointments}</td>
                    <td>
                      <span className={`badge ${user.status === 'Active' ? 'badge-teal' : 'badge-red'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button title="View" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)', padding: 4 }}><Eye size={16} /></button>
                        <button title="Suspend/Activate" onClick={() => toggleSuspend(user.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-orange)', padding: 4 }}><Ban size={16} /></button>
                        <button title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', padding: 4 }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
