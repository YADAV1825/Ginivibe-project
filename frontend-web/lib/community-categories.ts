/**
 * Community category catalog: pick up to MAX_CATEGORIES across any domains.
 * Values are stored verbatim (each must stay within 2-40 chars for the API).
 */

export const MAX_CATEGORIES = 10;

export interface CategoryDomain {
  domain: string;
  items: string[];
}

export const COMMUNITY_DOMAINS: CategoryDomain[] = [
  {
    domain: 'Technology',
    items: [
      'AI & Machine Learning',
      'Web Development',
      'Mobile Apps',
      'Cybersecurity',
      'Data Science',
      'Blockchain & Web3',
      'Gadgets',
      'Open Source',
      'Cloud Computing',
      'Robotics',
    ],
  },
  {
    domain: 'Teach & Education',
    items: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'English',
      'Hindi',
      'Regional Languages',
      'Coding for Kids',
      'Exam Prep',
      'Study Abroad',
      'Online Courses',
      'Career Counselling',
    ],
  },
  {
    domain: 'Arts & Design',
    items: [
      'Painting',
      'Sketching',
      'Graphic Design',
      'UI/UX Design',
      'Illustration',
      'Calligraphy',
      'Interior Design',
      'Craft & DIY',
    ],
  },
  {
    domain: 'Music',
    items: [
      'Bollywood Music',
      'Classical Music',
      'Hip-Hop',
      'EDM',
      'Guitar',
      'Piano',
      'Singing',
      'Music Production',
      'Indie Music',
    ],
  },
  {
    domain: 'Sports & Fitness',
    items: [
      'Cricket',
      'Football',
      'Gym & Strength',
      'Yoga',
      'Running',
      'Badminton',
      'Basketball',
      'Swimming',
      'Martial Arts',
      'Trekking',
    ],
  },
  {
    domain: 'Food & Drink',
    items: [
      'Street Food',
      'Baking',
      'North Indian',
      'South Indian',
      'Chinese',
      'Italian',
      'Vegan Food',
      'Cafe Hopping',
      'Beverages',
    ],
  },
  {
    domain: 'Travel & Adventure',
    items: [
      'Solo Travel',
      'Road Trips',
      'Backpacking',
      'Beaches',
      'Mountains',
      'International Trips',
      'Budget Travel',
      'Photo Walks',
    ],
  },
  {
    domain: 'Business & Finance',
    items: [
      'Startups',
      'Investing',
      'Stock Market',
      'Personal Finance',
      'Marketing',
      'Freelancing',
      'Real Estate',
      'E-commerce',
    ],
  },
  {
    domain: 'Health & Wellness',
    items: [
      'Mental Health',
      'Nutrition',
      'Meditation',
      'Skincare',
      'Sleep',
      'Ayurveda',
    ],
  },
  {
    domain: 'Gaming',
    items: [
      'PC Gaming',
      'Mobile Gaming',
      'Console Gaming',
      'Esports',
      'Board Games',
      'Chess',
    ],
  },
  {
    domain: 'Movies & Books',
    items: [
      'Bollywood',
      'Hollywood',
      'Anime',
      'Fiction',
      'Non-Fiction',
      'Poetry',
      'Comics',
    ],
  },
  {
    domain: 'Fashion & Lifestyle',
    items: [
      'Streetwear',
      'Ethnic Wear',
      'Makeup',
      'Home Decor',
      'Minimalism',
      'Pets',
    ],
  },
  {
    domain: 'Science & Ideas',
    items: [
      'Space',
      'Environment',
      'Psychology',
      'History',
      'Philosophy',
    ],
  },
  {
    domain: 'Social Causes',
    items: [
      'Volunteering',
      'Women Safety',
      'Education for All',
      'Animal Welfare',
      'Cleanliness Drives',
    ],
  },
  {
    domain: 'Relationships & Social',
    items: [
      'Dating Advice',
      'New in City',
      'Roommates',
      'Friendship',
      'Parenting',
    ],
  },
  {
    domain: 'Career',
    items: [
      'Jobs',
      'Internships',
      'Resume Help',
      'Interviews',
      'Remote Work',
    ],
  },
];

export const TOTAL_CATEGORY_OPTIONS = COMMUNITY_DOMAINS.reduce(
  (n, d) => n + d.items.length,
  0,
);
