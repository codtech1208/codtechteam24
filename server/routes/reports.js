const express = require('express');
const router = express.Router();
const { dbAll } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken);
router.use(requireAdmin);

// GET /api/reports - General reports data for UI table & exports
router.get('/', async (req, res) => {
  try {
    const { type } = req.query; // 'revenue', 'employee_performance', 'status', 'client', 'assignment'

    if (type === 'revenue') {
      const data = await dbAll(
        `SELECT p.id as project_id, p.project_type, p.total_worth, p.status, p.created_at,
                c.name as client_name, c.email as client_email,
                COALESCE(a.assigned_amount, 0) as employee_payout,
                (p.total_worth - COALESCE(a.assigned_amount, 0)) as net_company_profit
         FROM projects p
         JOIN clients c ON p.client_id = c.id
         LEFT JOIN assignments a ON p.id = a.project_id
         ORDER BY p.created_at DESC`
      );
      return res.json({ reportType: 'Revenue Report', data });
    }

    if (type === 'employee_performance') {
      const data = await dbAll(
        `SELECT u.id as employee_id, u.name as employee_name, u.email, u.employee_id as emp_code,
                COUNT(a.id) as total_assigned_projects,
                SUM(CASE WHEN p.status = 'Completed' THEN 1 ELSE 0 END) as completed_projects,
                SUM(CASE WHEN p.status = 'Ongoing' THEN 1 ELSE 0 END) as ongoing_projects,
                COALESCE(SUM(a.assigned_amount), 0) as total_earnings
         FROM users u
         LEFT JOIN assignments a ON u.id = a.employee_id
         LEFT JOIN projects p ON a.project_id = p.id
         WHERE u.role = 'employee'
         GROUP BY u.id`
      );
      return res.json({ reportType: 'Employee Performance Report', data });
    }

    if (type === 'client') {
      const data = await dbAll(
        `SELECT c.id as client_id, c.name as client_name, c.email, c.mobile, c.created_at,
                COUNT(p.id) as total_projects,
                COALESCE(SUM(p.total_worth), 0) as total_spent
         FROM clients c
         LEFT JOIN projects p ON c.id = p.client_id
         GROUP BY c.id`
      );
      return res.json({ reportType: 'Client Report', data });
    }

    if (type === 'assignment') {
      const data = await dbAll(
        `SELECT ah.id, ah.project_id, ah.previous_employee_name, ah.new_employee_name,
                ah.assigned_amount, ah.remarks, ah.changed_by_name, ah.changed_at,
                p.project_type, c.name as client_name
         FROM assignment_history ah
         JOIN projects p ON ah.project_id = p.id
         JOIN clients c ON p.client_id = c.id
         ORDER BY ah.changed_at DESC`
      );
      return res.json({ reportType: 'Assignment History Report', data });
    }

    // Default: Project Status Report
    const data = await dbAll(
      `SELECT p.id as project_id, p.project_type, p.total_worth, p.status, p.created_at,
              c.name as client_name,
              u.name as assigned_employee
       FROM projects p
       JOIN clients c ON p.client_id = c.id
       LEFT JOIN assignments a ON p.id = a.project_id
       LEFT JOIN users u ON a.employee_id = u.id
       ORDER BY p.created_at DESC`
    );

    return res.json({ reportType: 'Project Status Report', data });
  } catch (err) {
    console.error('Reports error:', err);
    return res.status(500).json({ error: 'Failed to generate report.' });
  }
});

module.exports = router;
