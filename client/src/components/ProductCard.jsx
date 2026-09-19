import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

  const isOutOfStock = Number(product.stock) <= 0;

  return (
    <div className="group bg-slate-800/60 backdrop-blur-sm border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full">
      
      {/* Product Image Container */}
      <div className="relative aspect-square w-full bg-slate-900/80 overflow-hidden">
        <img
          src={imageError || !product.image_url ? fallbackImage : product.image_url}
          alt={product.name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Category Tag Overlay */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase bg-slate-900/80 backdrop-blur-md text-indigo-300 border border-slate-700/80 rounded-full shadow-md">
            {product.category}
          </span>
        </div>

        {/* Stock Status Badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/90 text-white rounded-full shadow-md">
              Out of Stock
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/40 rounded-full shadow-md">
              {product.stock} in stock
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {product.description || 'No description available for this product.'}
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Price</span>
            <span className="text-xl font-extrabold text-white tracking-tight">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>

          <Link
            to={`/products/${product.id}`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-500/40 transition-all duration-200 active:scale-95"
          >
            <span>View Details</span>
            <span>→</span>
          </Link>
        </div>

      </div>

    </div>
  );
}
