// ═══════════════════════════════════════════════════════════════════════════
//  LockIn Service Worker — Push Notifications + Offline Cache
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'lockin-v6';

const PHRASES = [
  "You've got this! 💪", "One step at a time.", "Consistency is key.", "Keep the momentum!",
  "Champions show up daily.", "Your future self thanks you.", "Stay locked in.", "Progress, not perfection.",
  "Today counts.", "Build the life you want.", "Discipline = freedom.", "Small steps, big results.",
  "You promised yourself this.", "No excuses, just results.", "The grind never stops.",
  "Earn your rest.", "Be the person you're becoming.", "Commit to the process.", "Rise and repeat.",
  "Locked in. Leveled up.", "Show up for yourself.", "Trust the system.", "Every rep matters.",
  "This is who you are now.", "Habits shape destiny.", "Do it scared. Do it anyway.",
  "Your only competition is yesterday.", "The streak continues.", "Non-negotiable.", "Day by day."
];

// ── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for HTML/API, cache-first for assets ─────────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) return; // never intercept API

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (url.pathname.match(/\.(js|css)$/) && url.pathname.includes('/assets/')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => { cache.put(e.request, res.clone()); return res; });
        })
      )
    );
    return;
  }

  e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request)));
});

// ── Messages from app ─────────────────────────────────────────────────────
let _alarmSchedule = null; // { tasks, startDate }

self.addEventListener('message', (e) => {
  if (!e.data) return;

  if (e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (e.data.type === 'SCHEDULE_ALARMS') {
    _alarmSchedule = e.data.payload;
    console.log('[SW] Alarm schedule updated:', _alarmSchedule?.tasks?.length, 'tasks');
  }
});

// ── SW-side periodic alarm check (every 60 s via setInterval) ─────────────
// This fires even when the app tab is in background (but browser must be open).
// For true background delivery, use the push event from the server.
const firedSWAlarms = {}; // { 'dateKey-taskId': true }

setInterval(() => {
  if (!_alarmSchedule) return;
  const { tasks, startDate } = _alarmSchedule;
  if (!tasks || !startDate) return;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const dayKey = now.toDateString();

  const start = new Date(startDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayNum = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  if (dayNum < 1 || dayNum > 30) return;

  tasks.forEach((task, i) => {
    const [h, m] = task.time.split(':').map(Number);
    const taskMinutes = h * 60 + m;
    const phrase = PHRASES[(dayNum - 1) % 30];

    // Pre-reminder: 5 minutes before
    const preKey = `${dayKey}-pre-${task.id}`;
    if (nowMinutes === taskMinutes - 5 && !firedSWAlarms[preKey]) {
      firedSWAlarms[preKey] = true;
      self.registration.showNotification(`⏰ Coming up in 5 min: ${task.name}`, {
        body: `Day ${dayNum}/30 · Get ready!`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `lockin-pre-${task.id}-day-${dayNum}`,
        data: { url: '/', taskId: task.id, dayNum },
        vibrate: [100, 50, 100],
        requireInteraction: false,
        silent: false,
      }).catch(err => console.warn('[SW] pre-notification failed:', err));
    }

    // Main reminder: at exact task time
    const mainKey = `${dayKey}-main-${task.id}`;
    if (nowMinutes === taskMinutes && !firedSWAlarms[mainKey]) {
      firedSWAlarms[mainKey] = true;
      self.registration.showNotification(`🔒 Task ${i + 1}/${tasks.length}: ${task.name}`, {
        body: `Day ${dayNum}/30 · ${phrase}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `lockin-${task.id}-day-${dayNum}`,
        data: { url: '/', taskId: task.id, dayNum },
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        silent: false,
        actions: [
          { action: 'open',    title: '✓ Open App' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      }).catch(err => console.warn('[SW] showNotification failed:', err));
    }
  });
}, 30000); // every 30 seconds

// ── Push event (from server via web-push) ─────────────────────────────────
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch {}

  const title   = data.title  || '🔒 LockIn Reminder';
  const options = {
    body:              data.body   || 'Time to complete your habit!',
    icon:              data.icon   || '/icon-192.png',
    badge:             data.badge  || '/icon-192.png',
    tag:               data.tag    || 'lockin-push',
    data:              data.data   || { url: '/' },
    vibrate:           data.vibrate || [200, 100, 200, 100, 200],
    requireInteraction: false,
    silent:            false,
    actions: [
      { action: 'open',    title: '✓ Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click ────────────────────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'dismiss') return;

  const targetUrl = e.notification.data?.url || '/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ── Notification close ────────────────────────────────────────────────────
self.addEventListener('notificationclose', () => {
  // Analytics hook — no-op for now
});
