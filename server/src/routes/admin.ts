import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize('ADMIN'));

// ── Users ─────────────────────────────────────────────────────────────────────

// POST /api/admin/users — admin-only: create STAFF or ADMIN accounts with a specified role
adminRouter.post('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(6).max(100),
      role: z.enum(['STUDENT', 'STAFF', 'ADMIN']),
    }).parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, phone: data.phone, passwordHash, role: data.role },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    });
    res.status(201).json({ success: true, user });
  } catch (err) {
    if (err instanceof (await import('zod')).z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation error' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// GET /api/admin/users
adminRouter.get('/users', async (req, res: Response): Promise<void> => {
  try {
    const { search, role } = req.query;
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id
adminRouter.patch('/users/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = z.object({
      isActive: z.boolean().optional(),
      role: z.enum(['STUDENT', 'STAFF', 'ADMIN']).optional(),
    }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.params.id }, data, select: { id: true, name: true, email: true, role: true, isActive: true } });
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// PATCH /api/admin/users/:id/toggle
adminRouter.patch('/users/:id/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    // Prevent disabling the last active admin
    if (existing.role === 'ADMIN' && existing.isActive) {
      const activeAdminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (activeAdminCount <= 1) {
        res.status(400).json({ success: false, message: 'Cannot deactivate the last active administrator' });
        return;
      }
    }

    const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !existing.isActive } });
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to toggle user' });
  }
});

// PATCH /api/admin/users/:id/role
adminRouter.patch('/users/:id/role', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = z.object({ role: z.enum(['STUDENT', 'STAFF', 'ADMIN']) }).parse(req.body);

    // Prevent stripping the last active admin of their role
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    if (existing.role === 'ADMIN' && role !== 'ADMIN') {
      const activeAdminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (activeAdminCount <= 1) {
        res.status(400).json({ success: false, message: 'Cannot remove the last active administrator role' });
        return;
      }
    }

    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

// ── Account Requests ──────────────────────────────────────────────────────────

// GET /api/admin/account-requests
adminRouter.get('/account-requests', async (req, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const requests = await prisma.accountRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, phone: true,
        requestedRole: true, status: true, rejectionReason: true,
        createdAt: true, reviewedAt: true,
        reviewedBy: { select: { name: true, email: true } },
      },
    });
    res.json({ success: true, requests });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch account requests' });
  }
});

// POST /api/admin/account-requests/:id/approve
adminRouter.post('/account-requests/:id/approve', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const request = await prisma.accountRequest.findUnique({ where: { id: req.params.id } });
    if (!request) { res.status(404).json({ success: false, message: 'Request not found' }); return; }
    if (request.status !== 'PENDING') {
      res.status(400).json({ success: false, message: `Cannot approve a ${request.status.toLowerCase()} request` });
      return;
    }

    // Check no user with this email was already created (race condition guard)
    const existingUser = await prisma.user.findUnique({ where: { email: request.email } });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'A user with this email already exists' });
      return;
    }

    // Create the user with the requested role and mark the request approved — in a transaction
    await prisma.$transaction([
      prisma.user.create({
        data: {
          name: request.name,
          email: request.email,
          phone: request.phone ?? undefined,
          passwordHash: request.passwordHash,
          role: request.requestedRole,
          isActive: true,
        },
      }),
      prisma.accountRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          reviewedById: req.user!.id,
          reviewedAt: new Date(),
        },
      }),
    ]);

    res.json({ success: true, message: `Account approved for ${request.email} as ${request.requestedRole}` });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to approve request' });
  }
});

// POST /api/admin/account-requests/:id/reject
adminRouter.post('/account-requests/:id/reject', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = z.object({ reason: z.string().max(500).optional() }).parse(req.body);
    const request = await prisma.accountRequest.findUnique({ where: { id: req.params.id } });
    if (!request) { res.status(404).json({ success: false, message: 'Request not found' }); return; }
    if (request.status !== 'PENDING') {
      res.status(400).json({ success: false, message: `Cannot reject a ${request.status.toLowerCase()} request` });
      return;
    }

    await prisma.accountRequest.update({
      where: { id: request.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason ?? null,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
      },
    });

    res.json({ success: true, message: `Request rejected for ${request.email}` });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
});


