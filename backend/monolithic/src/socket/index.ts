import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { socketAuthMiddleware } from './socket-auth';
import { presenceService } from '../features/presence/presence.service';
import { registerPresenceSocketHandlers } from '../features/presence/presence.socket';
import { initCallSocket, emitToUser } from '../features/calls/call.socket';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const initSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Adjust in production
      methods: ['GET', 'POST']
    }
  });

  // Initialize call socket emitter
  initCallSocket(io);

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;

    // Register user presence
    presenceService.addSocket(userId, socket.id);
    console.log(`User ${userId} connected (Socket: ${socket.id})`);

    // Send currently online user IDs to newly connected client
    socket.emit('presence:init', { onlineUserIds: presenceService.getOnlineAvailableUserIds() });

    // Broadcast to others that this user is now online
    socket.broadcast.emit('user_presence_update', { userId, status: 'ONLINE' });

    // Respond to direct presence inquiries
    socket.on('presence:query', (callback?: (data: { onlineUserIds: string[] }) => void) => {
      if (typeof callback === 'function') {
        callback({ onlineUserIds: presenceService.getOnlineAvailableUserIds() });
      }
    });

    // Register handlers
    registerPresenceSocketHandlers(socket);

    socket.on('disconnect', () => {
      presenceService.removeSocket(userId, socket.id);
      console.log(`User ${userId} disconnected (Socket: ${socket.id})`);
      if (!presenceService.isOnline(userId)) {
        io.emit('user_presence_update', { userId, status: 'OFFLINE' });
      }
    });
  });

  // Periodic cleanup of expired call requests
  setInterval(async () => {
    try {
      const expiredRequests = await prisma.callRequest.findMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: new Date() }
        }
      });

      if (expiredRequests.length > 0) {
        await prisma.callRequest.updateMany({
          where: { id: { in: expiredRequests.map(r => r.id) } },
          data: { status: 'EXPIRED' }
        });

        expiredRequests.forEach(request => {
          // Reset availability to AVAILABLE
          presenceService.setAvailability(request.callerId, 'AVAILABLE');
          presenceService.setAvailability(request.receiverId, 'AVAILABLE');

          // Notify caller specifically
          emitToUser(request.callerId, 'call_request_expired', { requestId: request.id });

          // Notify receiver specifically
          emitToUser(request.receiverId, 'call_request_expired', { requestId: request.id });

          // Broadcast to ensure any active listening component dismisses modal
          io.emit('call_request_expired', { requestId: request.id });
        });

        // Broadcast presence update so candidate lists refresh
        io.emit('user_presence_update', { status: 'REFRESH' });
      }
    } catch (e) {
      console.error('Failed to cleanup expired requests', e);
    }
  }, 5000);

  return io;
};
