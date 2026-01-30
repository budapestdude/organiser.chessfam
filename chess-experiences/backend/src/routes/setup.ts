import express, { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcrypt';

const router = express.Router();

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
