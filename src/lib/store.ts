// LockIn — CLOUD-ONLY store. No localStorage. All state lives in Supabase.
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, get } from "firebase/database";

export interface Task {
  id: string;
  name: string;
  time: string; // "HH:MM" 24h
  description: string;
}

export interface DayRecord {
  date: string;
  completions: Record<string, boolean>;
  missed: Record<string, boolean>;
}

export interface AppState {
  tasks: Task[];
  locked: boolean;
  lockDate: string | null;
  startDate: string | null;
  records: Record<string, DayRecord>;
  notificationPermission: 'default' | 'granted' | 'denied';
  pushEnabled?: boolean;
  visitCount: number;
  highFps?: boolean;
  lightMode?: boolean;
  customStartDate?: string;
}

export const DEFAULT_STATE: AppState = {
  tasks: [],
  locked: false,
  lockDate: null,
  startDate: null,
  records: {},
  notificationPermission: 'default',
  pushEnabled: false,
  visitCount: 0,
  highFps: false,
  lightMode: false,
  customStartDate: '2026-04-06',
};

// ── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = 'lockin_state_v2';

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT_STATE }; }
}

export function saveState(state: AppState): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

/** Smart merge: cloud wins for tasks/records/lock; local wins for device prefs */
export function mergeStates(local: AppState, cloud: AppState): AppState {
  const tasks = cloud.tasks.length >= local.tasks.length ? cloud.tasks : local.tasks;
  const locked = cloud.locked || local.locked;
  const lockDate = cloud.lockDate ?? local.lockDate;
  const startDate = cloud.startDate ?? local.startDate;
  const records: AppState['records'] = { ...local.records };
  for (const [date, rec] of Object.entries(cloud.records)) {
    records[date] = records[date]
      ? { date, completions: { ...records[date].completions, ...rec.completions }, missed: { ...records[date].missed, ...rec.missed } }
      : rec;
  }
  return {
    tasks, locked, lockDate, startDate, records,
    notificationPermission: local.notificationPermission !== 'default' ? local.notificationPermission : cloud.notificationPermission,
    pushEnabled: local.pushEnabled ?? cloud.pushEnabled,
    visitCount: Math.max(local.visitCount ?? 0, cloud.visitCount ?? 0),
    highFps: local.highFps ?? cloud.highFps,
    lightMode: local.lightMode ?? cloud.lightMode,
    customStartDate: cloud.customStartDate ?? local.customStartDate ?? '2026-04-06',
  };
}

// ── Sync status ──────────────────────────────────────────────────────────────
export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error';

let _statusCb: ((s: SyncStatus) => void) | null = null;
export function onSyncStatusChange(cb: (s: SyncStatus) => void) { _statusCb = cb; }
function emit(s: SyncStatus) { _statusCb?.(s); }


