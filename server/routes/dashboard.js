const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken);

// GET /api/dashboard/admin - Super Admin Dashboard Statistics & Charts
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    // 1. KPI Metrics
    const totalProjectsRow = await dbGet('SELECT COUNT(*) as count FROM projects');
    const completedProjectsRow = await dbGet("SELECT COUNT(*) as count FROM projects WHERE status = 'Completed'");
    const ongoingProjectsRow = await dbGet("SELECT COUNT(*) as count FROM projects WHERE status = 'Ongoing'");
    const totalRevenueRow = await dbGet('SELECT COALESCE(SUM(total_worth), 0) as total FROM projects');
    const totalPayoutRow = await dbGet('SELECT COALESCE(SUM(assigned_amount), 0) as total FROM assignments');
    const totalEmployeesRow = await dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'employee' AND status = 'active'");
    const totalClientsRow = await dbGet('SELECT COUNT(*) as count FROM clients');

    const metrics = {
      totalProjects: totalProjectsRow.count || 0,
      completedProjects: completedProjectsRow.count || 0,
      ongoingProjects: ongoingProjectsRow.count || 0,
      totalRevenue: totalRevenueRow.total || 0,
      totalEmployeePayout: totalPayoutRow.total || 0,
      totalEmployees: totalEmployeesRow.count || 0,
      totalClients: totalClientsRow.count || 0
    };

    // 2. Charts Data

    // Chart: Projects by Status
    const projectsByStatus = [
      { name: 'Ongoing', count: metrics.ongoingProjects, fill: '#FF6B00' },
      { name: 'Completed', count: metrics.completedProjects, fill: '#10B981' }
    ];

    // Chart: Project Types Distribution
    const typesData = await dbAll(
      `SELECT project_type as name, COUNT(*) as value FROM projects GROUP BY project_type`
    );

    // Chart: Employee Performance
    const empPerformance = await dbAll(
      `SELECT u.name as employee_name,
              COUNT(a.id) as assigned,
              SUM(CASE WHEN p.status = 'Completed' THEN 1 ELSE 0 END) as completed,
              SUM(CASE WHEN p.status = 'Ongoing' THEN 1 ELSE 0 END) as ongoing,
              COALESCE(SUM(a.assigned_amount), 0) as payout
       FROM users u
       LEFT JOIN assignments a ON u.id = a.employee_id
       LEFT JOIN projects p ON a.project_id = p.id
       WHERE u.role = 'employee' AND u.status = 'active'
       GROUP BY u.id`
    );

    // Chart: Revenue by Project Type
    const revenueByType = await dbAll(
      `SELECT project_type as name, SUM(total_worth) as revenue FROM projects GROUP BY project_type`
    );

    // 3. Feeds / Recent Activity
    const recentClients = await dbAll('SELECT * FROM clients ORDER BY created_at DESC LIMIT 5');
    const recentProjects = await dbAll(
      `SELECT p.*, c.name as client_name, u.name as assigned_employee
       FROM projects p
       JOIN clients c ON p.client_id = c.id
       LEFT JOIN assignments a ON p.id = a.project_id
       LEFT JOIN users u ON a.employee_id = u.id
       ORDER BY p.created_at DESC LIMIT 5`
    );
    const recentAssignments = await dbAll(
      `SELECT ah.*, p.project_type, c.name as client_name
       FROM assignment_history ah
       JOIN projects p ON ah.project_id = p.id
       JOIN clients c ON p.client_id = c.id
       ORDER BY ah.changed_at DESC LIMIT 5`
    );

    return res.json({
      metrics,
      charts: {
        projectsByStatus,
        projectTypes: typesData,
        employeePerformance: empPerformance,
        revenueByType
      },
      feeds: {
        recentClients,
        recentProjects,
        recentAssignments
      }
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ error: 'Failed to load dashboard metrics.' });
  }
});

// GET /api/dashboard/employee - Employee Dashboard
router.get('/employee', async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await dbGet(
      `SELECT 
        COUNT(a.id) as total_assigned,
        SUM(CASE WHEN p.status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN p.status = 'Ongoing' THEN 1 ELSE 0 END) as ongoing,
        COALESCE(SUM(a.assigned_amount), 0) as total_payout
      FROM assignments a
      JOIN projects p ON a.project_id = p.id
      WHERE a.employee_id = ?`,
      [userId]
    );

    const assignedProjects = await dbAll(
      `SELECT p.id, p.project_type, p.total_worth, p.status, p.created_at,
              c.name as client_name, c.email as client_email, c.mobile as client_mobile,
              a.assigned_amount, a.remarks, a.assigned_at,
              (SELECT COUNT(*) FROM project_credentials pc WHERE pc.project_id = p.id) as has_credentials
       FROM assignments a
       JOIN projects p ON a.project_id = p.id
       JOIN clients c ON p.client_id = c.id
       WHERE a.employee_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return res.json({
      metrics: {
        assignedProjects: stats.total_assigned || 0,
        completedProjects: stats.completed || 0,
        ongoingProjects: stats.ongoing || 0,
        totalAssignedPayment: stats.total_payout || 0
      },
      projects: assignedProjects
    });
  } catch (err) {
    console.error('Employee dashboard error:', err);
    return res.status(500).json({ error: 'Failed to load employee dashboard.' });
  }
});

module.exports = router;
