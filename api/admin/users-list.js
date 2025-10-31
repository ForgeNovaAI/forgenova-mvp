const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function isAdmin(token) {
  const { data: u } = await supabaseAdmin.auth.getUser(token);
  const uid = u?.user?.id;
  if (!uid) return false;
  const { data: p } = await supabaseAdmin.from('profiles')
    .select('role,status').eq('user_id', uid).maybeSingle();
  return p?.role === 'admin' && p?.status === 'active';
}

module.exports = async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ ok:false, error:'No token' });
  if (!(await isAdmin(token))) return res.status(403).json({ ok:false, error:'Forbidden' });

  const url = new URL(req.url, 'http://x');
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const per  = Math.min(parseInt(url.searchParams.get('per')  || '100', 10), 200);

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: per });
  if (error) return res.status(500).json({ ok:false, error:error.message });

  const users = (data?.users || []).map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    provider: u.app_metadata?.provider || null
  }));

  res.status(200).json({ ok:true, page, per, count: users.length, users });
};
