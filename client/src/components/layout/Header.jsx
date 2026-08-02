import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenuClick, title }) {
  const { user } = useAuth();

  // Shorten long titles for mobile display
  const shortTitle = {
    'Development Team Management': 'Team Mgmt',
    'Super Admin Overview': 'Dashboard',
    'Client Directory': 'Clients',
    'Projects Directory': 'Projects',
    'Project Vault & Details': 'Project',
    'Executive Analytics & Reports': 'Reports',
    'Developer Workspace': 'Workspace',
  }[title] || title;

  return (
    <header className="h-14 sm:h-20 bg-white border-b border-gray-100 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 lg:hidden shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          {/* Mobile: short title on one line. Desktop: full title */}
          <h2 className="block sm:hidden text-sm font-bold text-slate-800 truncate leading-tight">{shortTitle}</h2>
          <h2 className="hidden sm:block text-xl font-bold text-slate-800 leading-tight">{title}</h2>
          <p className="hidden sm:block text-xs text-gray-400 font-normal">Internal Enterprise Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Notifications Icon */}
        <button className="p-2 sm:p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-brand-500 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full"></span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-orange-400 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-800 truncate max-w-[100px]">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role === 'super_admin' ? 'Super Admin' : 'Employee'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
