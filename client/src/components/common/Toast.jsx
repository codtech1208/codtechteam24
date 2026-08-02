import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
    },
    error: {
      bg: 'bg-rose-50 text-rose-800 border-rose-300',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
    },
    warning: {
      bg: 'bg-amber-50 text-amber-800 border-amber-300',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
    },
    info: {
      bg: 'bg-blue-50 text-blue-800 border-blue-300',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />
    }
  };

  const current = typeConfig[type] || typeConfig.success;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-sm z-[100] animate-fade-in pointer-events-auto">
      <div className={`flex items-start sm:items-center gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-xl backdrop-blur-md ${current.bg}`}>
        <div className="mt-0.5 sm:mt-0">{current.icon}</div>
        <p className="text-xs sm:text-sm font-medium flex-1 break-words min-w-0 leading-snug">{message}</p>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0 -mr-1"
        >
          <X className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  );
}
