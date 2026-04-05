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
          ? '0 2px 12px rgba(56,189,248,0.35), inset 0 1px 2px rgba(255,255,255,0.3)'
          : '0 2px 12px rgba(99,102,241,0.35), inset 0 1px 2px rgba(255,255,255,0.08)',
      }}
    >
      {/* Sky background */}
      <motion.div
        animate={{
          background: isLight
            ? 'linear-gradient(135deg, #87CEEB 0%, #38BDF8 40%, #60A5FA 100%)'
            : 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 40%, #312E81 100%)',
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
        }}
      />

      {/* Stars (visible in dark mode) */}
      {[
        { top: 7, left: 42, size: 2, delay: 0 },
        { top: 12, left: 52, size: 1.5, delay: 0.1 },
        { top: 20, left: 46, size: 1.5, delay: 0.15 },
        { top: 6, left: 58, size: 2, delay: 0.05 },
        { top: 16, left: 62, size: 1, delay: 0.2 },
        { top: 26, left: 55, size: 1.5, delay: 0.12 },
        { top: 10, left: 38, size: 1, delay: 0.08 },
      ].map((star, i) => (
        <motion.div
          key={`star-${i}`}
          animate={{
            opacity: isLight ? 0 : [0.4, 1, 0.4],
            scale: isLight ? 0 : 1,
          }}
          transition={{
            opacity: {
              duration: 2,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            },
            scale: { duration: 0.4, delay: isLight ? 0 : 0.3 + star.delay },
          }}
          style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: '#FFF',
            boxShadow: '0 0 3px rgba(255,255,255,0.8)',
          }}
        />
      ))}

      {/* Clouds (visible in light mode) */}
      <motion.div
        animate={{
          opacity: isLight ? 1 : 0,
          x: isLight ? 0 : 10,
          scale: isLight ? 1 : 0.7,
        }}
        transition={{ duration: 0.5, delay: isLight ? 0.2 : 0, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', bottom: 4, right: 8, zIndex: 1 }}
      >
        <div style={{
          width: 20, height: 8, borderRadius: 6,
          background: 'rgba(255,255,255,0.9)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }} />
        <div style={{
          width: 12, height: 6, borderRadius: 6,
          background: 'rgba(255,255,255,0.75)',
          position: 'absolute', top: -3, left: 3,
        }} />
      </motion.div>

      <motion.div
        animate={{
          opacity: isLight ? 0.7 : 0,
          x: isLight ? 0 : 8,
          scale: isLight ? 1 : 0.5,
        }}
        transition={{ duration: 0.5, delay: isLight ? 0.3 : 0, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', bottom: 10, right: 18, zIndex: 1 }}
      >
        <div style={{
          width: 14, height: 6, borderRadius: 5,
          background: 'rgba(255,255,255,0.7)',
        }} />
      </motion.div>

      {/* Sun / Moon orb */}
      <motion.div
        animate={{
          x: isLight ? 4 : 38,
        }}
        transition={{
          type: 'spring',
          stiffness: 350,
          damping: 25,
          mass: 0.8,
        }}
        style={{
          position: 'absolute',
          top: 3,
          left: 0,
          width: 30,
          height: 30,
          zIndex: 2,
        }}
      >
        {/* Sun glow */}
        <motion.div
          animate={{
            opacity: isLight ? 0.5 : 0,
            scale: isLight ? 1 : 0.5,
          }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250,204,21,0.5) 0%, transparent 70%)',
          }}
        />

        {/* Main orb body */}
        <motion.div
          animate={{
            background: isLight
              ? 'linear-gradient(135deg, #FDE047 0%, #FACC15 40%, #F59E0B 100%)'
              : 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 40%, #94A3B8 100%)',
            boxShadow: isLight
              ? '0 0 16px rgba(250,204,21,0.6), inset 0 -2px 4px rgba(234,179,8,0.3), inset 0 2px 4px rgba(255,255,255,0.4)'
              : '0 0 10px rgba(148,163,184,0.3), inset 0 -2px 4px rgba(100,116,139,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            position: 'relative',
          }}
        >
          {/* Moon craters */}
          <motion.div
            animate={{ opacity: isLight ? 0 : 0.3, scale: isLight ? 0 : 1 }}
            transition={{ duration: 0.3, delay: isLight ? 0 : 0.3 }}
            style={{
              position: 'absolute', top: 7, left: 8,
              width: 5, height: 5, borderRadius: '50%',
              background: 'rgba(100,116,139,0.5)',
            }}
          />
          <motion.div
            animate={{ opacity: isLight ? 0 : 0.25, scale: isLight ? 0 : 1 }}
            transition={{ duration: 0.3, delay: isLight ? 0 : 0.35 }}
            style={{
              position: 'absolute', top: 15, left: 16,
              width: 3, height: 3, borderRadius: '50%',
              background: 'rgba(100,116,139,0.4)',
            }}
          />
          <motion.div
            animate={{ opacity: isLight ? 0 : 0.2, scale: isLight ? 0 : 1 }}
            transition={{ duration: 0.3, delay: isLight ? 0 : 0.4 }}
            style={{
              position: 'absolute', top: 18, left: 7,
              width: 4, height: 4, borderRadius: '50%',
              background: 'rgba(100,116,139,0.35)',
            }}
          />
        </motion.div>
      </motion.div>
    </button>
  );
}
