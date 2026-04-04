import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw } from 'lucide-react';
import Confetti from '../components/Confetti';
import type { AppState } from '../lib/store';
import { getTotalCompletions, getDateForDay, getTodayString } from '../lib/store';

interface Props {
  state: AppState;
  onNewCycle: () => void;
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{display}{suffix}</>;
}

export default function CelebrationScreen({ state, onNewCycle }: Props) {
  const { tasks, records, startDate } = state;
  const today = getTodayString();
  const totalCompleted = getTotalCompletions(records);
  const overallRate = Math.round((totalCompleted / 300) * 100);

  // Best and worst day
  let bestDay = { day: 0, count: -1 };
  let worstDay = { day: 0, count: 11 };
  let longestStreak = 0, curStreak = 0;

  for (let d = 1; d <= 30; d++) {
    const date = getDateForDay(startDate || today, d);
    const rec = records[date];
    const count = rec ? tasks.filter(t => rec.completions[t.id]).length : 0;
    if (count > bestDay.count) bestDay = { day: d, count };
    if (count < worstDay.count) worstDay = { day: d, count };
    if (count === 10) { curStreak++; if (curStreak > longestStreak) longestStreak = curStreak; }
    else curStreak = 0;
  }

  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
      paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      textAlign: 'center',
      position: 'relative',
    }}>
      <Confetti />

      {/* Trophy */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(251,191,36,0.2))',
          border: '2px solid rgba(245,158,11,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 0 40px rgba(245,158,11,0.4)',
        }}
      >
        <Trophy size={48} color="#F59E0B" />
      </motion.div>

      {showContent && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ fontSize: 13, color: '#F59E0B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
              30 Days Complete
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.1 }}>
              You Did It.
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-sub)', lineHeight: 1.6, margin: '0 0 32px' }}>
              30 days. 10 tasks. No excuses.<br />You locked in and showed up.
            </p>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}
          >
            {[
              { label: 'Completion Rate', value: overallRate, suffix: '%', color: '#9B59F5' },
              { label: 'Longest Streak', value: longestStreak, suffix: 'd', color: '#F59E0B' },
              { label: 'Best Day', value: bestDay.day, suffix: bestDay.count >= 0 ? ` (${bestDay.count}/10)` : '', color: '#10B981' },
              { label: 'Total Done', value: totalCompleted, suffix: '', color: '#06B6D4' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="glass-card"
                style={{ padding: '18px 12px', textAlign: 'center' }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>
                  <AnimatedNumber value={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%' }}
          >
            <div className="glass-card" style={{ padding: '16px', marginBottom: 16, borderColor: 'rgba(245,158,11,0.2)' }}>
              <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                {overallRate >= 90
                  ? '"Elite. You didn\'t just build habits — you built a new identity."'
                  : overallRate >= 70
                  ? '"Solid performance. The habits are forming. Keep the momentum."'
                  : '"Every day you showed up matters. The foundation is laid — now build on it."'
                }
              </p>
            </div>

            <button
              onClick={onNewCycle}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                border: 'none',
                color: 'var(--text)',
                fontSize: 17,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 0 30px rgba(124,58,237,0.4)',
                letterSpacing: '-0.01em',
              }}
            >
              <RefreshCw size={20} />
              Start New 30-Day Cycle
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}
