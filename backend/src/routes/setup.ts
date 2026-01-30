import express, { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcrypt';
import { execSync } from 'child_process';
import path from 'path';

const router = express.Router();

// Quick fix for missing columns
router.post('/fix-schema', async (req: Request, res: Response) => {
  try {
    const fixes = [];

    // Add last_active_at column if missing
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      fixes.push('Added last_active_at column');
    } catch (e: any) {
      if (e.code !== '42701') fixes.push(`last_active_at: ${e.message}`);
    }

    // Add other potentially missing columns
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`);
      fixes.push('Added is_admin column');
    } catch (e: any) {
      if (e.code !== '42701') fixes.push(`is_admin: ${e.message}`);
    }

    try {
      await pool.query(`ALTER TABLE communities ADD COLUMN IF NOT EXISTS parent_bubble VARCHAR(50)`);
      fixes.push('Added parent_bubble column');
    } catch (e: any) {
      if (e.code !== '42701') fixes.push(`parent_bubble: ${e.message}`);
    }

    res.json({ success: true, fixes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run database migrations
router.post('/run-migrations', async (req: Request, res: Response) => {
  try {
    const setupPath = path.join(__dirname, '../../setup-db.js');
    console.log('[Setup] Running migrations from:', setupPath);
    console.log('[Setup] Current directory:', __dirname);

    const output = execSync(`node "${setupPath}"`, {
      cwd: path.join(__dirname, '../..'),
      encoding: 'utf8',
      timeout: 120000,
    });

    console.log('[Setup] Migration output:', output);
    res.json({ success: true, message: 'Migrations completed', output });
  } catch (error: any) {
    console.error('[Setup] Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    });
  }
});

// ONE-TIME SETUP ENDPOINT - REMOVE AFTER USE
router.post('/create-admin', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, is_admin)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, name, email, is_admin, created_at`,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Admin user created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Failed to create admin user' });
  }
});

// Make existing user admin
router.post('/make-admin', async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET is_admin = TRUE WHERE id = $1 RETURNING id, name, email, is_admin',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User is now an admin',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({ message: 'Failed to make user admin' });
  }
});

export default router;
