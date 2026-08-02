const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken);

// GET /api/projects - Search, Filter, Sort, Pagination
router.get('/', async (req, res) => {
  try {
    const { search, status, projectType, sortBy, order, page = 1, limit = 10 } = req.query;
    const user = req.user;

    // For employees, omit total_worth for strict privacy (company revenue hidden)
    const selectTotalWorth = user.role === 'super_admin' ? 'p.total_worth' : '0 as total_worth';

    let query = `
      SELECT p.id, p.project_name, p.project_type, ${selectTotalWorth}, p.advance_amount, p.received_amount, p.status, COALESCE(p.payment_status, 'Unpaid') as payment_status, p.created_at, p.updated_at,
             c.id as client_id, c.name as client_name, c.email as client_email, c.mobile as client_mobile,
             u.id as assigned_employee_id, u.name as assigned_employee_name, u.employee_id as assigned_employee_code,
             a.assigned_amount, a.assigned_at, a.remarks as assignment_remarks,
             (SELECT COUNT(*) FROM project_credentials pc WHERE pc.project_id = p.id) as has_credentials
      FROM projects p
      JOIN clients c ON p.client_id = c.id
      LEFT JOIN assignments a ON p.id = a.project_id
      LEFT JOIN users u ON a.employee_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Role gate: Employees only see assigned projects
    if (user.role === 'employee') {
      query += ` AND a.employee_id = ?`;
      params.push(user.id);
    }

    // Filter status
    if (status && status !== 'all') {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    // Filter project type
    if (projectType && projectType !== 'all') {
      query += ` AND (p.project_type LIKE ? OR p.project_name LIKE ?)`;
      params.push(`%${projectType}%`, `%${projectType}%`);
    }

    // Search term
    if (search) {
      query += ` AND (p.project_name LIKE ? OR c.name LIKE ? OR c.email LIKE ? OR p.project_type LIKE ? OR u.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    // Sorting
    const sortColumnMap = {
      created_at: 'p.created_at',
      total_worth: 'p.total_worth',
      status: 'p.status',
      client_name: 'c.name',
      project_name: 'p.project_name'
    };
    const sortCol = sortColumnMap[sortBy] || 'p.created_at';
    const sortOrder = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortCol} ${sortOrder}`;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Get total count first with derived table alias for MySQL compatibility
    const countSql = `SELECT COUNT(*) as count FROM (${query}) AS subquery_alias`;
    const totalRow = await dbGet(countSql, params);
    const totalRecords = totalRow ? totalRow.count : 0;

    const dataQuery = `${query} LIMIT ${limitNum} OFFSET ${offset}`;
    const projects = await dbAll(dataQuery, params);

    return res.json({
      projects,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error('Fetch projects error:', err);
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// GET /api/projects/:id - Full details with 7 sections/tabs
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const selectTotalWorth = user.role === 'super_admin' ? 'p.total_worth' : '0 as total_worth';

    const project = await dbGet(
      `SELECT p.id, p.client_id, p.project_name, p.project_type, ${selectTotalWorth}, p.status, COALESCE(p.payment_status, 'Unpaid') as payment_status, p.created_at, p.updated_at,
              c.name as client_name, c.email as client_email, c.mobile as client_mobile
       FROM projects p
       JOIN clients c ON p.client_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (!project) return res.status(404).json({ error: 'Project not found.' });

    // Assignment info
    const assignment = await dbGet(
      `SELECT a.*, u.name as employee_name, u.email as employee_email, u.employee_id as employee_code
       FROM assignments a
       JOIN users u ON a.employee_id = u.id
       WHERE a.project_id = ?`,
      [id]
    );

    // Employee access check
    if (user.role === 'employee' && (!assignment || assignment.employee_id !== user.id)) {
      return res.status(403).json({ error: 'Access denied to this project.' });
    }

    // Assignment History
    const assignmentHistory = await dbAll(
      `SELECT * FROM assignment_history WHERE project_id = ? ORDER BY changed_at DESC`,
      [id]
    );

    // Status Logs
    const statusLogs = await dbAll(
      `SELECT * FROM status_logs WHERE project_id = ? ORDER BY changed_at DESC`,
      [id]
    );

    // Activity Logs
    const activityLogs = await dbAll(
      `SELECT * FROM activity_logs WHERE details LIKE ? ORDER BY created_at DESC LIMIT 20`,
      [`%Project #${id}%`]
    );

    // Credentials status metadata
    const credentials = await dbGet(
      `SELECT id, domain_platform, hosting_provider, github_repository, submitted_at
       FROM project_credentials WHERE project_id = ?`,
      [id]
    );

    return res.json({
      project,
      assignment,
      assignmentHistory,
      statusLogs,
      activityLogs,
      hasCredentials: !!credentials,
      credentialsMetadata: credentials || null
    });
  } catch (err) {
    console.error('Fetch project detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch project details.' });
  }
});

