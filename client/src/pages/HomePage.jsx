import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-8 sm:p-12 overflow-hidden shadow-2xl mb-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            <span>Phase 3 Activated: Product Catalog & Admin CRUD</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Discover Exceptional <br />
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              Tech & Essentials
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
            Welcome to ApexStore. Explore our catalog of products backed by secure REST APIs, role-based authorization, and real-time inventory tracking.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/products"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 active:scale-95 flex items-center space-x-2"
            >
              <span>Browse Catalog</span>
              <span>→</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin/products"
                className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-sm border border-amber-500/40 rounded-xl transition-all duration-200"
              >
                ⚙️ Admin Dashboard
              </Link>
            )}

            {!user && (
              <Link
                to="/login"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 rounded-xl transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xl mb-4">
            📦
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Complete Catalog</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            View full product listings with images, category tags, stock levels, and detailed item views.
          </p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl mb-4">
            🔐
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Admin Management</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Protected CRUD operations allowing administrators to create, edit, and safely manage product inventories.
          </p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl mb-4">
            🛡️
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Backend Security</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Stateless JWT authentication paired with role-based access control (RBAC) middleware.
          </p>
        </div>
      </div>
    </div>
  );
}
