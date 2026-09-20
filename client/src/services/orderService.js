const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const cleanUrl = envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${cleanUrl}/api`;
};

const API_BASE_URL = getBaseUrl();

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
 * Create a new order (POST /api/orders)
 */
export const createOrderAPI = async (shippingAddress) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ shippingAddress })
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to place order.');
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Fetch authenticated user's order history (GET /api/orders)
 */
export const getUserOrdersAPI = async () => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch order history.');
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Fetch single order details by ID (GET /api/orders/:id)
 */
export const getOrderByIdAPI = async (id) => {
  const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch order details.');
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Fetch all orders across all users (GET /api/orders/admin/all) - Admin Only
 */
export const getAllOrdersAdminAPI = async () => {
  const response = await fetch(`${API_BASE_URL}/orders/admin/all`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch admin orders.');
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Update order status (PATCH /api/orders/:id/status) - Admin Only
 */
export const updateOrderStatusAdminAPI = async (id, status) => {
  const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to update order status.');
    error.status = response.status;
    throw error;
  }

  return data;
};
