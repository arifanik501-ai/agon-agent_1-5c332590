import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  loadState, saveState, getDayNumber,
  scheduleCloudSync, pushToCloud, pullFromCloud, mergeStates,
  onSyncStatusChange, DEFAULT_STATE,
} from './lib/store';
import type { AppState, Task, SyncStatus } from './lib/store';
import { registerServiceWorker, requestNotificationPermission, startInAppAlarm, stopInAppAlarm, scheduleLocalAlarms } from './lib/notifications';
import LoginScreen from './screens/LoginScreen';

import AmbientBackground from './components/AmbientBackground';
import TabBar from './components/TabBar';
import SetupScreen from './screens/SetupScreen';
import DashboardScreen from './screens/DashboardScreen';
import StatsScreen from './screens/StatsScreen';
import SettingsScreen from './screens/SettingsScreen';
import CelebrationScreen from './screens/CelebrationScreen';
import LockAnimation from './components/LockAnimation';
import LockConfirmModal from './components/LockConfirmModal';
import UnlockModal from './components/UnlockModal';
import NotificationPrompt from './components/NotificationPrompt';
import InAppAlarm from './components/InAppAlarm';

type Tab = 'setup' | 'dashboard' | 'stats' | 'settings';
const START_DATE = '2026-04-06';

// ── Desktop blocker ──────────────────────────────────────────────────────────
function DesktopBlocker() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ maxWidth: 360, textAlign: 'center', padding: '48px 32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, backdropFilter: 'blur(20px)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 10px' }}>Mobile Only</h1>
        <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.6, margin: 0 }}>30 Days Goal is designed exclusively for mobile devices. Please open this app on your phone.</p>
        <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-faint)' }}>Optimized for 360–414px screens</div>
      </div>
    </div>
  );
}

