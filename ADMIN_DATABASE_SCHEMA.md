# Admin Dashboard Database Schema

## Tables Required for Supabase

### 1. system_settings
Stores global system configuration
```sql
CREATE TABLE system_settings (
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
  ('system_version', 'v1.2.0');
```

### 2. feature_flags
Manages feature toggles
```sql
CREATE TABLE feature_flags (
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
  ('Enable API v2', 'api_v2', 'Allow access to the new API version (Beta)', false);
```

### 3. admin_roles
Manages admin access and roles (extends profiles)
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_role VARCHAR(50) DEFAULT 'viewer';
-- Possible values: 'super_admin', 'editor', 'viewer'
```

### 4. email_settings
Stores SMTP and notification configuration
```sql
CREATE TABLE email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_server VARCHAR(255),
  smtp_port INTEGER,
  smtp_username VARCHAR(255),
  smtp_password TEXT, -- Encrypted in production
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

### 5. api_keys
Manages API keys for external access
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(50) NOT NULL,
  key_hash TEXT NOT NULL, -- Store hashed version
  key_visible VARCHAR(255), -- Last 4 characters for display
  environment VARCHAR(50) DEFAULT 'production', -- 'production', 'development', 'staging'
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);
```

### 6. system_backups
Tracks backup metadata
```sql
CREATE TABLE system_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  size_bytes BIGINT,
  backup_type VARCHAR(50) DEFAULT 'full', -- 'full', 'incremental'
  storage_path TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'completed' -- 'pending', 'completed', 'failed'
);
```

### 7. activity_logs
Comprehensive system activity logging
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(50) NOT NULL, -- 'error', 'warning', 'info', 'debug'
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  metadata JSONB, -- Additional context
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_level ON activity_logs(level);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
```

### 8. workspaces
Enhanced workspace table
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
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'archived'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workspace members junction table
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
```

### 9. templates
Enhanced templates table
```sql
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  content JSONB, -- Template structure/fields
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Template usage tracking
CREATE TABLE IF NOT EXISTS template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  used_for VARCHAR(255),
  used_at TIMESTAMP DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
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

-- Admin-only access policies
CREATE POLICY "Admins can view all settings" ON system_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update settings" ON system_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Apply similar policies to other admin tables
-- (feature_flags, email_settings, api_keys, system_backups, activity_logs)
```

## Functions and Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```


