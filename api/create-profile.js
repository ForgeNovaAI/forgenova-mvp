// api/create-profile.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }

  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { user_id, full_name, first_name, last_name, company, position, email } = JSON.parse(body);

        if (!user_id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'user_id is required' }));
          resolve();
          return;
        }

        if (!supabaseAdmin || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Server configuration error' }));
          resolve();
          return;
        }

        // Check if profile already exists
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('user_id', user_id)
          .maybeSingle();

        if (existingProfile) {
          // Profile already exists, return success
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, message: 'Profile already exists' }));
          resolve();
          return;
        }

        // Create profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: user_id,
            full_name: full_name || null,
            first_name: first_name || null,
            last_name: last_name || null,
            company: company || null,
            position: position || null,
            role: 'user', // Default role
            status: 'pending', // Default status
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating profile:', profileError);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: profileError.message }));
          resolve();
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, profile }));
        resolve();
      } catch (error) {
        console.error('Error in create-profile:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: error.message }));
        resolve();
      }
    });
  });
};

