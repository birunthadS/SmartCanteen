import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, Download, Calendar } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<{
    dailySales: { date: string; revenue: number; orders: number }[];
    popularItems: { name: string; _sum: { quantity: number } }[];
    paymentMethods: { method: string; _count: number; _sum: { amount: number } }[];
    statusBreakdown: { status: string; _count: number }[];
    categoryRevenue: { category: string; revenue: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(res => { if (res.data.success) setAnalytics(res.data.analytics); })
      .finally(() => setLoading(false));
  }, []);

  const COLORS = ['#1a6b3c', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-8 w-48 rounded-xl" />
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 size={28} className="text-canteen-green" /> Analytics
        </h1>
        <button onClick={() => window.open('/api/admin/analytics/csv', '_blank')} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Revenue trend */}
      <div className="card p-6 mb-6">
        <h2 className="font-display font-semibold text-gray-900 mb-5">Revenue & Order Trend (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={analytics?.dailySales} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number, name: string) => [name === 'revenue' ? `₹${v.toFixed(2)}` : v, name === 'revenue' ? 'Revenue' : 'Orders']} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#1a6b3c" strokeWidth={3} dot={{ fill: '#1a6b3c', r: 5 }} name="Revenue (₹)" />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#f59e0b', r: 4 }} name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Popular items */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-gray-900 mb-5">Top 10 Popular Items</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics?.popularItems.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v: number) => [v, 'Qty Sold']} />
              <Bar dataKey="_sum.quantity" fill="#1a6b3c" radius={[0, 6, 6, 0]} name="Qty Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment methods */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-gray-900 mb-5">Payment Methods</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={analytics?.paymentMethods} dataKey="_count" nameKey="method" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {analytics?.paymentMethods.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {analytics?.paymentMethods.map((pm, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-gray-600">{pm.method}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{pm._count} orders</span>
                  <span className="text-gray-400 ml-2">· ₹{(pm._sum.amount || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily orders bar */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-5">Daily Order Volume</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={analytics?.dailySales}>
            <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip formatter={(v: number) => [v, 'Orders']} />
            <Bar dataKey="orders" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
