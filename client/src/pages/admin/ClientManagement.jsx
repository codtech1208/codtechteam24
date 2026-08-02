import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/formatters';
import { UserPlus, Edit, Trash2, Eye, Briefcase, Calendar, Phone, Mail, User, ShieldCheck, IndianRupee, FileText, CreditCard, Pencil } from 'lucide-react';

export default function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProjects, setClientProjects] = useState([]);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState(null);
  const [newReceivedAmount, setNewReceivedAmount] = useState('');
  const [transactionRemarks, setTransactionRemarks] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const [editTxModalOpen, setEditTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxRemarks, setEditTxRemarks] = useState('');
  const [savingEditTx, setSavingEditTx] = useState(false);

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
      setClientProjects(res.data.projects || []);
      setHistoryModalOpen(true);
    } catch (err) {
      setToast({ message: 'Failed to fetch client details and assigned projects', type: 'error' });
    }
  };

  const handleOpenPaymentModal = (project) => {
    setSelectedProjectForPayment(project);
    setNewReceivedAmount('');
    setTransactionRemarks('');
    setPaymentModalOpen(true);
  };

  const handleSavePaymentUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProjectForPayment) return;
    setUpdatingPayment(true);
    try {
      await api.post(`/projects/${selectedProjectForPayment.id}/receive-payment`, {
        receivedAmount: parseFloat(newReceivedAmount || 0),
        remarks: transactionRemarks
      });
      setToast({ message: 'Payment Transaction Recorded Successfully!', type: 'success' });
      setPaymentModalOpen(false);
      setNewReceivedAmount('');
      setTransactionRemarks('');
      if (selectedClient) {
        handleViewProjects(selectedClient);
      }
      fetchClients();
    } catch (err) {
      console.error('Update payment error:', err);
      setToast({ message: err.response?.data?.error || 'Failed to record payment transaction', type: 'error' });
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleOpenEditTx = (tx) => {
    setEditingTx(tx);
    setEditTxAmount(tx.amount);
    setEditTxRemarks(tx.remarks || '');
    setEditTxModalOpen(true);
  };

  const handleSaveEditTx = async (e) => {
    e.preventDefault();
    if (!editingTx) return;
    setSavingEditTx(true);
    try {
      await api.put(`/projects/transactions/${editingTx.id}`, {
        amount: parseFloat(editTxAmount),
        remarks: editTxRemarks
      });
      setToast({ message: 'Transaction updated successfully!', type: 'success' });
      setEditTxModalOpen(false);
      setEditingTx(null);
      if (selectedClient) {
        handleViewProjects(selectedClient);
      }
      fetchClients();
    } catch (err) {
      console.error('Edit transaction error:', err);
      setToast({ message: err.response?.data?.error || 'Failed to edit transaction', type: 'error' });
    } finally {
      setSavingEditTx(false);
    }
  };

  const columns = [
    {
      header: 'Client Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-brand-600 font-bold flex items-center justify-center text-xs">
            {row.name ? row.name.charAt(0) : 'C'}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.name}</p>
            <p className="text-xs text-gray-400">Added: {formatDate(row.created_at)}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Contact Info',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <p className="text-slate-700 font-medium">{row.email}</p>
          <p className="font-mono text-gray-500">{row.mobile}</p>
        </div>
      )
    },
    {
      header: 'Projects',
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{row.total_projects || 0} Total</span>
          <span className="text-emerald-600 font-medium ml-2">({row.completed_projects || 0} Done)</span>
        </div>
      )
    },
    {
      header: 'Total Value',
      render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.total_spent || 0)}</span>
    },
    {
      header: 'Total Received',
      render: (row) => <span className="font-bold text-emerald-600">{formatCurrency(row.total_received_payment || 0)}</span>
    },
    {
      header: 'Due Amount',
      render: (row) => {
        const due = row.total_due_amount !== undefined ? row.total_due_amount : (row.total_spent - (row.total_received_payment || 0));
        return (
          <span className={`font-bold px-2.5 py-1 rounded-full text-xs border ${due > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {due > 0 ? formatCurrency(due) : '₹0 (Paid ✅)'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewProjects(row)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-brand-600 font-semibold text-xs rounded-lg transition-colors border border-orange-200 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-fade-in">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-slate-800">Client Management</h2>
          <p className="text-xs text-gray-400">Manage client directory, contact info, and project portfolios</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-brand-500/20 transition-all whitespace-nowrap w-full sm:w-auto justify-center sm:justify-start"
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

      {/* Modal: Comprehensive Client & Assigned Project Details (Super Admin Panel) */}
      {selectedClient && (
        <Modal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title={`Full Client & Assigned Project Details`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Client Profile Header Banner */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-brand-500/30">
                  {selectedClient.name ? selectedClient.name.charAt(0) : 'C'}
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white">{selectedClient.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-brand-400" /> {selectedClient.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-brand-400" /> {selectedClient.mobile}</span>
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right bg-white/10 px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider">Total Portfolio Value</p>
                <p className="text-lg font-bold text-brand-400">{formatCurrency(selectedClient.total_spent || 0)}</p>
              </div>
            </div>

            {/* Assigned Projects Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-500" />
                  <span>Assigned Projects ({clientProjects.length})</span>
                </h4>
              </div>

              {clientProjects.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">No projects assigned for this client yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientProjects.map((p) => (
                    <div key={p.id} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-brand-300 transition-all space-y-4">
                      {/* Project Top Bar */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">{p.project_name || `Project #${p.id}`}</span>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(p.status)}`}>
                              {p.status}
                            </span>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${p.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              Payment: {p.payment_status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Project Type: <span className="font-semibold text-slate-700">{p.project_type}</span>
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Client Value (Worth)</p>
                          <p className="text-base font-extrabold text-brand-600">{formatCurrency(p.total_worth)}</p>
                        </div>
                      </div>

                      {/* Project Details Grid (Entered in Assigned Project Form) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-gray-400 font-medium mb-0.5 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-blue-500" /> Assigned Developer
                          </p>
                          <p className="font-semibold text-slate-800">{p.assigned_employee || 'Unassigned'}</p>
                          {p.assigned_employee_code && (
                            <p className="text-[11px] font-mono text-gray-500">ID: {p.assigned_employee_code}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-gray-400 font-medium mb-0.5 flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> Total Received Payment
                          </p>
                          <p className="font-bold text-emerald-600 text-sm">{formatCurrency((p.advance_amount || 0) + (p.received_amount || 0))}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 font-medium mb-0.5 flex items-center gap-1">
                            <IndianRupee className="w-3.5 h-3.5 text-rose-500" /> Due Balance
                          </p>
                          <p className={`font-bold text-sm ${((p.total_worth || 0) - ((p.advance_amount || 0) + (p.received_amount || 0))) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatCurrency(Math.max(0, (p.total_worth || 0) - ((p.advance_amount || 0) + (p.received_amount || 0))))}
                          </p>
                        </div>
                      </div>

                      {/* Action to update payment */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Developer Payout: <strong>{formatCurrency(p.assigned_amount || 0)}</strong></span>
                        <button
                          onClick={() => handleOpenPaymentModal(p)}
                          className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>Record New Payment Received</span>
                        </button>
                      </div>

                      {/* Payment Transactions Audit Trail & History */}
                      {p.transactions && p.transactions.length > 0 && (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                          <p className="font-bold text-slate-800 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-brand-500" />
                              Payment Transaction History ({p.transactions.length} Transactions)
                            </span>
                            <span className="text-[11px] font-mono text-emerald-600">
                              Total Collected: {formatCurrency((p.advance_amount || 0) + (p.received_amount || 0))}
                            </span>
                          </p>
                          <div className="space-y-2 pt-1">
                            {p.transactions.map((tx, idx) => (
                              <div key={tx.id || idx} className="p-2.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between shadow-xs">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-emerald-600 text-sm">
                                      + {formatCurrency(tx.amount)}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                      Payment Received
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-0.5">{tx.remarks || 'Payment received'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right text-[11px] text-gray-400">
                                    <p className="font-medium text-slate-700">{formatDate(tx.created_at)}</p>
                                    <p className="text-[10px]">By: {tx.recorded_by || 'Admin'}</p>
                                  </div>
                                  <button
                                    onClick={() => handleOpenEditTx(tx)}
                                    title="Edit this transaction"
                                    className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assignment Remarks */}
                      {p.assignment_remarks && (
                        <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs">
                          <p className="font-semibold text-amber-900 mb-0.5 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-amber-600" /> Assignment Remarks / Instructions:
                          </p>
                          <p className="text-slate-700 font-medium">{p.assignment_remarks}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Update Client Received Payment */}
      {selectedProjectForPayment && (
        <Modal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title={`Record Payment Transaction: ${selectedProjectForPayment.project_name || `Project #${selectedProjectForPayment.id}`}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSavePaymentUpdate} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Project Value (Worth):</span>
                <span className="font-bold text-slate-800">{formatCurrency(selectedProjectForPayment.total_worth || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Received So Far:</span>
                <span className="font-extrabold text-emerald-600 text-sm">{formatCurrency((selectedProjectForPayment.advance_amount || 0) + (selectedProjectForPayment.received_amount || 0))}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className="text-slate-800 font-bold">Current Remaining Due:</span>
                <span className="font-extrabold text-rose-600 text-sm">{formatCurrency(Math.max(0, (selectedProjectForPayment.total_worth || 0) - ((selectedProjectForPayment.advance_amount || 0) + (selectedProjectForPayment.received_amount || 0))))}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Amount Received Today (₹) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={newReceivedAmount}
                onChange={(e) => setNewReceivedAmount(e.target.value)}
                placeholder="Enter amount e.g. 1000, 5000"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Transaction Mode / Remarks (Optional)
              </label>
              <input
                type="text"
                value={transactionRemarks}
                onChange={(e) => setTransactionRemarks(e.target.value)}
                placeholder="e.g. Bank Transfer / UPI / Cash"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-brand-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                This transaction will be recorded with exact Date & Time stamp in the project timeline.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingPayment}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-md inline-flex items-center gap-1.5"
              >
                {updatingPayment ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Save Payment Update'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Edit Payment Transaction */}
      {editingTx && (
        <Modal
          isOpen={editTxModalOpen}
          onClose={() => { setEditTxModalOpen(false); setEditingTx(null); }}
          title="Edit Payment Transaction"
          maxWidth="max-w-sm"
        >
          <form onSubmit={handleSaveEditTx} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              ⚠️ Editing this transaction will automatically recalculate the project's Total Received and Due Balance.
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Corrected Amount (₹) *</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={editTxAmount}
                onChange={(e) => setEditTxAmount(e.target.value)}
                placeholder="Enter correct amount"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Remarks (Optional)</label>
              <input
                type="text"
                value={editTxRemarks}
                onChange={(e) => setEditTxRemarks(e.target.value)}
                placeholder="e.g. Corrected cash payment"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setEditTxModalOpen(false); setEditingTx(null); }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEditTx}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-md inline-flex items-center gap-1.5"
              >
                {savingEditTx ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
