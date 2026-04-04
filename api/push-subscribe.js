import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { subscription, tasks, startDate } = req.body ?? {};
      if (!subscription?.endpoint) return res.status(400).json({ error: 'subscription required' });

      // Store subscription + task schedule in DB
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            endpoint: subscription.endpoint,
            subscription_json: subscription,
            tasks_json: tasks ?? [],
            start_date: startDate ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );

      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { endpoint } = req.body ?? {};
      if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      const { data } = await supabase.from('push_subscriptions').select('endpoint, updated_at').limit(100);
      return res.status(200).json({ count: data?.length ?? 0 });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[push-subscribe]', err);
    return res.status(500).json({ error: err.message });
  }
}
