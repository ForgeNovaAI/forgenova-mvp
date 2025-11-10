# Admin Frontend Integration with Real APIs

This document outlines all the changes needed to connect the admin frontend to real Supabase data.

## Key Changes Summary

### 1. Helper Function for API Calls
Add this helper function at the top of the script section:

```javascript
// Helper function for making authenticated API calls
async function makeAPICall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('adminToken');
  const options = {
    method,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(endpoint, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    return { ok: false, error: error.message };
  }
}
```

### 2. Settings Functions - Replace with Real API Calls

#### Load Settings on Page Load
```javascript
async function loadSystemSettings() {
  const result = await makeAPICall('/api/admin-settings');
  if (result.ok) {
    systemSettings = result.settings;
  }
  renderSettingsContent(currentSettingsTab);
}
```

#### Save General Settings
```javascript
async function saveGeneralSettings() {
  const updates = [
    { key: 'company_name', value: document.getElementById('companyName').value },
    { key: 'company_logo', value: document.getElementById('companyLogo').value },
    { key: 'date_format', value: document.getElementById('dateFormat').value },
    { key: 'theme', value: document.querySelector('input[name="theme"]:checked').value }
  ];
  
  for (const update of updates) {
    await makeAPICall('/api/admin-settings', 'POST', update);
  }
  
  alert('General settings saved successfully!');
  await loadSystemSettings(); // Reload to show latest
}
```

#### Feature Flags
```javascript
async function loadFeatureFlags() {
  const result = await makeAPICall('/api/admin-feature-flags');
  if (result.ok) {
    return result.flags;
  }
  return [];
}

async function saveFeatureFlags() {
  const flags = document.querySelectorAll('[id^="feature"]');
  for (const flag of flags) {
    const id = flag.getAttribute('data-flag-id');
    const enabled = flag.checked;
    await makeAPICall('/api/admin-feature-flags', 'POST', { id, enabled });
  }
  alert('Feature flags configuration saved successfully!');
}
```

### 3. Workspaces - Real Data
```javascript
async function loadWorkspaces() {
  const result = await makeAPICall('/api/admin-workspaces');
  if (result.ok && result.workspaces) {
    allWorkspaces = result.workspaces.map(ws => ({
      id: ws.id,
      name: ws.name,
      lastUsed: ws.last_used_at,
      totalApps: ws.total_apps,
      activeTemplates: ws.active_templates,
      members: ws.workspace_members.map(m => ({
        name: m.profiles.full_name,
        role: m.role
      })),
      dataImports: ws.data_imports,
      errors: ws.errors_count,
      errorPeriod: 'last 60 days',
      status: ws.status
    }));
    
    if (allWorkspaces.length > 0) {
      selectedWorkspaceId = allWorkspaces[0].id;
    }
  }
  renderWorkspaces();
}

async function deleteWorkspace(workspaceId) {
  if (!confirm('Are you sure you want to delete this workspace?')) return;
  
  const result = await makeAPICall('/api/admin-workspaces', 'DELETE', { id: workspaceId });
  if (result.ok) {
    alert('Workspace deleted successfully!');
    await loadWorkspaces();
  } else {
    alert('Failed to delete workspace: ' + (result.error || 'Unknown error'));
  }
}

async function suspendWorkspace(workspaceId) {
  if (!confirm('Are you sure you want to suspend this workspace?')) return;
  
  const result = await makeAPICall('/api/admin-workspaces', 'PUT', {
    id: workspaceId,
    updates: { status: 'suspended' }
  });
  
  if (result.ok) {
    alert('Workspace suspended successfully!');
    await loadWorkspaces();
  }
}
```

### 4. Templates - Real Data
```javascript
async function loadTemplates() {
  const result = await makeAPICall('/api/admin-templates');
  if (result.ok && result.templates) {
    allTemplates = result.templates.map(t => ({
      id: t.id,
      name: t.name,
      lastUsed: t.last_used_at,
      created: t.created_user?.full_name || 'Unknown',
      updated: t.updated_user?.full_name || 'Unknown',
      usedBy: [...new Set(t.template_usage.map(u => `Workspace ${u.workspace_id.slice(0,8)}`))],
      usedFor: t.template_usage.map(u => u.used_for).filter(Boolean),
      description: t.description,
      status: t.status
    }));
    
    if (allTemplates.length > 0) {
      selectedTemplateId = allTemplates[0].id;
    }
  }
  renderTemplates();
}

async function deleteTemplate(templateId) {
  if (!confirm('Are you sure you want to delete this template?')) return;
  
  const result = await makeAPICall('/api/admin-templates', 'DELETE', { id: templateId });
  if (result.ok) {
    alert('Template deleted successfully!');
    await loadTemplates();
  } else {
    alert('Failed to delete template: ' + (result.error || 'Unknown error'));
  }
}

async function archiveTemplate(templateId) {
  const result = await makeAPICall('/api/admin-templates', 'PUT', {
    id: templateId,
    updates: { status: 'archived' }
  });
  
  if (result.ok) {
    alert('Template archived successfully!');
    await loadTemplates();
  }
}
```

