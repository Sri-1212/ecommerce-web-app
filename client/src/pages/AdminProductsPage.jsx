import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '../services/productService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Deletion modal state
  const [deletingId, setDeletingId] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success / Notice banner
  const [notice, setNotice] = useState(null);

  const fetchAdminProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProducts();
      setProducts(res.data?.products || []);
    } catch (err) {
      console.error('Failed to load admin products:', err);
      setError(err.message || 'Failed to fetch inventory catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProducts();
  }, []);

  const confirmDelete = (prod) => {
    setDeletingProduct(prod);
    setDeletingId(prod.id);
  };

  const handleExecuteDelete = async () => {
    if (!deletingId) return;

    try {
      setIsDeleting(true);
      setNotice(null);
      await deleteProduct(deletingId);
      setNotice({ type: 'success', text: `Product #${deletingId} deleted successfully.` });
      setDeletingId(null);
      setDeletingProduct(null);
      fetchAdminProducts();
    } catch (err) {
      console.error('Delete failed:', err);
      setNotice({ type: 'error', text: err.message || 'Failed to delete product.' });
      setDeletingId(null);
      setDeletingProduct(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Product Management</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Manage store inventory records, create new listings, edit existing products, or delete safe items.
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <span className="text-base">+</span>
          <span>Create New Product</span>
        </Link>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="min-h-[50vh] flex items-center justify-center">
          <LoadingSpinner message="Loading administration product table..." />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="my-10">
          <ErrorMessage
            title="Admin Catalog Error"
            message={error}
            onRetry={fetchAdminProducts}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="max-w-md mx-auto my-16 p-8 bg-slate-800/40 border border-slate-700/60 rounded-3xl text-center">
          <div className="text-5xl mb-3">📦</div>
          <h3 className="text-lg font-bold text-white mb-2">No Products in Database</h3>
          <p className="text-slate-400 text-sm mb-6">
            There are currently no products in the catalog. Click the button below to add your first product.
          </p>
          <Link
            to="/admin/products/new"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
          >
            + Create Product Now
          </Link>
        </div>
      )}

      {/* Product Management Table */}
      {!loading && !error && products.length > 0 && (
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-700/80 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Stock Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-sm text-slate-200">
                {products.map((product) => {
                  const isOutOfStock = Number(product.stock) <= 0;
                  return (
                    <tr key={product.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-indigo-400 font-bold">
                        #{product.id}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700"
                          />
                          <div>
                            <span className="font-bold text-white block line-clamp-1">
                              {product.name}
                            </span>
                            <span className="text-xs text-slate-400 line-clamp-1">
                              {product.description || 'No description'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-indigo-300 border border-slate-700 rounded-full">
                          {product.category}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-bold text-white">
                        ${Number(product.price).toFixed(2)}
                      </td>

                      <td className="py-4 px-6">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                            {product.stock} units
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 transition-all"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() => confirmDelete(product)}
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-2xl mb-4">
              🗑️
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Confirm Product Deletion</h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{deletingProduct?.name}"</strong> (ID #{deletingId})?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setDeletingId(null);
                  setDeletingProduct(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
