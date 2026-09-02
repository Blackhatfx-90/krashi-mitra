import { useThemeStore } from '../../store/useThemeStore';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  
  return (
    <motion.button
      onClick={toggleTheme}
      className="clay-btn"
      style={{
        position: 'fixed',
        top: 18,
        right: 24,
        zIndex: 2000,
        width: 48,
        height: 48,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme === 'dark' ? 'var(--clay-yellow)' : 'var(--bg-secondary)',
        borderRadius: '50%',
        color: theme === 'dark' ? '#0a0f1e' : 'var(--accent-blue)',
      }}
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.9, rotate: -15 }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        key={theme}
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        exit={{ rotateY: -90, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
      </motion.div>
    </motion.button>
  );
}
