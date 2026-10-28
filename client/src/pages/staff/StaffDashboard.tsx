import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Link } from 'react-router-dom';
import { Order } from '../../types';
import StatusBadge from '../../components/shared/StatusBadge';
import { ClipboardList, CheckCircle, Clock, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';

export default function StaffDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    api.get('/orders', { params: { date: today, limit: '100' } })
      .then(res => { if (res.data.success) setOrders(res.data.orders); })
      .finally(() => setLoading(false));

    // SSE for new orders
    const token = localStorage.getItem('canteen_token');
    const es = new EventSource(`/api/sse/events`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'NEW_ORDER' || data.type === 'ORDER_UPDATE') {
          api.get('/orders', { params: { date: today, limit: '100' } })
            .then(res => { if (res.data.success) setOrders(res.data.orders); });
        }
      } catch { /* */ }
    };
    return () => es.close();
  }, []);

  const stats = {
    total: orders.filter(o => o.status !== 'CANCELLED').length,
    pending: orders.filter(o => ['PLACED', 'CONFIRMED'].includes(o.status)).length,
    preparing: orders.filter(o => o.status === 'PREPARING').length,
    ready: orders.filter(o => o.status === 'READY').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
  };

  const activeOrders = orders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status)).slice(0, 5);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="text-gray-500 mt-1">Today's canteen overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: stats.total, icon: <ClipboardList size={20} />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending', value: stats.pending, icon: <Clock size={20} />, color: 'text-amber-600 bg-amber-50' },
          { label: 'Preparing', value: stats.preparing, icon: <AlertTriangle size={20} />, color: 'text-orange-600 bg-orange-50' },
          { label: 'Completed', value: stats.completed, icon: <CheckCircle size={20} />, color: 'text-green-600 bg-green-50' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              {s.icon}
            </div>
            <div className="font-display text-3xl font-bold text-gray-900">{loading ? '—' : s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active orders */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-gray-900 text-lg">Active Orders</h2>
          <Link to="/staff/queue" className="flex items-center gap-1 text-sm text-canteen-green font-medium hover:underline">
            View All Queue <ChevronRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <CheckCircle size={40} className="mx-auto mb-3 text-green-300" />
            <p>All caught up! No active orders.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map(order => (
              <Link key={order.id} to={`/staff/orders/${order.id}`} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-canteen-green hover:bg-green-50 transition-all group">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-sm text-gray-500">{order.user?.name} • Token: <strong>{order.token?.tokenNumber}</strong></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-canteen-green">₹{order.total.toFixed(2)}</span>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-canteen-green transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
