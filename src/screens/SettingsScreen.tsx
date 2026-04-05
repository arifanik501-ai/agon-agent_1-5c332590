import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Lock, Smartphone, RefreshCw, CloudCheck, AlertCircle, ChevronLeft, Zap } from 'lucide-react';
import type { AppState } from '../lib/store';
import { getDayNumber, formatTime12, pushToCloud, loadState } from '../lib/store';
import { requestNotificationPermission, sendTestNotification } from '../lib/notifications';

interface Props {
  state: AppState;
  onStateChange: (s: AppState) => void;
  onUnlock: () => void;
  onBack: () => void;
}

export default function SettingsScreen({ state, onStateChange, onUnlock, onBack }: Props) {
  const { tasks, locked, startDate, notificationPermission } = state;
  const currentDay = startDate ? Math.max(1, Math.min(30, getDayNumber(startDate))) : 1;
  const daysLeft = 30 - currentDay;
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

  async function handleNotificationRequest() {
    const perm = await requestNotificationPermission();
    onStateChange({ ...state, notificationPermission: perm });
  }

  async function handleSync() {
    if (syncState === 'syncing') return;
    setSyncState('syncing');
    const ok = await pushToCloud(loadState());
    setSyncState(ok ? 'done' : 'error');
    setTimeout(() => setSyncState('idle'), 3000);
  }

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 22,
    padding: '18px 20px',
    marginBottom: 12,
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -1px 1px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.25)',
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
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
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
        <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>
          Settings
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F0F0F8', margin: 0 }}>
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
              color: syncState === 'done' ? '#10B981' : syncState === 'error' ? '#EF4444' : '#F0F0F8',
              transition: 'color 0.3s ease',
            }}>
              {syncState === 'syncing' ? 'Syncing…'
                : syncState === 'done' ? 'Synced!'
                : syncState === 'error' ? 'Sync Failed'
                : 'Sync & Refresh'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.45)', marginTop: 2 }}>
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F8' }}>
              {locked ? 'Commitment Locked' : 'Not Locked'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.45)', marginTop: 2 }}>
              {locked ? `Day ${currentDay}/30 · ${daysLeft} days remaining` : 'Complete setup to lock'}
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
            background: notificationPermission === 'granted' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
            border: `1px solid ${notificationPermission === 'granted' ? 'rgba(16,185,129,0.28)' : 'rgba(245,158,11,0.28)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={20} color={notificationPermission === 'granted' ? '#10B981' : '#F59E0B'} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F8' }}>Push Notifications</div>
            <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.45)', marginTop: 2 }}>
              {notificationPermission === 'granted' ? 'Enabled — reminders active'
                : notificationPermission === 'denied' ? 'Denied in browser settings'
                : 'Not yet enabled'}
            </div>
          </div>
          {notificationPermission !== 'granted' && notificationPermission !== 'denied' && (
            <button
              onClick={async () => {
                try {
                  const perm = await requestNotificationPermission();
                  onStateChange({ ...state, notificationPermission: perm });
                  if (perm === 'denied') alert("Notifications blocked by browser. Please enable them in site settings.");
                } catch {
                  alert("Notifications failed. Ensure you are using HTTPS or have added the app to your Home Screen.");
                }
              }}
              style={{
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)',
                color: '#F59E0B', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Enable
            </button>
          )}
          {notificationPermission === 'granted' && (
            <button
              onClick={async () => {
                const ok = await sendTestNotification();
                if (!ok) alert("The browser blocked the test notification. You may need to add the app to your Home Screen or check 'Do Not Disturb' settings.");
              }}
              style={{
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)',
                color: '#10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Test
            </button>
          )}
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
            background: state.highFps ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${state.highFps ? 'rgba(6,182,212,0.28)' : 'rgba(255,255,255,0.1)'}`,
            boxShadow: state.highFps ? '0 0 16px rgba(6,182,212,0.15)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            <Zap size={20} color={state.highFps ? '#06B6D4' : '#6B7280'} strokeWidth={state.highFps ? 2.5 : 2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: state.highFps ? '#22D3EE' : '#F0F0F8', transition: 'color 0.3s ease' }}>120Hz Liquid Mode</div>
            <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.45)', marginTop: 2 }}>
              Maximize animation fluidity and GPU acceleration
            </div>
          </div>
          <button
            onClick={() => onStateChange({ ...state, highFps: !state.highFps })}
            style={{
              width: 50, height: 28, borderRadius: 16,
              background: state.highFps ? '#06B6D4' : 'rgba(255,255,255,0.1)',
              border: state.highFps ? '1px solid #22D3EE' : '1px solid rgba(255,255,255,0.2)',
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

      {/* ── Task list ── */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 12 }}
        >
          <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)', marginBottom: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F0F8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(240,240,248,0.4)' }}>{formatTime12(task.time)}</div>
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F8' }}>LockIn</div>
            <div style={{ fontSize: 12, color: 'rgba(240,240,248,0.4)', marginTop: 2 }}>30-Day Habit Commitment · v2.0</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