// ── Sync pill — Centered Liquid Glass notification ───────────────────────────
function SyncPill({ status }: { status: SyncStatus }) {
  const map = {
    syncing: { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.35)', dot: '#A78BFA', text: '#C4B5FD', label: 'Saving…', glow: 'rgba(124,58,237,0.2)' },
    saved:   { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)', dot: '#10B981', text: '#34D399', label: 'Saved ✓', glow: 'rgba(16,185,129,0.15)' },
    error:   { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  dot: '#EF4444', text: '#F87171', label: 'Sync failed', glow: 'rgba(239,68,68,0.15)' },
    idle:    { bg: 'transparent', border: 'transparent', dot: 'transparent', text: 'transparent', label: '', glow: 'transparent' },
  };
  const c = map[status];
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.9 }}
      animate={{
        opacity: status !== 'idle' ? 1 : 0,
        y: status !== 'idle' ? 0 : -16,
        scale: status !== 'idle' ? 1 : 0.9,
      }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        left: 'calc(50% - 50px)',
        transform: 'translateX(-50%)',
        zIndex: 600,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 18px',
        borderRadius: 24,
        background: c.bg,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: `1px solid ${c.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.2), 0 0 20px ${c.glow}, inset 0 1px 1px rgba(255,255,255,0.1)`,
        pointerEvents: 'none', whiteSpace: 'nowrap',
      }}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: c.dot,
        boxShadow: `0 0 8px ${c.dot}66`,
        animation: status === 'syncing' ? 'pulseGlow 1.2s ease-in-out infinite' : undefined,
      }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: c.text, letterSpacing: '0.04em' }}>{c.label}</span>
    </motion.div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const s = loadState();
    s.visitCount = (s.visitCount || 0) + 1;
    saveState(s);
    return s;
  });

  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('lockin_auth') === '1');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(() => state.locked ? 'dashboard' : 'setup');
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showLockAnim, setShowLockAnim] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [alarm, setAlarm] = useState<{ task: Task; taskIndex: number; dayNum: number } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Bootstrap
  useEffect(() => {
    onSyncStatusChange(setSyncStatus);
    registerServiceWorker();
    const check = () => setIsDesktop(window.innerWidth >= 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Cloud pull on mount
  useEffect(() => {
    setSyncStatus('syncing');
    pullFromCloud()
      .then(cloudState => {
        setState(prev => {
          const merged = cloudState ? mergeStates(prev, cloudState) : prev;
          saveState(merged);
          pushToCloud(merged).then(ok => {
            setSyncStatus(ok ? 'saved' : 'error');
            if (ok) setTimeout(() => setSyncStatus('idle'), 2500);
          });
          return merged;
        });
        setCloudLoaded(true);
      })
      .catch(() => { setSyncStatus('error'); setCloudLoaded(true); });
  }, []);

  // Sync 120Hz mode preference to body class
  useEffect(() => {
    if (state.highFps) document.body.classList.add('high-fps-mode');
    else document.body.classList.remove('high-fps-mode');
  }, [state.highFps]);

  // Notification prompt
  useEffect(() => {
    if (cloudLoaded && state.notificationPermission === 'default' && state.visitCount <= 2) {
      const t = setTimeout(() => setShowNotifPrompt(true), 2000);
      return () => clearTimeout(t);
    }
  }, [cloudLoaded]);

  // In-app alarm
  useEffect(() => {
    if (state.locked && state.startDate && state.pushEnabled) {
      startInAppAlarm(state.tasks, state.startDate, (task, dayNum) => {
        setAlarm({ task, taskIndex: stateRef.current.tasks.indexOf(task), dayNum });
      });
      scheduleLocalAlarms(state.tasks, state.startDate);
    } else {
      stopInAppAlarm();
      scheduleLocalAlarms([], '');
    }
    return () => stopInAppAlarm();
  }, [state.locked, state.startDate, state.tasks, state.pushEnabled]);

  const updateState = useCallback((newState: AppState) => {
    setState(newState);
    saveState(newState);
    scheduleCloudSync(newState);
  }, []);

  function handleAuthenticated() {
    sessionStorage.setItem('lockin_auth', '1');
    setAuthenticated(true);
    setSyncStatus('syncing');
    pullFromCloud()
      .then(cloudState => {
        setState(prev => {
          const merged = cloudState ? mergeStates(prev, cloudState) : prev;
          saveState(merged);
          pushToCloud(merged).then(ok => {
            setSyncStatus(ok ? 'saved' : 'error');
            if (ok) setTimeout(() => setSyncStatus('idle'), 2500);
          });
          return merged;
        });
      })
      .catch(() => { pushToCloud(stateRef.current).then(ok => setSyncStatus(ok ? 'saved' : 'error')); });
  }

  function handleTasksChange(tasks: Task[]) { updateState({ ...stateRef.current, tasks }); }

  function handleLockConfirm() { setShowLockConfirm(false); setShowLockAnim(true); }

  async function handleLockAnimComplete() {
    setShowLockAnim(false);
    const ns: AppState = { ...stateRef.current, locked: true, lockDate: new Date().toISOString(), startDate: START_DATE };
    setState(ns); saveState(ns);
    setSyncStatus('syncing');
    const ok = await pushToCloud(ns);
    setSyncStatus(ok ? 'saved' : 'error');
    if (ok) setTimeout(() => setSyncStatus('idle'), 2500);
    setActiveTab('dashboard');
    if (stateRef.current.notificationPermission === 'default') setTimeout(() => setShowNotifPrompt(true), 600);
  }

  function handleUnlock() {
    setShowUnlock(false);
    updateState({ ...stateRef.current, locked: false, lockDate: null, startDate: null, records: {} });
    setActiveTab('setup');
  }

  function handleNewCycle() {
    updateState({ ...DEFAULT_STATE, visitCount: stateRef.current.visitCount, notificationPermission: stateRef.current.notificationPermission });
    setActiveTab('dashboard');
  }

  async function handleNotifAllow() {
    setShowNotifPrompt(false);
    const perm = await requestNotificationPermission();
    updateState({ ...stateRef.current, notificationPermission: perm });
  }

  function handleNotifDeny() { setShowNotifPrompt(false); updateState({ ...stateRef.current, notificationPermission: 'denied' }); }

  async function handleManualSync() {
    setSyncStatus('syncing');
    const ok = await pushToCloud(stateRef.current);
    setSyncStatus(ok ? 'saved' : 'error');
    if (ok) setTimeout(() => setSyncStatus('idle'), 2500);
  }

  const cycleComplete = state.locked && state.startDate && getDayNumber(state.startDate) > 30;

  if (isDesktop) return <DesktopBlocker />;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <AmbientBackground />
      <SyncPill status={syncStatus} />

      {/* Login — shown first, goes straight to dashboard on correct PIN */}
      <AnimatePresence>
        {!authenticated && (
          <motion.div
            key="login"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'fixed', inset: 0, zIndex: 200 }}
          >
            <AmbientBackground />
            <LoginScreen onAuthenticated={handleAuthenticated} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100dvh' }}>
        <AnimatePresence>
          {showLockAnim && <LockAnimation onComplete={handleLockAnimComplete} />}
        </AnimatePresence>

        {cycleComplete ? (
          <CelebrationScreen state={state} onNewCycle={handleNewCycle} />
        ) : activeTab === 'setup' ? (
          <div style={{ overflowY: 'auto', height: '100dvh' }} className="scroll-content">
            <SetupScreen 
              tasks={state.tasks} 
              onTasksChange={handleTasksChange} 
              onLock={() => setShowLockConfirm(true)} 
              onManualSync={handleManualSync} 
              onLogout={() => setActiveTab('dashboard')}
            />
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: activeTab === 'dashboard' ? -20 : activeTab === 'stats' ? 20 : 0, y: activeTab === 'settings' ? 16 : 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflowY: 'auto', height: '100dvh' }}
                className="scroll-content"
              >
                {activeTab === 'dashboard' && <DashboardScreen state={state} onStateChange={updateState} onUnlock={() => setShowUnlock(true)} />}
                {activeTab === 'stats' && <StatsScreen state={state} />}
                {activeTab === 'settings' && <SettingsScreen state={state} onStateChange={updateState} onUnlock={() => setShowUnlock(true)} onBack={() => setActiveTab('dashboard')} />}
              </motion.div>
            </AnimatePresence>
            <TabBar active={activeTab} onChange={setActiveTab} />
          </>
        )}
      </div>

      <AnimatePresence>
        {showLockConfirm && <LockConfirmModal taskCount={stateRef.current.tasks.length} onConfirm={handleLockConfirm} onCancel={() => setShowLockConfirm(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showUnlock && <UnlockModal onUnlock={handleUnlock} onClose={() => setShowUnlock(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showNotifPrompt && <NotificationPrompt onAllow={handleNotifAllow} onDeny={handleNotifDeny} />}
      </AnimatePresence>
      <AnimatePresence>
        {alarm && <InAppAlarm task={alarm.task} taskIndex={alarm.taskIndex} dayNum={alarm.dayNum} onDismiss={() => setAlarm(null)} />}
      </AnimatePresence>
    </div>
  );
}
