import React, { useEffect, useState } from 'react';
import { getAllOrdersAdminAPI, updateOrderStatusAdminAPI } from '../services/orderService.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAllOrdersAdminAPI();
      setOrders(res.data.orders || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    setSuccessBanner(null);
    setError(null);
    try {
      const res = await updateOrderStatusAdminAPI(orderId, newStatus);
      setSuccessBanner(res.message || `Order #${orderId} status updated to ${newStatus}.`);
      await fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

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

  if (loading && orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <LoadingSpinner message="Loading customer orders..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
              Admin Portal
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs font-semibold">{orders.length} Total Orders</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">Order Management</h1>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <span>🔄</span>
          <span>Refresh Orders</span>
        </button>
      </div>

      {successBanner && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span>✅ {successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center max-w-md mx-auto my-12">
          <div className="text-5xl mb-4">📑</div>
          <h2 className="text-xl font-bold text-white mb-2">No Customer Orders</h2>
          <p className="text-slate-400 text-sm">
            No orders have been placed in the store yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all hover:border-slate-600"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/80 text-xs">
                  
                  {/* Order Metadata */}
                  <div className="flex items-center space-x-4">
                    <span className="font-mono text-indigo-400 font-bold text-sm bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                      #{order.id}
                    </span>
                    <div>
                      <span className="font-bold text-white text-sm block">{order.user_name}</span>
                      <span className="text-slate-400 text-xs">{order.user_email}</span>
                    </div>
                  </div>

                  {/* Date & Amount */}
                  <div className="flex items-center space-x-6">
                    <div>
                      <span className="text-slate-500 text-[10px] block font-medium">Placed On</span>
                      <span className="text-slate-300 font-semibold">
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-medium">Total Amount</span>
                      <span className="text-base font-extrabold text-indigo-400">
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-end">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>

                    <select
                      value={order.status}
                      disabled={isUpdating}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          Status: {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Line Items & Shipping Address */}
                <div className="pt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                  <div className="lg:col-span-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Line Items ({order.items.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id || item.product_id}
                          className="bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-1.5 flex items-center space-x-2"
                        >
                          <span className="font-semibold text-slate-200">{item.product_name}</span>
                          <span className="text-indigo-400 font-bold">x{item.quantity}</span>
                          <span className="text-slate-400 text-[10px]">(${Number(item.price_at_purchase).toFixed(2)})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-1 bg-slate-900/40 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Shipping Destination
                    </span>
                    <p className="text-slate-300 text-xs">
                      {order.shipping_address}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
