// api/admin-templates.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function verifyAdmin(token) {
  if (!token) return { ok: false, error: 'No token provided' };
  
  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return { ok: false, error: 'Invalid token' };
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return { ok: false, error: 'Profile not found' };
    }

    if (profile.admin_role !== 'super_admin' && profile.admin_role !== 'admin') {
      return { ok: false, error: 'Not authorized' };
    }

    return { ok: true, user: profile };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

module.exports = async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  const verifyResult = await verifyAdmin(token);
  if (!verifyResult.ok) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Get only the 4 main templates
    try {
      const mainTemplates = ['Maintenance Log', 'Production QC', 'Inventory Count', 'Safety Audit'];
      
      const { data, error } = await supabaseAdmin
        .from('templates')
        .select('*')
        .in('name', mainTemplates)
        .order('name', { ascending: true });
      
      if (error) {
        return res.status(500).json({ ok: false, error: error.message });
      }

      return res.status(200).json({ ok: true, templates: data || [] });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    // Create new template
    try {
      const { name, description } = req.body;
      
      const { data, error } = await supabaseAdmin
        .from('templates')
        .insert([{
          name,
          description,
          created_by: verifyResult.user.user_id
        }])
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ ok: false, error: error.message });
      }

      return res.status(200).json({ ok: true, template: data });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  }

  if (req.method === 'PUT') {
    // Update template
    try {
      const { id, name, description } = req.body;
      
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      
      const { data, error } = await supabaseAdmin
        .from('templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ ok: false, error: error.message });
      }

      return res.status(200).json({ ok: true, template: data });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    // Delete template
    try {
      const { id } = req.body;
      
      const { error } = await supabaseAdmin
        .from('templates')
        .delete()
        .eq('id', id);
      
      if (error) {
        return res.status(500).json({ ok: false, error: error.message });
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};

