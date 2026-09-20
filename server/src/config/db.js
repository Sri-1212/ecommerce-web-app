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

/**
 * Execute a SQL query directly using the PostgreSQL pool connection.
 * Single database source of truth - no in-memory fallback store.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters for parameterized security
 */
export const query = (text, params = []) => {
  return pool.query(text, params);
};

/**
 * Perform initial database connection test during server startup.
 * Logs connection status and database details without falling back to fake memory.
 */
export const testDbConnection = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL environment variable is not configured.');
    return false;
  }

  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log(`✅ Database connection successful!`);
    console.log(`   Connected to Database: "${res.rows[0].db_name}" at ${res.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Database connection failed: ${error.message}`);
    return false;
  }
};
