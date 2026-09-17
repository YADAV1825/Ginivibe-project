import { MatchProfile } from '@/types';

export const mockMatches: MatchProfile[] = [
  {
    id: 'match_1',
    name: 'Emma Wilson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    age: 24,
    location: 'New York, NY',
    matchScore: 92,
    bio: 'Looking for deep conversations and coffee dates. INFJ.',
    tags: ['Coffee', 'Reading', 'Art']
  },
  {
    id: 'match_2',
    name: 'David Kim',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    age: 27,
    location: 'San Francisco, CA',
    matchScore: 88,
    bio: 'Tech enthusiast who loves hiking on weekends.',
    tags: ['Tech', 'Outdoors', 'Fitness']
  },
  {
    id: 'match_3',
    name: 'Sophia Patel',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
    age: 25,
    location: 'London, UK',
    matchScore: 85,
    bio: 'Creative soul, passionate about astrology and mindfulness.',
    tags: ['Astrology', 'Yoga', 'Design']
  }
];
