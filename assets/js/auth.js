/**
 * ForgeNova Authentication Helper
 * Handles authentication state management and route protection
 */

// Initialize Supabase client (reuse from window if already available)
const getSupabaseClient = () => {
    if (window.supabaseClient) {
        return window.supabaseClient;
    }
    
    const { createClient } = supabase;
    const SUPABASE_URL = "https://icbfadlizwwonymqdclb.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYmZhZGxpend3b255bXFkY2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzU4OTUsImV4cCI6MjA3MzYxMTg5NX0.sQNGjFdC-WM0nSdGucgx3DelUJ5KJXh6S8J54xWUEu0";
    
    window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return window.supabaseClient;
};

/**
 * Check if user is authenticated
 * @returns {Promise<Object|null>} User session or null
 */
async function checkAuthentication() {
    const client = getSupabaseClient();
    const { data: { session } } = await client.auth.getSession();
    return session;
}

/**
 * Get current user
 * @returns {Promise<Object|null>} User object or null
 */
async function getCurrentUser() {
    const client = getSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    return user;
}

/**
 * Protect a route - redirect to login if not authenticated
 * Call this on protected pages (like dashboard)
 */
async function requireAuth() {
    const session = await checkAuthentication();
    
    if (!session) {
        console.log('🔒 Not authenticated, redirecting to login...');
        window.location.href = '/login.html';
        return false;
    }
    
    console.log('✅ Authenticated:', session.user.email);
    return true;
}

/**
 * Redirect authenticated users away from auth pages
 * Call this on login/signup pages
 */
async function redirectIfAuthenticated() {
    const session = await checkAuthentication();
    
    if (session) {
        console.log('✅ Already authenticated, redirecting to dashboard...');
        window.location.href = '/index.html';
        return true;
    }
    
    return false;
}

/**
 * Sign out user and redirect to homepage
 */
async function signOut() {
    const client = getSupabaseClient();
    
    try {
        const { error } = await client.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        console.log('👋 Signed out successfully');
        
        // Redirect to homepage (forgenova.ai)
        window.location.href = 'https://forgenova.ai';
    } catch (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out. Please try again.');
    }
}

/**
 * Listen for auth state changes
 * @param {Function} callback - Called when auth state changes
 */
function onAuthStateChange(callback) {
    const client = getSupabaseClient();
    
    client.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (callback && typeof callback === 'function') {
            callback(event, session);
        }
    });
}

/**
 * Display user info in the UI
 * @param {string} elementId - ID of element to display user info
 */
async function displayUserInfo(elementId = 'userInfo') {
    const user = await getCurrentUser();
    const element = document.getElementById(elementId);
    
    if (!element || !user) {
        return;
    }
    
    const userName = user.user_metadata?.full_name || user.email.split('@')[0];
    const userEmail = user.email;
    
    element.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--brand); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                ${userName.charAt(0).toUpperCase()}
            </div>
            <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 600; font-size: 14px;">${userName}</span>
                <span style="color: var(--muted); font-size: 12px;">${userEmail}</span>
            </div>
        </div>
    `;
}

// Export functions for use in other scripts
window.ForgeAuth = {
    checkAuthentication,
    getCurrentUser,
    requireAuth,
    redirectIfAuthenticated,
    signOut,
    onAuthStateChange,
    displayUserInfo
};

console.log('🔐 ForgeNova Auth module loaded');

