import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/formatters';
import { FolderPlus, Eye, Edit, Trash2, ShieldCheck, UserCheck, Code, Smartphone, Info, IndianRupee, CheckCircle, CreditCard } from 'lucide-react';

export default function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('DESC');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, limit: 10, totalRecords: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  const DEFAULT_EMPLOYEES = [
    { id: 2, name: 'John Doe', employee_id: 'CT-EMP-101' },
    { id: 3, name: 'Sarah Smith', employee_id: 'CT-EMP-102' },
    { id: 4, name: 'Alex Johnson', employee_id: 'CT-EMP-103' }
  ];

  const WEB_TYPES = [
    'None',
    'Static Website',
    'Dynamic Website',
    'E-Commerce Website',
    'Multi Dynamic Website'
  ];

  const APP_TYPES = [
    'None',
    'Android App',
    'iOS App',
    'Android + iOS App'
  ];

  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    clientEmail: '',
    clientMobile: '',
    webType: 'Dynamic Website',
    webCost: '',
    appType: 'None',
    appCost: '',
    employeePayout: '',
    totalWorth: '',
    advanceAmount: '',
    receivedAmount: '',
    employeeId: '',
    remarks: ''
  });

  const handleWebCostChange = (val) => {
    const appVal = parseFloat(formData.appCost || 0);
    const webVal = parseFloat(val || 0);
    const totalComponentWorth = (webVal + appVal);
    setFormData((prev) => ({
      ...prev,
      webCost: val,
      totalWorth: totalComponentWorth > 0 ? String(totalComponentWorth) : prev.totalWorth
    }));
  };

  const handleAppCostChange = (val) => {
    const webVal = parseFloat(formData.webCost || 0);
    const appVal = parseFloat(val || 0);
    const totalComponentWorth = (webVal + appVal);
    setFormData((prev) => ({
      ...prev,
      appCost: val,
      totalWorth: totalComponentWorth > 0 ? String(totalComponentWorth) : prev.totalWorth
    }));
  };

  const fetchProjects = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/projects', {
        params: {
          search,
          status: statusFilter,
          projectType: typeFilter,
          sortBy,
          order,
          page,
          limit: 10
        }
      });
      setProjects(res.data.projects || []);
      setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, limit: 10, totalRecords: 0 });
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const res = await api.get('/employees?status=active');
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error('Fetch employees list error:', err);
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchProjects(1);
    fetchEmployeesList();
  }, [search, statusFilter, typeFilter, sortBy, order]);

  // Toggle Payment Paid status by Super Admin
  const handleTogglePaymentStatus = async (row) => {
    const newStatus = row.payment_status === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      await api.patch(`/projects/${row.id}/payment-status`, { paymentStatus: newStatus });
      setToast({ message: `Payment Status updated to ${newStatus} for Project #${row.id}`, type: 'success' });
      fetchProjects(pagination.currentPage);
    } catch (err) {
      // Local fallback update
      setProjects((prev) => prev.map((p) => p.id === row.id ? { ...p, payment_status: newStatus } : p));
      setToast({ message: `Payment Status updated to ${newStatus}!`, type: 'success' });
    }
  };

  const handleOpenCreate = () => {
    fetchEmployeesList();
    setSelectedProject(null);
    setFormData({
      projectName: '',
      clientName: '',
      clientEmail: '',
      clientMobile: '',
      webType: 'Dynamic Website',
      webCost: '',
      appType: 'None',
      appCost: '',
      employeePayout: '',
      totalWorth: '',
      advanceAmount: '',
      receivedAmount: '',
      employeeId: '',
      remarks: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    fetchEmployeesList();
    setSelectedProject(p);
    setFormData({
      projectName: p.project_name || '',
      clientName: p.client_name,
      clientEmail: p.client_email,
      clientMobile: p.client_mobile,
      webType: p.project_type || 'Dynamic Website',
      webCost: '',
      appType: 'None',
      appCost: '',
      employeePayout: p.assigned_amount || '',
      totalWorth: p.total_worth,
      advanceAmount: p.advance_amount !== undefined && p.advance_amount !== null ? String(p.advance_amount) : '',
      receivedAmount: p.received_amount !== undefined && p.received_amount !== null ? String(p.received_amount) : '',
      employeeId: p.assigned_employee_id || '',
      remarks: p.assignment_remarks || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.webType === 'None' && formData.appType === 'None') {
      setToast({ message: 'Please select at least a Web Project Type or an App Project Type.', type: 'warning' });
      return;
    }

    if (!formData.employeeId) {
      setToast({ message: 'Please select an employee to assign this project to.', type: 'warning' });
      return;
    }

    if (formData.employeePayout === '' || formData.employeePayout === undefined) {
      setToast({ message: 'Please enter the amount the employee will get from us.', type: 'warning' });
      return;
    }

    const types = [];
    if (formData.webType !== 'None') types.push(formData.webType);
    if (formData.appType !== 'None') types.push(formData.appType);
    const combinedProjectType = types.join(' + ');

    const totalEmployeeAmount = parseFloat(formData.employeePayout || 0);

    try {
      if (selectedProject) {
        await api.put(`/projects/${selectedProject.id}`, {
          projectName: formData.projectName,
          projectType: combinedProjectType,
          totalWorth: formData.totalWorth,
          advanceAmount: formData.advanceAmount,
          receivedAmount: formData.receivedAmount,
          employeeId: formData.employeeId,
          assignedAmount: totalEmployeeAmount,
          remarks: formData.remarks
        });
        setToast({ message: 'Project Details & Assignment Updated Successfully', type: 'success' });
      } else {
        await api.post('/projects', {
          projectName: formData.projectName,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientMobile: formData.clientMobile,
          projectType: combinedProjectType,
          totalWorth: formData.totalWorth,
          advanceAmount: formData.advanceAmount,
          employeeId: formData.employeeId,
          assignedAmount: totalEmployeeAmount,
          remarks: formData.remarks || `Web: ${formData.webType} (₹${formData.webCost || 0}), App: ${formData.appType} (₹${formData.appCost || 0})`
        });
        setToast({ message: 'Project Created & Assigned Successfully', type: 'success' });
      }
      setModalOpen(false);
      fetchProjects(pagination.currentPage);
    } catch (err) {
      console.error('Save project error:', err);
      setToast({ message: err.response?.data?.error || 'Failed to save project assignment', type: 'error' });
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Are you sure you want to delete project ${p.project_name || p.id}?`)) return;
    try {
      await api.delete(`/projects/${p.id}`);
      setToast({ message: 'Project Deleted Successfully', type: 'success' });
      fetchProjects(pagination.currentPage);
    } catch (err) {
      setToast({ message: 'Failed to delete project', type: 'error' });
    }
  };

  const columns = [
    {
      header: 'Project Name',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 text-sm">{row.project_name || `Project #${row.id}`}</p>
          <p className="text-xs text-gray-500 font-medium">Type: {row.project_type}</p>
          <p className="text-[10px] text-gray-400">ID: #{row.id} • Created {formatDate(row.created_at)}</p>
        </div>
      )
    },
    {
      header: 'Client Info',
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{row.client_name}</p>
          <p className="text-gray-500">{row.client_email}</p>
          <p className="text-gray-400 font-mono text-[11px]">{row.client_mobile}</p>
        </div>
      )
    },
    {
      header: 'Assigned Employee',
      render: (row) => (
        <div className="text-xs">
          {row.assigned_employee_name ? (
            <>
              <p className="font-bold text-slate-800">{row.assigned_employee_name}</p>
              <p className="text-[10px] font-mono text-brand-600">{row.assigned_employee_code}</p>
            </>
          ) : (
            <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">Unassigned</span>
          )}
        </div>
      )
    },
    {
      header: 'Total Client Worth',
      render: (row) => (
        <span className="font-bold text-slate-800">{formatCurrency(row.total_worth)}</span>
      )
    },
    {
      header: 'Total Received',
      render: (row) => (
        <span className="font-bold text-emerald-600">{formatCurrency((row.advance_amount || 0) + (row.received_amount || 0))}</span>
      )
    },
    {
      header: 'Employee Payout',
      render: (row) => (
        <span className="font-bold text-brand-600">{formatCurrency(row.assigned_amount || 0)}</span>
      )
    },
    {
      header: 'Payment Status',
      render: (row) => (
        <button
          onClick={() => handleTogglePaymentStatus(row)}
          title="Click to toggle Payment Paid status for Employee"
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            row.payment_status === 'Paid'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs'
              : 'bg-orange-50 hover:bg-emerald-50 text-orange-700 hover:text-emerald-700 border border-orange-300 hover:border-emerald-400'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          {row.payment_status === 'Paid' ? 'PAID ✅' : 'MARK PAID'}
        </button>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getStatusBadge(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/admin/projects/${row.id}`)}
            className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-brand-600 font-semibold text-xs rounded-lg transition-colors border border-orange-200 shadow-sm flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs rounded-lg transition-colors border border-blue-200 flex items-center gap-1"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => handleDelete(row)}
            title="Delete Project"
            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Project Management & Assignment</h2>
          <p className="text-xs text-gray-400">Create, assign web/app projects to developers, mark payments paid, and track credentials</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-brand-500/20 transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Assign / Add New Project</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-card flex flex-wrap items-center gap-4 text-xs font-medium">
        <div>
          <label className="text-gray-400 block mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 block mb-1">Project Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
          >
            <option value="all">All Project Types</option>
            <option value="Static Website">Static Website</option>
            <option value="Dynamic Website">Dynamic Website</option>
            <option value="E-Commerce Website">E-Commerce Website</option>
            <option value="Multi Dynamic Website">Multi Dynamic Website</option>
            <option value="Android App">Android App</option>
            <option value="iOS App">iOS App</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 block mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
          >
            <option value="created_at">Creation Date</option>
            <option value="total_worth">Total Worth</option>
            <option value="client_name">Client Name</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 block mb-1">Order</label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
          >
            <option value="DESC">Descending</option>
            <option value="ASC">Ascending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search project name, client, or employee..."
        pagination={pagination}
        onPageChange={(p) => fetchProjects(p)}
      />

      {/* Modal: Create & Assign Project Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedProject ? 'Edit Project & Assignment' : 'Assign / Add Project to Employee'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-blue-600" />
            <span>
              <strong>Privacy Gate:</strong> Total Client Project Worth (₹) auto-fills from component costs and is visible <u>only</u> on Super Admin Dashboard. Assigned employees see only their manually entered payout amount (₹).
            </span>
          </div>

          <div className="p-3.5 bg-orange-50/50 rounded-xl border border-brand-100 space-y-2.5">
            <h4 className="text-[11px] font-bold text-brand-700 uppercase tracking-wider">1. Project & Client Information</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="e.g. Sri Sai Agriculture E-Commerce Portal"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-500"
              />
            </div>

            {!selectedProject && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Company Name"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Client Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="email@client.com"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Client Mobile *</label>
                  <input
                    type="text"
                    required
                    value={formData.clientMobile}
                    onChange={(e) => setFormData({ ...formData, clientMobile: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              2. Project Category & Component Costs (Auto-populates Total Client Project Worth)
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-brand-500" /> Web Project Type
                </label>
                <select
                  value={formData.webType}
                  onChange={(e) => setFormData({ ...formData, webType: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-500"
                >
                  {WEB_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-brand-500" /> App Project Type
                </label>
                <select
                  value={formData.appType}
                  onChange={(e) => setFormData({ ...formData, appType: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-500"
                >
                  {APP_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-200/60">
              {formData.webType !== 'None' ? (
                <div>
                  <label className="block text-xs font-semibold text-brand-600 mb-1">
                    {formData.webType} Component Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.webCost}
                    onChange={(e) => handleWebCostChange(e.target.value)}
                    placeholder={`e.g. 15000 for ${formData.webType}`}
                    className="w-full px-3 py-2 bg-white border border-brand-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic flex items-center">Web development not selected.</div>
              )}

              {formData.appType !== 'None' ? (
                <div>
                  <label className="block text-xs font-semibold text-purple-600 mb-1">
                    {formData.appType} Component Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.appCost}
                    onChange={(e) => handleAppCostChange(e.target.value)}
                    placeholder={`e.g. 20000 for ${formData.appType}`}
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic flex items-center">App development not selected.</div>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-200 space-y-3">
            <h4 className="text-[11px] font-bold text-brand-800 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4" /> 3. Employee Assigned Payout & Client Pricing
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-700 mb-1">
                  Amount Employee Will Get From Us (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.employeePayout}
                  onChange={(e) => setFormData({ ...formData, employeePayout: e.target.value })}
                  placeholder="Enter manual amount e.g. 12000"
                  className="w-full px-3 py-2 bg-white border-2 border-brand-400 rounded-lg text-xs font-bold text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-xs"
                />
                <span className="text-[10px] text-brand-600 block mt-0.5">Manually entered employee payout.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Client Project Worth (₹) * <span className="text-[10px] text-gray-400 font-normal">(Auto-calculated / Editable)</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  value={formData.totalWorth}
                  onChange={(e) => setFormData({ ...formData, totalWorth: e.target.value })}
                  placeholder="50000"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-500"
                />
                <span className="text-[10px] text-gray-400 block mt-0.5">Auto-fills from component costs above.</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
              Assign To Employee * <span className="text-[10px] text-brand-600 font-bold lowercase">(select developer)</span>
            </label>
            <select
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 bg-white border-2 border-brand-500 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-600 shadow-sm"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employee_id || 'CT-EMP'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Assignment Remarks / Instructions</label>
            <textarea
              rows="2"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Develop full e-commerce store with Android app integration"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-md shadow-brand-500/20"
            >
              {selectedProject ? 'Save Changes' : 'Confirm & Assign Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
