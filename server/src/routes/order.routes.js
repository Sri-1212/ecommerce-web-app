import { Router } from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrdersAdmin,
  updateOrderStatusAdmin
} from '../controllers/order.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = Router();

// Protect all order endpoints with JWT authentication
router.use(authenticateToken);

// User Endpoints
router.post('/', createOrder);
router.get('/', getUserOrders);

// Admin Endpoints (must come before /:id parameter route)
router.get('/admin/all', requireRole('admin'), getAllOrdersAdmin);
router.patch('/:id/status', requireRole('admin'), updateOrderStatusAdmin);

// Single Order Endpoint
router.get('/:id', getOrderById);

export default router;
