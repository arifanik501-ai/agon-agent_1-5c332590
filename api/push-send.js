import supabase from './_supabase.js';
import webpush from 'web-push';

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL   = 'mailto:admin@lockin.app';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

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

function pad(n) { return String(n).padStart(2, '0'); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Optional secret guard
  const secret = req.headers['x-cron-secret'];
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }

  try {
    // Get all subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*');
    if (error) throw error;
    if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 });

    const now = new Date();
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const currentTime = `${hh}:${mm}`;

    let sent = 0;
    const failed = [];

    for (const sub of subs) {
      const tasks = sub.tasks_json ?? [];
      const startDate = sub.start_date;
      if (!startDate || tasks.length === 0) continue;

      const start = new Date(startDate + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayNum = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
      if (dayNum < 1 || dayNum > 30) continue;

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if (task.time !== currentTime) continue;

        const phrase = PHRASES[(dayNum - 1) % 30];
        const payload = JSON.stringify({
          title: `🔒 Task ${i + 1}/${tasks.length}: ${task.name}`,
          body: `Day ${dayNum}/30 · ${phrase}`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `lockin-${task.id}-day-${dayNum}`,
          data: { url: '/', taskId: task.id, dayNum },
          vibrate: [200, 100, 200, 100, 200],
          requireInteraction: false,
          silent: false,
        });

        try {
          await webpush.sendNotification(sub.subscription_json, payload);
          sent++;
        } catch (e) {
          console.error('[push-send] Failed for', sub.endpoint?.slice(0, 40), e.statusCode);
          // Remove expired/invalid subscriptions (410 Gone)
          if (e.statusCode === 410 || e.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
          failed.push(sub.endpoint?.slice(0, 40));
        }
      }
    }

    return res.status(200).json({ sent, failed: failed.length, time: currentTime });
  } catch (err) {
    console.error('[push-send] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
