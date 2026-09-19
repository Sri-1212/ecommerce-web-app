import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';

const router = Router();

// Public Routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected Admin Routes (Middleware order: authenticateToken -> requireRole('admin') -> controller)
router.post('/', authenticateToken, requireRole('admin'), createProduct);
router.put('/:id', authenticateToken, requireRole('admin'), updateProduct);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteProduct);

export default router;
