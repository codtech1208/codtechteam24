const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { encrypt } = require('../utils/crypto');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper promises for SQLite
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize schema and seed data
async function initDatabase() {
  await dbRun('PRAGMA foreign_keys = ON;');

  // Users table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin', 'employee')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      phone TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Clients table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      mobile TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Projects table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      project_name TEXT,
      project_type TEXT NOT NULL,
      total_worth REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Ongoing' CHECK(status IN ('Ongoing', 'Completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);

  // Migration helper for existing DB: add project_name column if missing
  try {
    await dbRun('ALTER TABLE projects ADD COLUMN project_name TEXT;');
  } catch (e) {
    // Column already exists
  }

  // Assignments table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL UNIQUE,
      employee_id INTEGER NOT NULL,
      assigned_amount REAL NOT NULL DEFAULT 0,
      remarks TEXT,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_by INTEGER,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Assignment History
  await dbRun(`
    CREATE TABLE IF NOT EXISTS assignment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      previous_employee_name TEXT,
      new_employee_name TEXT NOT NULL,
      assigned_amount REAL NOT NULL,
      remarks TEXT,
      changed_by_name TEXT NOT NULL,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // Project Credentials Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS project_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL UNIQUE,
      domain_platform TEXT,
      domain_email TEXT,
      domain_password_encrypted TEXT,
      hosting_provider TEXT,
      hosting_email TEXT,
      hosting_password_encrypted TEXT,
      github_email TEXT,
      github_password_encrypted TEXT,
      github_repository TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_by INTEGER,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // Status Logs Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // Activity Logs Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Credential View Logs Table (Audit)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS credential_view_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      viewed_by TEXT NOT NULL,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  // Seed Data if Users table is empty
  const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    console.log('Seeding database with default initial data...');
    const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
    const empPasswordHash = await bcrypt.hash('Emp@123456', 10);

    // 1. Create Super Admin
    await dbRun(
      `INSERT INTO users (name, email, employee_id, password_hash, role, status, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Super Admin', 'admin@codtech.com', 'CT-ADM-001', adminPasswordHash, 'super_admin', 'active', '+91 9876543210']
    );

    // 2. Create Employees
    await dbRun(
      `INSERT INTO users (name, email, employee_id, password_hash, role, status, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['John Doe', 'emp.john@codtech.com', 'CT-EMP-101', empPasswordHash, 'employee', 'active', '+91 9123456789']
    );

    await dbRun(
      `INSERT INTO users (name, email, employee_id, password_hash, role, status, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Sarah Smith', 'emp.sarah@codtech.com', 'CT-EMP-102', empPasswordHash, 'employee', 'active', '+91 9988776655']
    );

    await dbRun(
      `INSERT INTO users (name, email, employee_id, password_hash, role, status, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Alex Johnson', 'emp.alex@codtech.com', 'CT-EMP-103', empPasswordHash, 'employee', 'active', '+91 9765432109']
    );

    // 3. Create Clients
    await dbRun(
      `INSERT INTO clients (name, email, mobile) VALUES (?, ?, ?)`,
      ['Acme Global Solutions', 'contact@acmeglobal.com', '+1 555 019 2831']
    );
    await dbRun(
      `INSERT INTO clients (name, email, mobile) VALUES (?, ?, ?)`,
      ['Nexus Retail Enterprise', 'billing@nexusretail.io', '+91 9822334455']
    );
    await dbRun(
      `INSERT INTO clients (name, email, mobile) VALUES (?, ?, ?)`,
      ['Apex Health Systems', 'admin@apexhealth.org', '+1 800 443 2190']
    );

    // 4. Create Projects
    await dbRun(
      `INSERT INTO projects (client_id, project_name, project_type, total_worth, status) VALUES (?, ?, ?, ?, ?)`,
      [1, 'Acme E-Store Portal', 'E-Commerce Website', 45000, 'Ongoing']
    );
    await dbRun(
      `INSERT INTO projects (client_id, project_name, project_type, total_worth, status) VALUES (?, ?, ?, ?, ?)`,
      [2, 'Nexus Omnichannel Suite', 'Application + Website (Android App)', 85000, 'Completed']
    );
    await dbRun(
      `INSERT INTO projects (client_id, project_name, project_type, total_worth, status) VALUES (?, ?, ?, ?, ?)`,
      [3, 'Apex Patient Portal', 'Dynamic Website', 32000, 'Ongoing']
    );
    await dbRun(
      `INSERT INTO projects (client_id, project_name, project_type, total_worth, status) VALUES (?, ?, ?, ?, ?)`,
      [1, 'Acme Mobile Hub', 'Android App + iOS App', 60000, 'Completed']
    );

    // 5. Create Assignments
    await dbRun(
      `INSERT INTO assignments (project_id, employee_id, assigned_amount, remarks, assigned_by) VALUES (?, ?, ?, ?, ?)`,
      [1, 2, 12000, 'Lead developer for frontend and store integration', 1]
    );
    await dbRun(
      `INSERT INTO assignments (project_id, employee_id, assigned_amount, remarks, assigned_by) VALUES (?, ?, ?, ?, ?)`,
      [2, 3, 25000, 'Full stack app and web backend build', 1]
    );
    await dbRun(
      `INSERT INTO assignments (project_id, employee_id, assigned_amount, remarks, assigned_by) VALUES (?, ?, ?, ?, ?)`,
      [3, 4, 9000, 'Patient portal dynamic modules implementation', 1]
    );
    await dbRun(
      `INSERT INTO assignments (project_id, employee_id, assigned_amount, remarks, assigned_by) VALUES (?, ?, ?, ?, ?)`,
      [4, 2, 18000, 'Flutter mobile app delivery', 1]
    );

    // 6. Assignment History
    await dbRun(
      `INSERT INTO assignment_history (project_id, previous_employee_name, new_employee_name, assigned_amount, remarks, changed_by_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [1, 'None', 'John Doe', 12000, 'Initial Assignment', 'Super Admin']
    );
    await dbRun(
      `INSERT INTO assignment_history (project_id, previous_employee_name, new_employee_name, assigned_amount, remarks, changed_by_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [2, 'John Doe', 'Sarah Smith', 25000, 'Reassigned due to expertise requirement', 'Super Admin']
    );

    // 7. Seed Credentials for Completed Project (Project #2)
    const domPassEnc = encrypt('NexusGodaddyPass2026!');
    const hostPassEnc = encrypt('VercelProdKey#887');
    const ghPassEnc = encrypt('GithubSecretToken99!');
    await dbRun(
      `INSERT INTO project_credentials (
        project_id, domain_platform, domain_email, domain_password_encrypted,
        hosting_provider, hosting_email, hosting_password_encrypted,
        github_email, github_password_encrypted, github_repository, submitted_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        2,
        'GoDaddy', 'domains@nexusretail.io', domPassEnc,
        'Vercel', 'deploy@nexusretail.io', hostPassEnc,
        'devs@nexusretail.io', ghPassEnc, 'https://github.com/codtech-team/nexus-portal', 3
      ]
    );

    // 8. Status Logs
    await dbRun(
      `INSERT INTO status_logs (project_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)`,
      [2, 'Ongoing', 'Completed', 'Sarah Smith']
    );
    await dbRun(
      `INSERT INTO status_logs (project_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)`,
      [4, 'Ongoing', 'Completed', 'John Doe']
    );

    // 9. Activity Logs
    await dbRun(
      `INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)`,
      [1, 'Super Admin', 'System Initialized', 'CODTECH TEAM database successfully seeded with initial records.']
    );

    console.log('Database seeding complete!');
  }
}

module.exports = { db, dbRun, dbGet, dbAll, initDatabase };
