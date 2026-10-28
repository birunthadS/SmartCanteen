import React from 'react';
import { OrderStatus } from '../../types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  PLACED: { label: 'Placed', className: 'bg-blue-100 text-blue-800' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-indigo-100 text-indigo-800' },
  PREPARING: { label: 'Preparing', className: 'bg-amber-100 text-amber-800' },
  READY: { label: 'Ready for Pickup', className: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Completed', className: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
