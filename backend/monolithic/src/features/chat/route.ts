import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'crypto';
import { requireAuth } from '../../middleware/auth';
import type { AuthRequest } from '../../middleware/auth';
import { emitToUser } from '../calls/call.socket';
import { presenceService } from '../presence/presence.service';
import { searchService } from '../search/search.service';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// In-memory store for muted conversations: userId -> Set of conversationIds
const userMutedConversations = new Map<string, Set<string>>();

// Backward-compatible user search for chat clients
router.get('/users/search', requireAuth, async (req: AuthRequest, res) => {
  const requesterId = req.userId;
  if (!requesterId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const query = (req.query.query || req.query.q) as string | undefined;
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.json([]);
  }

  try {
    const { results } = await searchService.searchUsers(requesterId, {
      q: query.trim(),
      limit: 20,
    });
    return res.json(results);
  } catch (err: any) {
    console.error('[ChatSearch] Error:', err);
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

// Real-time online presence endpoint for chat clients
router.get('/presence', requireAuth, (_req: AuthRequest, res) => {
  try {
    const onlineUserIds = presenceService.getOnlineAvailableUserIds();
    return res.json({ onlineUserIds });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch presence' });
  }
});

// --- Message Requests (Instagram-Style Incoming Match Requests) ---

// 0.1 List pending message requests with sender profile & pagination support
router.get('/requests', requireAuth, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.userId!;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const [follows, count] = await Promise.all([
      prisma.follow.findMany({
        where: {
          followingId: currentUserId,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          User_Follow_followerIdToUser: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePic: true,
              bio: true,
              zodiacSign: true,
            },
          },
        },
      }),
      prisma.follow.count({
        where: {
          followingId: currentUserId,
          status: 'PENDING',
        },
      }),
    ]);

    const formatted = follows.map((f) => {
      const u = f.User_Follow_followerIdToUser;
      return {
        id: f.id,
        message: f.message,
        createdAt: f.createdAt,
        sender: {
          id: u.id,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          profilePic: u.profilePic,
          bio: u.bio,
          zodiacSign: u.zodiacSign,
        },
      };
    });

    return res.json({
      requests: formatted,
      count,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch message requests' });
  }
});

// 0.15 Followers of a user (accepted only)
router.get('/users/:id/followers', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (typeof userId !== 'string') return res.status(400).json({ error: 'Invalid userId' });
    const [follows, count] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId, status: 'ACCEPTED' },
        orderBy: { createdAt: 'desc' },
        include: {
          User_Follow_followerIdToUser: {
            select: { id: true, username: true, firstName: true, lastName: true, profilePic: true },
          },
        },
      }),
      prisma.follow.count({ where: { followingId: userId, status: 'ACCEPTED' } }),
    ]);
    return res.json({ data: follows.map((f) => f.User_Follow_followerIdToUser), count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 0.16 Accounts a user follows (accepted only)
router.get('/users/:id/following', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (typeof userId !== 'string') return res.status(400).json({ error: 'Invalid userId' });
    const [follows, count] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId, status: 'ACCEPTED' },
        orderBy: { createdAt: 'desc' },
        include: {
          User_Follow_followingIdToUser: {
            select: { id: true, username: true, firstName: true, lastName: true, profilePic: true },
          },
        },
      }),
      prisma.follow.count({ where: { followerId: userId, status: 'ACCEPTED' } }),
    ]);
    return res.json({ data: follows.map((f) => f.User_Follow_followingIdToUser), count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 0.17 Public profile of any user (for View Profile from search/matching)
router.get('/users/:id/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (typeof userId !== 'string') return res.status(400).json({ error: 'Invalid userId' });
    const me = req.userId;
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, firstName: true, lastName: true,
        bio: true, profilePic: true,
        interests: { select: { subInterest: { select: { name: true } } } },
      },
    });
    if (!target) return res.status(404).json({ error: 'User not found' });
    const [followersCount, followingCount, mine] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId, status: 'ACCEPTED' } }),
      prisma.follow.count({ where: { followerId: userId, status: 'ACCEPTED' } }),
      me && me !== userId
        ? prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: me, followingId: userId } },
            select: { status: true },
          })
        : null,
    ]);
    return res.json({
      id: target.id,
      username: target.username,
      firstName: target.firstName,
      lastName: target.lastName,
      bio: target.bio,
      profilePic: target.profilePic,
      interests: target.interests.map((i) => i.subInterest.name),
      followersCount,
      followingCount,
      isFollowing: mine?.status === 'ACCEPTED',
      followStatus: mine?.status ?? null,
      isSelf: me === userId,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 0.18 Follow a user directly (accepted immediately)
router.post('/users/:id/follow', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    const me = req.userId!;
    if (typeof userId !== 'string') return res.status(400).json({ error: 'Invalid userId' });
    if (me === userId) return res.status(400).json({ error: 'You cannot follow yourself' });
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return res.status(404).json({ error: 'User not found' });
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: me, followingId: userId } },
      update: { status: 'ACCEPTED' },
      create: { followerId: me, followingId: userId, status: 'ACCEPTED' },
    });
    return res.json({ success: true, isFollowing: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 0.19 Unfollow a user
router.delete('/users/:id/follow', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    const me = req.userId!;
    if (typeof userId !== 'string') return res.status(400).json({ error: 'Invalid userId' });
    await prisma.follow.deleteMany({ where: { followerId: me, followingId: userId } });
    return res.json({ success: true, isFollowing: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 0.2 Accept a message request transactionally:
// - Validates ownership & pending state
// - Marks status = 'ACCEPTED'
// - Deterministically finds or creates Conversation
// - Idempotently copies icebreaker text as initial Message
// - Returns full conversation object in standard chat format
router.post('/requests/:id/accept', requireAuth, async (req: AuthRequest, res) => {
  try {
    const requestId = req.params.id;
    const currentUserId = req.userId!;

    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Invalid requestId' });
    }

    const conversation = await prisma.$transaction(async (tx) => {
      // 1. Fetch & lock/validate follow request
      const follow = await tx.follow.findUnique({
        where: { id: requestId },
      });

      if (!follow) {
        throw new Error('Message request not found');
      }
      if (follow.followingId !== currentUserId) {
        throw new Error('Unauthorized to accept this request');
      }
      if (follow.status === 'REJECTED') {
        throw new Error('Cannot accept a declined request');
      }

      // 2. Mark as ACCEPTED
      await tx.follow.update({
        where: { id: follow.id },
        data: { status: 'ACCEPTED', updatedAt: new Date() },
      });

      // 3. Deterministic direct conversation lookup
      let conv = await tx.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: follow.followerId } } },
            { members: { some: { userId: follow.followingId } } },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, username: true, firstName: true, lastName: true, profilePic: true },
              },
            },
          },
          messages: { take: 20, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!conv) {
        conv = await tx.conversation.create({
          data: {
            isGroup: false,
            members: {
              create: [
                { userId: follow.followerId },
                { userId: follow.followingId },
              ],
            },
          },
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, username: true, firstName: true, lastName: true, profilePic: true },
                },
              },
            },
            messages: true,
          },
        });
      }

      // 4. Idempotent icebreaker message insertion
      if (follow.message && follow.message.trim()) {
        const existingMsg = await tx.message.findFirst({
          where: {
            conversationId: conv.id,
            senderId: follow.followerId,
            text: follow.message.trim(),
          },
        });

        if (!existingMsg) {
          const newMsg = await tx.message.create({
            data: {
              conversationId: conv.id,
              senderId: follow.followerId,
              text: follow.message.trim(),
              createdAt: follow.createdAt,
            },
            include: {
              sender: {
                select: { id: true, username: true, firstName: true },
              },
            },
          });

          await tx.conversation.update({
            where: { id: conv.id },
            data: { updatedAt: new Date() },
          });

          conv.messages = [newMsg];
        }
      }

      return conv;
    });

    const otherMemberId = conversation.members.find((m) => m.userId !== currentUserId)?.userId;
    if (otherMemberId) {
      emitToUser(otherMemberId, 'request:accepted', { conversationId: conversation.id });
    }

    return res.json({ ...conversation, unreadCount: 0 });
  } catch (err: any) {
    const status = err.message?.includes('not found') ? 404 : err.message?.includes('Unauthorized') ? 403 : 400;
    return res.status(status).json({ error: err.message || 'Failed to accept request' });
  }
});

