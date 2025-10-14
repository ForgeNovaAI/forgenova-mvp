# ForgeNova Authentication Flow

## Overview
This document describes the authentication and routing flow for the ForgeNova MVP application.

## Public Routes
These pages are accessible without authentication:
- `/home.html` - Homepage (landing page)
- `/login.html` - Login page
- `/signup.html` - Signup page  
- Password reset functionality (within home.html modal)

## Protected Routes
These pages require authentication. Unauthenticated users are redirected to `/login.html`:
- `/index.html` - Main dashboard/workspace
- Any other internal application pages

## User Flow

### 1. First-Time Visitor (Not Logged In)
```
User visits home.html
  ↓
Clicks "Explore Templates"
  ↓
System checks authentication
  ↓
NOT LOGGED IN → Opens login/signup modal
  ↓
User logs in or signs up
  ↓
Redirected to /index.html (dashboard)
```

### 2. Returning User (Already Logged In)
```
User visits home.html
  ↓
System auto-detects existing session
  ↓
Automatically redirects to /index.html (dashboard)
```

OR

```
User clicks "Explore Templates"
  ↓
System checks authentication
  ↓
LOGGED IN → Directly go to /index.html (dashboard)
```

### 3. Accessing Protected Pages Directly
```
User navigates to /index.html
  ↓
auth.js checks for valid session
  ↓
NO SESSION → Redirect to /login.html
  ↓
User logs in
  ↓
Redirect back to /index.html
```

### 4. Logout Flow
```
User clicks "Logout" button in dashboard
  ↓
window.ForgeAuth.signOut() is called
  ↓
Session cleared in Supabase
  ↓
User redirected to https://forgenova.ai
```

### 5. Password Reset Flow
```
User clicks "Forgot password?" on login form
  ↓
Switches to reset password tab
  ↓
User enters email
  ↓
System sends reset link via Supabase
  ↓
User receives email with reset link
  ↓
User clicks link → Redirected to /index.html with reset token
  ↓
User sets new password
  ↓
Logged in and can use the app
```

## Key Functions

### home.html
- `handleExploreTemplates()` - Checks auth before allowing access to templates
- `checkAuth()` - Auto-redirects if already logged in
- `openModal()` - Shows login/signup modal
- Login/Signup/Reset handlers - Process authentication

### assets/js/auth.js
- `requireAuth()` - Protects pages, redirects to login if not authenticated
- `checkAuthentication()` - Returns current session
- `signOut()` - Logs out and redirects to https://forgenova.ai
- `redirectIfAuthenticated()` - Redirects logged-in users away from auth pages
- `displayUserInfo()` - Shows user profile in UI

### index.html (Protected Page)
- Calls `requireAuth()` on page load
- Shows logout button that calls `window.ForgeAuth.signOut()`
- Displays user info via `displayUserInfo()`

## Security Features

1. **Session-based Authentication**: Uses Supabase Auth sessions
2. **Auto-redirect Protection**: Protected pages automatically redirect if not logged in
3. **Reverse Protection**: Login/signup pages redirect if already logged in
4. **Secure Logout**: Clears session and redirects to public site
5. **Password Reset**: Secure email-based password recovery

## Environment Variables

Supabase configuration is stored in:
- `SUPABASE_URL`: https://icbfadlizwwonymqdclb.supabase.co
- `SUPABASE_ANON_KEY`: Public anon key for client-side auth

## Testing the Flow

1. **Test Login Flow**:
   - Visit `/home.html`
   - Click "Explore Templates"
   - Should show login modal
   - Login → Should redirect to `/index.html`

2. **Test Auto-Redirect**:
   - Login to app
   - Visit `/home.html` again
   - Should auto-redirect to `/index.html`

3. **Test Protection**:
   - Logout
   - Try to access `/index.html` directly
   - Should redirect to `/login.html`

4. **Test Logout**:
   - Login to app
   - Click "Logout" button
   - Should redirect to `https://forgenova.ai`

5. **Test Password Reset**:
   - Click "Forgot password?" on login
   - Enter email
   - Check email for reset link
   - Click link and set new password

