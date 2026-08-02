import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in overflow-y-auto overflow-x-hidden max-w-full">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-full ${maxWidth} overflow-hidden flex flex-col my-2 sm:my-auto max-h-[96vh] sm:max-h-[92vh] min-w-0`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 bg-gray-50/90 shrink-0 min-w-0">
          <h3 className="text-xs sm:text-base font-bold text-slate-800 leading-tight pr-2 min-w-0 break-words flex-1">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/50 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
