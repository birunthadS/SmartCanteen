import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, AlertCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type LoginStatus = 'idle' | 'pending' | 'rejected';

interface PendingInfo {
  name: string;
  email: string;
  requestedRole: string;
  createdAt: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('idle');
  const [statusInfo, setStatusInfo] = useState<(PendingInfo & { rejectionReason?: string }) | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginStatus('idle');
    setStatusInfo(null);
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { code?: string; message?: string; request?: PendingInfo; rejectionReason?: string } } })?.response?.data;
      if (response?.code === 'ACCOUNT_PENDING') {
        setLoginStatus('pending');
        setStatusInfo(response.request ?? null);
      } else if (response?.code === 'ACCOUNT_REJECTED') {
        setLoginStatus('rejected');
        setStatusInfo({ ...(response.request ?? { name: '', email: form.email, requestedRole: '', createdAt: '' }), rejectionReason: response.rejectionReason });
      } else {
        const msg = response?.message || (err as { message?: string })?.message || 'Login failed';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = (role: string) => ({ STUDENT: '🎓 Student', STAFF: '👷 Staff', ADMIN: '🛡️ Administrator' }[role] ?? role);

  return (
    <div className="min-h-screen bg-canteen-cream flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-hero flex-col justify-center items-center p-12 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-6">
          <UtensilsCrossed size={36} className="text-white" />
        </div>
        <h1 className="font-display text-4xl font-bold text-white mb-4">Smart Canteen</h1>
        <p className="text-green-100 text-lg max-w-sm">Pre-Order your meal, skip the queue, and enjoy campus life better.</p>
        <div className="mt-10 grid grid-cols-2 gap-4 w-full max-w-xs text-left">
          {[
            { n: '25+', l: 'Menu Items' },
            { n: '9', l: 'Pickup Slots' },
            { n: '3', l: 'User Roles' },
            { n: '∞', l: 'Possibilities' },
          ].map(s => (
            <div key={s.l} className="bg-white/10 rounded-2xl p-4">
              <div className="font-display text-2xl font-bold text-white">{s.n}</div>
              <div className="text-green-200 text-sm">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-canteen-green rounded-xl flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-gray-900 text-xl">Smart Canteen</span>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-1">Sign in to your canteen account</p>
            </div>

            {/* Pending account notice */}
            {loginStatus === 'pending' && statusInfo && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className="text-amber-500" />
                  <p className="font-semibold text-amber-800 text-sm">Account Pending Approval</p>
                </div>
                <p className="text-amber-700 text-sm mb-2">
                  Your <strong>{roleLabel(statusInfo.requestedRole)}</strong> account request is awaiting administrator review.
                </p>
                <p className="text-amber-600 text-xs">
                  Requested on {new Date(statusInfo.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-amber-600 text-xs mt-1">
                  Please contact <strong>admin@canteen.edu</strong> if you need expedited access.
                </p>
              </div>
            )}

            {/* Rejected account notice */}
            {loginStatus === 'rejected' && statusInfo && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={18} className="text-red-500" />
                  <p className="font-semibold text-red-800 text-sm">Account Request Rejected</p>
                </div>
                <p className="text-red-700 text-sm mb-2">
                  Your <strong>{roleLabel(statusInfo.requestedRole)}</strong> account request was not approved.
                </p>
                {statusInfo.rejectionReason && (
                  <p className="text-red-700 text-sm italic mb-2">Reason: "{statusInfo.rejectionReason}"</p>
                )}
                <p className="text-red-600 text-xs">
                  You may <Link to="/register" className="font-semibold underline">submit a new request</Link> or contact <strong>admin@canteen.edu</strong> for more information.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Your password"
                    required
                    className="input-field pl-10 pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-canteen-green font-semibold hover:underline">Register here</Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Smart Canteen Pre-Order & Queue Management System
          </p>
        </div>
      </div>
    </div>
  );
}
