import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, createProduct, updateProduct } from '../services/productService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    stock: ''
  });

  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Load existing product if in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;

    const loadProductData = async () => {
      try {
        setInitialLoading(true);
        setFormError(null);
        const res = await getProductById(id);
        const p = res.data.product;
        setFormData({
          name: p.name || '',
          description: p.description || '',
          price: p.price !== undefined && p.price !== null ? String(p.price) : '',
          image_url: p.image_url || '',
          category: p.category || '',
          stock: p.stock !== undefined && p.stock !== null ? String(p.stock) : ''
        });
      } catch (err) {
        console.error('Failed to load product for editing:', err);
        setFormError(err.message || 'Unable to fetch existing product details.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadProductData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateFrontend = () => {
    if (!formData.name.trim()) {
      return 'Product name is required.';
    }
    if (!formData.category.trim()) {
      return 'Product category is required.';
    }
    const numPrice = Number(formData.price);
    if (formData.price === '' || isNaN(numPrice) || numPrice < 0) {
      return 'Price must be a valid non-negative number.';
    }
    const numStock = Number(formData.stock);
    if (formData.stock === '' || !Number.isInteger(numStock) || numStock < 0) {
      return 'Stock must be a valid non-negative integer.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const clientValidationError = validateFrontend();
    if (clientValidationError) {
      setFormError(clientValidationError);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: Number(formData.price),
      image_url: formData.image_url.trim() || null,
      category: formData.category.trim(),
      stock: Number(formData.stock)
    };

    try {
      setSubmitting(true);
      if (isEditMode) {
        await updateProduct(id, payload);
        setSuccessMsg('Product updated successfully! Redirecting...');
      } else {
        await createProduct(payload);
        setSuccessMsg('Product created successfully! Redirecting...');
      }

      setTimeout(() => {
        navigate('/admin/products');
      }, 1200);
    } catch (err) {
      console.error('Form submission failed:', err);
      setFormError(err.message || 'Operation failed. Please check backend response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner message="Fetching product data for editor..." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/admin/products"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <span>← Back to Admin Product List</span>
        </Link>
      </div>

      {/* Form Container */}
      <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/80 p-8 rounded-3xl shadow-2xl">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">{isEditMode ? '✏️' : '➕'}</span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isEditMode ? `Edit Product #${id}` : 'Create New Product'}
            </h1>
          </div>
          <p className="text-slate-400 text-xs">
            {isEditMode
              ? 'Modify the details below and submit to update the product inventory.'
              : 'Fill in the required fields to publish a new product to the catalog.'}
          </p>
        </div>

        {formError && (
          <div className="mb-6">
            <ErrorMessage title="Validation or Server Error" message={formError} />
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1: Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Product Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Wireless Ergonomic Mouse"
              required
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Row 2: Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Category <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Electronics, Accessories"
                required
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Price ($ USD) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="49.99"
                required
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Row 3: Stock & Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Stock Quantity <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="25"
                required
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Image URL (Optional)
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter comprehensive product features, specifications, and warranty details..."
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end space-x-4 border-t border-slate-700/60">
            <Link
              to="/admin/products"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? isEditMode
                  ? 'Saving Changes...'
                  : 'Creating Product...'
                : isEditMode
                ? 'Save Changes'
                : 'Create Product'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
