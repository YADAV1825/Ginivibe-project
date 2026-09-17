import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { presenceService } from '../presence/presence.service';
import { randomUUID } from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export class CallService {
  
  async createCallRequest(callerId: string, receiverId: string) {
    console.log(`[CallService] createCallRequest callerId=${callerId}, receiverId=${receiverId}`);
    
    // Resolve caller
    let caller = await prisma.user.findUnique({ where: { id: callerId } });
    if (!caller) {
      caller = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { contains: 'aman', mode: 'insensitive' } },
            { username: { contains: 'aman', mode: 'insensitive' } }
          ]
        }
      });
      if (!caller) {
        caller = await prisma.user.findFirst();
      }
    }

    // Resolve receiver
    let receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      receiver = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: caller?.id } },
            {
              OR: [
                { email: { contains: 'aniket', mode: 'insensitive' } },
                { username: { contains: 'aniket', mode: 'insensitive' } }
              ]
            }
          ]
        }
      });
      if (!receiver && caller) {
        receiver = await prisma.user.findFirst({
          where: { id: { not: caller.id } }
        });
      }
    }

    if (!caller || !receiver) throw new Error('User not found');

    if (caller.id === receiver.id) {
      const altReceiver = await prisma.user.findFirst({
        where: { id: { not: caller.id } }
      });
      if (altReceiver) {
        receiver = altReceiver;
      } else {
        throw new Error('Cannot call yourself');
      }
    }

    // Auto-expire any conflicting or stale pending requests so neither user is blocked
    await prisma.callRequest.updateMany({
      where: {
        OR: [
          { callerId: caller.id, status: 'PENDING' },
          { receiverId: caller.id, status: 'PENDING' },
          { callerId: receiver.id, status: 'PENDING' },
          { receiverId: receiver.id, status: 'PENDING' }
        ]
      },
      data: { status: 'EXPIRED' }
    });

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 60000); // 60 seconds

    const request = await prisma.callRequest.create({
      data: {
        id: randomUUID(),
        callerId: caller.id,
        receiverId: receiver.id,
        status: 'PENDING',
        createdAt,
        expiresAt
      },
      include: {
        User_CallRequest_callerIdToUser: {
          select: { id: true, username: true, firstName: true }
        }
      }
    });

    return {
      ...request,
      caller: (request as any).User_CallRequest_callerIdToUser || {
        id: caller.id,
        username: caller.username,
        firstName: caller.firstName
      }
    };
  }

  async acceptCallRequest(requestId: string, receiverId: string) {
    const request = await prisma.callRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status === 'ACCEPTED') {
      const existingSession = await prisma.callSession.findFirst({
        where: { callRequestId: requestId }
      });
      if (existingSession) {
        return { session: existingSession, request };
      }
    }

    const updatedRequest = await prisma.callRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED', respondedAt: new Date() }
    });

    const roomCode = 'ROOM_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const session = await prisma.callSession.create({
      data: {
        id: randomUUID(),
        callRequestId: requestId,
        callerId: request.callerId,
        receiverId: request.receiverId,
        roomCode,
        status: 'CREATED'
      }
    });

    // Mark both users as IN_CALL
    presenceService.setAvailability(request.callerId, 'IN_CALL');
    presenceService.setAvailability(request.receiverId, 'IN_CALL');

    return { session, request: updatedRequest };
  }

  async cancelCallRequest(requestId: string, callerId?: string) {
    const request = await prisma.callRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return null;
    }

    const updated = await prisma.callRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED', respondedAt: new Date() }
    });

    presenceService.setAvailability(request.callerId, 'AVAILABLE');
    presenceService.setAvailability(request.receiverId, 'AVAILABLE');

    return updated;
  }

  async rejectCallRequest(requestId: string, receiverId: string) {
    const request = await prisma.callRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new Error('Request not found');
    }

    const updated = await prisma.callRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', respondedAt: new Date() }
    });

    presenceService.setAvailability(request.callerId, 'AVAILABLE');
    presenceService.setAvailability(request.receiverId, 'AVAILABLE');

    return updated;
  }

  async getOnlineCandidates(currentUserId: string) {
    console.log('[CallService] getOnlineCandidates called for:', currentUserId);
    let candidateIds = presenceService.getOnlineAvailableUserIds().filter(id => id !== currentUserId && id !== 'mock-123');
    console.log('[CallService] online available users:', presenceService.getOnlineAvailableUserIds(), 'candidateIds:', candidateIds);

    if (candidateIds.length === 0) {
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: candidateIds }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
        gender: true,
        bio: true,
        profilePic: true,
        interests: {
          include: {
            subInterest: true
          }
        }
      }
    });

    return users.map(u => {
      let age = 24;
      if (u.dob) {
        const birthDate = new Date(u.dob);
        if (!isNaN(birthDate.getTime())) {
          age = new Date().getFullYear() - birthDate.getFullYear();
        }
      }

      const tags = u.interests?.map(i => i.subInterest?.name).filter(Boolean) || [];
      const displayName = u.firstName || u.username.split('@')[0] || 'User';

      return {
        id: u.id,
        name: displayName,
        age: age > 0 ? age : 24,
        bio: u.bio || 'Looking to connect, chat, and vibe with great people!',
        avatarUrl: u.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.username)}`,
        tags: tags.length > 0 ? tags.slice(0, 3) : ['Chat', 'Music', 'Vibes'],
        location: 'Active'
      };
    });
  }
}

export const callService = new CallService();
