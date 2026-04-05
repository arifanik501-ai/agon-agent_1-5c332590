import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, RefreshCw } from 'lucide-react';
import type { AppState, DayRecord } from '../lib/store';
import { getTodayString, getDayNumber, isTaskAvailable, formatTime12, getTaskStreak, getOverallStreak, getTotalCompletions, saveState, MOTIVATIONAL_PHRASES, pullFromCloud, mergeStates, pushToCloud, loadState } from '../lib/store';
import ProgressRing from '../components/ProgressRing';
import FlameIcon from '../components/FlameIcon';
import CalendarStrip from '../components/CalendarStrip';
import DayDetailModal from '../components/DayDetailModal';

interface Props {
  state: AppState;
  onStateChange: (s: AppState) => void;
  onUnlock: () => void;
  onRefresh?: () => Promise<void>;
}

export default function DashboardScreen({ state, onStateChange, onUnlock, onRefresh }: Props) {
  const { tasks, records, startDate } = state;
  const today = getTodayString();
  const rawDayNum = getDayNumber(startDate || today);
  const isDemo = rawDayNum < 1;
  const currentDay = isDemo ? 0 : Math.min(30, rawDayNum);
  const todayRecord: DayRecord = records[today] || { date: today, completions: {}, missed: {} };

  const [selectedDay, setSelectedDay] = useState<{ num: number; date: string } | null>(null);
  const [flaredTasks, setFlaredTasks] = useState<Set<string>>(new Set());
  const [tooltips, setTooltips] = useState<Set<string>>(new Set());
  const [justChecked, setJustChecked] = useState<Set<string>>(new Set());
  const [_now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshDone(false);
    try {
      const cloudState = await pullFromCloud();
      if (cloudState) {
        const merged = mergeStates(state, cloudState);
        onStateChange(merged);
        saveState(merged);
        await pushToCloud(merged);
      } else {
        await pushToCloud(loadState());
      }
      if (onRefresh) await onRefresh();
      setRefreshDone(true);
      setTimeout(() => setRefreshDone(false), 2500);
    } catch { /* silent fail */ }
    finally { setRefreshing(false); }
  }

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!startDate) return;
    const updated = { ...records };
    let changed = false;
    tasks.forEach(task => {
      if (isTaskAvailable(task.time) === 'missed') {
        const rec = updated[today] || { date: today, completions: {}, missed: {} };
        if (!rec.completions[task.id] && !rec.missed[task.id]) { rec.missed[task.id] = true; updated[today] = rec; changed = true; }
      }
    });
    if (changed) { const ns = { ...state, records: updated }; onStateChange(ns); saveState(ns); }
  }, [_now, tasks, today]);

  function toggleTask(taskId: string) {
    const avail = isTaskAvailable(tasks.find(t => t.id === taskId)?.time || '');
    if (avail !== 'available') return;
    const rec = { ...todayRecord };
    const wasChecked = rec.completions[taskId];
    rec.completions = { ...rec.completions, [taskId]: !wasChecked };
    const ns = { ...state, records: { ...records, [today]: rec } };
    onStateChange(ns); saveState(ns);
    if (!wasChecked) {
      setJustChecked(p => new Set([...p, taskId]));
      setFlaredTasks(p => new Set([...p, taskId]));
      setTimeout(() => {
        setJustChecked(p => { const s = new Set(p); s.delete(taskId); return s; });
        setFlaredTasks(p => { const s = new Set(p); s.delete(taskId); return s; });
      }, 650);
    }
  }

  const totalCompleted = getTotalCompletions(records);
  const totalPossible = Math.max(tasks.length * 30, 1);
  const overallProgress = Math.round((totalCompleted / totalPossible) * 100);
  const todayCompleted = tasks.filter(t => todayRecord.completions[t.id]).length;
  const overallStreak = getOverallStreak(records, tasks, startDate || today, currentDay);
  const dateStr = new Date(today + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const phrase = isDemo ? "Demo mode active! Your official 30-day run starts on April 6th." : MOTIVATIONAL_PHRASES[(currentDay - 1) % 30];

  // Glass stat card style
  const statCard = (_color: string, bgAlpha: string, borderAlpha: string) => ({
    flex: 1, padding: '14px 8px', textAlign: 'center' as const,
    borderRadius: 20,
    background: bgAlpha,
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    border: `1px solid ${borderAlpha}`,
    boxShadow: `inset 0 1px 2px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.12)`,
    position: 'relative' as const, overflow: 'hidden' as const,
  });

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Top bar */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>30 Days Goal</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sub)', marginTop: 1 }}>
            {isDemo ? <span style={{ color: 'var(--amber)' }}>Demo Mode</span> : <>Day <span style={{ color: 'var(--violet-lt)' }}>{currentDay}</span> of 30</>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Refresh */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh data from cloud"
            style={{
              width: 42, height: 42, borderRadius: 14,
              background: refreshDone ? 'rgba(16,185,129,0.10)' : refreshing ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${refreshDone ? 'rgba(16,185,129,0.25)' : refreshing ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.08)'}`,
              color: refreshDone ? 'var(--green)' : refreshing ? 'var(--violet-lt)' : 'var(--text-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06)',
              transition: 'all 0.3s ease',
            }}
          >
            <span style={{ display: 'flex', animation: refreshing ? 'spinOnce 0.8s linear infinite' : undefined }}>
              <RefreshCw size={16} />
            </span>
          </motion.button>
          {/* Settings */}
          <motion.button
            whileTap={{ scale: 0.88, rotate: 30 }}
            onClick={onUnlock}
            style={{
              width: 42, height: 42, borderRadius: 14,
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06)',
            }}
            aria-label="Settings"
          >
            <Settings size={17} />
          </motion.button>
        </div>
      </motion.div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, ease: [0.22,1,0.36,1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 20px 0', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -24, background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulseScale 3.5s ease-in-out infinite' }} />
          <ProgressRing progress={overallProgress} size={176} label={`${overallProgress}%`} sublabel="overall" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            {isDemo ? (
              <span className="gradient-text" style={{ fontSize: 36 }}>Demo Day</span>
            ) : (
              <>Day <span className="gradient-text">{currentDay}</span><span style={{ fontSize: 20, color: 'var(--text-faint)', fontWeight: 500 }}>/30</span></>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 5 }}>{dateStr}</div>
          <div style={{ fontSize: 12, color: 'var(--violet-lt)', marginTop: 6, fontStyle: 'italic', opacity: 0.85 }}>"{phrase}"</div>
        </div>

        {/* Glass stat cards */}
        <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 6 }}>
          {[
            { val: `${todayCompleted}/${tasks.length}`, label: 'Today', col: 'var(--green)', bg: 'rgba(16,185,129,0.08)', bdr: 'rgba(16,185,129,0.18)' },
            { val: `🔥 ${overallStreak}`, label: 'Day streak', col: 'var(--amber)', bg: 'rgba(245,158,11,0.08)', bdr: 'rgba(245,158,11,0.18)' },
            { val: String(totalCompleted), label: 'All time', col: 'var(--violet-lt)', bg: 'rgba(124,58,237,0.08)', bdr: 'rgba(124,58,237,0.18)' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.07, duration: 0.48, ease: [0.22,1,0.36,1] }}
              style={statCard(s.col, s.bg, s.bdr)}>
              {/* Inner highlight */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${s.bdr}, transparent)`, pointerEvents: 'none' }} />
              <div style={{ fontSize: 21, fontWeight: 800, color: s.col, lineHeight: 1, position: 'relative', zIndex: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, fontWeight: 600, position: 'relative', zIndex: 1 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.2, ease: [0.22,1,0.36,1] }}
        style={{ padding: '24px 20px 0' }}>
        <div className="section-label">
          <div className="section-label-bar" style={{ background: 'linear-gradient(180deg,var(--violet),#4F46E5)', color: 'var(--violet)' }} />
          <span className="section-label-text">30-Day Progress</span>
        </div>
        <CalendarStrip startDate={startDate || today} currentDay={currentDay} tasks={tasks} records={records} onDayTap={(num, date) => setSelectedDay({ num, date })} />
      </motion.div>

      {/* Tasks */}
      <div style={{ padding: '24px 20px 0' }}>
        <div className="section-label" style={{ marginBottom: 14 }}>
          <div className="section-label-bar" style={{ background: 'linear-gradient(180deg,var(--green),#059669)', color: 'var(--green)' }} />
          <span className="section-label-text">Today's Habits</span>
          <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: todayCompleted === tasks.length && tasks.length > 0 ? 'var(--green)' : 'var(--text-dim)' }}>{todayCompleted}/{tasks.length}</div>
        </div>

        {tasks.map((task, i) => {
          const avail = isTaskAvailable(task.time);
          const done = !!todayRecord.completions[task.id];
          const missed = !!todayRecord.missed[task.id] && !done;
          const streak = getTaskStreak(task.id, records, startDate || today, currentDay);
          const isFlaring = flaredTasks.has(task.id);
          const isJustChecked = justChecked.has(task.id);
          const showTip = tooltips.has(task.id);
          const availLabel = avail === 'upcoming' ? `Opens at ${formatTime12(task.time)}` : 'Missed';
          const cardClass = done ? 'glass-card glass-card-green card-press' : missed ? 'glass-card glass-card-red card-press' : 'glass-card card-press';

          return (
            <motion.div key={task.id}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: isJustChecked ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 0.42, delay: i * 0.05, ease: [0.22,1,0.36,1] }}
              style={{ marginBottom: 10 }}>
              <div className={cardClass}
                style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
                onClick={() => {
                  if (avail !== 'available') {
                    setTooltips(p => new Set([...p, task.id]));
                    setTimeout(() => setTooltips(p => { const s = new Set(p); s.delete(task.id); return s; }), 2200);
                    return;
                  }
                  toggleTask(task.id);
                }}>

                {/* Checkbox */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <motion.div animate={{ scale: isJustChecked ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.35 }}
                    style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                      background: done ? 'linear-gradient(135deg, var(--green), #059669)' : missed ? 'var(--red-dim)' : avail === 'available' ? 'var(--violet-dim)' : 'var(--surface)',
                      border: `2px solid ${done ? 'var(--green)' : missed ? 'var(--red)' : avail === 'available' ? 'var(--violet)' : 'var(--border)'}`,
                      boxShadow: done ? '0 0 16px rgba(16,185,129,0.25), inset 0 1px 1px rgba(255,255,255,0.15)' : avail === 'available' ? '0 0 10px var(--violet-dim), inset 0 1px 1px rgba(255,255,255,0.06)' : 'inset 0 1px 1px rgba(255,255,255,0.04)',
                      cursor: avail === 'available' ? 'pointer' : 'default',
                    }}>
                    <AnimatePresence mode="wait">
                      {done && <motion.svg key="check" initial={{ scale:0,rotate:-20 }} animate={{ scale:1,rotate:0 }} exit={{ scale:0 }} transition={{ duration:0.28,ease:[0.22,1,0.36,1] }} width={15} height={15} viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></motion.svg>}
                      {missed && !done && <motion.svg key="x" initial={{ scale:0 }} animate={{ scale:1 }} width={13} height={13} viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="var(--red)" strokeWidth={2.2} strokeLinecap="round"/></motion.svg>}
                      {!done && !missed && avail === 'available' && <motion.div key="dot" initial={{ scale:0 }} animate={{ scale:1 }} style={{ width:7,height:7,borderRadius:'50%',background:'var(--violet)',boxShadow:'0 0 6px var(--violet-glow)' }}/>}
                    </AnimatePresence>
                  </motion.div>
                  {showTip && <div className="tooltip">{availLabel}</div>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: done ? 'var(--text-dim)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color 0.3s ease' }}>{task.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                    {formatTime12(task.time)}
                    {task.description && <span style={{ marginLeft: 5, color: 'var(--text-faint)' }}>· {task.description}</span>}
                  </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                  <FlameIcon streak={streak} size={18} flare={isFlaring} />
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 20,
                    background: done ? 'var(--green-dim)' : missed ? 'var(--red-dim)' : avail === 'available' ? 'var(--violet-dim)' : 'var(--surface)',
                    color: done ? 'var(--green)' : missed ? 'var(--red)' : avail === 'available' ? 'var(--violet-lt)' : 'var(--text-faint)',
                    border: `1px solid ${done ? 'var(--green-border)' : missed ? 'var(--red-border)' : avail === 'available' ? 'rgba(124,58,237,0.25)' : 'var(--border)'}`,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}>
                    {done ? '✓ Done' : missed ? 'Missed' : avail === 'available' ? 'Now' : avail === 'upcoming' ? 'Soon' : '—'}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedDay && <DayDetailModal dayNum={selectedDay.num} date={selectedDay.date} tasks={tasks} record={records[selectedDay.date]} onClose={() => setSelectedDay(null)} />}
      </AnimatePresence>
    </div>
  );
}
