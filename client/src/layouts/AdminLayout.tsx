import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  UtensilsCrossed, LayoutDashboard, ChefHat, Package,
  ClipboardList, Users, Star, BarChart3, LogOut, Menu, Shield, UserCheck
} from 'lucide-react';
import api from '../lib/api';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    api.get('/admin/account-requests', { params: { status: 'PENDING' } })
      .then(r => { if (r.data.success) setPendingRequests(r.data.requests.length); })
      .catch(() => {});
  }, []);

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
    { to: '/admin/menu', label: 'Menu Management', icon: <ChefHat size={18} /> },
    { to: '/admin/inventory', label: 'Inventory', icon: <Package size={18} /> },
    { to: '/admin/orders', label: 'Orders', icon: <ClipboardList size={18} /> },
    { to: '/admin/users', label: 'Users', icon: <Users size={18} /> },
    { to: '/admin/account-requests', label: 'Account Requests', icon: <UserCheck size={18} />, badge: pendingRequests },
    { to: '/admin/feedback', label: 'Feedback', icon: <Star size={18} /> },
    { to: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  ];

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-6 border-b border-green-700">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <div className="font-display font-bold text-white text-sm">Smart Canteen</div>
          <div className="text-green-200 text-xs">Admin Panel</div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link-inactive'}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {'badge' in item && (item.badge ?? 0) > 0 && (
              <span className="ml-auto text-xs bg-amber-400 text-amber-900 font-bold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-6 border-t border-green-700 pt-4">
        <div className="px-4 py-3 bg-white/10 rounded-xl mb-3">
          <div className="text-white font-semibold text-sm">{user?.name}</div>
          <div className="text-green-200 text-xs">Administrator</div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-green-200 hover:text-white text-sm px-4 py-2 rounded-xl hover:bg-white/10 transition-all w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className="hidden md:flex flex-col w-64 bg-canteen-green fixed h-full z-30">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <aside className="fixed flex flex-col w-64 bg-canteen-green h-full z-50 md:hidden">
          <SidebarContent />
        </aside>
      )}

      <div className="flex-1 md:ml-64 flex flex-col">
        <div className="md:hidden bg-canteen-green h-14 flex items-center px-4 gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu size={22} />
          </button>
          <span className="font-display font-bold text-white">Admin Panel</span>
        </div>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
