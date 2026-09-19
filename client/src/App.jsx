import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetailsPage from './pages/ProductDetailsPage.jsx';
import AdminProductsPage from './pages/AdminProductsPage.jsx';
import AdminProductFormPage from './pages/AdminProductFormPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminProductsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products/new"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminProductFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products/:id/edit"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminProductFormPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all 404 Route */}
              <Route
                path="*"
                element={
                  <div className="max-w-md mx-auto my-20 p-8 text-center bg-slate-800/40 border border-slate-700/60 rounded-3xl">
                    <div className="text-5xl mb-3">4️⃣0️⃣4️⃣</div>
                    <h2 className="text-xl font-bold text-white mb-2">Page Not Found</h2>
                    <p className="text-slate-400 text-sm mb-6">
                      The page you are looking for does not exist or has been moved.
                    </p>
                    <a
                      href="/"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all inline-block"
                    >
                      Return to Home
                    </a>
                  </div>
                }
              />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-slate-950 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4">
              <p>ApexStore Phase 3 — Product Catalog & Admin Management System</p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
