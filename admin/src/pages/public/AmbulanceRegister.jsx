import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  Ambulance, User, FileText, MapPin, CheckCircle,
  ArrowRight, ArrowLeft, Upload, Phone, Truck, Clock, Shield
} from 'lucide-react';

const steps = [
  { label: 'Driver Info', icon: <User size={16} /> },
  { label: 'Vehicle Details', icon: <Truck size={16} /> },
  { label: 'Documents', icon: <FileText size={16} /> },
  { label: 'Service Area', icon: <MapPin size={16} /> },
  { label: 'Review', icon: <CheckCircle size={16} /> },
];

export default function AmbulanceRegister() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useAppStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    driverName: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleNumber: '',
    vehicleType: '',
    vehicleMake: '',
    vehicleYear: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    ambulanceType: '',
    equipment: [],
    hospitalAffiliation: '',
    serviceArea: '',
    baseAddress: '',
    operatingHours: '',
  });

  const updateForm = (field, value) => setForm({ ...form, [field]: value });

  const ambulanceTypes = ['Basic Life Support (BLS)', 'Advanced Life Support (ALS)', 'Patient Transport Ambulance', 'Neonatal Ambulance', 'Air Ambulance'];
  const equipmentList = ['Oxygen Cylinder', 'Defibrillator', 'Ventilator', 'Suction Machine', 'Spine Board', 'Stretcher', 'First Aid Kit', 'Cardiac Monitor', 'IV Stand', 'Medication Kit'];

  const toggleEquipment = (eq) => {
    setForm(prev => ({
      ...prev,
      equipment: prev.equipment.includes(eq)
        ? prev.equipment.filter(e => e !== eq)
        : [...prev.equipment, eq]
    }));
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
    else {
      setSubmitted(true);
      addToast({ type: 'success', message: 'Ambulance registration submitted! Awaiting admin approval.' });
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
            Registration Under Review 🚑
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 24 }}>
            Your ambulance service registration is being reviewed by the admin team. You'll receive a notification once approved.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="clay-btn clay-btn-ghost" onClick={() => navigate('/')}>
              Go to Home
            </button>
            <button className="clay-btn clay-btn-primary" onClick={() => navigate('/admin/ambulances')}>
              View Admin Panel →
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
            <Ambulance size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
            Ambulance Registration
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Register your ambulance service to join the MediConnect emergency network
          </p>

          {/* Stepper */}
          <div className="stepper" style={{ marginBottom: 32 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                <div
                  className={`stepper-circle ${i < step ? 'completed' : i === step ? 'active' : ''}`}
                  style={{ cursor: i <= step ? 'pointer' : 'default' }}
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
            Step {step + 1}: {steps[step].label}
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
                    <label className="form-label">Driver Full Name</label>
                    <input className="skeu-input" placeholder="Enter driver's full name" value={form.driverName} onChange={(e) => updateForm('driverName', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input className="skeu-input" type="date" value={form.dob} onChange={(e) => updateForm('dob', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="skeu-select" value={form.gender} onChange={(e) => updateForm('gender', e.target.value)}>
                      <option value="">Select Gender</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="skeu-input" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="skeu-input" type="email" placeholder="driver@email.com" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Driving License Number</label>
                    <input className="skeu-input" placeholder="DL-XXXX-XXXXX" value={form.licenseNumber} onChange={(e) => updateForm('licenseNumber', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Expiry Date</label>
                    <input className="skeu-input" type="date" value={form.licenseExpiry} onChange={(e) => updateForm('licenseExpiry', e.target.value)} />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Vehicle Registration Number</label>
                    <input className="skeu-input" placeholder="DL XX AB XXXX" value={form.vehicleNumber} onChange={(e) => updateForm('vehicleNumber', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Make & Model</label>
                    <input className="skeu-input" placeholder="e.g., Tata Winger, Force Traveller" value={form.vehicleMake} onChange={(e) => updateForm('vehicleMake', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year of Manufacture</label>
                    <input className="skeu-input" type="number" placeholder="e.g., 2022" value={form.vehicleYear} onChange={(e) => updateForm('vehicleYear', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Insurance Number</label>
                    <input className="skeu-input" placeholder="Insurance policy number" value={form.insuranceNumber} onChange={(e) => updateForm('insuranceNumber', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Ambulance Type</label>
                    <select className="skeu-select" value={form.ambulanceType} onChange={(e) => updateForm('ambulanceType', e.target.value)}>
                      <option value="">Select Ambulance Type</option>
                      {ambulanceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">On-Board Equipment (select all that apply)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {equipmentList.map((eq) => (
                        <button
                          key={eq}
                          type="button"
                          className="pill-slot"
                          onClick={() => toggleEquipment(eq)}
                          style={{
                            background: form.equipment.includes(eq) ? 'var(--accent-teal)' : 'var(--glass-bg)',
                            color: form.equipment.includes(eq) ? '#0a0f1e' : 'var(--text-secondary)',
                            borderColor: form.equipment.includes(eq) ? 'var(--accent-teal)' : 'var(--glass-border)',
                          }}
                        >
                          {form.equipment.includes(eq) ? '✓ ' : ''}{eq}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Upload Driving License</label>
                    <div className="upload-zone" style={{ padding: 32 }}>
                      <Upload size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
                      <p style={{ fontSize: '0.9rem' }}>Click or drag to upload driving license</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>PDF, JPG, PNG (max 5MB)</p>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Upload Vehicle Registration Certificate (RC)</label>
                    <div className="upload-zone" style={{ padding: 32 }}>
                      <Upload size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
                      <p style={{ fontSize: '0.9rem' }}>Click or drag to upload RC</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>PDF, JPG, PNG (max 5MB)</p>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Upload Insurance Certificate</label>
                    <div className="upload-zone" style={{ padding: 32 }}>
                      <Upload size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
                      <p style={{ fontSize: '0.9rem' }}>Click or drag to upload insurance</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>PDF, JPG, PNG (max 5MB)</p>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Upload Vehicle Photo</label>
                    <div className="upload-zone" style={{ padding: 32 }}>
                      <Upload size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
                      <p style={{ fontSize: '0.9rem' }}>Click or drag to upload ambulance photo</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>JPG, PNG (max 10MB)</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Hospital/Organization Affiliation</label>
                    <input className="skeu-input" placeholder="e.g., Apollo Hospital, Independent" value={form.hospitalAffiliation} onChange={(e) => updateForm('hospitalAffiliation', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Service Area</label>
                    <select className="skeu-select" value={form.serviceArea} onChange={(e) => updateForm('serviceArea', e.target.value)}>
                      <option value="">Select Area</option>
                      <option>North Delhi</option>
                      <option>South Delhi</option>
                      <option>East Delhi</option>
                      <option>West Delhi</option>
                      <option>Central Delhi</option>
                      <option>NCR - Gurugram</option>
                      <option>NCR - Noida</option>
                      <option>NCR - Faridabad</option>
                      <option>NCR - Ghaziabad</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Base Station Address</label>
                    <textarea className="skeu-textarea" placeholder="Full base station address where the ambulance is parked..." value={form.baseAddress} onChange={(e) => updateForm('baseAddress', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Operating Hours</label>
                    <select className="skeu-select" value={form.operatingHours} onChange={(e) => updateForm('operatingHours', e.target.value)}>
                      <option value="">Select Operating Hours</option>
                      <option>24/7 (Round the Clock)</option>
                      <option>6:00 AM - 10:00 PM</option>
                      <option>8:00 AM - 8:00 PM</option>
                      <option>Night Only (8:00 PM - 6:00 AM)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pin Base Location on Map</label>
                    <div style={{
                      height: 200, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--glass-border)',
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <MapPin size={40} style={{ color: 'var(--accent-red)' }} />
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>Click to pin your base station location</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Review Your Registration</h3>
                  
                  <div style={{ display: 'grid', gap: 16 }}>
                    {/* Driver Info Section */}
                    <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={16} /> Driver Information
                      </h4>
                      {[
                        ['Name', form.driverName],
                        ['Phone', form.phone],
                        ['Email', form.email],
                        ['License', form.licenseNumber],
                      ].filter(([_, v]) => v).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                          <span style={{ fontWeight: 600 }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Vehicle Info Section */}
                    <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Truck size={16} /> Vehicle Information
                      </h4>
                      {[
                        ['Vehicle Number', form.vehicleNumber],
                        ['Make & Model', form.vehicleMake],
                        ['Ambulance Type', form.ambulanceType],
                        ['Equipment', form.equipment.join(', ')],
                      ].filter(([_, v]) => v).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                          <span style={{ fontWeight: 600, maxWidth: 300, textAlign: 'right' }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Service Info Section */}
                    <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={16} /> Service Information
                      </h4>
                      {[
                        ['Affiliation', form.hospitalAffiliation],
                        ['Service Area', form.serviceArea],
                        ['Operating Hours', form.operatingHours],
                      ].filter(([_, v]) => v).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                          <span style={{ fontWeight: 600 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terms */}
                  <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(0, 212, 170, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 212, 170, 0.15)' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input type="checkbox" style={{ marginTop: 3 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        I certify that all information provided is accurate. I understand that my registration will be verified by the MediConnect admin team and that providing false information may result in permanent disqualification.
                      </span>
                    </label>
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
              {step < 4 ? 'Next Step' : 'Submit Registration'} <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
