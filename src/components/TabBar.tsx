import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Home, BarChart2, Settings } from 'lucide-react';

type Tab = 'setup' | 'dashboard' | 'stats' | 'settings';
interface Props { active: Tab; onChange: (tab: Tab) => void; }
const tabs: Array<{ id: Tab; icon: typeof Home; label: string }> = [
  { id: 'dashboard', icon: Home, label: 'Dashboard' },
  { id: 'stats', icon: BarChart2, label: 'Stats' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const TAB_WIDTH = 84;
const GAP = 4;
const PAD = 6;

export default function TabBar({ active, onChange }: Props) {
  const activeIndex = tabs.findIndex(t => t.id === active);

  // Spring-driven x position for liquid feel
  const springX = useSpring(activeIndex * (TAB_WIDTH + GAP), {
    stiffness: 300,
    damping: 28,
    mass: 0.9,
  });

  // Liquid stretch: scale wider when moving, squish back on settle
  const scaleX = useTransform(springX, (latest) => {
    const target = activeIndex * (TAB_WIDTH + GAP);
    const dist = Math.abs(latest - target);
    return 1 + dist * 0.004; // Stretches up to ~1.3x while sliding
  });

  // Slight vertical squish when stretching horizontally
  const scaleY = useTransform(scaleX, (sx) => {
    return 1 - (sx - 1) * 0.4; // Squish vertically as it stretches
  });

  useEffect(() => {
    springX.set(activeIndex * (TAB_WIDTH + GAP));
  }, [activeIndex]);

  // Direction for skew effect
  const skewDeg = useTransform(springX, (latest) => {
    const target = activeIndex * (TAB_WIDTH + GAP);
    const dist = latest - target;
    return dist * -0.08; // Subtle skew in direction of movement
  });

  return (
    <nav className="tab-bar" role="navigation" aria-label="Main navigation">
      <div className="tab-bar-inner" style={{ position: 'relative' }}>

        {/* Liquid blob indicator */}
        <motion.div
          style={{
            x: springX,
            scaleX,
            scaleY,
            skewX: skewDeg,
            position: 'absolute',
            top: PAD,
            left: PAD + 2,
            width: TAB_WIDTH - 4,
            height: `calc(100% - ${PAD * 2}px)`,
            borderRadius: 22,
            background: 'rgba(124,58,237,0.16)',
            border: '1px solid rgba(124,58,237,0.30)',
            transformOrigin: 'center center',
            pointerEvents: 'none',
            zIndex: 0,
            boxShadow: `
              0 0 24px rgba(124,58,237,0.20),
              0 0 48px rgba(124,58,237,0.08),
              inset 0 1px 2px rgba(255,255,255,0.12),
              inset 0 -1px 1px rgba(0,0,0,0.08)
            `,
          }}
        >
          {/* Top refraction highlight */}
          <div style={{
            position: 'absolute', top: 0, left: '15%', right: '15%', height: '45%',
            background: 'linear-gradient(180deg, rgba(196,181,253,0.22) 0%, rgba(167,139,250,0.06) 60%, transparent 100%)',
            borderRadius: '22px 22px 50% 50%',
            pointerEvents: 'none',
          }} />
          {/* Bottom ambient glow */}
          <div style={{
            position: 'absolute', bottom: -4, left: '20%', right: '20%', height: 8,
            background: 'rgba(124,58,237,0.35)',
            filter: 'blur(8px)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />
          {/* Shimmer sweep */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 22, overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
              animation: 'liquidShimmer 3s ease-in-out infinite',
            }} />
          </div>
        </motion.div>

        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <motion.button
              key={id}
              onClick={() => onChange(id)}
              whileTap={{ scale: 0.85 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '8px 0',
                background: 'transparent',
                border: 'none',
                borderRadius: 22,
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1,
                width: TAB_WIDTH,
                minWidth: TAB_WIDTH,
              }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.18 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{ type: 'spring', stiffness: 450, damping: 22, mass: 0.6 }}
                style={{
                  color: isActive ? '#C4B5FD' : 'var(--text-faint)',
                  filter: isActive ? 'drop-shadow(0 0 10px rgba(167,139,250,0.6))' : undefined,
                  transition: 'color 0.3s ease, filter 0.3s ease',
                }}>
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.6} />
              </motion.div>
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.4,
                  y: isActive ? 0 : 1,
                }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: 10, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#C4B5FD' : 'var(--text-faint)',
                  letterSpacing: '0.02em',
                  transition: 'color 0.3s ease',
                }}>
                {label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