// 0.3 Reject/decline a message request (preserves REJECTED status to avoid spam/re-solicitation)
router.post('/requests/:id/reject', requireAuth, async (req: AuthRequest, res) => {
  try {
    const requestId = req.params.id;
    const currentUserId = req.userId!;

    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Invalid requestId' });
    }

    const follow = await prisma.follow.findUnique({
      where: { id: requestId },
    });

    if (!follow) {
      return res.status(404).json({ error: 'Message request not found' });
    }
    if (follow.followingId !== currentUserId) {
      return res.status(403).json({ error: 'Unauthorized to reject this request' });
    }

    await prisma.follow.update({
      where: { id: requestId },
      data: { status: 'REJECTED', updatedAt: new Date() },
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to reject request' });
  }
});

// 1. Get or create a direct conversation — identity comes from the JWT, not the body
router.post('/conversations/direct', requireAuth, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.userId!;
    const { otherUserId } = req.body;

    if (!otherUserId) return res.status(400).json({ error: 'otherUserId is required' });
    if (otherUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot create a direct conversation with yourself' });
    }

    const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
    if (!otherUser) return res.status(404).json({ error: 'User not found' });

    // 1. Return existing conversation if already created
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: currentUserId } } },
          { members: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        members: { include: { user: { select: { id: true, username: true, firstName: true } } } },
        messages: { take: 20, orderBy: { createdAt: 'asc' } },
      },
    });
    if (existing) return res.json(existing);

    // 2. Strict Match Rule: A conversation can only be created if there is an ACCEPTED match/follow request
    const acceptedFollow = await prisma.follow.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { followerId: currentUserId, followingId: otherUserId },
          { followerId: otherUserId, followingId: currentUserId },
        ],
      },
    });

    if (!acceptedFollow) {
      return res.status(403).json({
        error: 'Cannot start conversation. A match request must be accepted first in the Requests tab.',
      });
    }

    const newConversation = await prisma.conversation.create({
      data: { isGroup: false, members: { create: [{ userId: currentUserId }, { userId: otherUserId }] } },
      include: {
        members: { include: { user: { select: { id: true, username: true, firstName: true } } } },
        messages: true,
      },
    });
    return res.status(201).json(newConversation);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

