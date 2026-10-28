import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Order } from '../../types';
import StatusBadge from '../../components/shared/StatusBadge';
import { ClipboardList, ChevronRight, Hash, Clock, Loader } from 'lucide-react';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/order-history')
      .then(res => { if (res.data.success) setOrders(res.data.orders); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-8 w-48 rounded-xl" />
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ClipboardList size={28} className="text-canteen-green" /> My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="font-display text-xl font-semibold text-gray-600 mb-2">No orders yet</h2>
          <p className="text-gray-400 mb-6">Place your first order to get started!</p>
          <Link to="/menu" className="btn-primary">Browse Menu</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="card p-5 hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-display font-bold text-gray-900">#{order.orderNumber}</span>
                    <StatusBadge status={order.status} />
                    {order.review && <span className="badge bg-amber-100 text-amber-700">Reviewed ⭐</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Hash size={13} />{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1"><Clock size={13} />{order.pickupSlot?.label}</span>
                    <span>{order.scheduledDate}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {order.items.slice(0, 3).map(i => i.name).join(', ')}
                    {order.items.length > 3 && ` +${order.items.length - 3} more`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-canteen-green text-lg">₹{order.total.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">{order.paymentMethod}</div>
                  <div className="flex gap-2 mt-2">
                    {order.status === 'COMPLETED' && !order.review && (
                      <Link to={`/feedback/${order.id}`} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-medium hover:bg-amber-200 transition-colors">
                        Rate
                      </Link>
                    )}
                    <Link to={`/orders/${order.id}/track`} className="flex items-center gap-1 text-xs bg-green-50 text-canteen-green px-2 py-1 rounded-lg font-medium hover:bg-green-100 transition-colors">
                      View <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