// ── Analytics ─────────────────────────────────────────────────────────────────

// GET /api/admin/analytics
adminRouter.get('/analytics', async (req, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const dateFilter = { createdAt: { gte: start, lte: end } };

    // Totals
    const [totalOrders, revenue, todayOrders, pendingCount, avgOrderData] = await Promise.all([
      prisma.order.count({ where: { ...dateFilter, status: { notIn: ['CANCELLED'] } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', ...dateFilter } }),
      prisma.order.count({ where: { scheduledDate: new Date().toISOString().slice(0, 10), status: { notIn: ['CANCELLED'] } } }),
      prisma.order.count({ where: { status: { in: ['PLACED', 'CONFIRMED', 'PREPARING'] } } }),
      prisma.order.aggregate({ _avg: { total: true }, where: { ...dateFilter, status: { notIn: ['CANCELLED'] } } }),
    ]);

    // Orders by status
    const statusGroups = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
      where: dateFilter,
    });

    // Payment method breakdown
    const paymentMethods = await prisma.payment.groupBy({
      by: ['method'],
      _count: true,
      _sum: { amount: true },
      where: { status: 'PAID', ...dateFilter },
    });

    // Sales by day (last 7 days)
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayRevenue = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', createdAt: { gte: new Date(dateStr), lt: new Date(new Date(dateStr).getTime() + 86400000) } },
      });
      const dayOrders = await prisma.order.count({
        where: { scheduledDate: dateStr, status: { notIn: ['CANCELLED'] } },
      });
      last7.push({ date: dateStr, revenue: dayRevenue._sum.amount || 0, orders: dayOrders });
    }

    // Popular items
    const popularItems = await prisma.orderItem.groupBy({
      by: ['menuItemId', 'name'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
      where: { order: { ...dateFilter, status: { notIn: ['CANCELLED'] } } },
    });

    // Low stock
    const lowStock = await prisma.menuItem.findMany({
      where: { stockQuantity: { lt: 10 }, isAvailable: true },
      select: { id: true, name: true, stockQuantity: true, category: { select: { name: true } } },
      orderBy: { stockQuantity: 'asc' },
    });

    res.json({
      success: true,
      analytics: {
        totalOrders,
        revenue: revenue._sum.amount || 0,
        todayOrders,
        pendingOrders: pendingCount,
        avgOrderValue: avgOrderData._avg.total || 0,
        statusBreakdown: statusGroups,
        paymentMethods,
        dailySales: last7,
        popularItems,
        lowStock,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// GET /api/admin/analytics/csv
adminRouter.get('/analytics/csv', async (req, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { items: true, payment: true, user: { select: { name: true, email: true } }, pickupSlot: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Order Number', 'Date', 'Customer', 'Email', 'Items', 'Subtotal', 'Tax', 'Total', 'Payment Method', 'Payment Status', 'Order Status', 'Pickup Slot'];
    const rows = orders.map(o => [
      o.orderNumber,
      o.createdAt.toISOString().slice(0, 10),
      o.user.name,
      o.user.email,
      o.items.map(i => `${i.name}(x${i.quantity})`).join('; '),
      o.subtotal.toFixed(2),
      o.tax.toFixed(2),
      o.total.toFixed(2),
      o.paymentMethod,
      o.paymentStatus,
      o.status,
      o.pickupSlot.label,
    ]);

    const csv = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch {
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
});

// GET /api/admin/orders
adminRouter.get('/orders', async (req, res: Response): Promise<void> => {
  try {
    const { status, date, search, skip: skipQ, limit: limitQ } = req.query;
    const skip = skipQ ? parseInt(skipQ as string) : 0;
    const take = limitQ ? parseInt(limitQ as string) : 50;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (date) where.scheduledDate = date;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string } },
        { user: { name: { contains: search as string } } },
        { user: { email: { contains: search as string } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: { select: { name: true, email: true } }, items: true, payment: true, pickupSlot: true, token: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ success: true, orders, total });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// GET /api/admin/inventory
adminRouter.get('/inventory', async (_req, res: Response): Promise<void> => {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });
    const transactions = await prisma.inventoryTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { menuItem: { select: { name: true } } },
    });
    res.json({ success: true, items, transactions });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
});
