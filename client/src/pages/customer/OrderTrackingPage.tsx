import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Order, OrderStatus } from '../../types';
import StatusBadge from '../../components/shared/StatusBadge';
import { Clock, Hash, CheckCircle, Circle, Loader, Star, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'PLACED', label: 'Order Placed', desc: 'Your order has been received' },
  { status: 'CONFIRMED', label: 'Confirmed', desc: 'Canteen has confirmed your order' },
  { status: 'PREPARING', label: 'Being Prepared', desc: 'The canteen is preparing your food' },
  { status: 'READY', label: 'Ready for Pickup', desc: 'Your order is ready! Please collect it' },
  { status: 'COMPLETED', label: 'Completed', desc: 'Order collected. Enjoy your meal!' },
];

const STATUS_ORDER = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [queuePos, setQueuePos] = useState<number | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const [orderRes, tokenRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get(`/queue/my-token/${id}`).catch(() => null),
      ]);
      if (orderRes.data.success) setOrder(orderRes.data.order);
      if (tokenRes?.data?.success) setQueuePos(tokenRes.data.queuePosition);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    // Poll every 15 seconds for status
    const interval = setInterval(fetchOrder, 15000);

    // SSE
    const token = localStorage.getItem('canteen_token');
    const es = new EventSource(`/api/sse/events?token=${token}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'ORDER_UPDATE' && data.orderId === id) fetchOrder();
      } catch { /* */ }
    };

    return () => { clearInterval(interval); es.close(); };
  }, [fetchOrder, id]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader size={40} className="animate-spin text-canteen-green" />
    </div>
  );

  if (!order) return <div className="text-center py-20 text-gray-500">Order not found.</div>;

  const currentStepIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Order Tracking</h1>
        <button onClick={fetchOrder} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-canteen-green transition-colors">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Token + Status card */}
      <div className={`rounded-3xl p-6 mb-6 text-white ${isCancelled ? 'bg-red-500' : 'bg-hero'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Order #{order.orderNumber}</p>
            <div className="mt-1"><StatusBadge status={order.status} /></div>
          </div>
          {order.token && !isCancelled && (
            <div className="text-right">
              <p className="text-white/70 text-xs mb-1">Token</p>
              <div className="font-display text-5xl font-bold">{order.token.tokenNumber}</div>
            </div>
          )}
        </div>
        {queuePos !== null && !isCancelled && order.status !== 'COMPLETED' && (
          <div className="mt-4 pt-4 border-t border-white/20 text-sm text-white/80">
            Queue position: <strong className="text-white">{queuePos}</strong>
          </div>
        )}
        {!isCancelled && (
          <div className="mt-2 text-sm text-white/70 flex items-center gap-1">
            <Clock size={13} /> Pickup: {order.pickupSlot?.label} on {order.scheduledDate}
          </div>
        )}
      </div>

      {/* Progress stepper */}
      {!isCancelled && (
        <div className="card p-6 mb-6">
          <h2 className="font-display font-semibold text-gray-900 mb-6">Order Progress</h2>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, idx) => {
              const done = idx <= currentStepIdx;
              const active = idx === currentStepIdx;
              return (
                <div key={step.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all ${
                      done ? 'bg-canteen-green shadow-green' : 'bg-gray-100'
                    }`}>
                      {done ? <CheckCircle size={18} className="text-white" /> : <Circle size={18} className="text-gray-300" />}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${idx < currentStepIdx ? 'bg-canteen-green' : 'bg-gray-200'}`} style={{ minHeight: 32 }} />
                    )}
                  </div>
                  <div className={`pb-6 ${idx === STATUS_STEPS.length - 1 ? 'pb-0' : ''}`}>
                    <div className={`font-semibold text-sm ${done ? 'text-canteen-green' : 'text-gray-400'}`}>
                      {step.label}
                      {active && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium animate-pulse-soft">Current</span>}
                    </div>
                    <div className={`text-xs mt-0.5 ${done ? 'text-gray-500' : 'text-gray-300'}`}>{step.desc}</div>
                    {order.statusHistory?.find(h => h.status === step.status) && (
                      <div className="text-xs text-gray-300 mt-0.5">
                        {new Date(order.statusHistory.find(h => h.status === step.status)!.createdAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="card p-6 mb-6 border-red-100">
          <p className="text-red-600 font-semibold">Order Cancelled</p>
          {order.cancelReason && <p className="text-gray-500 text-sm mt-1">Reason: {order.cancelReason}</p>}
        </div>
      )}

      {/* Review button if completed */}
      {order.status === 'COMPLETED' && !order.review && (
        <div className="card p-6 mb-4 border-amber-100 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">How was your meal?</p>
              <p className="text-sm text-gray-500 mt-0.5">Share your feedback to help us improve</p>
            </div>
            <Link to={`/feedback/${order.id}`} className="btn-amber flex items-center gap-2 text-sm">
              <Star size={15} /> Rate
            </Link>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link to="/orders" className="btn-secondary flex-1 text-center">View All Orders</Link>
        <Link to="/menu" className="btn-primary flex-1 text-center">Order Again</Link>
      </div>
    </div>
  );
}
