import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'usr_1',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    bio: 'Software engineer and astrology enthusiast.',
    interests: ['Technology', 'Astrology', 'Reading']
  },
  {
    id: 'usr_2',
    name: 'Sam Chen',
    email: 'sam@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
    bio: 'Looking for a study partner and deep conversations.',
    interests: ['Study', 'Coffee', 'Music']
  },
  {
    id: 'usr_3',
    name: 'Jordan Smith',
    email: 'jordan@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    bio: 'Always down for a video call and matching!',
    interests: ['Matching', 'Video Games', 'Outdoors']
  }
];
