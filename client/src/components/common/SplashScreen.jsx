import React from 'react';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white p-6 transition-opacity duration-500">
      <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-sm animate-fade-in">
        {/* CODTECH Official Logo */}
        <div className="p-4 bg-white rounded-3xl shadow-xl border border-gray-100 flex items-center justify-center transform hover:scale-105 transition-transform">
          <img
            src="/logo.png"
            alt="CODTECH Logo"
            className="h-28 sm:h-36 w-auto object-contain"
          />
        </div>

        {/* Clean Text without cursor line */}
        <div className="space-y-1">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-widest uppercase">
            POWERED BY CODTECH TEAM
          </h2>
          <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-widest">
            ENTERPRISE MANAGEMENT PORTAL
          </p>
        </div>

        {/* Minimal loading bar indicator */}
        <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden mt-4">
          <div className="w-full h-full bg-brand-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
