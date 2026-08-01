import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderKanban,
  FileBarChart2,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout, isAdmin } = useAuth();

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Clients', path: '/admin/clients', icon: Briefcase },
    { name: 'Projects', path: '/admin/projects', icon: FolderKanban },
    { name: 'Reports', path: '/admin/reports', icon: FileBarChart2 }
  ];

  const employeeNav = [
    { name: 'My Dashboard', path: '/employee/dashboard', icon: LayoutDashboard }
  ];

  const navItems = isAdmin ? adminNav : employeeNav;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-800">
            <div className="p-2.5 bg-brand-500 rounded-xl text-white shadow-lg shadow-brand-500/30">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wider text-white">CODTECH</h1>
              <p className="text-[10px] uppercase font-semibold text-brand-400 tracking-widest">TEAM ENTERPRISE</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Management Modules' : 'Workspace'}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-brand-500 text-white font-semibold shadow-md shadow-brand-500/25'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer User Info & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 mb-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white uppercase text-sm shadow">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize truncate">{user?.role === 'super_admin' ? 'Super Admin' : 'Employee'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 hover:border-rose-500 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 text-sm font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
