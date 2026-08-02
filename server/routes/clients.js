const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken);

// GET /api/clients - List all clients with search (Admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT c.*, 
        COUNT(p.id) as total_projects,
        SUM(CASE WHEN p.status = 'Completed' THEN 1 ELSE 0 END) as completed_projects,
        COALESCE(SUM(p.total_worth), 0) as total_spent,
        COALESCE(SUM(p.advance_amount), 0) as total_advance_received,
        COALESCE(SUM(p.advance_amount + p.received_amount), 0) as total_received_payment,
        COALESCE(SUM(CASE WHEN (p.total_worth - (p.advance_amount + p.received_amount)) > 0 THEN (p.total_worth - (p.advance_amount + p.received_amount)) ELSE 0 END), 0) as total_due_amount
      FROM clients c
      LEFT JOIN projects p ON c.id = p.client_id
    `;
    const params = [];

    if (search) {
      query += ` WHERE (c.name LIKE ? OR c.email LIKE ? OR c.mobile LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` GROUP BY c.id, c.name, c.email, c.mobile, c.created_at, c.updated_at ORDER BY c.created_at DESC`;

    const clients = await dbAll(query, params);
    return res.json({ clients });
  } catch (err) {
    console.error('Fetch clients error:', err);
    return res.status(500).json({ error: 'Failed to fetch clients.' });
  }
});

// GET /api/clients/:id - Get client details & complete assigned project history
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await dbGet('SELECT * FROM clients WHERE id = ?', [id]);
    if (!client) return res.status(404).json({ error: 'Client not found.' });

    const projects = await dbAll(
      `SELECT p.id, p.project_name, p.project_type, p.total_worth, p.advance_amount, p.received_amount, p.status, COALESCE(p.payment_status, 'Unpaid') as payment_status, p.created_at, p.updated_at,
              u.id as employee_id, u.name as assigned_employee, u.email as assigned_employee_email, u.employee_id as assigned_employee_code,
              a.assigned_amount, a.remarks as assignment_remarks, a.assigned_at
       FROM projects p
       LEFT JOIN assignments a ON p.id = a.project_id
       LEFT JOIN users u ON a.employee_id = u.id
       WHERE p.client_id = ?
       ORDER BY p.created_at DESC`,
      [id]
    );

    for (let p of projects) {
      const txs = await dbAll(
        `SELECT id, amount, payment_type, remarks, recorded_by, created_at FROM payment_transactions WHERE project_id = ? ORDER BY created_at ASC`,
        [p.id]
      );
      p.transactions = txs || [];
    }

    // Compute aggregates so frontend Portfolio Value shows correctly
    const total_spent = projects.reduce((sum, p) => sum + parseFloat(p.total_worth || 0), 0);
    const total_received_payment = projects.reduce((sum, p) => sum + parseFloat(p.advance_amount || 0) + parseFloat(p.received_amount || 0), 0);
    const total_due_amount = Math.max(0, total_spent - total_received_payment);
    const total_projects = projects.length;
    const completed_projects = projects.filter(p => p.status === 'Completed').length;

    const enrichedClient = {
      ...client,
      total_spent,
      total_received_payment,
      total_due_amount,
      total_projects,
      completed_projects
    };

    return res.json({ client: enrichedClient, projects });
  } catch (err) {
    console.error('Fetch client detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch client detail.' });
  }
});

// POST /api/clients - Create Client
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, mobile } = req.body;
    if (!name || !email || !mobile) {
      return res.status(400).json({ error: 'Client Name, Email, and Mobile number are required.' });
    }

    const result = await dbRun(
      `INSERT INTO clients (name, email, mobile) VALUES (?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), mobile.trim()]
    );

    await dbRun(
      'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
      [req.user.id, req.user.name, 'Client Created', `Created client ${name}`]
    );

    return res.status(201).json({ message: 'Client Created Successfully', clientId: result.lastID });
  } catch (err) {
    console.error('Create client error:', err);
    return res.status(500).json({ error: 'Failed to create client.' });
  }
});

// PUT /api/clients/:id - Edit Client
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile } = req.body;

    const client = await dbGet('SELECT name FROM clients WHERE id = ?', [id]);
    if (!client) return res.status(404).json({ error: 'Client not found.' });

    await dbRun(
      `UPDATE clients SET name = ?, email = ?, mobile = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name.trim(), email.trim().toLowerCase(), mobile.trim(), id]
    );

    await dbRun(
      'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
      [req.user.id, req.user.name, 'Client Updated', `Updated details for client ${name}`]
    );

    return res.json({ message: 'Client Updated Successfully' });
  } catch (err) {
    console.error('Update client error:', err);
    return res.status(500).json({ error: 'Failed to update client.' });
  }
});

// DELETE /api/clients/:id - Delete Client
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await dbGet('SELECT name FROM clients WHERE id = ?', [id]);
    if (!client) return res.status(404).json({ error: 'Client not found.' });

    await dbRun('DELETE FROM clients WHERE id = ?', [id]);

    await dbRun(
      'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
      [req.user.id, req.user.name, 'Client Deleted', `Deleted client ${client.name}`]
    );

    return res.json({ message: 'Client Deleted Successfully' });
  } catch (err) {
    console.error('Delete client error:', err);
    return res.status(500).json({ error: 'Failed to delete client.' });
  }
});

module.exports = router;
