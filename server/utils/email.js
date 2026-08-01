const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'harishneela83@gmail.com';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || 'jiuxgqhwactiqolr';
const SMTP_FROM = process.env.SMTP_FROM || '"CODTECH TEAM <harishneela83@gmail.com>"';

// Transporter instance
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // TLS 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD
  }
});

/**
 * Send Password Reset Email with Direct Link & OTP Code
 */
async function sendPasswordResetEmail(toEmail, userName, otpCode, resetToken) {
  const domain = 'https://codtechteam.com';
  const resetLink = `${domain}/#/reset-password?email=${encodeURIComponent(toEmail)}&token=${resetToken}`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #FF6B00; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">
          CODTECH TEAM
        </div>
        <p style="color: #64748b; font-size: 13px; margin-top: 6px; font-weight: 500;">Enterprise Internal System</p>
      </div>

      <div style="background-color: white; padding: 32px; border-radius: 12px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Hello <strong>${userName}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">We received a request to reset your password for your <strong>CODTECH TEAM Enterprise</strong> account.</p>

        <!-- Big Clickable Button -->
        <div style="margin: 28px 0; text-align: center;">
          <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #FF6B00 0%, #ea580c 100%); color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(255, 107, 0, 0.3);">
            👉 CLICK HERE TO RESET YOUR PASSWORD
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; margin-bottom: 24px;">
          Or copy & paste this link in your browser:<br/>
          <a href="${resetLink}" style="color: #ea580c; word-break: break-all;">${resetLink}</a>
        </p>

        <!-- 6-digit OTP section -->
        <div style="margin-top: 24px; padding: 16px; background-color: #fff7ed; border: 1px dashed #fdba74; border-radius: 12px; text-align: center;">
          <p style="color: #c2410c; font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">Alternatively, use this 6-digit OTP code:</p>
          <span style="font-family: monospace; font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #ea580c;">${otpCode}</span>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you did not request a password reset, please ignore this email or notify your Super Admin immediately.</p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} CODTECH TEAM Enterprise Portal. All rights reserved.
      </div>
    </div>
  `;

  return await transporter.sendMail({
    from: SMTP_FROM,
    to: toEmail,
    subject: `🔗 Password Reset Link for CODTECH TEAM (${userName})`,
    html: htmlContent
  });
}

module.exports = { transporter, sendPasswordResetEmail };
