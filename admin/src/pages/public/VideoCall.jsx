import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Monitor,
  MessageSquare, Users, Maximize, Minimize, Settings,
  ScreenShare, ScreenShareOff, Clock, Shield, Heart,
  Send, X, FileText, Image as ImageIcon
} from 'lucide-react';

export default function VideoCall() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useAppStore();

  const doctorName = searchParams.get('doctor') || 'Dr. Priya Sharma';
  const callType = searchParams.get('type') || 'scheduled'; // scheduled | emergency
  const specialty = searchParams.get('specialty') || 'Cardiologist';

  const [callState, setCallState] = useState(callType === 'emergency' ? 'connecting' : 'waiting'); // waiting, connecting, active, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState([
    { from: 'doctor', text: 'Hello! I can see you. How are you feeling today?', time: '0:12' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [networkQuality, setNetworkQuality] = useState('Excellent');

  // Timer
  useEffect(() => {
    let timer;
    if (callState === 'active') {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // Auto-connect flow
  useEffect(() => {
    if (callState === 'waiting') {
      const t = setTimeout(() => {
        setCallState('connecting');
        addToast({ type: 'info', message: 'Connecting to doctor...' });
      }, 2000);
      return () => clearTimeout(t);
    }
    if (callState === 'connecting') {
      const t = setTimeout(() => {
        setCallState('active');
        addToast({ type: 'success', message: `Connected with ${doctorName}!` });
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [callState]);

  // Network quality simulation
  useEffect(() => {
    const qualities = ['Excellent', 'Good', 'Excellent', 'Good', 'Excellent'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % qualities.length;
      setNetworkQuality(qualities[i]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const endCall = () => {
    setCallState('ended');
    addToast({ type: 'info', message: 'Call ended' });
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { from: 'you', text: chatInput, time: formatTime(callDuration) }]);
    setChatInput('');
    // Mock doctor reply
    setTimeout(() => {
      const replies = [
        'I understand. Let me note that down.',
        'Can you describe the symptoms in more detail?',
        'That sounds manageable. I\'ll prescribe the appropriate medication.',
        'Please share your latest reports if you have them.',
        'I recommend we schedule a follow-up next week.',
      ];
      setChatMessages(prev => [...prev, {
        from: 'doctor',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: formatTime(callDuration + 3),
      }]);
    }, 2500);
  };

  // Waiting / Connecting Screen
  if (callState === 'waiting' || callState === 'connecting') {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#0a0f1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', position: 'relative',
      }}>
        {/* Animated rings */}
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            style={{
              position: 'absolute', width: 200 + i * 80, height: 200 + i * 80,
              borderRadius: '50%', border: '2px solid rgba(0, 212, 170, 0.15)',
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}

        <motion.div
          style={{ textAlign: 'center', zIndex: 1 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.img
            src={`https://api.dicebear.com/7.x/personas/svg?seed=${doctorName}`}
            alt={doctorName}
            style={{
              width: 120, height: 120, borderRadius: '50%',
              border: '4px solid var(--accent-teal)', marginBottom: 24,
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
            {doctorName}
          </h2>
          <p style={{ color: 'var(--accent-teal)', marginBottom: 4 }}>{specialty}</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>
            {callType === 'emergency' ? '🚨 Emergency Call' : '📅 Scheduled Consultation'}
          </p>

          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>
              {callState === 'waiting' ? '⏳ Waiting for doctor to accept...' : '📡 Connecting...'}
            </p>
          </motion.div>

          {/* Connecting progress */}
          {callState === 'connecting' && (
            <motion.div style={{ width: 200, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', margin: '24px auto 0' }}>
              <motion.div
                style={{ height: '100%', borderRadius: 2, background: 'var(--gradient-primary)' }}
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 3, ease: 'easeInOut' }}
              />
            </motion.div>
          )}

          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: 32, padding: '12px 32px', borderRadius: 'var(--radius-full)',
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8, margin: '32px auto 0',
            }}
          >
            <PhoneOff size={18} /> Cancel Call
          </button>
        </motion.div>
      </div>
    );
  }

  // Call Ended Screen
  if (callState === 'ended') {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#0a0f1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <motion.div
          style={{ textAlign: 'center', maxWidth: 450 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Phone size={56} style={{ color: 'var(--accent-red)', marginBottom: 20 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
            Call Ended
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
            Duration: {formatTime(callDuration)} with {doctorName}
          </p>

          {/* Call Summary Card */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)',
            padding: 24, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', marginBottom: 24,
          }}>
            <h3 style={{ color: 'var(--accent-teal)', fontSize: '0.9rem', fontWeight: 700, marginBottom: 16 }}>Call Summary</h3>
            <div style={{ display: 'grid', gap: 12, fontSize: '0.85rem' }}>
              {[
                ['Doctor', doctorName],
                ['Specialty', specialty],
                ['Duration', formatTime(callDuration)],
                ['Call Type', callType === 'emergency' ? 'Emergency' : 'Scheduled'],
                ['Network Quality', networkQuality],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{k}</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              className="clay-btn clay-btn-primary"
              onClick={() => navigate('/rate-doctor')}
            >
              ⭐ Rate Doctor
            </button>
            <button
              className="clay-btn clay-btn-ghost"
              style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active Video Call Screen
  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0a0f1e',
      position: 'relative', overflow: 'hidden', display: 'flex',
    }}>
      {/* Main Video Area (Doctor) */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Doctor's "video" - gradient background with avatar */}
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <motion.img
            src={`https://api.dicebear.com/7.x/personas/svg?seed=${doctorName}`}
            alt={doctorName}
            style={{ width: 180, height: 180, borderRadius: '50%', border: '4px solid var(--glass-border)' }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Doctor name overlay */}
          <div style={{
            position: 'absolute', bottom: 100, left: 24,
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(0,0,0,0.5)', padding: '8px 16px',
            borderRadius: 'var(--radius-full)', backdropFilter: 'blur(10px)',
          }}>
            <div className="status-dot online" />
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{doctorName}</span>
            <span style={{ color: 'var(--accent-teal)', fontSize: '0.8rem' }}>{specialty}</span>
          </div>
        </div>

        {/* Self camera (PIP) */}
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          style={{
            position: 'absolute', bottom: 100, right: 24,
            width: 200, height: 150, borderRadius: 'var(--radius-lg)',
            background: isVideoOn
              ? 'linear-gradient(135deg, #2d3436 0%, #000000 100%)'
              : '#1a1a2e',
            border: '2px solid var(--glass-border)',
            overflow: 'hidden', cursor: 'grab',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isVideoOn ? (
            <div style={{ textAlign: 'center' }}>
              <img
                src="https://api.dicebear.com/7.x/personas/svg?seed=me"
                alt="You"
                style={{ width: 60, height: 60, borderRadius: '50%', opacity: 0.8 }}
              />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginTop: 4 }}>You</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <VideoOff size={32} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: 4 }}>Camera Off</p>
            </div>
          )}
          {isMuted && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', borderRadius: '50%', padding: 4 }}>
              <MicOff size={12} color="white" />
            </div>
          )}
        </motion.div>

        {/* Top Bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {callType === 'emergency' && (
              <span style={{
                padding: '4px 12px', borderRadius: 'var(--radius-full)',
                background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444', fontSize: '0.8rem', fontWeight: 600,
              }}>
                🚨 EMERGENCY
              </span>
            )}
            <div style={{
              padding: '4px 12px', borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 212, 170, 0.15)', border: '1px solid rgba(0, 212, 170, 0.3)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Shield size={14} style={{ color: 'var(--accent-teal)' }} />
              <span style={{ color: 'var(--accent-teal)', fontSize: '0.8rem', fontWeight: 500 }}>Encrypted</span>
            </div>
            <div style={{
              padding: '4px 12px', borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: networkQuality === 'Excellent' ? '#22c55e' : '#f59e0b' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{networkQuality}</span>
            </div>
          </div>
          <div style={{
            padding: '6px 16px', borderRadius: 'var(--radius-full)',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ff6b6b', fontWeight: 700, fontSize: '1rem',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <motion.div
              style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            {formatTime(callDuration)}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: showChat ? 360 : 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
          padding: '20px 24px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        }}>
          {/* Mic */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.15)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', backdropFilter: 'blur(10px)',
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </motion.button>

          {/* Video */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsVideoOn(!isVideoOn)}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: !isVideoOn ? '#ef4444' : 'rgba(255,255,255,0.15)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', backdropFilter: 'blur(10px)',
            }}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
          </motion.button>

          {/* Screen Share */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setIsScreenSharing(!isScreenSharing);
              addToast({ type: isScreenSharing ? 'info' : 'success', message: isScreenSharing ? 'Screen sharing stopped' : 'Screen sharing started' });
            }}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: isScreenSharing ? 'var(--accent-teal)' : 'rgba(255,255,255,0.15)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isScreenSharing ? '#0a0f1e' : 'white', backdropFilter: 'blur(10px)',
            }}
            title="Share screen"
          >
            {isScreenSharing ? <ScreenShareOff size={22} /> : <ScreenShare size={22} />}
          </motion.button>

          {/* Chat */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowChat(!showChat)}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: showChat ? 'var(--accent-blue)' : 'rgba(255,255,255,0.15)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', backdropFilter: 'blur(10px)', position: 'relative',
            }}
            title="Chat"
          >
            <MessageSquare size={22} />
          </motion.button>

          {/* Notes */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNotes(!showNotes)}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: showNotes ? 'var(--accent-purple)' : 'rgba(255,255,255,0.15)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', backdropFilter: 'blur(10px)',
            }}
            title="Notes"
          >
            <FileText size={22} />
          </motion.button>

          {/* End Call */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={endCall}
            style={{
              width: 64, height: 52, borderRadius: 'var(--radius-full)',
              background: '#ef4444', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', gap: 6,
            }}
            title="End Call"
          >
            <PhoneOff size={22} />
          </motion.button>
        </div>

        {/* Floating Notes */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: 'absolute', bottom: 100, left: 24,
                width: 320, background: 'rgba(10, 15, 30, 0.95)',
                borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)',
                padding: 16, backdropFilter: 'blur(20px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>📝 Consultation Notes</h4>
                <button onClick={() => setShowNotes(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type notes during the call..."
                style={{
                  width: '100%', minHeight: 120, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                  color: 'white', padding: 12, fontSize: '0.85rem', resize: 'vertical',
                  outline: 'none', fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            style={{
              width: 360, height: '100%',
              background: 'rgba(10, 15, 30, 0.98)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Chat Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>💬 In-Call Chat</h3>
              <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: msg.from === 'you' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: msg.from === 'you' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.from === 'you' ? 'var(--accent-teal)' : 'rgba(255,255,255,0.08)',
                    color: msg.from === 'you' ? '#0a0f1e' : 'white',
                    fontSize: '0.85rem', lineHeight: 1.5,
                  }}>
                    {msg.text}
                  </div>
                  <p style={{
                    fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 4,
                    textAlign: msg.from === 'you' ? 'right' : 'left',
                  }}>
                    {msg.from === 'doctor' ? doctorName : 'You'} · {msg.time}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Chat Input */}
            <div style={{
              padding: 12, borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', gap: 8,
            }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Type a message..."
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-full)',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: '0.85rem', outline: 'none',
                }}
              />
              <button
                onClick={sendChat}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--accent-teal)', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Send size={16} color="#0a0f1e" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
