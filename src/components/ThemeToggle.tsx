import { motion } from 'framer-motion';
import type { Theme } from '../lib/theme';

interface Props {
  theme: Theme;
  onChange: (t: Theme) => void;
}

export default function ThemeToggle({ theme, onChange }: Props) {
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={() => onChange(isDark ? 'light' : 'dark')}
      whileTap={{ scale: 0.88 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        width: 52,
        height: 28,
        borderRadius: 14,
        background: isDark
          ? 'linear-gradient(135deg, #1E1040, #2D1B69)'
          : 'linear-gradient(135deg, #E0D9FF, #C4B5FD)',
        border: isDark
          ? '1.5px solid rgba(124,58,237,0.4)'
          : '1.5px solid rgba(124,58,237,0.3)',
        padding: 0,
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        boxShadow: isDark
          ? '0 0 12px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 2px 8px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.6)',
        transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
        flexShrink: 0,
      }}
    >
      {/* Track icons */}
      <span style={{
        position: 'absolute', left: 6,
        fontSize: 11, lineHeight: 1,
        opacity: isDark ? 0.8 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
      }}>🌙</span>
      <span style={{
        position: 'absolute', right: 6,
        fontSize: 11, lineHeight: 1,
        opacity: isDark ? 0 : 0.9,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
      }}>☀️</span>

      {/* Thumb */}
      <motion.div
        layout
        animate={{ x: isDark ? 3 : 25 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: isDark
            ? 'linear-gradient(135deg, #A78BFA, #7C3AED)'
            : 'linear-gradient(135deg, #FDE68A, #F59E0B)',
          boxShadow: isDark
            ? '0 2px 8px rgba(124,58,237,0.6), 0 0 0 1px rgba(255,255,255,0.1)'
            : '0 2px 8px rgba(245,158,11,0.5), 0 0 0 1px rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, lineHeight: 1 }}>
          {isDark ? '✦' : '✦'}
        </span>
      </motion.div>
    </motion.button>
  );
}
