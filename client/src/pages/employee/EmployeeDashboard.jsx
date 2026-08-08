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
  ExternalLink,
  Wallet,
  IndianRupee,
  ArrowUpRight
} from 'lucide-react';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'notifications'

  // Credential & Completion Modal state
  const [credModalOpen, setCredModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [receivedBreakdownModalOpen, setReceivedBreakdownModalOpen] = useState(false);
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
      await api.patch(`/projects/${selectedProject.id}/status`, { status: 'Completed' });
      await api.post('/credentials', {
        projectId: selectedProject.id,
        ...credForm
      });

      setToast({ message: 'Project Marked Completed & Credentials Submitted to Super Admin!', type: 'success' });
      setCredModalOpen(false);
      fetchEmployeeData();
    } catch (err) {
      console.error('Submit credentials error:', err);
      setToast({ message: err.response?.data?.error || 'Failed to submit credentials.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (project, newStatus) => {
    if (newStatus === 'Completed') {
      handleOpenCompletionModal(project);
      return;
    }

    try {
      await api.patch(`/projects/${project.id}/status`, { status: newStatus });
      setToast({ message: `Project status updated to '${newStatus}'`, type: 'success' });
      fetchEmployeeData();
    } catch (err) {
      console.error('Update status error:', err);
      setToast({ message: 'Failed to update project status.', type: 'error' });
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
  const paidProjects = projects.filter((p) => p.payout_status === 'Paid');

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-fade-in">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-brand-500 to-orange-600 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest opacity-90">Developer Workspace</span>
          <h2 className="text-lg sm:text-2xl font-bold mt-1">Assigned Projects Dashboard</h2>
          <p className="text-xs text-orange-100 mt-1 hidden sm:block">View client contact details, project specifications, and update project workflow stages.</p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center border border-gray-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'text-gray-600 hover:bg-gray-100 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Assigned Projects</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {projects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'text-gray-600 hover:bg-gray-100 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Payment Notifications</span>
            {paidProjects.length > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-black animate-pulse">
                {paidProjects.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: Projects & KPI Cards */}
      {activeTab === 'projects' && (
        <div className="space-y-4 sm:space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <StatsCard
              title="Assigned Projects"
              value={metrics.assignedProjects}
              icon={FolderKanban}
              color="orange"
            />
            <StatsCard
              title="Completed"
              value={metrics.completedProjects}
              icon={CheckCircle}
              color="green"
            />
            <button
              onClick={() => setReceivedBreakdownModalOpen(true)}
              className="p-4 bg-emerald-50 hover:bg-emerald-100/80 border-2 border-emerald-300 rounded-2xl text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Received Payout (Paid)</span>
                <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-emerald-800">{formatCurrency(metrics.receivedPayout || 0)}</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <span className="text-[11px] font-bold text-emerald-600 block mt-0.5">Click to view project breakdown</span>
              </div>
            </button>
            <StatsCard
              title="Total Assigned Payout"
              value={formatCurrency(metrics.totalAssignedPayment)}
              icon={DollarSign}
              color="purple"
            />
          </div>

          {/* Projects Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-3 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-800">My Assigned Projects &amp; Client Contact Details</h3>
              <span className="text-xs text-gray-400 font-medium">{projects.length} Projects Total</span>
            </div>

        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full text-left text-sm border-collapse min-w-[540px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">
                <th className="px-2 sm:px-4 py-2.5">Project &amp; Client</th>
                <th className="px-2 sm:px-4 py-2.5">Type</th>
                <th className="px-2 sm:px-4 py-2.5">Payout</th>
                <th className="px-2 sm:px-4 py-2.5">Payment</th>
                <th className="px-2 sm:px-4 py-2.5">Stage</th>
                <th className="px-2 sm:px-4 py-2.5 text-right">Actions</th>
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
                      {/* Project & Client Info */}
                      <td className="px-2 sm:px-4 py-3">
                        <div className="space-y-0.5 min-w-[130px]">
                          <p className="font-bold text-slate-900 text-xs leading-tight">{p.project_name || `${p.client_name} Project`}</p>
                          <div className="flex flex-col text-[10px] text-slate-600 gap-0.5 mt-1">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <User className="w-3 h-3 text-brand-500 shrink-0" /> {p.client_name}
                            </span>
                            <a href={`mailto:${p.client_email}`} className="text-brand-600 hover:underline flex items-center gap-1 truncate max-w-[130px]">
                              <Mail className="w-3 h-3 text-brand-500 shrink-0" /> {p.client_email}
                            </a>
                            <a href={`tel:${p.client_mobile}`} className="text-emerald-600 font-medium hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-500 shrink-0" /> {p.client_mobile || 'N/A'}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-semibold text-slate-700 whitespace-nowrap">{p.project_type}</td>
                      <td className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold text-brand-600 whitespace-nowrap">{formatCurrency(p.assigned_amount)}</td>
                      <td className="px-2 sm:px-4 py-3">
                        {p.payout_status === 'Paid' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap shadow-2xs">
                            <Check className="w-3 h-3" /> Payout Paid
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 whitespace-nowrap">
                            <Clock className="w-3 h-3" /> Unpaid
                          </span>
                        )}
                      </td>
                      {/* Workflow Status Dropdown */}
                      <td className="px-2 sm:px-4 py-3">
                        <select
                          value={p.status || 'Pending'}
                          onChange={(e) => handleStatusChange(p, e.target.value)}
                          className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer max-w-[120px] sm:max-w-none ${getStatusBadge(p.status)}`}
                        >
                          <option value="Pending" className="bg-white text-slate-800">⏳ Pending</option>
                          <option value="UI Stage Completed" className="bg-white text-slate-800">🎨 UI Done</option>
                          <option value="Backend Started" className="bg-white text-slate-800">⚙️ Backend</option>
                          <option value="Project is Ready to Live" className="bg-white text-slate-800">🚀 Ready to Live</option>
                          <option value="Completed" className="bg-white text-emerald-700 font-bold">✅ Completed</option>
                        </select>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetailsModal(p)}
                            title="View Full Client & Form Details"
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-semibold text-[10px] inline-flex items-center gap-1 transition-all whitespace-nowrap"
                          >
                            <Eye className="w-3 h-3" /> Client Info
                          </button>
                          {isCompleted ? (
                            <button
                              onClick={() => handleOpenCompletionModal(p)}
                              title="Update Credentials"
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 transition-all whitespace-nowrap"
                            >
                              <ShieldCheck className="w-3 h-3" /> ✅ Done
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenCompletionModal(p)}
                              className="px-2.5 py-1 bg-gradient-to-r from-brand-500 to-orange-600 hover:opacity-95 text-white rounded-lg font-semibold text-[10px] shadow-md shadow-brand-500/20 inline-flex items-center gap-1 transition-all whitespace-nowrap"
                            >
                              <KeyRound className="w-3 h-3" /> Complete
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
    </div>
  )}

  {/* TAB 2: Payment Notifications Panel */}
  {activeTab === 'notifications' && (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Payment Received Notifications</h3>
            <p className="text-xs text-gray-400">View payout notifications confirmed and marked paid by Super Admin</p>
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
          {paidProjects.length} Verified Payments
        </span>
      </div>

      {paidProjects.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No payment notifications yet</p>
          <p className="text-xs text-gray-400 mt-1">When Super Admin marks your assigned project payout as Paid, notifications will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paidProjects.map((p) => (
            <div key={p.id} className="p-5 bg-gradient-to-r from-emerald-50/60 to-teal-50/30 border border-emerald-200/80 rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center text-lg shadow-md shadow-emerald-500/20">
                    ✓
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Payment Confirmed by Super Admin</span>
                    <h4 className="text-base font-bold text-slate-900">{p.project_name || `${p.client_name} Project`}</h4>
                    <p className="text-xs text-slate-600">Category: {p.project_type}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[11px] text-gray-400 font-semibold uppercase block">Your Payout Received</span>
                  <span className="text-lg font-black text-emerald-600">{formatCurrency(p.assigned_amount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-emerald-100">
                <div>
                  <span className="text-gray-400 font-medium block">Client Name</span>
                  <span className="font-bold text-slate-800">{p.client_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Client Email</span>
                  <span className="font-medium text-brand-600">{p.client_email}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Payment Status</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200 text-[11px]">
                    PAID (Payment Received) ✅
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}

      {/* Modal 1: View Full Client Contact & Assigned Form Details */}
      {selectedProject && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={`Assigned Form Details: ${selectedProject.project_name || selectedProject.client_name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 min-w-0">
            {/* Header info */}
            <div className="p-3 sm:p-4 bg-orange-50 rounded-2xl border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Assigned Project #{selectedProject.id}</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{selectedProject.project_name || `${selectedProject.client_name} Project`}</h3>
                <p className="text-xs text-slate-600 font-medium">Category: {selectedProject.project_type}</p>
              </div>
              <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(selectedProject.status)}`}>
                {selectedProject.status}
              </span>
            </div>

            {/* Client Contact Info Section */}
            <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 min-w-0">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
                <User className="w-4 h-4 text-brand-500 shrink-0" /> Client Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs min-w-0">
                <div className="p-2.5 sm:p-3 bg-white border rounded-xl min-w-0">
                  <span className="text-gray-400 block font-medium">Client Name</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">{selectedProject.client_name}</span>
                </div>
                <div className="p-2.5 sm:p-3 bg-white border rounded-xl min-w-0">
                  <span className="text-gray-400 block font-medium">Client Email</span>
                  <a href={`mailto:${selectedProject.client_email}`} className="font-bold text-brand-600 hover:underline flex items-center gap-1 mt-0.5 truncate text-xs">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{selectedProject.client_email}</span>
                  </a>
                </div>
                <div className="p-2.5 sm:p-3 bg-white border rounded-xl min-w-0">
                  <span className="text-gray-400 block font-medium">Client Mobile</span>
                  <a href={`tel:${selectedProject.client_mobile}`} className="font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-0.5 text-xs">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {selectedProject.client_mobile || 'N/A'}
                  </a>
                </div>
              </div>
            </div>

            {/* Employee Payout & Assignment Instructions */}
            <div className="p-3 sm:p-4 bg-brand-50/60 border border-brand-200 rounded-2xl space-y-2.5 min-w-0">
              <h4 className="font-bold text-xs text-brand-900 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
                <DollarSign className="w-4 h-4 text-brand-600 shrink-0" /> Employee Payout &amp; Instructions
              </h4>
              <div className="grid grid-cols-2 gap-2.5 text-xs min-w-0">
                <div className="p-2.5 sm:p-3 bg-white border border-brand-200 rounded-xl min-w-0">
                  <span className="text-brand-600 font-semibold block text-[10px] sm:text-xs">Your Assigned Payout</span>
                  <span className="text-base sm:text-xl font-bold text-brand-700">{formatCurrency(selectedProject.assigned_amount)}</span>
                </div>
                <div className="p-2.5 sm:p-3 bg-white border border-brand-200 rounded-xl min-w-0">
                  <span className="text-slate-500 font-semibold block text-[10px] sm:text-xs">Payment Status</span>
                  <span className="text-xs font-bold text-slate-800 uppercase mt-1 block">
                    {selectedProject.payment_status === 'Paid' ? 'PAID ✅' : 'PENDING ⏳'}
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-700 block mb-1">Assignment Remarks / Instructions:</span>
                <div className="p-2.5 sm:p-3 bg-white border rounded-xl text-xs text-slate-800 font-medium leading-relaxed break-words">
                  {selectedProject.assignment_remarks || 'No special remarks provided by Super Admin.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 min-w-0">
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
          <form onSubmit={handleSubmitCompletion} className="space-y-4 min-w-0">
            <div className="p-3 bg-slate-900 text-white rounded-2xl text-xs flex items-center gap-2.5 min-w-0">
              <ShieldCheck className="w-5 h-5 text-brand-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-brand-400 text-xs">Required Completion Credentials</p>
                <p className="text-slate-300 text-[10px] sm:text-[11px] leading-tight">
                  Enter Domain, Hosting, and Git credentials. Once submitted, status updates to <strong>Completed</strong>.
                </p>
              </div>
            </div>

            {/* 1. Domain Details */}
            <div className="p-3 sm:p-4 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-2.5 min-w-0">
              <h4 className="font-bold text-xs text-orange-900 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
                <Globe className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="truncate">1. Domain Platform Details</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 min-w-0">
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Platform Name *</label>
                  <select
                    value={credForm.domainPlatform}
                    onChange={(e) => setCredForm({ ...credForm, domainPlatform: e.target.value })}
                    className="w-full min-w-0 px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-500"
                  >
                    {DOMAIN_PLATFORMS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Domain Email *</label>
                  <input
                    type="email"
                    required
                    value={credForm.domainEmail}
                    onChange={(e) => setCredForm({ ...credForm, domainEmail: e.target.value })}
                    placeholder="domain@client.com"
                    className="w-full min-w-0 px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Domain Password *</label>
                  <input
                    type="password"
                    required
                    value={credForm.domainPassword}
                    onChange={(e) => setCredForm({ ...credForm, domainPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full min-w-0 px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Hosting Details */}
            <div className="p-3 sm:p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2.5 min-w-0">
              <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
                <Server className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">2. Hosting Provider Details</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 min-w-0">
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Platform Name *</label>
                  <select
                    value={credForm.hostingProvider}
                    onChange={(e) => setCredForm({ ...credForm, hostingProvider: e.target.value })}
                    className="w-full min-w-0 px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  >
                    {HOSTING_PROVIDERS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Hosting Email *</label>
                  <input
                    type="email"
                    required
                    value={credForm.hostingEmail}
                    onChange={(e) => setCredForm({ ...credForm, hostingEmail: e.target.value })}
                    placeholder="hosting@client.com"
                    className="w-full min-w-0 px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Hosting Password *</label>
                  <input
                    type="password"
                    required
                    value={credForm.hostingPassword}
                    onChange={(e) => setCredForm({ ...credForm, hostingPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full min-w-0 px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Git Details */}
            <div className="p-3 sm:p-4 bg-slate-100 border border-slate-300 rounded-2xl space-y-2.5 min-w-0">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
                <Code className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="truncate">3. Git &amp; GitHub Details</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 min-w-0">
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">GitHub ID / Email *</label>
                  <input
                    type="text"
                    required
                    value={credForm.githubEmail}
                    onChange={(e) => setCredForm({ ...credForm, githubEmail: e.target.value })}
                    placeholder="github_username_or_email"
                    className="w-full min-w-0 px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">GitHub Password / Token *</label>
                  <input
                    type="password"
                    required
                    value={credForm.githubPassword}
                    onChange={(e) => setCredForm({ ...credForm, githubPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full min-w-0 px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Git Repository Link *</label>
                  <input
                    type="url"
                    required
                    value={credForm.githubRepository}
                    onChange={(e) => setCredForm({ ...credForm, githubRepository: e.target.value })}
                    placeholder="https://github.com/org/repo"
                    className="w-full min-w-0 px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 min-w-0">
              <button
                type="button"
                onClick={() => setCredModalOpen(false)}
                className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50 justify-center"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'SUBMIT & MARK COMPLETED'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Modal: Employee Received Payout Breakdown */}
      {receivedBreakdownModalOpen && (
        <Modal
          isOpen={receivedBreakdownModalOpen}
          onClose={() => setReceivedBreakdownModalOpen(false)}
          title="My Received Payouts Breakdown"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold opacity-90 block">Total Received Payout</span>
                <h3 className="text-2xl sm:text-3xl font-black mt-0.5">{formatCurrency(metrics.receivedPayout || 0)}</h3>
                <p className="text-xs text-emerald-100 mt-1">Confirmed & Paid by Admin</p>
              </div>
              <Wallet className="w-12 h-12 opacity-80" />
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Paid Projects Breakdown ({paidProjects.length})
            </h4>

            {paidProjects.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <IndianRupee className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">No paid payouts recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {paidProjects.map((p) => (
                  <div key={p.id} className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-slate-900 text-sm">{p.project_name || `${p.client_name} Project`}</h5>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Client: <span className="font-semibold text-slate-800">{p.client_name}</span> ({p.project_type})
                      </p>
                      {p.payout_paid_at && (
                        <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Paid On: {formatDate(p.payout_paid_at)}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right bg-white px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase block">Payout Received</span>
                      <span className="text-lg font-black text-emerald-700">{formatCurrency(p.assigned_amount || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
