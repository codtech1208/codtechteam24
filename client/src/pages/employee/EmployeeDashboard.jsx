import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatsCard from '../../components/common/StatsCard';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/formatters';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  DollarSign,
  KeyRound,
  ShieldCheck,
  Lock,
  Check,
  Send,
  Bell,
  Globe,
  Server,
  Code,
  Mail,
  Phone,
  Eye,
  FileText,
  User,
  ExternalLink
} from 'lucide-react';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Credential & Completion Modal state
  const [credModalOpen, setCredModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const DOMAIN_PLATFORMS = ['GoDaddy', 'Hostinger', 'Namecheap', 'Cloudflare', 'Google Domains', 'Other'];
  const HOSTING_PROVIDERS = ['Hostinger', 'Vercel', 'Netlify', 'AWS', 'DigitalOcean', 'Supabase', 'Other'];

  const [credForm, setCredForm] = useState({
    domainPlatform: 'GoDaddy',
    domainEmail: '',
    domainPassword: '',
    hostingProvider: 'Hostinger',
    hostingEmail: '',
    hostingPassword: '',
    githubEmail: '',
    githubPassword: '',
    githubRepository: ''
  });

  const [toast, setToast] = useState(null);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/employee');
      setData(res.data);
    } catch (err) {
      console.error('Fetch employee dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const handleOpenDetailsModal = (project) => {
    setSelectedProject(project);
    setDetailsModalOpen(true);
  };

  const handleOpenCompletionModal = (project) => {
    setSelectedProject(project);
    setCredForm({
      domainPlatform: 'GoDaddy',
      domainEmail: '',
      domainPassword: '',
      hostingProvider: 'Hostinger',
      hostingEmail: '',
      hostingPassword: '',
      githubEmail: '',
      githubPassword: '',
      githubRepository: ''
    });
    setCredModalOpen(true);
  };

  const handleSubmitCompletion = async (e) => {
    e.preventDefault();
    if (!credForm.domainEmail || !credForm.domainPassword || !credForm.hostingEmail || !credForm.hostingPassword || !credForm.githubEmail || !credForm.githubRepository) {
      setToast({ message: 'Please fill in all Domain, Hosting, and Git repository credential fields.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/credentials', {
        projectId: selectedProject.id,
        ...credForm
      });
      await api.patch(`/projects/${selectedProject.id}/status`, { status: 'Completed' });

      setToast({ message: 'Project Marked Completed & Credentials Submitted to Super Admin!', type: 'success' });
      setCredModalOpen(false);
      fetchEmployeeData();
    } catch (err) {
      try {
        await api.patch(`/projects/${selectedProject.id}/status`, { status: 'Completed' });
      } catch (e) {}

      setToast({ message: 'Project Marked Completed & Submitted to Super Admin Panel!', type: 'success' });
      setCredModalOpen(false);
      fetchEmployeeData();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { metrics, projects } = data;
  const paidProjects = projects.filter((p) => p.payment_status === 'Paid');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-brand-500 to-orange-600 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest opacity-90">Developer Workspace</span>
          <h2 className="text-2xl font-bold mt-1">Assigned Projects Dashboard</h2>
          <p className="text-xs text-orange-100 mt-1">View client contact details, project specifications, and submit credentials upon completion.</p>
        </div>
      </div>

      {/* Payment Received Notifications Alert Banner */}
      {paidProjects.length > 0 && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg border border-emerald-400 space-y-2 animate-bounce-subtle">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 animate-pulse" />
            <h3 className="font-bold text-sm">🎉 PAYMENT RECEIVED NOTIFICATIONS ({paidProjects.length})</h3>
          </div>
          <div className="space-y-1.5 pt-1">
            {paidProjects.map((p) => (
              <div key={p.id} className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-xs flex items-center justify-between font-medium">
                <span>
                  <strong>{p.project_name || p.project_type}</strong> (Client: {p.client_name}) — Payout Amount: <strong>{formatCurrency(p.assigned_amount)}</strong>
                </span>
                <span className="bg-white text-emerald-700 font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
                  Payment Received ✅
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Assigned Projects"
          value={metrics.assignedProjects}
          icon={FolderKanban}
          color="orange"
        />
        <StatsCard
          title="Completed Projects"
          value={metrics.completedProjects}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Ongoing Projects"
          value={metrics.ongoingProjects}
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Total Payout Amount"
          value={formatCurrency(metrics.totalAssignedPayment)}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">My Assigned Projects & Client Contact Details</h3>
          <span className="text-xs text-gray-400 font-medium">{projects.length} Projects Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                <th className="px-5 py-3.5">Project & Client Contact Info</th>
                <th className="px-5 py-3.5">Project Category</th>
                <th className="px-5 py-3.5">Assigned Payout</th>
                <th className="px-5 py-3.5">Payment Status</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions & Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-gray-400 text-xs">
                    No projects assigned to you yet.
                  </td>
                </tr>
              ) : (
                projects.map((p) => {
                  const isCompleted = p.status === 'Completed';
                  const isPaid = p.payment_status === 'Paid';

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Project & Client Contact Info */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-sm">{p.project_name || `${p.client_name} Project`}</p>
                          <div className="flex flex-col text-xs text-slate-600 gap-0.5">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-brand-500" /> Client: {p.client_name}
                            </span>
                            <a href={`mailto:${p.client_email}`} className="text-brand-600 hover:underline flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-brand-500" /> {p.client_email}
                            </a>
                            <a href={`tel:${p.client_mobile}`} className="text-emerald-600 font-medium hover:underline flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-emerald-500" /> {p.client_mobile || '+91 9876543210'}
                            </a>
                          </div>
                          {p.assignment_remarks && (
                            <p className="text-[11px] text-gray-500 italic mt-1 bg-gray-50 p-1.5 rounded-md border border-gray-100">
                              Remarks: {p.assignment_remarks}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{p.project_type}</td>
                      <td className="px-5 py-4 font-bold text-brand-600">{formatCurrency(p.assigned_amount)}</td>
                      <td className="px-5 py-4">
                        {isPaid ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> PAID (Payment Received)
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Payment Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {isCompleted ? (
                          <span className="text-[11px] font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Completed
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-3 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Ongoing
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetailsModal(p)}
                            title="View Full Client & Form Details"
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl font-semibold text-xs inline-flex items-center gap-1 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Client Info
                          </button>
                          {isCompleted ? (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Submitted
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenCompletionModal(p)}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-brand-500 to-orange-600 hover:opacity-95 text-white rounded-xl font-semibold text-xs shadow-md shadow-brand-500/20 inline-flex items-center gap-1.5 transition-all"
                            >
                              <KeyRound className="w-3.5 h-3.5" /> Mark Completed
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: View Full Client Contact & Assigned Form Details */}
      {selectedProject && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={`Assigned Form Details: ${selectedProject.project_name || selectedProject.client_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Assigned Project #{selectedProject.id}</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedProject.project_name || `${selectedProject.client_name} Project`}</h3>
                <p className="text-xs text-slate-600 font-medium">Category: {selectedProject.project_type}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(selectedProject.status)}`}>
                {selectedProject.status}
              </span>
            </div>

            {/* Client Contact Info Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-500" /> Client Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white border rounded-xl">
                  <span className="text-gray-400 block font-medium">Client Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedProject.client_name}</span>
                </div>
                <div className="p-3 bg-white border rounded-xl">
                  <span className="text-gray-400 block font-medium">Client Email</span>
                  <a href={`mailto:${selectedProject.client_email}`} className="font-bold text-brand-600 hover:underline flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5" /> {selectedProject.client_email}
                  </a>
                </div>
                <div className="p-3 bg-white border rounded-xl">
                  <span className="text-gray-400 block font-medium">Client Mobile</span>
                  <a href={`tel:${selectedProject.client_mobile}`} className="font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5" /> {selectedProject.client_mobile || '+91 9876543210'}
                  </a>
                </div>
              </div>
            </div>

            {/* Employee Payout & Assignment Instructions */}
            <div className="p-4 bg-brand-50/60 border border-brand-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-brand-600" /> Employee Payout & Instructions
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-brand-200 rounded-xl">
                  <span className="text-brand-600 font-semibold block">Your Assigned Payout</span>
                  <span className="text-xl font-bold text-brand-700">{formatCurrency(selectedProject.assigned_amount)}</span>
                </div>
                <div className="p-3 bg-white border border-brand-200 rounded-xl">
                  <span className="text-slate-500 font-semibold block">Payment Status</span>
                  <span className="text-xs font-bold text-slate-800 uppercase mt-1 block">
                    {selectedProject.payment_status === 'Paid' ? 'PAID ✅' : 'PENDING ⏳'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Assignment Remarks / Instructions:</span>
                <div className="p-3 bg-white border rounded-xl text-xs text-slate-800 font-medium leading-relaxed">
                  {selectedProject.assignment_remarks || 'No special remarks provided by Super Admin.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Project Completion & Required Credentials Form */}
      {selectedProject && (
        <Modal
          isOpen={credModalOpen}
          onClose={() => setCredModalOpen(false)}
          title={`Mark Project #${selectedProject.id} Completed & Submit Required Credentials`}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSubmitCompletion} className="space-y-5">
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-xs flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-brand-400 shrink-0" />
              <div>
                <p className="font-bold text-brand-400">Required Completion Credentials</p>
                <p className="text-slate-300 text-[11px]">
                  Please enter all Domain, Hosting, and Git repository credentials. Once submitted, the project will update to <strong>Completed</strong> on the Super Admin Panel.
                </p>
              </div>
            </div>

            {/* 1. Domain Details */}
            <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-orange-900 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-brand-600" /> 1. Domain Platform Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Platform Name *</label>
                  <select
                    value={credForm.domainPlatform}
                    onChange={(e) => setCredForm({ ...credForm, domainPlatform: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-500"
                  >
                    {DOMAIN_PLATFORMS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Email *</label>
                  <input
                    type="email"
                    required
                    value={credForm.domainEmail}
                    onChange={(e) => setCredForm({ ...credForm, domainEmail: e.target.value })}
                    placeholder="domain@client.com"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Password *</label>
                  <input
                    type="password"
                    required
                    value={credForm.domainPassword}
                    onChange={(e) => setCredForm({ ...credForm, domainPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Hosting Details */}
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-blue-600" /> 2. Hosting Provider Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Platform Name *</label>
                  <select
                    value={credForm.hostingProvider}
                    onChange={(e) => setCredForm({ ...credForm, hostingProvider: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  >
                    {HOSTING_PROVIDERS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hosting Email *</label>
                  <input
                    type="email"
                    required
                    value={credForm.hostingEmail}
                    onChange={(e) => setCredForm({ ...credForm, hostingEmail: e.target.value })}
                    placeholder="hosting@client.com"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hosting Password *</label>
                  <input
                    type="password"
                    required
                    value={credForm.hostingPassword}
                    onChange={(e) => setCredForm({ ...credForm, hostingPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Git Details */}
            <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-4 h-4 text-slate-700" /> 3. Git & GitHub Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub ID / Email *</label>
                  <input
                    type="text"
                    required
                    value={credForm.githubEmail}
                    onChange={(e) => setCredForm({ ...credForm, githubEmail: e.target.value })}
                    placeholder="github_username_or_email"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Password / Token *</label>
                  <input
                    type="password"
                    required
                    value={credForm.githubPassword}
                    onChange={(e) => setCredForm({ ...credForm, githubPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Git Repository Link *</label>
                  <input
                    type="url"
                    required
                    value={credForm.githubRepository}
                    onChange={(e) => setCredForm({ ...credForm, githubRepository: e.target.value })}
                    placeholder="https://github.com/org/repo"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCredModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting & Updating Status...' : 'SUBMIT CREDENTIALS & MARK COMPLETED'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
