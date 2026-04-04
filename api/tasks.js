import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // GET /api/tasks?date=YYYY-MM-DD
    if (req.method === 'GET') {
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: 'date required' });

      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      if (error) throw error;
      return res.status(200).json(data || null);
    }

    // POST /api/tasks — create or upsert today's task list
    if (req.method === 'POST') {
      const { date, tasks } = req.body ?? {};
      if (!date || !Array.isArray(tasks)) return res.status(400).json({ error: 'date and tasks required' });

      const now = new Date().toISOString();

      // Check if row exists
      const { data: existing } = await supabase
        .from('daily_tasks')
        .select('id, locked')
        .eq('date', date)
        .maybeSingle();

      if (existing?.locked) {
        return res.status(403).json({ error: 'This day is locked and cannot be modified.' });
      }

      if (existing) {
        const { data, error } = await supabase
          .from('daily_tasks')
          .update({ tasks, updated_at: now })
          .eq('date', date)
          .select()
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      } else {
        const { data, error } = await supabase
          .from('daily_tasks')
          .insert({ date, tasks, locked: false })
          .select()
          .single();
        if (error) throw error;
        return res.status(201).json(data);
      }
    }

    // PUT /api/tasks — lock a past day
    if (req.method === 'PUT') {
      const { date } = req.body ?? {};
      if (!date) return res.status(400).json({ error: 'date required' });

      const { data, error } = await supabase
        .from('daily_tasks')
        .update({ locked: true, updated_at: new Date().toISOString() })
        .eq('date', date)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[tasks]', err);
    return res.status(500).json({ error: err.message });
  }
}
