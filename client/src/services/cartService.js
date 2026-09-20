const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to construct authorization headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

/**
 * Fetch authenticated user's cart (GET /api/cart)
 */
export const getCartAPI = async () => {
  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch shopping cart.');
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Add item to cart (POST /api/cart)
 */
export const addToCartAPI = async (productId, quantity = 1) => {
  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, quantity })
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to add item to cart.');
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Update cart item quantity (PUT /api/cart/:productId)
 */
export const updateCartItemAPI = async (productId, quantity) => {
  const response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ quantity })
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to update cart item.');
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Remove item from cart (DELETE /api/cart/:productId)
 */
export const removeCartItemAPI = async (productId) => {
  const response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to remove cart item.');
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Clear entire cart (DELETE /api/cart)
 */
export const clearCartAPI = async () => {
  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to clear cart.');
    error.status = response.status;
    throw error;
  }

  return data;
};
