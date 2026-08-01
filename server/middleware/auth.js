const jwt = require('jsonwebtoken');
const { dbGet } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'codtech_enterprise_jwt_super_secret_key_2026!';

/**
 * Verify JWT token from Authorization header (Bearer <token>)
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch current user status from DB to ensure active
    const user = await dbGet('SELECT id, name, email, employee_id, role, status FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User no longer exists.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is deactivated. Contact Super Admin.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Middleware restricting access to Super Admin only
 */
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'super_admin') {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden. Super Admin access required.' });
}

/**
 * Middleware restricting access to Employee role
 */
function requireEmployee(req, res, next) {
  if (req.user && req.user.role === 'employee') {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden. Employee access required.' });
}

module.exports = { verifyToken, requireAdmin, requireEmployee };
