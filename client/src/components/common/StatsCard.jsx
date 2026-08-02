import React from 'react';

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'orange', trend }) {
  const colorStyles = {
    orange: 'bg-brand-50 text-brand-500 border-brand-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  const selected = colorStyles[color] || colorStyles.orange;

  return (
    <div className="bg-white p-3 sm:p-5 rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-300 group">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 leading-tight">{title}</span>
        {Icon && (
          <div className={`p-2 sm:p-2.5 rounded-xl border ${selected} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight truncate">{value}</h3>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ml-1 ${trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-normal truncate">{subtitle}</p>}
    </div>
  );
}
