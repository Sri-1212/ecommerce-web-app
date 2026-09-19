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
  userIdCounter: 1,
  products: [
    {
      id: 1,
      name: 'Wireless Noise-Canceling Headphones',
      description: 'High-fidelity audio with active noise cancellation and 30-hour battery life.',
      price: 199.99,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      category: 'Electronics',
      stock: 25,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Ergonomic Mechanical Keyboard',
      description: 'Customizable RGB backlighting with hot-swappable tactile mechanical switches.',
      price: 129.50,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
      category: 'Electronics',
      stock: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'UltraWide 4K Gaming Monitor',
      description: '34-inch curved display with 144Hz refresh rate and HDR400 support.',
      price: 499.00,
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
      category: 'Computers',
      stock: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  productIdCounter: 4,
  orderItems: []
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
  const cleanSql = text.replace(/\s+/g, ' ').trim().toUpperCase();

  // --- USERS QUERIES ---
  if (cleanSql.startsWith('SELECT ID FROM USERS WHERE EMAIL = $1')) {
    const email = params[0];
    const found = inMemoryStore.users.filter(u => u.email === email);
    return { rows: found.map(u => ({ id: u.id })) };
  }

  if (cleanSql.startsWith('SELECT ID, NAME, EMAIL, PASSWORD_HASH, ROLE FROM USERS WHERE EMAIL = $1')) {
    const email = params[0];
    const found = inMemoryStore.users.filter(u => u.email === email);
    return { rows: found.map(u => ({ ...u })) };
  }

  if (cleanSql.startsWith('SELECT ID, NAME, EMAIL, ROLE, CREATED_AT, UPDATED_AT FROM USERS WHERE ID = $1')) {
    const id = Number(params[0]);
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

  if (cleanSql.startsWith('INSERT INTO USERS')) {
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

  // --- PRODUCTS QUERIES ---
  if (cleanSql.includes('FROM PRODUCTS ORDER BY')) {
    const sorted = [...inMemoryStore.products].sort((a, b) => b.id - a.id);
    return { rows: sorted.map(p => ({ ...p, price: Number(p.price) })) };
  }

  if (cleanSql.startsWith('SELECT ID FROM PRODUCTS WHERE ID = $1')) {
    const id = Number(params[0]);
    const found = inMemoryStore.products.filter(p => p.id === id);
    return { rows: found.map(p => ({ id: p.id })) };
  }

  if (cleanSql.includes('FROM PRODUCTS WHERE ID = $1')) {
    const id = Number(params[0]);
    const found = inMemoryStore.products.filter(p => p.id === id);
    return { rows: found.map(p => ({ ...p, price: Number(p.price) })) };
  }

  if (cleanSql.startsWith('INSERT INTO PRODUCTS')) {
    const [name, description, price, image_url, category, stock] = params;
    const newProduct = {
      id: inMemoryStore.productIdCounter++,
      name,
      description: description || null,
      price: Number(price),
      image_url: image_url || null,
      category,
      stock: Number(stock),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryStore.products.push(newProduct);
    return { rows: [{ ...newProduct }] };
  }

  if (cleanSql.startsWith('UPDATE PRODUCTS SET')) {
    const [name, description, price, image_url, category, stock, id] = params;
    const targetId = Number(id);
    const index = inMemoryStore.products.findIndex(p => p.id === targetId);
    if (index !== -1) {
      inMemoryStore.products[index] = {
        ...inMemoryStore.products[index],
        name,
        description: description || null,
        price: Number(price),
        image_url: image_url || null,
        category,
        stock: Number(stock),
        updated_at: new Date().toISOString()
      };
      return { rows: [{ ...inMemoryStore.products[index] }] };
    }
    return { rows: [] };
  }

  if (cleanSql.includes('FROM ORDER_ITEMS WHERE PRODUCT_ID = $1')) {
    const productId = Number(params[0]);
    const count = inMemoryStore.orderItems.filter(item => item.product_id === productId).length;
    return { rows: [{ count: String(count) }] };
  }

  if (cleanSql.startsWith('DELETE FROM PRODUCTS WHERE ID = $1')) {
    const id = Number(params[0]);
    const index = inMemoryStore.products.findIndex(p => p.id === id);
    if (index !== -1) {
      const deleted = inMemoryStore.products.splice(index, 1)[0];
      return { rows: [{ id: deleted.id }] };
    }
    return { rows: [] };
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
