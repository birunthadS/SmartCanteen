import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Users, Search, ShieldCheck, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserRecord { id: string; name: string; email: string; phone?: string; role: string; isActive: boolean; createdAt: string; _count: { orders: number } }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    const res = await api.get('/admin/users', { params });
    if (res.data.success) setUsers(res.data.users);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const toggleActive = async (id: string, current: boolean) => {
    await api.patch(`/admin/users/${id}/toggle`);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !current } : u));
    toast.success(current ? 'User deactivated' : 'User activated');
  };

  const changeRole = async (id: string, role: string) => {
    await api.patch(`/admin/users/${id}/role`, { role });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    toast.success('Role updated');
  };

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Users size={28} className="text-canteen-green" /> User Management
      </h1>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search name / email..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 text-sm py-2" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field text-sm py-2">
          <option value="">All Roles</option>
          <option value="STUDENT">Students</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {loading ? <div className="skeleton h-80 rounded-2xl" /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">User</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Contact</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Orders</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-canteen-green/10 rounded-lg flex items-center justify-center text-canteen-green font-bold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <div className="text-gray-600">{u.email}</div>
                      <div className="text-xs text-gray-400">{u.phone || '—'}</div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <select
                        value={u.role}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="STAFF">STAFF</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-center hidden sm:table-cell">
                      <span className="font-semibold text-gray-700">{u._count.orders}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => toggleActive(u.id, u.isActive)}
                        className={`p-1.5 transition-colors ${u.isActive ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-green-500'}`}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {u.isActive ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
            {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
