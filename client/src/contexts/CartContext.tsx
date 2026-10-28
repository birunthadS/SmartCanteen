import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '../lib/api';
import { CartItem } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (menuItemId: string, quantity?: number) => Promise<void>;
  updateQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  removeItem: (menuItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) {
        setItems(res.data.items);
        setSubtotal(res.data.subtotal);
        setTax(res.data.tax);
        setTotal(res.data.total);
      }
    } catch {
      // silent - user may not be logged in
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToCart = async (menuItemId: string, quantity = 1) => {
    try {
      await api.post('/cart', { menuItemId, quantity });
      toast.success('Added to cart!');
      fetchCart();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not add to cart';
      toast.error(msg);
    }
  };

  const updateQuantity = async (menuItemId: string, quantity: number) => {
    try {
      await api.put(`/cart/${menuItemId}`, { quantity });
      fetchCart();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not update cart';
      toast.error(msg);
    }
  };

  const removeItem = async (menuItemId: string) => {
    try {
      await api.delete(`/cart/${menuItemId}`);
      toast.success('Item removed');
      fetchCart();
    } catch {
      toast.error('Could not remove item');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setItems([]);
      setSubtotal(0);
      setTax(0);
      setTotal(0);
    } catch {
      // silent
    }
  };

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, subtotal, tax, total, itemCount, isLoading, fetchCart, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
