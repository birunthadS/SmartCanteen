import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const cartRouter = Router();

cartRouter.use(authenticate);

// GET /api/cart
cartRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      include: { menuItem: { include: { category: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const subtotal = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
    const tax = subtotal * (parseFloat(process.env.TAX_RATE || '0.05'));
    const total = subtotal + tax;
    res.json({ success: true, items, subtotal, tax, total });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
});

// POST /api/cart
cartRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { menuItemId, quantity } = z.object({
      menuItemId: z.string().uuid(),
      quantity: z.number().int().min(1).max(20),
    }).parse(req.body);

    const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!menuItem || !menuItem.isAvailable) {
      res.status(400).json({ success: false, message: 'Item not available' });
      return;
    }
    if (menuItem.stockQuantity < quantity) {
      res.status(400).json({ success: false, message: `Only ${menuItem.stockQuantity} in stock` });
      return;
    }

    const existing = await prisma.cartItem.findUnique({
      where: { userId_menuItemId: { userId: req.user!.id, menuItemId } },
    });

    let cartItem;
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (menuItem.stockQuantity < newQty) {
        res.status(400).json({ success: false, message: `Only ${menuItem.stockQuantity} in stock` });
        return;
      }
      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
        include: { menuItem: { include: { category: true } } },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: { userId: req.user!.id, menuItemId, quantity },
        include: { menuItem: { include: { category: true } } },
      });
    }
    res.status(201).json({ success: true, cartItem });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ success: false, message: 'Validation error', errors: err.errors }); return; }
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

// PUT /api/cart/:menuItemId
cartRouter.put('/:menuItemId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quantity } = z.object({ quantity: z.number().int().min(0).max(20) }).parse(req.body);

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: req.user!.id, menuItemId: req.params.menuItemId },
      });
      res.json({ success: true, message: 'Item removed' });
      return;
    }

    const menuItem = await prisma.menuItem.findUnique({ where: { id: req.params.menuItemId } });
    if (!menuItem) { res.status(404).json({ success: false, message: 'Item not found' }); return; }
    if (menuItem.stockQuantity < quantity) {
      res.status(400).json({ success: false, message: `Only ${menuItem.stockQuantity} in stock` });
      return;
    }

    const cartItem = await prisma.cartItem.updateMany({
      where: { userId: req.user!.id, menuItemId: req.params.menuItemId },
      data: { quantity },
    });
    res.json({ success: true, cartItem });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ success: false, message: 'Validation error', errors: err.errors }); return; }
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
});

// DELETE /api/cart/:menuItemId
cartRouter.delete('/:menuItemId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user!.id, menuItemId: req.params.menuItemId },
    });
    res.json({ success: true, message: 'Item removed from cart' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

// DELETE /api/cart
cartRouter.delete('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user!.id } });
    res.json({ success: true, message: 'Cart cleared' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});
