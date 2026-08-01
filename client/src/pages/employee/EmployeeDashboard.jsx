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
  Check
} from 'lucide-react';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Credential modal state
  const [credModalOpen, setCredModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const DOMAIN_PLATFORMS = ['GoDaddy', 'Hostinger', 'Namecheap', 'Cloudflare', 'Other'];
  const HOSTING_PROVIDERS = ['Hostinger', 'Supabase', 'Vercel', 'Netlify', 'AWS', 'DigitalOcean', 'Other'];

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

  const handleStatusChange = async (project, newStatus) => {
    if (newStatus !== 'Completed') return;
    if (!window.confirm(`Mark Project #${project.id} (${project.project_type}) as Completed?`)) return;

    try {
      await api.patch(`/projects/${project.id}/status`, { status: 'Completed' });
      setToast({ message: 'Status Updated Successfully! Credential submission is now unlocked.', type: 'success' });
      fetchEmployeeData();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to update status', type: 'error' });
    }
  };

  const handleOpenCredentialsModal = (project) => {
    if (project.status !== 'Completed') {
      setToast({
        message: 'Credential submission is locked until the project is marked as Completed.',
        type: 'warning'
      });
      return;
    }
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

  const handleCredSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/credentials', {
        projectId: selectedProject.id,
        ...credForm
      });
      setToast({ message: 'Credentials Submitted Successfully (AES-256 Encrypted)', type: 'success' });
      setCredModalOpen(false);
      fetchEmployeeData();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to submit credentials', type: 'error' });
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-brand-500 to-orange-600 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest opacity-90">Employee Workspace</span>
          <h2 className="text-2xl font-bold mt-1">Assigned Projects Dashboard</h2>
          <p className="text-xs text-orange-100 mt-1">Manage project progress and securely submit project credentials upon completion.</p>
        </div>
      </div>

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
          title="Total Assigned Payment"
          value={formatCurrency(metrics.totalAssignedPayment)}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">My Assigned Projects</h3>
          <span className="text-xs text-gray-400 font-medium">{projects.length} Projects Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                <th className="px-5 py-3.5">Client Name</th>
                <th className="px-5 py-3.5">Project Type</th>
                <th className="px-5 py-3.5">Assigned Payout</th>
                <th className="px-5 py-3.5">Created Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions / Credentials</th>
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
                  const hasSubmittedCreds = p.has_credentials;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">{p.client_name}</p>
                        <p className="text-xs text-gray-400">{p.client_email}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{p.project_type}</td>
                      <td className="px-5 py-4 font-bold text-brand-600">{formatCurrency(p.assigned_amount)}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{formatDate(p.created_at)}</td>
                      <td className="px-5 py-4">
                        {isCompleted ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                            Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(p, 'Completed')}
                            className="text-xs font-semibold px-3 py-1.5 bg-amber-50 hover:bg-emerald-50 text-amber-700 hover:text-emerald-700 border border-amber-200 hover:border-emerald-300 rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" /> Mark Completed
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!isCompleted ? (
                          <span className="text-xs text-gray-400 font-medium flex items-center justify-end gap-1">
                            <Lock className="w-3.5 h-3.5 text-gray-400" /> Credentials Locked
                          </span>
                        ) : hasSubmittedCreds ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Credentials Submitted
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenCredentialsModal(p)}
                            className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-xs shadow-md shadow-brand-500/20 inline-flex items-center gap-1.5 transition-all"
                          >
                            <KeyRound className="w-3.5 h-3.5" /> Submit Credentials
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Secure Credential Submission */}
      {selectedProject && (
        <Modal
          isOpen={credModalOpen}
          onClose={() => setCredModalOpen(false)}
          title={`Submit Encrypted Credentials: Project #${selectedProject.id}`}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleCredSubmit} className="space-y-5">
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-xs flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-brand-400 shrink-0" />
              <div>
                <p className="font-bold text-brand-400">AES-256 Encryption Security</p>
                <p className="text-slate-300 text-[11px]">All passwords submitted here are encrypted using AES-256 before storing. Passwords are never stored in plain text.</p>
              </div>
            </div>

            {/* Domain Credentials */}
            <div className="p-4 bg-gray-50 border rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">1. Domain Platform Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Platform</label>
                  <select
                    value={credForm.domainPlatform}
                    onChange={(e) => setCredForm({ ...credForm, domainPlatform: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  >
                    {DOMAIN_PLATFORMS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Login Email</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Password</label>
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

            {/* Hosting Credentials */}
            <div className="p-4 bg-gray-50 border rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">2. Hosting Provider Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hosting Provider</label>
                  <select
                    value={credForm.hostingProvider}
                    onChange={(e) => setCredForm({ ...credForm, hostingProvider: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  >
                    {HOSTING_PROVIDERS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hosting Login Email</label>
                  <input
                    type="email"
                    required
                    value={credForm.hostingEmail}
                    onChange={(e) => setCredForm({ ...credForm, hostingEmail: e.target.value })}
                    placeholder="hosting@client.com"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hosting Password</label>
                  <input
                    type="password"
                    required
                    value={credForm.hostingPassword}
                    onChange={(e) => setCredForm({ ...credForm, hostingPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* GitHub Credentials */}
            <div className="p-4 bg-gray-50 border rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">3. GitHub Repository Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Repository URL</label>
                  <input
                    type="url"
                    required
                    value={credForm.githubRepository}
                    onChange={(e) => setCredForm({ ...credForm, githubRepository: e.target.value })}
                    placeholder="https://github.com/org/repo"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Email</label>
                  <input
                    type="email"
                    required
                    value={credForm.githubEmail}
                    onChange={(e) => setCredForm({ ...credForm, githubEmail: e.target.value })}
                    placeholder="dev@github.com"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Password / Token</label>
                  <input
                    type="password"
                    required
                    value={credForm.githubPassword}
                    onChange={(e) => setCredForm({ ...credForm, githubPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
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
                className="px-5 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-md shadow-brand-500/20"
              >
                Encrypt & Submit Credentials
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
