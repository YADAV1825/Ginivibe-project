import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedFeed() {
  console.log('🌟 Seeding vibrant demo data for Social Feed...');

  try {
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 1. Create or get Creators / Authors
    const usersData = [
      {
        username: 'ariacosmic',
        email: 'aria@ginivibe.com',
        firstName: 'Aria',
        lastName: 'Thorne',
        bio: 'Intuitive Astrologer & Tarot Guide ✨ Leo Sun, Pisces Moon. Aligning mind & celestial transits.',
        zodiacSign: 'Leo',
      },
      {
        username: 'marcus_deepsky',
        email: 'marcus@ginivibe.com',
        firstName: 'Marcus',
        lastName: 'Chen',
        bio: 'Astrophotographer & Deep Sky Explorer 🔭 Capturing stellar nurseries & dark nebulae across the globe.',
        zodiacSign: 'Sagittarius',
      },
      {
        username: 'elena_vibe',
        email: 'elena@ginivibe.com',
        firstName: 'Elena',
        lastName: 'Rostova',
        bio: 'Sound Healing Practitioner & 432Hz Soundscape Composer 🎵 Tuning frequency to consciousness.',
        zodiacSign: 'Aquarius',
      },
      {
        username: 'devon_ai',
        email: 'devon@ginivibe.com',
        firstName: 'Devon',
        lastName: 'Patel',
        bio: 'Creative Technologist & AI Architect 🚀 Engineering real-time multimodal social interactions.',
        zodiacSign: 'Gemini',
      },
    ];

    const users: Record<string, any> = {};

    for (const u of usersData) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: {
          firstName: u.firstName,
          lastName: u.lastName,
          bio: u.bio,
          zodiacSign: u.zodiacSign,
        },
        create: {
          ...u,
          password: hashedPassword,
        },
      });
      users[u.username] = user;
      console.log(`👤 User ready: @${user.username} (${user.firstName} ${user.lastName})`);
    }

    // 2. Create Communities
    const communitiesData = [
      {
        name: 'Cosmic Wanderers & Stargazers',
        description: 'A global sanctuary for astrophotographers, telescope enthusiasts, and dark-sky adventurers.',
        category: 'Astronomy & Space',
        cityScope: 'Global',
        ownerUsername: 'marcus_deepsky',
      },
      {
        name: 'Soundscapes & Healing Frequencies',
        description: 'Binaural beats, ambient sound baths, acoustic bowl therapy, and meditative deep-focus tracks.',
        category: 'Wellness & Sound',
        cityScope: 'Global',
        ownerUsername: 'elena_vibe',
      },
      {
        name: 'Zodiac Insights & Natal Wisdom',
        description: 'Daily horoscopes, planetary transit discussions, archetype analysis, and cosmic mindfulness.',
        category: 'Astrology & Spirituality',
        cityScope: 'Global',
        ownerUsername: 'ariacosmic',
      },
      {
        name: 'Next-Gen AI & Creative Tech',
        description: 'Exploring neural models, generative creative pipelines, ambient computing, and human-AI synergy.',
        category: 'Technology & AI',
        cityScope: 'Global',
        ownerUsername: 'devon_ai',
      },
    ];

    const communities: Record<string, any> = {};

    for (const c of communitiesData) {
      const owner = users[c.ownerUsername];
      const community = await prisma.community.upsert({
        where: { name: c.name },
        update: {
          description: c.description,
          category: c.category,
        },
        create: {
          name: c.name,
          description: c.description,
          category: c.category,
          cityScope: c.cityScope,
          ownerId: owner.id,
        },
      });
      communities[c.name] = community;
      console.log(`🪐 Community ready: ${community.name}`);

      // Add all users as members
      for (const u of Object.values(users)) {
        await prisma.communityMember.upsert({
          where: {
            userId_communityId: {
              userId: u.id,
              communityId: community.id,
            },
          },
          update: {},
          create: {
            userId: u.id,
            communityId: community.id,
          },
        });
      }
    }

    // 3. Create Posts
    const postsData = [
      {
        author: 'marcus_deepsky',
        community: 'Cosmic Wanderers & Stargazers',
        contentType: 'image',
        title: 'James Webb Deep Field Analysis: The Carina Nebula in Ultra-High Resolution',
        body: 'Captured this breathtaking slice of deep cosmic dust and young stellar nurseries. The infrared radiation reveals pockets of star formation never seen before. What constellation are you currently studying through your scope this week?',
        mediaUrls: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'],
        viewsCount: 1420,
        comments: [
          { author: 'ariacosmic', text: 'The resolution on the dust pillars is breathtaking! Resonates deeply with the transit today.' },
          { author: 'devon_ai', text: 'The wavelength processing on this data is unreal. Excellent work Marcus!' },
        ],
      },
      {
        author: 'elena_vibe',
        community: 'Soundscapes & Healing Frequencies',
        contentType: 'video',
        title: 'Aurora Borealis Sound Meditation — Real-Time Atmospheric Harmonics',
        body: 'Condensed 3 hours of magnetic solar storms over Tromsø into this flowing visual rhythm. Best experienced with headphones for the binaural alpha-wave synthesizer accompaniment. Take a deep breath and center your intentions for the evening.',
        mediaUrls: ['https://videos.pexels.com/video-files/3121459/3121459-uhd_2560_1440_24fps.mp4'],
        viewsCount: 3840,
        comments: [
          { author: 'marcus_deepsky', text: 'Watching the auroral ribbon pulse in sync with the 432Hz pad gave me absolute chills.' },
          { author: 'ariacosmic', text: 'Putting this on loop for my evening journal session right now 🌌' },
        ],
      },
      {
        author: 'ariacosmic',
        community: 'Zodiac Insights & Natal Wisdom',
        contentType: 'image',
        title: 'Celestial Equinox Alignment: Navigating the Sun-Jupiter Trine',
        body: "This week's planetary transit marks a rare trine between the Sun in Virgo and Jupiter in Taurus, grounding expansive creative visions into tangible reality. Check which house Jupiter currently occupies in your natal wheel to identify where abundance is opening up.",
        mediaUrls: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'],
        viewsCount: 980,
        comments: [
          { author: 'elena_vibe', text: 'Jupiter is transiting my 10th house of vocation—already feeling the creative momentum!' },
          { author: 'devon_ai', text: 'Great breakdown Aria. The geometric visualization makes the aspect angles super clear.' },
        ],
      },
      {
        author: 'devon_ai',
        community: 'Next-Gen AI & Creative Tech',
        contentType: 'video',
        title: 'GiniVibe Android & Mobile Experience: Fluid 120Hz Gestures & Realtime Audio Sync',
        body: 'Testing our native mobile client integration with WebRTC voice stages, tactile haptics, and instant cosmic profile matching. Zero dropped frames and sub-50ms audio latency on 5G networks.',
        mediaUrls: ['/android-video.mp4'],
        viewsCount: 2450,
        comments: [
          { author: 'marcus_deepsky', text: 'The transition animations are buttery smooth! Can we test this in the next beta build?' },
        ],
      },
      {
        author: 'marcus_deepsky',
        community: 'Cosmic Wanderers & Stargazers',
        contentType: 'image',
        title: 'Sierra High Desert Stargazing Camp: Bortle Class 1 Skies',
        body: 'Over 30 members of our Cosmic Wanderers community pitched tents at 8,000 feet elevation under completely pitch-black skies. The core of the Milky Way was so vibrant it cast faint shadows on the granite rocks. Thank you to everyone who joined our live voice session from camp!',
        mediaUrls: ['https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80'],
        viewsCount: 1890,
        comments: [
          { author: 'ariacosmic', text: 'Next time I am definitely packing my travel scope and joining the caravan!' },
        ],
      },
      {
        author: 'ariacosmic',
        community: 'Zodiac Insights & Natal Wisdom',
        contentType: 'text',
        title: 'Weekly Community Circle: How do planetary retrogrades influence your creative flow?',
        body: 'Many people view retrograde periods as disruptive, but in traditional astrological practice, retrogrades are natural inward cycles—perfect for revising scripts, fine-tuning musical compositions, and reorganizing your inner sanctuary. How do you channel this introspective energy during your creative work? Drop your thoughts below!',
        mediaUrls: [],
        viewsCount: 820,
        comments: [
          { author: 'elena_vibe', text: 'Retrogrades are always my remix and mastering phases. Never start from zero, polish what is already sacred.' },
          { author: 'devon_ai', text: 'Same in software engineering—code refactoring and debt cleanup during these windows.' },
        ],
      },
    ];

    for (const p of postsData) {
      const author = users[p.author];
      const community = communities[p.community];

      // Check if post with same title already exists
      let post = await prisma.post.findFirst({
        where: { title: p.title },
      });

      if (!post) {
        post = await prisma.post.create({
          data: {
            userId: author.id,
            communityId: community.id,
            title: p.title,
            body: p.body,
            mediaUrls: p.mediaUrls,
            contentType: p.contentType,
            viewsCount: p.viewsCount,
          },
        });
        console.log(`📝 Post created: "${p.title.slice(0, 35)}..." [${p.contentType}]`);
      } else {
        console.log(`📝 Post already exists: "${p.title.slice(0, 35)}..."`);
      }

      // Add comments
      for (const c of p.comments) {
        const commentUser = users[c.author];
        const existingComment = await prisma.comment.findFirst({
          where: {
            postId: post.id,
            userId: commentUser.id,
            body: c.text,
          },
        });

        if (!existingComment) {
          await prisma.comment.create({
            data: {
              postId: post.id,
              userId: commentUser.id,
              body: c.text,
            },
          });
        }
      }

      // Add likes from other users
      for (const u of Object.values(users)) {
        await prisma.like.upsert({
          where: {
            userId_postId: {
              postId: post.id,
              userId: u.id,
            },
          },
          update: {},
          create: {
            postId: post.id,
            userId: u.id,
          },
        });
      }
    }

    console.log('🎉 Social Feed successfully seeded with vibrant posts, communities, images, and videos!');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedFeed();
