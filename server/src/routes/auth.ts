import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Public registration now creates an AccountRequest (PENDING) instead of a User directly.
const requestAccountSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6).max(100),
  requestedRole: z.enum(['STUDENT', 'STAFF', 'ADMIN']).default('STUDENT'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
});

function generateToken(user: { id: string; email: string; role: string; name: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

// POST /api/auth/register — creates an AccountRequest (PENDING approval)
// Role is accepted from client but is validated and enforced server-side during approval.
authRouter.post('/register', authLimiter, async (req, res: Response): Promise<void> => {
  try {
    const data = requestAccountSchema.parse(req.body);

    // Check no active user or pending/approved request already exists
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered as an active account' });
      return;
    }

    const existingRequest = await prisma.accountRequest.findFirst({
      where: { email: data.email, status: { in: ['PENDING', 'APPROVED'] } },
    });
    if (existingRequest) {
      const statusMsg = existingRequest.status === 'PENDING'
        ? 'A pending request for this email already exists'
        : 'This email has already been approved — please log in';
      res.status(409).json({ success: false, message: statusMsg });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const request = await prisma.accountRequest.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        requestedRole: data.requestedRole,
        status: 'PENDING',
      },
      select: { id: true, name: true, email: true, requestedRole: true, status: true, createdAt: true },
    });

    res.status(201).json({
      success: true,
      message: 'Your account request has been submitted and is awaiting administrator approval.',
      request,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// GET /api/auth/request-status?email=xxx — check own request status (public, no auth needed)
authRouter.get('/request-status', authLimiter, async (req, res: Response): Promise<void> => {
  try {
    const email = z.string().email().parse(req.query.email);
    const request = await prisma.accountRequest.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, requestedRole: true, status: true, rejectionReason: true, createdAt: true, reviewedAt: true },
    });
    if (!request) {
      res.status(404).json({ success: false, message: 'No request found for this email' });
      return;
    }
    res.json({ success: true, request });
  } catch {
    res.status(400).json({ success: false, message: 'Invalid email' });
  }
});

// POST /api/auth/login — only ACTIVE approved users may log in
authRouter.post('/login', authLimiter, async (req, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    // First check if there's a pending/rejected request for this email
    const pendingRequest = await prisma.accountRequest.findFirst({
      where: { email: data.email, status: { in: ['PENDING', 'REJECTED'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingRequest) {
      // Verify password is correct first to avoid info leakage
      const validPw = await bcrypt.compare(data.password, pendingRequest.passwordHash);
      if (!validPw) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      if (pendingRequest.status === 'PENDING') {
        res.status(403).json({
          success: false,
          code: 'ACCOUNT_PENDING',
          message: 'Your account is awaiting administrator approval.',
          request: {
            name: pendingRequest.name,
            email: pendingRequest.email,
            requestedRole: pendingRequest.requestedRole,
            createdAt: pendingRequest.createdAt,
          },
        });
        return;
      }
      if (pendingRequest.status === 'REJECTED') {
        res.status(403).json({
          success: false,
          code: 'ACCOUNT_REJECTED',
          message: 'Your account request was rejected.',
          rejectionReason: pendingRequest.rejectionReason,
          request: {
            name: pendingRequest.name,
            email: pendingRequest.email,
            requestedRole: pendingRequest.requestedRole,
            createdAt: pendingRequest.createdAt,
          },
        });
        return;
      }
    }

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// PUT /api/auth/profile
authRouter.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, updatedAt: true },
    });
    res.json({ success: true, user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// PUT /api/auth/change-password
authRouter.put('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) { res.status(400).json({ success: false, message: 'Current password is incorrect' }); return; }

    const passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// GET /api/auth/order-history
authRouter.get('/order-history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: {
        items: true,
        pickupSlot: true,
        token: true,
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, orders });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch order history' });
  }
});
