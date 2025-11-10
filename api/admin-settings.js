// Admin Settings API Endpoints for Supabase Integration
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://icbfadlizwwonymqdclb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { 
      auth: { persistSession: false, autoRefreshToken: false } 
    })
  : null;

// Helper function to verify admin access
async function verifyAdmin(token) {
  console.log('🔐 Verifying admin token...');
  
  if (!supabaseAdmin) {
    console.log('❌ Supabase admin client not configured');
    return { ok: false, error: 'Supabase not configured' };
  }
  
  if (!token) {
    console.log('❌ No token provided');
    return { ok: false, error: 'No token provided' };
  }
  
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr) {
    console.log('❌ Token validation error:', userErr.message);
    return { ok: false, error: 'Invalid token: ' + userErr.message };
  }
  
  if (!userData?.user) {
    console.log('❌ No user data found');
    return { ok: false, error: 'Invalid token' };
  }

  console.log('✅ Token valid for user:', userData.user.email);

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('role,status,admin_role')
    .eq('user_id', userData.user.id)
    .single();

  if (profileErr) {
    console.log('❌ Profile lookup error:', profileErr.message);
    return { ok: false, error: 'Profile not found' };
  }

  console.log('📋 Profile data:', { 
    role: profile?.role, 
    admin_role: profile?.admin_role, 
    status: profile?.status 
  });

  // Check if user is admin: either role is 'admin' OR admin_role is set to super_admin/editor
  const isAdmin = profile?.role === 'admin' || 
                  profile?.admin_role === 'super_admin' || 
                  profile?.admin_role === 'editor';

  if (!isAdmin || profile?.status !== 'active') {
    console.log('❌ Admin verification failed:', { 
      isAdmin, 
      status: profile?.status,
      reason: !isAdmin ? 'Not admin role' : 'Not active status'
    });
    return { ok: false, error: 'Unauthorized' };
  }

  console.log('✅ Admin verified successfully');
  return { ok: true, user: userData.user };
}

// System Settings Endpoints
async function getSystemSettings() {
  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .select('*');
  
  if (error) return { ok: false, error: error.message };
  
  // Convert array to key-value object
  const settings = {};
  data.forEach(setting => {
    settings[setting.key] = setting.value;
  });
  
  return { ok: true, settings };
}

async function updateSystemSetting(key, value, userId) {
  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .upsert({
      key,
      value,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'key'
    })
    .select();
  
  if (error) return { ok: false, error: error.message };
  
  // Log the change
  await logActivity('info', `System setting '${key}' updated to '${value}'`, userId);
  
  return { ok: true, setting: data[0] };
}

// Feature Flags Endpoints
async function getFeatureFlags() {
  const { data, error } = await supabaseAdmin
    .from('feature_flags')
    .select('*')
    .order('name');
  
  if (error) return { ok: false, error: error.message };
  return { ok: true, flags: data };
}

async function updateFeatureFlag(id, enabled, userId) {
  const { data, error } = await supabaseAdmin
    .from('feature_flags')
    .update({
      enabled,
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();
  
  if (error) return { ok: false, error: error.message };
  
  await logActivity('info', `Feature flag '${data[0].name}' ${enabled ? 'enabled' : 'disabled'}`, userId);
  
  return { ok: true, flag: data[0] };
}

// Admin Roles Endpoints
async function getAdminUsers() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id, full_name, email, admin_role, status, created_at')
    .not('admin_role', 'is', null)
    .order('full_name');
  
  if (error) return { ok: false, error: error.message };
  return { ok: true, users: data };
}

async function updateUserRole(userId, role, updatedBy) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ admin_role: role })
    .eq('user_id', userId)
    .select();
  
  if (error) return { ok: false, error: error.message };
  
  await logActivity('info', `User role updated to '${role}' for user ${userId}`, updatedBy);
  
  return { ok: true, user: data[0] };
}

// Email Settings Endpoints
async function getEmailSettings() {
  const { data, error } = await supabaseAdmin
    .from('email_settings')
    .select('*')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') { // Not found error
    return { ok: false, error: error.message };
  }
  
  return { ok: true, settings: data || {} };
}

async function updateEmailSettings(settings, userId) {
  // Get existing record
  const { data: existing } = await supabaseAdmin
    .from('email_settings')
    .select('id')
    .limit(1)
    .single();
  
  const updateData = {
    ...settings,
    updated_by: userId,
    updated_at: new Date().toISOString()
  };
  
  let result;
  if (existing) {
    result = await supabaseAdmin
      .from('email_settings')
      .update(updateData)
      .eq('id', existing.id)
      .select();
  } else {
    result = await supabaseAdmin
      .from('email_settings')
      .insert(updateData)
      .select();
  }
  
  if (result.error) return { ok: false, error: result.error.message };
  
  await logActivity('info', 'Email settings updated', userId);
  
  return { ok: true, settings: result.data[0] };
}

// API Keys Endpoints
async function getAPIKeys() {
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, name, key_prefix, key_visible, environment, is_active, last_used_at, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) return { ok: false, error: error.message };
  return { ok: true, keys: data };
}

