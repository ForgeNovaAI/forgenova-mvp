// api/admin-users.js
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
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (!supabaseAdmin || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Mock users for testing
    return res.status(200).json({
      ok: true,
      users: [
        {
          user_id: '1',
          full_name: 'Ann Anderson',
          company: 'Acme Corp',
          role: 'admin',
          status: 'active',
          created_at: '2024-02-15T00:00:00Z'
        },
        {
          user_id: '2',
          full_name: 'Mark Brown',
          company: 'Globex Corp.',
          role: 'user',
          status: 'inactive',
          created_at: '2024-01-20T00:00:00Z'
        },
        {
          user_id: '3',
          full_name: 'John Davis',
          company: 'Initech',
          role: 'user',
          status: 'active',
          created_at: '2024-04-05T00:00:00Z'
        }
      ]
    });
  }

  try {
    // Fetch users from Supabase
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, users: profiles || [] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};

