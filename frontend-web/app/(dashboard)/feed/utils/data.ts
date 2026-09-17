import { Post } from '@/types';

export const mockPosts: Post[] = [
  {
    id: 'post_1',
    authorId: 'usr_1',
    content: 'Just checked my daily astrology reading and it says today is a great day for networking! Anyone up for a chat?',
    likesCount: 12,
    commentsCount: 3,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'post_2',
    authorId: 'usr_2',
    content: 'Had an amazing video call session today. Met some incredible people.',
    likesCount: 45,
    commentsCount: 8,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'post_3',
    authorId: 'usr_3',
    content: 'What is everyone\'s favorite personality matching type? I find the MBTI integration really cool.',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800',
    likesCount: 102,
    commentsCount: 24,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];
