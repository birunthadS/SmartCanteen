import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { broadcastNewOrder } from './sse';

export const orderRouter = Router();

orderRouter.use(authenticate);

const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.05');

const VALID_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

function generateOrderNumber(): string {
  const date = new Date();
  const d = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `CAN-${d}-${rand}`;
}

async function allocateToken(
  tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  orderId: string,
  scope: string
) {
  const maxToken = await tx.queueToken.findFirst({
    where: { scope },
    orderBy: { tokenNumber: 'desc' },
  });
  const tokenNumber = (maxToken?.tokenNumber ?? 0) + 1;
  return tx.queueToken.create({ data: { orderId, tokenNumber, scope } });
}

// POST /api/orders/checkout
orderRouter.post('/checkout', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pickupSlotId, scheduledDate, paymentMethod, notes } = z.object({
      pickupSlotId: z.string().uuid(),
      scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      paymentMethod: z.enum(['CASH', 'ONLINE']).default('CASH'),
      notes: z.string().optional(),
    }).parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get cart items
      const cartItems = await tx.cartItem.findMany({
        where: { userId: req.user!.id },
        include: { menuItem: true },
      });
      if (cartItems.length === 0) throw new Error('Cart is empty');

      // 2. Validate pickup slot capacity
      const slot = await tx.pickupSlot.findUnique({ where: { id: pickupSlotId } });
      if (!slot || !slot.isActive) throw new Error('Invalid pickup slot');

      const slotOrderCount = await tx.order.count({
        where: { pickupSlotId, scheduledDate, status: { notIn: ['CANCELLED'] } },
      });
      if (slotOrderCount >= slot.maxOrders) throw new Error('This pickup slot is full');

      // 3. Validate items and calculate server-side total
      let subtotal = 0;
      const orderItemsData = [];

      for (const cartItem of cartItems) {
        const item = await tx.menuItem.findUnique({ where: { id: cartItem.menuItemId } });
        if (!item || !item.isAvailable) throw new Error(`${cartItem.menuItem.name} is no longer available`);
        if (item.stockQuantity < cartItem.quantity) throw new Error(`Insufficient stock for ${item.name}`);

        subtotal += item.price * cartItem.quantity;
        orderItemsData.push({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: cartItem.quantity,
        });
      }

      const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
      const total = parseFloat((subtotal + tax).toFixed(2));

      // 4. Create order
      let orderNumber = generateOrderNumber();
      // ensure unique
      while (await tx.order.findUnique({ where: { orderNumber } })) {
        orderNumber = generateOrderNumber();
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          pickupSlotId,
          scheduledDate,
          paymentMethod,
          subtotal,
          tax,
          total,
          notes,
          status: 'PLACED',
          items: { create: orderItemsData },
          statusHistory: { create: { status: 'PLACED', note: 'Order placed by customer' } },
        },
        include: { items: true, pickupSlot: true },
      });

      // 5. Deduct inventory
      for (const cartItem of cartItems) {
        await tx.menuItem.update({
          where: { id: cartItem.menuItemId },
          data: { stockQuantity: { decrement: cartItem.quantity } },
        });
        await tx.inventoryTransaction.create({
          data: { menuItemId: cartItem.menuItemId, quantity: -cartItem.quantity, reason: 'ORDER', note: `Order ${orderNumber}` },
        });
      }

      // 6. Create payment record
      await tx.payment.create({
        data: { orderId: order.id, amount: total, method: paymentMethod, status: paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING', transactionRef: paymentMethod === 'ONLINE' ? `SIM-${uuidv4().slice(0, 8).toUpperCase()}` : null, paidAt: paymentMethod === 'ONLINE' ? new Date() : null },
      });

      // 7. Allocate queue token — must run inside tx so orderId FK resolves
      const token = await allocateToken(tx, order.id, scheduledDate);

      // 8. Clear cart
      await tx.cartItem.deleteMany({ where: { userId: req.user!.id } });

      // 9. Create notification for user
      await tx.notification.create({
        data: {
          userId: req.user!.id,
          orderId: order.id,
          type: 'ORDER_PLACED',
          title: 'Order Placed! 🎉',
          message: `Your order #${orderNumber} has been placed. Token: ${token.tokenNumber}`,
        },
      });

      // 10. Notify all staff
      const staffUsers = await tx.user.findMany({ where: { role: { in: ['STAFF', 'ADMIN'] }, isActive: true }, select: { id: true } });
      await tx.notification.createMany({
        data: staffUsers.map(s => ({
          userId: s.id,
          orderId: order.id,
          type: 'NEW_ORDER',
          title: 'New Order Received',
          message: `Order #${orderNumber} placed. Token: ${token.tokenNumber}`,
        })),
      });

      return { order, token };
    });

    // Broadcast SSE for staff
    broadcastNewOrder(result.order.id);

    res.status(201).json({ success: true, order: result.order, token: result.token });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Checkout failed';
    const isValidation = err instanceof z.ZodError;
    res.status(isValidation ? 400 : 500).json({ success: false, message: isValidation ? 'Validation error' : msg, ...(isValidation && { errors: (err as z.ZodError).errors }) });
  }
});