// POST /api/projects - Create & Assign Project (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { projectName, clientName, clientEmail, clientMobile, projectType, totalWorth, advanceAmount, employeeId, assignedAmount, remarks } = req.body;

    if (!clientName || !clientEmail || !clientMobile || !projectType || totalWorth === undefined) {
      return res.status(400).json({ error: 'Client Name, Email, Mobile, Project Type, and Total Worth are required.' });
    }

    let client = await dbGet('SELECT id FROM clients WHERE email = ?', [clientEmail.trim().toLowerCase()]);
    let clientId;
    if (!client) {
      const clientRes = await dbRun(
        'INSERT INTO clients (name, email, mobile) VALUES (?, ?, ?)',
        [clientName.trim(), clientEmail.trim().toLowerCase(), clientMobile.trim()]
      );
      clientId = clientRes.lastID;
    } else {
      clientId = client.id;
    }

    const projNameStr = projectName ? projectName.trim() : `${clientName.trim()} Project`;
    const advAmt = parseFloat(advanceAmount || 0);
    const totWorth = parseFloat(totalWorth || 0);
    const initPaymentStatus = advAmt >= totWorth && totWorth > 0 ? 'Paid' : (advAmt > 0 ? 'Partially Paid' : 'Unpaid');

    const projRes = await dbRun(
      `INSERT INTO projects (client_id, project_name, project_type, total_worth, advance_amount, received_amount, status, payment_status) VALUES (?, ?, ?, ?, ?, 0, 'Pending', ?)`,
      [clientId, projNameStr, projectType, totWorth, advAmt, initPaymentStatus]
    );
    const projectId = projRes.lastID;

    // Record initial creation in status_logs
    await dbRun(
      'INSERT INTO status_logs (project_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
      [projectId, 'None', 'Pending', req.user ? req.user.name : 'Super Admin']
    );

    if (employeeId) {
      const emp = await dbGet('SELECT name FROM users WHERE id = ? AND role = "employee"', [employeeId]);
      if (emp) {
        await dbRun(
          `INSERT INTO assignments (project_id, employee_id, assigned_amount, remarks, assigned_by)
           VALUES (?, ?, ?, ?, ?)`,
          [projectId, employeeId, parseFloat(assignedAmount || 0), remarks || 'Assigned on project creation', req.user.id]
        );

        await dbRun(
          `INSERT INTO assignment_history (project_id, previous_employee_name, new_employee_name, assigned_amount, remarks, changed_by_name)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [projectId, 'None', emp.name, parseFloat(assignedAmount || 0), remarks || 'Assigned on project creation', req.user.name]
        );
      }
    }

    return res.status(201).json({ message: 'Project Created & Assigned Successfully', projectId });
  } catch (err) {
    console.error('Create project error:', err);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
});

// PUT /api/projects/:id - Edit Project (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { projectName, projectType, totalWorth, advanceAmount, receivedAmount, status, paymentStatus, employeeId, assignedAmount, remarks } = req.body;

    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    if (status && status !== project.status) {
      await dbRun(
        'INSERT INTO status_logs (project_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [id, project.status, status, req.user.name]
      );
    }

    const advAmt = advanceAmount !== undefined && advanceAmount !== '' ? parseFloat(advanceAmount) : (project.advance_amount || 0);
    const recAmt = receivedAmount !== undefined && receivedAmount !== '' ? parseFloat(receivedAmount) : (project.received_amount || 0);
    const totWorth = parseFloat(totalWorth !== undefined ? totalWorth : project.total_worth);
    const totalRec = advAmt + recAmt;
    const payStatus = totalRec >= totWorth && totWorth > 0 ? 'Paid' : (totalRec > 0 ? 'Partially Paid' : (paymentStatus || project.payment_status || 'Unpaid'));

    await dbRun(
      `UPDATE projects SET project_name = ?, project_type = ?, total_worth = ?, advance_amount = ?, received_amount = ?, status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        projectName || project.project_name,
        projectType || project.project_type,
        totWorth,
        advAmt,
        recAmt,
        status || project.status,
        payStatus,
        id
      ]
    );

    if (employeeId) {
      const emp = await dbGet('SELECT id, name FROM users WHERE id = ? AND role = "employee"', [employeeId]);
      if (emp) {
        const existingAss = await dbGet(
          `SELECT a.*, u.name as prev_emp_name FROM assignments a JOIN users u ON a.employee_id = u.id WHERE a.project_id = ?`,
          [id]
        );

        let prevEmpName = 'None';
        if (existingAss) {
          prevEmpName = existingAss.prev_emp_name;
          await dbRun('DELETE FROM assignments WHERE project_id = ?', [id]);
        }

        await dbRun(
          `INSERT INTO assignments (project_id, employee_id, assigned_amount, remarks, assigned_by)
           VALUES (?, ?, ?, ?, ?)`,
          [id, employeeId, parseFloat(assignedAmount || 0), remarks || 'Updated assignment', req.user.id]
        );
      }
    }

    return res.json({ message: 'Project Details & Assignment Updated Successfully' });
  } catch (err) {
    console.error('Update project error:', err);
    return res.status(500).json({ error: 'Failed to update project.' });
  }
});

