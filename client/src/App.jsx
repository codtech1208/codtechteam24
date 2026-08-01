import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import ClientManagement from './pages/admin/ClientManagement';
import ProjectManagement from './pages/admin/ProjectManagement';
import ProjectDetails from './pages/admin/ProjectDetails';
import ReportsPage from './pages/admin/ReportsPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

// Protected Route Component for Super Admin
function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'super_admin') return <Navigate to="/employee/dashboard" replace />;
  return children;
}

// Protected Route Component for Employee
function RequireEmployeeOrAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Main App Layout Shell
function DashboardLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex text-slate-800">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 pb-12">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login Page */}
      <Route
        path="/login"
        element={
          user ? (
            user.role === 'super_admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/employee/dashboard" replace />
            )
          ) : (
            <Login />
          )
        }
      />

      {/* Super Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <RequireAdmin>
            <DashboardLayout title="Super Admin Overview">
              <AdminDashboard />
            </DashboardLayout>
          </RequireAdmin>
        }
      />

      <Route
        path="/admin/employees"
        element={
          <RequireAdmin>
            <DashboardLayout title="Development Team Management">
              <EmployeeManagement />
            </DashboardLayout>
          </RequireAdmin>
        }
      />

      <Route
        path="/admin/clients"
        element={
          <RequireAdmin>
            <DashboardLayout title="Client Directory">
              <ClientManagement />
            </DashboardLayout>
          </RequireAdmin>
        }
      />

      <Route
        path="/admin/projects"
        element={
          <RequireAdmin>
            <DashboardLayout title="Projects Directory">
              <ProjectManagement />
            </DashboardLayout>
          </RequireAdmin>
        }
      />

      <Route
        path="/admin/projects/:id"
        element={
          <RequireAdmin>
            <DashboardLayout title="Project Vault & Details">
              <ProjectDetails />
            </DashboardLayout>
          </RequireAdmin>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <RequireAdmin>
            <DashboardLayout title="Executive Analytics & Reports">
              <ReportsPage />
            </DashboardLayout>
          </RequireAdmin>
        }
      />



      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <RequireEmployeeOrAdmin>
            <DashboardLayout title="Developer Workspace">
              <EmployeeDashboard />
            </DashboardLayout>
          </RequireEmployeeOrAdmin>
        }
      />

      {/* Root Path & Catch-All Redirect directly to Login or Dashboard */}
      <Route
        path="/"
        element={
          user ? (
            user.role === 'super_admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/employee/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
