import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { MenuItem } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { ArrowLeft, Leaf, Flame, Clock, ShoppingCart, Plus, Minus, Star, AlertCircle } from 'lucide-react';
import { getDishImage } from '../../lib/dishImages';

export default function MenuItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [item, setItem] = useState<(MenuItem & { avgRating?: number | null; reviews?: { rating: number; comment?: string | null; user: { name: string }; createdAt: string }[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/menu/items/${id}`);
        if (res.data.success) setItem(res.data.item);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAddToCart = () => {
    if (!item) return;
    addToCart(item.id, qty);
  };

  if (loading) return (
    <div className="animate-fade-in">
      <div className="skeleton h-80 rounded-3xl mb-6" />
      <div className="space-y-3">
        <div className="skeleton h-8 rounded-xl w-2/3" />
        <div className="skeleton h-5 rounded-xl w-full" />
        <div className="skeleton h-5 rounded-xl w-3/4" />
      </div>
    </div>
  );

  if (!item) return (
    <div className="text-center py-20">
      <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
      <h3 className="font-display text-xl font-semibold text-gray-600">Item not found</h3>
      <button onClick={() => navigate('/menu')} className="mt-4 btn-secondary">Back to Menu</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button onClick={() => navigate('/menu')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft size={18} /> Back to Menu
      </button>

      <div className="card overflow-hidden">
        {/* Image */}
        <div className="relative">
          <img
            src={getDishImage(item)}
            alt={item.name}
            className="w-full h-72 object-cover"
            onError={e => { (e.target as HTMLImageElement).src = getDishImage(item); }}
          />
          <div className="absolute top-4 left-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${item.isVegetarian ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {item.isVegetarian ? <Leaf size={14} /> : <Flame size={14} />}
              {item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="font-display text-2xl font-bold text-gray-900">{item.name}</h1>
            <div className="text-right">
              <div className="text-2xl font-bold text-canteen-green">₹{item.price}</div>
              {item.category && <div className="text-xs text-gray-400">{item.category.name}</div>}
            </div>
          </div>

          {item.avgRating && (
            <div className="flex items-center gap-1.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill={i < Math.round(item.avgRating!) ? '#f59e0b' : 'none'} className={i < Math.round(item.avgRating!) ? 'text-amber-400' : 'text-gray-300'} />
              ))}
              <span className="text-sm text-gray-500">{item.avgRating.toFixed(1)}</span>
            </div>
          )}

          {item.description && <p className="text-gray-600 mb-4 leading-relaxed">{item.description}</p>}

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
              <Clock size={14} />
              <span>~{item.preparationMins} mins prep time</span>
            </div>
            {item.stockQuantity < 20 && item.stockQuantity > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                <AlertCircle size={14} />
                Only {item.stockQuantity} left
              </div>
            )}
          </div>

          {item.allergyInfo && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl mb-6 text-sm text-yellow-800">
              ⚠️ <strong>Allergy info:</strong> {item.allergyInfo}
            </div>
          )}

          {/* Add to cart */}
          {item.isAvailable ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-canteen-green hover:text-canteen-green transition-all">
                  <Minus size={14} />
                </button>
                <span className="font-semibold text-gray-900 w-6 text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(item.stockQuantity, qty + 1))} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-canteen-green hover:text-canteen-green transition-all">
                  <Plus size={14} />
                </button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                <ShoppingCart size={16} />
                Add {qty > 1 ? `(${qty})` : ''} to Cart — ₹{(item.price * qty).toFixed(2)}
              </button>
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-xl text-gray-500 font-medium">
              This item is currently unavailable
            </div>
          )}
        </div>

        {/* Reviews section */}
        {item.reviews && item.reviews.length > 0 && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-6">
            <h3 className="font-display font-semibold text-gray-900 mb-4">Customer Reviews</h3>
            <div className="space-y-4">
              {item.reviews.map((r, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">{r.user.name}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < r.rating ? '#f59e0b' : 'none'} className={i < r.rating ? 'text-amber-400' : 'text-gray-300'} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
