import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Order } from '../../types';
import { CheckCircle, Hash, Clock, CreditCard, ArrowRight, Loader } from 'lucide-react';

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        if (res.data.success) setOrder(res.data.order);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader size={40} className="animate-spin text-canteen-green" />
    </div>
  );

  if (!order) return <div className="text-center py-20 text-gray-500">Order not found.</div>;

  return (
    <div className="max-w-lg mx-auto animate-slide-up py-8">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-canteen-green" />
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Order Confirmed! 🎉</h1>
        <p className="text-gray-500">Your order has been placed successfully</p>
      </div>

      {/* Token card */}
      {order.token && (
        <div className="bg-hero rounded-3xl p-8 text-center mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-24 h-24 bg-white rounded-full blur-2xl" />
            <div className="absolute bottom-4 right-4 w-32 h-32 bg-amber-300 rounded-full blur-2xl" />
          </div>
          <p className="text-green-200 text-sm font-medium mb-2">Your Queue Token</p>
          <div className="font-display text-7xl font-bold text-white mb-2">
            {order.token.tokenNumber}
          </div>
          <p className="text-green-200 text-sm">Show this number at the counter</p>
        </div>
      )}

      {/* Order details */}
      <div className="card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-gray-900">Order Details</h2>
          <span className="badge bg-blue-100 text-blue-800">{order.status}</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Hash size={15} className="text-gray-400" />
            <span className="text-gray-500">Order Number</span>
            <span className="ml-auto font-semibold text-gray-900">{order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock size={15} className="text-gray-400" />
            <span className="text-gray-500">Pickup Slot</span>
            <span className="ml-auto font-semibold text-gray-900">{order.pickupSlot?.label}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock size={15} className="text-gray-400" />
            <span className="text-gray-500">Date</span>
            <span className="ml-auto font-semibold text-gray-900">{order.scheduledDate}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CreditCard size={15} className="text-gray-400" />
            <span className="text-gray-500">Payment</span>
            <span className="ml-auto font-semibold text-gray-900">{order.paymentMethod === 'CASH' ? 'Cash at Pickup' : 'Online (Demo)'}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-6 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Items Ordered</h3>
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.name} × {item.quantity}</span>
              <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>₹{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>GST</span><span>₹{order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span><span className="text-canteen-green">₹{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link to={`/orders/${order.id}/track`} className="btn-primary flex items-center justify-center gap-2">
          Track Order Live <ArrowRight size={16} />
        </Link>
        <Link to="/menu" className="btn-secondary flex items-center justify-center gap-2">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
