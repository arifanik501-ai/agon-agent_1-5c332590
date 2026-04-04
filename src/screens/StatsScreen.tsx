import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { AppState } from '../lib/store';
import { getDayNumber, getDateForDay, getTaskStreak, getTotalCompletions, getTodayString } from '../lib/store';

interface Props {
  state: AppState;
}

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.2 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return inView;
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const from = 0;
    const to = value;
    const duration = 1000;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);

  return <>{display}{suffix}</>;
}

export default function StatsScreen({ state }: Props) {
  const { tasks, records, startDate } = state;
  const today = getTodayString();
  const currentDay = startDate ? Math.max(1, Math.min(30, getDayNumber(startDate))) : 1;
  const totalCompleted = getTotalCompletions(records);
  const totalPossible = 300;
  const overallRate = Math.round((totalCompleted / totalPossible) * 100);

  const heatmapRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const heatInView = useInView(heatmapRef as React.RefObject<HTMLElement>);
  const barsInView = useInView(barsRef as React.RefObject<HTMLElement>);
  const lineInView = useInView(lineRef as React.RefObject<HTMLElement>);

  // Per-task stats
  const taskStats = tasks.map(task => {
    let completed = 0, total = 0, bestStreak = 0, curStreak = 0, streak = 0;
    for (let d = 1; d <= currentDay; d++) {
      const date = getDateForDay(startDate || today, d);
      const rec = records[date];
      total++;
      if (rec?.completions[task.id]) {
        completed++;
        streak++;
        if (streak > bestStreak) bestStreak = streak;
      } else {
        streak = 0;
      }
    }
    curStreak = getTaskStreak(task.id, records, startDate || today, currentDay);
    return { task, completed, total, rate: total > 0 ? Math.round((completed / total) * 100) : 0, bestStreak, curStreak };
  });

  // Daily completion counts for line graph
  const dailyCounts = Array.from({ length: 30 }, (_, i) => {
    const d = i + 1;
    if (d > currentDay) return null;
    const date = getDateForDay(startDate || today, d);
    const rec = records[date];
    if (!rec) return 0;
    return tasks.filter(t => rec.completions[t.id]).length;
  });

  // Line graph SVG
  const graphW = 300;
  const graphH = 100;
  const points = dailyCounts
    .map((v, i) => v !== null ? `${(i / 29) * graphW},${graphH - (v / 10) * graphH}` : null)
    .filter(Boolean);
  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

  // Best/worst day
  let bestDay = { day: 0, count: 0 };
  let worstDay = { day: 0, count: 10 };
  dailyCounts.forEach((count, i) => {
    if (count === null) return;
    if (count > bestDay.count) bestDay = { day: i + 1, count };
    if (count < worstDay.count) worstDay = { day: i + 1, count };
  });

  return (
    <div style={{ padding: '0 16px 100px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ marginBottom: 24 }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          Analytics
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', margin: 0 }}>
          Your <span className="gradient-text">Progress</span>
        </h1>
      </motion.div>

      {/* Overall rate */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card"
        style={{ padding: '24px', marginBottom: 16, textAlign: 'center' }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg, #9B59F5, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <AnimatedNumber value={overallRate} suffix="%" />
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 6 }}>Overall Completion Rate</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          {totalCompleted} of {totalPossible} possible task-days completed
        </div>
      </motion.div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Day', value: currentDay, suffix: '/30', color: '#9B59F5' },
          { label: 'Done Today', value: (() => { const r = records[today]; return r ? tasks.filter(t => r.completions[t.id]).length : 0; })(), suffix: '/10', color: '#10B981' },
          { label: 'Best Day', value: bestDay.day, suffix: bestDay.day ? ` (${bestDay.count}/10)` : '', color: '#F59E0B' },
          { label: 'Total Done', value: totalCompleted, suffix: '', color: '#06B6D4' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card"
            style={{ padding: '16px', textAlign: 'center' }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>
              <AnimatedNumber value={s.value} /><span style={{ fontSize: 14, opacity: 0.7 }}>{s.suffix}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Per-task bars */}
      <div ref={barsRef as any} style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Per-Task Completion</div>
        {taskStats.map((ts, i) => (
          <motion.div
            key={ts.task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 12 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: 'rgba(240,240,248,0.8)', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {i + 1}. {ts.task.name}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#9B59F5', marginLeft: 8, flexShrink: 0 }}>
                {ts.rate}%
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #4F46E5, #9B59F5)',
                  width: barsInView ? `${ts.rate}%` : '0%',
                  transition: `width 1s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.06}s`,
                  boxShadow: '0 0 8px rgba(124,58,237,0.5)',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                🔥 Best: {ts.bestStreak}d
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Current: {ts.curStreak}d
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Heat map */}
      <div ref={heatmapRef as any} style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>30-Day Heat Map</div>
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ minWidth: 320 }}>
            {/* Day headers */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 4, paddingLeft: 60 }}>
              {Array.from({ length: 30 }, (_, i) => (
                <div key={i} style={{ width: 14, fontSize: 8, color: 'var(--text-faint)', textAlign: 'center', flexShrink: 0 }}>
                  {i + 1}
                </div>
              ))}
            </div>
            {/* Task rows */}
            {tasks.map((task, ti) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                <div style={{ width: 56, fontSize: 10, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {task.name.slice(0, 8)}
                </div>
                {Array.from({ length: 30 }, (_, di) => {
                  const d = di + 1;
                  const date = getDateForDay(startDate || today, d);
                  const rec = records[date];
                  const done = rec?.completions[task.id];
                  const isPast = d <= currentDay;
                  let bg = 'var(--surface)';
                  if (isPast && done) bg = '#10B981';
                  else if (isPast && !done) bg = '#EF444466';

                  return (
                    <div
                      key={di}
                      className="heatmap-cell"
                      title={`Day ${d}: ${done ? 'Done' : isPast ? 'Missed' : 'Future'}`}
                      style={{
                        width: 14, height: 14, borderRadius: 3,
                        background: heatInView ? bg : 'var(--surface)',
                        transition: `background 0.4s ease ${(ti * 30 + di) * 5}ms`,
                        flexShrink: 0,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {[
            { color: '#10B981', label: 'Done' },
            { color: '#EF444466', label: 'Missed' },
            { color: 'var(--surface)', label: 'Future' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line graph */}
      <div ref={lineRef as any} style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Daily Completions</div>
        <div className="glass-card" style={{ padding: '16px', overflowX: 'auto' }}>
          <svg width="100%" viewBox={`0 0 ${graphW} ${graphH + 20}`} style={{ display: 'block', minWidth: 280 }}>
            {/* Grid lines */}
            {[0, 2, 4, 6, 8, 10].map(v => (
              <line
                key={v}
                x1={0} y1={graphH - (v / 10) * graphH}
                x2={graphW} y2={graphH - (v / 10) * graphH}
                stroke="rgba(255,255,255,0.05)" strokeWidth={1}
              />
            ))}
            {/* Y labels */}
            {[0, 5, 10].map(v => (
              <text key={v} x={-2} y={graphH - (v / 10) * graphH + 4} fontSize={8} fill="var(--text-dim)" textAnchor="end">
                {v}
              </text>
            ))}
            {/* Fill area */}
            {pathD && (
              <path
                d={`${pathD} L ${((dailyCounts.filter(v => v !== null).length - 1) / 29) * graphW},${graphH} L 0,${graphH} Z`}
                fill="url(#lineAreaGrad)"
                opacity={0.3}
              />
            )}
            {/* Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={lineInView ? 'draw-line' : ''}
                style={{ filter: 'drop-shadow(0 0 4px rgba(124,58,237,0.6))' }}
              />
            )}
            {/* Dots */}
            {dailyCounts.map((v, i) => v !== null && (
              <circle
                key={i}
                cx={(i / 29) * graphW}
                cy={graphH - (v / 10) * graphH}
                r={3}
                fill="#9B59F5"
                style={{ filter: 'drop-shadow(0 0 3px rgba(124,58,237,0.8))' }}
              />
            ))}
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="100%" stopColor="#9B59F5" />
              </linearGradient>
              <linearGradient id="lineAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Day 1</span>
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Day 30</span>
          </div>
        </div>
      </div>
    </div>
  );
}