// GET /api/orders
orderRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isStaffOrAdmin = ['STAFF', 'ADMIN'].includes(req.user!.role);
    const { status, date, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};
    if (!isStaffOrAdmin) where.userId = req.user!.id;
    if (status) where.status = status;
    if (date) where.scheduledDate = date;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, pickupSlot: true, token: true, payment: true, user: { select: { name: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, orders, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
orderRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { menuItem: { select: { imageUrl: true } } } }, pickupSlot: true, token: true, payment: true, statusHistory: { orderBy: { createdAt: 'asc' } }, user: { select: { name: true, email: true, phone: true } }, review: true },
    });
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }

    const isOwner = order.userId === req.user!.id;
    const isStaff = ['STAFF', 'ADMIN'].includes(req.user!.role);
    if (!isOwner && !isStaff) { res.status(403).json({ success: false, message: 'Access denied' }); return; }

    res.json({ success: true, order });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// GET /api/orders/number/:orderNumber
orderRouter.get('/number/:orderNumber', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { items: true, pickupSlot: true, token: true, payment: true, statusHistory: { orderBy: { createdAt: 'asc' } }, user: { select: { name: true } } },
    });
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    const isOwner = order.userId === req.user!.id;
    const isStaff = ['STAFF', 'ADMIN'].includes(req.user!.role);
    if (!isOwner && !isStaff) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
    res.json({ success: true, order });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// PATCH /api/orders/:id/status
orderRouter.patch('/:id/status', authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, note } = z.object({
      status: z.string(),
      note: z.string().optional(),
    }).parse(req.body);

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, message: `Cannot transition from ${order.status} to ${status}` });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.order.update({
        where: { id: req.params.id },
        data: { status },
        include: { token: true },
      });
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status, note } });

      // Restore stock on cancel
      if (status === 'CANCELLED') {
        const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
        for (const item of items) {
          await tx.menuItem.update({ where: { id: item.menuItemId }, data: { stockQuantity: { increment: item.quantity }, isAvailable: true } });
          await tx.inventoryTransaction.create({ data: { menuItemId: item.menuItemId, quantity: item.quantity, reason: 'CANCEL', note: `Cancelled order ${order.orderNumber}` } });
        }
        // Refund if online payment
        const payment = await tx.payment.findUnique({ where: { orderId: order.id } });
        if (payment && payment.method === 'ONLINE' && payment.status === 'PAID') {
          await tx.payment.update({ where: { orderId: order.id }, data: { status: 'REFUNDED', refundedAt: new Date() } });
          await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'REFUNDED' } });
        }
      }

      // Notify customer
      const notifMap: Record<string, { type: string; title: string; msg: string }> = {
        CONFIRMED: { type: 'ORDER_CONFIRMED', title: 'Order Confirmed ✅', msg: `Your order #${order.orderNumber} has been confirmed!` },
        PREPARING: { type: 'PREPARING', title: 'Being Prepared 👨‍🍳', msg: `Your order #${order.orderNumber} is now being prepared.` },
        READY: { type: 'READY', title: 'Ready for Pickup! 🔔', msg: `Your order #${order.orderNumber} is ready! Please collect.` },
        COMPLETED: { type: 'COMPLETED', title: 'Order Completed 🎉', msg: `Thank you! Order #${order.orderNumber} completed.` },
        CANCELLED: { type: 'CANCELLED', title: 'Order Cancelled', msg: `Order #${order.orderNumber} has been cancelled.` },
      };
      const notif = notifMap[status];
      if (notif) {
        await tx.notification.create({ data: { userId: order.userId, orderId: order.id, type: notif.type, title: notif.title, message: notif.msg } });
      }
      return upd;
    });

    res.json({ success: true, order: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Status update failed';
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /api/orders/:id/cancel (customer self-cancel for PLACED orders only)
orderRouter.post('/:id/cancel', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    if (order.userId !== req.user!.id) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
    if (!['PLACED', 'CONFIRMED'].includes(order.status)) {
      res.status(400).json({ success: false, message: 'Cannot cancel order at this stage' }); return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED', cancelReason: req.body.reason || 'Customer cancelled' } });
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: 'CANCELLED', note: 'Cancelled by customer' } });
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        await tx.menuItem.update({ where: { id: item.menuItemId }, data: { stockQuantity: { increment: item.quantity }, isAvailable: true } });
        await tx.inventoryTransaction.create({ data: { menuItemId: item.menuItemId, quantity: item.quantity, reason: 'CANCEL', note: `Customer cancelled order ${order.orderNumber}` } });
      }
      const payment = await tx.payment.findUnique({ where: { orderId: order.id } });
      if (payment && payment.method === 'ONLINE' && payment.status === 'PAID') {
        await tx.payment.update({ where: { orderId: order.id }, data: { status: 'REFUNDED', refundedAt: new Date() } });
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'REFUNDED' } });
      }
      await tx.notification.create({ data: { userId: order.userId, orderId: order.id, type: 'CANCELLED', title: 'Order Cancelled', message: `Order #${order.orderNumber} cancelled.` } });
    });

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
});