const MAX_GROUP_MEMBERS = 50;

const assertGroupAdmin = async (conversationId: string, userId: string) => {
  const membership = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  });
  return membership?.role === 'admin';
};

const getGroupOrFail = async (conversationId: string) => {
  return prisma.conversation.findFirst({ where: { id: conversationId, isGroup: true } });
};

// 1b. Create a group conversation (creator becomes admin)
router.post('/conversations/group', requireAuth, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.userId!;
    const { title, memberIds } = req.body ?? {};

    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    if (cleanTitle.length < 3 || cleanTitle.length > 60) {
      return res.status(400).json({ error: 'Group title must be 3-60 characters' });
    }
    const uniqueIds = Array.from(new Set((Array.isArray(memberIds) ? memberIds : []).filter((id: unknown) => typeof id === 'string' && id && id !== currentUserId))) as string[];
    if (uniqueIds.length < 1) {
      return res.status(400).json({ error: 'Add at least one other member to create a group' });
    }
    if (uniqueIds.length + 1 > MAX_GROUP_MEMBERS) {
      return res.status(400).json({ error: `Groups are capped at ${MAX_GROUP_MEMBERS} members` });
    }

    const existingUsers = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (existingUsers.length !== uniqueIds.length) {
      return res.status(404).json({ error: 'One or more members were not found' });
    }

    const group = await prisma.conversation.create({
      data: {
        isGroup: true,
        title: cleanTitle,
        members: {
          create: [
            { userId: currentUserId, role: 'admin' },
            ...uniqueIds.map((userId) => ({ userId, role: 'member' })),
          ],
        },
      },
      include: {
        members: { include: { user: { select: { id: true, username: true, firstName: true } } } },
        messages: true,
      },
    });

    uniqueIds.forEach((userId) => {
      emitToUser(userId, 'conversation:created', { conversationId: group.id });
    });
    return res.status(201).json(group);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 1c. Rename a group (admin only)
router.patch('/conversations/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const conversationId = req.params.id;
    if (typeof conversationId !== 'string') return res.status(400).json({ error: 'Invalid conversationId' });
    const userId = req.userId!;

    const group = await getGroupOrFail(conversationId);
    if (!group) return res.status(404).json({ error: 'Group conversation not found' });
    if (!(await assertGroupAdmin(conversationId, userId))) {
      return res.status(403).json({ error: 'Only group admins can rename the group' });
    }

    const cleanTitle = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (cleanTitle.length < 3 || cleanTitle.length > 60) {
      return res.status(400).json({ error: 'Group title must be 3-60 characters' });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: cleanTitle },
      include: {
        members: { include: { user: { select: { id: true, username: true, firstName: true } } } },
      },
    });
    const members = await prisma.conversationMember.findMany({ where: { conversationId }, select: { userId: true } });
    members.forEach((m) => emitToUser(m.userId, 'conversation:updated', { conversationId }));
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 1d. Add members to a group (admin only)
router.post('/conversations/:id/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const conversationId = req.params.id;
    if (typeof conversationId !== 'string') return res.status(400).json({ error: 'Invalid conversationId' });
    const userId = req.userId!;

    const group = await getGroupOrFail(conversationId);
    if (!group) return res.status(404).json({ error: 'Group conversation not found' });
    if (!(await assertGroupAdmin(conversationId, userId))) {
      return res.status(403).json({ error: 'Only group admins can add members' });
    }

    const uniqueIds = Array.from(new Set((Array.isArray(req.body?.userIds) ? req.body.userIds : []).filter((id: unknown) => typeof id === 'string' && id))) as string[];
    if (uniqueIds.length < 1) {
      return res.status(400).json({ error: 'userIds must be a non-empty array' });
    }

    const current = await prisma.conversationMember.findMany({ where: { conversationId }, select: { userId: true } });
    const currentIds = new Set(current.map((m) => m.userId));
    const freshIds = uniqueIds.filter((id) => !currentIds.has(id));
    if (freshIds.length === 0) {
      return res.status(409).json({ error: 'All of these users are already in the group' });
    }
    if (current.length + freshIds.length > MAX_GROUP_MEMBERS) {
      return res.status(400).json({ error: `Groups are capped at ${MAX_GROUP_MEMBERS} members` });
    }

    const existingUsers = await prisma.user.findMany({ where: { id: { in: freshIds } }, select: { id: true } });
    if (existingUsers.length !== freshIds.length) {
      return res.status(404).json({ error: 'One or more users were not found' });
    }

    await prisma.conversationMember.createMany({
      data: freshIds.map((id) => ({ userId: id, conversationId, role: 'member' })),
    });
    const members = await prisma.conversationMember.findMany({
      where: { conversationId },
      include: { user: { select: { id: true, username: true, firstName: true } } },
    });
    [...currentIds, ...freshIds].forEach((id: string) => emitToUser(id, 'conversation:updated', { conversationId }));
    return res.status(201).json({ members });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 1e. Remove a member from a group, or leave it.
// - Members can always remove themselves (leave). If the last member leaves,
//   the group and its messages are deleted. If an admin leaves while others
//   remain, the longest-standing member is promoted to admin.
// - Admins can remove other non-admin members.
router.delete('/conversations/:id/members/:userId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const conversationId = req.params.id;
    const targetUserId = req.params.userId;
    if (typeof conversationId !== 'string' || typeof targetUserId !== 'string') {
      return res.status(400).json({ error: 'Invalid conversationId or userId' });
    }
    const userId = req.userId!;

    const group = await getGroupOrFail(conversationId);
    if (!group) return res.status(404).json({ error: 'Group conversation not found' });

    const target = await prisma.conversationMember.findUnique({
      where: { userId_conversationId: { userId: targetUserId, conversationId } },
    });
    if (!target) return res.status(404).json({ error: 'User is not a member of this group' });

    const isSelfLeave = targetUserId === userId;
    if (!isSelfLeave) {
      if (!(await assertGroupAdmin(conversationId, userId))) {
        return res.status(403).json({ error: 'Only group admins can remove members' });
      }
      if (target.role === 'admin') {
        return res.status(403).json({ error: 'Admins can only leave on their own' });
      }
    }

    const remaining = await prisma.conversationMember.findMany({
      where: { conversationId, userId: { not: targetUserId } },
      orderBy: { joinedAt: 'asc' },
    });

    await prisma.$transaction(async (tx) => {
      await tx.conversationMember.delete({
        where: { userId_conversationId: { userId: targetUserId, conversationId } },
      });
      if (remaining.length === 0) {
        await tx.message.deleteMany({ where: { conversationId } });
        await tx.conversation.delete({ where: { id: conversationId } });
        return;
      }
      if (target.role === 'admin' && !remaining.some((m) => m.role === 'admin')) {
        await tx.conversationMember.update({
          where: { userId_conversationId: { userId: remaining[0].userId, conversationId } },
          data: { role: 'admin' },
        });
      }
    });

    if (remaining.length === 0) {
      emitToUser(targetUserId, 'conversation:deleted', { conversationId });
      return res.json({ success: true, deleted: true });
    }
    remaining.forEach((m) => emitToUser(m.userId, 'conversation:updated', { conversationId }));
    emitToUser(targetUserId, 'conversation:removed', { conversationId });
    return res.json({ success: true, deleted: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 2. Conversation list for the authenticated user, with unread counts and muted status (excluding blocked users)
router.get('/conversations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Find all blocks involving current user
    const blocks = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set(
      blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId))
    );

    const conversations = await prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, username: true, firstName: true } } } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const mutedSet = userMutedConversations.get(userId) || new Set<string>();

    // Filter out conversations with blocked users
    const filtered = conversations.filter((c) => {
      const other = c.members.find((m) => m.userId !== userId);
      return !other || !blockedIds.has(other.userId);
    });

    const withUnread = await Promise.all(
      filtered.map(async (c) => {
        const unreadCount = await prisma.message.count({
          where: { conversationId: c.id, senderId: { not: userId }, readAt: null },
        });
        return { ...c, unreadCount, isMuted: mutedSet.has(c.id) };
      })
    );
    return res.json(withUnread);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

