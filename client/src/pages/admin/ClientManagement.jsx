import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/formatters';
import { UserPlus, Edit, Trash2, Eye, Briefcase } from 'lucide-react';

export default function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProjects, setClientProjects] = useState([]);

  const [formData, setFormData] = useState({ name: '', email: '', mobile: '' });
  const [toast, setToast] = useState(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients', { params: { search } });
      setClients(res.data.clients);
    } catch (err) {
      console.error('Fetch clients error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setFormData({ name: '', email: '', mobile: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setSelectedClient(client);
    setFormData({ name: client.name, email: client.email, mobile: client.mobile });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedClient) {
        await api.put(`/clients/${selectedClient.id}`, formData);
        setToast({ message: 'Client Updated Successfully', type: 'success' });
      } else {
        await api.post('/clients', formData);
        setToast({ message: 'Client Created Successfully', type: 'success' });
      }
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to save client', type: 'error' });
    }
  };

  const handleDelete = async (client) => {
    if (!window.confirm(`Are you sure you want to delete client ${client.name}?`)) return;
    try {
      await api.delete(`/clients/${client.id}`);
      setToast({ message: 'Client Deleted Successfully', type: 'success' });
      fetchClients();
    } catch (err) {
      setToast({ message: 'Failed to delete client', type: 'error' });
    }
  };

  const handleViewProjects = async (client) => {
    try {
      const res = await api.get(`/clients/${client.id}`);
      setSelectedClient(res.data.client);
      setClientProjects(res.data.projects);
      setHistoryModalOpen(true);
    } catch (err) {
      setToast({ message: 'Failed to fetch client project history', type: 'error' });
    }
  };

  const columns = [
    {
      header: 'Client Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-brand-600 font-bold flex items-center justify-center text-xs">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.name}</p>
            <p className="text-xs text-gray-400">Added: {formatDate(row.created_at)}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Email',
      accessorKey: 'email',
      render: (row) => <span className="text-slate-700 font-medium">{row.email}</span>
    },
    {
      header: 'Mobile',
      accessorKey: 'mobile',
      render: (row) => <span className="font-mono text-xs text-slate-600">{row.mobile}</span>
    },
    {
      header: 'Projects Overview',
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{row.total_projects || 0} Total</span>
          <span className="text-emerald-600 font-medium ml-2">({row.completed_projects || 0} Done)</span>
        </div>
      )
    },
    {
      header: 'Total Value',
      render: (row) => <span className="font-bold text-brand-600">{formatCurrency(row.total_spent)}</span>
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleViewProjects(row)}
            title="Project History"
            className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Client"
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            title="Delete Client"
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Client Management</h2>
          <p className="text-xs text-gray-400">Manage client directory, contact information, and project portfolios</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-brand-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={clients}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search clients by name, email, or phone..."
      />

      {/* Modal: Create / Edit Client */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedClient ? 'Edit Client Details' : 'Create New Client'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Client Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Acme Global Solutions"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Client Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@acme.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Client Mobile Number</label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="+1 555 019 2831"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
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
              {selectedClient ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Client Project History */}
      {selectedClient && (
        <Modal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title={`Client History: ${selectedClient.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border flex flex-col sm:flex-row justify-between gap-2 text-xs">
              <div>
                <p className="font-semibold text-slate-800">{selectedClient.name}</p>
                <p className="text-gray-500">{selectedClient.email} | {selectedClient.mobile}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-400">Total Projects:</span>{' '}
                <span className="font-bold text-slate-800 text-sm">{clientProjects.length}</span>
              </div>
            </div>

            <div className="space-y-3">
              {clientProjects.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No projects recorded for this client yet.</p>
              ) : (
                clientProjects.map((p) => (
                  <div key={p.id} className="p-4 border rounded-xl flex items-center justify-between hover:border-brand-200 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{p.project_type}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Assigned Developer: <span className="font-medium text-slate-700">{p.assigned_employee || 'Unassigned'}</span> | Date: {formatDate(p.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-600 text-sm">{formatCurrency(p.total_worth)}</p>
                      <p className="text-xs text-gray-400">Employee Payout: {formatCurrency(p.assigned_amount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
