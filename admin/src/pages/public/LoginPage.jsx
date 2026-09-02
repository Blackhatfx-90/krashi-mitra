import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Heart, Shield, Activity } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useAppStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLogin && !showOtp) {
      setShowOtp(true);
      addToast({ type: 'info', message: 'OTP sent to your phone number!' });
      return;
    }
    login({ name: form.name || 'Nitin Kumar', email: form.email || 'nitin@example.com' }, 'patient');
    addToast({ type: 'success', message: 'Successfully logged in! Welcome to MediConnect 🎉' });
    navigate('/dashboard');
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const floatingIcons = [
    { Icon: Heart, x: '10%', y: '20%', delay: 0 },
    { Icon: Shield, x: '80%', y: '15%', delay: 0.5 },
    { Icon: Activity, x: '15%', y: '70%', delay: 1 },
    { Icon: Heart, x: '75%', y: '65%', delay: 1.5 },
    { Icon: Shield, x: '50%', y: '85%', delay: 2 },
  ];

  return (
    <div className="auth-split">
      {/* Left Side - Animated Illustration */}
      <div className="auth-left">
        {/* Floating background shapes */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: 80 + i * 30,
              height: 80 + i * 30,
              borderRadius: '50%',
              background: `rgba(255, 255, 255, ${0.03 + i * 0.01})`,
              left: `${10 + i * 15}%`,
              top: `${10 + i * 12}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}

        {/* Floating medical icons */}
        {floatingIcons.map(({ Icon, x, y, delay }, i) => (
          <motion.div
            key={i}
            style={{ position: 'absolute', left: x, top: y, color: 'rgba(255,255,255,0.3)' }}
            animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay }}
          >
            <Icon size={32} />
          </motion.div>
        ))}

        {/* Center content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ textAlign: 'center', color: 'white', zIndex: 1, padding: 40 }}
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="55" stroke="white" strokeWidth="2" strokeDasharray="8 4" opacity="0.3" />
              <circle cx="60" cy="60" r="40" fill="rgba(255,255,255,0.1)" />
              <rect x="48" y="25" width="24" height="70" rx="8" fill="white" />
              <rect x="25" y="48" width="70" height="24" rx="8" fill="white" />
            </svg>
          </motion.div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: 24, fontFamily: "'Outfit', sans-serif" }}>
            MediConnect
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.8, marginTop: 8, maxWidth: 300 }}>
            Your trusted partner in digital healthcare. Connect with verified doctors instantly.
          </p>
          
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 40 }}>
            {[
              { num: '500+', label: 'Doctors' },
              { num: '50K+', label: 'Patients' },
              { num: '4.8★', label: 'Rating' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.2 }}
                style={{ textAlign: 'center' }}
              >
                <p style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>{stat.num}</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="auth-right">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Portal Type Selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {['Patient', 'Doctor', 'Admin'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  if (type === 'Doctor') navigate('/doctor/register');
                  else if (type === 'Admin') {
                    login({ name: 'Admin', email: 'admin@mediconnect.com' }, 'admin');
                    navigate('/admin');
                  }
                }}
                className="pill-slot"
                style={{
                  background: type === 'Patient' ? 'var(--accent-teal)' : 'var(--glass-bg)',
                  color: type === 'Patient' ? '#0a0f1e' : 'var(--text-secondary)',
                  borderColor: type === 'Patient' ? 'var(--accent-teal)' : 'var(--glass-border)',
                  fontWeight: 600,
                }}
              >
                {type}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            {isLogin ? 'Welcome Back 👋' : showOtp ? 'Verify OTP' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.95rem' }}>
            {isLogin
              ? 'Sign in to access your health dashboard'
              : showOtp
                ? 'Enter the 6-digit code sent to your phone'
                : 'Join thousands of patients on MediConnect'}
          </p>

          <AnimatePresence mode="wait">
            {showOtp ? (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit}
              >
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      style={{
                        width: 52,
                        height: 56,
                        textAlign: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      className="skeu-input"
                    />
                  ))}
                </div>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 24 }}>
                  Didn't receive? <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }}>Resend OTP</button>
                </p>
                <button type="submit" className="clay-btn clay-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px 28px', fontSize: '1rem' }}>
                  Verify & Continue <ArrowRight size={18} />
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit}
              >
                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        className="skeu-input"
                        style={{ paddingLeft: 42 }}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="skeu-input"
                      style={{ paddingLeft: 42 }}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="skeu-input"
                        style={{ paddingLeft: 42 }}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="skeu-input"
                      style={{ paddingLeft: 42, paddingRight: 42 }}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                      <input
                        type="password"
                        placeholder="Confirm your password"
                        className="skeu-input"
                        style={{ paddingLeft: 42 }}
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div style={{ textAlign: 'right', marginBottom: 20 }}>
                    <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-teal)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button type="submit" className="clay-btn clay-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px 28px', fontSize: '1rem' }}>
                  {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>or continue with</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                </div>

                {/* Social Login */}
                <button type="button" className="clay-btn clay-btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '14px 28px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setShowOtp(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
