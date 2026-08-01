/**
 * Format number into INR currency string (e.g. ₹45,000)
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Format ISO date string into readable format (e.g., Aug 01, 2026)
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get status color classes for Tailwind
 */
export function getStatusBadge(status) {
  if (status === 'Completed') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (status === 'Ongoing') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (status === 'active') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (status === 'inactive') {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
}
