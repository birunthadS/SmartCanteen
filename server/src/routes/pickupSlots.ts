import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const pickupSlotRouter = Router();

// GET /api/pickup-slots
pickupSlotRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(req.query);

    const slots = await prisma.pickupSlot.findMany({
      where: { isActive: true },
      orderBy: { startTime: 'asc' },
    });

    // Enrich with remaining capacity
    const enriched = await Promise.all(slots.map(async (slot) => {
      const booked = await prisma.order.count({
        where: { pickupSlotId: slot.id, scheduledDate: date, status: { notIn: ['CANCELLED'] } },
      });
      return { ...slot, booked, remaining: slot.maxOrders - booked, isFull: booked >= slot.maxOrders };
    }));

    res.json({ success: true, slots: enriched });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ success: false, message: 'Please provide a valid date' }); return; }
    res.status(500).json({ success: false, message: 'Failed to fetch pickup slots' });
  }
});

// GET /api/pickup-slots/all (admin)
pickupSlotRouter.get('/all', authenticate, authorize('ADMIN'), async (_req, res: Response): Promise<void> => {
  try {
    const slots = await prisma.pickupSlot.findMany({ orderBy: { startTime: 'asc' } });
    res.json({ success: true, slots });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch slots' });
  }
});

// POST /api/pickup-slots (admin)
pickupSlotRouter.post('/', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = z.object({
      label: z.string().min(1),
      startTime: z.string(),
      endTime: z.string(),
      maxOrders: z.number().int().min(1).default(10),
      dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
      isActive: z.boolean().default(true),
    }).parse(req.body);
    const slot = await prisma.pickupSlot.create({ data });
    res.status(201).json({ success: true, slot });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ success: false, message: 'Validation error', errors: err.errors }); return; }
    res.status(500).json({ success: false, message: 'Failed to create slot' });
  }
});

// PUT /api/pickup-slots/:id (admin)
pickupSlotRouter.put('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = z.object({
      label: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      maxOrders: z.number().int().min(1).optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);
    const slot = await prisma.pickupSlot.update({ where: { id: req.params.id }, data });
    res.json({ success: true, slot });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update slot' });
  }
});
