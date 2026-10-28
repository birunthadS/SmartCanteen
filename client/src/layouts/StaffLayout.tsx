import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UtensilsCrossed, LayoutDashboard, List, Package, LogOut, Menu, X, ChefHat } from 'lucide-react';

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/staff', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
    { to: '/staff/queue', label: 'Live Queue', icon: <List size={18} /> },
    { to: '/staff/inventory', label: 'Stock View', icon: <Package size={18} /> },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-green-700">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <ChefHat size={20} className="text-white" />
        </div>
        <div>
          <div className="font-display font-bold text-white text-sm">Smart Canteen</div>
          <div className="text-green-200 text-xs">Staff Portal</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link-inactive'}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 pb-6 border-t border-green-700 pt-4">
        <div className="px-4 py-3 bg-white/10 rounded-xl mb-3">
          <div className="text-white font-semibold text-sm">{user?.name}</div>
          <div className="text-green-200 text-xs">Staff Member</div>
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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-canteen-green fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Sidebar (mobile drawer) */}
      {sidebarOpen && (
        <aside className="fixed flex flex-col w-64 bg-canteen-green h-full z-50 animate-slide-up md:hidden">
          <SidebarContent />
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Mobile topbar */}
        <div className="md:hidden bg-canteen-green h-14 flex items-center px-4 gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu size={22} />
          </button>
          <span className="font-display font-bold text-white">Staff Portal</span>
        </div>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
