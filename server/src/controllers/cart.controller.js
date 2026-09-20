import { query } from '../config/db.js';

/**
 * Get Authenticated User's Cart
 * GET /api/cart
 */
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT c.id, c.product_id, c.quantity, c.created_at, c.updated_at,
              p.name, p.description, p.price, p.image_url, p.category, p.stock
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.id ASC`,
      [userId]
    );

    const items = result.rows.map(row => {
      const price = Number(row.price);
      const quantity = Number(row.quantity);
      return {
        id: row.id,
        product_id: row.product_id,
        name: row.name,
        description: row.description,
        price: price,
        image_url: row.image_url,
        category: row.category,
        stock: Number(row.stock),
        quantity: quantity,
        subtotal: Number((price * quantity).toFixed(2)),
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    const cartTotal = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: {
        items,
        cartTotal,
        totalItemCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Product to Cart
 * POST /api/cart
 */
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    const parsedProductId = parseInt(productId, 10);
    const parsedQuantity = parseInt(quantity, 10);

    if (isNaN(parsedProductId) || parsedProductId <= 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Invalid product ID.'
      });
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Quantity must be a positive integer.'
      });
    }

    // Verify product exists and check stock
    const productResult = await query(
      'SELECT id, name, price, stock FROM products WHERE id = $1',
      [parsedProductId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: `Product with ID ${parsedProductId} not found.`
      });
    }

    const product = productResult.rows[0];
    const availableStock = Number(product.stock);

    if (availableStock <= 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: `Product "${product.name}" is currently out of stock.`
      });
    }

    // Check existing item in user's cart
    const existingItemResult = await query(
      'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [userId, parsedProductId]
    );

    let updatedItem;
    if (existingItemResult.rows.length > 0) {
      const currentCartQty = Number(existingItemResult.rows[0].quantity);
      const newTotalQty = currentCartQty + parsedQuantity;

      if (newTotalQty > availableStock) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: `Cannot add ${parsedQuantity} more. Total quantity in cart (${newTotalQty}) exceeds available stock (${availableStock}).`
        });
      }

      const updateResult = await query(
        `UPDATE cart_items
         SET quantity = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND product_id = $3
         RETURNING id, user_id, product_id, quantity, created_at, updated_at`,
        [newTotalQty, userId, parsedProductId]
      );
      updatedItem = updateResult.rows[0];
    } else {
      if (parsedQuantity > availableStock) {
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: `Requested quantity (${parsedQuantity}) exceeds available stock (${availableStock}).`
        });
      }

      const insertResult = await query(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, product_id, quantity, created_at, updated_at`,
        [userId, parsedProductId, parsedQuantity]
      );
      updatedItem = insertResult.rows[0];
    }

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Product added to cart successfully.',
      data: {
        cartItem: updatedItem
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Cart Item Quantity
 * PUT /api/cart/:productId
 */
export const updateCartItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const productId = parseInt(req.params.productId, 10);
    const { quantity } = req.body;
    const parsedQuantity = parseInt(quantity, 10);

    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Invalid product ID.'
      });
    }

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Quantity must be zero or a positive integer.'
      });
    }

    // If quantity is 0, remove item
    if (parsedQuantity === 0) {
      await query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);
      return res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Item removed from cart.'
      });
    }

    // Verify product exists and check stock
    const productResult = await query('SELECT id, name, stock FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Product not found.'
      });
    }

    const availableStock = Number(productResult.rows[0].stock);
    if (parsedQuantity > availableStock) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: `Requested quantity (${parsedQuantity}) exceeds available stock (${availableStock}).`
      });
    }

    const updateResult = await query(
      `UPDATE cart_items
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND product_id = $3
       RETURNING id, user_id, product_id, quantity, created_at, updated_at`,
      [parsedQuantity, userId, productId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Cart item not found in your cart.'
      });
    }

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Cart item quantity updated.',
      data: {
        cartItem: updateResult.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Product from Cart
 * DELETE /api/cart/:productId
 */
export const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const productId = parseInt(req.params.productId, 10);

    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Invalid product ID.'
      });
    }

    const result = await query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Product not found in your cart.'
      });
    }

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Product removed from cart.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear Entire Cart
 * DELETE /api/cart
 */
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Cart cleared successfully.'
    });
  } catch (error) {
    next(error);
  }
};
