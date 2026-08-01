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
    <div className="fixed top-5 right-5 z-50 animate-fade-in max-w-sm w-full">
      <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md ${current.bg}`}>
        {current.icon}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  );
}
