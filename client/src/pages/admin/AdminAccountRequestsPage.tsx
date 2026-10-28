import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import { UserCheck, Clock, CheckCircle2, XCircle, RefreshCw, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface AccountRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  requestedRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: { name: string; email: string };
}

const ROLE_BADGE: Record<string, string> = {
  STUDENT: 'bg-blue-100 text-blue-700',
  STAFF:   'bg-purple-100 text-purple-700',
  ADMIN:   'bg-rose-100 text-rose-700',
};

const ROLE_ICON: Record<string, string> = {
  STUDENT: '🎓', STAFF: '👷', ADMIN: '🛡️',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING:  'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function AdminAccountRequestsPage() {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejectTarget, setRejectTarget] = useState<AccountRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter !== 'ALL') params.status = filter;
      const res = await api.get('/admin/account-requests', { params });
      if (res.data.success) setRequests(res.data.requests);
    } catch {
      toast.error('Failed to load account requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (req: AccountRequest) => {
    setActionLoading(req.id);
    try {
      await api.post(`/admin/account-requests/${req.id}/approve`);
      toast.success(`✅ Approved — ${req.name} (${req.requestedRole})`);
      await fetchRequests();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Approval failed';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    try {
      await api.post(`/admin/account-requests/${rejectTarget.id}/reject`, { reason: rejectReason || undefined });
      toast.success(`Request rejected for ${rejectTarget.email}`);
      setRejectTarget(null);
      setRejectReason('');
      await fetchRequests();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Rejection failed';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-bold text-gray-900 flex items-center gap-2">
          <UserCheck size={28} className="text-canteen-green" />
          Account Requests
          {filter === 'PENDING' && pendingCount > 0 && (
            <span className="ml-1 text-sm bg-amber-100 text-amber-700 font-semibold px-2.5 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </h1>
        <button onClick={fetchRequests} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? 'bg-canteen-green text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter size={13} />
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="card p-12 text-center">
          <Clock size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No {filter !== 'ALL' ? filter.toLowerCase() : ''} requests</p>
          <p className="text-sm text-gray-400 mt-1">New account requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 bg-canteen-green/10 rounded-xl flex items-center justify-center text-canteen-green font-bold text-lg shrink-0">
                    {req.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{req.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[req.requestedRole] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_ICON[req.requestedRole]} {req.requestedRole}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[req.status]}`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{req.email}</div>
                    {req.phone && <div className="text-xs text-gray-400">{req.phone}</div>}
                    <div className="text-xs text-gray-400 mt-1">
                      Submitted {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {req.reviewedAt && req.reviewedBy && (
                        <span className="ml-2">· Reviewed by <strong>{req.reviewedBy.name}</strong></span>
                      )}
                    </div>
                    {req.rejectionReason && (
                      <div className="text-xs text-red-600 mt-1 italic">Reason: "{req.rejectionReason}"</div>
                    )}
                  </div>
                </div>

                {/* Actions — only for PENDING */}
                {req.status === 'PENDING' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={actionLoading === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      {actionLoading === req.id ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={15} />}
                      Approve
                    </button>
                    <button
                      onClick={() => { setRejectTarget(req); setRejectReason(''); }}
                      disabled={actionLoading === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 text-sm font-medium rounded-xl transition-colors border border-red-200"
                    >
                      <XCircle size={15} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setRejectTarget(null)}>
          <div className="card p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-gray-900 mb-1">Reject Request</h3>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting <strong>{rejectTarget.name}</strong>'s {rejectTarget.requestedRole} account request.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason <span className="text-gray-400 font-normal">(optional — shown to the user)</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Not a registered student of this institution."
              className="input-field resize-none text-sm mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectTarget(null)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
