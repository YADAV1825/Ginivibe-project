import { Request, Response } from 'express';
import { MatchingApplicationService } from '../../application/matching.service';
import { prisma } from '../../infrastructure/postgres/client';

const matchingService = new MatchingApplicationService();

export class MatchingController {
  static async getNextMatch(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { category, intent } = req.query;

      const match = await matchingService.getNextMatch(userId, category as string, intent as string);
      
      if (!match) {
        return res.status(404).json({ message: 'No more eligible candidates available.' });
      }

      // Fetch rich profile data for the frontend
      const candidateProfile = await prisma.user.findUnique({
        where: { id: match.candidateId },
        include: { interests: { include: { subInterest: true } } }
      });

      return res.json({ 
        match,
        profile: {
          id: candidateProfile?.id,
          name: candidateProfile?.firstName || candidateProfile?.username || 'Unknown',
          handle: candidateProfile?.username ? `@${candidateProfile.username}` : undefined,
          gender: candidateProfile?.gender || undefined,
          zodiacSign: candidateProfile?.zodiacSign || undefined,
          age: candidateProfile?.dob ? new Date().getFullYear() - new Date(candidateProfile.dob).getFullYear() : 25,
          bio: candidateProfile?.bio || 'No bio provided.',
          avatarUrl: candidateProfile?.profilePic || 'https://i.pravatar.cc/150?u=' + match.candidateId,
          tags: candidateProfile?.interests.map(i => i.subInterest.name) || []
        }
      });
    } catch (error: any) {
      console.error('Error fetching match:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  static async getTestUser(req: Request, res: Response) {
    try {
      const user = await prisma.user.findFirst();
      res.json({ id: user?.id });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to get test user: ' + e.message });
    }
  }


}
