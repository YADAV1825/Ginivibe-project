import { Event } from '@/types';

export const mockEvents: Event[] = [
  {
    id: 'evt_1',
    title: 'Speed Matching Friday',
    description: 'Join our weekly speed matching event! Meet 10 new people in 30 minutes via quick video calls.',
    type: 'live',
    date: new Date(Date.now() + 3600000).toISOString(),
    attendeesCount: 124,
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'evt_2',
    title: 'Astrology Workshop: Venus Retrograde',
    description: 'Learn how the upcoming Venus retrograde affects your relationships and love life.',
    type: 'online',
    date: new Date(Date.now() + 86400000 * 2).toISOString(),
    attendeesCount: 340
  },
  {
    id: 'evt_3',
    title: 'GiniVibe NYC Meetup',
    description: 'Our first official offline meetup in Central Park! Come hang out and meet your matches in person.',
    type: 'offline',
    date: new Date(Date.now() + 86400000 * 7).toISOString(),
    location: 'Central Park, NY',
    attendeesCount: 89,
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'evt_4',
    title: 'Personality Typing 101',
    description: 'Discover your true personality type and how to use it for better matching.',
    type: 'future',
    date: new Date(Date.now() + 86400000 * 14).toISOString(),
    attendeesCount: 56
  }
];
