// api/admin-login.js
const crypto = require('crypto');

// Simple in-memory token storage (for serverless, consider Redis or database in production)
const adminTokens = new Map();

// Test admin credentials
const TEST_ADMIN = {
  email: 'admin@forgenova.ai',
  password: 'Admin123!@#',
  name: 'Admin User',
  role: 'admin'
};

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
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
      
      // Store token (in production, use Redis or database)
      adminTokens.set(token, adminData);
      
      return res.status(200).json({
        ok: true,
        token,
        user: {
          email: adminData.email,
          name: adminData.name,
          role: adminData.role
        }
      });
    } else {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(400).json({ ok: false, error: 'Invalid request' });
  }
};

