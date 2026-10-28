import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const reviewRouter = Router();

reviewRouter.use(authenticate);

// POST /api/reviews
reviewRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, rating, comment } = z.object({
      orderId: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(500).optional(),
    }).parse(req.body);

    // Check order belongs to user and is completed
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { review: true } });
    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    if (order.userId !== req.user!.id) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
    if (order.status !== 'COMPLETED') { res.status(400).json({ success: false, message: 'Can only review completed orders' }); return; }
    if (order.review) { res.status(409).json({ success: false, message: 'Review already submitted for this order' }); return; }

    const review = await prisma.review.create({
      data: { orderId, userId: req.user!.id, rating, comment },
    });
    res.status(201).json({ success: true, review });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ success: false, message: 'Validation error', errors: err.errors }); return; }
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
});

// GET /api/reviews?menuItemId=
reviewRouter.get('/', async (req, res: Response): Promise<void> => {
  try {
    const { menuItemId, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = { isHidden: false };
    if (menuItemId) {
      where.order = { items: { some: { menuItemId: menuItemId as string } } };
    }

    const [reviews, total, avgData] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { user: { select: { name: true } }, order: { select: { orderNumber: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({ where, _avg: { rating: true } }),
    ]);

    res.json({ success: true, reviews, total, avgRating: avgData._avg.rating });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// PATCH /api/reviews/:id/moderate  (admin toggle hide)
reviewRouter.patch('/:id/moderate', authorize('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isHidden } = z.object({ isHidden: z.boolean() }).parse(req.body);
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isHidden, moderatedAt: new Date() },
    });
    res.json({ success: true, review });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to moderate review' });
  }
});

// GET /api/reviews/admin (admin - all including hidden, with rating filter)
reviewRouter.get('/admin', authorize('ADMIN'), async (req, res: Response): Promise<void> => {
  try {
    const { rating, limit = '100' } = req.query;
    const where: Record<string, unknown> = {};
    if (rating) where.rating = parseInt(rating as string);

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        order: { select: { orderNumber: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });
    res.json({ success: true, reviews: reviews.map(r => ({ ...r, isVisible: !r.isHidden })) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// PATCH /api/reviews/:id/visibility (toggle visibility)
reviewRouter.patch('/:id/visibility', authorize('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, message: 'Review not found' }); return; }
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isHidden: !existing.isHidden, moderatedAt: new Date() },
    });
    res.json({ success: true, review });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to toggle review visibility' });
  }
});

// DELETE /api/reviews/:id (admin delete)
reviewRouter.delete('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Review deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
});

// GET /api/reviews/all (admin - all including hidden)
reviewRouter.get('/all', authorize('ADMIN'), async (_req, res: Response): Promise<void> => {
  try {
    const reviews = await prisma.review.findMany({
      include: { user: { select: { name: true, email: true } }, order: { select: { orderNumber: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, reviews });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