// PATCH /api/projects/:id/payment-status - Super Admin toggle Paid / Unpaid
router.patch('/:id/payment-status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['Paid', 'Unpaid'].includes(paymentStatus)) {
      return res.status(400).json({ error: "Invalid payment status. Must be 'Paid' or 'Unpaid'." });
    }

    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    const recAmt = paymentStatus === 'Paid' ? Math.max(0, parseFloat(project.total_worth || 0) - parseFloat(project.advance_amount || 0)) : 0;
    await dbRun(`UPDATE projects SET payment_status = ?, received_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [paymentStatus, recAmt, id]);

    return res.json({ message: `Project #${id} payment status updated to ${paymentStatus}` });
  } catch (err) {
    console.error('Payment status update error:', err);
    return res.status(500).json({ error: 'Failed to update payment status.' });
  }
});

// POST /api/projects/:id/receive-payment - Record/update received payment from client (Admin only)
router.post('/:id/receive-payment', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedAmount } = req.body;

    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    const newSubsequentReceived = parseFloat(receivedAmount || 0);
    const advAmount = parseFloat(project.advance_amount || 0);
    const totalWorth = parseFloat(project.total_worth || 0);
    const totalReceived = advAmount + newSubsequentReceived;
    const newStatus = totalReceived >= totalWorth && totalWorth > 0 ? 'Paid' : (totalReceived > 0 ? 'Partially Paid' : 'Unpaid');

    await dbRun(
      `UPDATE projects SET received_amount = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newSubsequentReceived, newStatus, id]
    );

    await dbRun(
      'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
      [req.user.id, req.user.name, 'Payment Received Updated', `Updated Project #${id} received payment. Advance: ₹${advAmount}, Further: ₹${newSubsequentReceived}, Total Received: ₹${totalReceived}`]
    );

    return res.json({ message: `Payment Received Updated Successfully. Total Received: ₹${totalReceived.toLocaleString('en-IN')}, Due: ₹${Math.max(0, totalWorth - totalReceived).toLocaleString('en-IN')}` });
  } catch (err) {
    console.error('Receive payment error:', err);
    return res.status(500).json({ error: 'Failed to update payment.' });
  }
});

// PATCH /api/projects/:id/status - Employee / Admin status workflow update
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    if (status && status !== project.status) {
      await dbRun(
        'INSERT INTO status_logs (project_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [id, project.status || 'Pending', status, user ? user.name : 'System']
      );
    }

    await dbRun(`UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);
    return res.json({ message: `Status Updated Successfully to '${status}'` });
  } catch (err) {
    console.error('Status update error:', err);
    return res.status(500).json({ error: 'Failed to update status.' });
  }
});

// DELETE /api/projects/:id - Delete Project (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await dbGet('SELECT id FROM projects WHERE id = ?', [id]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    await dbRun('DELETE FROM projects WHERE id = ?', [id]);
    return res.json({ message: 'Project Deleted Successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    return res.status(500).json({ error: 'Failed to delete project.' });
  }
});

module.exports = router;