### 5. Activity Logs - Real Data
```javascript
async function loadLogs() {
  const result = await makeAPICall('/api/admin-logs');
  if (result.ok && result.logs) {
    allLogs = result.logs.map(log => ({
      id: log.id,
      level: log.level,
      message: log.message,
      user: log.user_email || 'System',
      time: new Date(log.created_at),
      timestamp: new Date(log.created_at).getTime()
    }));
    
    allLogs.sort((a, b) => b.timestamp - a.timestamp);
  }
  renderLogs(allLogs);
}

async function filterLogs(level) {
  currentLogFilter = level;
  
  // Update active button
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-level') === level) {
      btn.classList.add('active');
    }
  });
  
  // Fetch filtered logs
  const endpoint = level === 'all' ? '/api/admin-logs' : `/api/admin-logs?level=${level}`;
  const result = await makeAPICall(endpoint);
  
  if (result.ok && result.logs) {
    const logs = result.logs.map(log => ({
      id: log.id,
      level: log.level,
      message: log.message,
      user: log.user_email || 'System',
      time: new Date(log.created_at),
      timestamp: new Date(log.created_at).getTime()
    }));
    renderLogs(logs);
  }
}
```

### 6. API Keys Management
```javascript
async function loadAPIKeys() {
  const result = await makeAPICall('/api/admin-api-keys');
  if (result.ok && result.keys) {
    return result.keys;
  }
  return [];
}

async function createNewAPIKey() {
  const name = prompt('Enter a name for the new API key:');
  if (!name) return;
  
  const environment = confirm('Is this for production? (Cancel for development)') 
    ? 'production' 
    : 'development';
  
  const result = await makeAPICall('/api/admin-api-keys', 'POST', { name, environment });
  
  if (result.ok) {
    alert(`API key created successfully!\n\nKey: ${result.fullKey}\n\nSave this key now - you won't see it again!`);
    renderSettingsContent('api'); // Refresh the view
  } else {
    alert('Failed to create API key: ' + (result.error || 'Unknown error'));
  }
}

async function revokeAPIKey(keyId) {
  if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
  
  const result = await makeAPICall('/api/admin-api-keys', 'DELETE', { keyId });
  
  if (result.ok) {
    alert('API key revoked successfully!');
    renderSettingsContent('api'); // Refresh the view
  }
}
```

### 7. Backups Management
```javascript
async function loadBackups() {
  const result = await makeAPICall('/api/admin-backups');
  if (result.ok && result.backups) {
    return result.backups;
  }
  return [];
}

async function createBackup() {
  const result = await makeAPICall('/api/admin-backups', 'POST');
  
  if (result.ok) {
    alert('Backup created successfully!');
    renderSettingsContent('backup'); // Refresh the view
  } else {
    alert('Failed to create backup: ' + (result.error || 'Unknown error'));
  }
}
```

### 8. Admin Roles Management
```javascript
async function loadAdminUsers() {
  const result = await makeAPICall('/api/admin-users-roles');
  if (result.ok && result.users) {
    return result.users;
  }
  return [];
}

async function saveAccessRoles() {
  // Get all role selects and save changed values
  const roleSelects = document.querySelectorAll('.role-select');
  for (const select of roleSelects) {
    const userId = select.getAttribute('data-user-id');
    const role = select.value;
    await makeAPICall('/api/admin-users-roles', 'POST', { userId, role });
  }
  alert('Access roles updated successfully!');
}
```

### 9. Email Settings
```javascript
async function loadEmailSettings() {
  const result = await makeAPICall('/api/admin-email-settings');
  if (result.ok && result.settings) {
    return result.settings;
  }
  return {};
}

async function saveEmailSettings() {
  const settings = {
    smtp_server: document.getElementById('smtpServer').value,
    smtp_port: parseInt(document.getElementById('smtpPort').value),
    smtp_username: document.getElementById('smtpUsername').value,
    smtp_password: document.getElementById('smtpPassword').value,
    notification_errors: document.getElementById('notifErrors').checked,
    notification_signups: document.getElementById('notifSignups').checked,
    notification_workspace_activity: document.getElementById('notifWorkspace').checked
  };
  
  const result = await makeAPICall('/api/admin-email-settings', 'POST', settings);
  
  if (result.ok) {
    alert('Email settings saved successfully!');
  } else {
    alert('Failed to save email settings: ' + (result.error || 'Unknown error'));
  }
}
```

## Integration Checklist

- [ ] Add makeAPICall helper function
- [ ] Replace loadSystemSettings()
- [ ] Replace saveGeneralSettings()
- [ ] Replace loadFeatureFlags() and saveFeatureFlags()
- [ ] Replace loadWorkspaces() with real API
- [ ] Replace loadTemplates() with real API
- [ ] Replace loadLogs() with real API
- [ ] Update all delete/update functions to use real APIs
- [ ] Add loading states to UI
- [ ] Add error handling for all API calls
- [ ] Test each section thoroughly

## Testing Each Feature

1. **General Settings**: Change company name, save, refresh - should persist
2. **Feature Flags**: Toggle switches, save, refresh - should persist
3. **Workspaces**: Delete/suspend workspace - should update database
4. **Templates**: Archive/delete template - should update database
5. **Logs**: Filter by level - should query database
6. **API Keys**: Create new key - should generate and store
7. **Backups**: Create backup - should create database entry
8. **Roles**: Change user role - should update profiles table

## Note on Environment

Make sure `SUPABASE_SERVICE_ROLE_KEY` is set before starting the server!


