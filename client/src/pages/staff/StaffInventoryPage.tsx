import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { MenuItem } from '../../types';
import { Package, AlertTriangle, TrendingDown } from 'lucide-react';
import { getDishImage } from '../../lib/dishImages';

export default function StaffInventoryPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/menu/items/all')
      .then(res => { if (res.data.success) setItems(res.data.items); })
      .finally(() => setLoading(false));
  }, []);

  const lowStock = items.filter(i => i.stockQuantity < 10 && i.isAvailable);
  const outOfStock = items.filter(i => !i.isAvailable || i.stockQuantity === 0);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Package size={28} className="text-canteen-green" /> Stock Availability
      </h1>

      {lowStock.length > 0 && (
        <div className="card p-4 mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
            <AlertTriangle size={18} /> Low Stock Alert ({lowStock.length} items)
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(i => (
              <span key={i.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-lg font-medium">
                {i.name}: {i.stockQuantity} left
              </span>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Item</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Category</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">Stock</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.isAvailable ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <img
                        src={getDishImage(item)}
                        alt={item.name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100 shadow-sm"
                        onError={e => { (e.target as HTMLImageElement).src = getDishImage(item); }}
                      />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{item.category?.name}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`font-semibold ${item.stockQuantity === 0 ? 'text-red-600' : item.stockQuantity < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                      {item.stockQuantity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {!item.isAvailable || item.stockQuantity === 0 ? (
                      <span className="badge badge-red">Out of Stock</span>
                    ) : item.stockQuantity < 10 ? (
                      <span className="badge badge-amber">Low Stock</span>
                    ) : (
                      <span className="badge badge-green">Available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
