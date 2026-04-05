import type { Task } from './store';
import { MOTIVATIONAL_PHRASES } from './store';

// ── VAPID public key (injected at build time) ─────────────────────────────
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BNBbxmr-UxBxikcqRLrZXfNRvKmRuoi1R_gzTxgexnR3ExnqczILs4t17Nj3m0VmQosSlDvYtc9dgdP8pxYDcn8';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ── Service Worker registration ───────────────────────────────────────────

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register(
      `/sw.js?v=${__APP_VERSION__}`,
      { updateViaCache: 'none' }
    );
    reg.update().catch(() => {});

    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) {
          w.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    return reg;
  } catch (e) {
    console.warn('[SW] Registration failed:', e);
    return null;
  }
}

// ── Notification permission ───────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

// ── Web Push subscription ─────────────────────────────────────────────────

export async function subscribeToPush(
  tasks: Task[],
  startDate: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { ok: false, error: 'Push not supported on this browser' };
    }

    const reg = await navigator.serviceWorker.ready;

    // Check existing subscription first
    let sub = await reg.pushManager.getSubscription();

    // If no subscription or keys differ, create a new one
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
      });
    }

    // Save subscription + task schedule to server
    const res = await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: sub.toJSON(),
        tasks,
        startDate,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error || 'Server error' };
    }

    // Also tell the SW to run local alarm checks as backup
    scheduleLocalAlarms(tasks, startDate);

    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[push] subscribeToPush error:', msg);
    return { ok: false, error: msg };
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await fetch('/api/push-subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
  } catch (e) {
    console.warn('[push] unsubscribe error:', e);
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

// ── SW local alarm scheduler (backup — works in foreground) ──────────────

export function scheduleLocalAlarms(tasks: Task[], startDate: string): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_ALARMS',
      payload: { tasks, startDate },
    });
  }
}

// ── In-app alarm (fires when app is open, regardless of push) ────────────

let alarmInterval: ReturnType<typeof setInterval> | null = null;
const firedAlarms = new Set<string>(); // Track fired notifications to prevent duplicates

export function startInAppAlarm(
  tasks: Task[],
  startDate: string,
  onAlarm: (task: Task, dayNum: number) => void
): void {
  if (alarmInterval) clearInterval(alarmInterval);
  // Reset fired alarms on new day
  const todayKey = new Date().toDateString();
  firedAlarms.forEach(k => { if (!k.startsWith(todayKey)) firedAlarms.delete(k); });

  alarmInterval = setInterval(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const start = new Date(startDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayNum = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (dayNum > 30) return;
    const isDemo = dayNum < 1;
    const activeDay = isDemo ? 0 : dayNum;

    tasks.forEach((task, idx) => {
      const [h, m] = task.time.split(':').map(Number);
      const taskMinutes = h * 60 + m;
      const phrase = isDemo ? "Demo Alarm Active!" : MOTIVATIONAL_PHRASES[(activeDay - 1) % 30];
      const dayKey = now.toDateString();

      // Pre-reminder: 5 minutes before task time
      const preKey = `${dayKey}-pre-${task.id}`;
      if (nowMinutes === taskMinutes - 5 && !firedAlarms.has(preKey)) {
        firedAlarms.add(preKey);
        if (Notification.permission === 'granted') {
          try {
            new Notification(`⏰ Coming up in 5 min: ${task.name}`, {
              body: isDemo ? 'Demo Mode check' : `Day ${activeDay}/30 · Get ready!`,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: `lockin-pre-${task.id}-day-${activeDay}`,
              // @ts-ignore
              vibrate: [100, 50, 100],
              requireInteraction: false,
              silent: false,
            });
          } catch (e) {
            console.warn('[alarm] Pre-notification failed:', e);
          }
        }
      }

      // Main reminder: at exact task time
      const mainKey = `${dayKey}-main-${task.id}`;
      if (nowMinutes === taskMinutes && !firedAlarms.has(mainKey)) {
        firedAlarms.add(mainKey);
        onAlarm(task, dayNum);

        if (Notification.permission === 'granted') {
          try {
            new Notification(`🔒 Task ${idx + 1}/${tasks.length}: ${task.name}`, {
              body: isDemo ? 'Demo alarm working!' : `Day ${activeDay}/30 · ${phrase}`,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: `lockin-${task.id}-day-${activeDay}`,
              // @ts-ignore
              vibrate: [200, 100, 200, 100, 200],
              requireInteraction: true,
              silent: false,
            });
          } catch (e) {
            console.warn('[alarm] Notification failed:', e);
          }
        }
      }
    });
  }, 15000); // check every 15 seconds for better accuracy
}

export function stopInAppAlarm(): void {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

// ── Test notification (for settings screen) ───────────────────────────────

export async function sendTestNotification(): Promise<boolean> {
  if (Notification.permission !== 'granted') return false;
  
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('sw_timeout')), 1500))
      ]) as ServiceWorkerRegistration;
      
      await reg.showNotification('🔒 LockIn — Test', {
        body: 'Push notifications are working perfectly!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'lockin-test',
        // @ts-ignore
        vibrate: [200, 100, 200],
      });
      return true;
    } catch {}
  }

  // Fallback to desktop Notification API if SW hung or failed
  try {
    new Notification('🔒 LockIn', { body: 'Test works (Desktop Fallback)!' });
    return true;
  } catch {
    return false;
  }
}
