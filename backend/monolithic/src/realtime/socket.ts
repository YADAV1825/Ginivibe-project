import type { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_ALGORITHM, JWT_SECRET } from '../config/auth';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const userSockets = new Map<string, Set<string>>();

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, { cors: { origin: true, credentials: true } });

  io.use((socket: Socket, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Missing token'));
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as jwt.JwtPayload;
      if (typeof decoded.id !== 'string') return next(new Error('Invalid token'));
      (socket as Socket & { userId: string }).userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = (socket as Socket & { userId: string }).userId;
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(socket.id);

    const partners = await prisma.conversationMember.findMany({
      where: { conversation: { members: { some: { userId } } } },
      select: { userId: true },
    });
    partners.filter((p) => p.userId !== userId).forEach((p) => emitToUser(p.userId, 'presence:online', { userId }));

    socket.on('typing:start', ({ conversationId }: { conversationId: string }) =>
      broadcastTyping(conversationId, userId, 'typing:start')
    );
    socket.on('typing:stop', ({ conversationId }: { conversationId: string }) =>
      broadcastTyping(conversationId, userId, 'typing:stop')
    );

    socket.on('disconnect', async () => {
      userSockets.get(userId)?.delete(socket.id);
      if (userSockets.get(userId)?.size === 0) {
        userSockets.delete(userId);
        const lastSeenAt = new Date();
        await prisma.user.update({ where: { id: userId }, data: { lastSeenAt } });
        partners
          .filter((p) => p.userId !== userId)
          .forEach((p) => emitToUser(p.userId, 'presence:offline', { userId, lastSeenAt }));
      }
    });
  });
};

const broadcastTyping = async (conversationId: string, fromUserId: string, event: string) => {
  const members = await prisma.conversationMember.findMany({ where: { conversationId } });
  members.filter((m) => m.userId !== fromUserId).forEach((m) => emitToUser(m.userId, event, { conversationId, userId: fromUserId }));
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  const sockets = userSockets.get(userId);
  if (!sockets || !io) return;
  sockets.forEach((id) => io.to(id).emit(event, payload));
};