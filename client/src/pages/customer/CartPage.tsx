import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { getDishImage } from '../../lib/dishImages';

export default function CartPage() {
  const { items, subtotal, tax, total, isLoading, fetchCart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => { fetchCart(); }, []);

  if (isLoading) return (
    <div className="animate-fade-in">
      <div className="skeleton h-8 w-48 rounded-xl mb-6" />
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl mb-3" />)}
    </div>
  );

  if (items.length === 0) return (
    <div className="text-center py-24 animate-fade-in">
      <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <ShoppingBag size={40} className="text-gray-300" />
      </div>
      <h2 className="font-display text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
      <p className="text-gray-400 mb-8">Add some delicious items from the menu!</p>
      <Link to="/menu" className="btn-primary inline-flex items-center gap-2">
        Browse Menu <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ShoppingCart size={28} className="text-canteen-green" /> Your Cart
      </h1>

      <div className="space-y-3 mb-6">
        {items.map(item => {
          const dishImg = getDishImage(item.menuItem);
          return (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <img
                src={dishImg}
                alt={item.menuItem.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = dishImg; }}
              />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{item.menuItem.name}</h3>
              <p className="text-canteen-green font-bold">₹{item.menuItem.price}</p>
              {item.menuItem.category && <p className="text-xs text-gray-400">{item.menuItem.category.name}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-canteen-green hover:text-canteen-green transition-all">
                <Minus size={13} />
              </button>
              <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-canteen-green hover:text-canteen-green transition-all">
                <Plus size={13} />
              </button>
            </div>
            <div className="text-right min-w-[60px]">
              <p className="font-bold text-gray-900">₹{(item.menuItem.price * item.quantity).toFixed(2)}</p>
            </div>
            <button onClick={() => removeItem(item.menuItemId)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
              <Trash2 size={16} />
            </button>
            </div>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">GST (5%)</span>
            <span className="font-medium">₹{tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-canteen-green">₹{total.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={() => navigate('/checkout')} className="btn-primary w-full flex items-center justify-center gap-2 text-base">
          Proceed to Checkout <ArrowRight size={18} />
        </button>
        <Link to="/menu" className="block text-center text-sm text-gray-500 hover:text-canteen-green mt-3 transition-colors">
          + Add more items
        </Link>
      </div>
    </div>
  );
}
