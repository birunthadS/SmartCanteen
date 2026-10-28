import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const menuRouter = Router();

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const menuItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().optional().or(z.literal('')),
  categoryId: z.string().uuid(),
  isVegetarian: z.boolean().optional().default(false),
  isAvailable: z.boolean().optional().default(true),
  stockQuantity: z.number().int().min(0).optional().default(100),
  preparationMins: z.number().int().min(1).optional().default(10),
  allergyInfo: z.string().optional(),
  sortOrder: z.number().int().optional().default(0),
});

// ── Categories ────────────────────────────────────────────────────────────────

// GET /api/menu/categories
menuRouter.get('/categories', async (_req, res: Response): Promise<void> => {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { menuItems: { where: { isAvailable: true } } } } },
    });
    res.json({ success: true, categories });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// GET /api/menu/categories/all (admin)
menuRouter.get('/categories/all', authenticate, authorize('ADMIN'), async (_req, res: Response): Promise<void> => {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { menuItems: true } } },
    });
    res.json({ success: true, categories });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// POST /api/menu/categories
menuRouter.post('/categories', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.menuCategory.create({ data });
    res.status(201).json({ success: true, category });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ success: false, message: 'Validation error', errors: err.errors }); return; }
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

// PUT /api/menu/categories/:id
menuRouter.put('/categories/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const category = await prisma.menuCategory.update({ where: { id: req.params.id }, data });
    res.json({ success: true, category });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ success: false, message: 'Validation error', errors: err.errors }); return; }
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

// DELETE /api/menu/categories/:id
menuRouter.delete('/categories/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await prisma.menuItem.count({ where: { categoryId: req.params.id } });
    if (count > 0) { res.status(400).json({ success: false, message: 'Cannot delete category with existing items' }); return; }
    await prisma.menuCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Category deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

// ── Menu Items ────────────────────────────────────────────────────────────────

// GET /api/menu/items
menuRouter.get('/items', async (req, res: Response): Promise<void> => {
  try {
    const { category, search, veg } = req.query;
    const where: Record<string, unknown> = { isAvailable: true };

    if (category && category !== 'all') {
      const cat = await prisma.menuCategory.findFirst({ where: { name: { equals: category as string } } });
      if (cat) where.categoryId = cat.id;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }
    if (veg === 'true') where.isVegetarian = true;

    const items = await prisma.menuItem.findMany({
      where,
      include: { category: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, items });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
  }
});

// GET /api/menu/items/all (admin)
menuRouter.get('/items/all', authenticate, authorize('ADMIN', 'STAFF'), async (_req, res: Response): Promise<void> => {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
    res.json({ success: true, items });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
  }
});

// GET /api/menu/items/:id
menuRouter.get('/items/:id', async (req, res: Response): Promise<void> => {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
      },
    });
    if (!item) { res.status(404).json({ success: false, message: 'Item not found' }); return; }

    // Compute avg rating for this item via orders
    const avgRating = await prisma.review.aggregate({
      _avg: { rating: true },
      where: {
        isHidden: false,
        order: { items: { some: { menuItemId: req.params.id } } },
      },
    });

    // Fetch recent visible reviews for orders containing this item
    const reviews = await prisma.review.findMany({
      where: {
        isHidden: false,
        order: { items: { some: { menuItemId: req.params.id } } },
      },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({ success: true, item: { ...item, avgRating: avgRating._avg.rating, reviews } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch item' });
  }
});

// POST /api/menu/items
menuRouter.post('/items', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = menuItemSchema.parse(req.body);
    const item = await prisma.menuItem.create({ data, include: { category: true } });
    res.status(201).json({ success: true, item });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ success: false, message: 'Validation error', errors: err.errors }); return; }
    res.status(500).json({ success: false, message: 'Failed to create item' });
  }
});

// PUT /api/menu/items/:id
menuRouter.put('/items/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = menuItemSchema.partial().parse(req.body);
    const item = await prisma.menuItem.update({ where: { id: req.params.id }, data, include: { category: true } });
    res.json({ success: true, item });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ success: false, message: 'Validation error', errors: err.errors }); return; }
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
});

// DELETE /api/menu/items/:id
menuRouter.delete('/items/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.menuItem.update({ where: { id: req.params.id }, data: { isAvailable: false } });
    res.json({ success: true, message: 'Item deactivated' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to deactivate item' });
  }
});

// PATCH /api/menu/items/:id/toggle (toggle availability)
menuRouter.patch('/items/:id/toggle', authenticate, authorize('ADMIN', 'STAFF'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, message: 'Item not found' }); return; }
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { isAvailable: !existing.isAvailable },
      include: { category: true },
    });
    res.json({ success: true, item });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to toggle availability' });
  }
});

// POST /api/menu/items/:id/inventory (add or remove stock)
menuRouter.post('/items/:id/inventory', authenticate, authorize('ADMIN', 'STAFF'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, quantity, reason } = z.object({
      type: z.enum(['ADD', 'REMOVE']),
      quantity: z.number().int().positive(),
      reason: z.string().optional().default('MANUAL'),
    }).parse(req.body);

    const delta = type === 'ADD' ? quantity : -quantity;
    const item = await prisma.$transaction(async (tx) => {
      const current = await tx.menuItem.findUnique({ where: { id: req.params.id } });
      if (!current) throw new Error('Item not found');
      const newQty = current.stockQuantity + delta;
      if (newQty < 0) throw new Error('Insufficient stock');
      const updated = await tx.menuItem.update({
        where: { id: req.params.id },
        data: { stockQuantity: newQty, isAvailable: newQty > 0 },
        include: { category: true },
      });
      await tx.inventoryTransaction.create({
        data: { menuItemId: req.params.id, quantity: delta, reason },
      });
      return updated;
    });
    res.json({ success: true, item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Inventory update failed';
    res.status(400).json({ success: false, message: msg });
  }
});

// PATCH /api/menu/items/:id/stock
menuRouter.patch('/items/:id/stock', authenticate, authorize('ADMIN', 'STAFF'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quantity, reason, note } = z.object({
      quantity: z.number().int(),
      reason: z.string().optional().default('MANUAL'),
      note: z.string().optional(),
    }).parse(req.body);

    const item = await prisma.$transaction(async (tx) => {
      const current = await tx.menuItem.findUnique({ where: { id: req.params.id } });
      if (!current) throw new Error('Item not found');
      const newQty = current.stockQuantity + quantity;
      if (newQty < 0) throw new Error('Stock cannot be negative');

      const updated = await tx.menuItem.update({
        where: { id: req.params.id },
        data: { stockQuantity: newQty, isAvailable: newQty > 0 },
      });
      await tx.inventoryTransaction.create({
        data: { menuItemId: req.params.id, quantity, reason, note },
      });
      return updated;
    });
    res.json({ success: true, item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stock update failed';
    res.status(400).json({ success: false, message: msg });
  }
});

