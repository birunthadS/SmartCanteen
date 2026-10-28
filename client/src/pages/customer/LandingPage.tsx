import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Clock, ShoppingCart, Bell, Star, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const features = [
    { icon: <ShoppingCart size={22} className="text-canteen-green" />, title: 'Pre-Order Online', desc: 'Browse the menu and place your order in advance — no waiting at the counter.' },
    { icon: <Clock size={22} className="text-canteen-amber" />, title: 'Choose Pickup Slot', desc: 'Select a convenient pickup time and your food will be ready when you arrive.' },
    { icon: <Bell size={22} className="text-blue-500" />, title: 'Live Tracking', desc: 'Track your order status in real time and get notified when it\'s ready.' },
    { icon: <Star size={22} className="text-yellow-500" />, title: 'Rate & Review', desc: 'Share your feedback and help us serve you better every day.' },
  ];

  const steps = [
    { step: '01', title: 'Register & Login', desc: 'Create your account with your college email.' },
    { step: '02', title: 'Browse Menu', desc: 'Explore categories, see prices, and pick your favorites.' },
    { step: '03', title: 'Add to Cart', desc: 'Select items and quantities — the app handles the totals.' },
    { step: '04', title: 'Choose Pickup Time', desc: 'Select an available slot that fits your schedule.' },
    { step: '05', title: 'Pay & Confirm', desc: 'Pay online or choose cash at pickup. Get your token instantly.' },
    { step: '06', title: 'Collect & Enjoy', desc: 'Walk in, show your token, skip the queue!' },
  ];

  return (
    <div className="min-h-screen bg-canteen-cream">
      {/* Header */}
      <header className="bg-canteen-green shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl">Smart Canteen</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Login</Link>
            <Link to="/register" className="bg-white text-canteen-green text-sm font-bold px-4 py-2 rounded-xl hover:bg-green-50 transition-all">Register</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-amber-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle size={16} className="text-green-300" />
            Skip the Queue. Eat on Time.
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Smart Canteen<br />
            <span className="text-amber-400">Pre-Order System</span>
          </h1>
          <p className="text-green-100 text-lg mb-10 max-w-xl mx-auto">
            Order your favorite canteen meals in advance, track preparation in real time, and pick up without the wait.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all border border-white/30 flex items-center justify-center gap-2">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">Everything You Need</h2>
          <p className="text-gray-500 text-lg">A complete digital canteen experience for students and staff</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6 text-center hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {f.icon}
              </div>
              <h3 className="font-display font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500">Simple steps to get your food faster</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="w-12 h-12 bg-canteen-green rounded-2xl flex items-center justify-center shrink-0 shadow-green">
                  <span className="font-display font-bold text-white text-sm">{s.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-canteen-green text-center">
        <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to Skip the Queue?</h2>
        <p className="text-green-100 mb-8">Register today and place your first pre-order in minutes.</p>
        <Link to="/register" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg text-base">
          Create Free Account <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-canteen-green-dark text-green-300 text-center py-6 text-sm">
        <p>Smart Canteen Pre-Order & Queue Management System — Register No: U23CB491</p>
      </footer>
    </div>
  );
}
