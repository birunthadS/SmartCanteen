import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { PickupSlot } from '../../types';
import { Calendar, Clock, CreditCard, Banknote, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { items, subtotal, tax, total, fetchCart } = useCart();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => { fetchCart(); }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    api.get('/pickup-slots', { params: { date: selectedDate } })
      .then(res => { if (res.data.success) setSlots(res.data.slots); })
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  const handleCheckout = async () => {
    if (!selectedSlot) { toast.error('Please select a pickup slot'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    setLoading(true);
    try {
      const res = await api.post('/orders/checkout', {
        pickupSlotId: selectedSlot,
        scheduledDate: selectedDate,
        paymentMethod,
        notes: notes || undefined,
      });
      if (res.data.success) {
        await fetchCart();
        toast.success('Order placed successfully! 🎉');
        navigate(`/orders/${res.data.order.id}/confirmation`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Checkout failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Min date = today, max = 7 days ahead
  const minDate = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  if (items.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="font-display text-xl font-semibold text-gray-600">Your cart is empty</h2>
        <button onClick={() => navigate('/menu')} className="mt-4 btn-primary">Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — slot + payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date picker */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-canteen-green" /> Select Date
            </h2>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
              className="input-field"
            />
          </div>

          {/* Slot picker */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-canteen-green" /> Select Pickup Slot
            </h2>
            {slotsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slots.map(slot => (
                  <button
                    key={slot.id}
                    disabled={slot.isFull}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedSlot === slot.id
                        ? 'border-canteen-green bg-green-50'
                        : slot.isFull
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-canteen-green hover:bg-green-50'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">{slot.label}</div>
                    <div className={`text-xs mt-1 ${slot.isFull ? 'text-red-500' : 'text-gray-400'}`}>
                      {slot.isFull ? 'Full' : `${slot.remaining} spots left`}
                    </div>
                    {selectedSlot === slot.id && <CheckCircle size={14} className="text-canteen-green mt-1" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-canteen-green" /> Payment Method
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'CASH' as const, label: 'Cash at Pickup', icon: <Banknote size={20} />, desc: 'Pay when you collect' },
                { id: 'ONLINE' as const, label: 'Simulated Online', icon: <CreditCard size={20} />, desc: 'Demo payment (not real)' },
              ]).map(pm => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === pm.id ? 'border-canteen-green bg-green-50' : 'border-gray-200 hover:border-canteen-green'
                  }`}
                >
                  <div className={`mb-2 ${paymentMethod === pm.id ? 'text-canteen-green' : 'text-gray-400'}`}>{pm.icon}</div>
                  <div className="font-semibold text-gray-900 text-sm">{pm.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{pm.desc}</div>
                </button>
              ))}
            </div>
            {paymentMethod === 'ONLINE' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                ℹ️ This is a <strong>simulated</strong> payment for demonstration. No real transaction occurs.
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card p-6">
            <label className="block font-display font-semibold text-gray-900 mb-3">Special Instructions <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Allergies, preferences, extra requests..."
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Right — order summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-display font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1">{item.menuItem.name} × {item.quantity}</span>
                  <span className="font-medium ml-2">₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>GST (5%)</span><span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-1 border-t border-gray-100">
                <span>Total</span><span className="text-canteen-green">₹{total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading || !selectedSlot}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={18} />}
              {loading ? 'Placing Order...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
