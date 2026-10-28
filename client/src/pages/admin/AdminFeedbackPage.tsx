import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Star, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewRecord {
  id: string; rating: number; comment?: string; isVisible: boolean; createdAt: string;
  user: { name: string; email: string };
  order: { orderNumber: string };
  menuItem?: { name: string };
}

export default function AdminFeedbackPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState(0);

  const fetchReviews = async () => {
    const params: Record<string, string> = { limit: '100' };
    if (ratingFilter) params.rating = String(ratingFilter);
    const res = await api.get('/reviews/admin', { params });
    if (res.data.success) setReviews(res.data.reviews);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [ratingFilter]);

  const toggleVisibility = async (id: string, current: boolean) => {
    await api.patch(`/reviews/${id}/visibility`);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isVisible: !current } : r));
    toast.success(current ? 'Review hidden' : 'Review published');
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await api.delete(`/reviews/${id}`);
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success('Review deleted');
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Star size={28} className="text-amber-400" fill="#f59e0b" /> Feedback & Reviews
        </h1>
        <div className="flex items-center gap-3">
          <div className="card px-4 py-2 text-center">
            <div className="font-display text-2xl font-bold text-amber-500">{avgRating}</div>
            <div className="text-xs text-gray-500">Avg Rating</div>
          </div>
          <div className="card px-4 py-2 text-center">
            <div className="font-display text-2xl font-bold text-gray-900">{reviews.length}</div>
            <div className="text-xs text-gray-500">Total Reviews</div>
          </div>
        </div>
      </div>

      {/* Rating filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setRatingFilter(0)} className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${ratingFilter === 0 ? 'bg-canteen-green text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          All
        </button>
        {[5, 4, 3, 2, 1].map(r => (
          <button key={r} onClick={() => setRatingFilter(r)} className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1 ${ratingFilter === r ? 'bg-amber-400 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {r} <Star size={12} fill={ratingFilter === r ? 'white' : 'none'} />
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Star size={40} className="mx-auto mb-3 text-gray-200" />
          <p>No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className={`card p-5 ${!review.isVisible ? 'opacity-60 border-gray-100' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{review.user.name}</span>
                    <span className="text-xs text-gray-400">• Order #{review.order.orderNumber}</span>
                    {review.menuItem && <span className="badge bg-gray-100 text-gray-600">{review.menuItem.name}</span>}
                    {!review.isVisible && <span className="badge badge-red">Hidden</span>}
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < review.rating ? '#f59e0b' : 'none'} className={i < review.rating ? 'text-amber-400' : 'text-gray-200'} />
                    ))}
                  </div>
                  {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                  <p className="text-xs text-gray-400 mt-1.5">{new Date(review.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleVisibility(review.id, review.isVisible)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title={review.isVisible ? 'Hide' : 'Show'}>
                    {review.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => deleteReview(review.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
