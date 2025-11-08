const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const url = require('url');
const crypto = require('crypto');

const PORT = 3000;

// Test admin credentials
const TEST_ADMIN = {
  email: 'admin@forgenova.ai',
  password: 'admin123',
  name: 'Admin User',
  role: 'admin'
};

// Simple token storage (in production, use JWT or session management)
const adminTokens = new Map();

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://icbfadlizwwonymqdclb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Supabase admin client
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { 
      auth: { persistSession: false, autoRefreshToken: false } 
    })
  : null;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
};

// Handle API endpoint
async function handleApiEndpoint(req, res, pathname) {
  if (pathname === '/api/auth-me') {
    // Handle auth-me endpoint
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'No token' }));
      return;
    }

    // If no service role key, return mock response for local testing
    if (!supabaseAdmin || !SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Using mock admin check.');
      // For local testing, you can modify this to return true/false
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        ok: true, 
        isAdmin: false, // Change to true for local testing
        user: { id: 'mock-user', email: 'test@example.com' },
        profile: null,
        note: 'Mock response - Set SUPABASE_SERVICE_ROLE_KEY for real auth'
      }));
      return;
    }

    try {
      // Validate token → get user
      const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
      if (userErr || !userData?.user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid token' }));
        return;
      }

      const user = userData.user;

      // Look up role in profiles
      const { data: profile, error: pErr } = await supabaseAdmin
        .from('profiles')
        .select('role,status,full_name,company,last_active_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (pErr) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: pErr.message }));
        return;
      }

      const isAdmin = profile?.role === 'admin' && profile?.status === 'active';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        isAdmin,
        user: { id: user.id, email: user.email },
        profile
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: error.message }));
    }
    return;
  }

  // Admin login endpoint
  if (pathname === '/api/admin-login') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body);
        
        // Validate credentials
        if (email === TEST_ADMIN.email && password === TEST_ADMIN.password) {
          // Generate token
          const token = crypto.randomBytes(32).toString('hex');
          const adminData = {
            email: TEST_ADMIN.email,
            name: TEST_ADMIN.name,
            role: TEST_ADMIN.role,
            loginTime: Date.now()
          };
          
          // Store token
          adminTokens.set(token, adminData);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ok: true,
            token,
            user: {
              email: adminData.email,
              name: adminData.name,
              role: adminData.role
            }
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid email or password' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid request' }));
      }
    });
    return;
  }

  // Admin verify endpoint
  if (pathname === '/api/admin-verify') {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'No token' }));
      return;
    }

    const adminData = adminTokens.get(token);
    if (adminData) {
      // Token is valid
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        isAdmin: true,
        user: {
          email: adminData.email,
          name: adminData.name,
          role: adminData.role
        }
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid token' }));
    }
    return;
  }

  // Admin logout endpoint
  if (pathname === '/api/admin-logout') {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (token) {
      adminTokens.delete(token);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'Logged out' }));
    return;
  }

  // Admin stats endpoint
  if (pathname === '/api/admin-stats') {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token || !adminTokens.has(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
      return;
    }

    if (!supabaseAdmin || !SUPABASE_SERVICE_ROLE_KEY) {
      // Mock stats for testing
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        stats: {
          totalUsers: 384,
          totalWorkspaces: 28,
          activeTemplates: 56,
          activeJobs: 4,
          erroredImports: 2
        }
      }));
      return;
    }

    try {
      // Fetch real stats from Supabase
      const [usersCount, workspacesCount] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('workspaces').select('*', { count: 'exact', head: true })
      ]);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        stats: {
          totalUsers: usersCount.count || 0,
          totalWorkspaces: workspacesCount.count || 0,
          activeTemplates: 56, // Placeholder
          activeJobs: 4, // Placeholder
          erroredImports: 2 // Placeholder
        }
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: error.message }));
    }
    return;
  }

  // Admin users endpoint
  if (pathname === '/api/admin-users') {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token || !adminTokens.has(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
      return;
    }

    if (!supabaseAdmin || !SUPABASE_SERVICE_ROLE_KEY) {
      // Mock users for testing
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        users: [
          {
            user_id: '1',
            full_name: 'Ann Anderson',
            email: 'aandersonann@example.com',
            company: 'Acme Corp',
            role: 'admin',
            status: 'active',
            created_at: '2024-02-15T00:00:00Z'
          },
          {
            user_id: '2',
            full_name: 'Mark Brown',
            email: 'brown@user.com',
            company: 'Globex Corp.',
            role: 'user',
            status: 'inactive',
            created_at: '2024-01-20T00:00:00Z'
          },
          {
            user_id: '3',
            full_name: 'John Davis',
            email: 'john@initech.com',
            company: 'Initech',
            role: 'user',
            status: 'active',
            created_at: '2024-04-05T00:00:00Z'
          }
        ]
      }));
      return;
    }

    try {
      // Fetch users from Supabase
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: error.message }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, users: profiles || [] }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: error.message }));
    }
    return;
  }

  // Admin reset password endpoint
  if (pathname === '/api/admin-reset-password') {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token || !adminTokens.has(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId } = JSON.parse(body);

        if (!supabaseAdmin || !SUPABASE_SERVICE_ROLE_KEY) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, message: 'Mock: Password reset email sent' }));
          return;
        }

        // Get user email
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('user_id', userId)
          .single();

        if (!profile) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'User not found' }));
          return;
        }

        // Send password reset email via Supabase
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(profile.email);

        if (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: error.message }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'Password reset email sent' }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: error.message }));
      }
    });
    return;
  }

  // Admin activate user endpoint
  if (pathname === '/api/admin-activate-user') {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token || !adminTokens.has(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId } = JSON.parse(body);

        if (!supabaseAdmin || !SUPABASE_SERVICE_ROLE_KEY) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, message: 'Mock: User activated' }));
          return;
        }

        // Update user status
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ status: 'active' })
          .eq('user_id', userId);

        if (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: error.message }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'User activated' }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: error.message }));
      }
    });
    return;
  }

  // Admin delete user endpoint
  if (pathname === '/api/admin-delete-user') {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token || !adminTokens.has(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { userId } = JSON.parse(body);

        if (!supabaseAdmin || !SUPABASE_SERVICE_ROLE_KEY) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, message: 'Mock: User deleted' }));
          return;
        }

        // Delete user from auth and profiles
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (authError) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: authError.message }));
          return;
        }

        // Profile should be deleted via cascade, but we can ensure it
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('user_id', userId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'User deleted' }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: error.message }));
      }
    });
    return;
  }

  // Unknown API endpoint
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
}

// Serve static files
function serveStaticFile(filePath, res) {
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

// Create server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Handle API endpoints
  if (pathname.startsWith('/api/')) {
    await handleApiEndpoint(req, res, pathname);
    return;
  }

  // Default to index.html for root
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Build file path
  const filePath = path.join(__dirname, pathname);

  // Check if file exists and serve it
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Try with .html extension
      const htmlPath = filePath + '.html';
      fs.stat(htmlPath, (err2, stats2) => {
        if (err2 || !stats2.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 - File Not Found</h1>', 'utf-8');
        } else {
          serveStaticFile(htmlPath, res);
        }
      });
    } else {
      serveStaticFile(filePath, res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Local server running at http://localhost:${PORT}`);
  console.log(`📱 Admin dashboard: http://localhost:${PORT}/admin.html`);
  console.log(`🏠 Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`\n⚠️  Note: For full admin functionality, set SUPABASE_SERVICE_ROLE_KEY environment variable`);
});

