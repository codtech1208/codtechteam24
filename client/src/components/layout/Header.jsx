import React from 'react';
import { Menu, Bell, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenuClick, title }) {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-gray-400 font-normal">Internal Enterprise Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Security Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>AES-256 Encrypted</span>
        </div>

        {/* Notifications Icon */}
        <button className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-brand-500 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full"></span>
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-orange-400 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role === 'super_admin' ? 'Super Admin' : 'Employee'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
