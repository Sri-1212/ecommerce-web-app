import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="p-8 max-w-lg w-full bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-extrabold text-indigo-400 mb-4">
          E-Commerce Web App
        </h1>
        <p className="text-slate-300 text-sm mb-6">
          Frontend initialized successfully (Phase 1: Foundation Setup).
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
          ● React + Vite + Tailwind CSS Active
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
