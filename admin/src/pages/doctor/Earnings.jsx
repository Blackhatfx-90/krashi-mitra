import { motion } from 'framer-motion';
import { doctorEarnings } from '../../data/analytics';
import { DollarSign, TrendingUp, CreditCard, Calendar, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

export default function Earnings() {
  const totalRevenue = doctorEarnings.reduce((sum, m) => sum + m.revenue, 0);
  const lastMonth = doctorEarnings[doctorEarnings.length - 2]?.revenue || 0;
  const currentMonth = doctorEarnings[doctorEarnings.length - 1]?.revenue || 0;
  const growth = lastMonth > 0 ? (((currentMonth - lastMonth) / lastMonth) * 100).toFixed(1) : 0;

  const transactions = [
    { id: 1, patient: 'Nitin Kumar', type: 'Consultation', amount: 800, date: '2026-04-06', status: 'Paid' },
    { id: 2, patient: 'Priya Verma', type: 'Follow-up', amount: 500, date: '2026-04-06', status: 'Paid' },
    { id: 3, patient: 'Rohit Sharma', type: 'Emergency', amount: 1500, date: '2026-04-05', status: 'Paid' },
    { id: 4, patient: 'Anjali Deshmukh', type: 'Consultation', amount: 800, date: '2026-04-05', status: 'Pending' },
    { id: 5, patient: 'Amit Patel', type: 'Consultation', amount: 800, date: '2026-04-04', status: 'Paid' },
    { id: 6, patient: 'Kavya Nair', type: 'Follow-up', amount: 500, date: '2026-04-03', status: 'Paid' },
    { id: 7, patient: 'Deepak Mishra', type: 'Emergency', amount: 1500, date: '2026-04-03', status: 'Pending' },
    { id: 8, patient: 'Ritu Singh', type: 'Consultation', amount: 800, date: '2026-04-02', status: 'Paid' },
  ];

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
              <DollarSign size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
              Earnings Overview
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Track your revenue and payment history</p>
          </div>
          <button className="clay-btn clay-btn-ghost">
            <Download size={16} /> Export Report
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { icon: <DollarSign size={24} />, label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, sub: 'All time', color: 'var(--accent-teal)', bg: 'rgba(0, 212, 170, 0.1)' },
            { icon: <Calendar size={24} />, label: 'This Month', value: `₹${currentMonth.toLocaleString()}`, sub: `${growth > 0 ? '+' : ''}${growth}% vs last month`, color: growth > 0 ? 'var(--clay-green)' : 'var(--accent-red)', bg: growth > 0 ? 'rgba(110, 231, 183, 0.1)' : 'rgba(239, 68, 68, 0.1)' },
            { icon: <CreditCard size={24} />, label: 'Pending Payouts', value: '₹2,300', sub: '2 pending', color: 'var(--accent-orange)', bg: 'rgba(245, 158, 11, 0.1)' },
            { icon: <TrendingUp size={24} />, label: 'Avg per Patient', value: '₹850', sub: 'This month', color: 'var(--accent-blue)', bg: 'rgba(79, 142, 247, 0.1)' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                background: stat.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: stat.color, marginBottom: 12,
              }}>
                {stat.icon}
              </div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <p style={{ fontSize: '0.75rem', color: stat.color, marginTop: 4, fontWeight: 500 }}>{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
              Monthly Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={doctorEarnings}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="var(--accent-teal)" strokeWidth={3} dot={{ r: 5, fill: 'var(--accent-teal)' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
              Monthly Comparison
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={doctorEarnings}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Transaction History */}
        <motion.div className="glass-card" style={{ padding: 0, overflow: 'hidden' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
              Recent Transactions
            </h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th><th>Type</th><th>Date</th><th>Amount</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={`https://api.dicebear.com/7.x/personas/svg?seed=${tx.patient}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                      {tx.patient}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${tx.type === 'Emergency' ? 'badge-red' : tx.type === 'Follow-up' ? 'badge-blue' : 'badge-teal'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tx.date}</td>
                  <td style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-teal)' }}>
                    ₹{tx.amount}
                  </td>
                  <td>
                    <span className={`badge ${tx.status === 'Paid' ? 'badge-teal' : 'badge-orange'}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>
    </div>
  );
}
