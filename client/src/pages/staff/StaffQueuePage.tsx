import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import { Order } from '../../types';
import StatusBadge from '../../components/shared/StatusBadge';
import { Link } from 'react-router-dom';
import { Bell, RefreshCw, Play, ChevronRight, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_TABS = ['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as const;

export default function StaffQueuePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [calling, setCalling] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { date, limit: '100' };
      if (filter !== 'ALL') params.status = filter;
      const res = await api.get('/orders', { params });
      if (res.data.success) setOrders(res.data.orders);
    } finally {
      setLoading(false);
    }
  }, [date, filter]);

  useEffect(() => {
    fetchOrders();
    const es = new EventSource('/api/sse/events');
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (['NEW_ORDER', 'ORDER_UPDATE'].includes(data.type)) fetchOrders();
      } catch { /* */ }
    };
    return () => es.close();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string, note?: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status, note });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed';
      toast.error(msg);
    }
  };

  const callNext = async () => {
    setCalling(true);
    try {
      const res = await api.post('/queue/call-next', { date });
      if (res.data.order) {
        toast.success(`Calling Token ${res.data.order.token?.tokenNumber} — ${res.data.order.user?.name}`);
        fetchOrders();
      } else {
        toast.success('No more orders in queue');
      }
    } catch {
      toast.error('Failed to call next');
    } finally {
      setCalling(false);
    }
  };

  const NEXT_STATUS: Record<string, string> = {
    PLACED: 'CONFIRMED',
    CONFIRMED: 'PREPARING',
    PREPARING: 'READY',
    READY: 'COMPLETED',
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-bold text-gray-900">Live Order Queue</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field text-sm py-2 px-3" />
          <button onClick={fetchOrders} className="btn-secondary py-2 flex items-center gap-1.5 text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={callNext} disabled={calling} className="btn-amber py-2 flex items-center gap-1.5 text-sm">
            <Play size={15} /> Call Next
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === tab ? 'bg-canteen-green text-white shadow-green' : 'bg-white text-gray-600 border border-gray-200 hover:border-canteen-green'
            }`}
          >
            {tab}
            <span className="ml-1 text-xs opacity-70">({tab === 'ALL' ? orders.length : orders.filter(o => o.status === tab).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bell size={40} className="mx-auto mb-3 text-gray-200" />
          <p>No orders for the selected filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const nextStatus = NEXT_STATUS[order.status];
            return (
              <div key={order.id} className="card p-5 flex items-center gap-4">
                {/* Token */}
                <div className="w-14 h-14 rounded-2xl bg-canteen-green/10 flex items-center justify-center shrink-0">
                  <span className="font-display text-xl font-bold text-canteen-green">{order.token?.tokenNumber || '—'}</span>
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-sm text-gray-600">{order.user?.name} • {order.pickupSlot?.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {order.items.slice(0, 2).map(i => `${i.name}×${i.quantity}`).join(', ')}
                    {order.items.length > 2 ? ` +${order.items.length - 2}` : ''}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-canteen-green hidden sm:block">₹{order.total.toFixed(2)}</span>
                  {nextStatus && (
                    <button
                      onClick={() => updateStatus(order.id, nextStatus)}
                      className="text-xs px-3 py-1.5 bg-canteen-green text-white font-semibold rounded-lg hover:bg-canteen-green-dark transition-all"
                    >
                      Mark {nextStatus}
                    </button>
                  )}
                  {order.status === 'PLACED' && (
                    <button
                      onClick={() => updateStatus(order.id, 'CANCELLED', 'Cancelled by staff')}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <Link to={`/staff/orders/${order.id}`} className="p-2 text-gray-400 hover:text-canteen-green transition-colors">
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
