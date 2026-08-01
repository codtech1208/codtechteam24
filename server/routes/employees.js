const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbAll, dbGet, dbRun } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Apply verifyToken to all employee endpoints
router.use(verifyToken);

// GET /api/employees - Get all employees with search & statistics (Admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `SELECT id, name, email, employee_id, role, status, phone, avatar, created_at FROM users WHERE role = 'employee'`;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ? OR employee_id LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY created_at DESC`;

    let employees = await dbAll(query, params);

    // Auto-seed default employees if table is empty
    if (employees.length === 0) {
      const empPasswordHash = await bcrypt.hash('Emp@123456', 10);
      try {
        await dbRun(
          `INSERT INTO users (name, email, employee_id, password_hash, role, status, phone) 
           VALUES (?, ?, ?, ?, 'employee', 'active', ?)`,
          ['John Doe', 'emp.john@codtech.com', 'CT-EMP-101', empPasswordHash, '+91 9123456789']
        );
        await dbRun(
          `INSERT INTO users (name, email, employee_id, password_hash, role, status, phone) 
           VALUES (?, ?, ?, ?, 'employee', 'active', ?)`,
          ['Sarah Smith', 'emp.sarah@codtech.com', 'CT-EMP-102', empPasswordHash, '+91 9988776655']
        );
        await dbRun(
          `INSERT INTO users (name, email, employee_id, password_hash, role, status, phone) 
           VALUES (?, ?, ?, ?, 'employee', 'active', ?)`,
          ['Alex Johnson', 'emp.alex@codtech.com', 'CT-EMP-103', empPasswordHash, '+91 9765432109']
        );
        employees = await dbAll(query, params);
      } catch (seedErr) {
        console.error('Employee auto-seed error:', seedErr);
      }
    }

    // Attach stats for each employee
    const enriched = await Promise.all(
      employees.map(async (emp) => {
        let stats = { total_assigned: 0, completed: 0, ongoing: 0, total_amount: 0 };
        try {
          stats = await dbGet(
            `SELECT 
              COUNT(a.id) as total_assigned,
              SUM(CASE WHEN p.status = 'Completed' THEN 1 ELSE 0 END) as completed,
              SUM(CASE WHEN p.status = 'Ongoing' THEN 1 ELSE 0 END) as ongoing,
              COALESCE(SUM(a.assigned_amount), 0) as total_amount
            FROM assignments a
            JOIN projects p ON a.project_id = p.id
            WHERE a.employee_id = ?`,
            [emp.id]
          );
        } catch (e) {
          // ignore
        }
        return {
          ...emp,
          stats: {
            assignedProjects: stats?.total_assigned || 0,
            completedProjects: stats?.completed || 0,
            ongoingProjects: stats?.ongoing || 0,
            totalAssignedAmount: stats?.total_amount || 0
          }
        };
      })
    );

    return res.json({ employees: enriched });
  } catch (err) {
    console.error('Fetch employees error:', err);
    return res.status(500).json({ error: 'Failed to fetch employees.' });
  }
});

// GET /api/employees/:id - Get single employee profile with detailed project history
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await dbGet(
      'SELECT id, name, email, employee_id, role, status, phone, avatar, created_at FROM users WHERE id = ? AND role = "employee"',
      [id]
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Projects assigned
    const projects = await dbAll(
      `SELECT p.id, p.project_type, p.total_worth, p.status, p.created_at, c.name as client_name, a.assigned_amount, a.assigned_at
       FROM assignments a
       JOIN projects p ON a.project_id = p.id
       JOIN clients c ON p.client_id = c.id
       WHERE a.employee_id = ?
       ORDER BY a.assigned_at DESC`,
      [id]
    );

    const stats = await dbGet(
      `SELECT 
        COUNT(a.id) as total_assigned,
        SUM(CASE WHEN p.status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN p.status = 'Ongoing' THEN 1 ELSE 0 END) as ongoing,
        COALESCE(SUM(a.assigned_amount), 0) as total_amount
      FROM assignments a
      JOIN projects p ON a.project_id = p.id
      WHERE a.employee_id = ?`,
      [id]
    );

    return res.json({
      employee,
      projects,
      stats: {
        assignedProjects: stats?.total_assigned || 0,
        completedProjects: stats?.completed || 0,
        ongoingProjects: stats?.ongoing || 0,
        totalAssignedAmount: stats?.total_amount || 0
      }
    });
  } catch (err) {
    console.error('Fetch employee details error:', err);
    return res.status(500).json({ error: 'Failed to fetch employee details.' });
  }
});

// POST /api/employees - Create Employee (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, employee_id, password, phone } = req.body;
    if (!name || !email || !employee_id || !password) {
      return res.status(400).json({ error: 'Name, Email, Employee ID, and Password are required.' });
    }

    // Check duplicate
    const existing = await dbGet('SELECT id FROM users WHERE email = ? OR employee_id = ?', [email.trim().toLowerCase(), employee_id.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'An employee with this Email or Employee ID already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await dbRun(
      `INSERT INTO users (name, email, employee_id, password_hash, role, status, phone)
       VALUES (?, ?, ?, ?, 'employee', 'active', ?)`,
      [name.trim(), email.trim().toLowerCase(), employee_id.trim(), passwordHash, phone ? phone.trim() : null]
    );

    // Audit Log
    try {
      await dbRun(
        'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
        [req.user.id, req.user.name, 'Employee Created', `Created employee ${name} (${employee_id})`]
      );
    } catch (e) {
      // ignore
    }

    return res.status(201).json({ message: 'Employee Created Successfully', employeeId: result.lastID });
  } catch (err) {
    console.error('Create employee error:', err);
    return res.status(500).json({ error: 'Failed to create employee.' });
  }
});

// PUT /api/employees/:id - Edit Employee (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password } = req.body;

    const emp = await dbGet('SELECT id FROM users WHERE id = ? AND role = "employee"', [id]);
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });

    if (password && password.trim().length > 0) {
      const hash = await bcrypt.hash(password, 10);
      await dbRun(
        `UPDATE users SET name = ?, email = ?, phone = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, hash, id]
      );
    } else {
      await dbRun(
        `UPDATE users SET name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, id]
      );
    }

    return res.json({ message: 'Employee Updated Successfully' });
  } catch (err) {
    console.error('Update employee error:', err);
    return res.status(500).json({ error: 'Failed to update employee.' });
  }
});

// PATCH /api/employees/:id/status - Toggle Activate/Deactivate Status (Admin only)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const emp = await dbGet('SELECT name FROM users WHERE id = ? AND role = "employee"', [id]);
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });

    await dbRun('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    return res.json({ message: `Employee status updated to ${status}` });
  } catch (err) {
    console.error('Status update error:', err);
    return res.status(500).json({ error: 'Failed to update employee status.' });
  }
});

// DELETE /api/employees/:id - Delete Employee (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const emp = await dbGet('SELECT name FROM users WHERE id = ? AND role = "employee"', [id]);
    if (!emp) return res.status(404).json({ error: 'Employee not found.' });

    await dbRun('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ message: 'Employee Deleted Successfully' });
  } catch (err) {
    console.error('Delete employee error:', err);
    return res.status(500).json({ error: 'Failed to delete employee.' });
  }
});

module.exports = router;
