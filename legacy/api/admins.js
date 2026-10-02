// Secure admin-management endpoint (Vercel serverless function).
// Only a logged-in SUPER ADMIN can call it. It uses the service role key,
// which lives ONLY in Vercel environment variables, never in the browser.
const { createClient } = require('@supabase/supabase-js');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Server is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel, then redeploy.' });
  }

  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  // 1. Who is calling?
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Not signed in.' });
  const { data: authData, error: authErr } = await db.auth.getUser(token);
  if (authErr || !authData || !authData.user) return res.status(401).json({ error: 'Session expired. Sign in again.' });
  const caller = authData.user;

  // 2. Are they a Super Admin?
  const { data: me } = await db.from('profiles').select('role').eq('id', caller.id).maybeSingle();
  if (!me || me.role !== 'super_admin') return res.status(403).json({ error: 'Only the Super Admin can manage admins.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  try {
    if (body.action === 'create') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const fullName = String(body.full_name || '').trim().slice(0, 120);
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

      const { data: created, error: cErr } = await db.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: fullName }
      });
      if (cErr) return res.status(400).json({ error: cErr.message });

      const { error: pErr } = await db.from('profiles').insert({
        id: created.user.id, email, full_name: fullName || null, role: 'admin'
      });
      if (pErr) {
        await db.auth.admin.deleteUser(created.user.id);
        return res.status(500).json({ error: pErr.message });
      }
      return res.status(200).json({ ok: true });
    }

    if (body.action === 'remove' || body.action === 'reset_password') {
      const id = String(body.id || '');
      if (!id) return res.status(400).json({ error: 'Missing admin id.' });
      const { data: target } = await db.from('profiles').select('id, role').eq('id', id).maybeSingle();
      if (!target) return res.status(404).json({ error: 'Admin not found.' });
      if (target.role === 'super_admin') return res.status(400).json({ error: 'The Super Admin account cannot be changed here.' });

      if (body.action === 'remove') {
        const { error } = await db.auth.admin.deleteUser(id);
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ ok: true });
      }

      const password = String(body.password || '');
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      const { error } = await db.auth.admin.updateUserById(id, { password });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
};
