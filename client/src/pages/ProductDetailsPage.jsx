import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../services/productService.js';
import { useCart } from '../context/CartContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState(null);

  const { addToCart } = useCart();

  const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProductById(id);
      setProduct(res.data.product);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || Number(product.stock) <= 0 || adding) return;

    setCartError(null);
    try {
      setAdding(true);
      await addToCart(product, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      setCartError(err.message || 'Failed to add item to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner message={`Loading product #${id} details...`} />
      </div>
    );
  }

  if (error) {
    const isNotFound = error.status === 404;
    return (
      <div className="max-w-xl mx-auto my-16 px-4">
        <ErrorMessage
          title={isNotFound ? 'Product Not Found (404)' : 'Error Loading Product'}
          message={error.message || 'Unable to retrieve details for the requested product.'}
          onRetry={isNotFound ? null : fetchDetails}
        />
        <div className="mt-6 text-center">
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
          >
            <span>← Back to Products Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = Number(product.stock) <= 0;
  const availableStock = Number(product.stock);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Back Navigation Link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <span>← Back to Products</span>
        </Link>
      </div>

      {/* Main Details Grid */}
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Left Column: Image */}
        <div className="relative aspect-square w-full bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner flex items-center justify-center">
          <img
            src={imageError || !product.image_url ? fallbackImage : product.image_url}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />

          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-indigo-300 border border-slate-700 rounded-full shadow-lg">
              {product.category}
            </span>
          </div>
        </div>

        {/* Right Column: Info & Actions */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Product ID #{product.id}
              </span>

              {isOutOfStock ? (
                <span className="px-3 py-1 text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                  Out of Stock
                </span>
              ) : (
                <span className="px-3 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  ✓ In Stock ({product.stock} available)
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              {product.name}
            </h1>

            <div className="mb-6 pb-6 border-b border-slate-700/60">
              <span className="text-xs text-slate-400 block mb-1">Price</span>
              <span className="text-3xl font-extrabold text-indigo-400 tracking-tight">
                ${Number(product.price).toFixed(2)}
              </span>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Product Overview
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {product.description || 'No detailed description provided for this item.'}
              </p>
            </div>

            {/* Quantity Selector & Add to Cart */}
            {!isOutOfStock && (
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 space-y-4 mb-6">
                
                {cartError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                    ⚠️ {cartError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Quantity</span>
                  <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      disabled={quantity <= 1 || adding}
                      className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.min(availableStock, prev + 1))}
                      disabled={quantity >= availableStock || adding}
                      className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center space-x-2 ${
                    added
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25'
                  }`}
                >
                  <span>{added ? '✓ Added to Cart!' : `Add ${quantity} to Cart — $${(Number(product.price) * quantity).toFixed(2)}`}</span>
                </button>

              </div>
            )}
          </div>

          {/* Metadata Footer */}
          <div className="pt-6 border-t border-slate-700/60 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div>
                <span className="block text-slate-500 font-medium">Added to Catalog</span>
                <span className="font-semibold text-slate-300">
                  {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 font-medium">Last Stock Sync</span>
                <span className="font-semibold text-slate-300">
                  {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
