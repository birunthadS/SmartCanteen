import React from 'react';
import { MenuItem } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Leaf, Flame, Clock, Star } from 'lucide-react';
import { getDishImage } from '../../lib/dishImages';

interface Props {
  item: MenuItem;
}

export default function FoodCard({ item }: Props) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const dishImg = getDishImage(item);

  return (
    <div className="card-hover cursor-pointer group overflow-hidden" onClick={() => navigate(`/menu/${item.id}`)}>
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={dishImg}
          alt={item.name}
          className="food-card-img group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = dishImg; }}
        />
        {/* Veg/Non-veg badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${item.isVegetarian ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {item.isVegetarian ? <Leaf size={11} /> : <Flame size={11} />}
            {item.isVegetarian ? 'Veg' : 'Non-Veg'}
          </span>
        </div>
        {/* Stock */}
        {item.stockQuantity < 10 && item.stockQuantity > 0 && (
          <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            Only {item.stockQuantity} left
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
            <span className="bg-white/90 text-gray-800 text-sm font-bold px-4 py-2 rounded-xl">Unavailable</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
          <span className="text-canteen-green font-bold text-base shrink-0">₹{item.price}</span>
        </div>

        {item.category && (
          <div className="text-xs text-gray-400 mb-2">{item.category.name}</div>
        )}

        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} />
            <span>{item.preparationMins} min</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (item.isAvailable) addToCart(item.id);
            }}
            disabled={!item.isAvailable}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              item.isAvailable
                ? 'bg-canteen-green text-white hover:bg-canteen-green-dark active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={13} />
            {item.isAvailable ? 'Add' : 'N/A'}
          </button>
        </div>
      </div>
    </div>
  );
}
