import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const queueRouter = Router();

queueRouter.use(authenticate);

// GET /api/queue?date=YYYY-MM-DD
queueRouter.get('/', authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);

    const orders = await prisma.order.findMany({
      where: { scheduledDate: date, status: { notIn: ['CANCELLED', 'COMPLETED'] } },
      include: {
        token: true,
        user: { select: { name: true, phone: true } },
        items: { include: { menuItem: { select: { name: true } } } },
        pickupSlot: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Attach position
    const withPosition = orders.map((o, idx) => ({ ...o, queuePosition: idx + 1 }));
    res.json({ success: true, queue: withPosition, date });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch queue' });
  }
});

// GET /api/queue/my-token/:orderId
queueRouter.get('/my-token/:orderId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { token: true, pickupSlot: true, items: true },
    });
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    if (order.userId !== req.user!.id && !['STAFF', 'ADMIN'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Access denied' }); return;
    }

    // Calculate queue position among active orders for that date
    const ahead = await prisma.order.count({
      where: {
        scheduledDate: order.scheduledDate,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        createdAt: { lt: order.createdAt },
      },
    });

    res.json({ success: true, token: order.token, order, queuePosition: ahead + 1 });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch token info' });
  }
});

// POST /api/queue/call-next
queueRouter.post('/call-next', authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const date = (req.body.date as string) || new Date().toISOString().slice(0, 10);

    const nextOrder = await prisma.order.findFirst({
      where: { scheduledDate: date, status: 'CONFIRMED' },
      include: { token: true, user: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    if (!nextOrder) {
      res.json({ success: true, message: 'No more orders in queue', order: null });
      return;
    }

    await prisma.$transaction([
      prisma.order.update({ where: { id: nextOrder.id }, data: { status: 'PREPARING' } }),
      prisma.orderStatusHistory.create({ data: { orderId: nextOrder.id, status: 'PREPARING', note: 'Called by staff' } }),
      ...(nextOrder.token ? [prisma.queueToken.update({ where: { id: nextOrder.token.id }, data: { calledAt: new Date() } })] : []),
    ]);

    res.json({ success: true, order: nextOrder });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to call next order' });
  }
});
