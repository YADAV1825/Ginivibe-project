import { prisma } from './infrastructure/postgres/client';

async function seed() {
  console.log('🌱 Seeding Enterprise Ad Engine Database...');

  // 1. Create dummy Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Test Advertiser Inc.',
    }
  });

  // 2. Add some funds
  await prisma.billingProfile.create({
    data: {
      organizationId: org.id,
      balance: 1000.00,
      currency: 'INR'
    }
  });

  // 3. Create a Campaign
  const campaign = await prisma.campaign.create({
    data: {
      organizationId: org.id,
      name: 'Launch Campaign 2026',
      budget: 500.00,
      startDate: new Date(),
      status: 'ACTIVE'
    }
  });

  // 4. Create Targeting Rules (Targeting 18-50 year olds)
  await prisma.targetingRule.create({
    data: {
      campaignId: campaign.id,
      minAge: 18,
      maxAge: 50
    }
  });

  // 5. Create a Creative (The visual payload)
  const creativeImage = await prisma.creative.create({
    data: {
      organizationId: org.id,
      name: 'Astrology Premium Image',
      mediaType: 'IMAGE',
      storageKey: 'http://localhost:3000/logo.jpeg',
      headline: 'Unlock Your Cosmic Potential',
      description: 'Get a personalized astrology reading from top astrologers today. 50% off for new users.',
      ctaText: 'Get My Reading',
      destinationUrl: 'https://example.com/astrology-promo'
    }
  });

  const creativeVideo = await prisma.creative.create({
    data: {
      organizationId: org.id,
      name: 'Astrology Premium Video',
      mediaType: 'VIDEO',
      storageKey: 'http://localhost:3000/android-video.mp4',
      headline: 'See What The Stars Hold',
      description: 'Watch your daily premium horoscope video today.',
      ctaText: 'Watch Now',
      destinationUrl: 'https://example.com/astrology-video'
    }
  });

  // 6. Link it all into an Advertisement for the FEED
  const adImage = await prisma.advertisement.create({
    data: {
      campaignId: campaign.id,
      creativeId: creativeImage.id,
      name: 'Feed Promo Ad',
      status: 'ACTIVE'
    }
  });

  // 7. Define Placement
  await prisma.adPlacement.create({
    data: {
      advertisementId: adImage.id,
      placementType: 'FEED'
    }
  });

  const adVideo = await prisma.advertisement.create({
    data: {
      campaignId: campaign.id,
      creativeId: creativeVideo.id,
      name: 'Feed Promo Ad Video',
      status: 'ACTIVE'
    }
  });

  await prisma.adPlacement.create({
    data: {
      advertisementId: adVideo.id,
      placementType: 'FEED'
    }
  });

  console.log('✅ Seed complete! You can now view the ads in the frontend-web Feed.');
  console.log(`Test Image Ad ID: ${adImage.id}`);
  console.log(`Test Video Ad ID: ${adVideo.id}`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
