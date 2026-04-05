import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Lock, Smartphone, RefreshCw, CloudCheck, AlertCircle, ChevronLeft, Zap, Sun, Moon } from 'lucide-react';
import type { AppState } from '../lib/store';
import { getDayNumber, formatTime12, pushToCloud, loadState } from '../lib/store';
import { requestNotificationPermission, sendTestNotification } from '../lib/notifications';
import ThemeSwitch from '../components/ThemeSwitch';

interface Props {
  state: AppState;
  onStateChange: (s: AppState) => void;
  onUnlock: () => void;
  onBack: () => void;
}

export default function SettingsScreen({ state, onStateChange, onUnlock, onBack }: Props) {
  const { tasks, locked, startDate, notificationPermission } = state;
  const rawDayNum = startDate ? getDayNumber(startDate) : 1;
  const isDemo = rawDayNum < 1;
  const currentDay = isDemo ? 0 : Math.min(30, rawDayNum);
  const daysLeft = 30 - currentDay;
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

  async function handleSync() {
    if (syncState === 'syncing') return;
    setSyncState('syncing');
    const ok = await pushToCloud(loadState());
    setSyncState(ok ? 'done' : 'error');
    setTimeout(() => setSyncState('idle'), 3000);
  }

  const card: React.CSSProperties = {
    background: 'var(--surface-glass)',
    backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
    WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--glass-radius)',
    padding: '18px 20px',
    marginBottom: 12,
    boxShadow: 'var(--glass-inner-shadow), var(--card-shadow)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  return (
    <div style={{ padding: '0 20px 100px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ marginBottom: 28 }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px 6px 6px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            color: 'var(--text-sub)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 16,
            transition: 'all 0.2s',
          }}
        >
          <ChevronLeft size={16} /> Dashboard
        </button>
        <div style={{ fontSize: 11, color: 'var(--text-sub)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>
          Settings
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', margin: 0 }}>
          App <span className="gradient-text">Config</span>
        </h1>
      </motion.div>

      {/* ── Manual Sync / Refresh ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.03, ease: [0.22, 1, 0.36, 1] }}
        style={{
          ...card,
          background: syncState === 'done'
            ? 'rgba(16,185,129,0.07)'
            : syncState === 'error'
            ? 'rgba(239,68,68,0.06)'
            : 'rgba(124,58,237,0.06)',
          border: `1px solid ${
            syncState === 'done' ? 'rgba(16,185,129,0.28)'
            : syncState === 'error' ? 'rgba(239,68,68,0.25)'
            : syncState === 'syncing' ? 'rgba(124,58,237,0.45)'
            : 'rgba(124,58,237,0.18)'
          }`,
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: syncState === 'done' ? 'rgba(16,185,129,0.15)'
              : syncState === 'error' ? 'rgba(239,68,68,0.12)'
              : 'rgba(124,58,237,0.15)',
            border: `1px solid ${syncState === 'done' ? 'rgba(16,185,129,0.3)' : syncState === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(124,58,237,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              display: 'flex',
              color: syncState === 'done' ? '#10B981' : syncState === 'error' ? '#EF4444' : '#9B59F5',
              animation: syncState === 'syncing' ? 'spinOnce 0.9s linear infinite' : undefined,
            }}>
              {syncState === 'done'
                ? <CloudCheck size={20} />
                : syncState === 'error'
                ? <AlertCircle size={20} />
                : <RefreshCw size={20} />}
            </span>
          </div>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 15, fontWeight: 700,
              color: syncState === 'done' ? '#10B981' : syncState === 'error' ? '#EF4444' : 'var(--text)',
              transition: 'color 0.3s ease',
            }}>
              {syncState === 'syncing' ? 'Syncing…'
                : syncState === 'done' ? 'Synced!'
                : syncState === 'error' ? 'Sync Failed'
                : 'Sync & Refresh'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              {syncState === 'done' ? 'All data saved to cloud'
                : syncState === 'error' ? 'Check connection and retry'
                : 'Pull latest data from cloud & push local changes'}
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleSync}
            disabled={syncState === 'syncing'}
            style={{
              padding: '8px 16px', borderRadius: 11,
              background: syncState === 'done' ? 'rgba(16,185,129,0.15)'
                : syncState === 'error' ? 'rgba(239,68,68,0.12)'
                : 'rgba(124,58,237,0.18)',
              border: `1px solid ${syncState === 'done' ? 'rgba(16,185,129,0.3)' : syncState === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(124,58,237,0.35)'}`,
              color: syncState === 'done' ? '#10B981' : syncState === 'error' ? '#EF4444' : '#9B59F5',
              fontSize: 13, fontWeight: 700, cursor: syncState === 'syncing' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: syncState === 'syncing' ? 0.6 : 1,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ animation: syncState === 'syncing' ? 'spinOnce 0.9s linear infinite' : undefined, display: 'flex' }}>
              <RefreshCw size={14} />
            </span>
            {syncState === 'syncing' ? 'Syncing…' : syncState === 'done' ? 'Done' : syncState === 'error' ? 'Retry' : 'Sync'}
          </button>
        </div>
      </motion.div>

      {/* ── Goal Start Date ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        style={card}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(245,158,11,0.1)',
          }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Goal Start Date</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              {locked ? 'Locked — change requires unlock' : 'Set when your 30-day challenge begins'}
            </div>
          </div>
        </div>

        {(() => {
          const sd = state.customStartDate || '2026-04-06';
          const [y, m, d] = sd.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });

          const updateDate = (newY: number, newM: number, newD: number) => {
            const maxDay = new Date(newY, newM, 0).getDate();
            const safeD = Math.min(newD, maxDay);
            const val = `${newY}-${String(newM).padStart(2, '0')}-${String(safeD).padStart(2, '0')}`;
            const ns = { ...state, customStartDate: val };
            if (locked && state.startDate) ns.startDate = val;
            onStateChange(ns);
          };

          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

          const selectStyle: React.CSSProperties = {
            appearance: 'none' as const,
            background: 'var(--input-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid var(--input-border)',
            borderRadius: 14,
            color: 'var(--text)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 15,
            textAlign: 'center' as const,
            padding: '12px 8px',
            cursor: locked ? 'not-allowed' : 'pointer',
            outline: 'none',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            opacity: locked ? 0.5 : 1,
          };

          return (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px 16px', marginBottom: 14,
                borderRadius: 14,
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--amber)', letterSpacing: '0.01em' }}>
                  📅 {formatted}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Day */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Day</span>
                  <select
                    value={d}
                    disabled={locked}
                    onChange={e => updateDate(y, m, Number(e.target.value))}
                    style={{ ...selectStyle, width: '100%' }}
                  >
                    {Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>

                <span style={{ fontSize: 22, fontWeight: 300, color: 'var(--text-faint)', marginTop: 16 }}>/</span>

                {/* Month */}
                <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Month</span>
                  <select
                    value={m}
                    disabled={locked}
                    onChange={e => updateDate(y, Number(e.target.value), d)}
                    style={{ ...selectStyle, width: '100%' }}
                  >
                    {months.map((mn, i) => (
                      <option key={i + 1} value={i + 1}>{mn}</option>
                    ))}
                  </select>
                </div>

                <span style={{ fontSize: 22, fontWeight: 300, color: 'var(--text-faint)', marginTop: 16 }}>/</span>

                {/* Year */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Year</span>
                  <select
                    value={y}
                    disabled={locked}
                    onChange={e => updateDate(Number(e.target.value), m, d)}
                    style={{ ...selectStyle, width: '100%' }}
                  >
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          );
        })()}
      </motion.div>

      {/* ── Lock status ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        style={card}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: locked ? 'rgba(124,58,237,0.12)' : 'rgba(16,185,129,0.12)',
            border: `1px solid ${locked ? 'rgba(124,58,237,0.28)' : 'rgba(16,185,129,0.28)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={20} color={locked ? '#9B59F5' : '#10B981'} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              {locked ? 'Commitment Locked' : 'Not Locked'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              {locked ? isDemo ? 'Demo Mode Active · Challenge starts soon' : `Day ${currentDay}/30 · ${daysLeft} days remaining` : 'Complete setup to lock'}
            </div>
          </div>
          {locked && (
            <button
              onClick={onUnlock}
              style={{
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
                color: '#9B59F5', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Unlock
            </button>
          )}
        </div>
      </motion.div>
      
      {/* ── Notifications ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.13, ease: [0.22, 1, 0.36, 1] }}
        style={card}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: state.pushEnabled ? 'rgba(16,185,129,0.12)' : 'var(--surface)',
            border: `1px solid ${state.pushEnabled ? 'rgba(16,185,129,0.28)' : 'var(--border)'}`,
            boxShadow: state.pushEnabled ? '0 0 16px rgba(16,185,129,0.15)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            <Bell size={20} color={state.pushEnabled ? '#10B981' : '#6B7280'} strokeWidth={state.pushEnabled ? 2.5 : 2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: state.pushEnabled ? '#34D399' : 'var(--text)', transition: 'color 0.3s ease', display: 'flex', alignItems: 'center' }}>
              Push Notifications
              {state.pushEnabled && (
                <span onClick={async (e) => { e.stopPropagation(); await sendTestNotification(); }} 
                      style={{ marginLeft: 8, fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 7px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(16,185,129,0.25)', letterSpacing: '0.04em' }}>
                  TEST
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              {state.pushEnabled ? 'Enabled — reminders active' : (notificationPermission === 'denied' || ('Notification' in window && Notification.permission === 'denied')) ? 'Denied in device browser settings' : 'Background reminders disabled'}
            </div>
          </div>
          <button
            onClick={async () => {
              if (state.pushEnabled) {
                // Turn OFF
                onStateChange({ ...state, pushEnabled: false });
              } else {
                // Turn ON
                const sysPerm = 'Notification' in window ? Notification.permission : 'denied';
                if (notificationPermission !== 'granted' || sysPerm !== 'granted') {
                  try {
                    const perm = await requestNotificationPermission();
                    if (perm === 'granted') {
                      onStateChange({ ...state, notificationPermission: perm, pushEnabled: true });
                    } else if (perm === 'denied') {
                      onStateChange({ ...state, notificationPermission: perm, pushEnabled: false });
                      alert("Notifications blocked! Please enable them manually in your device's browser site settings.");
                    }
                  } catch {
                    alert("Notifications failed. Ensure you are using HTTPS or have added the app to your Home Screen.");
                  }
                } else {
                  onStateChange({ ...state, pushEnabled: true });
                }
              }
            }}
            style={{
              width: 50, height: 28, borderRadius: 16,
              background: state.pushEnabled ? '#10B981' : 'var(--border)',
              border: state.pushEnabled ? '1px solid #34D399' : '1px solid var(--border-hi)',
              position: 'relative', cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: state.pushEnabled ? '0 0 12px rgba(16,185,129,0.4)' : 'inset 0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: '#FFF',
              position: 'absolute', top: 2, left: state.pushEnabled ? 24 : 2,
              transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </motion.div>
      {/* ── 120Hz Liquid Mode ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        style={card}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: state.highFps ? 'rgba(6,182,212,0.12)' : 'var(--surface)',
            border: `1px solid ${state.highFps ? 'rgba(6,182,212,0.28)' : 'var(--border)'}`,
            boxShadow: state.highFps ? '0 0 16px rgba(6,182,212,0.15)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            <Zap size={20} color={state.highFps ? '#06B6D4' : '#6B7280'} strokeWidth={state.highFps ? 2.5 : 2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: state.highFps ? '#22D3EE' : 'var(--text)', transition: 'color 0.3s ease' }}>120Hz Liquid Mode</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              Maximize animation fluidity and GPU acceleration
            </div>
          </div>
          <button
            onClick={() => onStateChange({ ...state, highFps: !state.highFps })}
            style={{
              width: 50, height: 28, borderRadius: 16,
              background: state.highFps ? '#06B6D4' : 'var(--border)',
              border: state.highFps ? '1px solid #22D3EE' : '1px solid var(--border-hi)',
              position: 'relative', cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: state.highFps ? '0 0 12px rgba(6,182,212,0.4)' : 'inset 0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: '#FFF',
              position: 'absolute', top: 2, left: state.highFps ? 24 : 2,
              transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </motion.div>

      {/* ── Theme Mode ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.19, ease: [0.22, 1, 0.36, 1] }}
        style={card}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: state.lightMode ? 'rgba(56,189,248,0.12)' : 'var(--surface)',
            border: `1px solid ${state.lightMode ? 'rgba(56,189,248,0.28)' : 'var(--border)'}`,
            boxShadow: state.lightMode ? '0 0 16px rgba(56,189,248,0.15)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            {state.lightMode ? (
              <Sun size={20} color="#0EA5E9" strokeWidth={2.5} />
            ) : (
              <Moon size={20} color="var(--text)" strokeWidth={2} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: state.lightMode ? '#0284C7' : 'var(--text)', transition: 'color 0.3s ease' }}>
              Theme
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              {state.lightMode ? 'Light Mode — Daylight' : 'Dark Mode — Deep Space'}
            </div>
          </div>
          <ThemeSwitch
            isLight={!!state.lightMode}
            onToggle={() => onStateChange({ ...state, lightMode: !state.lightMode })}
          />
        </div>
      </motion.div>

      {/* ── Task list ── */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 12 }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {locked ? 'Locked Tasks' : 'Your Tasks'} ({tasks.length})
          </div>
          {tasks.map((task, i) => (
            <div
              key={task.id}
              style={{
                ...card,
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 8,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#9B59F5',
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{formatTime12(task.time)}</div>
              </div>
              {locked && <Lock size={13} color="rgba(240,240,248,0.2)" />}
            </div>
          ))}
        </motion.div>
      )}

      {/* ── About ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        style={card}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Smartphone size={20} color="#9B59F5" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>30 Days Goal</div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>30-Day Habit Commitment · v2.0</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
