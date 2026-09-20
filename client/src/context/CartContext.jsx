import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import {
  getCartAPI,
  addToCartAPI,
  updateCartItemAPI,
  removeCartItemAPI,
  clearCartAPI
} from '../services/cartService.js';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'ecommerce_guest_cart';

export const CartProvider = ({ children }) => {
  const { user, token, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to persist guest cart to LocalStorage
  const saveGuestCart = (items) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save guest cart to localStorage:', e);
    }
  };

  // Sync and Merge Cart when authentication state changes
  const refreshCart = useCallback(async () => {
    if (authLoading) return;

    if (user && token) {
      setLoading(true);
      setError(null);
      try {
        // Check for guest cart items to merge upon login
        const savedGuestCartStr = localStorage.getItem(GUEST_CART_KEY);
        if (savedGuestCartStr) {
          try {
            const guestItems = JSON.parse(savedGuestCartStr);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
              for (const gItem of guestItems) {
                const productId = gItem.product_id || gItem.id;
                const qty = gItem.quantity || 1;
                if (productId) {
                  try {
                    await addToCartAPI(productId, qty);
                  } catch (mergeErr) {
                    console.warn(`Merge failed for product ${productId}:`, mergeErr.message);
                  }
                }
              }
              // Clear guest cart only after merge processing completes
              localStorage.removeItem(GUEST_CART_KEY);
            }
          } catch (e) {
            console.error('Failed to parse guest cart JSON:', e);
            localStorage.removeItem(GUEST_CART_KEY);
          }
        }

        // Fetch user's authenticated database cart
        const res = await getCartAPI();
        setCartItems(res.data.items || []);
      } catch (err) {
        console.error('Failed to fetch authenticated cart:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest User: Read from localStorage
      setLoading(true);
      try {
        const savedGuestCartStr = localStorage.getItem(GUEST_CART_KEY);
        if (savedGuestCartStr) {
          const parsed = JSON.parse(savedGuestCartStr);
          setCartItems(Array.isArray(parsed) ? parsed : []);
        } else {
          setCartItems([]);
        }
      } catch (e) {
        console.error('Failed to load guest cart:', e);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    }
  }, [user, token, authLoading]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Add Item to Cart
  const addToCart = async (product, quantity = 1) => {
    setError(null);
    const productId = product.id || product.product_id;
    const qty = parseInt(quantity, 10) || 1;

    if (user && token) {
      // Authenticated Add via Backend API
      try {
        await addToCartAPI(productId, qty);
        await refreshCart();
      } catch (err) {
        setError(err.message);
        throw err;
      }
    } else {
      // Guest Add via LocalStorage
      const currentStock = Number(product.stock) || 99;
      setCartItems(prev => {
        const existingIndex = prev.findIndex(item => (item.product_id || item.id) === productId);
        let updated;

        if (existingIndex !== -1) {
          const existingItem = prev[existingIndex];
          const newQty = existingItem.quantity + qty;

          if (newQty > currentStock) {
            throw new Error(`Cannot add ${qty} more. Total quantity in cart (${newQty}) exceeds available stock (${currentStock}).`);
          }

          updated = [...prev];
          updated[existingIndex] = {
            ...existingItem,
            quantity: newQty,
            subtotal: Number((Number(existingItem.price) * newQty).toFixed(2))
          };
        } else {
          if (qty > currentStock) {
            throw new Error(`Requested quantity (${qty}) exceeds available stock (${currentStock}).`);
          }

          const newItem = {
            id: product.id,
            product_id: productId,
            name: product.name,
            description: product.description || '',
            price: Number(product.price),
            image_url: product.image_url || '',
            category: product.category || '',
            stock: currentStock,
            quantity: qty,
            subtotal: Number((Number(product.price) * qty).toFixed(2))
          };
          updated = [...prev, newItem];
        }

        saveGuestCart(updated);
        return updated;
      });
    }
  };

  // Update Cart Item Quantity
  const updateQuantity = async (productId, newQuantity) => {
    setError(null);
    const qty = parseInt(newQuantity, 10);

    if (user && token) {
      // Authenticated Update
      try {
        if (qty <= 0) {
          await removeCartItemAPI(productId);
        } else {
          await updateCartItemAPI(productId, qty);
        }
        await refreshCart();
      } catch (err) {
        setError(err.message);
        throw err;
      }
    } else {
      // Guest Update
      setCartItems(prev => {
        if (qty <= 0) {
          const updated = prev.filter(item => (item.product_id || item.id) !== productId);
          saveGuestCart(updated);
          return updated;
        }

        const existingItem = prev.find(item => (item.product_id || item.id) === productId);
        if (!existingItem) return prev;

        const maxStock = Number(existingItem.stock) || 99;
        if (qty > maxStock) {
          throw new Error(`Quantity requested (${qty}) exceeds available stock (${maxStock}).`);
        }

        const updated = prev.map(item => {
          if ((item.product_id || item.id) === productId) {
            return {
              ...item,
              quantity: qty,
              subtotal: Number((Number(item.price) * qty).toFixed(2))
            };
          }
          return item;
        });

        saveGuestCart(updated);
        return updated;
      });
    }
  };

  // Remove Single Item from Cart
  const removeFromCart = async (productId) => {
    setError(null);
    if (user && token) {
      try {
        await removeCartItemAPI(productId);
        await refreshCart();
      } catch (err) {
        setError(err.message);
        throw err;
      }
    } else {
      setCartItems(prev => {
        const updated = prev.filter(item => (item.product_id || item.id) !== productId);
        saveGuestCart(updated);
        return updated;
      });
    }
  };

  // Clear Entire Cart
  const clearCart = async () => {
    setError(null);
    if (user && token) {
      try {
        await clearCartAPI();
        setCartItems([]);
      } catch (err) {
        setError(err.message);
        throw err;
      }
    } else {
      setCartItems([]);
      localStorage.removeItem(GUEST_CART_KEY);
    }
  };

  // Derived Totals
  const cartTotal = Number(
    cartItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0).toFixed(2)
  );

  const totalItemCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        totalItemCount,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        setError
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
