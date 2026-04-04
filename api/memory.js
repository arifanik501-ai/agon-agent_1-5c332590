import supabase from './_supabase.js';

const SESSION_KEY = 'lockin_default';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // ── GET: return current cloud state ──────────────────────────────────────
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('lockin_memory')
        .select('state_json, updated_at')
        .eq('session_key', SESSION_KEY)
        .maybeSingle();

      if (error) {
        console.error('[memory GET] supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      // No row yet — return empty
      if (!data) return res.status(200).json({ state: null, updated_at: null });

      return res.status(200).json({ state: data.state_json, updated_at: data.updated_at });
    }

    // ── POST: save / overwrite cloud state ───────────────────────────────────
    if (req.method === 'POST') {
      const body = req.body ?? {};
      const { state } = body;

      if (!state || typeof state !== 'object') {
        return res.status(400).json({ error: 'body.state must be an object' });
      }

      const now = new Date().toISOString();

      // Try UPDATE first (row already exists)
      const { data: updated, error: updateErr } = await supabase
        .from('lockin_memory')
        .update({ state_json: state, updated_at: now })
        .eq('session_key', SESSION_KEY)
        .select('id, updated_at')
        .maybeSingle();

      if (updateErr) {
        console.error('[memory POST update] supabase error:', updateErr);
        return res.status(500).json({ error: updateErr.message });
      }

      // Row existed → done
      if (updated) {
        return res.status(200).json({ ok: true, updated_at: updated.updated_at });
      }

      // Row didn't exist → INSERT
      const { data: inserted, error: insertErr } = await supabase
        .from('lockin_memory')
        .insert({ session_key: SESSION_KEY, state_json: state, updated_at: now })
        .select('id, updated_at')
        .single();

      if (insertErr) {
        console.error('[memory POST insert] supabase error:', insertErr);
        return res.status(500).json({ error: insertErr.message });
      }

      return res.status(201).json({ ok: true, updated_at: inserted.updated_at });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[memory] Unhandled error:', err);
    return res.status(500).json({ error: String(err.message ?? err) });
  }
}
