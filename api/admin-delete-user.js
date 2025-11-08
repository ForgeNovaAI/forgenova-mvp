// api/admin-delete-user.js
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
    return res.status(200).json({ ok: true, message: 'Mock: User deleted' });
  }

  try {
    // Delete user from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      return res.status(500).json({ ok: false, error: authError.message });
    }

    // Delete profile (should cascade automatically)
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    return res.status(200).json({ ok: true, message: 'User deleted' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};

