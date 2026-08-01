const express = require('express');
const router = express.Router();
const { dbAll } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken);
router.use(requireAdmin);

// GET /api/logs/activity - Audit trail of system activities
router.get('/activity', async (req, res) => {
  try {
    const logs = await dbAll(
      `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100`
    );
    return res.json({ logs });
  } catch (err) {
    console.error('Fetch activity logs error:', err);
    return res.status(500).json({ error: 'Failed to fetch activity logs.' });
  }
});

module.exports = router;
