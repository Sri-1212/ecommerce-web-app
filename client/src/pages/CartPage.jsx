import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function CartPage() {
  const { cartItems, cartTotal, totalItemCount, loading, error, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleQtyChange = async (productId, newQty) => {
    setActionError(null);
    setUpdatingId(productId);
    try {
      await updateQuantity(productId, newQty);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId) => {
    setActionError(null);
    setUpdatingId(productId);
    try {
      await removeFromCart(productId);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your shopping cart?')) {
      setActionError(null);
      try {
        await clearCart();
      } catch (err) {
        setActionError(err.message);
      }
    }
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <LoadingSpinner message="Loading your shopping cart..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Shopping Cart</h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalItemCount === 0 ? 'Your cart is currently empty' : `You have ${totalItemCount} item${totalItemCount === 1 ? '' : 's'} in your cart`}
          </p>
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={handleClearCart}
            className="self-start sm:self-auto px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5"
          >
            <span>🗑️</span>
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {(error || actionError) && (
        <div className="mb-6">
          <ErrorMessage message={actionError || error} />
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center max-w-lg mx-auto my-12">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-white mb-2">Your Cart is Empty</h2>
          <p className="text-slate-400 text-sm mb-6">
            Looks like you haven't added any products to your shopping cart yet.
          </p>
          <Link
            to="/products"
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all inline-block"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const productId = item.product_id || item.id;
              const isUpdating = updatingId === productId;
              const stock = Number(item.stock) || 99;

              return (
                <div
                  key={productId}
                  className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-600"
                >
                  {/* Image & Title */}
                  <div className="flex items-center space-x-4 flex-1">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80'}
                      alt={item.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-slate-900 border border-slate-700 flex-shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                        {item.category || 'General'}
                      </span>
                      <Link
                        to={`/products/${productId}`}
                        className="block text-base font-bold text-white hover:text-indigo-400 transition-colors mt-1"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-slate-400 mt-1">
                        Price: <span className="text-slate-200 font-semibold">${Number(item.price).toFixed(2)}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        In Stock: {stock}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Controls & Subtotal */}
                  <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-6 border-t sm:border-t-0 border-slate-700/60 pt-3 sm:pt-0">
                    
                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded-xl p-1">
                      <button
                        onClick={() => handleQtyChange(productId, item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer"
                        title="Decrease Quantity"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(productId, item.quantity + 1)}
                        disabled={isUpdating || item.quantity >= stock}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer"
                        title="Increase Quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-medium">Subtotal</span>
                        <span className="text-base font-extrabold text-indigo-400">
                          ${(Number(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemove(productId)}
                        disabled={isUpdating}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        title="Remove Product"
                      >
                        🗑️
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sticky top-24 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4 pb-3 border-b border-slate-700">Order Summary</h2>

              <div className="space-y-3 text-sm text-slate-300 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItemCount} items)</span>
                  <span className="font-semibold text-white">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-emerald-400 font-semibold">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (Estimated)</span>
                  <span className="text-slate-400">$0.00</span>
                </div>
                <div className="border-t border-slate-700 pt-3 flex justify-between text-base font-extrabold text-white">
                  <span>Total</span>
                  <span className="text-indigo-400 text-xl">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {!user && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 mb-4 text-xs text-indigo-300">
                  💡 Note: You are shopping as a guest. Logging in will save your cart to your account.
                </div>
              )}

              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Proceed to Checkout</span>
                <span>➔</span>
              </button>

              <Link
                to="/products"
                className="block text-center text-xs font-semibold text-slate-400 hover:text-white mt-4 transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
