import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, CheckCheck, Trash2, X, RefreshCw, Info, CheckCircle2, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/formatters';

export default function Header({ onMenuClick, title }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Auto-refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Mark read-all error:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  const getNotifIcon = (type) => {
    if (type === 'payment_received') return <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />;
    if (type === 'status_update') return <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />;
    return <Info className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  // Panel labels based on role
  const isAdmin = user?.role === 'super_admin';
  const panelTitle = isAdmin ? 'Project Status Updates' : 'Payment Notifications';
  const emptyMessage = isAdmin
    ? 'No status updates yet.'
    : 'No payment notifications yet.';
  const emptySubtext = isAdmin
    ? 'When employees update a project stage (UI, Backend, Live, Completed), it appears here.'
    : 'When Super Admin records a payment for your project, it will appear here.';

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
          <h2 className="block sm:hidden text-sm font-bold text-slate-800 truncate leading-tight">{shortTitle}</h2>
          <h2 className="hidden sm:block text-xl font-bold text-slate-800 leading-tight">{title}</h2>
          <p className="hidden sm:block text-xs text-gray-400 font-normal">Internal Enterprise Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative" ref={dropdownRef}>
        {/* Notifications Icon Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) fetchNotifications();
          }}
          title="Notifications"
          className={`p-2 sm:p-2.5 rounded-xl border transition-all relative ${
            isOpen
              ? 'bg-brand-50 border-brand-300 text-brand-600 ring-2 ring-brand-500/20'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-brand-500'
          }`}
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brand-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown Panel */}
        {isOpen && (
          <div className="absolute right-0 top-12 sm:top-14 w-[320px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fade-in flex flex-col max-h-[80vh] sm:max-h-[500px]">
            {/* Dropdown Header */}
            <div className="p-3.5 sm:p-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800">{panelTitle}</h3>
                {unreadCount > 0 && (
                  <span className="bg-brand-100 text-brand-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto divide-y divide-gray-100 flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-medium">{emptyMessage}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{emptySubtext}</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isUnread = !notif.is_read || notif.is_read === 0 || notif.is_read === '0';
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkRead(notif.id)}
                      className={`p-3.5 sm:p-4 hover:bg-gray-50/80 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                        isUnread ? 'bg-orange-50/30' : 'bg-white'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-gray-100 shrink-0 mt-0.5">
                        {getNotifIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className={`text-xs leading-tight truncate ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {notif.title}
                          </h4>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" title="Unread"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-snug break-words">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-gray-400 font-medium block mt-1">
                          {formatDateTime(notif.created_at)}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteNotif(e, notif.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 rounded transition-all absolute right-2 top-3"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dropdown Footer */}
            {notifications.length > 0 && (
              <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                <button
                  onClick={fetchNotifications}
                  className="text-[11px] font-semibold text-gray-500 hover:text-brand-600 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh notifications</span>
                </button>
              </div>
            )}
          </div>
        )}

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