// Firebase App setup for instantaneous sync
const firebaseConfig = {
  apiKey: "AIzaSyBcjbR7Qu7M-RnHUtLJ9zeehILqQHYLw4E",
  authDomain: "whatsapp-c10ef.firebaseapp.com",
  databaseURL: "https://whatsapp-c10ef-default-rtdb.firebaseio.com",
  projectId: "whatsapp-c10ef",
  storageBucket: "whatsapp-c10ef.firebasestorage.app",
  messagingSenderId: "675053106773",
  appId: "1:675053106773:web:b7078468691a07ecfec6dc",
  measurementId: "G-89Z8WBJ3R0"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const database = getDatabase(app);

// Debounce handle — always holds latest state ref
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _pending: AppState | null = null;

const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes

/** Batched cloud push — syncs every 30 minutes */
export function scheduleCloudSync(state: AppState): void {
  _pending = state;
  // Don't start a new timer if one is already running
  if (_syncTimer) return;
  _syncTimer = setTimeout(async () => {
    const toSave = _pending!;
    _pending = null;
    _syncTimer = null;
    emit('syncing');
    const ok = await pushToCloud(toSave);
    emit(ok ? 'saved' : 'error');
    if (ok) setTimeout(() => emit('idle'), 2500);
  }, SYNC_INTERVAL);
}

/** Immediate push (no debounce) */
export async function pushToCloud(state: AppState): Promise<boolean> {
  try {
    await set(ref(database, 'state'), state);
    return true;
  } catch (error) {
    console.error("Firebase push failed:", error);
    return false;
  }
}

/** Pull latest state from cloud */
export async function pullFromCloud(): Promise<AppState | null> {
  try {
    const snapshot = await get(ref(database, 'state'));
    if (!snapshot.exists()) return null;
    const s = snapshot.val() as AppState;
    if (!s || typeof s !== 'object' || !Array.isArray(s.tasks)) return null;
    return { ...DEFAULT_STATE, ...s };
  } catch (error) {
    console.error("Firebase pull failed:", error);
    return null;
  }
}

// ── Date / time helpers ───────────────────────────────────────────────────────

export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDayNumber(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function getDateForDay(startDate: string, dayNum: number): string {
  const start = new Date(startDate + 'T00:00:00');
  start.setDate(start.getDate() + dayNum - 1);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
}

export function isTaskAvailable(taskTime: string): 'available' | 'upcoming' | 'missed' | 'future' {
  const now = new Date();
  const [h, m] = taskTime.split(':').map(Number);
  const taskDate = new Date();
  taskDate.setHours(h, m, 0, 0);
  const windowStart = new Date(taskDate.getTime() - 30 * 60 * 1000);
  // Available from 30min before scheduled time until end of day
  if (now < windowStart) return 'upcoming';
  return 'available';
}

export function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function getTaskStreak(taskId: string, records: Record<string, DayRecord>, startDate: string, currentDay: number): number {
  let streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    const rec = records[getDateForDay(startDate, d)];
    if (rec?.completions[taskId]) streak++;
    else break;
  }
  return streak;
}

export function getOverallStreak(records: Record<string, DayRecord>, tasks: Task[], startDate: string, currentDay: number): number {
  let streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    const rec = records[getDateForDay(startDate, d)];
    if (rec && tasks.every(t => rec.completions[t.id])) streak++;
    else break;
  }
  return streak;
}

export function getTotalCompletions(records: Record<string, DayRecord>): number {
  let total = 0;
  for (const rec of Object.values(records))
    total += Object.values(rec.completions).filter(Boolean).length;
  return total;
}

export function getDayStatus(date: string, tasks: Task[], records: Record<string, DayRecord>): 'complete' | 'partial' | 'missed' | 'future' | 'today' {
  const today = getTodayString();
  if (date > today) return 'future';
  const rec = records[date];
  if (!rec) return date < today ? 'missed' : 'today';
  const done = tasks.filter(t => rec.completions[t.id]).length;
  if (date === today) return done === tasks.length ? 'complete' : 'today';
  if (done === tasks.length) return 'complete';
  if (done > 0) return 'partial';
  return 'missed';
}

export const MOTIVATIONAL_PHRASES = [
  "You've got this! 💪", "One step at a time.", "Consistency is key.", "Keep the momentum!",
  "Champions show up daily.", "Your future self thanks you.", "Stay locked in.", "Progress, not perfection.",
  "Today counts.", "Build the life you want.", "Discipline = freedom.", "Small steps, big results.",
  "You promised yourself this.", "No excuses, just results.", "The grind never stops.",
  "Earn your rest.", "Be the person you're becoming.", "Commit to the process.", "Rise and repeat.",
  "Locked in. Leveled up.", "Show up for yourself.", "Trust the system.", "Every rep matters.",
  "This is who you are now.", "Habits shape destiny.", "Do it scared. Do it anyway.",
  "Your only competition is yesterday.", "The streak continues.", "Non-negotiable.", "Day by day.",
];
