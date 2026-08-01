import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import { formatDateTime } from '../../utils/formatters';
import { ShieldCheck, Activity } from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await api.get('/logs/activity');
        setLogs(res.data.logs);
      } catch (err) {
        console.error('Fetch logs error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const columns = [
    {
      header: 'ID',
      accessorKey: 'id',
      render: (row) => <span className="font-mono text-xs font-semibold text-slate-500">#{row.id}</span>
    },
    {
      header: 'User',
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.user_name || 'System'}</span>
      )
    },
    {
      header: 'Action',
      render: (row) => (
        <span className="font-semibold text-brand-600 text-xs px-2.5 py-1 bg-brand-50 border border-brand-100 rounded-lg">
          {row.action}
        </span>
      )
    },
    {
      header: 'Details',
      accessorKey: 'details',
      render: (row) => <span className="text-slate-600 text-xs">{row.details}</span>
    },
    {
      header: 'Timestamp',
      render: (row) => <span className="text-xs text-gray-400 font-mono">{formatDateTime(row.created_at)}</span>
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">System Activity Audit Trail</h2>
          <p className="text-xs text-gray-400">Complete immutable record of all administrative & employee actions</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-full text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Audit Logged
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No activity logs recorded."
      />
    </div>
  );
}
