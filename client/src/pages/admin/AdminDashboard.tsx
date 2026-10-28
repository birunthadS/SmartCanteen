import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, ShoppingBag, IndianRupee, Clock, AlertTriangle, Download, UserCheck } from 'lucide-react';

interface Analytics {
  totalOrders: number; revenue: number; todayOrders: number;
  pendingOrders: number; avgOrderValue: number;
  statusBreakdown: { status: string; _count: number }[];
  paymentMethods: { method: string; _count: number; _sum: { amount: number } }[];
  dailySales: { date: string; revenue: number; orders: number }[];
  popularItems: { name: string; _sum: { quantity: number } }[];
  lowStock: { id: string; name: string; stockQuantity: number; category: { name: string } }[];
}

const STATUS_COLORS: Record<string, string> = {
  PLACED: '#3b82f6', CONFIRMED: '#6366f1', PREPARING: '#f59e0b',
  READY: '#22c55e', COMPLETED: '#6b7280', CANCELLED: '#ef4444',
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(res => { if (res.data.success) setAnalytics(res.data.analytics); })
      .finally(() => setLoading(false));
    api.get('/admin/account-requests', { params: { status: 'PENDING' } })
      .then(res => { if (res.data.success) setPendingRequests(res.data.requests.length); })
      .catch(() => {});
  }, []);

  const downloadCSV = () => {
    window.open('/api/admin/analytics/csv', '_blank');
  };

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-8 w-64 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    </div>
  );

  const stats = [
    { label: 'Total Revenue', value: `₹${(analytics?.revenue || 0).toFixed(2)}`, icon: <IndianRupee size={22} />, color: 'from-canteen-green to-canteen-green-light', sub: 'From paid orders' },
    { label: "Today's Orders", value: analytics?.todayOrders || 0, icon: <ShoppingBag size={22} />, color: 'from-blue-500 to-blue-600', sub: 'Scheduled today' },
    { label: 'Avg Order Value', value: `₹${(analytics?.avgOrderValue || 0).toFixed(2)}`, icon: <TrendingUp size={22} />, color: 'from-amber-500 to-amber-600', sub: 'Per order' },
    { label: 'Pending Orders', value: analytics?.pendingOrders || 0, icon: <Clock size={22} />, color: 'from-purple-500 to-purple-600', sub: 'Awaiting action' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Smart Canteen Analytics & Overview</p>
        </div>
        <button onClick={downloadCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Pending account requests alert */}
      {pendingRequests > 0 && (
        <Link to="/admin/account-requests" className="block mb-6">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100 transition-colors cursor-pointer">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <UserCheck size={18} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">
                {pendingRequests} account request{pendingRequests !== 1 ? 's' : ''} awaiting approval
              </p>
              <p className="text-amber-600 text-xs">Click to review and approve or reject</p>
            </div>
            <span className="text-amber-600 text-sm font-medium">Review →</span>
          </div>
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">{s.icon}</div>
            <div className="font-display text-2xl font-bold mb-0.5">{s.value}</div>
            <div className="text-white/80 text-sm font-medium">{s.label}</div>
            <div className="text-white/60 text-xs mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Sales */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-gray-900 mb-4">Last 7 Days — Revenue</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics?.dailySales}>
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`₹${v.toFixed(2)}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#1a6b3c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-gray-900 mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={analytics?.statusBreakdown} dataKey="_count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {analytics?.statusBreakdown.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular items + Low stock */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-display font-semibold text-gray-900 mb-4">🔥 Popular Items</h2>
          <div className="space-y-3">
            {analytics?.popularItems.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-sm font-bold text-amber-700">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{item.name}</div>
                  <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${Math.min(100, ((item._sum.quantity || 0) / (analytics.popularItems[0]._sum.quantity || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">{item._sum.quantity} sold</span>
              </div>
            ))}
            {(!analytics?.popularItems || analytics.popularItems.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Low Stock Alerts
          </h2>
          {analytics?.lowStock.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">✅</div>
              All items are adequately stocked
            </div>
          ) : (
            <div className="space-y-2">
              {analytics?.lowStock.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.category.name}</div>
                  </div>
                  <span className="font-bold text-amber-600">{item.stockQuantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
