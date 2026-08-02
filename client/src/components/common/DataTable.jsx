import React from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

export default function DataTable({
  columns,
  data = [],
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  pagination,
  onPageChange,
  loading = false,
  emptyMessage = 'No records found.',
  headerAction
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Search Header */}
      {(onSearchChange || headerAction) && (
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {onSearchChange && (
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          )}
          {headerAction && (
            <div className="shrink-0">{headerAction}</div>
          )}
        </div>
      )}

      {/* Table — horizontally scrollable on mobile */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-sm min-w-[500px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-medium text-xs uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap ${col.className || ''}`}>
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-60" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-slate-700 font-normal">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                  <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-xs">Loading data...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-brand-50/20 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-3 sm:px-6 py-3 sm:py-4 ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 bg-gray-50/50">
          <div className="text-center sm:text-left">
            Showing <span className="font-semibold text-slate-800">{((pagination.currentPage - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">{Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.totalRecords}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.currentPage <= 1}
              onClick={() => onPageChange(pagination.currentPage - 1)}
              className="p-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700 px-2">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => onPageChange(pagination.currentPage + 1)}
              className="p-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
