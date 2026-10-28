import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { MenuItem } from '../../types';
import { Package, Plus, Minus, AlertTriangle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDishImage } from '../../lib/dishImages';

export default function AdminInventoryPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  const fetchItems = async () => {
    const res = await api.get('/menu/items/all');
    if (res.data.success) setItems(res.data.items);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const adjustStock = async (itemId: string, type: 'ADD' | 'REMOVE') => {
    const n = parseInt(qty);
    if (!n || n <= 0) { toast.error('Enter a valid quantity'); return; }
    try {
      await api.post(`/menu/items/${itemId}/inventory`, { type, quantity: n, reason: reason || `Manual ${type}` });
      toast.success('Stock updated!');
      setAdjusting(null); setQty(''); setReason('');
      fetchItems();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      toast.error(msg);
    }
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock = items.filter(i => i.stockQuantity < 10 && i.isAvailable);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Package size={28} className="text-canteen-green" /> Inventory Management
      </h1>

      {lowStock.length > 0 && (
        <div className="card p-4 mb-6 bg-amber-50 border-amber-200 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 mb-1">Low Stock Alert: {lowStock.length} items need restocking</p>
            <div className="flex flex-wrap gap-2">
              {lowStock.map(i => (
                <span key={i.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-lg">
                  {i.name}: {i.stockQuantity}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="input-field pl-10" />
      </div>

      {loading ? <div className="skeleton h-80 rounded-2xl" /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Item</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Current Stock</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => (
                  <React.Fragment key={item.id}>
                    <tr className={`hover:bg-gray-50 transition-colors ${item.stockQuantity < 10 ? 'bg-red-50/30' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getDishImage(item)}
                            alt={item.name}
                            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100 shadow-sm"
                            onError={e => { (e.target as HTMLImageElement).src = getDishImage(item); }}
                          />
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-400">{item.category?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xl font-bold ${item.stockQuantity === 0 ? 'text-red-600' : item.stockQuantity < 10 ? 'text-amber-600' : 'text-gray-800'}`}>
                          {item.stockQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {!item.isAvailable ? <span className="badge badge-red">Disabled</span>
                          : item.stockQuantity === 0 ? <span className="badge badge-red">Out of Stock</span>
                          : item.stockQuantity < 10 ? <span className="badge badge-amber">Low Stock</span>
                          : <span className="badge badge-green">Good</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => setAdjusting(adjusting === item.id ? null : item.id)}
                          className="text-xs btn-secondary py-1.5 px-3"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                    {adjusting === item.id && (
                      <tr className="bg-blue-50">
                        <td colSpan={4} className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="number" min="1" placeholder="Qty"
                              value={qty} onChange={e => setQty(e.target.value)}
                              className="input-field w-28 py-2 text-sm"
                            />
                            <input
                              placeholder="Reason (optional)"
                              value={reason} onChange={e => setReason(e.target.value)}
                              className="input-field flex-1 py-2 text-sm"
                            />
                            <button onClick={() => adjustStock(item.id, 'ADD')} className="flex items-center gap-1.5 btn-primary text-sm py-2">
                              <Plus size={14} /> Add Stock
                            </button>
                            <button onClick={() => adjustStock(item.id, 'REMOVE')} className="flex items-center gap-1.5 btn-danger text-sm py-2">
                              <Minus size={14} /> Remove Stock
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
