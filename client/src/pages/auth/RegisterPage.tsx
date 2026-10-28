import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Clock, ChevronDown } from 'lucide-react';
import api from '../../lib/api';

type AccountType = 'STUDENT' | 'STAFF' | 'ADMIN';

const ACCOUNT_TYPE_INFO: Record<AccountType, { label: string; icon: string; description: string }> = {
  STUDENT: {
    label: 'Student',
    icon: '🎓',
    description: 'Browse the menu, place pre-orders, and track your meals.',
  },
  STAFF: {
    label: 'Staff',
    icon: '👷',
    description: 'Manage orders, update queue status, and handle inventory.',
  },
  ADMIN: {
    label: 'Administrator',
    icon: '🛡️',
    description: 'Full access to all canteen management features.',
  },
};

type SubmitState = 'idle' | 'loading' | 'success';

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>('STUDENT');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedRole, setSubmittedRole] = useState<AccountType>('STUDENT');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        requestedRole: accountType,
      });
      setSubmittedEmail(form.email);
      setSubmittedRole(accountType);
      setSubmitState('success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err as { message?: string })?.message
        || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Success / pending state ──────────────────────────────────────────────────
  if (submitState === 'success') {
    return (
      <div className="min-h-screen bg-canteen-cream flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-canteen-green rounded-xl flex items-center justify-center shadow-green">
              <UtensilsCrossed size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-gray-900 text-xl">Smart Canteen</span>
          </div>

          <div className="card p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Clock size={32} className="text-amber-500" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-500 mb-6">
              Your <span className="font-semibold text-gray-700">{ACCOUNT_TYPE_INFO[submittedRole].label}</span> account
              request for <span className="font-semibold text-gray-700">{submittedEmail}</span> has been submitted.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">Your request is now <strong>pending administrator review</strong>.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">Once approved, you can log in using your email and password.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  You can <strong>try logging in</strong> at any time — we'll show you your current request status.
                </p>
              </div>
            </div>

            <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canteen-cream flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-canteen-green rounded-xl flex items-center justify-center shadow-green">
            <UtensilsCrossed size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-gray-900 text-xl">Smart Canteen</span>
        </div>

        <div className="card p-8">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-gray-900">Create account</h2>
            <p className="text-gray-500 mt-1">Join the smart canteen community</p>
          </div>

          {/* Account Type */}
          <div className="mb-5">
            <label htmlFor="account-type" className="block text-sm font-medium text-gray-700 mb-1.5">
              Account Type *
            </label>
            <div className="relative">
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                id="account-type"
                value={accountType}
                onChange={e => { setAccountType(e.target.value as AccountType); setError(''); }}
                className="input-field appearance-none pr-9"
              >
                {(Object.entries(ACCOUNT_TYPE_INFO) as [AccountType, typeof ACCOUNT_TYPE_INFO[AccountType]][]).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.icon} {info.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 ml-1">{ACCOUNT_TYPE_INFO[accountType].description}</p>
            {accountType !== 'STUDENT' && (
              <div className="mt-2 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                <Clock size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  <strong>{ACCOUNT_TYPE_INFO[accountType].label}</strong> requests require administrator approval before you can log in.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="name" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Aarav Singh" required className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="reg-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@college.edu" required className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 9876543210" className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="reg-password" type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters" required className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="confirm" type={showPw ? 'text' : 'password'} value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Repeat password" required className="input-field pl-10" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Submitting...' : `Submit ${ACCOUNT_TYPE_INFO[accountType].label} Request`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-canteen-green font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