const assertMember = async (conversationId: string, userId: string) => {
  const membership = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  });
  return !!membership;
};

// 2.5 Messages for a conversation — membership-checked, stamps deliveredAt
router.get('/messages/:conversationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const conversationId = req.params.conversationId;
    if (typeof conversationId !== 'string') return res.status(400).json({ error: 'Invalid conversationId' });
    const userId = req.userId!;
    if (!(await assertMember(conversationId, userId))) return res.status(403).json({ error: 'Forbidden' });
    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, deliveredAt: null },
      data: { deliveredAt: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, username: true, firstName: true } } },
    });
    return res.json(messages);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 2.6 Mark a conversation's incoming messages as read
router.patch('/conversations/:conversationId/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const conversationId = req.params.conversationId;
    if (typeof conversationId !== 'string') return res.status(400).json({ error: 'Invalid conversationId' });
    const userId = req.userId!;
    if (!(await assertMember(conversationId, userId))) return res.status(403).json({ error: 'Forbidden' });

    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date(), deliveredAt: new Date() },
    });
    emitToUser(userId, 'read:ack', { conversationId }); // no-op if sender not connected
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 2.7 Delete a conversation
router.delete('/conversations/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.userId!;
    if (!conversationId || typeof conversationId !== 'string') {
      return res.status(400).json({ error: 'Invalid conversationId' });
    }

    if (!(await assertMember(conversationId, userId))) {
      return res.status(403).json({ error: 'Unauthorized to delete this conversation' });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { isGroup: true },
    });
    if (conversation?.isGroup && !(await assertGroupAdmin(conversationId, userId))) {
      return res.status(403).json({ error: 'Only group admins can delete the group — members can leave it instead' });
    }

    const members = await prisma.conversationMember.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    // Transactionally clean up messages, members, and the conversation
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { conversationId } }),
      prisma.conversationMember.deleteMany({ where: { conversationId } }),
      prisma.conversation.delete({ where: { id: conversationId } }),
    ]);

    members.forEach((m) => {
      emitToUser(m.userId, 'conversation:deleted', { conversationId });
    });

    return res.json({ success: true, conversationId });
  } catch (err: any) {
    console.error('[DeleteConversation] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete conversation' });
  }
});

