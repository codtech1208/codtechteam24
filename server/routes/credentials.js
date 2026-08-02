const express = require('express');
const router = express.Router();
const { dbGet, dbRun, dbAll } = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken);

// POST /api/credentials - Submit credentials (Employee or Admin for Completed Projects)
router.post('/', async (req, res) => {
  try {
    const {
      projectId,
      domainPlatform, domainEmail, domainPassword,
      hostingProvider, hostingEmail, hostingPassword,
      githubEmail, githubPassword, githubRepository
    } = req.body;

    const user = req.user;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required.' });
    }

    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    // Auto-mark project status as Completed when credentials are submitted and log to status_logs
    if (project.status !== 'Completed') {
      await dbRun(
        'INSERT INTO status_logs (project_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [projectId, project.status || 'Pending', 'Completed', user ? user.name : 'Employee']
      );
      await dbRun('UPDATE projects SET status = "Completed", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [projectId]);
    }

    // Role gate for employee
    if (user.role === 'employee') {
      const assignment = await dbGet('SELECT employee_id FROM assignments WHERE project_id = ?', [projectId]);
      if (!assignment || assignment.employee_id !== user.id) {
        return res.status(403).json({ error: 'You are not assigned to this project.' });
      }
    }

    // Encrypt sensitive passwords using AES-256-GCM
    const domainPassEnc = domainPassword ? encrypt(domainPassword) : null;
    const hostingPassEnc = hostingPassword ? encrypt(hostingPassword) : null;
    const githubPassEnc = githubPassword ? encrypt(githubPassword) : null;

    // Check existing to replace or insert
    const existing = await dbGet('SELECT id FROM project_credentials WHERE project_id = ?', [projectId]);

    if (existing) {
      await dbRun(
        `UPDATE project_credentials SET 
          domain_platform = ?, domain_email = ?, domain_password_encrypted = ?,
          hosting_provider = ?, hosting_email = ?, hosting_password_encrypted = ?,
          github_email = ?, github_password_encrypted = ?, github_repository = ?,
          submitted_at = CURRENT_TIMESTAMP, submitted_by = ?
         WHERE project_id = ?`,
        [
          domainPlatform, domainEmail, domainPassEnc,
          hostingProvider, hostingEmail, hostingPassEnc,
          githubEmail, githubPassEnc, githubRepository, user.id,
          projectId
        ]
      );
    } else {
      await dbRun(
        `INSERT INTO project_credentials (
          project_id, domain_platform, domain_email, domain_password_encrypted,
          hosting_provider, hosting_email, hosting_password_encrypted,
          github_email, github_password_encrypted, github_repository, submitted_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectId,
          domainPlatform, domainEmail, domainPassEnc,
          hostingProvider, hostingEmail, hostingPassEnc,
          githubEmail, githubPassEnc, githubRepository, user.id
        ]
      );
    }

    // Audit log
    await dbRun(
      'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
      [user.id, user.name, 'Credentials Submitted', `Submitted encrypted credentials for Project #${projectId}`]
    );

    return res.status(200).json({ message: 'Credentials Submitted Successfully' });
  } catch (err) {
    console.error('Credential submission error:', err);
    return res.status(500).json({ error: 'Failed to submit credentials.' });
  }
});

// GET /api/credentials/:projectId/decrypt - Decrypt & View credentials (Admin Only with Audit Log)
router.get('/:projectId/decrypt', requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;
    const creds = await dbGet('SELECT * FROM project_credentials WHERE project_id = ?', [projectId]);

    if (!creds) {
      return res.status(404).json({ error: 'No credentials found for this project.' });
    }

    // Decrypt AES-256 encrypted fields
    const decryptedData = {
      domainPlatform: creds.domain_platform,
      domainEmail: creds.domain_email,
      domainPassword: decrypt(creds.domain_password_encrypted),
      hostingProvider: creds.hosting_provider,
      hostingEmail: creds.hosting_email,
      hostingPassword: decrypt(creds.hosting_password_encrypted),
      githubEmail: creds.github_email,
      githubPassword: decrypt(creds.github_password_encrypted),
      githubRepository: creds.github_repository,
      submittedAt: creds.submitted_at
    };

    // Log security view event into audit table
    await dbRun(
      `INSERT INTO credential_view_logs (project_id, viewed_by) VALUES (?, ?)`,
      [projectId, req.user.name]
    );

    await dbRun(
      'INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)',
      [req.user.id, req.user.name, 'Credentials Decrypted & Viewed', `Admin viewed decrypted vault secrets for Project #${projectId}`]
    );

    return res.json({ credentials: decryptedData });
  } catch (err) {
    console.error('Credential decrypt error:', err);
    return res.status(500).json({ error: 'Failed to decrypt credentials.' });
  }
});

// GET /api/credentials/logs - Audit logs of credential views (Admin only)
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const logs = await dbAll(
      `SELECT cvl.*, p.project_type, c.name as client_name
       FROM credential_view_logs cvl
       JOIN projects p ON cvl.project_id = p.id
       JOIN clients c ON p.client_id = c.id
       ORDER BY cvl.viewed_at DESC`
    );
    return res.json({ logs });
  } catch (err) {
    console.error('Credential logs error:', err);
    return res.status(500).json({ error: 'Failed to fetch credential logs.' });
  }
});

module.exports = router;
