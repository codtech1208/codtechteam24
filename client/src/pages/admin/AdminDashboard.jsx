import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import StatsCard from '../../components/common/StatsCard';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  IndianRupee,
  Users,
  Briefcase,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/formatters';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const { metrics, charts, feeds } = data;
  const COLORS = ['#FF6B00', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* 1. Top KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* 2. Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Projects by Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-card">
          <h3 className="text-base font-bold text-slate-800 mb-4">Projects by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.projectsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {charts.projectsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Projects']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue by Project Type */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-card">
          <h3 className="text-base font-bold text-slate-800 mb-4">Revenue Breakdown by Project Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueByType}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `₹${val / 1000}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => [formatCurrency(val), 'Revenue']} />
                <Bar dataKey="revenue" fill="#FF6B00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Employee Performance Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-card lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 mb-4">Employee Performance (Assigned vs Completed)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.employeePerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="employee_name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" name="Total Assigned" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ongoing" name="Ongoing" fill="#FF6B00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Recent Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed 1: Recent Projects */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Recent Projects</h3>
            <span className="text-xs text-brand-600 font-semibold">Latest updates</span>
          </div>
          <div className="space-y-3">
            {feeds.recentProjects.map((p) => (
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
            ))}
          </div>
        </div>

        {/* Feed 2: Recent Clients */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-card space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3">Recent Clients</h3>
            <div className="space-y-2.5">
              {feeds.recentClients.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/80">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-600 font-bold flex items-center justify-center text-xs">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{c.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
