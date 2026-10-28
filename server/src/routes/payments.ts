import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const paymentRouter = Router();

paymentRouter.use(authenticate);

// GET /api/payments/receipt/:orderId
paymentRouter.get('/receipt/:orderId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        items: true,
        payment: true,
        user: { select: { name: true, email: true } },
        pickupSlot: true,
      },
    });
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    if (order.userId !== req.user!.id && !['STAFF', 'ADMIN'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Access denied' }); return;
    }
    res.json({ success: true, receipt: order });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch receipt' });
  }
});

// PATCH /api/payments/:orderId/cash-collected  (staff marks cash as received)
paymentRouter.patch('/:orderId/cash-collected', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!['STAFF', 'ADMIN'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' }); return;
    }
    const payment = await prisma.payment.findUnique({ where: { orderId: req.params.orderId } });
    if (!payment) { res.status(404).json({ success: false, message: 'Payment not found' }); return; }
    if (payment.status !== 'PENDING') { res.status(400).json({ success: false, message: 'Payment already processed' }); return; }

    await prisma.$transaction([
      prisma.payment.update({ where: { orderId: req.params.orderId }, data: { status: 'PAID', paidAt: new Date() } }),
      prisma.order.update({ where: { id: req.params.orderId }, data: { paymentStatus: 'PAID' } }),
    ]);
    res.json({ success: true, message: 'Cash payment recorded' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update payment' });
  }
});
