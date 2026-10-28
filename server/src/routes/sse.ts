import { Response } from 'express';
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

export const sseRouter = Router();

// Store connected SSE clients
interface SseClient {
  id: string;
  role: string;
  res: Response;
}

const clients: SseClient[] = [];

// GET /api/sse/events
sseRouter.get('/events', authenticate, (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const client: SseClient = { id: req.user!.id, role: req.user!.role, res };
  clients.push(client);

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connected to live updates' })}\n\n`);

  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const idx = clients.findIndex(c => c.id === req.user!.id && c.res === res);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

export function broadcastToUser(userId: string, data: object) {
  clients
    .filter(c => c.id === userId)
    .forEach(c => c.res.write(`data: ${JSON.stringify(data)}\n\n`));
}

export function broadcastToStaff(data: object) {
  clients
    .filter(c => ['STAFF', 'ADMIN'].includes(c.role))
    .forEach(c => c.res.write(`data: ${JSON.stringify(data)}\n\n`));
}

export function broadcastNewOrder(orderId: string) {
  broadcastToStaff({ type: 'NEW_ORDER', orderId });
}

export function broadcastOrderUpdate(orderId: string, userId: string, status: string) {
  broadcastToUser(userId, { type: 'ORDER_UPDATE', orderId, status });
  broadcastToStaff({ type: 'ORDER_UPDATE', orderId, status });
}
