import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Order } from '../../types';
import { Star, Send, Loader, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FeedbackPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/orders/${orderId}`)
      .then(res => { if (res.data.success) setOrder(res.data.order); })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      await api.post('/reviews', { orderId, rating, comment: comment || undefined });
      toast.success('Thank you for your feedback! ⭐');
      navigate('/orders');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit review';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader size={40} className="animate-spin text-canteen-green" />
    </div>
  );

  if (!order) return <div className="text-center py-20 text-gray-500">Order not found.</div>;
  if (order.status !== 'COMPLETED') return (
    <div className="text-center py-20">
      <AlertCircle size={48} className="text-amber-400 mx-auto mb-4" />
      <h2 className="font-display text-xl font-semibold text-gray-700">Order not completed yet</h2>
      <p className="text-gray-400 mt-2">You can only review completed orders.</p>
    </div>
  );
  if (order.review) return (
    <div className="text-center py-20">
      <Star size={48} className="text-amber-400 mx-auto mb-4" fill="#f59e0b" />
      <h2 className="font-display text-xl font-semibold text-gray-700">Already Reviewed</h2>
      <p className="text-gray-400 mt-2">You've already submitted feedback for this order.</p>
    </div>
  );

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

  return (
    <div className="max-w-lg mx-auto animate-fade-in py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Rate Your Order</h1>
      <p className="text-gray-500 mb-8">Order #{order.orderNumber} — {order.items.length} items</p>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star rating */}
          <div className="text-center">
            <p className="text-gray-600 font-medium mb-4">How would you rate your experience?</p>
            <div className="flex justify-center gap-3 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={44}
                    fill={(hovered || rating) >= star ? '#f59e0b' : 'none'}
                    className={(hovered || rating) >= star ? 'text-amber-400' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p className="text-amber-600 font-semibold animate-fade-in">
                {LABELS[hovered || rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Write a review <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell us about your experience — food quality, speed, service..."
              rows={4}
              maxLength={500}
              className="input-field resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/500</p>
          </div>

          <button type="submit" disabled={submitting || rating === 0} className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
