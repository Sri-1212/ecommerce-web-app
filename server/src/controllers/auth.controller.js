import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

// Simple email regex for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register User Controller
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation: missing or invalid fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation error: Name must be at least 2 characters long.'
      });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation error: A valid email address is required.'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation error: Password must be at least 6 characters long.'
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Check for existing user with duplicate email
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        statusCode: 409,
        message: 'Email address is already registered.'
      });
    }

    // 4. Hash password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Insert new user with default role = 'user'
    const newUser = await query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, 'user') 
       RETURNING id, name, email, role, created_at, updated_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = newUser.rows[0];

    // 6. Return success response (excluding password_hash)
    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'User registered successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login User Controller
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation error: Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Database lookup
    const userResult = await query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      // Generic message to avoid email enumeration
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Invalid email or password.'
      });
    }

    const user = userResult.rows[0];

    // Verify password with bcrypt
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'default_jwt_secret_dev_only';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current User Details Controller
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const userResult = await query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'User profile not found.'
      });
    }

    const user = userResult.rows[0];

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
