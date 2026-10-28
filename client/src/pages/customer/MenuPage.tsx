import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { MenuItem, MenuCategory } from '../../types';
import FoodCard from '../../components/menu/FoodCard';
import { Search, Filter, Leaf, ChefHat, SlidersHorizontal } from 'lucide-react';

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (activeCategory !== 'all') params.category = activeCategory;
      if (search) params.search = search;
      if (vegOnly) params.veg = 'true';

      const [itemsRes, catRes] = await Promise.all([
        api.get('/menu/items', { params }),
        api.get('/menu/categories'),
      ]);

      if (itemsRes.data.success) setItems(itemsRes.data.items);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search, vegOnly]);

  useEffect(() => {
    const t = setTimeout(fetchMenu, 300);
    return () => clearTimeout(t);
  }, [fetchMenu]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <ChefHat size={28} className="text-canteen-green" /> Our Menu
        </h1>
        <p className="text-gray-500">Fresh, delicious meals prepared with care</p>
      </div>

      {/* Search + filters */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for food..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <button
          onClick={() => setVegOnly(!vegOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
            vegOnly ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
          }`}
        >
          <Leaf size={16} />
          Veg Only
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {[{ id: 'all', name: 'All Items' }, ...categories].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id === 'all' ? 'all' : cat.name)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              (cat.id === 'all' ? activeCategory === 'all' : activeCategory === cat.name)
                ? 'bg-canteen-green text-white shadow-green'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-canteen-green hover:text-canteen-green'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton h-48 rounded-none rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 rounded-lg w-3/4" />
                <div className="skeleton h-3 rounded-lg w-full" />
                <div className="skeleton h-3 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">No items found</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{items.length} item{items.length !== 1 ? 's' : ''} found</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map(item => <FoodCard key={item.id} item={item} />)}
          </div>
        </>
      )}
    </div>
  );
}
