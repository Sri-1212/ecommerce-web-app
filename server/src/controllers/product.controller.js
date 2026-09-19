import { query } from '../config/db.js';

/**
 * Helper to validate positive integer IDs
 */
const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0 || String(parsed) !== String(value).trim()) {
    return null;
  }
  return parsed;
};

/**
 * Helper to validate product request payload
 */
const validateProductInput = (body) => {
  const { name, description, price, image_url, category, stock } = body;
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Product name is required.');
  } else if (name.trim().length > 255) {
    errors.push('Product name cannot exceed 255 characters.');
  }

  // Description validation (optional but bounded)
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push('Description must be a string.');
    } else if (description.length > 5000) {
      errors.push('Description cannot exceed 5000 characters.');
    }
  }

  // Price validation
  const numPrice = Number(price);
  if (price === undefined || price === null || price === '' || isNaN(numPrice)) {
    errors.push('Price must be a valid number.');
  } else if (numPrice < 0) {
    errors.push('Price cannot be negative.');
  }

  // Image URL validation (optional)
  if (image_url !== undefined && image_url !== null && image_url !== '') {
    if (typeof image_url !== 'string') {
      errors.push('Image URL must be a string.');
    } else if (image_url.length > 2048) {
      errors.push('Image URL cannot exceed 2048 characters.');
    }
  }

  // Category validation
  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Product category is required.');
  } else if (category.trim().length > 100) {
    errors.push('Category name cannot exceed 100 characters.');
  }

  // Stock validation
  const numStock = Number(stock);
  if (stock === undefined || stock === null || stock === '' || !Number.isInteger(numStock)) {
    errors.push('Stock must be a valid integer.');
  } else if (numStock < 0) {
    errors.push('Stock cannot be negative.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name: name ? name.trim() : '',
      description: description ? description.trim() : null,
      price: numPrice,
      image_url: image_url && image_url.trim() ? image_url.trim() : null,
      category: category ? category.trim() : '',
      stock: numStock
    }
  };
};

/**
 * Get All Products Controller
 * GET /api/products
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, description, price, image_url, category, stock, created_at, updated_at 
       FROM products 
       ORDER BY id DESC`
    );

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: {
        products: result.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Product By ID Controller
 * GET /api/products/:id
 */
export const getProductById = async (req, res, next) => {
  try {
    const productId = parsePositiveInt(req.params.id);
    if (!productId) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Invalid product ID format. Product ID must be a positive integer.'
      });
    }

    const result = await query(
      `SELECT id, name, description, price, image_url, category, stock, created_at, updated_at 
       FROM products 
       WHERE id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: `Product with ID ${productId} not found.`
      });
    }

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: {
        product: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Product Controller (Admin Only)
 * POST /api/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const validation = validateProductInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: `Validation error: ${validation.errors.join(' ')}`
      });
    }

    const { name, description, price, image_url, category, stock } = validation.sanitized;

    const result = await query(
      `INSERT INTO products (name, description, price, image_url, category, stock) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, description, price, image_url, category, stock, created_at, updated_at`,
      [name, description, price, image_url, category, stock]
    );

    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'Product created successfully.',
      data: {
        product: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Product Controller (Admin Only)
 * PUT /api/products/:id
 */
export const updateProduct = async (req, res, next) => {
  try {
    const productId = parsePositiveInt(req.params.id);
    if (!productId) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Invalid product ID format. Product ID must be a positive integer.'
      });
    }

    // Check if product exists first
    const existing = await query('SELECT id FROM products WHERE id = $1', [productId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: `Product with ID ${productId} not found.`
      });
    }

    const validation = validateProductInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: `Validation error: ${validation.errors.join(' ')}`
      });
    }

    const { name, description, price, image_url, category, stock } = validation.sanitized;

    const result = await query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, image_url = $4, category = $5, stock = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 
       RETURNING id, name, description, price, image_url, category, stock, created_at, updated_at`,
      [name, description, price, image_url, category, stock, productId]
    );

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Product updated successfully.',
      data: {
        product: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Product Controller (Admin Only)
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const productId = parsePositiveInt(req.params.id);
    if (!productId) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Invalid product ID format. Product ID must be a positive integer.'
      });
    }

    // Check if product exists
    const existing = await query('SELECT id FROM products WHERE id = $1', [productId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: `Product with ID ${productId} not found.`
      });
    }

    // Inspect foreign key dependency in order_items before deleting
    // To preserve historical order integrity and prevent RESTRICT constraint violations
    try {
      const orderCheck = await query(
        'SELECT COUNT(*) as count FROM order_items WHERE product_id = $1',
        [productId]
      );
      if (orderCheck.rows.length > 0 && Number(orderCheck.rows[0].count) > 0) {
        return res.status(409).json({
          status: 'error',
          statusCode: 409,
          message: 'Cannot delete product: It is linked to existing order history. Update product stock to 0 to soft-unlist instead.'
        });
      }
    } catch (checkErr) {
      // If order_items table doesn't exist yet in light test environments, continue safely
    }

    // Perform deletion
    try {
      await query('DELETE FROM products WHERE id = $1', [productId]);

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Product deleted successfully.',
        data: {
          id: productId
        }
      });
    } catch (deleteErr) {
      // Handle PostgreSQL Foreign Key Constraint Violation (23503) if triggered by DB
      if (deleteErr.code === '23503') {
        return res.status(409).json({
          status: 'error',
          statusCode: 409,
          message: 'Cannot delete product: Foreign key constraint failure (referenced in existing orders).'
        });
      }
      throw deleteErr;
    }
  } catch (error) {
    next(error);
  }
};