// 2.8 Mute or Unmute a conversation
router.post('/conversations/:id/mute', requireAuth, async (req: AuthRequest, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.userId!;
    if (!conversationId || typeof conversationId !== 'string') {
      return res.status(400).json({ error: 'Invalid conversationId' });
    }

    if (!(await assertMember(conversationId, userId))) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!userMutedConversations.has(userId)) {
      userMutedConversations.set(userId, new Set());
    }
    const mutedSet = userMutedConversations.get(userId)!;

    let isMuted: boolean;
    if (typeof req.body?.muted === 'boolean') {
      isMuted = req.body.muted;
      if (isMuted) mutedSet.add(conversationId);
      else mutedSet.delete(conversationId);
    } else {
      if (mutedSet.has(conversationId)) {
        mutedSet.delete(conversationId);
        isMuted = false;
      } else {
        mutedSet.add(conversationId);
        isMuted = true;
      }
    }

    return res.json({ success: true, conversationId, isMuted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to mute conversation' });
  }
});

// 2.9 Block a user (Instagram-style)
router.post('/users/:id/block', requireAuth, async (req: AuthRequest, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId!;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return res.status(400).json({ error: 'Invalid targetUserId' });
    }
    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // 1. Create or upsert Block record
    await prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: targetUserId,
        },
      },
      create: {
        id: randomUUID(),
        blockerId: currentUserId,
        blockedId: targetUserId,
      },
      update: {},
    });

    // 2. Clear any follow / match requests
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: currentUserId, followingId: targetUserId },
          { followerId: targetUserId, followingId: currentUserId },
        ],
      },
    });

    // 3. Delete existing direct conversation if any
    const directConv = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: currentUserId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      select: { id: true },
    });

    if (directConv) {
      await prisma.$transaction([
        prisma.message.deleteMany({ where: { conversationId: directConv.id } }),
        prisma.conversationMember.deleteMany({ where: { conversationId: directConv.id } }),
        prisma.conversation.delete({ where: { id: directConv.id } }),
      ]);
      emitToUser(targetUserId, 'conversation:deleted', { conversationId: directConv.id });
      emitToUser(currentUserId, 'conversation:deleted', { conversationId: directConv.id });
    }

    return res.json({ success: true, blockedUserId: targetUserId });
  } catch (err: any) {
    console.error('[BlockUser] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to block user' });
  }
});

