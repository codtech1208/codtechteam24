import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDateTime, getStatusBadge } from '../../utils/formatters';
import {
  Folder,
  User,
  UserCheck,
  DollarSign,
  Clock,
  KeyRound,
  History,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle,
  Copy
} from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Credentials decrypt state
  const [decryptedCreds, setDecryptedCreds] = useState(null);
  const [decryptLoading, setDecryptLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ domain: false, hosting: false, github: false });

  // Reassignment Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [reassignForm, setReassignForm] = useState({ employeeId: '', assignedAmount: '', remarks: '' });

  const [toast, setToast] = useState(null);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${id}`);
      setData(res.data);
    } catch (err) {
      setToast({ message: 'Failed to load project details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleDecryptVault = async () => {
    setDecryptLoading(true);
    try {
      const res = await api.get(`/credentials/${id}/decrypt`);
      setDecryptedCreds(res.data.credentials);
      setToast({ message: 'Credentials Decrypted & Viewed (Audit Logged)', type: 'info' });
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to decrypt credentials', type: 'error' });
    } finally {
      setDecryptLoading(false);
    }
  };

  const handleOpenReassign = async () => {
    try {
      const res = await api.get('/employees?status=active');
      setEmployees(res.data.employees);
      setReassignForm({
        employeeId: data.assignment?.employee_id || '',
        assignedAmount: data.assignment?.assigned_amount || '',
        remarks: ''
      });
      setReassignModalOpen(true);
    } catch (err) {
      setToast({ message: 'Failed to fetch active employees', type: 'error' });
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments', {
        projectId: id,
        employeeId: reassignForm.employeeId,
        assignedAmount: reassignForm.assignedAmount,
        remarks: reassignForm.remarks
      });
      setToast({ message: 'Project Assigned/Reassigned Successfully', type: 'success' });
      setReassignModalOpen(false);
      fetchProjectDetails();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to reassign project', type: 'error' });
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setToast({ message: `Copied ${label} to clipboard!`, type: 'success' });
  };

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { project, assignment, assignmentHistory, statusLogs, activityLogs, hasCredentials } = data;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Folder },
    { id: 'client', label: 'Client Details', icon: User },
    { id: 'assignment', label: 'Assignment', icon: UserCheck },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'status', label: 'Project Status', icon: Clock },
    { id: 'credentials', label: 'Credentials (Admin Vault)', icon: KeyRound },
    { id: 'activity', label: 'Activity Timeline', icon: History }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/projects')}
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">ID: #{project.id}</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusBadge(project.status)}`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Project Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-400">Project Details Vault</span>
          <h2 className="text-2xl font-bold mt-1">{project.project_type}</h2>
          <p className="text-sm text-slate-300 mt-1">Client: <span className="text-white font-semibold">{project.client_name}</span> ({project.client_email})</p>
        </div>
        <div className="text-left md:text-right">
          <span className="text-xs text-slate-400 block">Total Project Value</span>
          <span className="text-3xl font-extrabold text-brand-400">{formatCurrency(project.total_worth)}</span>
        </div>
      </div>

      {/* Navigation Tabs Header */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-xs gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-card">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800">Project Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border">
                <span className="text-xs text-gray-400 uppercase font-semibold">Project Type</span>
                <p className="text-lg font-bold text-slate-800 mt-1">{project.project_type}</p>
              </div>
              <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                <span className="text-xs text-brand-600 uppercase font-semibold">Total Value</span>
                <p className="text-lg font-bold text-brand-700 mt-1">{formatCurrency(project.total_worth)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border">
                <span className="text-xs text-gray-400 uppercase font-semibold">Status</span>
                <p className="text-lg font-bold text-slate-800 mt-1">{project.status}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Client Details */}
        {activeTab === 'client' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800">Client Information</h3>
            <div className="p-5 bg-gray-50 rounded-2xl border space-y-3">
              <div>
                <span className="text-xs text-gray-400 block">Client Name</span>
                <p className="text-base font-bold text-slate-800">{project.client_name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Email Address</span>
                <p className="text-sm font-medium text-slate-700">{project.client_email}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Mobile Phone</span>
                <p className="text-sm font-mono text-slate-700">{project.client_mobile}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Assignment */}
        {activeTab === 'assignment' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Assigned Developer & History</h3>
              <button
                onClick={handleOpenReassign}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-xs shadow-md shadow-brand-500/20"
              >
                {assignment ? 'Reassign Project' : 'Assign Project'}
              </button>
            </div>

            {assignment ? (
              <div className="p-5 bg-orange-50/50 rounded-2xl border border-brand-100 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-brand-600 uppercase">Current Developer</span>
                  <h4 className="text-lg font-bold text-slate-800 mt-1">{assignment.employee_name}</h4>
                  <p className="text-xs text-gray-500">{assignment.employee_email} | ID: {assignment.employee_code}</p>
                  {assignment.remarks && <p className="text-xs text-slate-600 italic mt-2">"{assignment.remarks}"</p>}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Assigned Payout</span>
                  <span className="text-xl font-bold text-brand-600">{formatCurrency(assignment.assigned_amount)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-600 font-semibold bg-amber-50 p-4 rounded-xl border border-amber-200">
                This project has not been assigned to any employee yet.
              </p>
            )}

            <div>
              <h4 className="font-bold text-sm text-slate-800 mb-3">Assignment History Log</h4>
              <div className="space-y-2">
                {assignmentHistory.length === 0 ? (
                  <p className="text-xs text-gray-400">No assignment history records.</p>
                ) : (
                  assignmentHistory.map((h) => (
                    <div key={h.id} className="p-3 border rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">
                          Reassigned from <span className="text-gray-500">{h.previous_employee_name}</span> to{' '}
                          <span className="text-brand-600 font-bold">{h.new_employee_name}</span>
                        </p>
                        <p className="text-gray-400">By Admin: {h.changed_by_name} | Remarks: {h.remarks || 'None'}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800">{formatCurrency(h.assigned_amount)}</span>
                        <p className="text-[11px] text-gray-400">{formatDateTime(h.changed_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Payments */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800">Financial Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border">
                <span className="text-xs text-gray-400 uppercase font-semibold">Total Client Price</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(project.total_worth)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-2xl border border-brand-100">
                <span className="text-xs text-brand-600 uppercase font-semibold">Employee Payout</span>
                <p className="text-xl font-bold text-brand-700 mt-1">{formatCurrency(assignment?.assigned_amount || 0)}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs text-emerald-600 uppercase font-semibold">Net Company Margin</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">
                  {formatCurrency(project.total_worth - (assignment?.assigned_amount || 0))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Status Timeline */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800">Status Update Timeline</h3>
            <div className="relative pl-6 border-l-2 border-brand-200 space-y-6">
              {statusLogs.length === 0 ? (
                <p className="text-xs text-gray-400">No status changes logged yet.</p>
              ) : (
                statusLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-brand-500 border-4 border-white shadow-sm"></div>
                    <div className="p-4 bg-gray-50 rounded-xl border">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400">{log.old_status}</span>
                        <span className="text-xs text-gray-400">➔</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(log.new_status)}`}>
                          {log.new_status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Updated by: <span className="font-semibold text-slate-800">{log.changed_by}</span></p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDateTime(log.changed_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Credentials Vault (Admin Only with AES-256 Decrypt) */}
        {activeTab === 'credentials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
              <div>
                <div className="flex items-center gap-2 text-brand-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" /> AES-256 Encrypted Vault
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Passwords stored in encrypted format. Decryption generates audit log.
                </p>
              </div>
              <button
                onClick={handleDecryptVault}
                disabled={decryptLoading}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-xs shadow-md shadow-brand-500/30 transition-all disabled:opacity-50"
              >
                {decryptLoading ? 'Decrypting...' : 'Reveal Decrypted Passwords'}
              </button>
            </div>

            {decryptedCreds ? (
              <div className="space-y-6">
                {/* Domain Section */}
                <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-500" /> Domain Registrar Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block">Platform</span>
                      <span className="font-semibold text-slate-800">{decryptedCreds.domainPlatform || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Login Email</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-800">{decryptedCreds.domainEmail || 'N/A'}</span>
                        {decryptedCreds.domainEmail && (
                          <button onClick={() => copyToClipboard(decryptedCreds.domainEmail, 'Domain Email')} className="text-gray-400 hover:text-slate-800">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Decrypted Password</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-600">
                          {showPasswords.domain ? decryptedCreds.domainPassword : '••••••••••••'}
                        </span>
                        <button onClick={() => setShowPasswords({ ...showPasswords, domain: !showPasswords.domain })} className="text-gray-400 hover:text-slate-800">
                          {showPasswords.domain ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => copyToClipboard(decryptedCreds.domainPassword, 'Domain Password')} className="text-gray-400 hover:text-slate-800">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hosting Section */}
                <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-500" /> Hosting Provider Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block">Provider</span>
                      <span className="font-semibold text-slate-800">{decryptedCreds.hostingProvider || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Hosting Email</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-800">{decryptedCreds.hostingEmail || 'N/A'}</span>
                        {decryptedCreds.hostingEmail && (
                          <button onClick={() => copyToClipboard(decryptedCreds.hostingEmail, 'Hosting Email')} className="text-gray-400 hover:text-slate-800">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Decrypted Password</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-600">
                          {showPasswords.hosting ? decryptedCreds.hostingPassword : '••••••••••••'}
                        </span>
                        <button onClick={() => setShowPasswords({ ...showPasswords, hosting: !showPasswords.hosting })} className="text-gray-400 hover:text-slate-800">
                          {showPasswords.hosting ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => copyToClipboard(decryptedCreds.hostingPassword, 'Hosting Password')} className="text-gray-400 hover:text-slate-800">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GitHub Section */}
                <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-500" /> GitHub Repository & Code Access
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block">Repository URL</span>
                      <a href={decryptedCreds.githubRepository} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline font-mono truncate block">
                        {decryptedCreds.githubRepository || 'N/A'}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-400 block">GitHub Email</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-800">{decryptedCreds.githubEmail || 'N/A'}</span>
                        {decryptedCreds.githubEmail && (
                          <button onClick={() => copyToClipboard(decryptedCreds.githubEmail, 'GitHub Email')} className="text-gray-400 hover:text-slate-800">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Decrypted Password</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-600">
                          {showPasswords.github ? decryptedCreds.githubPassword : '••••••••••••'}
                        </span>
                        <button onClick={() => setShowPasswords({ ...showPasswords, github: !showPasswords.github })} className="text-gray-400 hover:text-slate-800">
                          {showPasswords.github ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => copyToClipboard(decryptedCreds.githubPassword, 'GitHub Password')} className="text-gray-400 hover:text-slate-800">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <KeyRound className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">
                  {hasCredentials
                    ? 'Credentials submitted by developer. Click "Reveal Decrypted Passwords" above to view AES-256 decrypted secrets.'
                    : 'Developer has not submitted credentials for this project yet.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Activity Timeline */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800">Project Audit Activity Timeline</h3>
            <div className="space-y-2">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-gray-400">No activity logs found for this project.</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-xl border flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <p className="text-gray-500 mt-0.5">{log.details}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-700 font-medium">{log.user_name}</span>
                      <p className="text-[11px] text-gray-400">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Reassign Project */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title="Assign or Reassign Project"
      >
        <form onSubmit={handleReassignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Employee *</label>
            <select
              required
              value={reassignForm.employeeId}
              onChange={(e) => setReassignForm({ ...reassignForm, employeeId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Payout Amount (₹) *</label>
            <input
              type="number"
              required
              min="0"
              value={reassignForm.assignedAmount}
              onChange={(e) => setReassignForm({ ...reassignForm, assignedAmount: e.target.value })}
              placeholder="15000"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Remarks / Task Notes</label>
            <textarea
              rows="3"
              value={reassignForm.remarks}
              onChange={(e) => setReassignForm({ ...reassignForm, remarks: e.target.value })}
              placeholder="Reassigned for backend API development..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setReassignModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-md shadow-brand-500/20"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
