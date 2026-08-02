import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Toast from '../../components/common/Toast';
import { exportToPDF, exportToExcel, exportToCSV } from '../../utils/exportUtils';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FileText, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('revenue');
  const [reportData, setReportData] = useState([]);
  const [reportTitle, setReportTitle] = useState('Revenue Report');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchReport = async (type) => {
    setLoading(true);
    try {
      const res = await api.get('/reports', { params: { type } });
      setReportData(res.data.data);
      setReportTitle(res.data.reportType);
    } catch (err) {
      console.error('Fetch report error:', err);
      setToast({ message: 'Failed to generate report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(reportType);
  }, [reportType]);

  const formatReportValue = (key, val) => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'number' && (key.includes('worth') || key.includes('amount') || key.includes('revenue') || key.includes('earnings') || key.includes('payout') || key.includes('margin') || key.includes('spent'))) {
      return formatCurrency(val);
    }
    if (key.includes('created') || key.includes('assigned') || key.includes('changed') || key.includes('submitted') || key.includes('date') || key.includes('at') || key.includes('time')) {
      return formatDate(val);
    }
    return String(val);
  };

  // Handle PDF Export
  const handleExportPDF = () => {
    if (!reportData || !reportData.length) return;
    const rawCols = Object.keys(reportData[0]);
    const columns = rawCols.map((k) => k.replace(/_/g, ' ').toUpperCase());
    const rows = reportData.map((row) => rawCols.map((k) => formatReportValue(k, row[k])));
    exportToPDF(reportTitle, columns, rows, reportType);
    setToast({ message: 'PDF Report Exported Successfully', type: 'success' });
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    if (!reportData || !reportData.length) return;
    const formattedData = reportData.map((row) => {
      const obj = {};
      Object.keys(row).forEach((k) => {
        obj[k.replace(/_/g, ' ').toUpperCase()] = formatReportValue(k, row[k]);
      });
      return obj;
    });
    exportToExcel(`CODTECH_${reportTitle}`, formattedData);
    setToast({ message: 'Excel Report Exported Successfully', type: 'success' });
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    if (!reportData || !reportData.length) return;
    const formattedData = reportData.map((row) => {
      const obj = {};
      Object.keys(row).forEach((k) => {
        obj[k.replace(/_/g, ' ').toUpperCase()] = formatReportValue(k, row[k]);
      });
      return obj;
    });
    exportToCSV(`CODTECH_${reportTitle}`, formattedData);
    setToast({ message: 'CSV Report Exported Successfully', type: 'success' });
  };

  // Generate dynamic table columns based on report data keys
  const getDynamicColumns = () => {
    if (!reportData || !reportData.length) return [];
    return Object.keys(reportData[0]).map((key) => ({
      header: key.replace(/_/g, ' ').toUpperCase(),
      accessorKey: key,
      render: (row) => {
        const val = row[key];
        if (typeof val === 'number' && (key.includes('worth') || key.includes('amount') || key.includes('revenue') || key.includes('earnings') || key.includes('payout') || key.includes('margin') || key.includes('spent'))) {
          return <span className="font-bold text-brand-600">{formatCurrency(val)}</span>;
        }
        if (key.includes('created') || key.includes('assigned') || key.includes('changed') || key.includes('submitted') || key.includes('date') || key.includes('at') || key.includes('time')) {
          if (val) {
            return <span className="text-slate-700 font-medium">{formatDate(val)}</span>;
          }
        }
        return <span className="text-slate-700">{String(val ?? 'N/A')}</span>;
      }
    }));
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-fade-in">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Executive Reports & Analytics</h2>
          <p className="text-xs text-gray-400">Generate, analyze, and export multi-dimensional business reports</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-all"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="p-2 bg-white rounded-2xl border border-gray-100 shadow-card flex overflow-x-auto gap-2 text-xs font-semibold">
        {[
          { id: 'revenue', label: 'Revenue Report' },
          { id: 'employee_performance', label: 'Employee Performance' },
          { id: 'status', label: 'Project Status' },
          { id: 'client', label: 'Client Summary' },
          { id: 'assignment', label: 'Assignment History' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
              reportType === tab.id
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'text-gray-500 hover:bg-gray-100 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Data Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">{reportTitle}</h3>
          <span className="text-xs text-gray-400 font-mono">{reportData.length} records generated</span>
        </div>
        <DataTable
          columns={getDynamicColumns()}
          data={reportData}
          loading={loading}
          emptyMessage="No data available for this report filter."
        />
      </div>
    </div>
  );
}
