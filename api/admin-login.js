// api/admin-login.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYmZhZGxpend3b255bXFkY2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzU4OTUsImV4cCI6MjA3MzYxMTg5NX0.sQNGjFdC-WM0nSdGucgx3DelUJ5KJXh6S8J54xWUEu0'
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    // Check if user is admin
    if (supabaseAdmin && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: profile, error: pErr } = await supabaseAdmin
        .from('profiles')
        .select('role,status,full_name')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (pErr || !profile || profile.role !== 'admin' || profile.status !== 'active') {
        return res.status(403).json({ ok: false, error: 'Access denied. Admin privileges required.' });
      }
    }

    // Return the Supabase session token
    return res.status(200).json({
      ok: true,
      token: data.session.access_token,
      user: {
        email: data.user.email,
        name: data.user.user_metadata?.full_name || 'Admin User',
        role: 'admin'
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Login failed' });
  }
};

