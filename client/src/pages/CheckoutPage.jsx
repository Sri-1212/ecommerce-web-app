import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createOrderAPI } from '../services/orderService.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function CheckoutPage() {
  const { cartItems, cartTotal, totalItemCount, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-800/60 border border-slate-700/80 rounded-3xl text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
        <p className="text-slate-400 text-sm mb-6">
          Please log in or register an account to complete your order checkout.
        </p>
        <div className="flex justify-center space-x-3">
          <Link
            to="/login?redirect=/checkout"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-800/60 border border-slate-700/80 rounded-3xl text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-white mb-2">Your Cart is Empty</h2>
        <p className="text-slate-400 text-sm mb-6">
          You cannot proceed to checkout without items in your shopping cart.
        </p>
        <Link
          to="/products"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all inline-block"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!shippingAddress || shippingAddress.trim().length < 5) {
      setErrorMessage('Please enter a valid shipping address (at least 5 characters).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createOrderAPI(shippingAddress);
      await refreshCart();
      const createdOrder = res.data.order;
      navigate(`/order-confirmation/${createdOrder.id}`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="border-b border-slate-800 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Checkout</h1>
        <p className="text-slate-400 text-sm mt-1">
          Review your order and enter shipping details to complete purchase
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6">
          <ErrorMessage message={errorMessage} />
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Shipping Form (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User Details Banner */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-3 flex items-center space-x-2">
              <span>👤</span>
              <span>Account Information</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
              <div>
                <span className="block text-slate-500 font-medium">Full Name</span>
                <span className="font-semibold text-slate-100">{user.name}</span>
              </div>
              <div>
                <span className="block text-slate-500 font-medium">Email Address</span>
                <span className="font-semibold text-slate-100">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address Input */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
              <span>📍</span>
              <span>Shipping Address</span>
            </h2>
            <div>
              <label htmlFor="shippingAddress" className="block text-xs font-semibold text-slate-300 mb-2">
                Street Address, Apartment, City, Postal Code *
              </label>
              <textarea
                id="shippingAddress"
                rows={4}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="123 Main Street, Apt 4B, New York, NY 10001"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                We will ship your items directly to this address.
              </p>
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
              <span>💳</span>
              <span>Payment Method</span>
            </h2>
            <p className="text-xs text-slate-400">
              Cash on Delivery / Direct Store Checkout (Demo). No payment card is required.
            </p>
          </div>

        </div>

        {/* Order Items & Summary (Right Column) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sticky top-24 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 pb-3 border-b border-slate-700">Order Items</h2>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4">
              {cartItems.map((item) => (
                <div key={item.product_id || item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700 flex-shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-slate-200 truncate">{item.name}</p>
                      <p className="text-slate-400 text-[10px]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-indigo-400 ml-2">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-700 pt-3 space-y-2 text-xs text-slate-300 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Shipping</span>
                <span>FREE</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700/60 pt-2">
                <span>Total Due</span>
                <span className="text-indigo-400 text-lg">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <LoadingSpinner size="small" message="Processing order..." />
              ) : (
                <>
                  <span>Place Order</span>
                  <span>🚀</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
