import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Zap, CheckCircle, KeyRound, ShieldCheck } from 'lucide-react';
import Toast from '../components/common/Toast';
import api from '../utils/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let emailParam = searchParams.get('email') || '';
    let tokenParam = searchParams.get('token') || '';

    // Fallback if URL came with legacy hash #/reset-password?email=...
    if (!emailParam && window.location.hash) {
      const hashStr = window.location.hash;
      const matchEmail = hashStr.match(/email=([^&]*)/);
      const matchToken = hashStr.match(/token=([^&]*)/);
      if (matchEmail) emailParam = decodeURIComponent(matchEmail[1]);
      if (matchToken) tokenParam = decodeURIComponent(matchToken[1]);
    }

    if (emailParam) setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setToast({ message: 'Please enter your email address.', type: 'warning' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setToast({ message: 'New password must be at least 6 characters.', type: 'warning' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password-token', {
        email: email.trim().toLowerCase(),
        token,
        newPassword
      });
      setSuccess(true);
      setToast({ message: res.data?.message || 'Password updated successfully! Redirecting to employee login...', type: 'success' });
      setTimeout(() => {
        navigate('/employeelogin', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('Reset password token error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to update password. Please verify your details.';
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
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
          <h1 className="text-lg font-extrabold text-slate-900 tracking-wider uppercase">POWERED BY CODTECH TEAM</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Resetting password for <span className="font-semibold text-slate-800">{email || 'your account'}</span>
          </p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-full mb-2">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Password Reset Complete!</h3>
            <p className="text-xs text-slate-500">Your new password has been saved. Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Account Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-orange-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-500/30 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
            </button>
          </form>
        )}
      </div>

      <p className="text-slate-500 text-xs mt-8">
        &copy; {new Date().getFullYear()} CODTECH TEAM. Enterprise Security Portal.
      </p>
    </div>
  );
}
