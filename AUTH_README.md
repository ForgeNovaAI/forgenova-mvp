# ForgeNova MVP Authentication System

## Overview

This document describes the authentication system implemented for the ForgeNova MVP using Supabase Auth.

## Files Added

### 1. `login.html`
- Login page with email/password authentication
- Auto-redirects to dashboard if already logged in
- Form validation and error handling
- Loading states and user feedback

### 2. `signup.html`
- User registration page
- Password confirmation validation
- Auto-login after successful signup (if email confirmation disabled)
- Support for email confirmation flow
- User metadata support (full name)

### 3. `assets/js/auth.js`
- Authentication helper utilities
- Functions:
  - `checkAuthentication()` - Check if user is logged in
  - `getCurrentUser()` - Get current user object
  - `requireAuth()` - Protect routes (redirect to login if not authenticated)
  - `redirectIfAuthenticated()` - Redirect authenticated users away from auth pages
  - `signOut()` - Log out user and redirect to homepage
  - `onAuthStateChange(callback)` - Listen for auth state changes
  - `displayUserInfo(elementId)` - Display user info in UI

## Protected Routes

### Main Dashboard (`index.html`)
- **Protected**: Yes
- **Redirect**: `/login.html` if not authenticated
- **Features**:
  - User info display in header
  - Logout button
  - Full dashboard functionality

## Authentication Flow

### Sign Up Flow
1. User visits `/signup.html`
2. Fills out registration form (name, email, password)
3. Clicks "Create account"
4. System creates account via `supabase.auth.signUp()`
5. **Two scenarios**:
   - **Email confirmation disabled**: User is auto-logged in → redirects to `/index.html`
   - **Email confirmation enabled**: User sees confirmation message → redirects to `/login.html`

### Login Flow
1. User visits `/login.html`
2. Enters email and password
3. Clicks "Sign in"
4. System authenticates via `supabase.auth.signInWithPassword()`
5. On success: redirects to `/index.html` (dashboard)
6. On error: shows error message

### Logout Flow
1. User clicks "🚪 Logout" button in dashboard header
2. System calls `window.ForgeAuth.signOut()`
3. Session is cleared via `supabase.auth.signOut()`
4. User is redirected to `https://forgenova.ai`

### Protected Route Access
1. User tries to access `/index.html`
2. `requireAuth()` checks for active session
3. **If authenticated**: page loads normally, user info displayed
4. **If not authenticated**: redirects to `/login.html`

## UI Components

### Login Page
- Clean, centered card layout
- Email and password inputs
- Loading spinner during authentication
- Error/success alerts
- Link to signup page

### Signup Page
- Full name input
- Email and password inputs
- Password confirmation
- Password requirements display
- Loading spinner during registration
- Error/success alerts
- Link to login page

### Dashboard Header
- User avatar (first letter of name)
- User name and email display
- Logout button

## Supabase Configuration

### Connection Details
```javascript
const SUPABASE_URL = "https://icbfadlizwwonymqdclb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### Authentication Methods Used
- Email/Password authentication
- Session management
- User metadata storage

## Usage Examples

### Protecting a Page
```javascript
// At the top of your HTML file
<script src="assets/js/auth.js"></script>
<script>
  (async function() {
    const isAuthenticated = await window.ForgeAuth.requireAuth();
    if (isAuthenticated) {
      // Page loads normally
      await window.ForgeAuth.displayUserInfo('userInfo');
    }
  })();
</script>
```

### Displaying User Info
```html
<!-- Add container for user info -->
<div id="userInfo"></div>

<script>
  // Display user info
  await window.ForgeAuth.displayUserInfo('userInfo');
</script>
```

### Logging Out
```html
<!-- Logout button -->
<button onclick="window.ForgeAuth.signOut()">Logout</button>
```

## Security Notes

1. **Anon Key**: The Supabase anon key is safe to expose in client-side code
2. **Row Level Security**: Configure RLS policies in Supabase for data protection
3. **Session Storage**: Sessions are stored securely by Supabase SDK
4. **HTTPS**: Always use HTTPS in production

## Testing the System

### Test Account Creation
1. Navigate to `/signup.html`
2. Create test account:
   - Name: Test User
   - Email: test@example.com
   - Password: test123

### Test Login
1. Navigate to `/login.html`
2. Login with test credentials
3. Verify redirect to dashboard

### Test Protected Route
1. Clear browser storage/cookies
2. Try to access `/index.html` directly
3. Should redirect to `/login.html`

### Test Logout
1. Login to dashboard
2. Click logout button
3. Should redirect to `https://forgenova.ai`

## Troubleshooting

### "User already registered" error
- Email is already in use
- Use different email or reset password

### Redirect loop
- Check browser console for errors
- Verify Supabase credentials are correct
- Clear browser cache and storage

### Session not persisting
- Check browser allows cookies/storage
- Verify Supabase URL and anon key are correct

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification flow
- [ ] Social authentication (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Remember me functionality
- [ ] Session timeout warnings

