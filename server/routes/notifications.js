const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Helper function to create notifications from server code
async function createNotification({ userId = null, recipientRole = 'super_admin', title, message, type = 'general', projectId = null }) {
  try {
    await dbRun(
      `INSERT INTO notifications (user_id, recipient_role, title, message, type, project_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, recipientRole, title, message, type, projectId]
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

router.use(verifyToken);

// GET /api/notifications - Get notifications for current logged in user
router.get('/', async (req, res) => {
  try {
    const user = req.user;
    let notifications = [];

    if (user.role === 'super_admin') {
      notifications = await dbAll(
        `SELECT * FROM notifications 
         WHERE recipient_role = 'super_admin' OR user_id = ? 
         ORDER BY created_at DESC LIMIT 50`,
        [user.id]
      );
    } else {
      notifications = await dbAll(
        `SELECT * FROM notifications 
         WHERE user_id = ? OR (recipient_role = 'employee' AND (user_id IS NULL OR user_id = ?))
         ORDER BY created_at DESC LIMIT 50`,
        [user.id, user.id]
      );
    }

    const unreadCount = notifications.filter(n => !n.is_read || n.is_read === 0 || n.is_read === '0').length;

    return res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'super_admin') {
      await dbRun(`UPDATE notifications SET is_read = 1 WHERE recipient_role = 'super_admin' OR user_id = ?`, [user.id]);
    } else {
      await dbRun(`UPDATE notifications SET is_read = 1 WHERE user_id = ? OR recipient_role = 'employee'`, [user.id]);
    }
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark read-all error:', err);
    return res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
    return res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// DELETE /api/notifications/:id - Delete single notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun(`DELETE FROM notifications WHERE id = ?`, [id]);
    return res.json({ message: 'Notification deleted.' });
  } catch (err) {
    console.error('Delete notification error:', err);
    return res.status(500).json({ error: 'Failed to delete notification.' });
  }
});

module.exports = router;
module.exports.createNotification = createNotification;
