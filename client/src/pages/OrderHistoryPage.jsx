import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserOrdersAPI } from '../services/orderService.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getUserOrdersAPI();
        if (isMounted) {
          setOrders(res.data.orders || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load order history.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'PROCESSING':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'SHIPPED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'DELIVERED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <LoadingSpinner message="Loading your order history..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Order History</h1>
          <p className="text-slate-400 text-sm mt-1">
            View all orders placed with your account
          </p>
        </div>
        <Link
          to="/products"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all self-start sm:self-auto"
        >
          Browse Catalog
        </Link>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center max-w-md mx-auto my-12">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-white mb-2">No Orders Found</h2>
          <p className="text-slate-400 text-sm mb-6">
            You haven't placed any orders yet.
          </p>
          <Link
            to="/products"
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 shadow-lg transition-all hover:border-slate-600"
            >
              {/* Order Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/80 text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-indigo-400 font-bold text-sm">#{order.id}</span>
                  <span className="text-slate-400">
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Details →
                  </Link>
                </div>
              </div>

              {/* Order Body */}
              <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Line Items */}
                <div className="md:col-span-2 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Items Purchased ({order.items.length})
                  </span>
                  {order.items.map((item) => (
                    <div key={item.id || item.product_id} className="flex items-center space-x-3 text-xs">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                        alt={item.product_name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700 flex-shrink-0"
                      />
                      <div className="flex-1 truncate">
                        <span className="font-semibold text-white block truncate">{item.product_name}</span>
                        <span className="text-slate-400 text-[11px]">
                          Qty: {item.quantity} × ${Number(item.price_at_purchase).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping & Total */}
                <div className="md:col-span-1 bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Shipping Address
                    </span>
                    <p className="text-slate-300 text-xs line-clamp-2">
                      {order.shipping_address}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between">
                    <span className="font-semibold text-slate-400">Total Paid</span>
                    <span className="text-lg font-extrabold text-indigo-400">
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
