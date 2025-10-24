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
        window.location.href = '/dashboard.html';
        return true;
    }
    
    return false;
}

/**
 * Sign out user and redirect to ForgeNova website
 */
async function signOut() {
    const client = getSupabaseClient();
    
    try {
        const { error } = await client.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        console.log('👋 Signed out successfully');
        
        // Redirect to login page
        window.location.href = '/login.html';
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
 * Display user info as a clickable avatar with dropdown
 * @param {string} elementId - ID of element to display user info
 */
async function displayUserInfo(elementId = 'userInfo') {
    const user = await getCurrentUser();
    const element = document.getElementById(elementId);
    
    if (!element) {
        console.error('❌ User info element not found:', elementId);
        return;
    }
    
    if (!user) {
        console.error('❌ No user authenticated');
        return;
    }
    
    console.log('✅ Displaying avatar for:', user.email);
    
    const userName = user.user_metadata?.full_name || user.email.split('@')[0];
    const userEmail = user.email;
    const initials = userName.charAt(0).toUpperCase();
    
    // Create avatar button only (dropdown will be appended to body)
    const avatarHTML = `
        <div id="avatarContainer" style="position: relative; display: inline-block;">
            <!-- Avatar Button -->
            <button 
                id="avatarBtn"
                class="avatar-btn" 
                style="
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--brand), #ff8533);
                    color: white;
                    border: 2px solid #fff;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    padding: 0;
                "
                title="${userName}"
            >
                ${initials}
            </button>
        </div>
    `;
    
    // Create dropdown menu HTML (will be appended to body)
    const dropdownHTML = `
        <div 
            id="userDropdown"
            style="
                display: none;
                position: fixed;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                box-shadow: 0 10px 28px rgba(0,0,0,0.12);
                width: 240px;
                z-index: 9999;
                overflow: hidden;
            "
        >
                <!-- User Info Header -->
                <div style="
                    padding: 14px 16px;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f9fafb;
                ">
                    <div style="
                        font-weight: 600;
                        color: #111827;
                        font-size: 14px;
                        margin-bottom: 2px;
                    ">${userName}</div>
                    <div style="
                        color: #6b7280;
                        font-size: 12px;
                        word-break: break-all;
                    ">${userEmail}</div>
                </div>
                
                <!-- Menu Items -->
                <div style="padding: 8px 0;">
                    <a href="#" class="dropdown-link" id="profileLink"
                       style="
                        display: block;
                        padding: 10px 16px;
                        color: #374151;
                        text-decoration: none;
                        font-size: 14px;
                        font-weight: 500;
                    ">
                        👤 Profile
                    </a>
                    
                    <a href="/workspace.html" class="dropdown-link"
                       style="
                        display: block;
                        padding: 10px 16px;
                        color: #374151;
                        text-decoration: none;
                        font-size: 14px;
                        font-weight: 500;
                    ">
                        🏢 Workspace
                    </a>
                    
                    <a href="/change-password.html" class="dropdown-link"
                       style="
                        display: block;
                        padding: 10px 16px;
                        color: #374151;
                        text-decoration: none;
                        font-size: 14px;
                        font-weight: 500;
                    ">
                        🔐 Change Password
                    </a>
                </div>
                
                <!-- Signout Button -->
                <div style="
                    padding: 8px;
                    border-top: 1px solid #e5e7eb;
                    background: #f9fafb;
                ">
                    <button id="signOutBtn"
                        style="
                            width: 100%;
                            padding: 10px 14px;
                            background: #fee2e2;
                            color: #991b1b;
                            border: 1px solid #fecaca;
                            border-radius: 8px;
                            font-weight: 600;
                            font-size: 13px;
                            cursor: pointer;
                        "
                    >
                        🚪 Logout
                    </button>
            </div>
            </div>
        </div>
    `;
    
    // Set avatar HTML
    element.innerHTML = avatarHTML;
    
    // Remove any existing dropdown from body
    const existingDropdown = document.getElementById('userDropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    // Append dropdown to body (portal-like behavior)
    document.body.insertAdjacentHTML('beforeend', dropdownHTML);
    
    // Add event listeners after DOM is updated
    setTimeout(() => {
        const avatarBtn = document.getElementById('avatarBtn');
        const avatarContainer = document.getElementById('avatarContainer');
        const dropdown = document.getElementById('userDropdown');
        const signOutBtn = document.getElementById('signOutBtn');
        const dropdownLinks = document.querySelectorAll('.dropdown-link');
        
        // Function to position dropdown below avatar button
        function positionDropdown() {
            if (avatarBtn && dropdown) {
                const rect = avatarBtn.getBoundingClientRect();
                dropdown.style.top = `${rect.bottom + 8}px`; // 8px gap below button
                dropdown.style.right = `${window.innerWidth - rect.right}px`; // Align to right edge
            }
        }
        
        // Toggle dropdown on avatar click
        if (avatarBtn && dropdown) {
            avatarBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const isVisible = dropdown.style.display === 'block';
                if (isVisible) {
                    dropdown.style.display = 'none';
                } else {
                    positionDropdown();
                    dropdown.style.display = 'block';
                }
            });
        }
        
        // Sign out button
        if (signOutBtn) {
            signOutBtn.addEventListener('click', function() {
                window.ForgeAuth.signOut();
            });
        }
        
        // Handle Profile link - open profile page in same window
        const profileLink = document.getElementById('profileLink');
        if (profileLink) {
            profileLink.addEventListener('click', function(e) {
                e.preventDefault();
                dropdown.style.display = 'none';
                // Navigate to profile page in same window
                window.location.href = '/profile.html';
            });
        }
        
        // Close dropdown when clicking menu links
        dropdownLinks.forEach(link => {
            if (link.id !== 'profileLink') {
                link.addEventListener('click', function() {
                    dropdown.style.display = 'none';
                });
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (dropdown && !event.target.closest('#avatarBtn') && !event.target.closest('#userDropdown')) {
                dropdown.style.display = 'none';
            }
        });
        
        // Reposition dropdown on window resize
        window.addEventListener('resize', function() {
            if (dropdown && dropdown.style.display === 'block') {
                positionDropdown();
            }
        });
        
        // Reposition on scroll (in case header is sticky)
        window.addEventListener('scroll', function() {
            if (dropdown && dropdown.style.display === 'block') {
                positionDropdown();
            }
        });
    }, 0);
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

