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
 * Fetch all products (GET /api/products)
 */
export const getProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch products.');
  }

  return data;
};

/**
 * Fetch single product by ID (GET /api/products/:id)
 */
export const getProductById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch product details.');
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Create a new product (POST /api/products) - Admin Only
 */
export const createProduct = async (productData) => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData)
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to create product.');
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Update an existing product (PUT /api/products/:id) - Admin Only
 */
export const updateProduct = async (id, productData) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData)
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to update product.');
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Delete a product by ID (DELETE /api/products/:id) - Admin Only
 */
export const deleteProduct = async (id) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to delete product.');
    error.status = response.status;
    throw error;
  }

  return data;
};
