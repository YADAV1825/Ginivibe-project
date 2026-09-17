import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/postgres/client';

export class FollowController {
  static async sendFollowRequest(req: Request, res: Response) {
    try {
      const followerId = req.user?.id;
      if (!followerId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { targetUserId, message } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: 'Missing target user identity' });
      }

      if (followerId === targetUserId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
      }

      // Check block rules bidirectionally to ensure safe interaction
      const blockExists = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: followerId, blockedId: targetUserId },
            { blockerId: targetUserId, blockedId: followerId }
          ]
        }
      });

      if (blockExists) {
        // Obfuscate block reason for privacy and safety
        return res.status(400).json({ error: 'Unable to send follow request at this time.' });
      }

      // Check existing follow relationship to handle state transitions
      const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId: targetUserId } },
      });

      if (existing) {
        if (existing.status === 'ACCEPTED') {
          return res.status(200).json({
            message: 'You are already connected with this user',
            status: 'ACCEPTED',
          });
        }

        if (existing.status === 'REJECTED') {
          const cooldownMs = 24 * 60 * 60 * 1000; // 24-hour cooldown
          const timeSinceRejection = Date.now() - new Date(existing.updatedAt).getTime();
          if (timeSinceRejection < cooldownMs) {
            const hoursRemaining = Math.ceil((cooldownMs - timeSinceRejection) / (1000 * 60 * 60));
            return res.status(429).json({
              error: `Request was previously declined. Please wait ${hoursRemaining}h before trying again.`,
            });
          }
        }
      }

      // Upsert: updates existing pending/expired request with new message, or creates fresh pending request
      const followRequest = await prisma.follow.upsert({
        where: {
          followerId_followingId: { followerId, followingId: targetUserId },
        },
        update: {
          status: 'PENDING',
          message: message?.trim() || existing?.message || null,
          updatedAt: new Date(),
        },
        create: {
          followerId,
          followingId: targetUserId,
          status: 'PENDING',
          message: message?.trim() || null,
        },
      });

      return res.status(200).json({ 
        message: 'Message request sent successfully', 
        status: followRequest.status 
      });

    } catch (error: any) {
      console.error('Follow request error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
