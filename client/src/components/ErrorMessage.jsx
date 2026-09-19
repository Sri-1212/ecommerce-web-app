import React from 'react';

export default function ErrorMessage({ title = 'An error occurred', message, onRetry }) {
  return (
    <div className="max-w-lg mx-auto p-6 bg-rose-950/40 border border-rose-800/50 rounded-2xl shadow-xl text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xl font-bold">
        ⚠️
      </div>
      <h3 className="text-lg font-bold text-rose-300 mb-1">{title}</h3>
      <p className="text-slate-300 text-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
