// api/admin-reset-password.js
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
    return res.status(200).json({ ok: true, message: 'Mock: Password reset email sent' });
  }

  try {
    // Get user from auth.users
    const { data: authUser, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userErr || !authUser) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    // Send password reset email
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(authUser.user.email);

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, message: 'Password reset email sent' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};

