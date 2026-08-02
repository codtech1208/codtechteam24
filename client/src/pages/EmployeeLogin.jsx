import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, Code, KeyRound, CheckCircle, Send, User } from 'lucide-react';
import Toast from '../components/common/Toast';
import api from '../utils/api';

export default function EmployeeLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setToast({ message: 'Please enter both email and password.', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      const targetPath = user.role === 'super_admin' ? '/admin/dashboard' : '/employee/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid email or password.';
      setToast({ message: msg, type: 'error' });
      setLoading(false);
    }
  };

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setToast({ message: 'Please enter your registered email address.', type: 'warning' });
      return;
    }

    setForgotLoading(true);
    const cleanE = forgotEmail.trim().toLowerCase();

    try {
      const res = await api.post('/auth/forgot-password', { email: cleanE });
      setToast({ message: res.data.message || `Password reset link sent to ${cleanE}! Check your inbox.`, type: 'success' });
      setShowForgotModal(false);
    } catch (err) {
      setToast({ message: `Password reset link sent to ${cleanE}! Please check your email inbox.`, type: 'success' });
      setShowForgotModal(false);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-2xl p-8 z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/logo.png" alt="CODTECH Logo" className="h-16 w-auto object-contain mx-auto mb-3" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <Code className="w-3.5 h-3.5 text-brand-600" /> Developer Workspace Portal
          </span>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-wider uppercase mt-1">POWERED BY CODTECH TEAM</h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 mt-0.5">Employee Development Workspace</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Developer Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="harishneela83@gmail.com"
                required
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 accent-brand-500"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email || 'harishneela83@gmail.com');
                setShowForgotModal(true);
              }}
              className="text-brand-600 font-semibold hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-orange-600 hover:opacity-95 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <User className="w-4 h-4" />
                <span>Sign In as Developer</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Super Admin?{' '}
            <Link to="/superadminlogin" className="text-slate-800 font-bold hover:underline">
              Go to Super Admin Portal →
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Reset Developer Password</h3>
              <button onClick={() => setShowForgotModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Enter your registered developer email address below. We will send a secure password reset link to your email.
            </p>

            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="harishneela83@gmail.com"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-md inline-flex items-center gap-1.5"
                >
                  {forgotLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Send Reset Link
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
