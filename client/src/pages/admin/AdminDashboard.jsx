import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import StatsCard from '../../components/common/StatsCard';
import Modal from '../../components/common/Modal';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  IndianRupee,
  Users,
  Briefcase,
  TrendingUp,
  UserCheck,
  Wallet,
  Eye,
  FileText,
  User,
  Mail,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/formatters';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state for Advance Payments Received breakdown & View Details
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/dashboard/admin');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { metrics, feeds } = data;
  const advanceList = feeds?.advancePaymentsList || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* 1. Top KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatsCard
          title="Total Projects"
          value={metrics.totalProjects}
          icon={FolderKanban}
          color="orange"
          subtitle="All managed company projects"
        />
        <StatsCard
          title="Completed Projects"
          value={metrics.completedProjects}
          icon={CheckCircle}
          color="green"
          subtitle="Successfully delivered"
        />
        <StatsCard
          title="Ongoing Projects"
          value={metrics.ongoingProjects}
          icon={Clock}
          color="amber"
          subtitle="Currently in progress"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={IndianRupee}
          color="blue"
          subtitle="Gross project value"
        />

        {/* SPECIAL SLOT: Advance Payments Received */}
        <div onClick={() => setAdvanceModalOpen(true)} className="cursor-pointer transform hover:-translate-y-1 transition-all">
          <StatsCard
            title="Advance Payment Received"
            value={formatCurrency(metrics.totalAdvanceReceived || 0)}
            icon={Wallet}
            color="green"
            subtitle="Click to view client breakdown →"
          />
        </div>

        <StatsCard
          title="Employee Payout"
          value={formatCurrency(metrics.totalEmployeePayout)}
          icon={TrendingUp}
          color="purple"
          subtitle="Total assigned payouts"
        />
        <StatsCard
          title="Active Employees"
          value={metrics.totalEmployees}
          icon={Users}
          color="green"
          subtitle="Developers & staff"
        />
        <StatsCard
          title="Total Clients"
          value={metrics.totalClients}
          icon={Briefcase}
          color="orange"
          subtitle="Registered accounts"
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(metrics.totalRevenue - metrics.totalEmployeePayout)}
          icon={UserCheck}
          color="blue"
          subtitle="Company margin"
        />
      </div>

      {/* 2. Recent Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed 1: Recent Projects */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Recent Projects</h3>
            <span className="text-xs text-brand-600 font-semibold">Latest updates</span>
          </div>
          <div className="space-y-3">
            {feeds && feeds.recentProjects && feeds.recentProjects.length > 0 ? (
              feeds.recentProjects.map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl border border-gray-100 hover:border-brand-100 hover:bg-brand-50/20 transition-all flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">{p.project_type}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Client: <span className="font-medium text-slate-700">{p.client_name}</span> | Assigned: <span className="font-medium text-slate-700">{p.assigned_employee || 'Unassigned'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-600">{formatCurrency(p.total_worth)}</p>
                    <p className="text-[11px] text-gray-400">{formatDate(p.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">No recent projects found.</p>
            )}
          </div>
        </div>

        {/* Feed 2: Recent Clients */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-card space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3">Recent Clients</h3>
            <div className="space-y-2.5">
              {feeds && feeds.recentClients && feeds.recentClients.length > 0 ? (
                feeds.recentClients.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/80">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-600 font-bold flex items-center justify-center text-xs">
                      {c.name ? c.name.charAt(0) : 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{c.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-4 text-center">No recent clients found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Advance Payments Received Breakdown */}
      <Modal
        isOpen={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        title="Advance Payments Received Breakdown"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center shadow-md">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Super Admin Financial Slot</span>
                <h3 className="text-base font-bold text-slate-900">Client Advance Payments Received</h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Advance Collected</span>
              <span className="text-xl font-black text-emerald-600">{formatCurrency(metrics.totalAdvanceReceived || 0)}</span>
            </div>
          </div>

          {advanceList.length === 0 ? (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No advance payments recorded yet</p>
              <p className="text-xs text-gray-400 mt-1">When creating or assigning a project, enter the advance amount paid upfront by the client.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Client & Project</th>
                    <th className="px-4 py-3">Total Worth</th>
                    <th className="px-4 py-3">Advance Paid (₹)</th>
                    <th className="px-4 py-3">Remaining Due</th>
                    <th className="px-4 py-3">Assigned Developer</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {advanceList.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{p.client_name}</p>
                        <p className="text-xs text-brand-600 font-medium">{p.project_name || p.project_type}</p>
                        <p className="text-[11px] text-gray-400">{p.client_email} | {p.client_mobile}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {formatCurrency(p.total_worth)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
                          {formatCurrency(p.advance_amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-700">
                        {formatCurrency(p.remaining_balance || (p.total_worth - p.advance_amount))}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                        {p.assigned_employee_name ? (
                          <div>
                            <p className="font-bold text-slate-800">{p.assigned_employee_name}</p>
                            <p className="text-[10px] text-brand-600">{p.assigned_employee_code}</p>
                          </div>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedProjectDetails(p)}
                          className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1 shadow-md shadow-brand-500/20 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> View More Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 2: View Full Assigned Project Form Details */}
      {selectedProjectDetails && (
        <Modal
          isOpen={!!selectedProjectDetails}
          onClose={() => setSelectedProjectDetails(null)}
          title={`Assigned Form Details: ${selectedProjectDetails.project_name || selectedProjectDetails.client_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Banner */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Assigned Project #{selectedProjectDetails.id}</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedProjectDetails.project_name || `${selectedProjectDetails.client_name} Project`}</h3>
                <p className="text-xs text-slate-600">Category: <span className="font-semibold text-brand-600">{selectedProjectDetails.project_type}</span></p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(selectedProjectDetails.status)}`}>
                {selectedProjectDetails.status}
              </span>
            </div>

            {/* Client Info Card */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-500" /> Client Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div>
                  <span className="text-gray-400 font-medium block">Client Name</span>
                  <span className="font-bold text-slate-800">{selectedProjectDetails.client_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Client Email</span>
                  <span className="font-semibold text-brand-600">{selectedProjectDetails.client_email}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Client Mobile</span>
                  <span className="font-bold text-slate-800">{selectedProjectDetails.client_mobile}</span>
                </div>
              </div>
            </div>

            {/* Financial & Advance Payment Breakdown */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs">
              <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" /> Super Admin Financial & Advance Payment Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-gray-400 font-medium block">Total Client Project Worth</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(selectedProjectDetails.total_worth)}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 font-bold block">Advance Paid Upfront</span>
                  <span className="text-base font-black text-emerald-600">{formatCurrency(selectedProjectDetails.advance_amount)}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 font-medium block">Remaining Due Balance</span>
                  <span className="text-base font-bold text-slate-800">{formatCurrency(selectedProjectDetails.remaining_balance || (selectedProjectDetails.total_worth - selectedProjectDetails.advance_amount))}</span>
                </div>
              </div>
            </div>

            {/* Developer Assignment Payout Info */}
            <div className="bg-brand-50/60 p-4 rounded-2xl border border-brand-200 space-y-2 text-xs">
              <h4 className="font-bold text-brand-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600" /> Developer Assignment & Payout Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-gray-400 font-medium block">Assigned Developer</span>
                  <span className="font-bold text-slate-800">{selectedProjectDetails.assigned_employee_name || 'Unassigned'} ({selectedProjectDetails.assigned_employee_code || 'N/A'})</span>
                </div>
                <div>
                  <span className="text-brand-600 font-bold block">Developer Assigned Payout</span>
                  <span className="text-base font-bold text-brand-700">{formatCurrency(selectedProjectDetails.assigned_amount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Remarks & Dates */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-400 font-medium block">Assignment Remarks / Instructions:</span>
                <p className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-800 font-medium mt-1">
                  {selectedProjectDetails.assignment_remarks || 'No special remarks provided.'}
                </p>
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                <span>Created Date: {formatDate(selectedProjectDetails.created_at)}</span>
                <span>Payment Status: <strong className="text-slate-700">{selectedProjectDetails.payment_status}</strong></span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedProjectDetails(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-xl font-bold text-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

