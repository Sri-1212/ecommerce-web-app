import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-extrabold text-xl">E</span>
            </div>
            <div>
              <span className="text-lg font-bold text-slate-100 tracking-tight">ApexStore</span>
              <span className="block text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Phase 3 Catalog</span>
            </div>
          </Link>

          {/* Center / Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </Link>

            <Link
              to="/products"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/products') ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Products
            </Link>

            {/* Admin Link if User is Admin */}
            {isAdmin && (
              <Link
                to="/admin/products"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <span>⚙️</span>
                <span>Admin Products</span>
              </Link>
            )}
          </nav>

          {/* User Auth Section */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                    isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
