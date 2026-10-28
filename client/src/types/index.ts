// Shared TypeScript types for the Smart Canteen application

export type UserRole = 'STUDENT' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { menuItems: number };
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  categoryId: string;
  category?: MenuCategory;
  isVegetarian: boolean;
  isAvailable: boolean;
  stockQuantity: number;
  preparationMins: number;
  allergyInfo?: string | null;
  sortOrder: number;
  avgRating?: number | null;
}

export interface CartItem {
  id: string;
  userId: string;
  menuItemId: string;
  quantity: number;
  menuItem: MenuItem;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface PickupSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  isActive: boolean;
  booked?: number;
  remaining?: number;
  isFull?: boolean;
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  menuItem?: { imageUrl?: string | null };
}

export interface QueueToken {
  id: string;
  orderId: string;
  tokenNumber: number;
  scope: string;
  isActive: boolean;
  calledAt?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  userId: string;
  rating: number;
  comment?: string | null;
  isHidden: boolean;
  createdAt: string;
  user?: { name: string };
  order?: { orderNumber: string; createdAt: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  pickupSlotId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string | null;
  scheduledDate: string;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; email: string; phone?: string | null };
  items: OrderItem[];
  pickupSlot: PickupSlot;
  token?: QueueToken | null;
  payment?: Payment | null;
  statusHistory?: OrderStatusHistory[];
  review?: Review | null;
}

export interface Notification {
  id: string;
  userId: string;
  orderId?: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface InventoryTransaction {
  id: string;
  menuItemId: string;
  quantity: number;
  reason: string;
  note?: string | null;
  createdAt: string;
  menuItem?: { name: string };
}
