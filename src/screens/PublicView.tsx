import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { getTodayString, getDayNumber, getDateForDay, getTotalCompletions, formatTime12, getTaskStreak, getDayStatus, pullFromCloud } from '../lib/store';
import type { AppState } from '../lib/store';
import AmbientBackground from '../components/AmbientBackground';
import ProgressRing from '../components/ProgressRing';
import FlameIcon from '../components/FlameIcon';

export default function PublicView({ onLogin }: { onLogin: () => void }) {
  const [data, setData] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function fetchData(manual = false) {
    if (manual) setRefreshing(true);
    pullFromCloud()
      .then(state => {
        if (state && Array.isArray(state.tasks)) {
          setData(state);
          setLastUpdated(new Date().toISOString());
          setPulse(true);
          setTimeout(() => setPulse(false), 600);
        }
        setLoading(false);
        if (manual) setTimeout(() => setRefreshing(false), 600);
      })
      .catch(() => {
        setLoading(false);
        if (manual) setRefreshing(false);
      });
  }

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, []);

  const today = getTodayString();

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07070E', position: 'relative' }}>
        <AmbientBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          <div style={{ width: 44, height: 44, border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spinOnce 0.8s linear infinite', margin: '0 auto 14px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>Loading…</div>
        </motion.div>
      </div>
    );
  }

  if (!data || !data.locked || data.tasks.length === 0) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#07070E', padding: '24px 20px', position: 'relative' }}>
        <AmbientBackground />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 320 }}
        >
          <div style={{ fontSize: 56, marginBottom: 18 }}>🔒</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>No Active Challenge</h1>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.65, margin: '0 0 28px' }}>
            No locked habit challenge yet. Check back once the tracker is set up.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onLogin}
            className="btn-primary"
            style={{ padding: '14px 32px', fontSize: 15, borderRadius: 16, fontWeight: 700 }}
          >
            Open App
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const { tasks, records, startDate } = data;
  const currentDay = startDate ? Math.max(1, Math.min(30, getDayNumber(startDate))) : 1;
  const totalCompleted = getTotalCompletions(records);
  const totalPossible = Math.max(tasks.length * 30, 1);
  const overallPct = Math.round((totalCompleted / totalPossible) * 100);
  const todayRecord = records[today] || { date: today, completions: {}, missed: {} };
  const todayDone = tasks.filter(t => todayRecord.completions[t.id]).length;
  const dateStr = new Date(today + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const updatedStr = lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.055 } } };
  const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: 'easeOut' as const } } };

  return (
    <div style={{ minHeight: '100dvh', background: '#07070E', position: 'relative', paddingBottom: 48 }}>
      <AmbientBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: '20px 20px 0',
            paddingTop: 'calc(env(safe-area-inset-top,0px) + 20px)',
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Live Dashboard</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              30-Day <span className="gradient-text">Challenge</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <motion.div
                animate={{ opacity: pulse ? 1 : [1, 0.3, 1], scale: pulse ? 1.3 : 1 }}
                transition={{ duration: pulse ? 0.3 : 2, repeat: pulse ? 0 : Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.8)' }}
              />
              <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600, letterSpacing: '0.05em' }}>LIVE</span>
            </div>

            {/* Refresh button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => fetchData(true)}
              disabled={refreshing}
              aria-label="Refresh data"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 20,
                background: refreshing ? 'rgba(124,58,237,0.15)' : 'var(--surface)',
                border: `1px solid ${refreshing ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                color: refreshing ? '#A78BFA' : 'var(--text-sub)',
                fontSize: 11, fontWeight: 600, cursor: refreshing ? 'not-allowed' : 'pointer',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.2s ease',
              }}
            >
              <motion.span
                animate={{ rotate: refreshing ? 360 : 0 }}
                transition={{ duration: 0.6, ease: 'linear', repeat: refreshing ? Infinity : 0 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <RefreshCw size={11} />
              </motion.span>
              {refreshing ? 'Refreshing…' : updatedStr ? updatedStr : 'Refresh'}
            </motion.button>
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 20px 18px', gap: 16 }}
        >
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -24, background: 'radial-gradient(circle,rgba(124,58,237,0.14),transparent)', borderRadius: '50%', filter: 'blur(20px)', animation: 'pulseScale 3s ease-in-out infinite' }} />
            <ProgressRing progress={overallPct} size={170} label={`${overallPct}%`} sublabel="complete" />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
              Day <span className="gradient-text">{currentDay}</span>
              <span style={{ fontSize: 18, color: 'var(--text-faint)', fontWeight: 500 }}>/30</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 5 }}>{dateStr}</div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            {[
              { v: `${todayDone}/${tasks.length}`, l: 'Today', c: '#10B981', bg: 'rgba(16,185,129,0.08)', b: 'rgba(16,185,129,0.18)' },
              { v: totalCompleted, l: 'Total Done', c: '#A78BFA', bg: 'rgba(124,58,237,0.08)', b: 'rgba(124,58,237,0.18)' },
              { v: tasks.length, l: 'Habits', c: '#F59E0B', bg: 'rgba(245,158,11,0.08)', b: 'rgba(245,158,11,0.18)' },
            ].map(s => (
              <div key={s.l} style={{ flex: 1, padding: '12px 6px', textAlign: 'center', borderRadius: 16, background: s.bg, border: `1px solid ${s.b}`, backdropFilter: 'blur(12px)' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3, fontWeight: 500 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 30-day calendar grid */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ padding: '0 20px 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 13, borderRadius: 2, background: 'linear-gradient(180deg,#7C3AED,#4F46E5)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Progress Map</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: 30 }, (_, i) => {
              const d = i + 1;
              const date = getDateForDay(startDate!, d);
              const status = getDayStatus(date, tasks, records);
              const isToday = d === currentDay;
              const bg = status === 'complete' ? '#10B981' : status === 'partial' ? '#F59E0B' : status === 'missed' ? 'rgba(239,68,68,0.45)' : status === 'today' ? '#7C3AED' : 'var(--surface)';
              return (
                <motion.div
                  key={d}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.018, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  title={`Day ${d}`}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: bg,
                    border: isToday ? '2px solid #A78BFA' : '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700,
                    color: status === 'future' ? 'var(--text-faint)' : 'var(--text)',
                    boxShadow: isToday ? '0 0 12px rgba(124,58,237,0.6)' : status === 'complete' ? '0 0 6px rgba(16,185,129,0.3)' : undefined,
                    animation: isToday ? 'dayPulse 2s ease-in-out infinite' : undefined,
                  }}
                >
                  {d}
                </motion.div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            {[['#10B981','Done'],['#F59E0B','Partial'],['rgba(239,68,68,0.45)','Missed'],['#7C3AED','Today'],['var(--surface)','Future']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{l}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Task list */}
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 13, borderRadius: 2, background: 'linear-gradient(180deg,#10B981,#059669)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Today's Habits</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: todayDone === tasks.length ? '#10B981' : 'var(--text-dim)' }}>
              {todayDone}/{tasks.length}
            </span>
          </div>

          <motion.div variants={container} initial="hidden" animate="show">
            {tasks.map((task, i) => {
              const done = !!todayRecord.completions[task.id];
              const missed = !!todayRecord.missed[task.id] && !done;
              const streak = getTaskStreak(task.id, records, startDate!, currentDay);
              return (
                <motion.div key={task.id} variants={item} style={{ marginBottom: 9 }}>
                  <div
                    className={`glass-card ${done ? 'glass-card-green' : missed ? 'glass-card-red' : ''}`}
                    style={{
                      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 13,
                      boxShadow: done ? '0 0 18px rgba(16,185,129,0.08)' : undefined,
                    }}
                  >
                    {/* Status orb */}
                    <motion.div
                      animate={{ boxShadow: done ? '0 0 14px rgba(16,185,129,0.5)' : 'none' }}
                      style={{
                        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                        background: done ? 'linear-gradient(135deg,#10B981,#059669)' : missed ? 'rgba(239,68,68,0.12)' : 'var(--surface)',
                        border: `2px solid ${done ? '#10B981' : missed ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {done && <svg width={14} height={14} viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      {missed && !done && <svg width={12} height={12} viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="#EF4444" strokeWidth={2.2} strokeLinecap="round" /></svg>}
                      {!done && !missed && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,240,248,0.28)' }}>{i + 1}</span>}
                    </motion.div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: done ? 'rgba(240,240,248,0.5)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.36)', marginTop: 2 }}>
                        {formatTime12(task.time)}{task.description && ` · ${task.description}`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <FlameIcon streak={streak} size={17} />
                      <div style={{
                        fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                        padding: '2px 7px', borderRadius: 20,
                        background: done ? 'rgba(16,185,129,0.15)' : missed ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                        color: done ? '#10B981' : missed ? '#EF4444' : 'rgba(240,240,248,0.28)',
                        border: `1px solid ${done ? 'rgba(16,185,129,0.22)' : missed ? 'rgba(239,68,68,0.18)' : 'var(--surface)'}`,
                      }}>
                        {done ? '✓ Done' : missed ? 'Missed' : '—'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
        >
          {/* Big refresh button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{
              width: '100%',
              padding: '15px', borderRadius: 16,
              background: refreshing
                ? 'rgba(124,58,237,0.12)'
                : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${refreshing ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.08)'}`,
              color: refreshing ? '#A78BFA' : 'rgba(240,240,248,0.5)',
              fontSize: 14, fontWeight: 700, cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              backdropFilter: 'blur(16px)',
              transition: 'all 0.25s ease',
            }}
          >
            <motion.span
              animate={{ rotate: refreshing ? 360 : 0 }}
              transition={{ duration: 0.6, ease: 'linear', repeat: refreshing ? Infinity : 0 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <RefreshCw size={15} />
            </motion.span>
            {refreshing ? 'Refreshing data…' : 'Refresh Now'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onLogin}
            style={{
              padding: '13px 28px', borderRadius: 16,
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.25)',
              color: '#A78BFA', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease',
            }}
          >
            Open Tracker App
          </motion.button>

          <p style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.03em' }}>
            Auto-refreshes every 30s · tap to refresh manually
          </p>
        </motion.div>
      </div>
    </div>
  );
}
