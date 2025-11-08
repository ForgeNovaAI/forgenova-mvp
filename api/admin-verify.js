// api/admin-verify.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

module.exports = async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'No token' });
  }

  // Check if it's a simple auth token (from admin-login)
  // For simple verification, we'll check Supabase
  
  if (!supabaseAdmin || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Fallback for testing
    return res.status(200).json({
      ok: true,
      isAdmin: true,
      user: { email: 'admin@forgenova.ai', name: 'Admin User', role: 'admin' }
    });
  }

  try {
    // Validate token with Supabase
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    
    if (userErr || !userData?.user) {
      return res.status(401).json({ ok: false, error: 'Invalid token' });
    }

    const user = userData.user;

    // Check if user has admin role in profiles
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('role,status,full_name,company,last_active_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (pErr) {
      return res.status(500).json({ ok: false, error: pErr.message });
    }

    const isAdmin = profile?.role === 'admin' && profile?.status === 'active';
    
    return res.status(200).json({
      ok: true,
      isAdmin,
      user: { email: user.email, name: profile?.full_name || user.email },
      profile
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};

