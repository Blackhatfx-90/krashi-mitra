import { motion } from 'framer-motion';

export default function Loader({ text = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
      gap: 20,
    }}>
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <rect x="24" y="8" width="12" height="44" rx="4" fill="var(--accent-teal)" />
          <rect x="8" y="24" width="44" height="12" rx="4" fill="var(--accent-teal)" />
        </svg>
      </motion.div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{text}</p>
    </div>
  );
}
