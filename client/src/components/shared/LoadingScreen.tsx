import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-canteen-cream flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 bg-canteen-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-green">
          <UtensilsCrossed size={28} className="text-white" />
        </div>
        <div className="spinner mx-auto mb-3" />
        <p className="text-gray-500 text-sm font-medium">Loading Smart Canteen...</p>
      </div>
    </div>
  );
}
