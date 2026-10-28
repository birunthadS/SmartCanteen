import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { MenuItem, MenuCategory } from '../../types';
import { Plus, Pencil, Trash2, Loader, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDishImage } from '../../lib/dishImages';

const EMPTY_FORM = {
  name: '', description: '', price: '', categoryId: '', preparationMins: '15',
  stockQuantity: '50', isVegetarian: false, isAvailable: true,
  imageUrl: '', allergyInfo: '',
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catModal, setCatModal] = useState(false);
  const [catName, setCatName] = useState('');

  const fetchAll = async () => {
    const [itemRes, catRes] = await Promise.all([
      api.get('/menu/items/all'),
      api.get('/menu/categories'),
    ]);
    if (itemRes.data.success) setItems(itemRes.data.items);
    if (catRes.data.success) setCategories(catRes.data.categories);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      name: item.name, description: item.description || '', price: String(item.price),
      categoryId: item.categoryId, preparationMins: String(item.preparationMins),
      stockQuantity: String(item.stockQuantity), isVegetarian: item.isVegetarian,
      isAvailable: item.isAvailable, imageUrl: item.imageUrl || '', allergyInfo: item.allergyInfo || '',
    });
    setModal(true);
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, price: parseFloat(form.price), preparationMins: parseInt(form.preparationMins), stockQuantity: parseInt(form.stockQuantity) };
      if (editing) {
        await api.put(`/menu/items/${editing.id}`, data);
        toast.success('Item updated!');
      } else {
        await api.post('/menu/items', data);
        toast.success('Item created!');
      }
      setModal(false);
      fetchAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await api.delete(`/menu/items/${id}`);
    toast.success('Item deleted');
    fetchAll();
  };

  const toggleAvail = async (id: string, current: boolean) => {
    await api.patch(`/menu/items/${id}/toggle`);
    setItems(prev => prev.map(i => i.id === id ? { ...i, isAvailable: !current } : i));
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/menu/categories', { name: catName });
    toast.success('Category created');
    setCatName(''); setCatModal(false);
    fetchAll();
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-bold text-gray-900">Menu Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setCatModal(true)} className="btn-secondary text-sm flex items-center gap-2">
            <Plus size={15} /> Add Category
          </button>
          <button onClick={openAdd} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search menu items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Items table */}
      {loading ? <div className="skeleton h-80 rounded-2xl" /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Item</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Category</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Price</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Stock</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getDishImage(item)}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100 shadow-sm"
                          onError={e => { (e.target as HTMLImageElement).src = getDishImage(item); }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-400">{item.isVegetarian ? '🌿 Veg' : '🍖 Non-Veg'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{item.category?.name}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">₹{item.price}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-semibold ${item.stockQuantity < 10 ? 'text-red-600' : 'text-gray-700'}`}>{item.stockQuantity}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => toggleAvail(item.id, item.isAvailable)} className="transition-colors">
                        {item.isAvailable
                          ? <ToggleRight size={26} className="text-canteen-green" />
                          : <ToggleLeft size={26} className="text-gray-300" />}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-screen overflow-y-auto shadow-2xl animate-slide-up">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-5">{editing ? 'Edit Item' : 'Add New Item'}</h2>
            <form onSubmit={saveItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">Price (₹) *</label>
                  <input required type="number" min="1" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="input-field">
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Prep Time (mins)</label>
                  <input type="number" value={form.preparationMins} onChange={e => setForm({ ...form, preparationMins: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">Stock Quantity</label>
                  <input type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input-field resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="label">Image URL</label>
                  <div className="flex gap-2 items-center">
                    <input type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="input-field flex-1" />
                    {form.imageUrl && (
                      <img src={form.imageUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="label">Allergy Info</label>
                  <input value={form.allergyInfo} onChange={e => setForm({ ...form, allergyInfo: e.target.value })} placeholder="e.g. Contains nuts, gluten" className="input-field" />
                </div>
                <div className="flex items-center gap-3">
                  <input id="veg" type="checkbox" checked={form.isVegetarian} onChange={e => setForm({ ...form, isVegetarian: e.target.checked })} className="w-4 h-4 accent-canteen-green" />
                  <label htmlFor="veg" className="text-sm font-medium text-gray-700">Vegetarian</label>
                </div>
                <div className="flex items-center gap-3">
                  <input id="avail" type="checkbox" checked={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.checked })} className="w-4 h-4 accent-canteen-green" />
                  <label htmlFor="avail" className="text-sm font-medium text-gray-700">Available</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <Loader size={15} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Add Category</h2>
            <form onSubmit={addCategory} className="space-y-4">
              <input required value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Snacks" className="input-field" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setCatModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
