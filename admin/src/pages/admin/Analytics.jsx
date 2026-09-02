import { motion } from 'framer-motion';
import { BarChart3, Brain, MapPin, TrendingUp } from 'lucide-react';
import { appointmentsBySpec } from '../../data/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const commonDiseases = [
    { name: 'Hypertension', count: 1243, color: 'var(--accent-red)' },
    { name: 'Diabetes', count: 986, color: 'var(--accent-orange)' },
    { name: 'Asthma', count: 654, color: 'var(--accent-blue)' },
    { name: 'Arthritis', count: 521, color: 'var(--accent-purple)' },
    { name: 'Depression', count: 432, color: 'var(--clay-pink)' },
    { name: 'Heart Disease', count: 378, color: 'var(--accent-teal)' },
    { name: 'Thyroid', count: 312, color: 'var(--accent-yellow)' },
    { name: 'PCOS', count: 289, color: 'var(--clay-green)' },
  ];

  return (
    <div style={{ marginLeft: 260, padding: '96px 32px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
          <BarChart3 size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
          Reports & Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Insights from AI scans, disease patterns, and platform usage</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* AI Scan History */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={18} style={{ color: 'var(--accent-purple)' }} /> AI Scan Analytics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Total Scans', value: '3,456', trend: '+23%' },
                { label: 'Anomalies Detected', value: '487', trend: '+8%' },
                { label: 'Accuracy Rate', value: '94.2%', trend: '+2%' },
                { label: 'Avg Processing', value: '2.3s', trend: '-12%' },
              ].map((stat, i) => (
                <div key={i} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{stat.value}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</p>
                  <span style={{ fontSize: '0.7rem', color: stat.trend.startsWith('+') ? '#22c55e' : 'var(--accent-teal)', fontWeight: 600 }}>{stat.trend}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Common Diseases */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--accent-teal)' }} /> Most Common Diseases
            </h3>
            {commonDiseases.map((disease, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, width: 100 }}>{disease.name}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: disease.color, borderRadius: 4 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(disease.count / 1300) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                  />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", width: 50, textAlign: 'right' }}>{disease.count}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Geographic Disease Map */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} style={{ color: 'var(--accent-blue)' }} /> Appointments by Specialization
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appointmentsBySpec}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
              <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} />
              <YAxis stroke="var(--text-tertiary)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
              <Bar dataKey="count" fill="var(--accent-teal)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>
    </div>
  );
}