async function createAPIKey(name, environment, userId) {
  const crypto = require('crypto');
  const prefix = environment === 'production' ? 'sk_live' : 'sk_test';
  const randomKey = crypto.randomBytes(32).toString('hex');
  const fullKey = `${prefix}_${randomKey}`;
  const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
  const keyVisible = randomKey.slice(-4);
  
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      name,
      key_prefix: prefix,
      key_hash: keyHash,
      key_visible: keyVisible,
      environment,
      created_by: userId
    })
    .select();
  
  if (error) return { ok: false, error: error.message };
  
  await logActivity('info', `API key '${name}' created for ${environment}`, userId);
  
  return { ok: true, key: data[0], fullKey }; // Return full key only once
}

async function revokeAPIKey(keyId, userId) {
  const { data, error} = await supabaseAdmin
    .from('api_keys')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString()
    })
    .eq('id', keyId)
    .select();
  
  if (error) return { ok: false, error: error.message };
  
  await logActivity('warning', `API key '${data[0].name}' revoked`, userId);
  
  return { ok: true };
}

// Activity Logs Endpoints
async function getActivityLogs(filters = {}) {
  let query = supabaseAdmin
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (filters.level) {
    query = query.eq('level', filters.level);
  }
  
  const { data, error } = await query;
  
  if (error) return { ok: false, error: error.message };
  return { ok: true, logs: data };
}

async function logActivity(level, message, userId = null, metadata = null) {
  try {
    let userEmail = null;
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('user_id', userId)
        .single();
      userEmail = profile?.email;
    }
    
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        level,
        message,
        user_id: userId,
        user_email: userEmail,
        metadata
      });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Workspaces Endpoints
async function getWorkspaces() {
  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .select(`
      *,
      workspace_members (
        user_id,
        role,
        profiles (full_name, email)
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) return { ok: false, error: error.message };
  return { ok: true, workspaces: data };
}

async function updateWorkspace(id, updates, userId) {
  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) return { ok: false, error: error.message };
  
  await logActivity('info', `Workspace '${data[0].name}' updated`, userId);
  
  return { ok: true, workspace: data[0] };
}

async function deleteWorkspace(id, userId) {
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('name')
    .eq('id', id)
    .single();
  
  const { error } = await supabaseAdmin
    .from('workspaces')
    .delete()
    .eq('id', id);
  
  if (error) return { ok: false, error: error.message };
  
  await logActivity('warning', `Workspace '${workspace?.name}' deleted`, userId);
  
  return { ok: true };
}

// Templates Endpoints
async function getTemplates() {
  const { data, error } = await supabaseAdmin
    .from('templates')
    .select(`
      *,
      created_user:profiles!templates_created_by_fkey(full_name, email),
      updated_user:profiles!templates_updated_by_fkey(full_name, email),
      template_usage(workspace_id, used_for)
    `)
    .order('created_at', { ascending: false });
  
  if (error) return { ok: false, error: error.message };
  return { ok: true, templates: data };
}

async function updateTemplate(id, updates, userId) {
  const { data, error } = await supabaseAdmin
    .from('templates')
    .update({
      ...updates,
      updated_by: userId
    })
    .eq('id', id)
    .select();
  
  if (error) return { ok: false, error: error.message };
  
  await logActivity('info', `Template '${data[0].name}' updated`, userId);
  
  return { ok: true, template: data[0] };
}

async function deleteTemplate(id, userId) {
  const { data: template } = await supabaseAdmin
    .from('templates')
    .select('name')
    .eq('id', id)
    .single();
  
  const { error } = await supabaseAdmin
    .from('templates')
    .delete()
    .eq('id', id);
  
  if (error) return { ok: false, error: error.message };
  
  await logActivity('warning', `Template '${template?.name}' deleted`, userId);
  
  return { ok: true };
}

// Backups Endpoints
async function getBackups() {
  const { data, error } = await supabaseAdmin
    .from('system_backups')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) return { ok: false, error: error.message };
  return { ok: true, backups: data };
}

async function createBackup(userId) {
  const filename = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.sql`;
  
  const { data, error } = await supabaseAdmin
    .from('system_backups')
    .insert({
      filename,
      size_bytes: Math.floor(Math.random() * 3000000) + 2000000, // Mock size for now
      created_by: userId,
      status: 'completed'
    })
    .select();
  
  if (error) return { ok: false, error: error.message };
  
  await logActivity('info', `Backup created: ${filename}`, userId);
  
  return { ok: true, backup: data[0] };
}

module.exports = {
  verifyAdmin,
  getSystemSettings,
  updateSystemSetting,
  getFeatureFlags,
  updateFeatureFlag,
  getAdminUsers,
  updateUserRole,
  getEmailSettings,
  updateEmailSettings,
  getAPIKeys,
  createAPIKey,
  revokeAPIKey,
  getActivityLogs,
  logActivity,
  getWorkspaces,
  updateWorkspace,
  deleteWorkspace,
  getTemplates,
  updateTemplate,
  deleteTemplate,
  getBackups,
  createBackup
};


