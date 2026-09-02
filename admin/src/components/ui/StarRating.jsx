import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StarRating({ rating, setRating, size = 28, readonly = false }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          onClick={() => !readonly && setRating?.(star)}
          whileHover={!readonly ? { scale: 1.25 } : {}}
          whileTap={!readonly ? { scale: 0.9 } : {}}
          style={{
            background: 'none',
            border: 'none',
            cursor: readonly ? 'default' : 'pointer',
            padding: 2,
            color: star <= rating ? 'var(--accent-yellow)' : 'var(--text-tertiary)',
            filter: star <= rating ? 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.4))' : 'none',
            transition: 'var(--transition-smooth)',
          }}
        >
          <Star size={size} fill={star <= rating ? 'currentColor' : 'none'} />
        </motion.button>
      ))}
    </div>
  );
}
