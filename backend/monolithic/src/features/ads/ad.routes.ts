import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient, PlacementType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'crypto';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ==========================================
// AD SERVING ENDPOINT
// POST /serve (or /ads/serve)
// ==========================================
router.post('/serve', async (req: Request, res: Response) => {
  try {
    const { placementType = 'FEED', userAge, userGender, userLocation } = req.body;
    const now = new Date();

    const validPlacement = Object.values(PlacementType).includes(placementType as PlacementType)
      ? (placementType as PlacementType)
      : PlacementType.FEED;

    // 1. Query active advertisements with active campaign and valid placement
    let candidateAds = await prisma.advertisement.findMany({
      where: {
        status: 'ACTIVE',
        AdPlacement: {
          some: {
            placementType: validPlacement,
          },
        },
        Campaign: {
          status: 'ACTIVE',
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
      },
      include: {
        Creative: true,
        Campaign: {
          include: {
            TargetingRule: true,
          },
        },
      },
    });

    // If no ads specifically matching this placement, fallback to any active ad
    if (candidateAds.length === 0) {
      candidateAds = await prisma.advertisement.findMany({
        where: {
          status: 'ACTIVE',
          Campaign: {
            status: 'ACTIVE',
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        },
        include: {
          Creative: true,
          Campaign: {
            include: {
              TargetingRule: true,
            },
          },
        },
      });
    }

    if (candidateAds.length === 0) {
      return res.status(204).send();
    }

    // 2. Filter candidates based on targeting rules
    const eligibleAds = candidateAds.filter((ad) => {
      const targeting = ad.Campaign?.TargetingRule;
      if (!targeting) return true;

      const age = typeof userAge === 'number' ? userAge : parseInt(userAge, 10);
      if (!isNaN(age)) {
        if (targeting.minAge && age < targeting.minAge) return false;
        if (targeting.maxAge && age > targeting.maxAge) return false;
      }

      if (targeting.locations && targeting.locations.length > 0 && userLocation) {
        if (!targeting.locations.includes(userLocation)) return false;
      }

      if (targeting.genders && targeting.genders.length > 0 && userGender) {
        if (!targeting.genders.includes(userGender)) return false;
      }

      return true;
    });

    // If strict targeting yields 0, fallback to candidateAds for high inventory delivery
    const poolAds = eligibleAds.length > 0 ? eligibleAds : candidateAds;
    const selectedAd = poolAds[Math.floor(Math.random() * poolAds.length)];

    return res.status(200).json({
      impressionId: `imp_${Date.now()}_${randomUUID().substring(0, 8)}`,
      adId: selectedAd.id,
      campaignId: selectedAd.campaignId,
      placementType: validPlacement,
      creative: {
        type: selectedAd.Creative.mediaType,
        mediaUrl: selectedAd.Creative.storageKey,
        headline: selectedAd.Creative.headline || 'Sponsored',
        description: selectedAd.Creative.description || '',
        cta: selectedAd.Creative.ctaText || 'Learn More',
        destinationUrl: selectedAd.Creative.destinationUrl || 'https://ginivibe.com',
      },
    });
  } catch (error: any) {
    console.error('[Ad Serving Error]', error);
    return res.status(500).json({ error: 'Internal ad serving failure' });
  }
});

// ==========================================
// TELEMETRY: IMPRESSION TRACKING
// POST /analytics/impression (or /impression)
// ==========================================
const handleImpression = async (req: Request, res: Response) => {
  try {
    const { advertisementId, placementType, userId } = req.body;

    if (!advertisementId) {
      return res.status(400).json({ error: 'advertisementId is required' });
    }

    const validPlacement = Object.values(PlacementType).includes(placementType as PlacementType)
      ? (placementType as PlacementType)
      : PlacementType.FEED;

    const record = await prisma.adImpression.create({
      data: {
        id: randomUUID(),
        advertisementId,
        userId: userId || null,
        placementType: validPlacement,
        impressionCost: 0.05,
      },
    });

    return res.status(201).json({ success: true, impressionId: record.id });
  } catch (error: any) {
    console.error('[Ad Impression Tracking Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to record impression' });
  }
};

router.post('/analytics/impression', handleImpression);
router.post('/impression', handleImpression);

// ==========================================
// TELEMETRY: CLICK TRACKING
// POST /analytics/click (or /click)
// ==========================================
const handleClick = async (req: Request, res: Response) => {
  try {
    const { advertisementId, placementType, userId } = req.body;

    if (!advertisementId) {
      return res.status(400).json({ error: 'advertisementId is required' });
    }

    const validPlacement = Object.values(PlacementType).includes(placementType as PlacementType)
      ? (placementType as PlacementType)
      : PlacementType.FEED;

    const record = await prisma.adClick.create({
      data: {
        id: randomUUID(),
        advertisementId,
        userId: userId || null,
        placementType: validPlacement,
        clickCost: 0.25,
      },
    });

    return res.status(201).json({ success: true, clickId: record.id });
  } catch (error: any) {
    console.error('[Ad Click Tracking Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to record click' });
  }
};

router.post('/analytics/click', handleClick);
router.post('/click', handleClick);

export default router;
