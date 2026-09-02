import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import StarRating from '../../components/ui/StarRating';
import { Star, Send, ThumbsUp } from 'lucide-react';

export default function DoctorRating() {
  const { addToast } = useAppStore();
  const [overall, setOverall] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [diagnosis, setDiagnosis] = useState(0);
  const [behaviour, setBehaviour] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    addToast({ type: 'success', message: 'Thank you for your feedback!' });
  };

  if (submitted) {
    return (
      <div className="page-wrapper">
        <div className="container-main" style={{ paddingTop: 80, maxWidth: 500 }}>
          <motion.div
            className="glass-card"
            style={{ textAlign: 'center', padding: 48 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 15 }}
            >
              <ThumbsUp size={64} style={{ color: 'var(--accent-teal)' }} />
            </motion.div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 20, fontFamily: "'Outfit', sans-serif" }}>
              Thank You! 🎉
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
              Your review helps other patients make informed decisions.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 550 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            <Star size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5, color: 'var(--accent-yellow)' }} />
            Rate Your Doctor
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Share your experience to help other patients
          </p>

          {/* Doctor Info */}
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <img
                src="https://api.dicebear.com/7.x/personas/svg?seed=priya"
                alt=""
                style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid var(--glass-border)' }}
              />
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Dr. Priya Sharma</h3>
                <p style={{ color: 'var(--accent-teal)', fontSize: '0.9rem' }}>Cardiologist</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Visited: Today, 10:00 AM</p>
              </div>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="glass-card" style={{ marginBottom: 24, textAlign: 'center' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Overall Rating</h3>
            <StarRating rating={overall} setRating={setOverall} size={40} />
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.85rem' }}>
              {overall === 0 ? 'Tap to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][overall]}
            </p>
          </div>

          {/* Category Ratings */}
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Rate by Category</h3>
            {[
              { label: 'Punctuality', value: punctuality, setter: setPunctuality },
              { label: 'Diagnosis Quality', value: diagnosis, setter: setDiagnosis },
              { label: 'Behaviour & Communication', value: behaviour, setter: setBehaviour },
            ].map((cat, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: i < 2 ? '1px solid var(--glass-border)' : 'none',
              }}>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{cat.label}</span>
                <StarRating rating={cat.value} setRating={cat.setter} size={22} />
              </div>
            ))}
          </div>

          {/* Written Review */}
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Write a Review</h3>
            <textarea
              className="skeu-textarea"
              placeholder="Share your experience with this doctor..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              style={{ minHeight: 120 }}
            />
          </div>

          <motion.button
            className="clay-btn clay-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '16px 28px', fontSize: '1rem' }}
            onClick={handleSubmit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={overall === 0}
          >
            <Send size={18} /> Submit Review
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
