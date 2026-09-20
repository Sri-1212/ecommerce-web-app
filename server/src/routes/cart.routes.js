import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} from '../controllers/cart.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all cart endpoints with JWT authentication
router.use(authenticateToken);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:productId', updateCartItemQuantity);
router.delete('/:productId', removeCartItem);
router.delete('/', clearCart);

export default router;
