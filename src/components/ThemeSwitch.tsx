import { motion } from 'framer-motion';

interface Props {
  isLight: boolean;
  onToggle: () => void;
}

export default function ThemeSwitch({ isLight, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        width: 72,
        height: 36,
        borderRadius: 20,
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        padding: 0,
        outline: 'none',
        flexShrink: 0,
        transition: 'box-shadow 0.5s ease',
        boxShadow: isLight
          ? '0 2px 14px rgba(56,189,248,0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
          : '0 2px 14px rgba(30,27,75,0.6), inset 0 1px 2px rgba(255,255,255,0.06)',
      }}
    >
      {/* === Sky background === */}
      <motion.div
        animate={{
          background: isLight
            ? 'linear-gradient(135deg, #7DD3FC 0%, #38BDF8 40%, #0EA5E9 100%)'
            : 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', inset: 0, borderRadius: 20 }}
      />

      {/* === Dark mode: gradient glow behind moon === */}
      <motion.div
        animate={{
          opacity: isLight ? 0 : 1,
        }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute',
          top: 0, right: 0,
          width: 44, height: '100%',
          borderRadius: '0 20px 20px 0',
          background: 'linear-gradient(270deg, rgba(148,163,184,0.18) 0%, rgba(100,116,139,0.08) 60%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* === Stars (dark mode) === */}
      {[
        { top: 6,  left: 8,  size: 2,   delay: 0 },
        { top: 14, left: 16, size: 1.5, delay: 0.1 },
        { top: 24, left: 10, size: 1.5, delay: 0.15 },
        { top: 8,  left: 24, size: 2,   delay: 0.05 },
        { top: 20, left: 22, size: 1,   delay: 0.2 },
        { top: 28, left: 14, size: 1,   delay: 0.12 },
        { top: 11, left: 32, size: 1.5, delay: 0.08 },
        { top: 18, left: 6,  size: 1,   delay: 0.18 },
        { top: 5,  left: 18, size: 1,   delay: 0.25 },
      ].map((star, i) => (
        <motion.div
          key={`star-${i}`}
          animate={{
            opacity: isLight ? 0 : [0.3, 1, 0.3],
            scale: isLight ? 0 : 1,
          }}
          transition={{
            opacity: {
              duration: 2.5 + i * 0.3,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            },
            scale: { duration: 0.35, delay: isLight ? 0 : 0.25 + star.delay },
          }}
          style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: '#FFF',
            boxShadow: '0 0 4px rgba(255,255,255,0.9)',
            zIndex: 1,
          }}
        />
      ))}

      {/* === Clouds (light mode) === */}
      {/* Cloud group 1 */}
      <motion.div
        animate={{
          opacity: isLight ? 1 : 0,
          x: isLight ? 0 : 12,
          scale: isLight ? 1 : 0.6,
        }}
        transition={{ duration: 0.45, delay: isLight ? 0.25 : 0, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', bottom: 3, right: 6, zIndex: 3 }}
      >
        <div style={{
          width: 22, height: 9, borderRadius: 7,
          background: 'rgba(255,255,255,0.92)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          position: 'relative',
        }}>
          <div style={{
            width: 10, height: 7, borderRadius: 6,
            background: 'rgba(255,255,255,0.95)',
            position: 'absolute', top: -4, left: 4,
          }} />
          <div style={{
            width: 7, height: 5, borderRadius: 5,
            background: 'rgba(255,255,255,0.85)',
            position: 'absolute', top: -2, left: 12,
          }} />
        </div>
      </motion.div>
      {/* Cloud group 2 */}
      <motion.div
        animate={{
          opacity: isLight ? 0.7 : 0,
          x: isLight ? 0 : 10,
          scale: isLight ? 1 : 0.4,
        }}
        transition={{ duration: 0.45, delay: isLight ? 0.35 : 0, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', top: 5, right: 14, zIndex: 3 }}
      >
        <div style={{
          width: 14, height: 6, borderRadius: 5,
          background: 'rgba(255,255,255,0.65)',
        }} />
      </motion.div>

      {/* === Sun / Moon orb === */}
      <motion.div
        animate={{ x: isLight ? 4 : 38 }}
        transition={{ type: 'spring', stiffness: 350, damping: 24, mass: 0.8 }}
        style={{
          position: 'absolute',
          top: 3,
          left: 0,
          width: 30,
          height: 30,
          zIndex: 4,
        }}
      >
        {/* Sun rays / glow */}
        <motion.div
          animate={{
            opacity: isLight ? 0.6 : 0,
            scale: isLight ? 1 : 0.3,
          }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250,204,21,0.55) 0%, rgba(250,204,21,0.15) 50%, transparent 70%)',
          }}
        />

        {/* Moon glow (subtle silver halo) */}
        <motion.div
          animate={{
            opacity: isLight ? 0 : 0.4,
            scale: isLight ? 0.5 : 1,
          }}
          transition={{ duration: 0.5, delay: isLight ? 0 : 0.15 }}
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(203,213,225,0.4) 0%, rgba(148,163,184,0.1) 60%, transparent 80%)',
          }}
        />

        {/* Main orb */}
        <motion.div
          animate={{
            background: isLight
              ? 'linear-gradient(145deg, #FDE68A 0%, #FACC15 35%, #EAB308 100%)'
              : 'linear-gradient(145deg, #F1F5F9 0%, #E2E8F0 30%, #CBD5E1 60%, #94A3B8 100%)',
            boxShadow: isLight
              ? '0 0 20px rgba(250,204,21,0.55), inset 0 -3px 6px rgba(234,179,8,0.35), inset 0 2px 4px rgba(255,255,255,0.5)'
              : '0 0 14px rgba(148,163,184,0.3), inset 0 -3px 6px rgba(100,116,139,0.35), inset 0 2px 5px rgba(255,255,255,0.35)',
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Moon crater 1 (large) */}
          <motion.div
            animate={{ opacity: isLight ? 0 : 0.35, scale: isLight ? 0 : 1 }}
            transition={{ duration: 0.3, delay: isLight ? 0 : 0.3 }}
            style={{
              position: 'absolute', top: 5, left: 6,
              width: 8, height: 8, borderRadius: '50%',
              background: 'rgba(100,116,139,0.4)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
            }}
          />
          {/* Moon crater 2 */}
          <motion.div
            animate={{ opacity: isLight ? 0 : 0.3, scale: isLight ? 0 : 1 }}
            transition={{ duration: 0.3, delay: isLight ? 0 : 0.38 }}
            style={{
              position: 'absolute', top: 17, left: 16,
              width: 5, height: 5, borderRadius: '50%',
              background: 'rgba(100,116,139,0.35)',
              boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.1)',
            }}
          />
          {/* Moon crater 3 */}
          <motion.div
            animate={{ opacity: isLight ? 0 : 0.25, scale: isLight ? 0 : 1 }}
            transition={{ duration: 0.3, delay: isLight ? 0 : 0.42 }}
            style={{
              position: 'absolute', top: 19, left: 5,
              width: 4, height: 4, borderRadius: '50%',
              background: 'rgba(100,116,139,0.3)',
            }}
          />
          {/* Moon crater 4 (small) */}
          <motion.div
            animate={{ opacity: isLight ? 0 : 0.2, scale: isLight ? 0 : 1 }}
            transition={{ duration: 0.3, delay: isLight ? 0 : 0.45 }}
            style={{
              position: 'absolute', top: 10, left: 18,
              width: 3, height: 3, borderRadius: '50%',
              background: 'rgba(100,116,139,0.25)',
            }}
          />
        </motion.div>
      </motion.div>
    </button>
  );
}
