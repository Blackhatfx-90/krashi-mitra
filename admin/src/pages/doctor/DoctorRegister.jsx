import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { specializations } from '../../data/doctors';
import {
  User, Stethoscope, FileText, MapPin, CheckCircle,
  ArrowRight, ArrowLeft, Upload, Clock
} from 'lucide-react';

const steps = [
  { label: 'Personal', icon: <User size={16} /> },
  { label: 'Professional', icon: <Stethoscope size={16} /> },
  { label: 'Documents', icon: <FileText size={16} /> },
  { label: 'Location', icon: <MapPin size={16} /> },
  { label: 'Review', icon: <CheckCircle size={16} /> },
];

export default function DoctorRegister() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { login } = useAuthStore();
  const { addToast } = useAppStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', dob: '', gender: '', phone: '', email: '',
    specialization: '', experience: '', fee: '', languages: '',
    aadhaar: '', license: '', hospital: '', address: '',
    college: '', gradYear: '', fellowships: '',
  });

  const updateForm = (field, value) => setForm({ ...form, [field]: value });

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
    else {
      setSubmitted(true);
      addToast({ type: 'success', message: 'Registration submitted! Awaiting approval.' });
    }
  };

  if (submitted) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          className="glass-card"
          style={{ textAlign: 'center', padding: 48, maxWidth: 500 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block' }}
          >
            <Clock size={64} style={{ color: 'var(--accent-orange)' }} />
          </motion.div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 20, fontFamily: "'Outfit', sans-serif" }}>
            Profile Under Review 📋
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 24 }}>
            Your registration is being reviewed by our admin team. You'll receive an email once approved.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="clay-btn clay-btn-ghost" onClick={() => navigate('/')}>
              Go to Home
            </button>
            <button className="clay-btn clay-btn-primary" onClick={() => {
              login({ name: form.name || 'Dr. Demo', email: form.email || 'doctor@demo.com' }, 'doctor');
              navigate('/doctor');
            }}>
              Demo Dashboard →
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 700 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            <Stethoscope size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
            Doctor Registration
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Register as a verified healthcare professional on MediConnect
          </p>

          {/* Stepper */}
          <div className="stepper" style={{ marginBottom: 32 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                <div
                  className={`stepper-circle ${i < step ? 'completed' : i === step ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => i <= step && setStep(i)}
                >
                  {i < step ? <CheckCircle size={18} /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`stepper-line ${i < step ? 'active' : ''}`} />
                )}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontWeight: 600, marginBottom: 24, color: 'var(--accent-teal)' }}>
            Step {step + 1}: {steps[step].label} Info
          </p>

          {/* Form Steps */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card"
            >
              {step === 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Full Name</label>
                    <input className="skeu-input" placeholder="Dr. Full Name" value={form.name} onChange={(e) => updateForm('name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input className="skeu-input" type="date" value={form.dob} onChange={(e) => updateForm('dob', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="skeu-select" value={form.gender} onChange={(e) => updateForm('gender', e.target.value)}>
                      <option value="">Select</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="skeu-input" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="skeu-input" type="email" placeholder="doctor@email.com" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Specialization</label>
                    <select className="skeu-select" value={form.specialization} onChange={(e) => updateForm('specialization', e.target.value)}>
                      <option value="">Select Specialization</option>
                      {specializations.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Years of Experience</label>
                    <input className="skeu-input" type="number" placeholder="e.g., 10" value={form.experience} onChange={(e) => updateForm('experience', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Consultation Fee (₹)</label>
                    <input className="skeu-input" type="number" placeholder="e.g., 800" value={form.fee} onChange={(e) => updateForm('fee', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Languages Spoken</label>
                    <input className="skeu-input" placeholder="Hindi, English, Gujarati" value={form.languages} onChange={(e) => updateForm('languages', e.target.value)} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Aadhaar Card Number</label>
                    <input className="skeu-input" placeholder="XXXX-XXXX-XXXX" value={form.aadhaar} onChange={(e) => updateForm('aadhaar', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Medical License Number</label>
                    <input className="skeu-input" placeholder="MCI-XXXX-XXXXX" value={form.license} onChange={(e) => updateForm('license', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Upload Documents</label>
                    <div className="upload-zone" style={{ padding: 32 }}>
                      <Upload size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
                      <p style={{ fontSize: '0.9rem' }}>Click or drag to upload Aadhaar & License</p>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Medical College</label>
                    <input className="skeu-input" placeholder="e.g., AIIMS Delhi" value={form.college} onChange={(e) => updateForm('college', e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Graduation Year</label>
                      <input className="skeu-input" type="number" placeholder="e.g., 2014" value={form.gradYear} onChange={(e) => updateForm('gradYear', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fellowships</label>
                      <input className="skeu-input" placeholder="Optional" value={form.fellowships} onChange={(e) => updateForm('fellowships', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Hospital/Clinic Name</label>
                    <input className="skeu-input" placeholder="e.g., Apollo Hospital" value={form.hospital} onChange={(e) => updateForm('hospital', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Clinic Address</label>
                    <textarea className="skeu-textarea" placeholder="Full clinic address..." value={form.address} onChange={(e) => updateForm('address', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pin Location on Map</label>
                    <div style={{
                      height: 250, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--glass-border)',
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <MapPin size={40} style={{ color: 'var(--accent-teal)' }} />
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>Click to pin your clinic location</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Review Your Information</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {Object.entries(form).filter(([_, v]) => v).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button
              className="clay-btn clay-btn-ghost"
              onClick={() => step > 0 ? setStep(step - 1) : navigate('/')}
            >
              <ArrowLeft size={18} /> {step > 0 ? 'Previous' : 'Back to Home'}
            </button>
            <button className="clay-btn clay-btn-primary" onClick={nextStep}>
              {step < 4 ? 'Next' : 'Submit Registration'} <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
