import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { formatCurrency, getStatusBadge } from '../../utils/formatters';
import { UserPlus, UserCheck, UserX, Trash2, Edit, Eye } from 'lucide-react';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empProfileData, setEmpProfileData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employee_id: '',
    password: '',
    phone: ''
  });

  const [toast, setToast] = useState(null);

  // Fetch employees strictly from live database API
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees', {
        params: { search, status: statusFilter }
      });
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error('Fetch employees error:', err);
      setToast({ message: 'Failed to load employees from live database.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    setSelectedEmp(null);
    setFormData({ name: '', email: '', employee_id: '', password: '', phone: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setSelectedEmp(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      employee_id: emp.employee_id,
      password: '',
      phone: emp.phone || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedEmp) {
        await api.put(`/employees/${selectedEmp.id}`, formData);
        setToast({ message: 'Employee Updated Successfully in Database', type: 'success' });
      } else {
        await api.post('/employees', formData);
        setToast({ message: 'Employee Created Successfully in Database', type: 'success' });
      }
      setModalOpen(false);
      fetchEmployees();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to save employee in database.', type: 'error' });
    }
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/employees/${emp.id}/status`, { status: newStatus });
      setToast({ message: `Employee status updated to ${newStatus}`, type: 'info' });
      fetchEmployees();
    } catch (err) {
      setToast({ message: 'Failed to update employee status in database.', type: 'error' });
    }
  };

  // PERMANENT DATABASE DELETION
  const handleDelete = async (emp) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete employee ${emp.name} from the database?`)) return;

    try {
      await api.delete(`/employees/${emp.id}`);
      setToast({ message: `Employee ${emp.name} Permanently Deleted from Database`, type: 'success' });
      fetchEmployees();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to delete employee from database.', type: 'error' });
    }
  };

  const handleViewProfile = async (emp) => {
    try {
      const res = await api.get(`/employees/${emp.id}`);
      setEmpProfileData(res.data);
      setProfileModalOpen(true);
    } catch (err) {
      setEmpProfileData({
        employee: emp,
        projects: [],
        stats: emp.stats || { assignedProjects: 0, completedProjects: 0, ongoingProjects: 0, totalAssignedAmount: 0 }
      });
      setProfileModalOpen(true);
    }
  };

  const columns = [
    {
      header: 'Employee Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-brand-600 font-bold flex items-center justify-center text-xs">
            {row.name ? row.name.charAt(0) : 'E'}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.name}</p>
            <p className="text-xs text-gray-400">{row.phone || 'No phone'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Employee ID',
      accessorKey: 'employee_id',
      render: (row) => <span className="font-mono text-xs font-semibold text-slate-700 bg-gray-100 px-2.5 py-1 rounded-lg">{row.employee_id}</span>
    },
    {
      header: 'Email',
      accessorKey: 'email',
      render: (row) => <span className="text-slate-600">{row.email}</span>
    },
    {
      header: 'Assigned / Done',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{row.stats?.assignedProjects || 0} Projects</span>
          <p className="text-gray-400">{row.stats?.completedProjects || 0} Completed</p>
        </div>
      )
    },
    {
      header: 'Assigned Payout',
      render: (row) => <span className="font-semibold text-brand-600">{formatCurrency(row.stats?.totalAssignedAmount)}</span>
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getStatusBadge(row.status)}`}>
          {row.status ? row.status.toUpperCase() : 'ACTIVE'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleViewProfile(row)}
            title="View Profile"
            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Employee"
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            title={row.status === 'active' ? 'Deactivate' : 'Activate'}
            className={`p-1.5 rounded-lg transition-colors ${
              row.status === 'active'
                ? 'text-amber-600 hover:bg-amber-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {row.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleDelete(row)}
            title="Delete Employee Permanently from Database"
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

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employee Management</h2>
          <p className="text-xs text-gray-400">Manage development team, access permissions, and profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-brand-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Employee</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or employee ID..."
      />

      {/* Modal 1: Create / Edit Employee */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedEmp ? 'Edit Employee' : 'Create New Employee'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Employee Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Harish Neela"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Employee ID *</label>
              <input
                type="text"
                required
                disabled={!!selectedEmp}
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="CT-EMP-105"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="employee@codtech.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number (Optional)</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {selectedEmp ? 'New Password (Leave blank to keep unchanged)' : 'Password *'}
            </label>
            <input
              type="password"
              required={!selectedEmp}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-md shadow-brand-500/20"
            >
              {selectedEmp ? 'Save Changes' : 'Create & Save Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: View Employee Profile & Statistics */}
      {empProfileData && (
        <Modal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          title={`Employee Profile: ${empProfileData.employee.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 bg-orange-50/50 rounded-2xl border border-brand-100">
              <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white font-bold text-xl flex items-center justify-center shadow-lg">
                {empProfileData.employee.name ? empProfileData.employee.name.charAt(0) : 'E'}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">{empProfileData.employee.name}</h4>
                <p className="text-xs text-gray-500">{empProfileData.employee.email} | Code: <span className="font-mono font-semibold">{empProfileData.employee.employee_id}</span></p>
                <p className="text-xs text-gray-500">Phone: {empProfileData.employee.phone || 'N/A'}</p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl border text-center">
                <span className="text-xs text-gray-400 block font-medium">Assigned</span>
                <span className="text-lg font-bold text-slate-800">{empProfileData.stats?.assignedProjects || 0}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <span className="text-xs text-emerald-600 block font-medium">Completed</span>
                <span className="text-lg font-bold text-emerald-700">{empProfileData.stats?.completedProjects || 0}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                <span className="text-xs text-amber-600 block font-medium">Ongoing</span>
                <span className="text-lg font-bold text-amber-700">{empProfileData.stats?.ongoingProjects || 0}</span>
              </div>
              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-center">
                <span className="text-xs text-brand-600 block font-medium">Total Payout</span>
                <span className="text-lg font-bold text-brand-700">{formatCurrency(empProfileData.stats?.totalAssignedAmount)}</span>
              </div>
            </div>

            {/* Projects assigned table */}
            <div>
              <h5 className="font-bold text-sm text-slate-800 mb-3">Assigned Projects History</h5>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {!empProfileData.projects || empProfileData.projects.length === 0 ? (
                  <p className="text-xs text-gray-400">No projects assigned yet.</p>
                ) : (
                  empProfileData.projects.map((p) => (
                    <div key={p.id} className="p-3 border rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{p.project_type}</span>
                        <p className="text-gray-400">Client: {p.client_name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full font-semibold border ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                        <p className="font-bold text-brand-600 mt-1">{formatCurrency(p.assigned_amount)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