// 3. Send a message — senderId always comes from the JWT
router.post('/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const senderId = req.userId!;
    const { conversationId, text, mediaUrl } = req.body;
    if (!conversationId || !text) return res.status(400).json({ error: 'Missing required fields' });
    if (!(await assertMember(conversationId, senderId))) return res.status(403).json({ error: 'Forbidden' });

    const targetConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { isGroup: true },
    });

    // Blocks only gate 1:1 chats — group messages flow to every member.
    if (!targetConversation?.isGroup) {
      const otherMembers = await prisma.conversationMember.findMany({
        where: { conversationId, userId: { not: senderId } },
        select: { userId: true },
      });
      for (const m of otherMembers) {
        const isBlocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: senderId, blockedId: m.userId },
              { blockerId: m.userId, blockedId: senderId },
            ],
          },
        });
        if (isBlocked) {
          return res.status(403).json({ error: 'Cannot send message to this user' });
        }
      }
    }

    const message = await prisma.message.create({
      data: { conversationId, senderId, text, mediaUrl },
      include: { sender: { select: { id: true, username: true, firstName: true } } },
    });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    const members = await prisma.conversationMember.findMany({ where: { conversationId } });
    members.filter((m) => m.userId !== senderId).forEach((m) => emitToUser(m.userId, 'message:new', message));

    return res.status(201).json(message);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 2.12 Suggest a reply with AI. Returns a suggestion only — nothing is sent.
router.post('/conversations/:id/suggest-reply', requireAuth, async (req: AuthRequest, res) => {
  try {
    const conversationId = req.params.id;
    if (typeof conversationId !== 'string') return res.status(400).json({ error: 'Invalid conversationId' });
    const userId = req.userId!;
    if (!(await assertMember(conversationId, userId))) return res.status(403).json({ error: 'Forbidden' });

    const apiKey = process.env.LIGHTNING_API_KEY;
    const apiUrl = process.env.LIGHTNING_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.LIGHTNING_MODEL || 'openai/gpt-4o-mini';
    if (!apiKey) return res.status(503).json({ error: 'AI suggestions are not configured yet' });

    const recent = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { sender: { select: { id: true, username: true, firstName: true } } },
    });
    if (recent.length === 0) return res.status(400).json({ error: 'No messages yet to base a suggestion on' });

    const transcript = [...recent]
      .reverse()
      .map((m) => `${m.senderId === userId ? 'Me' : (m.sender.firstName || m.sender.username)}: ${m.text}`)
      .join('\n');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 120,
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content:
              'You help the user ("Me") reply in a casual 1-on-1 chat. Read the transcript and write ONE short reply in the same tone, language and energy as the user\'s own messages — as if the user typed it. Rules: at most 2 short sentences, plain text only, no quotes, no sender prefix, no emoji unless the user already uses them.',
          },
          { role: 'user', content: transcript },
        ],
      }),
    });
    if (!response.ok) {
      console.error('[SuggestReply] AI service responded', response.status);
      return res.status(502).json({ error: 'AI service is unavailable right now' });
    }
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const suggestion = data?.choices?.[0]?.message?.content?.trim();
    if (!suggestion) return res.status(502).json({ error: 'AI returned an empty suggestion' });
    return res.json({ suggestion });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;