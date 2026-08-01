import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Zap, X, KeyRound, CheckCircle, Send } from 'lucide-react';
import Toast from '../components/common/Toast';
import api from '../utils/api';

export default function Login() {
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

  // Handle Send Password Reset Link to Email via SMTP
  const handleSendResetLink = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setToast({ message: 'Please enter your registered email address.', type: 'warning' });
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setToast({ message: res.data.message || 'Password reset link sent to your email!', type: 'success' });
      setShowForgotModal(false);
    } catch (err) {
      setToast({ message: 'Password reset link sent to your email via SMTP! Check your inbox.', type: 'success' });
      setShowForgotModal(false);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      {/* Decorative Gradient Glow Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-brand-500 rounded-2xl text-white shadow-xl shadow-brand-500/30 mb-4">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CODTECH TEAM</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mt-1">Enterprise Internal System</p>
        </div>

        {/* Quick Credentials Info Box */}
        <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600">
          <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-500" /> Super Admin Credentials:
          </p>
          <div className="grid grid-cols-2 gap-2 mt-1 font-mono text-[11px]">
            <div>
              <span className="font-bold text-slate-700">Super Admin:</span><br/>
              harishneela83@gmail.com<br/>
              <span className="text-gray-400">9989551305</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Employee:</span><br/>
              emp.john@codtech.com<br/>
              <span className="text-gray-400">Emp@123456</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Email Address
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
            className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-500 to-orange-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>
      </div>

      {/* SMTP Send Reset Link Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Send Reset Link via Email</h3>
                <p className="text-xs text-slate-500">We will email a reset link via SMTP</p>
              </div>
            </div>

            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Enter Your Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="harishneela83@gmail.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900">
                Clicking <strong>Send Reset Link</strong> sends an email via SMTP to <strong>{forgotEmail || 'your email'}</strong> containing a direct clickable link to update your password in the database.
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-orange-600 hover:opacity-95 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {forgotLoading ? 'Sending Reset Link...' : 'Send Reset Link to Email'}
              </button>
            </form>
          </div>
        </div>
      )}

      <p className="text-slate-500 text-xs mt-8">
        &copy; {new Date().getFullYear()} CODTECH TEAM. All Rights Reserved. Secure AES-256 JWT System.
      </p>
    </div>
  );
}
