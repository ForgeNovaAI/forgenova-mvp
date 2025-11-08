// api/admin-activate-user.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const { userId } = req.body;

  if (!supabaseAdmin || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({ ok: true, message: 'Mock: User activated' });
  }

  try {
    // Update user status in profiles
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ status: 'active' })
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, message: 'User activated' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};

