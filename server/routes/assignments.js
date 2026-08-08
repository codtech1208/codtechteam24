const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { createNotification } = require('./notifications');

router.use(verifyToken);

// POST /api/assignments - Assign or Reassign project (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { projectId, employeeId, assignedAmount, remarks } = req.body;

    if (!projectId || !employeeId || assignedAmount === undefined) {
      return res.status(400).json({ error: 'Project, Employee, and Assigned Amount are required.' });
    }

    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    const newEmp = await dbGet('SELECT id, name FROM users WHERE id = ? AND role = "employee"', [employeeId]);
    if (!newEmp) return res.status(404).json({ error: 'Selected employee not found or inactive.' });

    const existingAss = await dbGet(
      `SELECT a.*, u.name as prev_emp_name FROM assignments a JOIN users u ON a.employee_id = u.id WHERE a.project_id = ?`,
      [projectId]
    );

    let prevEmpName = 'None';
    if (existingAss) {
      prevEmpName = existingAss.prev_emp_name;
      // Delete old assignment
      await dbRun('DELETE FROM assignments WHERE project_id = ?', [projectId]);
    }

    // Insert new assignment
    await dbRun(
      `INSERT INTO assignments (project_id, employee_id, assigned_amount, remarks, assigned_by)
       VALUES (?, ?, ?, ?, ?)`,
      [projectId, employeeId, parseFloat(assignedAmount), remarks || '', req.user.id]
    );

    // Insert assignment history log
    await dbRun(
      `INSERT INTO assignment_history (project_id, previous_employee_name, new_employee_name, assigned_amount, remarks, changed_by_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [projectId, prevEmpName, newEmp.name, parseFloat(assignedAmount), remarks || '', req.user.name]
    );

    // Audit log
    const actionText = existingAss ? 'Project Reassigned' : 'Project Assigned';
    await dbRun(
      'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
      [req.user.id, req.user.name, actionText, `${actionText} Project #${projectId} to ${newEmp.name} (Amount: ₹${assignedAmount})`]
    );

    // Send notification to assigned employee
    await createNotification({
      userId: employeeId,
      recipientRole: 'employee',
      title: '📁 New Project Assigned',
      message: `You have been assigned to project "${project.project_name}". Assigned Payout: ₹${parseFloat(assignedAmount).toLocaleString('en-IN')}`,
      type: 'assignment',
      projectId: projectId
    });

    return res.status(200).json({ message: 'Project Assigned Successfully' });
  } catch (err) {
    console.error('Assignment error:', err);
    return res.status(500).json({ error: 'Failed to assign project.' });
  }
});

// GET /api/assignments/history/:projectId - Get assignment history for a project
router.get('/history/:projectId', requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;
    const history = await dbAll(
      `SELECT * FROM assignment_history WHERE project_id = ? ORDER BY changed_at DESC`,
      [projectId]
    );
    return res.json({ history });
  } catch (err) {
    console.error('Assignment history error:', err);
    return res.status(500).json({ error: 'Failed to fetch assignment history.' });
  }
});

// PATCH /api/assignments/:projectId/payout-status - Toggle or set employee payout status (Admin only)
router.patch('/:projectId/payout-status', requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { payoutStatus } = req.body;

    const newStatus = payoutStatus === 'Paid' ? 'Paid' : 'Unpaid';

    const assignment = await dbGet(
      `SELECT a.*, p.project_name, u.name as employee_name 
       FROM assignments a
       JOIN projects p ON a.project_id = p.id
       JOIN users u ON a.employee_id = u.id
       WHERE a.project_id = ?`,
      [projectId]
    );

    if (!assignment) {
      return res.status(404).json({ error: 'No assignment found for this project.' });
    }

    if (newStatus === 'Paid') {
      await dbRun(
        `UPDATE assignments SET payout_status = 'Paid', payout_paid_at = CURRENT_TIMESTAMP WHERE project_id = ?`,
        [projectId]
      );

      // Audit log
      await dbRun(
        'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
        [
          req.user.id,
          req.user.name,
          'Employee Payout Marked Paid',
          `Marked payout of ₹${assignment.assigned_amount} as Paid for ${assignment.employee_name} on Project #${projectId} (${assignment.project_name})`
        ]
      );

      // System notification to employee
      await createNotification({
        userId: assignment.employee_id,
        recipientRole: 'employee',
        title: '💸 Developer Payout Received!',
        message: `Your developer payout of ₹${Number(assignment.assigned_amount).toLocaleString('en-IN')} for project "${assignment.project_name}" has been marked as Paid by Admin.`,
        type: 'payout',
        projectId: projectId
      });
    } else {
      await dbRun(
        `UPDATE assignments SET payout_status = 'Unpaid', payout_paid_at = NULL WHERE project_id = ?`,
        [projectId]
      );

      await dbRun(
        'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
        [
          req.user.id,
          req.user.name,
          'Employee Payout Marked Unpaid',
          `Marked payout of ₹${assignment.assigned_amount} as Unpaid for ${assignment.employee_name} on Project #${projectId} (${assignment.project_name})`
        ]
      );
    }

    return res.json({
      message: `Employee payout marked as ${newStatus}`,
      payoutStatus: newStatus
    });
  } catch (err) {
    console.error('Update payout status error:', err);
    return res.status(500).json({ error: 'Failed to update employee payout status.' });
  }
});

module.exports = router;
