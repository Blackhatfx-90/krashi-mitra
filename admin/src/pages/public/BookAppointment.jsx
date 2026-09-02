import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { doctors } from '../../data/doctors';
import { generateQRCells } from '../../utils/helpers';
import Modal from '../../components/ui/Modal';
import StarRating from '../../components/ui/StarRating';
import {
  MapPin, Star, Clock, ChevronRight, Calendar, Search,
  Filter, CheckCircle, Navigation
} from 'lucide-react';

export default function BookAppointment() {
  const { addToast } = useAppStore();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ date: '', time: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const [notes, setNotes] = useState('');

  const filteredDoctors = doctors.filter((doc) => {
    const matchName = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSpec = doc.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterSpec ? doc.specialization === filterSpec : true;
    return (matchName || matchSpec) && matchFilter;
  });

  const specs = [...new Set(doctors.map((d) => d.specialization))];

  const handleBook = () => {
    setBookingModal(false);
    setConfirmModal(true);
    addToast({ type: 'success', message: `Appointment booked with ${selectedDoctor.name}!` });
  };

  const qrCells = generateQRCells();

  return (
    <div className="page-wrapper">
      <div className="container-main" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            <Calendar size={28} style={{ display: 'inline', marginRight: 10, verticalAlign: -5 }} />
            Book Appointment
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Find nearby verified doctors and book your appointment
          </p>

          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                className="skeu-input"
                style={{ paddingLeft: 42 }}
                placeholder="Search doctors by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="skeu-select"
              style={{ maxWidth: 220 }}
              value={filterSpec}
              onChange={(e) => setFilterSpec(e.target.value)}
            >
              <option value="">All Specializations</option>
              {specs.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
            </select>
          </div>

          {/* Map Placeholder */}
          <div className="glass-card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden', height: 280 }}>
            <div style={{
              width: '100%', height: '100%',
              background: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <div style={{ textAlign: 'center', zIndex: 1 }}>
                <MapPin size={48} style={{ color: 'var(--accent-teal)', marginBottom: 12 }} />
                <p style={{ fontWeight: 600 }}>Interactive Map</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Showing {filteredDoctors.length} verified doctors near New Delhi</p>
              </div>
              {/* Mock map dots */}
              {filteredDoctors.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  style={{
                    position: 'absolute',
                    left: `${20 + (i * 12) % 60}%`,
                    top: `${15 + (i * 17) % 55}%`,
                    width: 16, height: 16,
                    borderRadius: '50%',
                    background: doc.online ? 'var(--accent-teal)' : 'var(--text-tertiary)',
                    border: '3px solid var(--bg-card)',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  onClick={() => { setSelectedDoctor(doc); setBookingModal(true); }}
                  title={doc.name}
                />
              ))}
            </div>
          </div>

          {/* Doctor Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {filteredDoctors.map((doc, i) => (
              <motion.div
                key={doc.id}
                className="glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={doc.photo}
                      alt={doc.name}
                      style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid var(--glass-border)' }}
                    />
                    <div className={`status-dot ${doc.online ? 'online' : 'offline'}`} style={{
                      position: 'absolute', bottom: 2, right: 2, border: '2px solid var(--bg-card)',
                    }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{doc.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: 500 }}>{doc.specialization}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.8rem', color: 'var(--accent-yellow)' }}>
                        <Star size={14} fill="currentColor" /> {doc.rating} ({doc.ratingCount})
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Navigation size={12} /> {doc.distance} km
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: 'var(--accent-teal)' }}>₹{doc.fee}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>per visit</p>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{doc.hospital}</p>

                {/* Availability Slots */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                    <Clock size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
                    Available Slots
                  </p>
                  {doc.availability.slice(0, 2).map((avail) => (
                    <div key={avail.date} style={{ marginBottom: 8 }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-tertiary)' }}>{avail.date}</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {avail.slots.slice(0, 3).map((slot) => (
                          <button
                            key={slot}
                            className="pill-slot"
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                            onClick={() => {
                              setSelectedDoctor(doc);
                              setSelectedSlot({ date: avail.date, time: slot });
                              setBookingModal(true);
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                        {avail.slots.length > 3 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', padding: '4px 8px' }}>
                            +{avail.slots.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="clay-btn clay-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: '0.9rem' }}
                  onClick={() => { setSelectedDoctor(doc); setBookingModal(true); }}
                >
                  Book Now <ChevronRight size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Booking Modal */}
      <Modal isOpen={bookingModal} onClose={() => setBookingModal(false)} title="Book Appointment" maxWidth={500}>
        {selectedDoctor && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <img src={selectedDoctor.photo} alt="" style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--glass-border)' }} />
              <div>
                <h4 style={{ fontWeight: 700 }}>{selectedDoctor.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--accent-teal)' }}>{selectedDoctor.specialization}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedDoctor.hospital}</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Date & Time</label>
              {selectedDoctor.availability.map((avail) => (
                <div key={avail.date} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>{avail.date}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {avail.slots.map((slot) => (
                      <button
                        key={slot}
                        className="pill-slot"
                        style={{
                          background: selectedSlot.date === avail.date && selectedSlot.time === slot ? 'var(--accent-teal)' : 'var(--glass-bg)',
                          color: selectedSlot.date === avail.date && selectedSlot.time === slot ? '#0a0f1e' : 'var(--text-secondary)',
                          borderColor: selectedSlot.date === avail.date && selectedSlot.time === slot ? 'var(--accent-teal)' : 'var(--glass-border)',
                        }}
                        onClick={() => setSelectedSlot({ date: avail.date, time: slot })}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="skeu-textarea" placeholder="Describe your symptoms or reason for visit..." style={{ minHeight: 80 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid var(--glass-border)', marginTop: 16 }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Consultation Fee</p>
                <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-teal)', fontFamily: "'Outfit', sans-serif" }}>₹{selectedDoctor.fee}</p>
              </div>
              <button
                className="clay-btn clay-btn-primary"
                onClick={handleBook}
                disabled={!selectedSlot.time}
                style={{ opacity: selectedSlot.time ? 1 : 0.5 }}
              >
                Confirm Booking <CheckCircle size={16} />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal isOpen={confirmModal} onClose={() => setConfirmModal(false)} title="Booking Confirmed! 🎉" maxWidth={420}>
        <div style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <CheckCircle size={64} style={{ color: 'var(--accent-teal)', marginBottom: 16 }} />
          </motion.div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Appointment Booked!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
            Your appointment with {selectedDoctor?.name} on {selectedSlot.date} at {selectedSlot.time} is confirmed.
          </p>

          {/* Mock QR Code */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div className="qr-code">
              {qrCells.map((cell, i) => (
                <div key={i} className={`qr-cell ${cell}`} />
              ))}
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Show this QR code at the reception</p>

          <button
            className="clay-btn clay-btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
            onClick={() => setConfirmModal(false)}
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
