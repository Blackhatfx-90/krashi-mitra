import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { User, Droplets, HeartPulse, AlertCircle, Phone, Plus, X } from 'lucide-react';
import { diseases, bloodGroups } from '../../data/patients';

export default function PatientProfile() {
  const { addPatient, addToast } = useAppStore();
  const [form, setForm] = useState({
    name: '', age: '', gender: '', bloodGroup: '',
    diseases: [], symptoms: '', medicalHistory: '', allergies: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
  });
  const [selectedDiseases, setSelectedDiseases] = useState([]);

  const toggleDisease = (disease) => {
    setSelectedDiseases((prev) =>
      prev.includes(disease) ? prev.filter((d) => d !== disease) : [...prev, disease]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addPatient({ ...form, diseases: selectedDiseases });
    addToast({ type: 'success', message: 'Patient profile added successfully!' });
    setForm({ name: '', age: '', gender: '', bloodGroup: '', diseases: [], symptoms: '', medicalHistory: '', allergies: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '' });
    setSelectedDiseases([]);
  };

  return (
    <div className="page-wrapper">
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            <UserPlus size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
            Add Patient Profile
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Add a patient profile for yourself or a family member
          </p>

          <form onSubmit={handleSubmit}>
            <div className="glass-card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={20} style={{ color: 'var(--accent-teal)' }} /> Personal Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Patient Name</label>
                  <input className="skeu-input" placeholder="Enter patient's full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="skeu-input" type="number" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="skeu-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label"><Droplets size={16} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} /> Blood Group</label>
                  <select className="skeu-select" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                    <option value="">Select</option>
                    {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HeartPulse size={20} style={{ color: 'var(--accent-red)' }} /> Medical Information
              </h3>
              <div className="form-group">
                <label className="form-label">Disease/Condition (select all that apply)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {diseases.map((disease) => (
                    <button
                      type="button"
                      key={disease}
                      onClick={() => toggleDisease(disease)}
                      className="pill-slot"
                      style={{
                        background: selectedDiseases.includes(disease) ? 'var(--accent-teal)' : 'var(--glass-bg)',
                        color: selectedDiseases.includes(disease) ? '#0a0f1e' : 'var(--text-secondary)',
                        borderColor: selectedDiseases.includes(disease) ? 'var(--accent-teal)' : 'var(--glass-border)',
                      }}
                    >
                      {selectedDiseases.includes(disease) && <X size={14} />}
                      {disease}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Symptoms Description</label>
                <textarea className="skeu-textarea" placeholder="Describe current symptoms..." value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Medical History</label>
                <textarea className="skeu-textarea" placeholder="Previous illnesses, surgeries, ongoing treatments..." value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Allergies</label>
                <input className="skeu-input" placeholder="e.g., Penicillin, Pollen, Dust" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
              </div>
            </div>

            <div className="glass-card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={20} style={{ color: 'var(--accent-orange)' }} /> Emergency Contact
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Contact Name</label>
                  <input className="skeu-input" placeholder="Emergency contact name" value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="skeu-input" placeholder="+91 XXXXX XXXXX" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Relation</label>
                  <input className="skeu-input" placeholder="e.g., Father, Wife, Brother" value={form.emergencyRelation} onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })} />
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              className="clay-btn clay-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '16px 28px', fontSize: '1rem' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={20} /> Save Patient Profile
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function UserPlus(props) {
  return <User {...props} />;
}
