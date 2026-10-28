import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import { Order } from '../../types';
import StatusBadge from '../../components/shared/StatusBadge';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_OPTS = ['', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const LIMIT = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { limit: String(LIMIT), skip: String((page - 1) * LIMIT) };
    if (statusFilter) params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;
    if (searchFilter) params.search = searchFilter;
    const res = await api.get('/admin/orders', { params });
    if (res.data.success) { setOrders(res.data.orders); setTotal(res.data.total || 0); }
    setLoading(false);
  }, [page, statusFilter, dateFilter, searchFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-bold text-gray-900">All Orders</h1>
        <button onClick={() => window.open('/api/admin/analytics/csv', '_blank')} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search order number / user..." value={searchFilter} onChange={e => { setSearchFilter(e.target.value); setPage(1); }} className="input-field pl-10 text-sm py-2" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field text-sm py-2 min-w-[150px]">
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} className="input-field text-sm py-2" />
      </div>

      {loading ? <div className="skeleton h-80 rounded-2xl" /> : (
        <>
          <div className="card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Order #</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Customer</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Pickup</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600">Total</th>
                    <th className="text-center px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-gray-900">{order.orderNumber}</div>
                        <div className="text-xs text-gray-400">Token: {order.token?.tokenNumber || '—'}</div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <div className="text-gray-900">{order.user?.name}</div>
                        <div className="text-xs text-gray-400">{order.user?.email}</div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                        <div>{order.pickupSlot?.label}</div>
                        <div className="text-xs text-gray-400">{order.scheduledDate}</div>
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-3 text-right font-bold text-gray-900">₹{order.total.toFixed(2)}</td>
                      <td className="px-5 py-3 text-center hidden md:table-cell">
                        <span className={`text-xs font-semibold ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-2 px-3">
                  <ChevronLeft size={16} />
                </button>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-2 px-3">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
