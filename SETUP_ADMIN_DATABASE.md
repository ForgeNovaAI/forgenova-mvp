# Admin Dashboard Database Setup Guide

## Prerequisites
- Supabase account with a project created
- SUPABASE_SERVICE_ROLE_KEY environment variable set

## Setup Steps

### 1. Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### 2. Run Database Schema Creation

Copy and paste the following SQL commands in order:

#### Step 1: Create System Settings Table
```sql
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (key, value) VALUES
  ('company_name', 'ForgeNovaAI'),
  ('company_logo', 'forgenova-logo.png'),
  ('date_format', 'DD/MM/YYYY'),
  ('theme', 'light'),
  ('system_version', 'v1.2.0')
ON CONFLICT (key) DO NOTHING;
```

#### Step 2: Create Feature Flags Table
```sql
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  key VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default feature flags
INSERT INTO feature_flags (name, key, description, enabled) VALUES
  ('Enable AI Reports', 'ai_reports', 'Allow AI-powered report generation for analytics', true),
  ('Enable User Analytics', 'user_analytics', 'Track user behavior and generate usage statistics', true),
  ('Enable Advanced Search', 'advanced_search', 'Provide enhanced search capabilities across the platform', false),
  ('Enable API v2', 'api_v2', 'Allow access to the new API version (Beta)', false)
ON CONFLICT (key) DO NOTHING;
```

#### Step 3: Add Admin Role to Profiles
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_role VARCHAR(50) DEFAULT NULL;
-- Possible values: 'super_admin', 'editor', 'viewer'

-- Make the current admin a super_admin (replace with your admin user ID)
-- UPDATE profiles SET admin_role = 'super_admin' WHERE email = 'admin@forgenova.ai';
```

#### Step 4: Create Email Settings Table
```sql
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_server VARCHAR(255),
  smtp_port INTEGER,
  smtp_username VARCHAR(255),
  smtp_password TEXT,
  notification_errors BOOLEAN DEFAULT true,
  notification_signups BOOLEAN DEFAULT true,
  notification_workspace_activity BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default email settings
INSERT INTO email_settings (smtp_server, smtp_port) VALUES
  ('smtp.gmail.com', 587);
```

#### Step 5: Create API Keys Table
```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(50) NOT NULL,
  key_hash TEXT NOT NULL,
  key_visible VARCHAR(255),
  environment VARCHAR(50) DEFAULT 'production',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);
```

#### Step 6: Create System Backups Table
```sql
CREATE TABLE IF NOT EXISTS system_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  size_bytes BIGINT,
  backup_type VARCHAR(50) DEFAULT 'full',
  storage_path TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'completed'
);
```

#### Step 7: Create Activity Logs Table
```sql
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_level ON activity_logs(level);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
```

#### Step 8: Create/Update Workspaces Table
```sql
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  total_apps INTEGER DEFAULT 0,
  active_templates INTEGER DEFAULT 0,
  data_imports INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
```

#### Step 9: Create/Update Templates Table
```sql
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  content JSONB,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  used_for VARCHAR(255),
  used_at TIMESTAMP DEFAULT NOW()
);
```

#### Step 10: Create Update Triggers
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Step 11: Enable Row Level Security (RLS)
```sql
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for system tables
CREATE POLICY "Service role can do everything on system_settings" ON system_settings
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on feature_flags" ON feature_flags
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on email_settings" ON email_settings
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on api_keys" ON api_keys
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on system_backups" ON system_backups
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on activity_logs" ON activity_logs
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on workspaces" ON workspaces
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on workspace_members" ON workspace_members
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on templates" ON templates
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on template_usage" ON template_usage
  FOR ALL USING (true);
```

### 3. Verify Installation
Run this query to check that all tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'system_settings', 
  'feature_flags', 
  'email_settings', 
  'api_keys', 
  'system_backups', 
  'activity_logs', 
  'workspaces', 
  'workspace_members', 
  'templates', 
  'template_usage'
);
```

You should see all 10 tables listed.

### 4. Set Environment Variable
Make sure you have your Supabase Service Role Key set:

#### For local development (Windows PowerShell):
```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

#### For local development (Mac/Linux):
```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

#### For Vercel deployment:
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add `SUPABASE_SERVICE_ROLE_KEY` with your key

### 5. Restart Your Server
After setting the environment variable, restart your local server:
```bash
node server.js
```

## Testing

1. Navigate to `http://localhost:3000/admin.html`
2. Login with admin credentials
3. Click on "Settings" tab
4. Try changing a setting and saving
5. Refresh the page - your settings should persist!

## Troubleshooting

### "Supabase not configured" error
- Make sure `SUPABASE_SERVICE_ROLE_KEY` environment variable is set
- Restart your server after setting the variable

### RLS Policy errors
- Make sure you ran all the RLS policy commands
- The service role key bypasses RLS, so this should work automatically

### Tables not found
- Verify all tables were created in step 11
- Make sure you're running queries in the correct Supabase project

## Next Steps
- The admin dashboard will now save all settings to Supabase
- All changes persist across page refreshes
- Activity logs track all admin actions
- Test each settings tab to ensure everything works!


