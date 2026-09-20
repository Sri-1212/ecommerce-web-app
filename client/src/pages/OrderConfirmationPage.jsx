import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderByIdAPI } from '../services/orderService.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await getOrderByIdAPI(id);
        if (isMounted) {
          setOrder(res.data.order);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load order details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-20 flex justify-center">
        <LoadingSpinner message="Retrieving order confirmation..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <ErrorMessage message={error || 'Order not found.'} />
        <div className="mt-4 text-center">
          <Link to="/products" className="text-sm font-semibold text-indigo-400 hover:underline">
            Return to Products Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      
      {/* Confirmation Card */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl text-center mb-8">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 text-3xl">
          ✓
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Order Confirmed!</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Thank you for your purchase. Your order has been placed successfully and is being processed.
        </p>
        
        <div className="inline-flex items-center space-x-2 mt-4 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs text-slate-300 font-mono">
          <span>Order ID:</span>
          <span className="font-bold text-indigo-400">#{order.id}</span>
        </div>
      </div>

      {/* Order Summary & Items */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
          <div>
            <span className="text-xs text-slate-400 block">Date Placed</span>
            <span className="text-sm font-bold text-white">
              {new Date(order.created_at).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Status</span>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
              {order.status}
            </span>
          </div>
        </div>

        {/* Shipping Address */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Shipping Destination</h2>
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 text-sm text-slate-200">
            {order.shipping_address}
          </div>
        </div>

        {/* Purchased Line Items */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Purchased Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id || item.product_id}
                className="bg-slate-900 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                    alt={item.product_name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700 flex-shrink-0"
                  />
                  <div className="truncate">
                    <span className="block text-sm font-bold text-white truncate">{item.product_name}</span>
                    <span className="text-xs text-slate-400">
                      Qty: {item.quantity} × ${Number(item.price_at_purchase).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-extrabold text-indigo-400">
                    ${(Number(item.price_at_purchase) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Price */}
        <div className="border-t border-slate-700/80 pt-4 flex items-center justify-between">
          <span className="text-base font-bold text-white">Total Amount Paid</span>
          <span className="text-2xl font-extrabold text-indigo-400">
            ${Number(order.total_amount).toFixed(2)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t border-slate-700/60">
          <Link
            to="/orders"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all text-center"
          >
            View Order History
          </Link>
          <Link
            to="/products"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all text-center"
          >
            Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
}
