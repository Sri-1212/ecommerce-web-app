import React, { useEffect, useState } from 'react';
import { getProducts } from '../services/productService.js';
import ProductCard from '../components/ProductCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProductsList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProducts();
      setProducts(res.data?.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Unable to connect to product catalog API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsList();
  }, []);

  // Compute unique categories dynamically
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  // Filter products by selected category and search query
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Product Catalog</h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse our wide selection of high-quality tech gear and accessories.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Category Pill Filters */}
      {!loading && !error && categories.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="min-h-[50vh] flex items-center justify-center">
          <LoadingSpinner message="Fetching live catalog records..." />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="my-12">
          <ErrorMessage
            title="Catalog Loading Error"
            message={error}
            onRetry={fetchProductsList}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="max-w-md mx-auto my-16 p-8 bg-slate-800/40 border border-slate-700/60 rounded-3xl text-center">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-lg font-bold text-white mb-2">No Products Found</h3>
          <p className="text-slate-400 text-sm mb-6">
            {searchQuery || selectedCategory !== 'All'
              ? 'No products match your search query or category filter.'
              : 'There are currently no products available in the database catalog.'}
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
}
