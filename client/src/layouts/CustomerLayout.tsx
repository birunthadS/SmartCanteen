import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import {
  UtensilsCrossed, ShoppingCart, Bell, User,
  LogOut, Menu, X, Home, ClipboardList, ChefHat
} from 'lucide-react';
import { useState } from 'react';
import api from '../lib/api';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { itemCount, fetchCart } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchCart();
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data.success) setUnreadCount(res.data.count);
    } catch { /* silent */ }
  };

  const navItems = [
    { to: '/menu', label: 'Menu', icon: <ChefHat size={18} /> },
    { to: '/cart', label: 'Cart', icon: <ShoppingCart size={18} />, badge: itemCount },
    { to: '/orders', label: 'My Orders', icon: <ClipboardList size={18} /> },
    { to: '/notifications', label: 'Alerts', icon: <Bell size={18} />, badge: unreadCount },
    { to: '/profile', label: 'Profile', icon: <User size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-canteen-cream">
      {/* Top Navbar */}
      <nav className="bg-canteen-green shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/menu" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <UtensilsCrossed size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-white text-lg hidden sm:block">Smart Canteen</span>
            </NavLink>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                      isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-white/80 text-sm">
                Hi, <span className="font-semibold text-white">{user?.name?.split(' ')[0]}</span>
              </div>
              <button
                onClick={logout}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white text-sm transition-all"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-canteen-green-dark border-t border-white/10 px-4 pb-4 pt-2 animate-fade-in">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-1 relative ${
                    isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.icon}
                {item.label}
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white w-full mt-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
