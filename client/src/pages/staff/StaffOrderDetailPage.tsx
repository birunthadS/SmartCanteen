import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Order } from '../../types';
import StatusBadge from '../../components/shared/StatusBadge';
import { ArrowLeft, Loader, CheckCircle, X, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
};

export default function StaffOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    const res = await api.get(`/orders/${id}`);
    if (res.data.success) setOrder(res.data.order);
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchOrder();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const markCashPaid = async () => {
    try {
      await api.patch(`/payments/${id}/cash-collected`);
      toast.success('Cash payment recorded');
      fetchOrder();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader size={40} className="animate-spin text-canteen-green" /></div>;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  const allowed = VALID_TRANSITIONS[order.status] || [];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} /> Back
      </button>

      {/* Header */}
      <div className="card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-gray-500 text-sm">{order.user?.name} • {order.user?.phone || order.user?.email}</p>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Token</div>
            <div className="w-16 h-16 bg-canteen-green rounded-2xl flex items-center justify-center shadow-green">
              <span className="font-display text-2xl font-bold text-white">{order.token?.tokenNumber || '—'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={order.status} />
          <span className="text-sm text-gray-500">Pickup: {order.pickupSlot?.label}</span>
          <span className="text-sm text-gray-500">{order.scheduledDate}</span>
        </div>
      </div>

      {/* Items */}
      <div className="card p-6 mb-4">
        <h2 className="font-display font-semibold text-gray-900 mb-3">Order Items</h2>
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-700 font-medium">{item.name} × {item.quantity}</span>
              <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>₹{order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm text-gray-500"><span>Tax</span><span>₹{order.tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-canteen-green">₹{order.total.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Payment */}
      <div className="card p-6 mb-4">
        <h2 className="font-display font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CreditCard size={18} /> Payment
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{order.paymentMethod === 'CASH' ? 'Cash at Pickup' : 'Online (Demo)'}</p>
            <p className={`text-sm font-semibold mt-0.5 ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>
              {order.paymentStatus}
            </p>
          </div>
          {order.paymentMethod === 'CASH' && order.paymentStatus === 'PENDING' && order.status === 'COMPLETED' && (
            <button onClick={markCashPaid} className="btn-primary text-sm py-2">Mark Paid</button>
          )}
        </div>
      </div>

      {/* Status actions */}
      {allowed.length > 0 && (
        <div className="card p-6 mb-4">
          <h2 className="font-display font-semibold text-gray-900 mb-3">Update Status</h2>
          <div className="flex gap-3 flex-wrap">
            {allowed.map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={updating}
                className={s === 'CANCELLED' ? 'btn-danger flex items-center gap-2 text-sm' : 'btn-primary flex items-center gap-2 text-sm'}
              >
                {s === 'CANCELLED' ? <X size={15} /> : <CheckCircle size={15} />}
                Mark {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {order.notes && (
        <div className="card p-4 bg-yellow-50 border-yellow-100">
          <p className="text-sm font-medium text-yellow-800">📝 Special Instructions:</p>
          <p className="text-sm text-yellow-700 mt-1">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
