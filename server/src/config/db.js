import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connection Pool configured using DATABASE_URL from environment variables
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: connectionString,
  // Enable SSL in production environments (e.g. Render, Supabase, Neon)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Execute a SQL query using pool connection
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters for parameterized security
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Perform initial database connection test during server startup
 */
export const testDbConnection = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL environment variable is not set.');
    return false;
  }

  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log(`✅ Database connection successful!`);
    console.log(`   Connected to Database: "${res.rows[0].db_name}" at ${res.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error(`❌ Database connection failed!`);
    console.error(`   Error message: ${error.message}`);
    return false;
  }
};
