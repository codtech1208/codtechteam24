const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Hostinger Remote MySQL Configuration with Resilient Default Fallbacks
const DB_HOST = process.env.DB_HOST || 'srv1827.hstgr.io';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'u909011072_codtech_user';
const DB_PASS = process.env.DB_PASS || 'Cod@1208';
const DB_NAME = process.env.DB_NAME || 'u909011072_codtech_db';

let mysqlPool = null;
let useMySQL = false;

if (DB_HOST && DB_USER && DB_NAME) {
  try {
    mysqlPool = mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 8000
    });
    useMySQL = true;
    console.log(`Connected to Hostinger Remote MySQL Cloud Database at ${DB_HOST} (${DB_NAME})`);
  } catch (err) {
    console.error('Failed to initialize MySQL pool, using SQLite:', err);
    useMySQL = false;
  }
}

// SQLite Local Backup
const dbPath = path.resolve(__dirname, '../database.sqlite');
const sqliteDb = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// SQLite Promise Helpers
const runSqliteRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const runSqliteGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const runSqliteAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Universal Database Query Helpers with Safe Auto-Failover
const dbRun = async (sql, params = []) => {
  if (useMySQL && mysqlPool) {
    try {
      let mySqlStatement = sql
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
        .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        .replace(/BOOLEAN/gi, 'TINYINT(1)')
        .replace(/TEXT/gi, 'VARCHAR(255)');

      const [result] = await mysqlPool.execute(mySqlStatement, params);
      return { lastID: result.insertId, changes: result.affectedRows };
    } catch (err) {
      console.warn('MySQL dbRun fallback to SQLite:', err.message);
      useMySQL = false;
      return runSqliteRun(sql, params);
    }
  }

  return runSqliteRun(sql, params);
};

const dbGet = async (sql, params = []) => {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.execute(sql, params);
      return rows[0] || null;
    } catch (err) {
      console.warn('MySQL dbGet fallback to SQLite:', err.message);
      useMySQL = false;
      return runSqliteGet(sql, params);
    }
  }

  return runSqliteGet(sql, params);
};

const dbAll = async (sql, params = []) => {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.execute(sql, params);
      return rows;
    } catch (err) {
      console.warn('MySQL dbAll fallback to SQLite:', err.message);
      useMySQL = false;
      return runSqliteAll(sql, params);
    }
  }

  return runSqliteAll(sql, params);
};

// Initialize schema and seed data in Hostinger Remote MySQL Database
async function initDatabase() {
  try {
    if (!useMySQL) {
      await runSqliteRun('PRAGMA foreign_keys = ON;');
    }

    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        employee_id VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        phone VARCHAR(50),
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Clients table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Projects table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        project_name VARCHAR(255),
        project_type VARCHAR(255) NOT NULL,
        total_worth DOUBLE NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'Ongoing',
        payment_status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Assignments table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL UNIQUE,
        employee_id INT NOT NULL,
        assigned_amount DOUBLE NOT NULL DEFAULT 0,
        remarks VARCHAR(255),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INT
      );
    `);

    // Assignment History
    await dbRun(`
      CREATE TABLE IF NOT EXISTS assignment_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        previous_employee_name VARCHAR(255),
        new_employee_name VARCHAR(255) NOT NULL,
        assigned_amount DOUBLE NOT NULL,
        remarks VARCHAR(255),
        changed_by_name VARCHAR(255) NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Project Credentials Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS project_credentials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL UNIQUE,
        domain_platform VARCHAR(255),
        domain_email VARCHAR(255),
        domain_password_encrypted VARCHAR(255),
        hosting_provider VARCHAR(255),
        hosting_email VARCHAR(255),
        hosting_password_encrypted VARCHAR(255),
        github_email VARCHAR(255),
        github_password_encrypted VARCHAR(255),
        github_repository VARCHAR(255),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_by INT
      );
    `);

    // Status Logs Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS status_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        old_status VARCHAR(50) NOT NULL,
        new_status VARCHAR(50) NOT NULL,
        changed_by VARCHAR(255) NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Activity Logs Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        user_name VARCHAR(255),
        action VARCHAR(255) NOT NULL,
        details VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Credential View Logs Table (Audit)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS credential_view_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        viewed_by VARCHAR(255) NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Data if Users table is empty
    const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
    if (!userCount || userCount.count === 0 || userCount.count === '0') {
      console.log('Seeding database with default initial data...');
      const adminPasswordHash = await bcrypt.hash('9989551305', 10);
      const empPasswordHash = await bcrypt.hash('Emp@123456', 10);

      // 1. Create Super Admin
      await dbRun(
        `INSERT INTO users (name, email, employee_id, password_hash, role, status, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Harish Neela (Super Admin)', 'harishneela83@gmail.com', 'CT-ADM-001', adminPasswordHash, 'super_admin', 'active', '+91 9989551305']
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

      console.log('Database seeding complete!');
    }
  } catch (err) {
    console.error('Error during init database:', err);
  }
}

module.exports = { db: sqliteDb, dbRun, dbGet, dbAll, initDatabase };
