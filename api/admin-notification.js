// api/admin-notification.js
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }

  try {
    const { type, userData } = req.body;

    if (type !== 'user_signup') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid notification type' }));
      return;
    }

    // Check if notifications are enabled in settings
    const { data: settings } = await supabaseAdmin
      .from('email_settings')
      .select('notification_signups')
      .limit(1)
      .single();

    // If notifications are disabled, skip sending
    if (settings && settings.notification_signups === false) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, skipped: true, reason: 'Notifications disabled' }));
      return;
    }

    // Send email notification
    const emailData = await resend.emails.send({
      from: 'ForgeNovaAI <info@forgenova.ai>',
      to: ['info@forgenova.ai'],
      subject: '🎉 New User Signup - ForgeNovaAI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-row { margin: 15px 0; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #667eea; }
            .label { font-weight: bold; color: #667eea; margin-right: 10px; }
            .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎉 New User Signup!</h1>
              <p style="margin: 10px 0 0 0;">Someone just created an account on ForgeNovaAI</p>
            </div>
            <div class="content">
              <div class="info-row">
                <span class="label">👤 Name:</span>
                <span>${userData.full_name || 'Not provided'}</span>
              </div>
              <div class="info-row">
                <span class="label">📧 Email:</span>
                <span>${userData.email}</span>
              </div>
              <div class="info-row">
                <span class="label">🏢 Company:</span>
                <span>${userData.company || 'Not provided'}</span>
              </div>
              <div class="info-row">
                <span class="label">💼 Position:</span>
                <span>${userData.position || 'Not provided'}</span>
              </div>
              <div class="info-row">
                <span class="label">📅 Signup Date:</span>
                <span>${new Date().toLocaleString()}</span>
              </div>
              <div style="margin-top: 30px; text-align: center;">
                <a href="https://mvp.forgenova.ai/admin.html" 
                   style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View in Admin Dashboard
                </a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated notification from ForgeNovaAI Admin System</p>
              <p>You can disable these notifications in Admin Dashboard → Settings → Email & Notifications</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('Admin notification sent:', emailData);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, emailId: emailData.id }));
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
};

