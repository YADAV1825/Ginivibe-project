import { ExclusionContext } from '../../../domain/exclusion/exclusion.types';
import { MatchingContext } from '../../../domain/matching/matching.types';
import { prisma } from '../client';

export class PostgresExclusionRepository {
  async getExclusionContext(userId: string): Promise<ExclusionContext> {
    const [blocks, blockedBy, follows, seen] = await Promise.all([
      prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
      prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
      prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
      prisma.seenCandidate.findMany({ where: { userId: userId }, select: { candidateId: true } })
    ]);

    return {
      userId,
      blockedUserIds: new Set(blocks.map(b => b.blockedId)),
      blockedByUserIds: new Set(blockedBy.map(b => b.blockerId)),
      followingIds: new Set(follows.map(f => f.followingId)),
      seenCandidateIds: new Set(seen.map(s => s.candidateId))
    };
  }

  async getMatchingContext(userId: string): Promise<MatchingContext> {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true, interests: { include: { subInterest: true } } }
    });

    // Graceful fallback for mock-123 or non-existent user IDs during dev
    if (!user) {
      user = await prisma.user.findFirst({
        include: { preferences: true, interests: { include: { subInterest: true } } }
      });
    }

    if (!user) {
      return {
        userId,
        preferences: {
          preferredGender: undefined,
          minAge: 18,
          maxAge: 99,
        },
        userInterests: [],
        events: []
      };
    }

    return {
      userId,
      preferences: {
        preferredGender: user.preferences?.preferredGender,
        minAge: user.preferences?.minAge ?? 18,
        maxAge: user.preferences?.maxAge ?? 99,
      },
      userInterests: user.interests ? user.interests.map(i => i.subInterest.name) : [],
      events: []
    };
  }

  async markAsSeen(userId: string, candidateId: string): Promise<void> {
    // We use an idempotent upsert or safe create
    try {
      await prisma.seenCandidate.create({
        data: { userId, candidateId }
      });
    } catch (e: any) {
      // Ignore unique constraint violation (P2002) or foreign key failure for mock IDs (P2003)
      if (e.code !== 'P2002' && e.code !== 'P2003') throw e;
    }
  }

  async clearSeen(userId: string): Promise<void> {
    // Recycle the match queue ONLY. Follows and blocks are real user data
    // and must never be deleted by the matching loop.
    await prisma.seenCandidate.deleteMany({
      where: { userId }
    });
  }
}
