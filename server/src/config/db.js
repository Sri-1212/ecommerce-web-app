import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connection Pool configured using DATABASE_URL from environment variables
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// In-Memory Fallback Storage for local testing without PostgreSQL
const inMemoryStore = {
  users: [],
  userIdCounter: 1
};

let isPgConnected = false;

/**
 * Execute a SQL query using pool connection with in-memory fallback
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters for parameterized security
 */
export const query = async (text, params = []) => {
  if (isPgConnected) {
    return pool.query(text, params);
  }

  // Fallback for development/testing when PostgreSQL database URL is not connected
  const trimmedSql = text.trim().toUpperCase();

  if (trimmedSql.startsWith('SELECT ID FROM USERS WHERE EMAIL = $1')) {
    const email = params[0];
    const found = inMemoryStore.users.filter(u => u.email === email);
    return { rows: found.map(u => ({ id: u.id })) };
  }

  if (trimmedSql.startsWith('SELECT ID, NAME, EMAIL, PASSWORD_HASH, ROLE FROM USERS WHERE EMAIL = $1')) {
    const email = params[0];
    const found = inMemoryStore.users.filter(u => u.email === email);
    return { rows: found.map(u => ({ ...u })) };
  }

  if (trimmedSql.startsWith('SELECT ID, NAME, EMAIL, ROLE, CREATED_AT, UPDATED_AT FROM USERS WHERE ID = $1')) {
    const id = params[0];
    const found = inMemoryStore.users.filter(u => u.id === id);
    return {
      rows: found.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
        updated_at: u.updated_at
      }))
    };
  }

  if (trimmedSql.startsWith('INSERT INTO USERS')) {
    const [name, email, password_hash] = params;
    const newUser = {
      id: inMemoryStore.userIdCounter++,
      name,
      email,
      password_hash,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryStore.users.push(newUser);
    return { rows: [newUser] };
  }

  // Default fallback attempt via PostgreSQL pool
  return pool.query(text, params);
};

/**
 * Perform initial database connection test during server startup
 */
export const testDbConnection = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL environment variable is not set. Using in-memory fallback store for authentication testing.');
    isPgConnected = false;
    return false;
  }

  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log(`✅ Database connection successful!`);
    console.log(`   Connected to Database: "${res.rows[0].db_name}" at ${res.rows[0].current_time}`);
    isPgConnected = true;
    return true;
  } catch (error) {
    console.warn(`⚠️  Database connection failed! Using fallback store. (${error.message})`);
    isPgConnected = false;
    return false;
  }
};
