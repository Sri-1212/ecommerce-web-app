import { pool, query } from '../config/db.js';

const ALLOWED_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

/**
 * Create New Order (Checkout Cart)
 * POST /api/orders
 */
export const createOrder = async (req, res, next) => {
  const userId = req.user.userId;
  const { shippingAddress } = req.body;

  if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim().length < 5) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Validation error: A valid shipping address (at least 5 characters) is required.'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch user's cart items with current product prices & stock
    const cartRes = await client.query(
      `SELECT c.product_id, c.quantity, p.name, p.price, p.stock
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1
       FOR UPDATE`,
      [userId]
    );

    if (cartRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Cannot place order: Your shopping cart is empty.'
      });
    }

    // 2. Validate product stock
    for (const item of cartRes.rows) {
      const requestedQty = Number(item.quantity);
      const availableStock = Number(item.stock);
      if (requestedQty > availableStock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: `Insufficient stock for "${item.name}". Requested: ${requestedQty}, Available: ${availableStock}.`
        });
      }
    }

    // 3. Calculate total amount
    const totalAmount = Number(
      cartRes.rows.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0).toFixed(2)
    );

    // 4. Insert into orders table
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, status)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING id, user_id, total_amount, shipping_address, status, created_at, updated_at`,
      [userId, totalAmount, shippingAddress.trim()]
    );

    const order = orderRes.rows[0];

    // 5. Insert into order_items and update product stock
    const orderItems = [];
    for (const item of cartRes.rows) {
      const itemPrice = Number(item.price);
      const itemQty = Number(item.quantity);

      const itemRes = await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)
         RETURNING id, order_id, product_id, quantity, price_at_purchase`,
        [order.id, item.product_id, itemQty, itemPrice]
      );

      await client.query(
        `UPDATE products
         SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [itemQty, item.product_id]
      );

      orderItems.push({
        ...itemRes.rows[0],
        price_at_purchase: itemPrice,
        product_name: item.name
      });
    }

    // 6. Clear user cart items
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'Order placed successfully.',
      data: {
        order: {
          id: order.id,
          user_id: order.user_id,
          total_amount: Number(order.total_amount),
          shipping_address: order.shipping_address,
          status: order.status,
          created_at: order.created_at,
          updated_at: order.updated_at,
          items: orderItems
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Get Authenticated User's Order History
 * GET /api/orders
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const ordersRes = await query(
      `SELECT o.id, o.user_id, o.total_amount, o.shipping_address, o.status, o.created_at, o.updated_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price_at_purchase,
                    'product_name', p.name,
                    'image_url', p.image_url,
                    'category', p.category
                  )
                ) FILTER (WHERE oi.id IS NOT NULL), '[]'
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.id DESC`,
      [userId]
    );

    const orders = ordersRes.rows.map(order => ({
      ...order,
      total_amount: Number(order.total_amount),
      items: (order.items || []).map(item => ({
        ...item,
        price_at_purchase: Number(item.price_at_purchase)
      }))
    }));

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Order Details By ID
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Invalid order ID.'
      });
    }

    const orderRes = await query(
      `SELECT o.id, o.user_id, o.total_amount, o.shipping_address, o.status, o.created_at, o.updated_at,
              u.name as user_name, u.email as user_email,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price_at_purchase,
                    'product_name', p.name,
                    'image_url', p.image_url,
                    'category', p.category
                  )
                ) FILTER (WHERE oi.id IS NOT NULL), '[]'
              ) as items
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1
       GROUP BY o.id, u.name, u.email`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: `Order with ID ${orderId} not found.`
      });
    }

    const order = orderRes.rows[0];

    // Access control: User can only access their own order unless they are an admin
    if (order.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        status: 'error',
        statusCode: 403,
        message: 'Access forbidden: You do not have permission to view this order.'
      });
    }

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: {
        order: {
          ...order,
          total_amount: Number(order.total_amount),
          items: (order.items || []).map(item => ({
            ...item,
            price_at_purchase: Number(item.price_at_purchase)
          }))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Orders Across All Users (Admin Only)
 * GET /api/orders/admin/all
 */
export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const ordersRes = await query(
      `SELECT o.id, o.user_id, o.total_amount, o.shipping_address, o.status, o.created_at, o.updated_at,
              u.name as user_name, u.email as user_email,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price_at_purchase,
                    'product_name', p.name
                  )
                ) FILTER (WHERE oi.id IS NOT NULL), '[]'
              ) as items
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       GROUP BY o.id, u.name, u.email
       ORDER BY o.id DESC`
    );

    const orders = ordersRes.rows.map(order => ({
      ...order,
      total_amount: Number(order.total_amount),
      items: (order.items || []).map(item => ({
        ...item,
        price_at_purchase: Number(item.price_at_purchase)
      }))
    }));

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: {
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Order Status (Admin Only)
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatusAdmin = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Invalid order ID.'
      });
    }

    if (!status || !ALLOWED_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: `Invalid order status. Allowed statuses: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    const normalizedStatus = status.toUpperCase();

    // Check order existence
    const existingRes = await query('SELECT id, status FROM orders WHERE id = $1', [orderId]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: `Order with ID ${orderId} not found.`
      });
    }

    const currentStatus = existingRes.rows[0].status;

    // Handle cancellation: restore stock if changing to CANCELLED from non-cancelled
    if (normalizedStatus === 'CANCELLED' && currentStatus !== 'CANCELLED') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Fetch order items to restore product stock
        const itemsRes = await client.query(
          'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
          [orderId]
        );

        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE products
             SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [Number(item.quantity), item.product_id]
          );
        }

        const updateRes = await client.query(
          `UPDATE orders
           SET status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING id, user_id, total_amount, shipping_address, status, created_at, updated_at`,
          [normalizedStatus, orderId]
        );

        await client.query('COMMIT');

        return res.status(200).json({
          status: 'success',
          statusCode: 200,
          message: 'Order cancelled successfully and product stock restored.',
          data: {
            order: updateRes.rows[0]
          }
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // Standard status update
    const updateRes = await query(
      `UPDATE orders
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, user_id, total_amount, shipping_address, status, created_at, updated_at`,
      [normalizedStatus, orderId]
    );

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: `Order status updated to ${normalizedStatus}.`,
      data: {
        order: updateRes.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};
