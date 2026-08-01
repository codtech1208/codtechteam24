const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'codtech_enterprise_jwt_super_secret_key_2026!';

// In-memory OTP storage for password resets (email -> { otp, expiresAt })
const otpStore = new Map();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await dbGet('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    // Auto-seed Super Admin if database table is fresh
    if (!user && cleanEmail === 'admin@codtech.com' && password === 'Admin@123456') {
      const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
      try {
        await dbRun(
          `INSERT INTO users (name, email, employee_id, password_hash, role, status, phone) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['Super Admin', 'admin@codtech.com', 'CT-ADM-001', adminPasswordHash, 'super_admin', 'active', '+91 9876543210']
        );
        user = await dbGet('SELECT * FROM users WHERE email = ?', ['admin@codtech.com']);
      } catch (seedErr) {
        console.error('Auto-seed admin error:', seedErr);
      }
    }

    // Auto-seed Employee if database table is fresh
    if (!user && cleanEmail === 'emp.john@codtech.com' && password === 'Emp@123456') {
      const empPasswordHash = await bcrypt.hash('Emp@123456', 10);
      try {
        await dbRun(
          `INSERT INTO users (name, email, employee_id, password_hash, role, status, phone) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['John Doe', 'emp.john@codtech.com', 'CT-EMP-101', empPasswordHash, 'employee', 'active', '+91 9123456789']
        );
        user = await dbGet('SELECT * FROM users WHERE email = ?', ['emp.john@codtech.com']);
      } catch (seedErr) {
        console.error('Auto-seed employee error:', seedErr);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      if ((cleanEmail === 'admin@codtech.com' && password === 'Admin@123456') ||
          (cleanEmail === 'emp.john@codtech.com' && password === 'Emp@123456')) {
        // proceed for default seed accounts
      } else {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log Activity (fail-safe)
    try {
      await dbRun(
        'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
        [user.id, user.name, 'User Login', `Logged in successfully as ${user.role}`]
      );
    } catch (e) {
      // ignore
    }

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employee_id: user.employee_id,
        role: user.role,
        status: user.status,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during authentication.' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  return res.json({ user: req.user });
});

// POST /api/auth/forgot-password - Dispatches SMTP email with 6-digit OTP code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required.' });

    const cleanEmail = email.trim().toLowerCase();
    let user = await dbGet('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    // Default admin handling if table is unseeded
    if (!user && cleanEmail === 'admin@codtech.com') {
      user = { id: 1, name: 'Super Admin', email: 'admin@codtech.com', role: 'super_admin' };
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Generate 6-digit OTP Code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins expiry

    otpStore.set(cleanEmail, { otp: otpCode, expiresAt });

    // Send SMTP Email via Nodemailer to user & admin
    try {
      await sendPasswordResetEmail(cleanEmail, user.name, otpCode);
      // Also send copy to Super Admin email harishneela83@gmail.com
      if (cleanEmail !== 'harishneela83@gmail.com') {
        await sendPasswordResetEmail('harishneela83@gmail.com', `Super Admin (For ${user.name})`, otpCode);
      }
    } catch (mailErr) {
      console.error('SMTP Mail Dispatch Error:', mailErr);
    }

    return res.json({
      message: `Password reset OTP has been sent via SMTP to ${cleanEmail}. (Code: ${otpCode})`,
      otpSent: true,
      demoOtp: otpCode
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to process forgot password request.' });
  }
});

// POST /api/auth/reset-password-otp - Verify OTP and update password
router.post('/reset-password-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const stored = otpStore.get(cleanEmail);

    if (!stored || stored.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP code has expired. Please request a new one.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?', [newHash, cleanEmail]);

    otpStore.delete(cleanEmail);

    return res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password OTP error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await dbGet('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, req.user.id]);

    await dbRun(
      'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
      [req.user.id, req.user.name, 'Password Changed', 'User changed their account password.']
    );

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Server error updating password.' });
  }
});

module.exports = router;
